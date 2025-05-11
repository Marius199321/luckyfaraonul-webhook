import Stripe from 'stripe';
import dotenv from 'dotenv';
import { buffer } from 'micro';
import { generateTickets } from './generateTickets.js';
import { generateOrderNumber } from './generateOrderNumber.js';
import { checkInstantWin } from './instantWinChecker.js';

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
    console.log('--- SESSION OBJECT ---', session);

    try {
      const metadata = session.metadata || {};
      const qty = parseInt(metadata.qty);
      const productId = metadata.productId;
      const productName = metadata.productName;

      if (!qty || !productId || !productName) {
        console.error('Missing metadata fields');
        return res.status(400).json({ error: 'Missing metadata' });
      }

      const fetch = (await import('node-fetch')).default;

      // 1. Get product from Wix
      const productRes = await fetch(`${process.env.WIX_BACKEND_URL}/getProduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      let productData;
      try {
        productData = await productRes.json();
      } catch (e) {
        const raw = await productRes.text();
        console.error('Invalid JSON from getProduct:', raw);
        return res.status(500).json({ error: 'Invalid JSON from getProduct' });
      }

      const product = productData?.item;
      if (!product) {
        console.error('Product not found');
        return res.status(500).json({ error: 'Product not found' });
      }

      const maxTickets = product.totalTickets;
      console.log('Product maxTickets:', maxTickets);

      // 2. Get used tickets
      const usedRes = await fetch(`${process.env.WIX_BACKEND_URL}/getUsedTickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      let usedTickets = [];
      try {
        usedTickets = await usedRes.json();
      } catch (e) {
        const raw = await usedRes.text();
        console.error('Invalid JSON from getUsedTickets:', raw);
        return res.status(500).json({ error: 'Invalid JSON from getUsedTickets' });
      }

      // 3. Generate tickets
      const tickets = generateTickets(qty, maxTickets, usedTickets);
      console.log('Generated tickets:', tickets);

      // 4. Generate order number
      const orderNumber = generateOrderNumber();

      // 5. Instant win
      const instantPrizes = product.instantWinPrizes || [];
      const instantWinners = checkInstantWin(tickets, instantPrizes);
      const isInstantWin = instantWinners.length > 0;
      console.log('Instant winners:', instantWinners);

      // 6. Save to CMS
      const customer = session.customer_details || {};
      const address = customer.address || {};

      const saveRes = await fetch(`${process.env.WIX_BACKEND_URL}/savePurchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: address.line1 || '',
          country: address.country || '',
          postcode: address.postal_code || '',
          amountPaid: session.amount_total / 100,
          currency: session.currency,
          qty,
          tickets,
          productId,
          productName,
          orderNumber,
          instantWin: isInstantWin,
          createdAt: new Date().toISOString(),
        }),
      });

      let saveResult = {};
      try {
        saveResult = await saveRes.json();
      } catch (e) {
        const raw = await saveRes.text();
        console.error('Invalid JSON from savePurchase:', raw);
        return res.status(500).json({ error: 'Invalid JSON from savePurchase' });
      }

      if (!saveResult.success) {
        console.error('savePurchase failed:', saveResult.error);
        return res.status(500).json({ error: `savePurchase error: ${saveResult.error}` });
      }

      console.log('✅ Purchase saved successfully!');
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('❌ Error handling payment:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(200).json({ received: true });
}

