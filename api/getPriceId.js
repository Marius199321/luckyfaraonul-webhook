import axios from 'axios';

export default async function handler(req, res) {
  const { productId } = req.query;

  if (!productId) {
    console.error("[getPriceId] Missing productId!");
    return res.status(400).json({ success: false, error: 'Missing productId' });
  }

  try {
    // Folosește POST, nu GET!
    const response = await axios.post(
      'https://www.luckyfaraonul.com/_functions/getPriceId',
      { productId }, // body
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`,
        }
      }
    );

    console.log("[getPriceId] Răspuns brut de la Wix:", response.data);

    if (response.data && response.data.success) {
      if (!response.data.stripePriceId) {
        return res.status(404).json({
          success: false,
          error: response.data.error || 'stripePriceId not found'
        });
      }
      return res.status(200).json({
        success: true,
        stripePriceId: response.data.stripePriceId
      });
    }

    // Caz fallback
    console.error("[getPriceId] stripePriceId not found! Response:", response.data);
    return res.status(404).json({
      success: false,
      error: response.data.error || 'stripePriceId not found'
    });

  } catch (err) {
    console.error("[getPriceId] Eroare:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: 'getPriceId Vercel error',
      details: err.response?.data || err.message
    });
  }
}






