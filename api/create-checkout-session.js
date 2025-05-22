// api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Restricție pentru POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const {
      name,
      phone,
      email,
      address,
      country,
      productId,
      productName,
      qty,
      stripePriceId
    } = req.body;

    if (!email || !stripePriceId || !qty || !productId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: stripePriceId,
          quantity: qty
        }
      ],
      customer_email: email,
      client_reference_id: productId,
      metadata: {
        name,
        phone,
        address,
        country,
        productName,
        qty
      },
      success_url: `${process.env.DOMAIN}/success`,
      cancel_url: `${process.env.DOMAIN}/cancel`
    });

    return res.status(200).json({ sessionUrl: session.url });

  } catch (err) {
    console.error('❌ create-checkout-session error:', err);

    return res.status(500).json({
      error: 'Unable to create Stripe session',
      details: err.message,
      raw: err.raw || null
    });
  }
}



















