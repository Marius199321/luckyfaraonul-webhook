import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Config (pentru Vercel să proceseze POST și OPTIONS)
export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req, res) {
  console.log("🌍 New request:", req.method, req.url);

  // ✅ Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log("🟡 Handling OPTIONS preflight");
    res.setHeader('Access-Control-Allow-Origin', 'https://www.luckyfaraonul.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  // ✅ CORS headers pentru POST
  res.setHeader('Access-Control-Allow-Origin', 'https://www.luckyfaraonul.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method !== 'POST') {
    console.log("⛔ Method not allowed:", req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ✅ Log payload primit
  console.log("📦 Payload received:", req.body);

  const {
    name, phone, email, address,
    country, productId, productName,
    qty, stripePriceId
  } = req.body;

  if (!stripePriceId || !qty || !email) {
    console.log("❌ Missing required fields", { stripePriceId, qty, email });
    return res.status(400).json({ error: "Missing required fields: stripePriceId, qty, or email." });
  }

  if (!stripePriceId.startsWith("price_")) {
    console.log("❌ Invalid Stripe Price ID format:", stripePriceId);
    return res.status(400).json({ error: "Invalid Stripe Price ID format." });
  }

  try {
    console.log("✅ Creating Stripe session with:", {
      stripePriceId, qty, email
    });

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

    console.log("✅ Stripe session created:", session.id);
    return res.status(200).json({ id: session.id, sessionUrl: session.url });

  } catch (err) {
    console.error("🔥 Stripe session creation FAILED:", err.message);
    return res.status(500).json({ error: "Stripe error: " + err.message });
  }
}



















