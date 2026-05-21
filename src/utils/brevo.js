const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendVerificationEmail = async (to, firstName, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/account/verify-email?token=${token}`;
  
  const sendSmtpEmail = {
    sender: { name: "Auth", email: process.env.EMAIL_FROM },
    to: [{ email: to }],
    subject: "Verify Your Email - Auth",
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4F46E5; text-align: center;">Verify Your Email</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for registering with Auth. Please verify your email address to complete your registration.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">${verifyUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <hr>
            <p style="font-size: 12px; color: #666;">If you didn't create an account, please ignore this email.</p>
          </div>
        </body>
      </html>
    `
  };
  
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Verification email sent to ${to} from ${process.env.EMAIL_FROM}`);
    return data;
  } catch (error) {
    console.error('❌ Brevo error:', error.response?.body || error.message);
    throw error;
  }
};

module.exports = { sendVerificationEmail };