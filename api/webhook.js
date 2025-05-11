// api/webhook.js

import Stripe from 'stripe';
import { buffer } from 'micro';
import { config } from 'dotenv';
import { generateTickets } from './generateTickets.js';
import { generateOrderNumber } from './generateOrderNumber.js';
import { checkInstantWin } from './instantWinChecker.js';

config();

export const configVercel = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const wixBackendUrl = process.env.WIX_BACKEND_URL;

async function getUsedTickets(productId) {
  const response = await fetch(`${wixBackendUrl}/getUsedTickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });

  const data = await response.json();
  return data.usedTickets || [];
}

async function savePurchase(purchase) {
  await fetch(`${wixBackendUrl}/savePurchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchase),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const qty = parseInt(session.metadata.qty, 10);
    const productId = session.metadata.productId;
    const productName = session.metadata.productName;
    const amount = session.amount_total / 100;

    const email = session.customer_details.email;
    const name = session.customer_details.name;
    const phone = session.customer_details.phone || '';
    const address = session.customer_details.address?.line1 || '';
    const postcode = session.customer_details.address?.postal_code || '';
    const country = session.customer_details.address?.country || '';

    const maxTickets = 80000;
    const usedTickets = await getUsedTickets(productId);
    const generatedTickets = generateTickets(qty, maxTickets, usedTickets);
    const orderNumber = generateOrderNumber();

    const instantPrizes = [
      { number: 1234, prize: 'Win £1000' },
      { number: 8888, prize: 'Win £500' }
    ];
    const instantWinners = checkInstantWin(generatedTickets, instantPrizes);

    await savePurchase({
      qty,
      productId,
      productName,
      amount,
      email,
      name,
      phone,
      address,
      postcode,
      country,
      generatedTickets,
      orderNumber,
      instantWinners
    });
  }

  res.status(200).send('Received');
}
