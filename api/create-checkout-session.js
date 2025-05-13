// api/create-checkout-session.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { fullName, phone, email, address, country, productId, productName, qty } = req.body;

  try {
    const priceRes = await fetch(`${process.env.VERCEL_URL}/api/getPriceId`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    const { stripePriceId } = await priceRes.json();

    if (!stripePriceId) return res.status(500).json({ error: 'stripePriceId not found' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        { price: stripePriceId, quantity: Number(qty) }
      ],
      mode: 'payment',
      metadata: { fullName, phone, email, address, country, productId, productName, qty },
      success_url: 'https://www.luckyfaraonul.com/success',
      cancel_url: 'https://www.luckyfaraonul.com/cancel'
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('Eroare sesiune:', err);
    res.status(500).json({ error: err.message });
  }
}

