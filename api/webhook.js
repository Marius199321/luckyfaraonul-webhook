import Stripe from 'stripe';
import fetch from 'node-fetch';
import { buffer } from 'micro';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { sendZohoEmail } from '../utils/emailSender.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Stripe Webhook Invalid:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const {
      fullName,
      phone,
      email,
      address,
      country,
      productId,
      productName,
      qty
    } = session.metadata;

    console.log("🎯 Webhook: sesiune completă Stripe pentru", email);

    const orderNumber = generateOrderNumber();
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let tickets = [];
    let instantWins = [];

    try {
      const response = await fetch(`${process.env.WIX_BACKEND_URL}/savePurchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.WIX_FUNCTION_SECRET
        },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          address,
          country,
          productId,
          productName,
          qty: Number(qty),
          orderNumber,
          amount: session.amount_total / 100,
          currency: session.currency,
          createdDate: now,
          createdTime: formattedTime
        })
      });

      const result = await response.json();
      console.log("✅ Salvat în CMS:", result);

      if (result.result) {
        tickets = result.result.tickets || [];
        instantWins = result.result.instantWinners || [];
      }
    } catch (err) {
      console.error("❌ Eroare la salvarea în Wix CMS:", err.message);
    }

    try {
      await sendZohoEmail({
        email,
        fullName,
        phone,
        address,
        country,
        productName,
        orderNumber,
        amount: session.amount_total / 100,
        purchaseDate: now.toLocaleString('en-GB', { timeZone: 'Europe/London' }),
        tickets,
        instantWins
      });
      console.log("✅ Email trimis către:", email);
    } catch (err) {
      console.error("❌ Eroare la trimiterea emailului:", err.message);
    }
  }

  res.status(200).json({ received: true });
}



