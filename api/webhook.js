import Stripe from 'stripe';
import fetch from 'node-fetch';
import { buffer } from 'micro';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { sendZohoEmail } from '../utils/emailSender.js';
import { generateTickets } from '../utils/generateTickets.js';
import { instantWinChecker } from '../utils/instantWinChecker.js';

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
      name,
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

    // 📦 1. Salvează comanda în CMS (fără bilete)
    try {
      await fetch(`${process.env.WIX_BACKEND_URL}/savePurchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.WIX_FUNCTION_SECRET
        },
        body: JSON.stringify({
          name,
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
      console.log("✅ Comanda salvată în TicketsPurchases");
    } catch (err) {
      console.error("❌ Eroare la salvarea comenzii:", err.message);
    }

    // 📥 2. Preluăm detalii din colecția giveaways
    let giveawayDetails = {};
    try {
      const giveawayResponse = await fetch(`${process.env.WIX_BACKEND_URL}/getGiveawayDetails?productId=${productId}`, {
        method: 'GET',
        headers: {
          'Authorization': process.env.WIX_FUNCTION_SECRET
        }
      });

      if (!giveawayResponse.ok) {
        const errText = await giveawayResponse.text();
        throw new Error(`❌ Eroare la preluarea detaliilor produsului: ${errText}`);
      }

      giveawayDetails = await giveawayResponse.json();
      console.log("🎁 Detalii giveaway:", giveawayDetails);
    } catch (err) {
      console.error("❌ Eroare la preluare din CMS:", err.message);
    }

    // 🎟️ 3. Generează biletele
    let generatedTickets = [];
    try {
      const maxTickets = giveawayDetails.totalTickets || 50000;
      generatedTickets = await generateTickets(productId, Number(qty), maxTickets);
      console.log(`🎟️ ${generatedTickets.length} bilete generate`);
    } catch (err) {
      console.error("❌ Eroare la generarea biletelor:", err.message);
      return res.status(500).json({ error: "Ticket generation failed" });
    }

    // 🏆 4. Verifică instant win
    let instantWinners = [];
    try {
      instantWinners = await instantWinChecker(productId, generatedTickets);
      console.log(`🏆 ${instantWinners.length} bilete câștigătoare instant`);
    } catch (err) {
      console.error("❌ Eroare la verificarea instant win:", err.message);
    }

    // 💾 5. Salvează în colecția Tickets
    try {
      const ticketsPayload = generatedTickets.map(ticketNumber => {
        const isWinner = instantWinners.includes(ticketNumber);
        return {
          ticketNumber,
          orderNumber,
          productId,
          email,
          name,
          isInstantWin: isWinner,
          instantPrize: isWinner ? giveawayDetails.instantPrize : null,
          createdAt: new Date().toISOString()
        };
      });

      await fetch(`${process.env.WIX_BACKEND_URL}/saveTickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.WIX_FUNCTION_SECRET
        },
        body: JSON.stringify(ticketsPayload)
      });

      console.log(`✅ ${ticketsPayload.length} bilete salvate în Tickets`);
    } catch (err) {
      console.error("❌ Eroare la salvarea biletelor:", err.message);
    }

    // ✉️ 6. Trimite email
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

      console.log("✅ Email trimis către:", email);
    } catch (err) {
      console.error("❌ Eroare la trimiterea emailului:", err.message);
    }
  }

  res.status(200).json({ received: true });
}








