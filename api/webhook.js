import Stripe from 'stripe';
import { generateOrderNumber } from '../utils/generateOrderNumber';
import { generateTickets } from '../utils/generateTickets';
import { sendZohoEmail } from '../utils/emailSender'; // ✅ redenumit corect
import { instantWinChecker } from '../utils/instantWinChecker';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const {
            fullName, phone, address, country,
            productId, productName, qty
        } = session.metadata;

        const orderNumber = generateOrderNumber();
        const tickets = await generateTickets(productId, Number(qty), 50000); // total bilete per produs

        const instantWins = instantWinChecker(productId, tickets); // Verifică instant win

        await sendZohoEmail({
            email: session.customer_email,
            fullName,
            phone,
            address,
            country,
            productName,
            orderNumber,
            tickets,
            instantWins,
            amount: session.amount_total / 100,
            purchaseDate: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
        });

        // Aici poți salva în Wix CMS dacă vrei.
    }

    res.status(200).json({ received: true });
};
