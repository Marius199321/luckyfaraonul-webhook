import axios from 'axios';

export default async function handler(req, res) {
  console.log('🔵 [getPriceId] Method:', req.method, 'Body:', req.body);

  if (req.method !== 'POST') {
    console.error('❌ [getPriceId] Method Not Allowed:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { productId } = req.body;

  if (!productId) {
    console.warn('⚠️ [getPriceId] Missing productId in request');
    return res.status(400).json({ error: 'Missing productId' });
  }

  try {
    console.log('🔵 [getPriceId] Fetching product details from Wix for productId:', productId);

    const response = await axios.post(
      'https://www.luckyfaraonul.com/_functions/get_getGiveawayDetails',
      { productId },
      {
        headers: {
          Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
        }
      }
    );

    console.log('🟢 [getPriceId] Response from Wix:', response.data);

    const data = response.data;
    if (!data.stripePriceId) {
      console.warn('⚠️ [getPriceId] stripePriceId not found in product:', productId, 'Payload:', data);
      return res.status(404).json({ error: 'stripePriceId not found in product' });
    }

    console.log('🟢 [getPriceId] stripePriceId found:', data.stripePriceId);

    return res.status(200).json({ stripePriceId: data.stripePriceId });
  } catch (err) {
    console.error('❌ [getPriceId] Eroare la request spre Wix:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}



