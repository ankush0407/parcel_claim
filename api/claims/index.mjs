import { randomUUID } from 'node:crypto';
import { buildDataset, getAuthorizedClaims, cors, normalize } from '../_lib/shared.mjs';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  try {
    const dataset = await buildDataset();

    if (req.method === 'GET') {
      const userId = normalize(req.query?.userId);
      const merchantCompany = normalize(req.query?.merchantCompany);
      if (!userId) { res.status(400).json({ message: 'userId query parameter is required.' }); return; }
      const scoped = getAuthorizedClaims(dataset, userId, merchantCompany);
      if (scoped.error) { res.status(403).json({ message: scoped.error }); return; }
      const merchantCompanies = [...new Set(scoped.claims.map((c) => c.contact.company))].sort((a, b) => a.localeCompare(b));
      res.status(200).json({ claims: scoped.claims, merchantCompanies });
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const userId = normalize(body.userId);
      if (!userId) { res.status(400).json({ message: 'userId is required.' }); return; }
      const user = dataset.users.find((u) => u.id === userId);
      if (!user) { res.status(403).json({ message: 'Unauthorized user.' }); return; }
      const claimId = randomUUID();
      const claimNumber = `CLM-2026-${String(dataset.claims.length + 1).padStart(4, '0')}`;
      const filedDate = new Date().toISOString().split('T')[0];
      const slaDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const matchedShipment = normalize(body.trackingNumber)
        ? dataset.shipments.find((s) => normalize(s.tracking_number).toUpperCase() === normalize(body.trackingNumber).toUpperCase())
        : null;
      // Note: writes are in-memory only on Vercel (no persistent filesystem)
      res.status(201).json({
        ok: true, claimId, claimNumber,
        autoProcessRecommended: false,
        autoProcessReason: 'Queued for CX analyst processing',
        shipmentFound: !!matchedShipment,
        slaDeadline,
        filedDate,
      });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
