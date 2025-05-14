import Stripe from 'stripe';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { generateTickets } from '../utils/generateTickets.js';
import { instantWinChecker } from '../utils/instantWinChecker.js';
import { sendZohoEmail } from '../utils/emailSender.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { fullName, phone, email, address, country, productId, productName, qty } = session.metadata;

    const orderNumber = generateOrderNumber();
    const tickets = await generateTickets(productId, Number(qty), 50000);
    const instantWins = instantWinChecker(productId, tickets);

    // ✅ Obținem data și ora în format corect pentru CMS
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    try {
      await fetch(`${process.env.WIX_BACKEND_URL}/savePurchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          address,
          country,
          productId,
          productName,
          qty: Number(qty),
          generatedTickets: tickets,
          instantWinners: instantWins,
          orderNumber,
          amount: session.amount_total / 100,
          currency: session.currency,
          createdDate: now,             // 📅 tip Date — pentru câmpul de tip Date
          createdTime: timeFormatted    // 🕒 tip Text — pentru câmpul de tip Text
        })
      });
    } catch (err) {
      console.error("❌ Eroare la salvarea în CMS Wix:", err);
    }

    try {
      await sendZohoEmail({
        email, fullName, phone, address, country,
        productName, orderNumber, tickets, instantWins,
        amount: session.amount_total / 100,
        purchaseDate: now.toLocaleString('en-GB', { timeZone: 'Europe/London' })
      });
    } catch (err) {
      console.error("❌ Eroare la trimiterea emailului:", err);
    }
  }

  res.status(200).json({ received: true });
}


