// test-endpoint.js
async function testCreateCheckoutSession() {
  const response = await fetch("https://luckyfaraonul-webhook.vercel.app/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://www.luckyfaraonul.com"
    },
    body: JSON.stringify({
      name: "Test User",
      phone: "+40000000000",
      email: "test@example.com",
      address: "Test Address 123",
      country: "UK",
      productId: "test-product-id",
      productName: "Test Product",
      qty: 1,
      stripePriceId: "price_test123" // asigură-te că e unul valid
    })
  });

  const data = await response.json();
  console.log("✅ Rezultat test:", data);
}

testCreateCheckoutSession().catch(err => {
  console.error("❌ Eroare în test:", err);
});
