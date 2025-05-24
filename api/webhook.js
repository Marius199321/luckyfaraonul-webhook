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
  let buf;
  try {
    buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    console.log("✅ Webhook signature verified.");
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status !== 'paid') {
      console.log('Payment not completed, skipping.');
      return res.status(200).end();
    }

    try {
      // Extrage datele necesare
      const qty = session.metadata?.qty ? Number(session.metadata.qty) : (session.amount_total / session.amount_subtotal); // fallback
      const productId = session.client_reference_id || session.metadata?.productId;
      const email = session.customer_email;
      const name = session.metadata?.name || '';
      const phone = session.metadata?.phone || '';
      const address = session.metadata?.address || '';
      const country = session.metadata?.country || '';
      const productName = session.metadata?.productName || '';
      const amount = session.amount_total / 100;
      const orderNumber = generateOrderNumber();

      // STEP 4: Ia biletele deja folosite
      let usedTickets = [];
      try {
        const usedRes = await axios.get(
          `https://www.luckyfaraonul.com/_functions/getUsedTickets`,
          {
            params: { productId },
            headers: {
              Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
            }
          }
        );
        usedTickets = usedRes.data?.usedTickets || [];
        console.log(`[getUsedTickets] Bilete deja folosite: ${usedTickets.length}`);
      } catch (err) {
        console.error("[getUsedTickets] Eroare:", err?.response?.data || err.message, "ProductId:", productId);
        return res.status(500).json({ error: "Eroare getUsedTickets", details: err.message });
      }

      // STEP 5: Generează bilete UNICE random
      let rawTickets = [];
      try {
        rawTickets = generateTickets(qty, usedTickets);
        console.log(`[generateTickets] Bilete generate:`, rawTickets);
      } catch (err) {
        console.error("[generateTickets] Eroare:", err.message);
        return res.status(500).json({ error: "Eroare generateTickets", details: err.message });
      }

      // STEP 6: InstantWin (prize map)
      let instantWinners = [];
      try {
        instantWinners = await instantWinChecker(rawTickets, productId);
        console.log(`[instantWinChecker] Instant winners:`, instantWinners);
      } catch (err) {
        console.warn("[instantWinChecker] Eroare la instantWinChecker:", err.message);
        // Nu bloca flow-ul dacă nu e instant win
      }

      // STEP 7: Pregătește array-ul de bilete pentru Tickets
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

      // STEP 8: Salvează biletele în Tickets
      try {
        const resp = await axios.post(
          'https://www.luckyfaraonul.com/_functions/post_saveTickets',
          tickets,
          {
            headers: { Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}` }
          }
        );
        console.log(`[post_saveTickets] Bilete salvate:`, resp.data);
      } catch (err) {
        console.error("[post_saveTickets] Eroare:", err?.response?.data || err.message);
        return res.status(500).json({ error: "Eroare post_saveTickets", details: err.message });
      }

      // STEP 9: Salvează comanda în TicketsPurchases (FĂRĂ array de bilete)
      try {
        const purchasePayload = {
          qty,
          productId,
          productName,
          amount,
          email,
          name,
          phone,
          address,
          country,
          orderNumber,
          instantWinnersCount: instantWinners.length,
          createdDate: new Date().toLocaleDateString('en-GB'),
          createdTime: new Date().toLocaleTimeString('en-GB')
        };

        const resp = await axios.post(
          'https://www.luckyfaraonul.com/_functions/post_savePurchase',
          purchasePayload,
          {
            headers: { Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}` }
          }
        );
        console.log("[post_savePurchase] Comandă salvată:", resp.data);
      } catch (err) {
        console.error("[post_savePurchase] Eroare:", err?.response?.data || err.message);
        return res.status(500).json({ error: "Eroare post_savePurchase", details: err.message });
      }

      // TOTUL OK!
      console.log("[Webhook] Flow complet salvat cu succes pentru orderNumber:", orderNumber);
      return res.status(200).json({ received: true });

    } catch (error) {
      console.error("[Webhook] Eroare generală în webhook:", error?.message || error);
      return res.status(500).send("Internal Server Error");
    }
  }

  // Pentru alte tipuri de evenimente
  res.status(200).end();
}
















