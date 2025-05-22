import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false, // 🔥 Fără bodyParser = merge CORS și raw body
  },
};

export default async function handler(req, res) {
  // ✅ Set CORS headers universal
  res.setHeader('Access-Control-Allow-Origin', 'https://www.luckyfaraonul.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // ✅ OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // No content, CORS preflight OK
  }

  // ❌ Block other methods
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ✅ Parse raw body
  let body;
  try {
    const rawBody = await buffer(req);
    body = JSON.parse(rawBody.toString());
  } catch (err) {
    console.error("❌ JSON parse error:", err.message);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // ✅ Destructure payload
  const {
    name, phone, email, address,
    country, productId, productName,
    qty, stripePriceId
  } = body;

  console.log("📦 Payload primit:", body);

  if (!stripePriceId || !qty || !email) {
    return res.status(400).json({ error: "Missing required fields: stripePriceId, qty, or email." });
  }

  if (!stripePriceId.startsWith("price_")) {
    return res.status(400).json({ error: "Invalid Stripe Price ID format." });
  }

  // ✅ Creează sesiune Stripe
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: stripePriceId,
        quantity: Number(qty)
      }],
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

    console.log("✅ Sesiune Stripe creată:", session.id);
    return res.status(200).json({ id: session.id, sessionUrl: session.url });

  } catch (err) {
    console.error("❌ Stripe session error:", err.message);
    return res.status(500).json({ error: "Stripe error: " + err.message });
  }
}















