// api/getPriceId.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Missing productId in request body' });
  }

  const wixBackendUrl = process.env.WIX_BACKEND_URL;
  const wixSecret = process.env.WIX_FUNCTION_SECRET; // <-- asigură-te că ai setat asta în Vercel
  const endpoint = `${wixBackendUrl}/getPriceId`;

  try {
    console.log("🔁 Cerere către Wix backend:", endpoint, "cu productId:", productId);

    const wixResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wix-function-secret': wixSecret // 👈 AICI trimitem secretul
      },
      body: JSON.stringify({ productId })
    });

    const text = await wixResponse.text();

    if (!wixResponse.ok) {
      console.error("❌ Răspuns invalid de la Wix:", wixResponse.status, text);
      return res.status(500).json({ error: 'Invalid response from Wix backend', details: text });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Eroare la parsarea JSON:", parseError.message);
      return res.status(500).json({ error: 'Invalid JSON from Wix backend' });
    }

    if (!data?.stripePriceId) {
      console.error("⚠️ stripePriceId lipsă în răspuns:", data);
      return res.status(404).json({ error: 'stripePriceId not found' });
    }

    console.log("✅ stripePriceId returnat:", data.stripePriceId);
    return res.status(200).json({ stripePriceId: data.stripePriceId });

  } catch (error) {
    console.error("❌ Eroare fetch Wix:", error.message);
    return res.status(500).json({ error: 'Failed to fetch stripePriceId' });
  }
}


