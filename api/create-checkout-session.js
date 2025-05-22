import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // 🔁 CORS universal pentru OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  // 🔒 Acceptăm doar POST real
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ CORS pentru POST
  res.setHeader('Access-Control-Allow-Origin', '*');

  const {
    name, phone, email, address,
    country, productId, productName,
    qty, stripePriceId
  } = req.body;

  if (!stripePriceId || !qty || !email) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: stripePriceId,
        quantity: Number(qty),
      }],
      mode: 'payment',
      metadata: {
        name, phone, email, address, country, productId, productName, qty
      },
      success_url: process.env.SUCCESS_URL || 'https://www.luckyfaraonul.com/success',
      cancel_url: process.env.CANCEL_URL || 'https://www.luckyfaraonul.com/cancel',
    });

    return res.status(200).json({ sessionUrl: session.url });
  } catch (err) {
    console.error("❌ Stripe error:", err.message);
    return res.status(500).json({ error: "Stripe error: " + err.message });
  }
}


















