import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // ✅ CORS Headers
  res.setHeader('Access-Control-Allow-Origin', 'https://www.luckyfaraonul.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // ✅ Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': 'https://www.luckyfaraonul.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Length': '0'
    });
    return res.end();
  }

  // ❌ Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ✅ Parse input
  const {
    name, phone, email, address,
    country, productId, productName,
    qty, stripePriceId
  } = req.body;

  if (!stripePriceId || !qty || !email) {
    return res.status(400).json({ error: "Missing required fields: stripePriceId, qty, or email." });
  }

  console.log("🎯 Creating Stripe session with:", {
    name, phone, email, address, country, productId, productName, qty, stripePriceId
  });

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

    return res.status(200).json({ id: session.id, sessionUrl: session.url });

  } catch (err) {
    console.error("❌ Stripe session error:", err.message);
    return res.status(500).json({ error: "Stripe error: " + err.message });
  }
}













