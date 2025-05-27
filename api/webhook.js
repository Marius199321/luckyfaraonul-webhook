import Stripe from 'stripe';
import { buffer } from 'micro';
import axios from 'axios';
import generateTickets from '../utils/generateTickets.js';
import generateOrderNumber from '../utils/generateOrderNumber.js';
import instantWinChecker from '../utils/instantWinChecker.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  console.log("[Webhook] New request:", req.method, req.url);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
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
    return res.status(400).json({ success: false, error: `Webhook Error: ${err.message}` });
  }

  // Acceptă doar eventul corect
  if (event.type !== 'checkout.session.completed') {
    console.log('[Webhook] Ignorat event:', event.type);
    return res.status(200).json({ success: true, info: "Event type not handled (noop)" });
  }

  const session = event.data.object;
  if (session.payment_status !== 'paid') {
    return res.status(200).json({ success: false, error: 'Payment not completed' });
  }

  try {
    // Date relevante din sesiune
    const qty = session.metadata?.qty ? Number(session.metadata.qty) : 1;
    const productId = session.client_reference_id || session.metadata?.productId;
    const email = session.customer_email;
    const name = session.metadata?.name || '';
    const phone = session.metadata?.phone || '';
    const address = session.metadata?.address || '';
    const country = session.metadata?.country || '';
    const productName = session.metadata?.productName || '';
    const amount = session.amount_total / 100;
    const orderNumber = generateOrderNumber();

    // 1. Get used tickets
    let usedTickets = [];
    try {
      const usedRes = await axios.get(
        'https://www.luckyfaraonul.com/_functions/getUsedTickets',
        {
          params: { productId },
          headers: {
            Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}`
          }
        }
      );
      usedTickets = usedRes.data?.usedTickets || [];
    } catch (err) {
      return res.status(500).json({ success: false, error: "Eroare getUsedTickets", details: err.message });
    }

    // 2. Generate tickets
    let rawTickets = [];
    try {
      rawTickets = generateTickets(qty, usedTickets);
    } catch (err) {
      return res.status(500).json({ success: false, error: "Eroare generateTickets", details: err.message });
    }

    // 3. Instant Win check
    let instantWinners = [];
    try {
      instantWinners = await instantWinChecker(rawTickets, productId);
    } catch (err) {
      // Nu bloca flow-ul, doar log
      console.warn("[instantWinChecker] Error:", err.message);
    }

    // 4. Format tickets array
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

    // 5. Save tickets
    try {
      await axios.post(
        'https://www.luckyfaraonul.com/_functions/post_saveTickets',
        tickets,
        {
          headers: { Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}` }
        }
      );
    } catch (err) {
      return res.status(500).json({ success: false, error: "Eroare post_saveTickets", details: err.message });
    }

    // 6. Save purchase (no tickets array)
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

      await axios.post(
        'https://www.luckyfaraonul.com/_functions/post_savePurchase',
        purchasePayload,
        {
          headers: { Authorization: `Bearer ${process.env.WIX_FUNCTION_SECRET}` }
        }
      );
    } catch (err) {
      return res.status(500).json({ success: false, error: "Eroare post_savePurchase", details: err.message });
    }

    // Succes!
    return res.status(200).json({ success: true, received: true, orderNumber });
  } catch (error) {
    console.error("[Webhook] Fatal error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Internal Server Error", details: error?.message || error });
  }
}


















