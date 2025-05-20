import fetch from 'node-fetch';

export async function generateTickets(productId, qty, maxTickets) {
  try {
    let usedTickets = [];
    let hasMore = true;
    let skip = 0;
    const pageSize = 1000;

    console.log(`🎟️ Generare bilete pentru produs ${productId}, qty: ${qty}, max: ${maxTickets}`);

    while (hasMore) {
      const response = await fetch(`${process.env.WIX_BACKEND_URL}/getUsedTickets?productId=${productId}&skip=${skip}&limit=${pageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': process.env.WIX_FUNCTION_SECRET
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Wix fetch error (status ${response.status}): ${errorText}`);
      }

      const { usedTickets: batch = [], total = 0 } = await response.json();
      usedTickets = usedTickets.concat(batch);

      skip += pageSize;
      hasMore = batch.length === pageSize;
    }

    if (usedTickets.length + qty > maxTickets) {
      throw new Error("❌ Nu mai sunt suficiente bilete disponibile pentru acest produs.");
    }

    const tickets = new Set();

    while (tickets.size < qty) {
      const num = Math.floor(Math.random() * maxTickets) + 1;
      if (!usedTickets.includes(num)) {
        tickets.add(num);
      }
    }

    return Array.from(tickets);

  } catch (err) {
    console.error("❌ Eroare la generarea biletelor:", err.message);
    throw err;
  }
}


