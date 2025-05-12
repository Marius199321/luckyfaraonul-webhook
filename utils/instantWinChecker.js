export const instantWinChecker = (productId, tickets) => {
    const instantWinNumbers = [1234, 5678, 91011]; // Setează tu dinamic numere instant win

    const winningTickets = tickets.filter(ticket => instantWinNumbers.includes(ticket));

    return winningTickets; // returnează biletele câștigătoare instant
};
