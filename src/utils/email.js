// src/utils/email.js
import nodemailer from 'nodemailer';

export const sendWelcomeEmail = async (to, name) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: `"CourseMaster" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Welcome to CourseMaster!',
    html: `<h2>Hello ${name},</h2><p>Welcome to CourseMaster. Start learning your favorite courses now!</p>`
  };

  await transporter.sendMail(mailOptions);
};
