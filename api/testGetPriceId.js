export default async function handler(req, res) {
    try {
        const productId = '5b817214-4a76-4718-b73d-0c8125525948';

        const response = await fetch('https://www.luckyfaraonul.com/_functions/getPriceId', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();
        res.status(200).json({ stripePriceId: data.stripePriceId });
    } catch (error) {
        console.error('Eroare test:', error.message);
        res.status(500).json({ error: 'Failed to fetch stripePriceId' });
    }
}
