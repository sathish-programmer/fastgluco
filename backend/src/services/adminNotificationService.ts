import { EmailService } from './emailService';
import { SMSService } from './smsService';
import { FCMService } from './fcmService';
import { User } from '../models/User';

export class AdminNotificationService {
  public static async dispatchRecommendation(
    userId: string,
    recommendationText: string,
    channels: string[]
  ): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const status: any = {};

    for (const channel of channels) {
      if (channel === 'email') {
        if (!user.email) {
          status.email = { status: 'failed', error: 'User does not have an email address' };
          continue;
        }
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_FROM_ADDRESS) {
          status.email = { status: 'failed', error: 'SMTP environment variables are not configured (SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM_ADDRESS)' };
          continue;
        }
        try {
          await EmailService.sendRawEmail(
            user.email,
            'New Doctor Recommendation - Mito Reboot',
            `<p>Dear ${user.name || 'Patient'},</p><p>A doctor has reviewed your record and sent the following recommendation:</p><blockquote style="background:#f1f5f9;padding:12px;border-left:4px solid #10b981;">${recommendationText.replace(/\n/g, '<br/>')}</blockquote><p>Please check your mobile app for details.</p>`
          );
          status.email = { status: 'delivered', sentAt: new Date() };
        } catch (err: any) {
          status.email = { status: 'failed', error: err.message || 'SMTP delivery failed' };
        }
      }

      if (channel === 'sms') {
        if (!user.mobileNumber) {
          status.sms = { status: 'failed', error: 'User does not have a phone number' };
          continue;
        }
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
          status.sms = { status: 'failed', error: 'Twilio environment variables are not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)' };
          continue;
        }
        try {
          const success = await SMSService.sendSMS(
            user.mobileNumber,
            `[Mito Reboot] New Doctor Recommendation: ${recommendationText.substring(0, 100)}... Check the app for more details.`
          );
          if (success) {
            status.sms = { status: 'delivered', sentAt: new Date() };
          } else {
            status.sms = { status: 'failed', error: 'Twilio API failed' };
          }
        } catch (err: any) {
          status.sms = { status: 'failed', error: err.message || 'SMS delivery failed' };
        }
      }

      if (channel === 'push') {
        if (!user.fcmToken) {
          status.push = { status: 'failed', error: 'User FCM token is not configured on device' };
          continue;
        }
        try {
          const success = await FCMService.sendPushNotification(
            userId,
            'Doctor Recommendation',
            recommendationText.substring(0, 100),
            'General'
          );
          if (success) {
            status.push = { status: 'delivered', sentAt: new Date() };
          } else {
            status.push = { status: 'failed', error: 'FCM push sending failed' };
          }
        } catch (err: any) {
          status.push = { status: 'failed', error: err.message || 'Push notification failed' };
        }
      }
    }

    return status;
  }
}
