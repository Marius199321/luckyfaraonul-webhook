// api/getUsedTickets.js
import axios from 'axios';

export default async function handler(req, res) {
  const { productId } = req.query;

  if (!productId) {
    console.error("[getUsedTickets] Missing productId!");
    return res.status(400).json({ success: false, error: "Missing productId" });
  }

  try {
    // Folosește endpointul NOU din Wix
    const response = await axios.get('https://www.luckyfaraonul.com/_functions/get_getUsedTickets', {
      params: { productId },
      headers: {
        Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
      }
    });

    if (response.data && Array.isArray(response.data.usedTickets)) {
      return res.status(200).json({ success: true, usedTickets: response.data.usedTickets });
    }
    console.error("[getUsedTickets] No tickets found. Response:", response.data);
    return res.status(404).json({ success: false, error: response.data.error || 'No tickets found' });

  } catch (err) {
    console.error('[getUsedTickets] Eroare:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: 'getUsedTickets error',
      details: err.response?.data || err.message
    });
  }
}




