// webhook.js
import Stripe from 'stripe';
import { buffer } from 'micro';
import axios from 'axios';
import generateTickets from '../utils/generateTickets.js';
import generateOrderNumber from '../utils/generateOrderNumber.js';
import instantWinChecker from '../utils/instantWinChecker.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  let event;
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status !== 'paid') {
      console.log('ℹ️ Payment not completed. Skipping.');
      return res.status(200).end();
    }

    try {
      const {
        quantity: qty,
        client_reference_id: productId,
        customer_details,
        amount_total
      } = session;

      const email = customer_details.email;
      const name = customer_details.name;
      const phone = customer_details.phone;
      const address = customer_details.address?.line1 || '';
      const country = customer_details.address?.country || '';
      const orderNumber = generateOrderNumber();

      console.log('✅ Plată confirmată. Începem generarea datelor.');

      const usedTicketsRes = await axios.get(
        `https://www.luckyfaraonul.com/_functions/get_getUsedTickets?productId=${productId}`,
        { headers: { Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}` } }
      );

      const usedTickets = usedTicketsRes.data.usedTickets || [];

      const tickets = generateTickets(qty, usedTickets);
      const instantWinners = instantWinChecker(tickets, productId);

      const savePurchaseRes = await axios.post(
        'https://www.luckyfaraonul.com/_functions/post_savePurchase',
        {
          qty,
          productId,
          productName: '', // completat la nevoie
          amount: amount_total / 100,
          email,
          name,
          phone,
          address,
          country,
          orderNumber,
          tickets,
          instantWinners,
          createdDate: new Date().toLocaleDateString('en-GB'),
          createdTime: new Date().toLocaleTimeString('en-GB')
        },
        {
          headers: { Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}` }
        }
      );

      const saveTicketsRes = await axios.post(
        'https://www.luckyfaraonul.com/_functions/post_saveTickets',
        tickets,
        {
          headers: { Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}` }
        }
      );

      console.log('✅ Comandă și bilete salvate cu succes în Wix.');

      return res.status(200).json({ received: true });

    } catch (error) {
      console.error('❌ Eroare în procesarea webhook-ului:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  res.status(200).end();
}











