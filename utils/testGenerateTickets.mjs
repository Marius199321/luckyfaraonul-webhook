import { generateTickets } from './generateTickets.js';

const mockProduct = {
  _id: 'test-product-123', // simulare ID real din CMS
  totalTickets: 50000
};

const qty = 100;

const tickets = await generateTickets(mockProduct._id, qty, mockProduct.totalTickets);

console.log(`🎟️ ${tickets.length} bilete generate pentru produsul ${mockProduct._id}:`);
console.log(tickets.slice(0, 10)); // primele 10

// Verificăm unicitatea
const unique = new Set(tickets);
if (unique.size !== tickets.length) {
  console.error("❌ Bilete duplicate!");
} else {
  console.log("✅ Toate biletele sunt unice.");
}

// Verificăm dacă biletele sunt în limita corectă
const inRange = tickets.every(ticket => ticket >= 1 && ticket <= mockProduct.totalTickets);
if (!inRange) {
  console.error("❌ Bilete în afara intervalului!");
} else {
  console.log(`✅ Toate biletele sunt între 1 și ${mockProduct.totalTickets}.`);
}
