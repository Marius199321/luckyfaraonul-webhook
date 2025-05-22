// api/getPriceId.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Missing productId' });
  }

  try {
    const response = await axios.post(
      'https://www.luckyfaraonul.com/_functions/get_getGiveawayDetails',
      { productId },
      {
        headers: {
          Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
        }
      }
    );

    const data = response.data;
    if (!data.stripePriceId) {
      return res.status(404).json({ error: 'stripePriceId not found in product' });
    }

    return res.status(200).json({ stripePriceId: data.stripePriceId });
  } catch (err) {
    console.error('❌ Eroare getPriceId:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


