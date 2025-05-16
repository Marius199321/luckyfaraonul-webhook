// api/create-checkout-session.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fullName, phone, email, address, country, productId, productName, qty } = req.body;

  console.log("📦 Body primit în create-checkout-session:", req.body);

  if (!productId || !qty || !email) {
    return res.status(400).json({ error: "Missing required fields: productId, qty, or email" });
  }

  try {
    // 🛠️ Asigură-te că URL-ul include "https://" o singură dată
    const domain = process.env.VERCEL_URL.startsWith('http')
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;

    const getPriceUrl = `${domain}/api/getPriceId`;
    console.log("🔍 Cer stripePriceId pentru:", productId, "de la:", getPriceUrl);

    const priceRes = await fetch(getPriceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    if (!priceRes.ok) {
      const errData = await priceRes.text();
      console.error("❌ Eroare la fetch stripePriceId:", errData);
      return res.status(500).json({ error: "Failed to get stripePriceId from Wix backend" });
    }

    const { stripePriceId } = await priceRes.json();

    if (!stripePriceId) {
      console.error("❌ stripePriceId not found in response");
      return res.status(404).json({ error: "stripePriceId not found" });
    }

    console.log("✅ stripePriceId primit:", stripePriceId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: stripePriceId, quantity: Number(qty) }],
      mode: 'payment',
      metadata: {
        fullName, phone, email, address, country, productId, productName, qty
      },
      success_url: 'https://www.luckyfaraonul.com/success',
      cancel_url: 'https://www.luckyfaraonul.com/cancel'
    });

    console.log("🎉 Stripe session creată:", session.id);
    return res.status(200).json({ id: session.id, url: session.url });

  } catch (err) {
    console.error("❌ Eroare sesiune Stripe:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}


