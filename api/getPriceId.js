// api/getPriceId.js
import axios from 'axios';

export default async function handler(req, res) {
  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json({ error: 'Missing productId' });
  }

  try {
    // Folosește endpointul NOU din Wix
    const response = await axios.get('https://www.luckyfaraonul.com/_functions/get_getPriceId', {
      params: { productId },
      headers: {
        Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
      }
    });

    if (response.data && response.data.stripePriceId) {
      return res.status(200).json({ stripePriceId: response.data.stripePriceId });
    }
    return res.status(404).json({ error: response.data.error || 'stripePriceId not found' });

  } catch (err) {
    console.error('Eroare getPriceId:', err.response?.data || err.message);
    return res.status(500).json({ error: 'getPriceId Vercel error', details: err.response?.data || err.message });
  }
}




