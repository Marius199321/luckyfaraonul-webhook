export const generateTickets = async (productId, qty, maxTickets) => {
    const usedTickets = []; // recomandat să iei automat din Wix CMS
    const tickets = new Set();

    while (tickets.size < qty) {
        const ticket = Math.floor(Math.random() * maxTickets) + 1;
        if (!usedTickets.includes(ticket)) tickets.add(ticket);
    }

    return Array.from(tickets);
};
