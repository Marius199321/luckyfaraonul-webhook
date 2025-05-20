// api/create-checkout-session.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(200).end();
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

  // Validare date
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




