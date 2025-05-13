import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fullName, phone, email, address, country, productId, productName, qty } = req.body;

  try {
    // 🔍 Apelăm funcția getPriceId din Wix
    const result = await fetch('https://www.luckyfaraonul.com/_functions/getPriceId', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    const rawText = await result.text();
    console.log('🔍 Răspuns brut de la getPriceId:', rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('❌ Eroare la parsarea JSON:', parseErr);
      return res.status(500).json({ error: 'Invalid JSON response from getPriceId' });
    }

    if (!data.stripePriceId) {
      console.error('❌ stripePriceId not found from Wix:', data);
      return res.status(500).json({ error: 'stripePriceId not found' });
    }

    const stripePriceId = data.stripePriceId;

    // ✅ Creăm sesiunea Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: stripePriceId, quantity: Number(qty) }],
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

  } catch (error) {
    console.error('❌ Stripe error:', error);
    res.status(500).json({ error: error.message || 'Could not create Stripe session' });
  }
}
