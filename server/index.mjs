import { createServer } from 'node:http';
import { readFile, appendFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CSV_DIR = path.join(ROOT, 'data', 'excel_seed');

const PORT = Number(process.env.PORT || 8787);
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo123';

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function normalize(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function asOptionalNumber(v) {
  const s = normalize(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function asBool(v) {
  return normalize(v).toLowerCase() === 'true';
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }

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
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? '').trim();
    });
    return row;
  });
}

async function readCsv(name) {
  const filePath = path.join(CSV_DIR, name);
  const text = await readFile(filePath, 'utf8');
  return parseCsv(text);
}

function csvEscape(value) {
  const s = normalize(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function writeCsv(name, rows) {
  const filePath = path.join(CSV_DIR, name);
  if (!rows.length) {
    await writeFile(filePath, '', 'utf8');
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(',')),
  ];
  await writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function monthLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short' });
}

function timelineTypeForStatus(status) {
  switch (status) {
    case 'submitted': return 'submitted';
    case 'documentation_requested': return 'document_request';
    case 'carrier_review': return 'carrier_response';
    case 'approved': return 'approved';
    case 'rejected': return 'rejected';
    case 'escalated': return 'escalated';
    case 'closed': return 'closed';
    default: return 'update';
  }
}

function titleForStatus(status) {
  const mapping = {
    draft: 'Draft Saved',
    submitted: 'Claim Submitted',
    under_review: 'Under Review',
    documentation_requested: 'Documentation Requested',
    carrier_review: 'Forwarded to Carrier',
    approved: 'Claim Approved',
    partially_approved: 'Partially Approved',
    rejected: 'Claim Rejected',
    escalated: 'Claim Escalated',
    closed: 'Claim Closed',
  };
  return mapping[status] || 'Status Updated';
}

function computeDaysOpen(filedDate, resolutionDate) {
  const start = new Date(filedDate);
  const end = resolutionDate ? new Date(resolutionDate) : new Date();
  const ms = Math.max(0, end.getTime() - start.getTime());
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

function deriveHasAscan(row) {
  return normalize(row.carrier_accepted_date) !== '';
}

function deriveHasDscan(row) {
  return normalize(row.carrier_delivery_date) !== '';
}

async function buildDataset() {
  const [
    merchants,
    users,
    userMerchantAccess,
    carriers,
    shipments,
    claims,
    claimEvidence,
    claimHistory,
    claimNotes,
    trackingEvents,
  ] = await Promise.all([
    readCsv('merchants.csv'),
    readCsv('users.csv'),
    readCsv('user_merchant_access.csv'),
    readCsv('carriers.csv'),
    readCsv('shipments.csv'),
    readCsv('claims.csv'),
    readCsv('claim_evidence.csv'),
    readCsv('claim_status_history.csv'),
    readCsv('claim_notes.csv'),
    readCsv('tracking_events.csv'),
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
    id: u.user_id,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
    isActive: asBool(u.is_active),
    merchantIds: accessByUser.get(u.user_id) || [],
  }));

  const evidenceByClaim = new Map();
  claimEvidence.forEach((e) => {
    const list = evidenceByClaim.get(e.claim_id) || [];
    list.push({
      id: e.evidence_id,
      name: e.file_name,
      type: e.evidence_type,
      size: asNumber(e.file_size_bytes),
      url: e.file_url || '#',
      uploadedAt: e.uploaded_at,
    });
    evidenceByClaim.set(e.claim_id, list);
  });

  const historyByClaim = new Map();
  claimHistory.forEach((h) => {
    const list = historyByClaim.get(h.claim_id) || [];
    list.push({
      id: h.history_id,
      date: h.changed_at,
      title: titleForStatus(h.new_status),
      description: h.change_note || `Status changed to ${h.new_status}`,
      type: timelineTypeForStatus(h.new_status),
      user: userById.get(h.changed_by_user_id)?.full_name,
    });
    historyByClaim.set(h.claim_id, list);
  });

  const notesByClaim = new Map();
  claimNotes.forEach((n) => {
    const list = notesByClaim.get(n.claim_id) || [];
    list.push({
      id: n.note_id,
      content: n.note_text,
      createdAt: n.created_at,
      createdBy: userById.get(n.created_by_user_id)?.full_name || 'System',
      isInternal: asBool(n.is_internal),
    });
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
      id: c.claim_id,
      claimNumber: c.claim_number,
      trackingNumber: normalize(c.tracking_number) || normalize(shipment.tracking_number),
      carrier: normalize(shipment.carrier_name) || carrier.carrier_name || 'Unknown Carrier',
      type: c.claim_type,
      status: c.claim_status,
      claimedAmount: asNumber(c.claimed_amount),
      approvedAmount: asOptionalNumber(c.approved_amount),
      currency: c.currency_code || 'USD',
      filedDate: c.filed_date,
      incidentDate: c.incident_date,
      resolutionDate: normalize(c.resolution_date) || undefined,
      description: c.description,
      contact: {
        name: filedBy.full_name || 'Unknown User',
        email: filedBy.email || '',
        company: merchant.display_name || merchant.legal_name || '',
        phone: merchant.contact_phone || '',
        role: filedBy.role || undefined,
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

  const totalClaims = appClaims.length;
  const activeClaims = appClaims.filter((c) => !['approved', 'rejected', 'closed'].includes(c.status)).length;
  const approvedClaims = appClaims.filter((c) => c.status === 'approved' || c.status === 'partially_approved').length;
  const rejectedClaims = appClaims.filter((c) => c.status === 'rejected').length;
  const totalClaimedAmount = appClaims.reduce((s, c) => s + c.claimedAmount, 0);
  const totalRecoveredAmount = appClaims.reduce((s, c) => s + (c.approvedAmount || 0), 0);
  const closedClaims = appClaims.filter((c) => c.resolutionDate);
  const avgResolutionDays = closedClaims.length > 0
    ? Number((closedClaims.reduce((s, c) => s + c.daysOpen, 0) / closedClaims.length).toFixed(1))
    : 0;
  const successRate = totalClaims > 0 ? Number(((approvedClaims / totalClaims) * 100).toFixed(1)) : 0;

  const dashboardMetrics = {
    totalClaims,
    activeClaims,
    approvedClaims,
    rejectedClaims,
    totalClaimedAmount,
    totalRecoveredAmount,
    avgResolutionDays,
    successRate,
    changeVsLastMonth: {
      totalClaims: 0,
      recovered: 0,
      successRate: 0,
      avgResolution: 0,
    },
  };

  const monthBuckets = new Map();
  appClaims.forEach((c) => {
    const key = monthLabel(c.filedDate);
    if (!monthBuckets.has(key)) {
      monthBuckets.set(key, { month: key, filed: 0, approved: 0, recovered: 0 });
    }
    const row = monthBuckets.get(key);
    row.filed += 1;
    if (c.status === 'approved' || c.status === 'partially_approved') row.approved += 1;
    row.recovered += c.approvedAmount || 0;
  });

  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = [...monthBuckets.values()].sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

  return {
    users: appUsers,
    merchants,
    claims: appClaims,
    shipments,
    trackingEvents,
    dashboardMetrics,
    chartData,
  };
}

function computeAggregates(claims) {
  const totalClaims = claims.length;
  const activeClaims = claims.filter((c) => !['approved', 'rejected', 'closed'].includes(c.status)).length;
  const approvedClaims = claims.filter((c) => c.status === 'approved' || c.status === 'partially_approved').length;
  const rejectedClaims = claims.filter((c) => c.status === 'rejected').length;
  const totalClaimedAmount = claims.reduce((s, c) => s + c.claimedAmount, 0);
  const totalRecoveredAmount = claims.reduce((s, c) => s + (c.approvedAmount || 0), 0);
  const closedClaims = claims.filter((c) => c.resolutionDate);
  const avgResolutionDays = closedClaims.length > 0
    ? Number((closedClaims.reduce((s, c) => s + c.daysOpen, 0) / closedClaims.length).toFixed(1))
    : 0;
  const successRate = totalClaims > 0 ? Number(((approvedClaims / totalClaims) * 100).toFixed(1)) : 0;

  const dashboardMetrics = {
    totalClaims,
    activeClaims,
    approvedClaims,
    rejectedClaims,
    totalClaimedAmount,
    totalRecoveredAmount,
    avgResolutionDays,
    successRate,
    changeVsLastMonth: {
      totalClaims: 0,
      recovered: 0,
      successRate: 0,
      avgResolution: 0,
    },
  };

  const monthBuckets = new Map();
  claims.forEach((c) => {
    const key = monthLabel(c.filedDate);
    if (!monthBuckets.has(key)) {
      monthBuckets.set(key, { month: key, filed: 0, approved: 0, recovered: 0 });
    }
    const row = monthBuckets.get(key);
    row.filed += 1;
    if (c.status === 'approved' || c.status === 'partially_approved') row.approved += 1;
    row.recovered += c.approvedAmount || 0;
  });

  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = [...monthBuckets.values()].sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

  return {
    dashboardMetrics,
    chartData,
  };
}

function getAuthorizedClaims(dataset, userId, merchantCompany) {
  const user = dataset.users.find((u) => u.id === userId && u.isActive);
  if (!user) {
    return { error: 'Unauthorized user.' };
  }

  let scopedClaims = dataset.claims;
  if (user.role === 'merchant') {
    scopedClaims = scopedClaims.filter((c) => user.merchantIds.includes(c.merchantId));
  }

  const merchantFilter = normalize(merchantCompany).toLowerCase();
  if (merchantFilter && (user.role === 'cx_team' || user.role === 'admin')) {
    scopedClaims = scopedClaims.filter((c) => c.contact.company.toLowerCase() === merchantFilter);
  }

  return { user, claims: scopedClaims };
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'Invalid URL' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    const dataset = await buildDataset();

    if (req.method === 'GET' && pathname === '/api/health') {
      sendJson(res, 200, { ok: true, service: 'csv-api', port: PORT });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/users') {
      sendJson(res, 200, { users: dataset.users, demoPassword: DEMO_PASSWORD });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await readBody(req);
      const email = normalize(body.email).toLowerCase();
      const password = normalize(body.password);
      const user = dataset.users.find((u) => u.email.toLowerCase() === email && u.isActive);

      if (!user) {
        sendJson(res, 404, { ok: false, message: 'Account not found.' });
        return;
      }
      if (password !== DEMO_PASSWORD) {
        sendJson(res, 401, { ok: false, message: 'Invalid password.' });
        return;
      }

      sendJson(res, 200, { ok: true, user });
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/merchants/')) {
      const merchantId = pathname.split('/').pop();
      const merchant = dataset.merchants.find((m) => m.merchant_id === merchantId);
      if (!merchant) {
        sendJson(res, 404, { message: 'Merchant not found.' });
        return;
      }
      sendJson(res, 200, {
        merchant: {
          id: merchant.merchant_id,
          code: merchant.merchant_code,
          legalName: merchant.legal_name,
          displayName: merchant.display_name,
          contactEmail: merchant.contact_email,
          contactPhone: merchant.contact_phone,
          billingCurrency: merchant.billing_currency,
          isActive: asBool(merchant.is_active),
        },
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/claims') {
      const body = await readBody(req);
      const userId = normalize(body.userId);
      if (!userId) {
        sendJson(res, 400, { message: 'userId is required.' });
        return;
      }

      const user = dataset.users.find((u) => u.id === userId);
      if (!user) {
        sendJson(res, 403, { message: 'Unauthorized user.' });
        return;
      }

      const merchantId = (user.merchantIds && user.merchantIds[0]) || '';

      // Look up shipment by tracking number
      const trackingNumber = normalize(body.trackingNumber);
      const matchedShipment = trackingNumber
        ? dataset.shipments.find((s) => normalize(s.tracking_number).toUpperCase() === trackingNumber.toUpperCase())
        : null;
      const shipmentId = matchedShipment ? matchedShipment.shipment_id : '';

      // Merchant submissions enter CX analyst queue first.
      const autoProcessRecommended = false;
      const autoProcessReason = 'Queued for CX analyst processing';

      // Generate IDs
      const claimId = randomUUID();
      const existingClaims = dataset.claims || [];
      const nextNum = existingClaims.length + 1;
      const claimNumber = `CLM-2026-${String(nextNum).padStart(4, '0')}`;
      const now = new Date().toISOString();
      const filedDate = now.split('T')[0];
      const slaDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const claimType = normalize(body.claimType) || 'lost';
      const description = normalize(body.description);
      const claimedAmount = normalize(body.claimedAmount);
      const currency = normalize(body.currency) || 'USD';
      const priority = normalize(body.priority) || 'medium';

      // Append row to claims.csv
      const claimRow = [
        claimId, claimNumber, merchantId, shipmentId, userId, '',
        claimType, 'submitted', priority, filedDate, filedDate,
        `"${description.replace(/"/g, '""')}"`,
        claimedAmount, '', currency, slaDeadline, '',
        String(autoProcessRecommended), `"${autoProcessReason}"`, trackingNumber.toUpperCase(), now, now,
      ].join(',');
      await appendFile(path.join(CSV_DIR, 'claims.csv'), '\n' + claimRow, 'utf8');

      // Append row to claim_status_history.csv
      const historyId = randomUUID();
      const historyRow = [
        historyId, claimId, '', 'submitted', userId, now, 'Initial submission by merchant',
      ].join(',');
      await appendFile(path.join(CSV_DIR, 'claim_status_history.csv'), '\n' + historyRow, 'utf8');

      sendJson(res, 201, {
        ok: true,
        claimId,
        claimNumber,
        autoProcessRecommended,
        autoProcessReason,
        shipmentFound: !!matchedShipment,
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/claims/process') {
      const body = await readBody(req);
      const userId = normalize(body.userId);
      if (!userId) {
        sendJson(res, 400, { message: 'userId is required.' });
        return;
      }

      const user = dataset.users.find((u) => u.id === userId);
      if (!user || (user.role !== 'cx_team' && user.role !== 'admin')) {
        sendJson(res, 403, { message: 'Only CX team/admin can process claims.' });
        return;
      }

      const claimsRows = await readCsv('claims.csv');
      const shipmentsRows = await readCsv('shipments.csv');
      const trackingRows = await readCsv('tracking_events.csv');
      const shipmentById = new Map(shipmentsRows.map((s) => [s.shipment_id, s]));

      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];
      const historyRows = [];
      const outcome = { approved: 0, rejected: 0, exception: 0, processed: 0 };

      for (const claim of claimsRows) {
        if (normalize(claim.claim_status) !== 'submitted') continue;

        const shipment = shipmentById.get(claim.shipment_id);
        const trackingNumber = normalize(claim.tracking_number) || normalize(shipment?.tracking_number);
        const latest = trackingNumber ? getLatestTrackingSnapshot(trackingRows, trackingNumber) : null;

        let nextStatus = 'under_review';
        let reason = 'No linked shipment or tracking history. Routed to CX exception queue for manual review.';
        let recommended = 'false';

        if (latest) {
          const hasDscan = deriveHasDscan(latest);
          const timeSinceLastScan = asNumber(latest.time_since_last_scan_days);

          if (hasDscan) {
            nextStatus = 'rejected';
            reason = 'Auto-rejected: Has D-scan = true.';
            recommended = 'true';
            claim.resolution_date = today;
            outcome.rejected += 1;
          } else if (timeSinceLastScan > 10) {
            nextStatus = 'approved';
            reason = 'Auto-approved: D-scan = false and time since last scan is greater than 10 days.';
            recommended = 'true';
            claim.approved_amount = normalize(claim.claimed_amount);
            claim.resolution_date = today;
            outcome.approved += 1;
          } else {
            nextStatus = 'under_review';
            reason = 'Routed to CX exception queue: D-scan = false and time since last scan is 10 days or less.';
            recommended = 'false';
            outcome.exception += 1;
          }
        } else {
          outcome.exception += 1;
        }

        claim.claim_status = nextStatus;
        claim.auto_process_recommended = recommended;
        claim.auto_process_reason = reason;
        claim.updated_at = nowIso;

        historyRows.push({
          history_id: randomUUID(),
          claim_id: claim.claim_id,
          previous_status: 'submitted',
          new_status: nextStatus,
          changed_by_user_id: userId,
          changed_at: nowIso,
          change_note: reason,
        });
        outcome.processed += 1;
      }

      if (outcome.processed > 0) {
        await writeCsv('claims.csv', claimsRows);
        const historyFilePath = path.join(CSV_DIR, 'claim_status_history.csv');
        const historyLines = historyRows.map((r) => [
          r.history_id,
          r.claim_id,
          r.previous_status,
          r.new_status,
          r.changed_by_user_id,
          r.changed_at,
          csvEscape(r.change_note),
        ].join(','));
        await appendFile(historyFilePath, `\n${historyLines.join('\n')}`, 'utf8');
      }

      sendJson(res, 200, {
        ok: true,
        message: 'Claims queue processed.',
        ...outcome,
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/claims') {
      const userId = normalize(url.searchParams.get('userId'));
      const merchantCompany = normalize(url.searchParams.get('merchantCompany'));

      if (!userId) {
        sendJson(res, 400, { message: 'userId query parameter is required.' });
        return;
      }

      const scoped = getAuthorizedClaims(dataset, userId, merchantCompany);
      if (scoped.error) {
        sendJson(res, 403, { message: scoped.error });
        return;
      }

      const merchantCompanies = [...new Set(scoped.claims.map((c) => c.contact.company))].sort((a, b) => a.localeCompare(b));
      sendJson(res, 200, { claims: scoped.claims, merchantCompanies });
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/claims/')) {
      const userId = normalize(url.searchParams.get('userId'));
      const claimId = pathname.split('/').pop();

      if (!userId) {
        sendJson(res, 400, { message: 'userId query parameter is required.' });
        return;
      }

      const scoped = getAuthorizedClaims(dataset, userId, '');
      if (scoped.error) {
        sendJson(res, 403, { message: scoped.error });
        return;
      }

      let claim = scoped.claims.find((c) => c.id === claimId);
      if (!claim) {
        sendJson(res, 404, { message: 'Claim not found or not accessible.' });
        return;
      }

      // Auto-assign to first available CX agent if not yet assigned
      if (!claim.assignedTo) {
        const cxUser = dataset.users.find((u) => u.role === 'cx_team' && u.isActive);
        if (cxUser) {
          const claimsRows = await readCsv('claims.csv');
          const claimRow = claimsRows.find((r) => r.claim_id === claimId);
          if (claimRow && !normalize(claimRow.assigned_to_user_id)) {
            claimRow.assigned_to_user_id = cxUser.id;
            claimRow.updated_at = new Date().toISOString();
            await writeCsv('claims.csv', claimsRows);
          }
          claim = { ...claim, assignedTo: cxUser.fullName };
        }
      }

      sendJson(res, 200, { claim });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/dashboard') {
      const userId = normalize(url.searchParams.get('userId'));
      const merchantCompany = normalize(url.searchParams.get('merchantCompany'));

      if (!userId) {
        sendJson(res, 400, { message: 'userId query parameter is required.' });
        return;
      }

      const scoped = getAuthorizedClaims(dataset, userId, merchantCompany);
      if (scoped.error) {
        sendJson(res, 403, { message: scoped.error });
        return;
      }

      const aggregate = computeAggregates(scoped.claims);
      sendJson(res, 200, {
        claims: scoped.claims,
        dashboardMetrics: aggregate.dashboardMetrics,
        chartData: aggregate.chartData,
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/analytics') {
      const userId = normalize(url.searchParams.get('userId'));
      const merchantCompany = normalize(url.searchParams.get('merchantCompany'));

      if (!userId) {
        sendJson(res, 400, { message: 'userId query parameter is required.' });
        return;
      }

      const scoped = getAuthorizedClaims(dataset, userId, merchantCompany);
      if (scoped.error) {
        sendJson(res, 403, { message: scoped.error });
        return;
      }

      const aggregate = computeAggregates(scoped.claims);
      sendJson(res, 200, {
        claims: scoped.claims,
        chartData: aggregate.chartData,
      });
      return;
    }

    sendJson(res, 404, { message: 'Not found' });
  } catch (error) {
    sendJson(res, 500, {
      message: 'Failed to load CSV-backed data.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

server.listen(PORT, () => {
  console.log(`CSV API listening on http://localhost:${PORT}`);
});
