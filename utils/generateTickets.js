import fetch from 'node-fetch';

export async function generateTickets(productId, qty, maxTickets) {
  try {
    console.log(`🎟️ Generare bilete: produs=${productId}, qty=${qty}, max=${maxTickets}`);

    let usedTickets = new Set();
    let hasMore = true;
    let skip = 0;
    const pageSize = 1000;

    // 🔁 1. Obține toate biletele deja folosite din CMS
    while (hasMore) {
      const res = await fetch(`${process.env.WIX_BACKEND_URL}/getUsedTickets?productId=${productId}&skip=${skip}&limit=${pageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': process.env.WIX_FUNCTION_SECRET
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Wix fetch error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const batch = data.usedTickets || [];
      batch.forEach(t => usedTickets.add(t));
      skip += pageSize;
      hasMore = batch.length === pageSize;
    }

    // 🔒 2. Verifică dacă mai ai loc pentru `qty`
    if (usedTickets.size + qty > maxTickets) {
      throw new Error(`❌ Nu mai sunt suficiente bilete libere (există ${usedTickets.size}, cerute ${qty}, max ${maxTickets}).`);
    }

    // 🎲 3. Generează bilete unice care nu sunt deja folosite
    const newTickets = new Set();
    while (newTickets.size < qty) {
      const n = Math.floor(Math.random() * maxTickets) + 1;
      if (!usedTickets.has(n) && !newTickets.has(n)) {
        newTickets.add(n);
      }
    }

    return Array.from(newTickets);

  } catch (err) {
    console.error("❌ Eroare la generarea biletelor:", err.message);
    throw err;
  }
}


