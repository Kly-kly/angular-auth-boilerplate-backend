const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/account/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: '"Auth App" <noreply@authapp.com>',
    to,
    subject: 'Verify Your Email',
    html: `<h2>Email Verification</h2><p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`
  });
};

module.exports = { sendVerificationEmail };