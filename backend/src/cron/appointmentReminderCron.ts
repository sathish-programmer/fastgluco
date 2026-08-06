import { Appointment } from '../models/Appointment';
import { EmailService } from '../services/emailService';

export class AppointmentReminderCron {
  /**
   * Runs every minute.
   * Finds confirmed appointments that start in exactly ~30 mins or ~10 mins
   * and sends reminder emails to both the patient and the doctor.
   */
  public static async sendUpcomingReminders() {
    try {
      const now = new Date();

      // Check two reminder windows: 30 minutes and 10 minutes before
      for (const minutesBefore of [30, 10]) {
        const targetTime = new Date(now.getTime() + minutesBefore * 60 * 1000);

        // We match appointments that fall in a 1-minute window around the target
        const windowStart = new Date(targetTime.getTime() - 30 * 1000); // 30s before
        const windowEnd   = new Date(targetTime.getTime() + 30 * 1000); // 30s after

        // Format target date as YYYY-MM-DD for the appointment date field
        const pad = (n: number) => String(n).padStart(2, '0');
        const targetDateStr = `${targetTime.getFullYear()}-${pad(targetTime.getMonth() + 1)}-${pad(targetTime.getDate())}`;
        const targetTimeStr = `${pad(targetTime.getHours())}:${pad(targetTime.getMinutes())}`;

        const appointments = await Appointment.find({
          status: 'confirmed',
          date: targetDateStr,
          time: targetTimeStr,
          [`reminders.${minutesBefore}min`]: { $ne: true } // skip if already sent
        })
          .populate('userId', 'name email')
          .populate('doctorId', 'name email');

        for (const appt of appointments) {
          const patient: any = appt.userId;
          const doctor:  any = appt.doctorId;

          if (!patient?.email && !doctor?.email) continue;

          const { appName, appTagline } = await EmailService.getBrandingPublic();
          const reminderLabel = minutesBefore === 30 ? '30 minutes' : '10 minutes';
          const meetLink = appt.meetingLink || '#';

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

          const { generateEmailTemplatePublic } = await import('../services/emailService');

          const emailFrom = `"${appName} Appointments" <support@mitoreboot.in>`;
          const subject = `[${appName}] Appointment Reminder — Starts in ${reminderLabel}`;

          if (patient?.email) {
            const html = generateEmailTemplatePublic(`Appointment in ${reminderLabel}`, patientBody, appName, appTagline);
            EmailService.sendRawEmail(patient.email, subject, html, emailFrom).catch(console.error);
          }

          if (doctor?.email) {
            const html = generateEmailTemplatePublic(`Consultation in ${reminderLabel}`, doctorBody, appName, appTagline);
            EmailService.sendRawEmail(doctor.email, subject, html, emailFrom).catch(console.error);
          }

          // Create database notification for user so they see it in the app
          try {
            const { Notification } = require('../models/Notification');
            await Notification.create({
              userId: patient._id,
              title: `Upcoming Consultation with Dr. ${doctor?.name || 'Doctor'}`,
              body: `Your consultation starts in ${reminderLabel} (${appt.time}).`,
              type: 'General',
              isRead: false,
              isSent: true,
              sentAt: new Date()
            });
          } catch (e) {
            console.error('Failed to create in-app notification:', e);
          }

          // Mark reminder as sent so we don't send it again
          appt.set(`reminders.${minutesBefore}min`, true);
          await appt.save();
        }
      }
    } catch (err) {
      console.error('[AppointmentReminderCron] Error:', err);
    }
  }
}
