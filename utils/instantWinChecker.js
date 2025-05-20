import fetch from 'node-fetch';

export async function instantWinChecker(productId, tickets) {
  try {
    const response = await fetch(`${process.env.WIX_BACKEND_URL}/getInstantWinList?productId=${productId}`, {
      method: 'GET',
      headers: {
        'Authorization': process.env.WIX_FUNCTION_SECRET
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Wix fetch error (status ${response.status}): ${errorText}`);
    }

    const { instantWinList = [] } = await response.json();

    if (!Array.isArray(instantWinList)) {
      console.warn("⚠️ instantWinList nu este array valid");
      return [];
    }

    const winningTickets = tickets.filter(ticket => instantWinList.includes(ticket));
    return winningTickets;

  } catch (err) {
    console.error("❌ Eroare la verificarea instant win:", err.message);
    return [];
  }
}
