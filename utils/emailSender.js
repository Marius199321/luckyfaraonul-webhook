// utils/emailSender.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS
  }
});

export default async function sendConfirmationEmail({
  to,
  name,
  orderNumber,
  tickets,
  total,
  amount,
  productName
}) {
  const ticketList = tickets.map(t => `#${t.ticketNumber}`).join(', ');

  const htmlContent = `
    <h2>Mulțumim pentru participare, ${name}!</h2>
    <p>Comanda ta <strong>#${orderNumber}</strong> a fost înregistrată cu succes.</p>
    <p><strong>Produs:</strong> ${productName}</p>
    <p><strong>Bilete:</strong> ${ticketList}</p>
    <p><strong>Total bilete:</strong> ${tickets.length}</p>
    <p><strong>Suma plătită:</strong> £${(amount / 100).toFixed(2)}</p>
    <br />
    <p>Mult succes!</p>
    <p><strong>LuckyFaraonul</strong></p>
  `;

  try {
    await transporter.sendMail({
      from: `LuckyFaraonul <${process.env.ZOHO_USER}>`,
      to,
      subject: `Confirmare comandă #${orderNumber}`,
      html: htmlContent
    });
    console.log(`📧 Email trimis cu succes la ${to}`);
  } catch (err) {
    console.error('❌ Eroare trimitere email:', err);
  }
}


