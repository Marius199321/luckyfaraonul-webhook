const response = await fetch(`${process.env.WIX_BACKEND_URL}/savePurchase`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': process.env.WIX_FUNCTION_SECRET
  },
  body: JSON.stringify({
    name: fullName, // ← corectăm cheia pentru Wix
    phone,
    email,
    address,
    country,
    productId,
    productName,
    qty: Number(qty),
    orderNumber,
    amount: session.amount_total / 100,
    currency: session.currency,
    createdDate: now,
    createdTime: formattedTime
  })
});





