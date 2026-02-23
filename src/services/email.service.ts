import nodemailer from 'nodemailer';
import path from 'path';

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
    subject: `${otp} is your DeepSkyn verification code`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your account</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 16px;">
            <tr><td>

              <!-- Logo -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto 24px;">
                <tr>
                  <td style="text-align:center;">
                    <div style="display:inline-block;background:#156d95;border-radius:14px;padding:10px 14px;margin-bottom:10px;">
                      <img src="cid:logo" alt="DeepSkyn Logo" width="40" style="display: block; width: 40px; height: auto;" />
                    </div>
                    <p style="margin:0;font-size:15px;font-weight:700;color:#1a1a2e;">DeepSkyn</p>
                  </td>
                </tr>
              </table>

              <!-- Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

                <!-- Hero -->
                <tr>
                  <td style="background:linear-gradient(150deg,#eef4fb 0%,#e0ecf6 100%);padding:40px 40px 36px;text-align:center;">
                    <div style="display:inline-block;background:#fff;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;box-shadow:0 2px 8px rgba(21,109,149,0.15);margin-bottom:20px;">
                      <span style="font-size:28px;">✉️</span>
                    </div>
                    <h1 style="margin:0;font-size:24px;font-weight:800;color:#1a1a2e;">Verify your account</h1>
                    <p style="margin:10px 0 0;font-size:15px;color:#5a6a7e;">Hi <strong>${userName}</strong>, here is your one-time code.</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">

                    <!-- OTP digits -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                      <tr>
                        ${otp.split('').map(d => `<td style="padding:0 4px;"><div style="width:48px;height:56px;background:#f6fafd;border:2px solid #156d95;border-radius:10px;text-align:center;line-height:56px;font-size:28px;font-weight:800;color:#156d95;font-family:'Courier New',monospace;">${d}</div></td>`).join('')}
                      </tr>
                    </table>

                    <p style="margin:0 0 8px;text-align:center;font-size:13px;color:#8a96a3;">This code expires in <strong style="color:#1a1a2e;">10 minutes</strong>.</p>

                    <!-- Security note -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;">
                      <tr>
                        <td style="background:#f6fafd;border:1px solid #dde8f0;border-radius:10px;padding:16px 18px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:22px;vertical-align:top;padding-top:1px;font-size:16px;">ℹ️</td>
                              <td style="padding-left:10px;font-size:13px;color:#5a6a7e;line-height:1.6;">
                                <strong style="color:#1a1a2e;">Security Note:</strong> If you did not request this code, please ignore this email. Never share your code with anyone.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Divider -->
                <tr><td style="height:1px;background:#f0f2f5;"></td></tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:13px;color:#8a96a3;">
                      <a href="mailto:support@deepskyn.com" style="color:#156d95;text-decoration:none;">Support</a>
                      &nbsp;&middot;&nbsp;
                      <a href="#" style="color:#8a96a3;text-decoration:none;">Privacy Policy</a>
                      &nbsp;&middot;&nbsp;
                      <a href="#" style="color:#8a96a3;text-decoration:none;">Terms of Service</a>
                    </p>
                    <p style="margin:0;font-size:12px;color:#b0bac4;">© ${new Date().getFullYear()} DeepSkyn. All rights reserved.</p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
    attachments: [{
      filename: 'logo.png',
      path: path.join(process.cwd(), 'public/logo.png'),
      cid: 'logo'
    }]
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
    subject: 'Welcome to DeepSkyn!',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DeepSkyn</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 16px;">
            <tr><td>

              <!-- Logo -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto 24px;">
                <tr>
                  <td style="text-align:center;">
                    <div style="display:inline-block;border-radius:14px;padding:10px 14px;margin-bottom:10px;">
                      <img src="cid:logo" alt="DeepSkyn Logo" width="120" style="display: block; width: 120px; height: auto;" />
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px 12px;text-align:center;">
                    <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#1a1a2e;">Welcome to DeepSkyn!</h1>
                    <p style="margin:0 0 28px;font-size:15px;color:#5a6a7e;line-height:1.7;">
                      Your account has been successfully created and verified, <strong style="color:#1a1a2e;">${userName}</strong>.
                      You can now access all our features and start your personalized skincare journey.
                    </p>

                    <!-- CTA -->
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/user"
                       style="display:inline-block;padding:15px 40px;background:#156d95;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;margin-bottom:32px;">
                      Go to Dashboard &rarr;
                    </a>

                    <!-- Security note -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                      <tr>
                        <td style="background:#f6fafd;border:1px solid #dde8f0;border-radius:10px;padding:16px 18px;text-align:left;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:22px;vertical-align:top;padding-top:1px;font-size:16px;">ℹ️</td>
                              <td style="padding-left:10px;font-size:13px;color:#5a6a7e;line-height:1.6;">
                                <strong style="color:#1a1a2e;">Security Note:</strong> If you did not create this account, please contact our <a href="mailto:support@deepskyn.com" style="color:#156d95;text-decoration:none;">support team</a> immediately to secure your information.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Divider -->
                <tr><td style="height:1px;background:#f0f2f5;"></td></tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:13px;color:#8a96a3;">
                      <a href="mailto:support@deepskyn.com" style="color:#8a96a3;text-decoration:none;">Support</a>
                      &nbsp;&middot;&nbsp;
                      <a href="#" style="color:#8a96a3;text-decoration:none;">Privacy Policy</a>
                      &nbsp;&middot;&nbsp;
                      <a href="#" style="color:#8a96a3;text-decoration:none;">Terms of Service</a>
                    </p>
                    <p style="margin:0 0 4px;font-size:12px;color:#b0bac4;">© ${new Date().getFullYear()} DeepSkyn. All rights reserved.</p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
    attachments: [{
      filename: 'logo.png',
      path: path.join(process.cwd(), 'public/logo.png'),
      cid: 'logo'
    }]
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
