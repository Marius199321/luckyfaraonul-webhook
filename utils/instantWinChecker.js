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

    for (const ticketNumber of tickets) {
      // winMap are chei string, deci compară ca string:
      const prize = winMap[String(ticketNumber)];
      if (prize) {
        winners.push({ ticketNumber, prize });
        console.log(`[instantWinChecker] Bilet câștigător instant: #${ticketNumber}, premiu: ${prize}`);
      }
    }

    console.log(`[instantWinChecker] Total instant winners: ${winners.length}`);
    return winners;

  } catch (err) {
    console.error("❌ [instantWinChecker] Eroare la verificarea Instant Win:", err?.message || err);
    return [];
  }
}

