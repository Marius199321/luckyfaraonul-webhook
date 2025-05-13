export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { productId } = req.body;

  try {
    const response = await fetch('https://www.luckyfaraonul.com/_functions/getPriceId', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error('❌ Wix response not OK:', rawText);
      return res.status(500).json({ error: 'Wix returned error' });
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      console.error('❌ JSON parse error:', err);
      return res.status(500).json({ error: 'Invalid JSON from Wix' });
    }

    if (!data.stripePriceId) {
      console.error('❌ stripePriceId not found in response:', data);
      return res.status(404).json({ error: 'stripePriceId not found' });
    }

    return res.status(200).json({ stripePriceId: data.stripePriceId });

  } catch (error) {
    console.error('❌ Eroare la fetch către Wix:', error.message);
    res.status(500).json({ error: 'Failed to get stripePriceId' });
  }
}

