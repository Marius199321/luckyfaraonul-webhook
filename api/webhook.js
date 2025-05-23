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
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event;
  const buf = await buffer(req);

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status !== 'paid') {
      console.log('ℹ️ Payment not completed, skipping.');
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

      console.log("✅ Plată finalizată. Generare bilet...");
      console.log("🧾 Detalii:", { qty, productId, email, name });

      // 🔎 GET used tickets
      let usedTickets = [];
      try {
        const usedRes = await axios.get(
          `https://www.luckyfaraonul.com/_functions/get_getUsedTickets`,
          {
            params: { productId },
            headers: {
              Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
            }
          }
        );
        usedTickets = usedRes.data.usedTickets || [];
        console.log(`📦 ${usedTickets.length} bilete deja folosite.`);
      } catch (err) {
        console.error("❌ Eroare la get_getUsedTickets:", err?.response?.data || err.message);
        return res.status(500).json({ error: "Eroare get_getUsedTickets", details: err.message });
      }

      // 🎟️ Generează bilete și verifică câștigătorii instant
      const rawTickets = generateTickets(qty, usedTickets);
      const instantWinners = await instantWinChecker(rawTickets, productId);

      const tickets = rawTickets.map(ticketNumber => {
        const win = instantWinners.find(w => w.ticketNumber === ticketNumber);
        return {
          ticketNumber,
          productId,
          email,
          name,
          orderNumber,
          isInstantWin: !!win,
          instantPrize: win?.prize || null,
          createdAt: new Date().toISOString()
        };
      });

      console.log("📤 Trimitem", tickets.length, "bilete în Tickets");

      // 🧾 POST savePurchase
      try {
        await axios.post(
          'https://www.luckyfaraonul.com/_functions/post_savePurchase',
          {
            qty,
            productId,
            productName: '', // dacă vrei, caută numele cu un alt request
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
        console.log("✅ Detalii comandă salvate în post_savePurchase");
      } catch (err) {
        console.error("❌ Eroare la post_savePurchase:", err?.response?.data || err.message);
        return res.status(500).json({ error: "Eroare post_savePurchase", details: err.message });
      }

      // 🧾 POST saveTickets
      try {
        await axios.post(
          'https://www.luckyfaraonul.com/_functions/post_saveTickets',
          tickets,
          {
            headers: { Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}` }
          }
        );
        console.log("✅ Bilete salvate în colecția Tickets");
      } catch (err) {
        console.error("❌ Eroare la post_saveTickets:", err?.response?.data || err.message);
        return res.status(500).json({ error: "Eroare post_saveTickets", details: err.message });
      }

      return res.status(200).json({ received: true });

    } catch (error) {
      console.error("❌ Eroare finală în webhook:", error?.message || error);
      return res.status(500).send("Internal Server Error");
    }
  }

  res.status(200).end();
}















