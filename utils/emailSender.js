import nodemailer from 'nodemailer';

export const sendZohoEmail = async ({
  email, fullName, phone, address, country,
  productName, orderNumber, tickets = [], instantWins = [],
  amount, purchaseDate
}) => {
  try {
    const zohoEmail = process.env.ZOHO_EMAIL;
    const zohoPassword = process.env.ZOHO_PASSWORD;

    if (!zohoEmail || !zohoPassword) {
      console.error("❌ Lipsesc datele din .env: ZOHO_EMAIL sau ZOHO_PASSWORD");
      throw new Error("Missing Zoho credentials");
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: zohoEmail,
        pass: zohoPassword
      }
    });

    const instantWinText = Array.isArray(instantWins) && instantWins.length > 0
      ? `<p><strong style="color:green">🎉 Instant Win Tickets:</strong> ${instantWins.join(', ')}</p>`
      : `<p><strong style="color:gray">😞 No instant win this time.</strong></p>`;

    const htmlContent = `
      <div style="padding: 30px; font-family: Arial; max-width: 600px; margin:auto;">
        <h2>✅ Thank you for your order, ${fullName || 'Customer'}!</h2>
        <p><strong>Product:</strong> ${productName || '-'}</p>
        <p><strong>Order Number:</strong> ${orderNumber || '-'}</p>
        <p><strong>Tickets:</strong> ${Array.isArray(tickets) ? tickets.join(', ') : '—'}</p>
        ${instantWinText}
        <p><strong>Amount Paid:</strong> £${amount ? amount.toFixed(2) : '0.00'}</p>
        <p><strong>Purchase Date:</strong> ${purchaseDate || '-'}</p>
        <hr />
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || '-'}</p>
        <p><strong>Address:</strong> ${address || '-'}, ${country || '-'}</p>
        <hr />
        <p style="font-size:12px;color:#777;">This email was sent by LuckyFaraonul.com</p>
      </div>
    `;

    const mailOptions = {
      from: `"LuckyFaraonul" <${zohoEmail}>`,
      to: email,
      subject: `🎫 Your LuckyFaraonul Tickets | Order ${orderNumber || ''}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email trimis către ${email}. ID: ${info.messageId}`);
    return true;

  } catch (err) {
    console.error("❌ Eroare la trimiterea emailului:", err.message);
    throw err;
  }
};

