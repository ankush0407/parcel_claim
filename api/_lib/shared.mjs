import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// api/_lib/ → go up two levels to reach project root, then data/excel_seed
const CSV_DIR = path.resolve(__dirname, '../../data/excel_seed');

export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo123';

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') { cur += '"'; i++; } else { inQuotes = !inQuotes; }
      continue;
    }
    if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCsv(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (cols[i] ?? '').trim(); });
    return row;
  });
}

export async function readCsv(name) {
  const text = await readFile(path.join(CSV_DIR, name), 'utf8');
  return parseCsv(text);
}

export function normalize(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

export function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function asOptionalNumber(v) {
  const s = normalize(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function asBool(v) {
  return normalize(v).toLowerCase() === 'true';
}

// ─── Data builders ────────────────────────────────────────────────────────────

function monthLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
}

function timelineTypeForStatus(status) {
  const map = {
    submitted: 'submitted', documentation_requested: 'document_request',
    carrier_review: 'carrier_response', approved: 'approved', rejected: 'rejected',
    escalated: 'escalated', closed: 'closed',
  };
  return map[status] || 'update';
}

function titleForStatus(status) {
  const map = {
    draft: 'Draft Saved', submitted: 'Claim Submitted', under_review: 'Under Review',
    documentation_requested: 'Documentation Requested', carrier_review: 'Forwarded to Carrier',
    approved: 'Claim Approved', partially_approved: 'Partially Approved',
    rejected: 'Claim Rejected', escalated: 'Claim Escalated', closed: 'Claim Closed',
  };
  return map[status] || 'Status Updated';
}

function computeDaysOpen(filedDate, resolutionDate) {
  const ms = Math.max(0, (resolutionDate ? new Date(resolutionDate) : new Date()).getTime() - new Date(filedDate).getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function getLatestTrackingSnapshot(trackingEvents, trackingNumber) {
  const tn = normalize(trackingNumber).toUpperCase();
  const events = trackingEvents.filter((e) => {
    const primary = normalize(e.tracking_number).toUpperCase();
    const maersk = normalize(e.MaerskTrackingNumber).toUpperCase();
    const alt = normalize(e.TrackingNumber).toUpperCase();
    return primary === tn || maersk === tn || alt === tn;
  }).sort((a, b) =>
    new Date(normalize(b.last_tracking_event_date) || normalize(b.created_at)).getTime() -
    new Date(normalize(a.last_tracking_event_date) || normalize(a.created_at)).getTime()
  );
  return events[0];
}

export async function buildDataset() {
  const [merchants, users, userMerchantAccess, carriers, shipments, claims,
         claimEvidence, claimHistory, claimNotes, trackingEvents] = await Promise.all([
    readCsv('merchants.csv'), readCsv('users.csv'), readCsv('user_merchant_access.csv'),
    readCsv('carriers.csv'), readCsv('shipments.csv'), readCsv('claims.csv'),
    readCsv('claim_evidence.csv'), readCsv('claim_status_history.csv'),
    readCsv('claim_notes.csv'), readCsv('tracking_events.csv'),
  ]);

  const merchantById = new Map(merchants.map((m) => [m.merchant_id, m]));
  const userById = new Map(users.map((u) => [u.user_id, u]));
  const carrierById = new Map(carriers.map((c) => [c.carrier_id, c]));
  const shipmentById = new Map(shipments.map((s) => [s.shipment_id, s]));

  const accessByUser = new Map();
  userMerchantAccess.forEach((row) => {
    const list = accessByUser.get(row.user_id) || [];
    list.push(row.merchant_id);
    accessByUser.set(row.user_id, list);
  });

  const appUsers = users.map((u) => ({
    id: u.user_id, email: u.email, fullName: u.full_name,
    role: u.role, isActive: asBool(u.is_active),
    merchantIds: accessByUser.get(u.user_id) || [],
  }));

  const evidenceByClaim = new Map();
  claimEvidence.forEach((e) => {
    const list = evidenceByClaim.get(e.claim_id) || [];
    list.push({ id: e.evidence_id, name: e.file_name, type: e.evidence_type,
      size: asNumber(e.file_size_bytes), url: e.file_url || '#', uploadedAt: e.uploaded_at });
    evidenceByClaim.set(e.claim_id, list);
  });

  const historyByClaim = new Map();
  claimHistory.forEach((h) => {
    const list = historyByClaim.get(h.claim_id) || [];
    list.push({ id: h.history_id, date: h.changed_at, title: titleForStatus(h.new_status),
      description: h.change_note || `Status changed to ${h.new_status}`,
      type: timelineTypeForStatus(h.new_status),
      user: userById.get(h.changed_by_user_id)?.full_name });
    historyByClaim.set(h.claim_id, list);
  });

  const notesByClaim = new Map();
  claimNotes.forEach((n) => {
    const list = notesByClaim.get(n.claim_id) || [];
    list.push({ id: n.note_id, content: n.note_text, createdAt: n.created_at,
      createdBy: userById.get(n.created_by_user_id)?.full_name || 'System',
      isInternal: asBool(n.is_internal) });
    notesByClaim.set(n.claim_id, list);
  });

  const appClaims = claims.map((c) => {
    const shipment = shipmentById.get(c.shipment_id) || {};
    const carrier = carrierById.get(shipment.carrier_id) || {};
    const merchant = merchantById.get(c.merchant_id) || {};
    const filedBy = userById.get(c.filed_by_user_id) || {};
    const assignedTo = userById.get(c.assigned_to_user_id) || {};
    const trackingNum = normalize(c.tracking_number) || normalize(shipment.tracking_number);
    const trackingSnap = trackingNum ? getLatestTrackingSnapshot(trackingEvents, trackingNum) : null;

    return {
      id: c.claim_id, claimNumber: c.claim_number,
      trackingNumber: normalize(c.tracking_number) || normalize(shipment.tracking_number),
      carrier: normalize(shipment.carrier_name) || carrier.carrier_name || 'Unknown Carrier',
      type: c.claim_type, status: c.claim_status,
      claimedAmount: asNumber(c.claimed_amount),
      approvedAmount: asOptionalNumber(c.approved_amount),
      currency: c.currency_code || 'USD',
      filedDate: c.filed_date, incidentDate: c.incident_date,
      resolutionDate: normalize(c.resolution_date) || undefined,
      description: c.description,
      contact: {
        name: filedBy.full_name || 'Unknown User', email: filedBy.email || '',
        company: merchant.display_name || merchant.legal_name || '',
        phone: merchant.contact_phone || '', role: filedBy.role || undefined,
      },
      shipment: {
        trackingNumber: normalize(c.tracking_number) || normalize(shipment.tracking_number) || '',
        carrierName: normalize(shipment.carrier_name) || carrier.carrier_name || '',
        clientName: normalize(shipment.client_name) || '',
        clientOrderNumber: normalize(shipment.client_order_number) || '',
        originLocation: normalize(shipment.origin_location) || '',
        destinationLocation: normalize(shipment.destination_location) || '',
        originZip: normalize(shipment.origin_zip) || '',
        destinationZip: normalize(shipment.destination_zip) || '',
        itemValue: asOptionalNumber(shipment.item_value),
        itemWeight: normalize(shipment.item_weight) ? `${shipment.item_weight} ${shipment.weight_unit || 'kg'}` : '',
        shippingCharge: asOptionalNumber(shipment.shipping_charge),
        currency: normalize(shipment.currency_code) || normalize(c.currency_code) || 'USD',
        customerAddress: normalize(shipment.customer_address) || '',
        customerEmail: normalize(shipment.customer_email) || '',
        customerPhone: normalize(shipment.customer_phone) || '',
        labelPrintDate: trackingSnap ? normalize(trackingSnap.label_print_date) || '' : '',
        lastTrackingEvent: trackingSnap ? normalize(trackingSnap.last_tracking_event) || '' : '',
        lastTrackingEventDate: trackingSnap ? normalize(trackingSnap.last_tracking_event_date) || '' : '',
      },
      evidence: evidenceByClaim.get(c.claim_id) || [],
      timeline: (historyByClaim.get(c.claim_id) || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      notes: (notesByClaim.get(c.claim_id) || []).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      assignedTo: assignedTo.full_name || undefined,
      priority: c.priority,
      daysOpen: computeDaysOpen(c.filed_date, c.resolution_date),
      slaDeadline: c.sla_deadline || c.filed_date,
      merchantId: c.merchant_id,
      autoProcessRecommended: asBool(c.auto_process_recommended),
      autoProcessReason: normalize(c.auto_process_reason) || undefined,
    };
  });

  return { users: appUsers, merchants, claims: appClaims, shipments, trackingEvents };
}

export function computeAggregates(claims) {
  const totalClaims = claims.length;
  const activeClaims = claims.filter((c) => !['approved', 'rejected', 'closed'].includes(c.status)).length;
  const approvedClaims = claims.filter((c) => c.status === 'approved' || c.status === 'partially_approved').length;
  const rejectedClaims = claims.filter((c) => c.status === 'rejected').length;
  const totalClaimedAmount = claims.reduce((s, c) => s + c.claimedAmount, 0);
  const totalRecoveredAmount = claims.reduce((s, c) => s + (c.approvedAmount || 0), 0);
  const closedClaims = claims.filter((c) => c.resolutionDate);
  const avgResolutionDays = closedClaims.length > 0
    ? Number((closedClaims.reduce((s, c) => s + c.daysOpen, 0) / closedClaims.length).toFixed(1)) : 0;
  const successRate = totalClaims > 0 ? Number(((approvedClaims / totalClaims) * 100).toFixed(1)) : 0;
  const dashboardMetrics = {
    totalClaims, activeClaims, approvedClaims, rejectedClaims,
    totalClaimedAmount, totalRecoveredAmount, avgResolutionDays, successRate,
    changeVsLastMonth: { totalClaims: 0, recovered: 0, successRate: 0, avgResolution: 0 },
  };
  const monthBuckets = new Map();
  const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  claims.forEach((c) => {
    const key = monthLabel(c.filedDate);
    if (!monthBuckets.has(key)) monthBuckets.set(key, { month: key, filed: 0, approved: 0, recovered: 0 });
    const row = monthBuckets.get(key);
    row.filed += 1;
    if (c.status === 'approved' || c.status === 'partially_approved') row.approved += 1;
    row.recovered += c.approvedAmount || 0;
  });
  const chartData = [...monthBuckets.values()].sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
  return { dashboardMetrics, chartData };
}

export function getAuthorizedClaims(dataset, userId, merchantCompany) {
  const user = dataset.users.find((u) => u.id === userId && u.isActive);
  if (!user) return { error: 'Unauthorized user.' };
  let scopedClaims = dataset.claims;
  if (user.role === 'merchant') scopedClaims = scopedClaims.filter((c) => user.merchantIds.includes(c.merchantId));
  const merchantFilter = normalize(merchantCompany).toLowerCase();
  if (merchantFilter && (user.role === 'cx_team' || user.role === 'admin')) {
    scopedClaims = scopedClaims.filter((c) => c.contact.company.toLowerCase() === merchantFilter);
  }
  return { user, claims: scopedClaims };
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
