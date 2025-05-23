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
    console.error("❌ [STEP 0] Method not allowed:", req.method);
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event;
  const buf = await buffer(req);

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    console.log("✅ [STEP 1] Webhook signature verified.");
  } catch (err) {
    console.error('❌ [STEP 1] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status !== 'paid') {
      console.log('[STEP 2] Payment not completed, skipping.');
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

      console.log("[STEP 3] Detalii sesiune Stripe:", { qty, productId, email, name, phone });

      // STEP 4: GET used tickets
      let usedTickets = [];
      try {
        console.log("[STEP 4] Cerere bilete deja folosite către getUsedTickets pentru productId:", productId);
        const usedRes = await axios.get(
          `https://www.luckyfaraonul.com/_functions/getUsedTickets`,
          {
            params: { productId },
            headers: {
              Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
            }
          }
        );
        usedTickets = usedRes.data || [];
        console.log(`[STEP 4] ${usedTickets.length} bilete deja folosite găsite.`);
      } catch (err) {
        console.error("[STEP 4] Eroare la getUsedTickets:", err?.response?.data || err.message, "ProductId:", productId);
        return res.status(500).json({ error: "Eroare getUsedTickets", details: err.message });
      }

      // STEP 5: Generate tickets
      let rawTickets = [];
      try {
        rawTickets = generateTickets(qty, usedTickets);
        console.log(`[STEP 5] ${rawTickets.length} bilete generate random:`, rawTickets);
      } catch (err) {
        console.error("[STEP 5] Eroare la generarea biletelor:", err.message);
        return res.status(500).json({ error: "Eroare generateTickets", details: err.message });
      }

      // STEP 6: Instant win check
      let instantWinners = [];
      try {
        instantWinners = await instantWinChecker(rawTickets, productId);
        console.log(`[STEP 6] ${instantWinners.length} instant winners identificați:`, instantWinners);
      } catch (err) {
        console.error("[STEP 6] Eroare la instantWinChecker:", err.message);
        // Continui, nu este fatal
      }

      // STEP 7: Formatez array-ul de bilete pentru Tickets
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

      // STEP 8: Salvez TOATE biletele în Tickets
      try {
        console.log(`[STEP 8] Trimit POST cu ${tickets.length} bilete către post_saveTickets.jsw`);
        const resp = await axios.post(
          'https://www.luckyfaraonul.com/_functions/post_saveTickets',
          tickets,
          {
            headers: { Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}` }
          }
        );
        console.log(`[STEP 8] Bilete salvate cu succes în Tickets. Răspuns:`, resp.data);
      } catch (err) {
        console.error("[STEP 8] Eroare la post_saveTickets:", err?.response?.data || err.message);
        return res.status(500).json({ error: "Eroare post_saveTickets", details: err.message });
      }

      // STEP 9: Salvez doar comanda în TicketsPurchases (FĂRĂ bilete)
      try {
        const purchasePayload = {
          qty,
          productId,
          productName: '', // Opțional, caută numele cu alt request dacă vrei
          amount: amount_total / 100,
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
        console.log("[STEP 9] Trimit POST către post_savePurchase.jsw cu:", purchasePayload);

        const resp = await axios.post(
          'https://www.luckyfaraonul.com/_functions/post_savePurchase',
          purchasePayload,
          {
            headers: { Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}` }
          }
        );
        console.log("[STEP 9] Comandă salvată în TicketsPurchases. Răspuns:", resp.data);
      } catch (err) {
        console.error("[STEP 9] Eroare la post_savePurchase:", err?.response?.data || err.message);
        return res.status(500).json({ error: "Eroare post_savePurchase", details: err.message });
      }

      // STEP 10: GATA!
      console.log("[STEP 10] Flow finalizat cu succes pentru orderNumber:", orderNumber);

      return res.status(200).json({ received: true });

    } catch (error) {
      console.error("[FINAL] Eroare fatală în webhook:", error?.message || error);
      return res.status(500).send("Internal Server Error");
    }
  }

  res.status(200).end();
}
















