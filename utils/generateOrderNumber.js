// utils/generateOrderNumber.js

export default function generateOrderNumber(prefix = "ORD") {
  const now = new Date();
  const datePart = now.toISOString().split("T")[0].replace(/-/g, "");
  const randomPart = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${datePart}-${randomPart}`;
}