import Stripe from 'stripe';
import fetch from 'node-fetch';
import { buffer } from 'micro';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { sendZohoEmail } from '../utils/emailSender.js';
import { generateTickets } from '../utils/generateTickets.js';

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

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const metadata = session.metadata || {};
  const qty = Number(metadata.qty || 0);
  const now = new Date();
  const orderNumber = generateOrderNumber();

  const { name, phone, email, address, country, productId, productName } = metadata;

  console.log("🎯 Stripe session completă pentru", email);

  // 🔹 1. Salvează comanda
  try {
    await fetch(`${process.env.WIX_BACKEND_URL}/savePurchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.WIX_FUNCTION_SECRET
      },
      body: JSON.stringify({
        name, phone, email, address, country,
        productId, productName,
        qty, orderNumber,
        amount: session.amount_total / 100,
        currency: session.currency,
        createdDate: now,
        createdTime: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      })
    });
    console.log("✅ Comanda salvată în TicketsPurchases");
  } catch (err) {
    console.error("❌ Eroare la salvarea comenzii:", err.message);
  }

  // 🔹 2. Preia detalii giveaway
  let giveawayDetails = {};
  try {
    const res = await fetch(`${process.env.WIX_BACKEND_URL}/getGiveawayDetails?productId=${productId}`, {
      method: 'GET',
      headers: { Authorization: process.env.WIX_FUNCTION_SECRET }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GET giveawayDetails: ${res.status} - ${errText}`);
    }

    giveawayDetails = await res.json();

    if (!giveawayDetails || typeof giveawayDetails !== 'object') {
      throw new Error("❌ Răspunsul de la getGiveawayDetails este gol sau invalid.");
    }

    console.log("🎁 Detalii giveaway:", giveawayDetails);

  } catch (err) {
    console.error("❌ Eroare la preluare giveaway:", err.message);
    return res.status(500).json({ error: "Eroare la preluarea detaliilor produsului" });
  }

  // 🔹 3. Generează bilete
  let generatedTickets = [];
  try {
    const maxTickets = giveawayDetails.totalTickets || 50000;
    generatedTickets = await generateTickets(productId, qty, maxTickets);
    console.log(`🎟️ ${generatedTickets.length} bilete generate`);
  } catch (err) {
    console.error("❌ Eroare generare bilete:", err.message);
    return res.status(500).json({ error: "Ticket generation failed" });
  }

  // 🔹 4. Verificare câștig instant
  const instantMap = giveawayDetails.instantWinMap || {};
  const instantWinners = generatedTickets
    .filter(ticket => instantMap[ticket])
    .map(ticket => ({
      ticketNumber: ticket,
      prize: instantMap[ticket]
    }));

  console.log(`🏆 ${instantWinners.length} câștiguri instant`);

  // 🔹 5. Pregătire salvare bilete
  const ticketsPayload = generatedTickets.map(ticketNumber => {
    const match = instantWinners.find(w => w.ticketNumber === ticketNumber);
    return {
      ticketNumber,
      orderNumber,
      productId,
      email,
      name,
      isInstantWin: !!match,
      instantPrize: match ? match.prize : null,
      createdAt: now.toISOString()
    };
  });

  try {
    await fetch(`${process.env.WIX_BACKEND_URL}/saveTickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.WIX_FUNCTION_SECRET
      },
      body: JSON.stringify(ticketsPayload)
    });
    console.log(`✅ ${ticketsPayload.length} bilete salvate`);
  } catch (err) {
    console.error("❌ Eroare salvare bilete:", err.message);
  }

  // 🔹 6. Trimite email
  try {
    await sendZohoEmail({
      email,
      name,
      phone,
      address,
      country,
      productName,
      orderNumber,
      amount: session.amount_total / 100,
      purchaseDate: now.toLocaleString('en-GB', { timeZone: 'Europe/London' }),
      tickets: generatedTickets,
      instantWinners
    });
    console.log("✅ Email trimis la:", email);
  } catch (err) {
    console.error("❌ Eroare email:", err.message);
  }

  res.status(200).json({ received: true });
}








