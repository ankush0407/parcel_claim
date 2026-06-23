import { buildDataset, computeAggregates, getAuthorizedClaims, cors, normalize } from './_lib/shared.mjs';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const userId = normalize(req.query?.userId);
  const merchantCompany = normalize(req.query?.merchantCompany);
  if (!userId) { res.status(400).json({ message: 'userId query parameter is required.' }); return; }
  try {
    const dataset = await buildDataset();
    const scoped = getAuthorizedClaims(dataset, userId, merchantCompany);
    if (scoped.error) { res.status(403).json({ message: scoped.error }); return; }
    const { chartData } = computeAggregates(scoped.claims);
    res.status(200).json({ claims: scoped.claims, chartData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
