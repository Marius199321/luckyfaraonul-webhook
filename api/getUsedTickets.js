// api/getUsedTickets.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log("📥 [GET /api/getUsedTickets] Cerere primită:", req.query);

  if (req.method !== 'GET') {
    console.warn("⚠️ [GET /api/getUsedTickets] Method Not Allowed:", req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { productId, skip = 0, limit = 1000 } = req.query;

  if (!productId) {
    console.warn("⚠️ [GET /api/getUsedTickets] Missing productId");
    return res.status(400).json({ error: 'Missing productId' });
  }

  try {
    console.log("🌐 [GET /api/getUsedTickets] Trimit request la Wix...", {
      productId,
      skip,
      limit
    });

    const response = await axios.get(
      `https://www.luckyfaraonul.com/_functions/get_getUsedTickets`,
      {
        params: { productId, skip, limit },
        headers: {
          Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
        }
      }
    );

    const data = response.data;
    console.log("✅ [GET /api/getUsedTickets] Răspuns primit:", data);

    if (!Array.isArray(data.usedTickets)) {
      console.error("❌ [GET /api/getUsedTickets] Răspuns invalid:", data);
      return res.status(502).json({ error: 'Invalid response from Wix' });
    }

    return res.status(200).json({
      usedTickets: data.usedTickets,
      total: data.usedTickets.length
    });

  } catch (err) {
    console.error("❌ [GET /api/getUsedTickets] Eroare generală:", err.message, err?.response?.data);
    return res.status(500).json({
      error: 'Internal server error',
      details: err?.response?.data || err.message
    });
  }
}

