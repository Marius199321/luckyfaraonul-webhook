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

  // Stripe signature validation
  const sig = req.headers['stripe-signature'];
  let event, buf;
  try {
    buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    console.log("✅ Webhook signature verified.");
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ success: false, error: `Webhook Error: ${err.message}` });
  }

  // Accept only correct event
  if (event.type !== 'checkout.session.completed') {
    console.log('[Webhook] Event ignored:', event.type);
    return res.status(200).json({ success: true, info: "Event type not handled (noop)" });
  }

  const session = event.data.object;
  if (session.payment_status !== 'paid') {
    return res.status(200).json({ success: false, error: 'Payment not completed' });
  }

  // Get data from session
  const qty = Number(session.metadata?.qty || 1);
  const productId = session.client_reference_id || session.metadata?.productId;
  const email = session.customer_email;
  const name = session.metadata?.name || '';
  const phone = session.metadata?.phone || '';
  const address = session.metadata?.address || '';
  const country = session.metadata?.country || '';
  const productName = session.metadata?.productName || '';
  const amount = session.amount_total ? session.amount_total / 100 : 0;
  const orderNumber = generateOrderNumber();

  // Fail safe: check for productId
  if (!productId) {
    console.error("[Webhook] Missing productId from session");
    return res.status(400).json({ success: false, error: "Missing productId in Stripe session." });
  }

  try {
    // 1. Get used tickets
    let usedTickets = [];
    try {
      const postBody = {
        productId,
        secret: (process.env.FUNCTION_SECRET || "").trim()
      };
      console.log("[Webhook] Trimit request la getUsedTickets:", postBody);

      const usedRes = await axios.post(
        'https://www.luckyfaraonul.com/_functions/getUsedTickets',
        postBody,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000
        }
      );

      console.log("[Webhook] Raspuns primit de la getUsedTickets:", {
        status: usedRes.status,
        data: usedRes.data
      });

      if (!usedRes.data?.success) {
        console.error("[Webhook] getUsedTickets NU a returnat success:", usedRes.data);
        throw new Error(usedRes.data?.error || "Unknown error from getUsedTickets");
      }
      usedTickets = usedRes.data.usedTickets || [];
    } catch (err) {
      console.error("[Webhook] Error in getUsedTickets:", {
        message: err.message,
        responseData: err?.response?.data,
        status: err?.response?.status
      });
      return res.status(500).json({
        success: false,
        error: "Error getting used tickets",
        details: err.message,
        extra: err?.response?.data
      });
    }

    // 2. Generate tickets (must be unique)
    let rawTickets = [];
    try {
      rawTickets = generateTickets(qty, usedTickets);
      if (!Array.isArray(rawTickets) || rawTickets.length !== qty) throw new Error("generateTickets did not return correct number of tickets");
    } catch (err) {
      console.error("[Webhook] Error in generateTickets:", err.message);
      return res.status(500).json({ success: false, error: "Error generating tickets", details: err.message });
    }

    // 3. Check for Instant Win
    let instantWinners = [];
    try {
      instantWinners = await instantWinChecker(rawTickets, productId);
    } catch (err) {
      console.warn("[Webhook] instantWinChecker error:", err.message);
      // Don't block the flow if Instant Win fails
    }

    // 4. Format ticket objects
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

    // 5. Save tickets in Wix
    try {
      const saveTicketsRes = await axios.post(
        'https://www.luckyfaraonul.com/_functions/post_saveTickets',
        {
          tickets,
          secret: (process.env.FUNCTION_SECRET || "").trim()
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000
        }
      );
      if (!saveTicketsRes.data?.success) throw new Error(saveTicketsRes.data?.error || "Unknown error from post_saveTickets");
    } catch (err) {
      console.error("[Webhook] Error in post_saveTickets:", err?.response?.data || err.message);
      return res.status(500).json({ success: false, error: "Error saving tickets", details: err.message });
    }

    // 6. Save purchase in Wix
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
        createdTime: new Date().toLocaleTimeString('en-GB'),
        secret: (process.env.FUNCTION_SECRET || "").trim()
      };

      const savePurchaseRes = await axios.post(
        'https://www.luckyfaraonul.com/_functions/post_savePurchase',
        purchasePayload,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000
        }
      );
      if (!savePurchaseRes.data?.success) throw new Error(savePurchaseRes.data?.error || "Unknown error from post_savePurchase");
    } catch (err) {
      console.error("[Webhook] Error in post_savePurchase:", err?.response?.data || err.message);
      return res.status(500).json({ success: false, error: "Error saving purchase", details: err.message });
    }

    // Success!
    console.log("[Webhook] Order completed and saved for orderNumber:", orderNumber);
    return res.status(200).json({ success: true, received: true, orderNumber });
  } catch (error) {
    console.error("[Webhook] Fatal error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Internal Server Error", details: error?.message || error });
  }
}



















