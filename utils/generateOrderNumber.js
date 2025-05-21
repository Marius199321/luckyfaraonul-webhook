// Generează un sufix aleatoriu din caractere sigure pentru citire
function generateRandomSuffix(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // fără 0, 1, O, I
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generează un cod de comandă unic, ex: LF-20250521-AB3K8Z4M
export function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const suffix = generateRandomSuffix();
  return `LF-${datePart}-${suffix}`;
}

