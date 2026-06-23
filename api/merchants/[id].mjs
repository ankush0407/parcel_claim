import { buildDataset, cors, asBool } from '../_lib/shared.mjs';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }
  try {
    const dataset = await buildDataset();
    const merchant = dataset.merchants.find((m) => m.merchant_id === req.query?.id);
    if (!merchant) { res.status(404).json({ message: 'Merchant not found.' }); return; }
    res.status(200).json({
      merchant: {
        id: merchant.merchant_id, code: merchant.merchant_code,
        legalName: merchant.legal_name, displayName: merchant.display_name,
        contactEmail: merchant.contact_email, contactPhone: merchant.contact_phone,
        billingCurrency: merchant.billing_currency, isActive: asBool(merchant.is_active),
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
