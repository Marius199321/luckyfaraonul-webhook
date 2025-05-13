import nodemailer from 'nodemailer';

export const sendZohoEmail = async ({
  email, fullName, phone, address, country,
  productName, orderNumber, tickets, instantWins,
  amount, purchaseDate
}) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASSWORD
    }
  });

  const instantWinText = instantWins.length
    ? `<p><strong style="color:green">🎉 Instant Win Tickets:</strong> ${instantWins.join(', ')}</p>`
    : `<p><strong style="color:gray">😞 No instant win this time.</strong></p>`;

  const htmlContent = `
    <div style="padding: 30px; font-family: Arial; max-width: 600px; margin:auto;">
      <h2>✅ Thank you for your order, ${fullName}!</h2>
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Tickets:</strong> ${tickets.join(', ')}</p>
      ${instantWinText}
      <p><strong>Amount Paid:</strong> £${amount.toFixed(2)}</p>
      <p><strong>Purchase Date:</strong> ${purchaseDate}</p>
      <hr />
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Address:</strong> ${address}, ${country}</p>
      <hr />
      <p style="font-size:12px;color:#777;">This email was sent by LuckyFaraonul.com</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"LuckyFaraonul" <${process.env.ZOHO_EMAIL}>`,
    to: email,
    subject: `🎫 Your LuckyFaraonul Tickets | Order ${orderNumber}`,
    html: htmlContent
  });
};
