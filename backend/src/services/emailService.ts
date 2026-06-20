import nodemailer from 'nodemailer';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

// Configure transport (Using Ethereal for testing or real SMTP if provided in ENV)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || 'test@ethereal.email',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || 'testpassword'
  }
});

const generateEmailTemplate = (title: string, contentHTML: string, appName: string = 'Mito_Reboot', appTagline: string = '') => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
  <div style="padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background-color: #2563eb; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">&hearts; ${appName}</h1>
        ${appTagline ? `<div style="color: #bfdbfe; font-size: 14px; font-weight: 500; margin-top: 6px;">${appTagline}</div>` : ''}
      </div>
      <div style="padding: 40px 30px; color: #334155; line-height: 1.6; font-size: 16px;">
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px;">${title}</h2>
        ${contentHTML}
      </div>
      <div style="background-color: #f8fafc; padding: 24px 30px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
        <p style="margin: 8px 0 0 0;">You are receiving this email because you are a registered user of ${appName}.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

export class EmailService {
  private static async getBranding() {
    const config = await PaymentGatewayConfig.findOne();
    return {
      appName: config?.appName || 'Mito_Reboot',
      appTagline: config?.appTagline || 'The circadian fasting app'
    };
  }

  /**
   * Send Welcome Email
   */
  public static async sendWelcomeEmail(email: string, name: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    
    const html = generateEmailTemplate(`Welcome to ${appName}!`, `
      <p>Hi ${name},</p>
      <p>We are thrilled to have you on board! ${appName} is designed to give you unparalleled insights into your circadian fasting cycles and metabolic health.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #166534; font-weight: 600;">Getting Started:</p>
        <ul style="margin-top: 8px; margin-bottom: 0; color: #15803d; padding-left: 20px;">
          <li>Log in to the app to set up your profile.</li>
          <li>Choose a subscription plan to unlock full features.</li>
          <li>Upload your Abbott CGM report to see your analysis!</li>
        </ul>
      </div>
      <p>If you have any questions, feel free to contact our support team.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName}" <hello@mitoreboot.com>`, to: email, subject: `Welcome to ${appName}!`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Subscription Invoice and Details
   */
  public static async sendSubscriptionInvoiceEmail(email: string, name: string, planName: string, amount: number, currency: 'INR' | 'USD' = 'INR', pdfBuffer?: Buffer, invoiceNumber?: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const symbol = currency === 'USD' ? '$' : '₹';
    const html = generateEmailTemplate('Payment Confirmation', `
      <p>Hi ${name},</p>
      <p>Thank you for subscribing to the <strong>${planName}</strong> plan.</p>
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Transaction Details</p>
        <p style="margin: 4px 0 0 0; color: #1d4ed8;">Amount Processed: ${symbol}${amount.toFixed(2)}</p>
      </div>
      <p>We have attached your invoice PDF to this email.</p>
      <p>You can also view your full invoice details and manage your subscription in your ${appName} Profile under "Billing".</p>
      <p>Enjoy your premium features!</p>
    `, appName, appTagline);

    const mailOptions: any = {
      from: `"${appName} Billing" <billing@mitoreboot.com>`,
      to: email,
      subject: `Your ${appName} Subscription Confirmed`,
      html
    };

    if (pdfBuffer && invoiceNumber) {
      mailOptions.attachments = [
        {
          filename: `Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ];
    }

    try { await transporter.sendMail(mailOptions); } catch (err) { console.error(err); }
  }

  /**
   * Send Plan Change Email
   */
  public static async sendPlanChangeEmail(email: string, name: string, newPlanName: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('Subscription Updated', `
      <p>Hi ${name},</p>
      <p>Your subscription has been successfully updated to the <strong>${newPlanName}</strong> plan.</p>
      <p>Your new features are available immediately! You can manage your billing cycle and view upcoming charges in your Profile.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Billing" <billing@mitoreboot.com>`, to: email, subject: `Your ${appName} Subscription has been Updated`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Subscription Cancellation Email
   */
  public static async sendCancellationEmail(email: string, name: string, endDate: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('Subscription Cancelled', `
      <p>Hi ${name},</p>
      <p>We've received your request to cancel your ${appName} subscription. We're sorry to see you go!</p>
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;">Your account will retain premium access until the end of your current billing cycle on <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p>
      </div>
      <p>If you change your mind, you can always reactivate your subscription from your Profile.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Billing" <billing@mitoreboot.com>`, to: email, subject: `${appName} Subscription Cancellation`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send High Glucose Spike Alert
   */
  public static async sendHighSpikeAlert(email: string, name: string, reading: number, threshold: number, time: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('⚠️ High Glucose Alert', `
      <p>Hi ${name},</p>
      <p>We detected a significant glucose spike in your recent data.</p>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b; font-weight: 600;">Spike Details:</p>
        <ul style="margin-top: 8px; margin-bottom: 0; color: #b91c1c; padding-left: 20px;">
          <li><strong>Recorded Level:</strong> ${reading} mg/dL</li>
          <li><strong>Your Safe Threshold:</strong> ${threshold} mg/dL</li>
          <li><strong>Time:</strong> ${new Date(time).toLocaleString()}</li>
        </ul>
      </div>
      <p>Please log into the app to view your analysis and review your recent meals.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Alerts" <alerts@mitoreboot.com>`, to: email, subject: `Urgent: High Glucose Spike Detected (${appName})`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Account Blocked Notification Email
   */
  public static async sendBlockNotificationEmail(email: string, name: string, reason: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('Account Suspended', `
      <p>Hi ${name},</p>
      <p>We are writing to inform you that your ${appName} account has been suspended.</p>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b; font-weight: 600;">Reason for Suspension:</p>
        <p style="margin: 8px 0 0 0; color: #b91c1c;">${reason}</p>
      </div>
      <p>If you believe this is a mistake or have questions, please contact our support team.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Security" <security@mitoreboot.com>`, to: email, subject: `${appName} Account Suspended`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Password Reset Link Email
   */
  public static async sendPasswordResetEmail(email: string, name: string, resetLink: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('Password Reset Request', `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password for your ${appName} account. You can reset your password by clicking the link below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>This reset link will expire in 30 minutes. If you did not make this request, you can safely ignore this email.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Security" <security@mitoreboot.com>`, to: email, subject: `${appName} Password Reset Link`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send an answer to a support ticket
   */
  public static async sendSupportAnswerEmail(email: string, name: string, question: string, answer: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('Re: Your Support Question', `
      <p>Hi ${name},</p>
      <p>Thank you for reaching out to ${appName} Support.</p>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: bold;">Your Question:</p>
        <p style="margin: 0; font-style: italic;">"${question}"</p>
      </div>
      <p style="font-weight: 600;">Our Answer:</p>
      <p>${answer}</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Support" <support@mitoreboot.com>`, to: email, subject: `Re: Your ${appName} Support Question`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Expiry Warning Email
   */
  public static async sendExpiryWarningEmail(email: string, name: string, daysLeft: number) {
    const { appName, appTagline } = await EmailService.getBranding();
    
    const subject = daysLeft === 1 
      ? `Urgent Action Required: Your ${appName} Subscription Expires Tomorrow!`
      : `Action Required: Your ${appName} Subscription is Expiring in ${daysLeft} Days`;

    const html = generateEmailTemplate('Action Required: Subscription Expiring', `
      <p>Hi ${name},</p>
      <p>Your ${appName} subscription is expiring in <strong>${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}</strong>.</p>
      <p>Please ensure your payment method is up to date, or renew your subscription to avoid losing access to your premium features (like your AI Photo Food Scanner, glucose spiking charts, and PDF reports).</p>
      <p>To renew your plan, please log into the app and update your subscription details in your Profile.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Billing" <billing@mitoreboot.com>`, to: email, subject, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Subscription Expired Email
   */
  public static async sendSubscriptionExpiredEmail(email: string, name: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('Your Subscription Has Expired', `
      <p>Hi ${name},</p>
      <p>Your ${appName} subscription has officially expired and premium features have been deactivated.</p>
      <p>Your logged meals and glucose logs remain saved. However, to re-enable continuous syncing, food scanning, and advanced analytics, you will need to choose a plan and reactivate your subscription.</p>
      <p>You can update your billing status anytime by logging into the app and visiting your Profile configurations.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Billing" <billing@mitoreboot.com>`, to: email, subject: `Your ${appName} Subscription Has Expired`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Manual Admin Email to User
   */
  public static async sendManualAdminEmail(email: string, title: string, body: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate(title, `
      <p>${body.replace(/\n/g, '<br/>')}</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Admin" <admin@mitoreboot.com>`, to: email, subject: title, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Refund Processed Email
   */
  public static async sendRefundEmail(email: string, name: string, refundAmount: number) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('Refund Processed Successfully', `
      <p>Hi ${name},</p>
      <p>We are writing to inform you that a refund has been processed for your subscription transaction.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #166534; font-weight: 600;">Refund Details:</p>
        <p style="margin: 4px 0 0 0; color: #15803d;">Amount Credited: ₹${refundAmount.toFixed(2)}</p>
      </div>
      <p>The refunded amount will reflect in your original payment source within 5-7 business days.</p>
      <p>If you have any questions, please contact our support team.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Billing" <billing@mitoreboot.com>`, to: email, subject: `${appName} Refund Processed`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Subscription Override Alert Email
   */
  public static async sendSubscriptionOverrideEmail(email: string, name: string, actionName: 'cancelled' | 'extended' | 'changed', details: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const title = actionName === 'cancelled' ? 'Subscription Cancelled' : actionName === 'extended' ? 'Subscription Extended' : 'Subscription Tier Adjusted';
    const html = generateEmailTemplate(title, `
      <p>Hi ${name},</p>
      <p>An administrator has manually updated your ${appName} subscription status.</p>
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Override Details</p>
        <p style="margin: 4px 0 0 0; color: #1e293b;">${details}</p>
      </div>
      <p>You can check your current subscription validity anytime under "Profile" > "Billing" in the app.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Billing" <billing@mitoreboot.com>`, to: email, subject: `${appName} Alert: ${title}`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Login Notification Email
   */
  public static async sendLoginNotificationEmail(email: string, name: string, details: { time: string; location: string; device: string }) {
    console.log(`[EmailService] Attempting to send login notification email to: ${email}`);
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('New Login Detected', `
      <p>Hi ${name},</p>
      <p>We detected a new login to your ${appName} account.</p>
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0; font-size: 14px;">
        <p style="margin: 0; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Login Details</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 120px;">Time:</td>
            <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${details.time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Location:</td>
            <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${details.location}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Device/Browser:</td>
            <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${details.device}</td>
          </tr>
        </table>
      </div>
      <p style="color: #64748b; font-size: 13px;">If this was you, you can safely ignore this email. If you do not recognize this activity, please reset your password immediately or contact support.</p>
    `, appName, appTagline);
    try {
      await transporter.sendMail({
        from: `"${appName} Security" <security@mitoreboot.com>`,
        to: email,
        subject: `Security Alert: New Login to ${appName}`,
        html
      });
      console.log(`[EmailService] Login notification email sent successfully to: ${email}`);
    } catch (err) {
      console.error('[EmailService] Failed to send login notification email:', err);
    }
  }
}
