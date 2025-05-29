// Vercel - getPriceId.js
import axios from 'axios';

export default async function handler(req, res) {
  const productId = req.method === 'POST'
    ? req.body.productId
    : req.query.productId;

  if (!productId) {
    return res.status(400).json({ success: false, error: 'Missing productId' });
  }

  try {
    const wixRes = await axios.post(
      'https://www.luckyfaraonul.com/_functions/getPriceId',
      {
        productId,
        secret: process.env.FUNCTION_SECRET // asigură-te că e exact așa
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json({
      success: true,
      stripePriceId: wixRes.data.stripePriceId
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'getPriceId Vercel error',
      details: err.message
    });
  }
}












