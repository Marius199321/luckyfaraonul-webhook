import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_PASSWORD
  }
});

transporter.sendMail({
  from: `"LuckyFaraonul" <${process.env.ZOHO_EMAIL}>`,
  to: 'adresa_ta_test@gmail.com',
  subject: 'Test SMTP Zoho',
  text: 'Acesta este un test SMTP trimis cu Nodemailer și Zoho.'
})
.then(() => console.log('✅ Email trimis cu succes!'))
.catch(err => console.error('❌ Eroare la trimitere:', err.message));
