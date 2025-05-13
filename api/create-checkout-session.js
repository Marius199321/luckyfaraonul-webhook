import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { fullName, phone, email, address, country, productId, productName, qty } = req.body;

  try {
    // 🔄 Trimitem către funcția backend getPriceId
    const priceRes = await fetch('https://luckyfaraonul-webhook.vercel.app/api/getPriceId', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    if (!priceRes.ok) {
      const errText = await priceRes.text();
      console.error('❌ Eroare HTTP din getPriceId:', priceRes.status, errText);
      return res.status(500).json({ error: 'Eroare din getPriceId' });
    }

    let priceData;
    try {
      priceData = await priceRes.json();
    } catch (err) {
      console.error('❌ Răspuns invalid JSON din getPriceId:', err);
      return res.status(500).json({ error: 'Răspuns invalid JSON din getPriceId' });
    }

    if (!priceData.stripePriceId) {
      console.error('❌ stripePriceId lipsă:', priceData);
      return res.status(500).json({ error: 'stripePriceId not found' });
    }

    // ✅ Creăm sesiunea de plată Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceData.stripePriceId, quantity: Number(qty) }],
      mode: 'payment',
      customer_email: email,
      metadata: {
        fullName,
        phone,
        address,
        country,
        productId,
        productName,
        qty
      },
      success_url: 'https://www.luckyfaraonul.com/success',
      cancel_url: 'https://www.luckyfaraonul.com/cancel'
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('❌ Eroare finală:', err);
    return res.status(500).json({ error: err.message || 'Eroare internă server' });
  }
}

