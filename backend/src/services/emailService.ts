import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { SMSService } from './smsService';

// Configure transport (Using Ethereal for testing or real SMTP if provided in ENV)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || 'test@ethereal.email',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || 'testpassword'
  }
});

export const generateEmailTemplatePublic = (title: string, contentHTML: string, appName: string = 'Mito_Reboot', appTagline: string = '') => generateEmailTemplate(title, contentHTML, appName, appTagline);

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

  /** Public alias used by cron jobs */
  public static async getBrandingPublic() {
    return EmailService.getBranding();
  }

  /** Send an arbitrary HTML email — used by cron reminders */
  public static async sendRawEmail(to: string, subject: string, html: string, from?: string) {
    const { appName } = await EmailService.getBranding();
    await transporter.sendMail({
      from: from || `"${appName}" <no-reply@mitoreboot.com>`,
      to,
      subject,
      html
    });
  }

  /**
   * Send Welcome Email
   */
  public static async sendWelcomeEmail(email: string, name: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const config = await PaymentGatewayConfig.findOne();
    const enableSubscriptions = config ? config.enableSubscriptions !== false : true;

    const html = generateEmailTemplate(`Welcome to ${appName}!`, `
      <p>Hi ${name},</p>
      <p>We are thrilled to have you on board! ${appName} is designed to give you unparalleled insights into your circadian fasting cycles and metabolic health.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #166534; font-weight: 600;">Getting Started:</p>
        <ul style="margin-top: 8px; margin-bottom: 0; color: #15803d; padding-left: 20px;">
          <li>Log in to the app to set up your profile.</li>
          ${enableSubscriptions ? '<li>Choose a subscription plan to unlock full features.</li>' : ''}
          <li>Upload your Abbott CGM report to see your analysis!</li>
        </ul>
      </div>
      <p>If you have any questions, feel free to contact our support team.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName}" <hello@mitoreboot.com>`, to: email, subject: `Welcome to ${appName}!`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send OTP Verification Email
   */
  public static async sendOtpEmail(email: string, otpCode: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate(`Your Verification Code`, `
      <p>Hello,</p>
      <p>Please use the following 6-digit verification code to sign in to your ${appName} account.</p>
      <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-radius: 12px; margin: 30px 0; border: 2px dashed #cbd5e1;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1e293b;">${otpCode}</span>
      </div>
      <p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    `, appName, appTagline);
    
    try { 
      await transporter.sendMail({ 
        from: `"${appName} Security" <security@mitoreboot.com>`, 
        to: email, 
        subject: `${otpCode} is your ${appName} verification code`, 
        html 
      }); 
      console.log(`[EmailService] OTP email sent successfully to ${email}`);
    } catch (err) { 
      console.error('[EmailService] Failed to send OTP email:', err); 
      throw err;
    }
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
      <p>Please ensure your payment method is up to date, or renew your subscription to avoid losing access to your premium features (like your Food Scanner, glucose spiking charts, and PDF reports).</p>
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

  /**
   * Send Profile Edit Approved Email
   */
  public static async sendProfileEditApprovedEmail(email: string, name: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('Profile Update Approved', `
      <p>Hi ${name},</p>
      <p>Great news! Your recent request to update your profile information has been reviewed and <strong>approved</strong> by our administrative team.</p>
      <p>The changes have now been applied to your account. You can log into the app to see your updated profile.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Support" <support@mitoreboot.com>`, to: email, subject: `${appName} Profile Update Approved`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Profile Edit Rejected Email
   */
  public static async sendProfileEditRejectedEmail(email: string, name: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const html = generateEmailTemplate('Profile Update Notice', `
      <p>Hi ${name},</p>
      <p>We are writing regarding your recent request to update your profile information on ${appName}.</p>
      <p>After reviewing the requested changes, our administrative team was unable to approve them at this time. Your profile remains unchanged.</p>
      <p>If you believe this was a mistake or have any questions, please contact our support team.</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName} Support" <support@mitoreboot.com>`, to: email, subject: `${appName} Profile Update Notice`, html }); } catch (err) { console.error(err); }
  }

  /**
   * Send Appointment Notifications
   */
  public static async sendAppointmentEmail(type: 'booked' | 'confirmed' | 'completed' | 'prescription' | 'cancelled', appointmentId: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const { Appointment } = require('../models/Appointment');
    
    const appt = await Appointment.findById(appointmentId)
      .populate('doctorId')
      .populate('userId');

    if (!appt || !appt.userId?.email) return;

    let subject = '';
    let body = '';

    if (type === 'booked') {
      subject = `Appointment Booked - Pending Confirmation`;
      body = `<p>Hi ${appt.userId.name},</p>
              <p>Your appointment request with <strong>Dr. ${appt.doctorId.name}</strong> for ${appt.date} at ${appt.time} has been received and is pending confirmation.</p>
              <p>Reason: ${appt.reason}</p>`;
    } else if (type === 'confirmed') {
      const isOnline = appt.type === 'online';
      subject = isOnline ? `Appointment Confirmed - Google Meet Link` : `Appointment Confirmed - Clinic Visit Details`;
      body = `<p>Hi ${appt.userId.name},</p>
              <p>Your appointment with <strong>Dr. ${appt.doctorId.name}</strong> is confirmed!</p>
              <p><strong>Date:</strong> ${appt.date}</p>
              <p><strong>Time:</strong> ${appt.time}</p>
              ${isOnline 
                ? `<p><strong>Join Meeting:</strong> <a href="${appt.meetingLink}">${appt.meetingLink}</a></p>` 
                : `<p><strong>Clinic Instructions & Location:</strong> ${appt.meetingLink || 'Please visit the clinic at the scheduled slot.'}</p>`
              }`;
    } else if (type === 'completed') {
      subject = `Appointment Completed & Invoice Generated`;
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
      const invoiceDownload = appt.invoiceUrl ? `<p><strong>Invoice PDF:</strong> <a href="${backendUrl}${appt.invoiceUrl}">Download Invoice</a></p>` : '';
      const rxDownload = appt.prescriptionUrl ? `<p><strong>Prescription:</strong> <a href="${appt.prescriptionUrl}">Download Prescription</a></p>` : '';
      body = `<p>Hi ${appt.userId.name},</p>
              <p>Your consultation with <strong>Dr. ${appt.doctorId.name}</strong> on ${appt.date} has been completed.</p>
              <p><strong>Consultation Notes:</strong> ${appt.notes || 'None provided.'}</p>
              ${appt.prescriptionText ? `<p><strong>Prescription Notes:</strong> ${appt.prescriptionText}</p>` : ''}
              ${rxDownload}
              ${invoiceDownload}`;
    } else if (type === 'prescription') {
      subject = `Prescription Shared`;
      body = `<p>Hi ${appt.userId.name},</p>
              <p>Dr. ${appt.doctorId.name} has shared a prescription for your consultation.</p>
              <p><strong>Download/View:</strong> <a href="${appt.prescriptionUrl}">${appt.prescriptionUrl}</a></p>`;
    } else if (type === 'cancelled') {
      subject = `Appointment Request Declined`;
      body = `<p>Hi ${appt.userId.name},</p>
              <p>Unfortunately, your appointment request with <strong>Dr. ${appt.doctorId.name}</strong> for <strong>${appt.date} at ${appt.time}</strong> was <strong>not accepted</strong> by the doctor.</p>
              <p>Please book a different time slot that works better, or contact support if you need assistance.</p>`;
    }

    const html = generateEmailTemplate(subject, body, appName, appTagline);
    
    // Send to Patient
    try {
      const patientAttachments: any[] = [];
      if (type === 'completed' && appt.invoiceUrl) {
        const fullPath = path.join(__dirname, '../../', appt.invoiceUrl);
        if (fs.existsSync(fullPath)) {
          patientAttachments.push({
            filename: `Invoice-${appt._id}.pdf`,
            path: fullPath
          });
        }
      }

      await transporter.sendMail({
        from: `"${appName} Appointments" <appointments@mitoreboot.com>`,
        to: appt.userId.email,
        subject: `[${appName}] ${subject}`,
        html,
        attachments: patientAttachments
      });
    } catch (err) {
      console.error(err);
    }

    // Send to Doctor (if confirmed)
    if (type === 'confirmed' && appt.doctorId?.email) {
      const docHtml = generateEmailTemplate('Confirmed Appointment with Patient', `
        <p>Hi Dr. ${appt.doctorId.name},</p>
        <p>You have a confirmed appointment with patient <strong>${appt.userId.name}</strong>.</p>
        <p><strong>Date:</strong> ${appt.date}</p>
        <p><strong>Time:</strong> ${appt.time}</p>
        <p><strong>Meeting Link:</strong> <a href="${appt.meetingLink}">${appt.meetingLink}</a></p>
      `, appName, appTagline);

      try {
        await transporter.sendMail({
          from: `"${appName} Appointments" <appointments@mitoreboot.com>`,
          to: appt.doctorId.email,
          subject: `[${appName}] Confirmed Appointment: ${appt.userId.name}`,
          html: docHtml
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Send to Doctor (if completed)
    if (type === 'completed' && appt.doctorId?.email) {
      const docHtml = generateEmailTemplate('Consultation Completed Successfully', `
        <p>Hi Dr. ${appt.doctorId.name},</p>
        <p>Your consultation with patient <strong>${appt.userId.name}</strong> on ${appt.date} has been completed.</p>
        <p><strong>Consultation Notes:</strong> ${appt.notes || 'None provided.'}</p>
        ${appt.prescriptionText ? `<p><strong>Prescription Notes:</strong> ${appt.prescriptionText}</p>` : ''}
      `, appName, appTagline);

      const docAttachments: any[] = [];
      if (appt.invoiceUrl) {
        const fullPath = path.join(__dirname, '../../', appt.invoiceUrl);
        if (fs.existsSync(fullPath)) {
          docAttachments.push({
            filename: `Invoice-${appt._id}.pdf`,
            path: fullPath
          });
        }
      }

      try {
        await transporter.sendMail({
          from: `"${appName} Appointments" <appointments@mitoreboot.com>`,
          to: appt.doctorId.email,
          subject: `[${appName}] Consultation Completed: ${appt.userId.name}`,
          html: docHtml,
          attachments: docAttachments
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Trigger SMS Notifications asynchronously
    try {
      if (type === 'booked' && appt.doctorId?.phone) {
        const docMessage = `[Mito Reboot] Hello Dr. ${appt.doctorId.name}, you have a new appointment request from patient ${appt.userId?.name || 'User'} on ${appt.date} at ${appt.time}. Reason: ${appt.reason || 'General Consultation'}. Please check your dashboard to accept/reject.`;
        SMSService.sendSMS(appt.doctorId.phone, docMessage).catch(err => {
          console.error('[Background] Failed to send Doctor booking SMS:', err);
        });
      } else if (type === 'confirmed' && appt.userId?.mobileNumber) {
        const isOnline = appt.type === 'online';
        const patientMessage = isOnline 
          ? `[Mito Reboot] Hi ${appt.userId.name}, your appointment with Dr. ${appt.doctorId.name} is confirmed for ${appt.date} at ${appt.time}. Join Meeting: ${appt.meetingLink}`
          : `[Mito Reboot] Hi ${appt.userId.name}, your appointment with Dr. ${appt.doctorId.name} is confirmed for ${appt.date} at ${appt.time}. Details: ${appt.meetingLink || 'Please visit the clinic at the scheduled slot.'}`;
        
        SMSService.sendSMS(appt.userId.mobileNumber, patientMessage).catch(err => {
          console.error('[Background] Failed to send Patient confirmation SMS:', err);
        });
      } else if (type === 'completed') {
        if (appt.doctorId?.phone) {
          const docMessage = `[Mito Reboot] Hello Dr. ${appt.doctorId.name}, your consultation with patient ${appt.userId?.name || 'User'} on ${appt.date} has been completed. Notes: ${appt.notes || 'None'}`;
          SMSService.sendSMS(appt.doctorId.phone, docMessage).catch(err => {
            console.error('[Background] Failed to send Doctor completion SMS:', err);
          });
        }
        if (appt.userId?.mobileNumber) {
          const patientMessage = `[Mito Reboot] Hi ${appt.userId.name}, your consultation with Dr. ${appt.doctorId.name} has been completed. Notes: ${appt.notes || 'None'}`;
          SMSService.sendSMS(appt.userId.mobileNumber, patientMessage).catch(err => {
            console.error('[Background] Failed to send Patient completion SMS:', err);
          });
        }
      }
    } catch (smsErr) {
      console.error('[Background] Error in SMS dispatch hook:', smsErr);
    }
  }

  public static async sendOrderEmail(type: 'placed' | 'assigned' | 'accepted' | 'shipped' | 'delivered', orderId: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    const ShopOrder = require('../models/ShopOrder').default;

    const order = await ShopOrder.findById(orderId)
      .populate('userId')
      .populate('vendorId');

    if (!order) return;

    let subject = '';
    let body = '';
    let attachments: any[] = [];

    const currencySymbol = order.currency === 'USD' ? '$' : '₹';

    if (type === 'placed') {
      // 1. Send Placed confirmation to Patient
      if (order.userId?.email) {
        subject = `Order Placed Successfully`;
        body = `<p>Hi ${order.userId.name || 'Patient'},</p>
                <p>Your order of total amount <strong>${currencySymbol}${order.totalAmount}</strong> has been successfully placed.</p>
                <p><strong>Order ID:</strong> ${order._id}</p>
                <p>We are reviewing your order and will assign a vendor shortly.</p>`;
        const html = generateEmailTemplate(subject, body, appName, appTagline);
        try {
          await transporter.sendMail({
            from: `"${appName} Shop" <shop@mitoreboot.com>`,
            to: order.userId.email,
            subject: `[${appName}] ${subject}`,
            html
          });
        } catch (err) {
          console.error('Error sending order placed mail to user:', err);
        }
      }

      // 2. Send New Order notification to Admin
      try {
        const adminSubject = `New Order Placed - ID: ${order._id}`;
        const adminBody = `<p>A new order has been placed on the platform.</p>
                           <p><strong>Order ID:</strong> ${order._id}</p>
                           <p><strong>Patient Name:</strong> ${order.patientName || (order.userId as any)?.name || 'N/A'}</p>
                           <p><strong>Total Amount:</strong> ${currencySymbol}${order.totalAmount}</p>
                           <p>Please review and assign this order to a vendor in the Admin Dashboard.</p>`;
        const adminHtml = generateEmailTemplate(adminSubject, adminBody, appName, appTagline);
        
        await transporter.sendMail({
          from: `"${appName} Shop" <shop@mitoreboot.com>`,
          to: process.env.ADMIN_EMAIL || 'admin@mitoreboot.com',
          subject: `[Admin] ${adminSubject}`,
          html: adminHtml
        });
      } catch (err) {
        console.error('Error sending admin notification:', err);
      }

      return;
    }

    if (type === 'assigned') {
      // Send mail to Patient
      if (order.userId?.email) {
        subject = `Your Order has been Assigned`;
        body = `<p>Hi ${order.userId.name || 'Patient'},</p>
                <p>Your order (ID: ${order._id}) has been assigned to our trusted vendor partner <strong>${order.vendorId?.name || 'Local Pharmacy Vendor'}</strong>.</p>
                <p>They are packing your items and will ship them soon.</p>`;
        const html = generateEmailTemplate(subject, body, appName, appTagline);
        try {
          await transporter.sendMail({
            from: `"${appName} Shop" <shop@mitoreboot.com>`,
            to: order.userId.email,
            subject: `[${appName}] ${subject}`,
            html
          });
        } catch (e) {
          console.error(e);
        }
      }

      // Send mail to Vendor
      if (order.vendorId?.email) {
        const vendorSubject = `New Order Assigned - ID: ${order._id}`;
        const vendorBody = `<p>Hello ${order.vendorId.name},</p>
                            <p>You have been assigned a new fulfillment order (ID: ${order._id}).</p>
                            <p>Please log in to your Vendor Portal to accept and process the shipment.</p>`;
        const vendorHtml = generateEmailTemplate(vendorSubject, vendorBody, appName, appTagline);
        try {
          await transporter.sendMail({
            from: `"${appName} Shop Logistics" <logistics@mitoreboot.com>`,
            to: order.vendorId.email,
            subject: `[Vendor Portal] ${vendorSubject}`,
            html: vendorHtml
          });
        } catch (e) {
          console.error(e);
        }
      }

      return;
    }

    if (type === 'accepted') {
      // Vendor Accepted order - Notify Admin
      try {
        const adminSubject = `Vendor Accepted Order - ID: ${order._id}`;
        const adminBody = `<p>Vendor <strong>${order.vendorId?.name || 'Vendor'}</strong> has accepted the order ${order._id} and started processing it.</p>`;
        const adminHtml = generateEmailTemplate(adminSubject, adminBody, appName, appTagline);
        await transporter.sendMail({
          from: `"${appName} Shop" <shop@mitoreboot.com>`,
          to: process.env.ADMIN_EMAIL || 'admin@mitoreboot.com',
          subject: `[Admin] ${adminSubject}`,
          html: adminHtml
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }

    if (type === 'shipped') {
      if (order.userId?.email) {
        subject = `Your Order has been Shipped!`;
        const courier = order.trackingDetails?.courierName || 'Courier Partner';
        const trackingId = order.trackingDetails?.trackingId || 'N/A';
        body = `<p>Hi ${order.userId.name || 'Patient'},</p>
                <p>Great news! Your order (ID: ${order._id}) has been shipped.</p>
                <p><strong>Courier:</strong> ${courier}</p>
                <p><strong>Tracking ID:</strong> ${trackingId}</p>
                <p>You can track the progress of your delivery directly in the app.</p>`;
        const html = generateEmailTemplate(subject, body, appName, appTagline);
        try {
          await transporter.sendMail({
            from: `"${appName} Shop" <shop@mitoreboot.com>`,
            to: order.userId.email,
            subject: `[${appName}] ${subject}`,
            html
          });
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    if (type === 'delivered') {
      // Attach Invoice PDF
      if (order.invoiceUrl) {
        const fullPath = path.join(__dirname, '../../', order.invoiceUrl);
        if (fs.existsSync(fullPath)) {
          attachments.push({
            filename: `Invoice-${order._id}.pdf`,
            path: fullPath
          });
        }
      }

      // Send to Patient
      if (order.userId?.email) {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const rateLink = `${appUrl}/?rateOrder=${order._id}`;
        subject = `Your Order has been Delivered 🎉`;
        body = `<p>Hi ${order.userId.name || 'Patient'},</p>
                <p>Your order (ID: ${order._id}) has been successfully delivered. We hope you are satisfied with the items!</p>
                <p>We have attached the official PDF invoice to this email for your records.</p>
                <p>We would love to hear your feedback! Please click the link below to rate the products in this order:</p>
                <div style="margin: 24px 0;">
                  <a href="${rateLink}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.15);">Rate & Review Products</a>
                </div>`;
        const html = generateEmailTemplate(subject, body, appName, appTagline);
        try {
          await transporter.sendMail({
            from: `"${appName} Shop" <shop@mitoreboot.com>`,
            to: order.userId.email,
            subject: `[${appName}] ${subject}`,
            html,
            attachments
          });
        } catch (e) {
          console.error(e);
        }
      }

      // Notify Admin
      try {
        const adminSubject = `Order Delivered successfully - ID: ${order._id}`;
        const adminBody = `<p>Order ${order._id} has been marked as <strong>Delivered</strong> by Vendor <strong>${order.vendorId?.name || 'Vendor'}</strong>.</p>
                           <p>Fulfillment completed successfully.</p>`;
        const adminHtml = generateEmailTemplate(adminSubject, adminBody, appName, appTagline);
        await transporter.sendMail({
          from: `"${appName} Shop" <shop@mitoreboot.com>`,
          to: process.env.ADMIN_EMAIL || 'admin@mitoreboot.com',
          subject: `[Admin] ${adminSubject}`,
          html: adminHtml
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }
  }

  /**
   * Send Report Ready Email
   */
  public static async sendReportReadyEmail(email: string, name: string, pdfUrl?: string) {
    const { appName, appTagline } = await EmailService.getBranding();
    
    const digitalReportSection = pdfUrl ? `
      <div style="margin-top: 20px;">
        <a href="${pdfUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          View Digital Report (PDF)
        </a>
      </div>
    ` : '';

    const html = generateEmailTemplate(`Your Lab Report is Ready`, `
      <p>Hi ${name},</p>
      <p>Good news! Your lab test report is now ready.</p>
      ${digitalReportSection}
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #166534; font-weight: 600;">Next Steps:</p>
        <ul style="margin-top: 8px; margin-bottom: 0; color: #15803d; padding-left: 20px;">
          <li>If you opted for a physical report, you can now collect it from the diagnostic center.</li>
          <li>Check your ${appName} app to track your booking status.</li>
        </ul>
      </div>
      <p>Thank you for choosing ${appName}!</p>
    `, appName, appTagline);
    try { await transporter.sendMail({ from: `"${appName}" <no-reply@mitoreboot.com>`, to: email, subject: `Your Lab Report is Ready`, html }); } catch (err) { console.error(err); }
  }
}
