// api/webhook.js

import Stripe from 'stripe';
import dotenv from 'dotenv';
import { buffer } from 'micro';
import { generateTickets } from './helpers/generateTickets.js';
import { generateOrderNumber } from './helpers/generateOrderNumber.js';
import { checkInstantWin } from './helpers/instantWinChecker.js';
import fetch from 'node-fetch';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const metadata = session.metadata;
      const qty = parseInt(metadata.qty);
      const productId = metadata.productId;
      const productName = metadata.productName;

      // 1. Obține produsul din CMS
      const productRes = await fetch(`https://www.wixapis.com/v1/collections/giveaways/items/query`, {
        method: 'POST',
        headers: {
          Authorization: process.env.WIX_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            _id: productId
          }
        })
      });

      const productData = await productRes.json();
      const product = productData.items[0];
      const maxTickets = product.totalTickets;

      // 2. Obține biletele deja folosite
      const usedRes = await fetch(`${process.env.WIX_BACKEND_URL}/getUsedTickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });

      const usedTickets = await usedRes.json();

      // 3. Generează biletele
      const tickets = generateTickets(qty, maxTickets, usedTickets);

      // 4. Generează order number
      const orderNumber = generateOrderNumber();

      // 5. Verifică dacă sunt câștiguri instant
      const instantPrizes = product.instantWinPrizes || [];
      const instantWinners = checkInstantWin(tickets, instantPrizes);
      const isInstantWin = instantWinners.length > 0;

      // 6. Salvează comanda în CMS (via .jsw)
      await fetch(`${process.env.WIX_BACKEND_URL}/savePurchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: session.customer_details.name,
          email: session.customer_details.email,
          phone: session.customer_details.phone || '',
          address: session.customer_details.address?.line1 || '',
          country: session.customer_details.address?.country || '',
          postcode: session.customer_details.address?.postal_code || '',
          amountPaid: session.amount_total / 100,
          currency: session.currency,
          qty,
          tickets,
          productId,
          productName,
          orderNumber,
          instantWin: isInstantWin,
          createdAt: new Date().toISOString()
        })
      });

      // 7. (opțional) Trimitere email aici...

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error handling payment:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  res.status(200).json({ received: true });
}
