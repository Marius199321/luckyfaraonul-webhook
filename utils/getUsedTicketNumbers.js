// utils/getUsedTicketNumbers.js
import { query } from 'wix-data';

/**
 * Returnează toate biletele deja folosite pentru un anumit produs
 * @param {string} productId
 * @returns {Promise<number[]>}
 */
export async function getUsedTicketNumbers(productId) {
  try {
    const result = await query('TicketsPurchases')
      .eq('productId', productId)
      .limit(1000)
      .find();

    const allTickets = result.items.flatMap(item => item.tickets || []);
    return allTickets;
  } catch (error) {
    console.error('❌ Eroare la getUsedTicketNumbers:', error);
    return [];
  }
}
