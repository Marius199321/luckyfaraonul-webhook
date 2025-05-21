import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu', // ← important pentru conturi europene!
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_PASSWORD
  }
});

export async function sendZohoEmail({
  email,
  name,
  phone,
  address,
  country,
  productName,
  orderNumber,
  amount,
  purchaseDate,
  tickets = [],
  instantWinners = []
}) {
  try {
    const subject = `🎟️ Confirmare comandă #${orderNumber} - ${productName}`;
    const instantWinText = instantWinners.length
      ? instantWinners.map(w => `• Bilet ${w.ticketNumber}: ${w.prize}`).join('<br>')
      : '–';
    const ticketList = tickets.sort((a, b) => a - b).join(', ');

    const html = `
      <h2>Mulțumim pentru participare, ${name}!</h2>
      <p>Detaliile comenzii tale:</p>
      <ul>
        <li><strong>Produs:</strong> ${productName}</li>
        <li><strong>Număr comandă:</strong> ${orderNumber}</li>
        <li><strong>Data achiziției:</strong> ${purchaseDate}</li>
        <li><strong>Total plătit:</strong> £${amount.toFixed(2)}</li>
        <li><strong>Bilete cumpărate:</strong> ${tickets.length}</li>
      </ul>
      <p><strong>Lista biletelor tale:</strong><br>${ticketList}</p>
      <p><strong>Câștiguri Instant:</strong><br>${instantWinText}</p>
      <hr>
      <p><strong>Date personale:</strong></p>
      <p>
        ${name}<br>
        ${phone}<br>
        ${email}<br>
        ${address}<br>
        ${country}
      </p>
      <p style="font-size:12px; color:#777;">LUCKYFARAONUL LTD</p>
    `;

    const text = `
Confirmare comandă #${orderNumber} - ${productName}

Bilete: ${tickets.length}
Lista: ${ticketList}
Câștiguri instant: ${instantWinners.length ? instantWinners.map(w => `${w.ticketNumber}: ${w.prize}`).join(', ') : '–'}

Client: ${name}, ${phone}, ${email}
Adresă: ${address}, ${country}
Suma plătită: £${amount.toFixed(2)}
Data: ${purchaseDate}
www.luckyfaraonul.com
`;

    const mailOptions = {
      from: `"LuckyFaraonul" <${process.env.ZOHO_EMAIL}>`,
      to: email,
      replyTo: process.env.ZOHO_EMAIL,
      subject,
      text,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email trimis către ${email}`);
  } catch (err) {
    console.error("❌ Eroare la trimiterea emailului:", err.message);
    throw new Error("Emailul nu a putut fi trimis.");
  }
}



