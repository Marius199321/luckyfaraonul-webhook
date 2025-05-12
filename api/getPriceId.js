export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end(); // ✅ răspunde la preflight CORS
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

        const data = await response.json();
        res.status(200).json({ stripePriceId: data.stripePriceId });

    } catch (error) {
        console.error('❌ Eroare la fetch către Wix:', error.message);
        res.status(500).json({ error: 'Failed to get stripePriceId' });
    }
}
