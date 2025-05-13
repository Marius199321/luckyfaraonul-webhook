import { sendZohoEmail } from '../utils/emailSender.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { generateTickets } from '../utils/generateTickets.js';
import { instantWinChecker } from '../utils/instantWinChecker.js';


export default async (req, res) => {
    const orderNumber = generateOrderNumber();
    const tickets = await generateTickets('demo-product', 5, 50000);
    const instantWins = instantWinChecker('demo-product', tickets);

    await sendZohoEmail({
        email: 'test@example.com', // SCHIMBĂ cu adresa ta reală de test
        fullName: 'John Tester',
        phone: '07123456789',
        address: '123 Test Street',
        country: 'UK',
        productName: 'Demo Giveaway Product',
        orderNumber,
        tickets,
        instantWins,
        amount: 9.95,
        purchaseDate: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
    });

    res.status(200).json({ success: true, orderNumber, tickets, instantWins });
};
