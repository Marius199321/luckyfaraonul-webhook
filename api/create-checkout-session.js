// api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const allowedOrigin = 'https://www.luckyfaraonul.com';

export default async function handler(req, res) {
  const origin = req.headers.origin;

  res.setHeader('Access-Control-Allow-Origin', origin === allowedOrigin ? origin : 'null');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // OK fără conținut
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  console.log("📦 Body primit în create-checkout-session:", req.body);

  if (!stripePriceId || !qty || !email) {
    return res.status(400).json({
      error: "Missing required fields: stripePriceId, qty, or email"
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: Number(qty)
        }
      ],
      mode: 'payment',
      metadata: {
        name,
        phone,
        email,
        address,
        country,
        productId,
        productName,
        qty
      },
      success_url: process.env.SUCCESS_URL || 'https://www.luckyfaraonul.com/success',
      cancel_url: process.env.CANCEL_URL || 'https://www.luckyfaraonul.com/cancel'
    });

    console.log("🎉 Stripe session creată:", session.id);
    return res.status(200).json({ id: session.id, sessionUrl: session.url });

  } catch (err) {
    console.error("❌ Eroare sesiune Stripe:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message
    });
  }
}





