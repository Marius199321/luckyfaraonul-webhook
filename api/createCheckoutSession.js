import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // ✅ Fix CORS:
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { fullName, phone, email, address, country, productId, productName, qty } = req.body;

    try {
        // ✅ Obține stripePriceId din Wix (via .jsw)
        const result = await fetch('https://luckyfaraonul-webhook.vercel.app/api/getPriceId', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });

        const data = await result.json();

        if (!data.stripePriceId) {
            console.error('❌ Nu s-a primit stripePriceId din Wix');
            return res.status(500).json({ error: 'stripePriceId not found' });
        }

        const stripePriceId = data.stripePriceId;

        // ✅ Creează sesiunea Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: stripePriceId, quantity: Number(qty) }],
            mode: 'payment',
            customer_email: email,
            metadata: {
                fullName,
                phone,
                address,
                country,
                productId,
                productName,
                qty
            },
            success_url: 'https://luckyfaraonul.com/success',
            cancel_url: 'https://luckyfaraonul.com/cancel'
        });

        res.status(200).json({ url: session.url });

    } catch (error) {
        console.error('❌ Checkout session error:', error.message);
        res.status(500).json({ error: 'Could not create Stripe session' });
    }
}
