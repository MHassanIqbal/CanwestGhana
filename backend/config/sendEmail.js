import nodemailer from "nodemailer";

// Send email using Nodemailer
const sendEmail = async (options) => {
  const port = Number(process.env.SMTP_PORT);

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // true for direct TLS (465), false for STARTTLS-upgradeable (587, 2525, etc.)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  await transport.sendMail(message);
};

export default sendEmail;
