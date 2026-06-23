import { buildDataset, cors, DEMO_PASSWORD } from './_lib/shared.mjs';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    const dataset = await buildDataset();
    res.status(200).json({ users: dataset.users, demoPassword: DEMO_PASSWORD });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
