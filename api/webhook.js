import Stripe from 'stripe';
import { buffer } from 'micro';
import { config as loadEnv } from 'dotenv';
import { generateTickets } from './generateTickets.js';
import { generateOrderNumber } from './generateOrderNumber.js';
import { checkInstantWin } from './instantWinChecker.js';

loadEnv();

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const wixBackendUrl = process.env.WIX_BACKEND_URL; // ex: https://www.luckyfaraonul.com/_functions

// ✅ Obține biletele deja folosite (GET, pentru http-functions.js din Wix)
async function getUsedTickets(productId) {
  const url = `${wixBackendUrl}/getUsedTickets?productId=${productId}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.usedTickets || [];
  } catch (err) {
    const text = await response.text?.();
    console.error("❌ Invalid JSON from getUsedTickets. Raw response:", text);
    throw new Error("Invalid JSON from getUsedTickets");
  }
}

// ✅ Trimite datele comenzii în Wix (savePurchase.jsw)
async function savePurchase(purchase) {
  try {
    const response = await fetch(`${wixBackendUrl}/savePurchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchase),
    });

    if (!response.ok) {
      const text = await response.text?.();
      console.error("❌ Failed to save purchase:", text);
      throw new Error("SavePurchase failed");
    }
  } catch (err) {
    console.error("❌ Error during savePurchase:", err);
    throw err;
  }
}

// ✅ Webhook Stripe – principal
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
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // ✅ Date din Stripe
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

    // ✅ Generează bilete
    const maxTickets = 80000;
    const usedTickets = await getUsedTickets(productId);
    const generatedTickets = generateTickets(qty, maxTickets, usedTickets);
    const orderNumber = generateOrderNumber();

    // ✅ Verificare instant win
    const instantPrizes = [
      { number: 1234, prize: 'Win £1000' },
      { number: 8888, prize: 'Win £500' }
    ];
    const instantWinners = checkInstantWin(generatedTickets, instantPrizes);

    // ✅ Salvează comanda
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

    console.log("✅ Purchase saved successfully:", orderNumber);
  }

  res.status(200).send('Received');
}
