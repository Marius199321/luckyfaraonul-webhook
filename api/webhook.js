import Stripe from 'stripe';
import dotenv from 'dotenv';
import { buffer } from 'micro';
import { generateTickets } from './helpers/generateTickets.js';
import { generateOrderNumber } from './helpers/generateOrderNumber.js';
import { checkInstantWin } from './helpers/instantWinChecker.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let event;

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const fetch = (await import('node-fetch')).default;

      const metadata = session.metadata;
      const qty = parseInt(metadata.qty);
      const productId = metadata.productId;
      const productName = metadata.productName;

      // 1. Obține produsul din CMS
      const productRes = await fetch('https://www.wixapis.com/v1/collections/giveaways/items/query', {
        method: 'POST',
        headers: {
          Authorization: process.env.WIX_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: { _id: productId }
        })
      });

      if (!productRes.ok) {
        const text = await productRes.text();
        throw new Error(`❌ Eroare la fetch product: ${productRes.status} ${text}`);
      }

      const productData = await productRes.json();
      const product = productData.items?.[0];
      if (!product) throw new Error('❌ Produsul nu a fost găsit în CMS.');

      const maxTickets = product.totalTickets;

      // 2. Obține biletele deja folosite
      const usedRes = await fetch(`${process.env.WIX_BACKEND_URL}/getUsedTickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });

      if (!usedRes.ok) {
        const text = await usedRes.text();
        throw new Error(`❌ Eroare la fetch bilete existente: ${usedRes.status} ${text}`);
      }

      const usedTickets = await usedRes.json();

      // 3. Generează biletele
      const tickets = generateTickets(qty, maxTickets, usedTickets);

      // 4. Generează order number
      const orderNumber = generateOrderNumber();

      // 5. Verifică câștig instant
      const instantPrizes = product.instantWinPrizes || [];
      const instantWinners = checkInstantWin(tickets, instantPrizes);
      const isInstantWin = instantWinners.length > 0;

      // 6. Salvează în CMS
      const saveRes = await fetch(`${process.env.WIX_BACKEND_URL}/savePurchase`, {
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

      if (!saveRes.ok) {
        const text = await saveRes.text();
        throw new Error(`❌ Eroare la salvarea achiziției în CMS: ${saveRes.status} ${text}`);
      }

      console.log('✅ Comanda a fost salvată cu succes.');
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Error handling payment:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(200).json({ received: true });
}
