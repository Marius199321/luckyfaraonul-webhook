import axios from 'axios';

export default async function handler(req, res) {
  // Acceptă POST (pt. flow Stripe) și GET (pt. testare rapidă din browser)
  const productId = req.method === 'POST'
    ? req.body.productId
    : req.query.productId;

  if (!productId) {
    console.error("[getPriceId] Missing productId!");
    return res.status(400).json({ success: false, error: 'Missing productId' });
  }

  try {
    // POST request spre endpointul Wix
    const wixRes = await axios.post(
      'https://www.luckyfaraonul.com/_functions/getPriceId',
      { productId },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FUNCTION_SECRET}`
        }
      }
    );

    console.log("[getPriceId] Răspuns Wix:", wixRes.data);

    if (wixRes.data && wixRes.data.success && wixRes.data.stripePriceId) {
      return res.status(200).json({
        success: true,
        stripePriceId: wixRes.data.stripePriceId
      });
    }

    return res.status(404).json({
      success: false,
      error: wixRes.data?.error || 'stripePriceId not found'
    });

  } catch (err) {
    const details = err.response?.data || err.message || err;
    console.error("[getPriceId] Eroare catch:", details);

    return res.status(500).json({
      success: false,
      error: 'getPriceId Vercel error',
      details
    });
  }
}









