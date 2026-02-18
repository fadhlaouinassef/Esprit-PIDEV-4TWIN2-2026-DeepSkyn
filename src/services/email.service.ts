import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOtpEmail = async (email: string, otp: string, userName: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code - Verify Your Account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f7;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" cellpadding="0" cellspacing="0">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #156d95 0%, #1a7aaa 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Verify Your Account</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #1d1d1f; font-size: 16px; line-height: 1.6;">
                        Hello <strong>${userName}</strong>,
                      </p>
                      <p style="margin: 0 0 30px 0; color: #424245; font-size: 16px; line-height: 1.6;">
                        Thank you for signing up! To complete your registration, please use the verification code below:
                      </p>
                      
                      <!-- OTP Box -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center; padding: 30px; background: linear-gradient(135deg, #f5f5f7 0%, #fafafa 100%); border-radius: 12px; border: 2px solid #e5e5ea;">
                            <div style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #156d95; font-family: 'Courier New', monospace;">
                              ${otp}
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 20px 0; color: #424245; font-size: 14px; line-height: 1.6;">
                        This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
                      </p>
                      
                      <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f7; border-radius: 8px; border-left: 4px solid #156d95;">
                        <p style="margin: 0; color: #424245; font-size: 14px; line-height: 1.6;">
                          <strong>Security Tip:</strong> Never share this code with anyone. Our team will never ask for your verification code.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #86868b; font-size: 13px; line-height: 1.6;">
                        Need help? Contact us at <a href="mailto:support@deepskyn.com" style="color: #156d95; text-decoration: none;">support@deepskyn.com</a>
                      </p>
                      <p style="margin: 0; color: #86868b; font-size: 13px; line-height: 1.6;">
                        © ${new Date().getFullYear()} DeepSkyn. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email: string, userName: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to DeepSkyn - Account Created Successfully! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DeepSkyn</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f7;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" cellpadding="0" cellspacing="0">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #156d95 0%, #1a7aaa 100%); padding: 50px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                      <div style="font-size: 60px; margin-bottom: 15px;">🎉</div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">Welcome to DeepSkyn!</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #1d1d1f; font-size: 18px; line-height: 1.6;">
                        Hello <strong>${userName}</strong>,
                      </p>
                      <p style="margin: 0 0 25px 0; color: #424245; font-size: 16px; line-height: 1.6;">
                        Congratulations! Your account has been successfully created and verified. Welcome to the DeepSkyn community! 🌟
                      </p>
                      
                      <!-- Feature Box -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 25px; background: linear-gradient(135deg, #f5f5f7 0%, #fafafa 100%); border-radius: 12px; border: 1px solid #e5e5ea;">
                            <h3 style="margin: 0 0 15px 0; color: #156d95; font-size: 18px; font-weight: 600;">What's Next?</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #424245; font-size: 15px; line-height: 1.8;">
                              <li style="margin-bottom: 10px;">Complete your profile to get personalized recommendations</li>
                              <li style="margin-bottom: 10px;">Take our skin analysis quiz for tailored advice</li>
                              <li style="margin-bottom: 10px;">Explore our skincare routines and tips</li>
                              <li>Connect with our community of skincare enthusiasts</li>
                            </ul>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/user" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #156d95 0%, #1a7aaa 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 12px rgba(21, 109, 149, 0.3);">
                              Get Started Now
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #156d95;">
                        <p style="margin: 0; color: #424245; font-size: 14px; line-height: 1.6;">
                          <strong>💡 Pro Tip:</strong> Set up your skin profile today to unlock personalized skincare recommendations tailored just for you!
                        </p>
                      </div>
                      
                      <p style="margin: 30px 0 0 0; color: #424245; font-size: 15px; line-height: 1.6;">
                        We're excited to have you on board! If you have any questions or need assistance, our support team is always here to help.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #86868b; font-size: 13px; line-height: 1.6;">
                        Questions? Reach out at <a href="mailto:support@deepskyn.com" style="color: #156d95; text-decoration: none;">support@deepskyn.com</a>
                      </p>
                      <p style="margin: 0 0 15px 0; color: #86868b; font-size: 13px; line-height: 1.6;">
                        Follow us on social media for skincare tips and updates
                      </p>
                      <p style="margin: 0; color: #86868b; font-size: 13px; line-height: 1.6;">
                        © ${new Date().getFullYear()} DeepSkyn. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
