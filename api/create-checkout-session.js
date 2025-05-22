import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // ✅ OPTIONS preflight request – trebuie să răspundem complet
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.luckyfaraonul.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end(); // <- Important: .end() fără body!
  }

  // ✅ CORS headers pentru POST
  res.setHeader('Access-Control-Allow-Origin', 'https://www.luckyfaraonul.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // ❌ Blocăm metodele non-POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    name, phone, email, address,
    country, productId, productName,
    qty, stripePriceId
  } = req.body;

  console.log("🧾 stripePriceId:", stripePriceId);

  if (!stripePriceId || !qty || !email) {
    return res.status(400).json({ error: "Missing required fields: stripePriceId, qty, or email." });
  }

  if (!stripePriceId.startsWith("price_")) {
    return res.status(400).json({ error: "Invalid Stripe Price ID format." });
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


















