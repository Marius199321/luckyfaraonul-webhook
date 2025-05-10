// api/createCheckoutSession.js

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { qty, productId, productName, stripePriceId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: qty
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        qty,
        productId,
        productName
      }
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Eroare la createCheckoutSession:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
