import Stripe from 'stripe';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.luckyfaraonul.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // ✅ Preflight CORS fix
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body;
  try {
    const rawBody = await buffer(req);
    body = JSON.parse(rawBody.toString());
  } catch (err) {
    console.error("❌ Failed to parse JSON body:", err.message);
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const {
    name, phone, email, address,
    country, productId, productName,
    qty, stripePriceId
  } = body;

  if (!stripePriceId || !qty || !email) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (!stripePriceId.startsWith("price_")) {
    return res.status(400).json({ error: "Invalid Stripe Price ID." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: stripePriceId,
        quantity: Number(qty)
      }],
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
    console.error("❌ Stripe session error:", err.message);
    return res.status(500).json({ error: "Stripe error: " + err.message });
  }
}
















