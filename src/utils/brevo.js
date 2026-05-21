const SibApiV3Sdk = require('sib-api-v3-sdk');

let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendVerificationEmail = async (to, firstName, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/account/verify-email?token=${token}`;
  
  let sendSmtpEmail = {
    sender: { name: "AuthMaster", email: process.env.EMAIL_FROM },
    to: [{ email: to }],
    subject: "Verify Your Email - AuthMaster",
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
  };
  
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Brevo error:', error);
    throw error;
  }
};

module.exports = { sendVerificationEmail };