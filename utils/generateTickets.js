// utils/generateTickets.js

export default function generateTickets(qty, usedTickets = [], maxTickets = 80000) {
  const generated = new Set(usedTickets.map(Number));
  const tickets = [];

  while (tickets.length < qty) {
    const random = Math.floor(Math.random() * maxTickets) + 1;
    if (!generated.has(random)) {
      generated.add(random);
      tickets.push({ ticketNumber: random });
    }
  }

  return tickets;
}




