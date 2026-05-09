const nodemailer = require('nodemailer');

let transporter;

const getTransporter = async () => {
  if (!transporter) {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    // No SMTP configured — will use console-only mode
  }
  return transporter;
};

const sendMagicLink = async (email, token) => {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify?token=${token}&email=${encodeURIComponent(email)}`;

  // Always log the link to console — useful in dev even when email is configured
  console.log('\n========================================');
  console.log('🔗 MAGIC LINK (click to login):');
  console.log(link);
  console.log('========================================\n');

  // If no SMTP configured, skip sending email — console link is enough for dev
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('ℹ️  No SMTP configured. Copy the link above and open it in your browser.');
    return { messageId: 'console-only' };
  }

  const currentTransporter = await getTransporter();

  const mailOptions = {
    from: `"TapMyJob" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Login Link for TapMyJob',
    text: `Click this link to login: ${link}`,
    html: `<p>Click <a href="${link}">here</a> to login to TapMyJob.</p>`
  };

  try {
    const info = await currentTransporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
};

module.exports = {
  sendMagicLink
};
