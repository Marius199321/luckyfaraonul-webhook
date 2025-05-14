// utils/testGenerateOrderNumbers.mjs

import { generateOrderNumber } from './generateOrderNumber.js';

const generated = new Set();
let hasDuplicates = false;

for (let i = 0; i < 10; i++) {
  const order = generateOrderNumber();
  console.log(`Generated: ${order}`);

  if (generated.has(order)) {
    console.error(`❌ Duplicate found: ${order}`);
    hasDuplicates = true;
  } else {
    generated.add(order);
  }
}

if (!hasDuplicates) {
  console.log("✅ All order numbers are unique.");
}
