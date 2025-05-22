// api/getUsedTickets.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { productId, skip = 0, limit = 1000 } = req.query;

  if (!productId) {
    return res.status(400).json({ error: 'Missing productId' });
  }

  try {
    const response = await axios.get(
      `https://www.luckyfaraonul.com/_functions/get_getUsedTickets?productId=${productId}&skip=${skip}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
        }
      }
    );

    const { usedTickets, total } = response.data;
    return res.status(200).json({ usedTickets, total });

  } catch (err) {
    console.error('❌ Eroare getUsedTickets:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
