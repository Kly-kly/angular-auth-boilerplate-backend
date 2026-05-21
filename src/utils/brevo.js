const https = require('https');

const sendVerificationEmail = async (to, firstName, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/account/verify-email?token=${token}`;
  
  const data = JSON.stringify({
    sender: { name: "Auth", email: process.env.EMAIL_FROM },
    to: [{ email: to }],
    subject: "Verify Your Email - Auth",
    htmlContent: `
      <html>
        <body>
          <h2>Verify Your Email</h2>
          <p>Hi ${firstName},</p>
          <p>Click the link below to verify your email:</p>
          <a href="${verifyUrl}">Verify Email Address</a>
          <p>This link expires in 24 hours.</p>
        </body>
      </html>
    `
  });

  const options = {
    hostname: 'api.brevo.com',
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log('✅ Email sent successfully to:', to);
          resolve(JSON.parse(responseData));
        } else {
          console.error('❌ Brevo error:', responseData);
          reject(new Error(`Brevo API error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

module.exports = { sendVerificationEmail };