import fetch from 'node-fetch';

export async function instantWinChecker(productId, tickets) {
  try {
    if (!Array.isArray(tickets) || tickets.length === 0) {
      console.warn("⚠️ Lista de bilete este goală sau invalidă.");
      return [];
    }

    const res = await fetch(`${process.env.WIX_BACKEND_URL}/getInstantWinList?productId=${productId}`, {
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
    const winMap = data.instantWinMap || {};

    const winners = tickets
      .filter(t => winMap.hasOwnProperty(t.toString()))
      .map(t => ({ ticketNumber: t, prize: winMap[t.toString()] }));

    return winners;

  } catch (err) {
    console.error(`❌ Eroare instantWinChecker pentru produs ${productId}:`, err.message);
    return [];
  }
}

