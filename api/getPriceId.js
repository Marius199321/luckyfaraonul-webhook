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
        const wixResponse = await fetch('https://www.luckyfaraonul.com/_functions/getPriceId', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        const rawText = await wixResponse.text();
        console.log("📦 Wix response raw:", rawText);

        if (!wixResponse.ok) {
            return res.status(500).json({ error: 'Wix returned status ' + wixResponse.status, raw: rawText });
        }

        const data = JSON.parse(rawText);
        return res.status(200).json({ stripePriceId: data.stripePriceId });

    } catch (error) {
        console.error('❌ Eroare în comunicarea cu Wix:', error.message);
        res.status(500).json({ error: 'Wix returned error', details: error.message });
    }
}

