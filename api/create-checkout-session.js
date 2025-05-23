import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log('🔵 [create-checkout-session] Method:', req.method, 'Origin:', req.headers.origin);

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    console.log('🟡 [create-checkout-session] CORS preflight OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.error('❌ [create-checkout-session] Method Not Allowed:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    console.log('🔵 [create-checkout-session] Body primit:', req.body);

    const {
      name,
      phone,
      email,
      address,
      country,
      productId,
      productName,
      qty,
      stripePriceId
    } = req.body;

    if (!email || !stripePriceId || !qty || !productId) {
      console.warn('⚠️ [create-checkout-session] Missing required fields:', { email, stripePriceId, qty, productId });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🟢 [create-checkout-session] Cerere Stripe:', {
      stripePriceId, qty, email, productId, name, phone, address, country, productName
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: stripePriceId,
          quantity: qty
        }
      ],
      customer_email: email,
      client_reference_id: productId,
      metadata: {
        name,
        phone,
        address,
        country,
        productName,
        qty
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`
    });

    console.log('🟢 [create-checkout-session] Stripe session creat:', session.id);

    return res.status(200).json({ sessionUrl: session.url });

  } catch (err) {
    console.error('❌ [create-checkout-session] Eroare Stripe:', err);

    return res.status(500).json({
      error: 'Unable to create Stripe session',
      details: err.message,
      raw: err.raw || null
    });
  }
}





















