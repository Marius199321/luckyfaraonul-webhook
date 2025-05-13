// api/getPriceId.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { productId } = req.body;

  try {
    const wixResponse = await fetch(`${process.env.WIX_BACKEND_URL}/getPriceId`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    const data = await wixResponse.json();

    if (!data?.stripePriceId) {
      return res.status(404).json({ error: 'stripePriceId not found' });
    }

    return res.status(200).json({ stripePriceId: data.stripePriceId });
  } catch (error) {
    console.error('Eroare getPriceId:', error.message);
    return res.status(500).json({ error: 'Failed to fetch stripePriceId' });
  }
}
