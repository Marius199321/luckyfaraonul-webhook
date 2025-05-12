import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fullName, phone, email, address, country, productId, productName, qty } = req.body;

  try {
    const result = await fetch('https://luckyfaraonul-webhook.vercel.app/api/getPriceId', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    const data = await result.json();

    if (!data.stripePriceId) {
      return res.status(500).json({ error: 'stripePriceId not found' });
    }

    const stripePriceId = data.stripePriceId;

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
    console.error('❌ Stripe error:', error.message);
    res.status(500).json({ error: 'Could not create Stripe session' });
  }
}
