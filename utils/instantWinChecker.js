export const instantWinChecker = (productId, tickets) => {
  // Exemplu fix: stabilește tu mai târziu dinamic
  const instantWinNumbers = [1234, 5678, 9011];

  const winningTickets = tickets.filter(ticket => instantWinNumbers.includes(ticket));

  return winningTickets;
};
