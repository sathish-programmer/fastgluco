import nodemailer from 'nodemailer';

// Configure transport (Using Ethereal for testing or real SMTP if provided in ENV)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || 'test@ethereal.email',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || 'testpassword'
  }
});

const generateEmailTemplate = (title: string, contentHTML: string) => {
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
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">&hearts; FastGluco</h1>
      </div>
      <div style="padding: 40px 30px; color: #334155; line-height: 1.6; font-size: 16px;">
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px;">${title}</h2>
        ${contentHTML}
      </div>
      <div style="background-color: #f8fafc; padding: 24px 30px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} FastGluco. All rights reserved.</p>
        <p style="margin: 8px 0 0 0;">You are receiving this email because you are a registered user of FastGluco.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

export class EmailService {
  /**
   * Send Welcome Email
   */
  public static async sendWelcomeEmail(email: string, name: string) {
    const html = generateEmailTemplate('Welcome to FastGluco!', `
      <p>Hi ${name},</p>
      <p>We are thrilled to have you on board! FastGluco is designed to give you unparalleled insights into your glucose levels and dietary habits.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #166534; font-weight: 600;">Getting Started:</p>
        <ul style="margin-top: 8px; margin-bottom: 0; color: #15803d; padding-left: 20px;">
          <li>Log in to the app to set up your profile.</li>
          <li>Choose a subscription plan to unlock full features.</li>
          <li>Upload your Abbott CGM report to see your analysis!</li>
        </ul>
      </div>
      <p>If you have any questions, feel free to contact our support team.</p>
    `);
    try { await transporter.sendMail({ from: '"FastGluco" <hello@fastgluco.com>', to: email, subject: 'Welcome to FastGluco!', html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Subscription Invoice and Details
   */
  public static async sendSubscriptionInvoiceEmail(email: string, name: string, planName: string, amount: number, currency: 'INR' | 'USD' = 'INR') {
    const symbol = currency === 'USD' ? '$' : '₹';
    const html = generateEmailTemplate('Payment Confirmation', `
      <p>Hi ${name},</p>
      <p>Thank you for subscribing to the <strong>${planName}</strong> plan.</p>
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Transaction Details</p>
        <p style="margin: 4px 0 0 0; color: #1d4ed8;">Amount Processed: ${symbol}${amount.toFixed(2)}</p>
      </div>
      <p>You can view your full invoice details and manage your subscription in your FastGluco Profile under "Billing".</p>
      <p>Enjoy your premium features!</p>
    `);
    try { await transporter.sendMail({ from: '"FastGluco Billing" <billing@fastgluco.com>', to: email, subject: 'Your FastGluco Subscription Confirmed', html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Plan Change Email
   */
  public static async sendPlanChangeEmail(email: string, name: string, newPlanName: string) {
    const html = generateEmailTemplate('Subscription Updated', `
      <p>Hi ${name},</p>
      <p>Your subscription has been successfully updated to the <strong>${newPlanName}</strong> plan.</p>
      <p>Your new features are available immediately! You can manage your billing cycle and view upcoming charges in your Profile.</p>
    `);
    try { await transporter.sendMail({ from: '"FastGluco Billing" <billing@fastgluco.com>', to: email, subject: 'Your FastGluco Subscription has been Updated', html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Subscription Cancellation Email
   */
  public static async sendCancellationEmail(email: string, name: string, endDate: string) {
    const html = generateEmailTemplate('Subscription Cancelled', `
      <p>Hi ${name},</p>
      <p>We've received your request to cancel your FastGluco subscription. We're sorry to see you go!</p>
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;">Your account will retain premium access until the end of your current billing cycle on <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p>
      </div>
      <p>If you change your mind, you can always reactivate your subscription from your Profile.</p>
    `);
    try { await transporter.sendMail({ from: '"FastGluco Billing" <billing@fastgluco.com>', to: email, subject: 'FastGluco Subscription Cancellation', html }); } catch (err) { console.error(err); }
  }

  /**
   * Send High Glucose Spike Alert
   */
  public static async sendHighSpikeAlert(email: string, name: string, reading: number, threshold: number, time: string) {
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
    `);
    try { await transporter.sendMail({ from: '"FastGluco Alerts" <alerts@fastgluco.com>', to: email, subject: 'Urgent: High Glucose Spike Detected', html }); } catch (err) { console.error(err); }
  }

  /**
   * Send an answer to a support ticket
   */
  public static async sendSupportAnswerEmail(email: string, name: string, question: string, answer: string) {
    const html = generateEmailTemplate('Re: Your Support Question', `
      <p>Hi ${name},</p>
      <p>Thank you for reaching out to FastGluco Support.</p>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: bold;">Your Question:</p>
        <p style="margin: 0; font-style: italic;">"${question}"</p>
      </div>
      <p style="font-weight: 600;">Our Answer:</p>
      <p>${answer}</p>
    `);
    try { await transporter.sendMail({ from: '"FastGluco Support" <support@fastgluco.com>', to: email, subject: 'Re: Your FastGluco Support Question', html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Expiry Warning Email
   */
  public static async sendExpiryWarningEmail(email: string, name: string, daysLeft: number) {
    const html = generateEmailTemplate('Action Required: Subscription Expiring', `
      <p>Hi ${name},</p>
      <p>Your FastGluco subscription is expiring in <strong>${daysLeft} days</strong>.</p>
      <p>Please ensure your payment method is up to date, or renew your subscription to avoid losing access to your premium features.</p>
    `);
    try { await transporter.sendMail({ from: '"FastGluco Billing" <billing@fastgluco.com>', to: email, subject: 'Action Required: Your FastGluco Subscription is Expiring Soon', html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Manual Admin Email to User
   */
  public static async sendManualAdminEmail(email: string, title: string, body: string) {
    const html = generateEmailTemplate(title, `
      <p>${body.replace(/\n/g, '<br/>')}</p>
    `);
    try { await transporter.sendMail({ from: '"FastGluco Admin" <admin@fastgluco.com>', to: email, subject: title, html }); } catch (err) { console.error(err); }
  }
}
