// api/helpers/generateOrderNumber.js

/**
 * Generează un order number unic în formatul: ORD-YYYYMMDD-ABC123
 * Exemplu: ORD-20250510-XZK384
 */

function generateRandomSuffix(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ''); // ex: 20250510
  const suffix = generateRandomSuffix();
  return `ORD-${datePart}-${suffix}`;
}
