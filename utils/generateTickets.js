import fetch from 'node-fetch';

export async function generateTickets(productId, qty, maxTickets) {
  try {
    const usedTickets = [];
    let hasMore = true;
    let skip = 0;
    const pageSize = 1000;

    // 🔁 Loop prin toate paginile (în caz că ai mai mult de 1000 bilete deja vândute)
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
      usedTickets.push(...batch);

      skip += pageSize;
      hasMore = usedTickets.length < total;
    }

    // 🎟️ Generează bilete unice
    const tickets = [];
    while (tickets.length < qty) {
      const num = Math.floor(Math.random() * maxTickets) + 1;
      if (!usedTickets.includes(num) && !tickets.includes(num)) {
        tickets.push(num);
      }
    }

    return tickets;

  } catch (err) {
    console.error("❌ Eroare la generarea biletelor:", err.message);
    throw err;
  }
}
