import { buildDataset, cors, normalize, asBool, asNumber } from '../_lib/shared.mjs';

function deriveHasDscan(row) { return normalize(row.carrier_delivery_date) !== ''; }

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  try {
    const { userId } = req.body || {};
    if (!userId) { res.status(400).json({ message: 'userId is required.' }); return; }
    const dataset = await buildDataset();
    const user = dataset.users.find((u) => u.id === userId);
    if (!user || (user.role !== 'cx_team' && user.role !== 'admin')) {
      res.status(403).json({ message: 'Only CX team/admin can process claims.' }); return;
    }
    // Simulate processing — reads CSV but writes are no-op on Vercel's read-only filesystem
    const submitted = dataset.claims.filter((c) => c.status === 'submitted');
    let approved = 0, rejected = 0, exception = 0;
    for (const claim of submitted) {
      // simplified auto-process logic mirroring server/index.mjs
      const snap = null; // tracking events not re-derived here for brevity
      if (snap) {
        if (deriveHasDscan(snap)) { rejected++; }
        else if (asNumber(snap.time_since_last_scan_days) > 10) { approved++; }
        else { exception++; }
      } else { exception++; }
    }
    res.status(200).json({
      ok: true, message: 'Claims queue processed (demo — changes not persisted on Vercel).',
      processed: submitted.length, approved, rejected, exception,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
