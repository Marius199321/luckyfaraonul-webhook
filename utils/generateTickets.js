export default function generateTickets(qty, usedTickets = [], maxTickets = 80000) {
  console.log(`[generateTickets] Cerute: ${qty}, Bilete ocupate: ${usedTickets.length}, Maxim: ${maxTickets}`);

  if (qty > maxTickets - usedTickets.length) {
    const msg = `[generateTickets] Nu există suficiente bilete libere! Cerute: ${qty}, Libere: ${maxTickets - usedTickets.length}`;
    console.error(msg);
    throw new Error(msg);
  }

  const generated = new Set(usedTickets.map(Number));
  const tickets = [];

  while (tickets.length < qty) {
    const random = Math.floor(Math.random() * maxTickets) + 1;
    if (!generated.has(random)) {
      generated.add(random);
      tickets.push({ ticketNumber: random });
    }
  }

  console.log(`[generateTickets] Bilete generate:`, tickets.map(t => t.ticketNumber));
  return tickets;
}




