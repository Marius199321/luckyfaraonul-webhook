// api/instantWinChecker.js

/**
 * Verifică dacă biletele generate conțin câștiguri instant.
 * @param {Array<number>} generatedTickets - biletele nou generate
 * @param {Array<{ number: number, prize: string }>} instantPrizes - lista de câștiguri instant configurate
 * @returns {Array<{ number: number, prize: string }>} - lista biletelor câștigătoare instant
 */
export function checkInstantWin(generatedTickets, instantPrizes) {
  const winners = [];

  for (const ticket of generatedTickets) {
    const match = instantPrizes.find(p => p.number === ticket);
    if (match) {
      winners.push({
        number: ticket,
        prize: match.prize
      });
    }
  }

  return winners;
}
