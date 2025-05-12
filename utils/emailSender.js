import nodemailer from 'nodemailer';

export const sendZohoEmail = async ({
    email,
    fullName,
    phone,
    address,
    country,
    productName,
    orderNumber,
    tickets,
    instantWins,
    amount,
    purchaseDate
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
        ? `<p style="color:green;"><strong>🎉 Instant Win Tickets:</strong> ${instantWins.join(', ')}</p>`
        : `<p style="color:gray;"><strong>No instant win tickets this time.</strong></p>`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px; border-radius: 8px; max-width: 600px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h2 style="color: #222;">🎫 Thank you for your order, ${fullName}!</h2>
            <p><strong>Product:</strong> ${productName}</p>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Purchase Date:</strong> ${purchaseDate}</p>
            <p><strong>Amount Paid:</strong> £${amount.toFixed(2)}</p>

            <hr style="margin: 20px 0;" />

            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Address:</strong> ${address}, ${country}</p>

            <hr style="margin: 20px 0;" />

            <p><strong>Your Tickets (${tickets.length}):</strong></p>
            <div style="background-color: #fff; padding: 10px; border-radius: 6px; border: 1px solid #ddd; font-size: 15px;">
                ${tickets.join(', ')}
            </div>

            <div style="margin-top: 20px;">
                ${instantWinText}
            </div>

            <p style="font-size: 13px; color: #777; margin-top: 30px;">This email was sent by LuckyFaraonul.com | noreply@luckyfaraonul.com</p>
        </div>
    `;

    await transporter.sendMail({
        from: `"LuckyFaraonul" <${process.env.ZOHO_EMAIL}>`,
        to: email,
        subject: `🎉 Your LuckyFaraonul Tickets – Order ${orderNumber}`,
        html: htmlContent
    });
};
