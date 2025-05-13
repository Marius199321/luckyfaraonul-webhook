export const generateTickets = async (productId, qty, maxTickets) => {
  const usedTickets = new Set();

  // Optional: Fetch from Wix if vrei să eviți dubluri reale

  const tickets = new Set();

  while (tickets.size < qty) {
    const ticket = Math.floor(Math.random() * maxTickets) + 1;
    if (!usedTickets.has(ticket)) {
      usedTickets.add(ticket);
      tickets.add(ticket);
    }
  }

  return Array.from(tickets);
};
