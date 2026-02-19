const nodemailer = require("nodemailer");

/**
 * Email Service
 * Handles sending emails for password reset and notifications
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, userName, resetToken, resetUrl) => {
  const mailOptions = {
    from: process.env.SMTP_EMAIL || "noreply@sharefilm.com",
    to: email,
    subject: "Password Reset Request - FilmShare",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          
          <p>Hi <strong>${userName}</strong>,</p>
          
          <p>We received a request to reset the password for your FilmShare account. If you made this request, click the button below to reset your password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link in your browser:<br>
            <code style="background-color: #f0f0f0; padding: 10px; display: inline-block; border-radius: 4px;">
              ${resetUrl}
            </code>
          </p>
          
          <p style="color: #999; font-size: 12px;">
            This link expires in <strong>30 minutes</strong>. If you didn't request a password reset, ignore this email or reply immediately.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; margin-bottom: 0;">
            FilmShare Team<br>
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Password reset sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL] Error sending password reset email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify SMTP connection
 */
const verifySMTPConnection = async () => {
  try {
    await transporter.verify();
    console.log("[EMAIL] SMTP connection verified");
    return true;
  } catch (error) {
    console.error("[EMAIL] SMTP connection failed:", error.message);
    console.warn("[WARNING] Email service may not work. Check SMTP credentials in environment variables.");
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  verifySMTPConnection
};
