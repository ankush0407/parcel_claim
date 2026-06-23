import { buildDataset, getAuthorizedClaims, cors, normalize } from '../_lib/shared.mjs';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const userId = normalize(req.query?.userId);
  const claimId = req.query?.id;
  if (!userId) { res.status(400).json({ message: 'userId query parameter is required.' }); return; }
  try {
    const dataset = await buildDataset();
    const scoped = getAuthorizedClaims(dataset, userId, '');
    if (scoped.error) { res.status(403).json({ message: scoped.error }); return; }
    let claim = scoped.claims.find((c) => c.id === claimId);
    if (!claim) { res.status(404).json({ message: 'Claim not found or not accessible.' }); return; }
    // Auto-assign in memory (not persisted on Vercel)
    if (!claim.assignedTo) {
      const cxUser = dataset.users.find((u) => u.role === 'cx_team' && u.isActive);
      if (cxUser) claim = { ...claim, assignedTo: cxUser.fullName };
    }
    res.status(200).json({ claim });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
