import { buildDataset, cors, normalize, DEMO_PASSWORD } from '../_lib/shared.mjs';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  try {
    const { email, password } = req.body || {};
    const dataset = await buildDataset();
    const user = dataset.users.find((u) => u.email.toLowerCase() === normalize(email).toLowerCase() && u.isActive);
    if (!user) { res.status(404).json({ ok: false, message: 'Account not found.' }); return; }
    if (normalize(password) !== DEMO_PASSWORD) { res.status(401).json({ ok: false, message: 'Invalid password.' }); return; }
    res.status(200).json({ ok: true, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
