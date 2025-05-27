import axios from 'axios';

export default async function handler(req, res) {
  // Acceptă și POST și GET pentru debug/test
  let productId = "";
  if (req.method === "POST") {
    productId = req.body?.productId;
  } else {
    productId = req.query?.productId;
  }

  if (!productId) {
    console.error("[getPriceId] Missing productId!");
    return res.status(400).json({ success: false, error: "Missing productId" });
  }

  try {
    // Chemare POST către Wix
    const wixResponse = await axios.post(
      'https://www.luckyfaraonul.com/_functions/getPriceId',
      { productId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`,
        },
        timeout: 12000 // 12 secunde timeout pentru debug
      }
    );

    console.log("[getPriceId] Wix response:", wixResponse.data);

    if (wixResponse.data && wixResponse.data.success && wixResponse.data.stripePriceId) {
      return res.status(200).json({
        success: true,
        stripePriceId: wixResponse.data.stripePriceId,
      });
    }

    // Returnează direct eroarea din Wix dacă există, cu 404 dacă nu-i găsit stripePriceId
    return res.status(404).json({
      success: false,
      error: wixResponse.data?.error || "stripePriceId not found"
    });

  } catch (err) {
    // Detalii pentru debug real
    const details = err.response?.data || err.message || err;
    console.error("[getPriceId] Eroare catch:", details);

    return res.status(500).json({
      success: false,
      error: "getPriceId Vercel error",
      details
    });
  }
}








