import axios from 'axios';

export default async function handler(req, res) {
  const productId = req.method === 'POST'
    ? req.body.productId
    : req.query.productId;

  if (!productId) {
    console.error("[getPriceId] Missing productId!");
    return res.status(400).json({ success: false, error: 'Missing productId' });
  }

  try {
    const wixRes = await axios.post(
      'https://www.luckyfaraonul.com/_functions/getPriceId',
      {
        productId,
        secret: process.env.FUNCTION_SECRET
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log("[getPriceId] Wix response:", wixRes.data);

    if (wixRes.data.success && wixRes.data.stripePriceId) {
      return res.status(200).json({ success: true, stripePriceId: wixRes.data.stripePriceId });
    }

    return res.status(404).json({ success: false, error: wixRes.data.error });

  } catch (err) {
    const details = err.response?.data || err.message || err;
    console.error("[getPriceId] Catch error:", details);
    return res.status(500).json({ success: false, error: 'getPriceId Vercel error', details });
  }
}











