// utils/instantWinChecker.js
import axios from 'axios';

export default function instantWinChecker(tickets, productId) {
  return axios
    .get(`https://www.luckyfaraonul.com/_functions/getInstantWinList?productId=${productId}`)
    .then((res) => {
      const winMap = res.data.instantWinMap || {};
      const winners = [];

      for (const ticket of tickets) {
        const prize = winMap[ticket.ticketNumber];
        if (prize) {
          ticket.isInstantWin = true;
          ticket.instantPrize = prize;
          winners.push({ ticketNumber: ticket.ticketNumber, prize });
        } else {
          ticket.isInstantWin = false;
          ticket.instantPrize = null;
        }
      }

      return winners;
    })
    .catch((err) => {
      console.error("❌ Eroare la verificarea Instant Win:", err);
      for (const ticket of tickets) {
        ticket.isInstantWin = false;
        ticket.instantPrize = null;
      }
      return [];
    });
}
