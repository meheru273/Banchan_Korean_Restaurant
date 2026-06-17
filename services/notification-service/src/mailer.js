const nodemailer = require('nodemailer');

let transporter;
const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

exports.sendEmail = async ({ to, subject, html }) => {
  if (!to) return;                                          // skip if no recipient
  const info = await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'FeastFleet <noreply@feastfleet.com>',
    to, subject, html,
  });
  console.log(`[Mailer] sent to ${to}: ${info.messageId}`);
};
