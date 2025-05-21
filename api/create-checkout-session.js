import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const allowedOrigin = 'https://www.luckyfaraonul.com';

export default async function handler(req, res) {
  const origin = req.headers.origin;

  // ✅ Setări CORS
  res.setHeader('Access-Control-Allow-Origin', origin === allowedOrigin ? origin : 'null');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // ✅ Handlere pentru request preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ❌ Rejactăm orice altceva în afară de POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ✅ Asigură-te că body-ul e parsabil JSON
  let body = req.body;

  if (typeof req.body === 'string' && req.headers['content-type'] === 'application/json') {
    try {
      body = JSON.parse(req.body);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
  }

  const {
    name, phone, email, address,
    country, productId, productName,
    qty, stripePriceId
  } = body;

  if (!stripePriceId || !qty || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: stripePriceId, quantity: Number(qty) }],
      mode: 'payment',
      metadata: {
        name, phone, email, address,
        country, productId, productName, qty
      },
      success_url: process.env.SUCCESS_URL || 'https://www.luckyfaraonul.com/success',
      cancel_url: process.env.CANCEL_URL || 'https://www.luckyfaraonul.com/cancel'
    });

    return res.status(200).json({ id: session.id, sessionUrl: session.url });
  } catch (err) {
    console.error("Stripe session error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}









