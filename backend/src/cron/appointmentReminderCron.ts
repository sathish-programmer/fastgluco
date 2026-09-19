import { Appointment } from '../models/Appointment';
import { EmailService } from '../services/emailService';
import { FCMService } from '../services/fcmService';

export class AppointmentReminderCron {
  /**
   * Runs every minute.
   * Finds confirmed appointments that start in 24 hours, 1 hour, 30 mins, or 10 mins
   * and sends reminder push notifications and emails to both the patient and doctor.
   */
  public static async sendUpcomingReminders() {
    try {
      const now = new Date();

      // Check reminder windows: 24h, 1h, 30m, 10m
      const reminderConfigs = [
        { minutes: 1440, key: '24h', label: '24 hours' },
        { minutes: 60, key: '1h', label: '1 hour' },
        { minutes: 30, key: '30min', label: '30 minutes' },
        { minutes: 10, key: '10min', label: '10 minutes' }
      ];

      for (const config of reminderConfigs) {
        const targetTime = new Date(now.getTime() + config.minutes * 60 * 1000);

        // Format target date as YYYY-MM-DD for the appointment date field
        const pad = (n: number) => String(n).padStart(2, '0');
        const targetDateStr = `${targetTime.getFullYear()}-${pad(targetTime.getMonth() + 1)}-${pad(targetTime.getDate())}`;
        const targetTimeStr = `${pad(targetTime.getHours())}:${pad(targetTime.getMinutes())}`;

        const appointments = await Appointment.find({
          status: 'confirmed',
          date: targetDateStr,
          time: targetTimeStr,
          [`reminders.${config.key}`]: { $ne: true } // skip if already sent
        })
          .populate('userId', 'name email')
          .populate('doctorId', 'name email');

        for (const appt of appointments) {
          const patient: any = appt.userId;
          const doctor: any = appt.doctorId;

          const reminderLabel = config.label;
          const meetLink = appt.meetingLink || '#';

          // 1. Send FCM Push Notification to Patient
          if (patient?._id) {
            FCMService.sendNotificationToUser(patient._id.toString(), {
              title: `Consultation in ${reminderLabel}`,
              body: `Your appointment with Dr. ${doctor?.name || 'Doctor'} begins in ${reminderLabel} (${appt.time}).`,
              type: 'AppointmentReminder',
              data: {
                route: 'Appointments',
                appointmentId: appt._id.toString()
              }
            }).catch(console.error);
          }

          // 2. Send Emails
          try {
            const { appName, appTagline } = await EmailService.getBrandingPublic();
            const { generateEmailTemplatePublic } = await import('../services/emailService');
            const emailFrom = `"${appName} Appointments" <support@mitoreboot.in>`;
            const subject = `[${appName}] Appointment Reminder — Starts in ${reminderLabel}`;

            if (patient?.email) {
              const patientBody = `
                <p>Hi ${patient?.name || 'Patient'},</p>
                <p>This is a reminder that your appointment with <strong>Dr. ${doctor?.name || 'your Doctor'}</strong> starts in <strong>${reminderLabel}</strong>.</p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;">
                  <tr><td style="padding:8px 0;color:#64748b;font-weight:600;width:120px;">Date:</td><td style="color:#0f172a;font-weight:700;">${appt.date}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Time:</td><td style="color:#0f172a;font-weight:700;">${appt.time}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Join Now:</td><td><a href="${meetLink}" style="color:#2563eb;font-weight:700;">${meetLink}</a></td></tr>
                </table>
                <p>Please be ready a few minutes early to ensure a smooth consultation.</p>
              `;
              const html = generateEmailTemplatePublic(`Appointment in ${reminderLabel}`, patientBody, appName, appTagline);
              EmailService.sendRawEmail(patient.email, subject, html, emailFrom).catch(console.error);
            }

            if (doctor?.email) {
              const doctorBody = `
                <p>Hi Dr. ${doctor?.name || 'Doctor'},</p>
                <p>Reminder: Your consultation with <strong>${patient?.name || 'your patient'}</strong> begins in <strong>${reminderLabel}</strong>.</p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;">
                  <tr><td style="padding:8px 0;color:#64748b;font-weight:600;width:120px;">Patient:</td><td style="color:#0f172a;font-weight:700;">${patient?.name || '-'}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Date:</td><td style="color:#0f172a;font-weight:700;">${appt.date}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Time:</td><td style="color:#0f172a;font-weight:700;">${appt.time}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Join Now:</td><td><a href="${meetLink}" style="color:#2563eb;font-weight:700;">${meetLink}</a></td></tr>
                </table>
              `;
              const html = generateEmailTemplatePublic(`Consultation in ${reminderLabel}`, doctorBody, appName, appTagline);
              EmailService.sendRawEmail(doctor.email, subject, html, emailFrom).catch(console.error);
            }
          } catch (mailErr) {
            console.error('Error sending reminder email:', mailErr);
          }

          // Mark reminder flag as sent to ensure idempotency
          appt.set(`reminders.${config.key}`, true);
          await appt.save();
        }
      }
    } catch (err) {
      console.error('Error running appointment reminder cron:', err);
    }
  }
}
