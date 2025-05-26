import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Allow POST only
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    // Debug rapid
    // console.log('[create-checkout-session] Body:', req.body);

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
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const qtyNum = Number(qty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: stripePriceId,
          quantity: qtyNum
        }
      ],
      customer_email: email,
      client_reference_id: productId,
      metadata: {
        name: name || '',
        phone: phone || '',
        address: address || '',
        country: country || '',
        productName: productName || '',
        qty: qtyNum,
        productId: productId
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`
    });

    // Succes: întotdeauna returnează JSON
    return res.status(200).json({ sessionUrl: session.url });

  } catch (err) {
    console.error('[create-checkout-session] Stripe error:', err);
    return res.status(500).json({
      error: 'Unable to create Stripe session',
      details: err.message,
      raw: err.raw || null
    });
  }
}























