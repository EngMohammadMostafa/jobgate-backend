const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"Job Gate" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`  تم إرسال البريد إلى: ${to}`);
  } catch (error) {
    console.error("  خطأ أثناء إرسال البريد:", error);
  }
}

module.exports = sendEmail;
