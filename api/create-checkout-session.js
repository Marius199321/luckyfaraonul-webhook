import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const allowedOrigin = 'https://www.luckyfaraonul.com';

export default async function handler(req, res) {
  // ✅ CORS complet
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // ✅ Răspuns pentru preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ❌ Doar POST este permis
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ✅ Asigurare parsare body (în caz că e string)
  let body = req.body;
  if (typeof body === 'string' && req.headers['content-type'] === 'application/json') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON in body' });
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
      success_url: process.env.SUCCESS_URL || `${allowedOrigin}/success`,
      cancel_url: process.env.CANCEL_URL || `${allowedOrigin}/cancel`
    });

    return res.status(200).json({ id: session.id, sessionUrl: session.url });
  } catch (err) {
    console.error("❌ Stripe session error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}












