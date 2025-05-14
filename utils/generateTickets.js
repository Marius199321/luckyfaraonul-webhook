// utils/generateTickets.js
import { getUsedTicketNumbers } from './getUsedTicketNumbers.js'; // ✅ Import adăugat

export async function generateTickets(productId, qty, totalTickets) {
  const usedNumbers = await getUsedTicketNumbers(productId); // ✅ primește deja biletele folosite
  const generated = new Set();

  while (generated.size < qty) {
    const num = Math.floor(Math.random() * totalTickets) + 1;
    if (!usedNumbers.includes(num) && !generated.has(num)) {
      generated.add(num);
    }
  }

  return Array.from(generated);
}

