// api/generateTickets.js

function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 
 * @param {number} qty - număr de bilete de generat
 * @param {number} maxTickets - totalul biletelor posibile (ex: 80000)
 * @param {Array<number>} usedTickets - bilete deja alocate
 * @returns {Array<number>} - bilete unice generate
 */
export function generateTickets(qty, maxTickets, usedTickets) {
  const tickets = new Set();

  while (tickets.size < qty) {
    const random = generateRandomNumber(1, maxTickets);
    if (!usedTickets.includes(random)) {
      tickets.add(random);
    }
  }

  return Array.from(tickets);
}
