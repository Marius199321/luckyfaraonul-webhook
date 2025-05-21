import fetch from 'node-fetch';

export async function generateTickets(productId, qty, maxTickets = 50000) {
  try {
    if (!productId || !qty || qty <= 0) {
      throw new Error("Parametri invalizi pentru generarea biletelor.");
    }

    console.log(`🎟️ Generare bilete pentru produs=${productId} | qty=${qty} | max=${maxTickets}`);

    let usedTickets = new Set();
    let hasMore = true;
    let skip = 0;
    const pageSize = 1000;

    // 🔁 1. Obține toate biletele deja folosite din CMS
    while (hasMore) {
      const res = await fetch(`${process.env.WIX_BACKEND_URL}/_functions/get_getUsedTickets?productId=${productId}&skip=${skip}&limit=${pageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.WIX_FUNCTION_SECRET}`
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Wix fetch error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const batch = data.usedTickets || [];
      batch.forEach(t => usedTickets.add(Number(t))); // Convertim în numere
      skip += pageSize;
      hasMore = batch.length === pageSize;
    }

    // 🔒 2. Verifică dacă mai sunt suficiente bilete
    if (usedTickets.size + qty > maxTickets) {
      throw new Error(`❌ Nu sunt destule bilete disponibile. Există ${usedTickets.size}, cerute ${qty}, max ${maxTickets}`);
    }

    // 🎲 3. Generează bilete unice, fail-safe
    const newTickets = new Set();
    let attempts = 0;
    const maxAttempts = qty * 10;

    while (newTickets.size < qty && attempts < maxAttempts) {
      const n = Math.floor(Math.random() * maxTickets) + 1;
      if (!usedTickets.has(n) && !newTickets.has(n)) {
        newTickets.add(n);
      }
      attempts++;
    }

    if (newTickets.size < qty) {
      throw new Error("Nu s-au putut genera toate biletele. Încearcă din nou.");
    }

    console.log(`✅ ${newTickets.size} bilete generate`);
    return Array.from(newTickets); // sau `.map(n => n.toString())` dacă ai nevoie de stringuri

  } catch (err) {
    console.error("❌ Eroare la generarea biletelor:", err.message);
    throw new Error("Eroare la generateTickets: " + err.message);
  }
}



