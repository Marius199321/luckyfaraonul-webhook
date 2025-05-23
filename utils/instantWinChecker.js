import axios from 'axios';

export default async function instantWinChecker(tickets, productId) {
  console.log(`[instantWinChecker] Pornit pentru productId: ${productId}, ${tickets.length} bilete.`);

  try {
    const res = await axios.get(`https://www.luckyfaraonul.com/_functions/getInstantWinList?productId=${productId}`);
    const winMap = res.data.instantWinMap || {};
    const winners = [];

    if (!winMap || typeof winMap !== 'object') {
      console.warn("[instantWinChecker] instantWinMap invalid:", winMap);
    }

    for (const ticket of tickets) {
      const prize = winMap[ticket.ticketNumber];
      if (prize) {
        ticket.isInstantWin = true;
        ticket.instantPrize = prize;
        winners.push({ ticketNumber: ticket.ticketNumber, prize });
        console.log(`[instantWinChecker] Bilet câștigător instant: #${ticket.ticketNumber}, premiu: ${prize}`);
      } else {
        ticket.isInstantWin = false;
        ticket.instantPrize = null;
      }
    }

    console.log(`[instantWinChecker] Total instant winners: ${winners.length}`);
    return winners;

  } catch (err) {
    console.error("❌ [instantWinChecker] Eroare la verificarea Instant Win:", err?.message || err);
    for (const ticket of tickets) {
      ticket.isInstantWin = false;
      ticket.instantPrize = null;
    }
    return [];
  }
}
