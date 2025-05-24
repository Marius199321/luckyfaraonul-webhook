// api/getUsedTickets.js
import axios from 'axios';

export default async function handler(req, res) {
  const { productId } = req.query;
  if (!productId) return res.status(400).json({ error: "Missing productId" });

  try {
    // Folosește endpointul NOU din Wix
    const response = await axios.get('https://www.luckyfaraonul.com/_functions/get_getUsedTickets', {
      params: { productId },
      headers: {
        Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
      }
    });

    if (response.data && response.data.usedTickets) {
      return res.status(200).json({ usedTickets: response.data.usedTickets });
    }
    return res.status(404).json({ error: response.data.error || 'No tickets found' });
  } catch (err) {
    console.error('Eroare getUsedTickets:', err.response?.data || err.message);
    return res.status(500).json({ error: 'getUsedTickets error', details: err.response?.data || err.message });
  }
}



