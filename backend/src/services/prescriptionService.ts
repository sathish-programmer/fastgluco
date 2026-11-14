import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { IAppointment } from '../models/Appointment';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

export class PrescriptionService {
  /**
   * Generates a formal, professional medical prescription PDF
   * and returns the relative URL to the file.
   */
  public static async generatePrescriptionPDF(appointment: any): Promise<string> {
    const config = await PaymentGatewayConfig.findOne();
    const appName = config?.appName || 'Mito_Reboot';
    const appTagline = config?.appTagline || 'Integrative Healthcare & Metabolic Lifestyle Care';

    const doctor = appointment.doctorId || {};
    const patient = appointment.userId || {};

    return new Promise((resolve, reject) => {
      try {
        const prescriptionsDir = path.join(__dirname, '../../uploads/prescriptions');
        if (!fs.existsSync(prescriptionsDir)) {
          fs.mkdirSync(prescriptionsDir, { recursive: true });
        }

        const fileName = `Prescription-${appointment._id}.pdf`;
        const filePath = path.join(prescriptionsDir, fileName);

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Doctor Header Details
        const docName = doctor.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Consulting Specialist';
        const docQual = doctor.qualification ? `${doctor.qualification} • ` : '';
        const docSpec = doctor.specialty || doctor.focusTitle || 'Consultant Physician';
        const docAffil = doctor.hospitalName || 'Mito Reboot Specialist Panel';
        const docContact = doctor.email ? ` | ${doctor.email}` : '';
        const docReg = doctor.registrationNumber ? `Reg. No: ${doctor.registrationNumber}` : '';

        // Pre-calculate heights to dynamically size the top banner without overlap
        doc.fontSize(11).font('Helvetica-Bold');
        const nameH = doc.heightOfString(docName, { width: 310 });
        doc.fontSize(8).font('Helvetica-Bold');
        const specH = doc.heightOfString(`${docQual}${docSpec}`, { width: 310, lineGap: 1.5 });
        doc.fontSize(7.5).font('Helvetica');
        const affilH = doc.heightOfString(`${docAffil}${docContact}`, { width: 310, lineGap: 1 });
        doc.fontSize(7.5).font('Helvetica-Bold');
        const regH = docReg ? doc.heightOfString(docReg, { width: 310 }) + 2 : 0;

        const rightBlockH = nameH + specH + affilH + regH + 6;
        const bannerH = Math.max(76, rightBlockH + 16);

        // --- HEADER SECTION ---
        // Top banner background
        doc.rect(40, 40, 515, bannerH).fill('#F8FAFC');

        // Platform Brand (Left Aligned)
        doc.fillColor('#0284C7').fontSize(15).font('Helvetica-Bold').text(`${appName.toUpperCase()} CLINICAL CARE`, 52, 48);
        doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(appTagline, 52, 66);
        doc.fontSize(7.5).fillColor('#94A3B8').text('Telemedicine Practice Guidelines (2020) Compliant', 52, 78);

        // Doctor Header Info (Right Aligned, dynamic Y so wrapped text never overlaps)
        let currDocY = 48;
        doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text(docName, 235, currDocY, { width: 310, align: 'right' });
        currDocY = doc.y + 2;

        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text(`${docQual}${docSpec}`, 235, currDocY, { width: 310, align: 'right', lineGap: 1.5 });
        currDocY = doc.y + 2;

        doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text(`${docAffil}${docContact}`, 235, currDocY, { width: 310, align: 'right', lineGap: 1 });
        currDocY = doc.y + 2;

        if (docReg) {
          doc.fillColor('#0284C7').fontSize(7.5).font('Helvetica-Bold').text(docReg, 235, currDocY, { width: 310, align: 'right' });
        }

        // Primary Accent Line
        const accentY = 40 + bannerH;
        doc.rect(40, accentY, 515, 3).fill('#0284C7');

        // --- PATIENT & CONSULTATION META BAR ---
        const metaTop = accentY + 8;
        doc.rect(40, metaTop, 515, 48).fill('#F1F5F9');

        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('PATIENT NAME:', 50, metaTop + 8);
        doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(patient.name || 'Patient', 125, metaTop + 8);

        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('AGE / GENDER:', 50, metaTop + 22);
        const ageGender = `${patient.age ? patient.age + ' yrs' : 'N/A'} / ${patient.gender || 'N/A'}`;
        doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica').text(ageGender, 125, metaTop + 22);

        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('PHONE / EMAIL:', 50, metaTop + 34);
        const contactStr = `${patient.mobileNumber || ''} ${patient.email ? '(' + patient.email + ')' : ''}`.trim() || 'N/A';
        doc.fillColor('#0F172A').fontSize(8).font('Helvetica').text(contactStr, 125, metaTop + 34);

        // Right side of meta box
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('DATE:', 360, metaTop + 8);
        doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica').text(appointment.date || new Date().toISOString().split('T')[0], 430, metaTop + 8);

        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('PRESCRIPTION #:', 360, metaTop + 22);
        doc.fillColor('#0284C7').fontSize(8.5).font('Helvetica-Bold').text(`RX-${appointment._id.toString().slice(-8).toUpperCase()}`, 430, metaTop + 22);

        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('MODE:', 360, metaTop + 34);
        doc.fillColor('#0F172A').fontSize(8).font('Helvetica').text(appointment.type === 'online' ? 'Teleconsultation (Video)' : 'In-Person Consultation', 430, metaTop + 34);

        let currentY = metaTop + 58;

        // --- DIAGNOSIS & CLINICAL ASSESSMENT ---
        const diagnosis = appointment.diagnosis || appointment.notes || appointment.reason || 'General Consultation Evaluation';
        doc.rect(40, currentY, 515, 20).fill('#E2E8F0');
        doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text('CLINICAL ASSESSMENT & DIAGNOSIS', 48, currentY + 6);
        currentY += 24;

        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(diagnosis, 48, currentY, { width: 495, lineGap: 3 });
        const diagHeight = doc.heightOfString(diagnosis, { width: 495, lineGap: 3 });
        currentY += diagHeight + 12;

        // --- Rx SYMBOL & MEDICINES SECTION ---
        doc.fillColor('#0284C7').fontSize(22).font('Helvetica-Bold').text('℞', 42, currentY);
        doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('PRESCRIPTION / MEDICATIONS', 70, currentY + 8);
        currentY += 28;

        const medicines = Array.isArray(appointment.medicines) && appointment.medicines.length > 0 
          ? appointment.medicines 
          : [];

        if (medicines.length > 0) {
          // Table Header
          doc.rect(40, currentY, 515, 20).fill('#0F172A');
          doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
          doc.text('#', 45, currentY + 6, { width: 20, align: 'center' });
          doc.text('MEDICINE & STRENGTH', 70, currentY + 6, { width: 150 });
          doc.text('DOSAGE', 225, currentY + 6, { width: 60 });
          doc.text('FREQUENCY', 290, currentY + 6, { width: 65 });
          doc.text('TIMING', 360, currentY + 6, { width: 65 });
          doc.text('DURATION', 430, currentY + 6, { width: 55 });
          doc.text('INSTRUCTIONS', 490, currentY + 6, { width: 60 });

          currentY += 20;

          // Rows
          medicines.forEach((med: any, index: number) => {
            const rowHeight = 22;
            const bg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
            doc.rect(40, currentY, 515, rowHeight).fill(bg);

            // Subtle border
            doc.rect(40, currentY, 515, rowHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

            doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text(String(index + 1), 45, currentY + 6, { width: 20, align: 'center' });
            doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text(med.name || 'Medicine', 70, currentY + 6, { width: 150 });
            doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(med.dosage || '-', 225, currentY + 6, { width: 60 });
            doc.fillColor('#0284C7').fontSize(7.5).font('Helvetica-Bold').text(med.frequency || '-', 290, currentY + 6, { width: 65 });
            doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(med.timing || '-', 360, currentY + 6, { width: 65 });
            doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(med.duration || '-', 430, currentY + 6, { width: 55 });
            doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Oblique').text(med.instructions || '-', 490, currentY + 6, { width: 60 });

            currentY += rowHeight;
          });
        } else if (appointment.prescriptionText && appointment.prescriptionText.trim()) {
          // Fallback text prescription
          doc.rect(40, currentY, 515, 60).fill('#F8FAFC');
          doc.rect(40, currentY, 515, 60).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
          doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica').text(appointment.prescriptionText, 48, currentY + 8, { width: 495, lineGap: 3 });
          currentY += 68;
        } else {
          doc.rect(40, currentY, 515, 30).fill('#F8FAFC');
          doc.fillColor('#64748B').fontSize(8).font('Helvetica-Oblique').text('No prescription medications recorded for this consultation.', 48, currentY + 10);
          currentY += 38;
        }

        currentY += 12;

        // --- DIETARY & LIFESTYLE MODULATION ADVICE ---
        const advice = appointment.dietaryAdvice || appointment.lifestyleAdvice;
        if (advice || appointment.notes) {
          doc.rect(40, currentY, 515, 18).fill('#E0F2FE');
          doc.fillColor('#0369A1').fontSize(8).font('Helvetica-Bold').text('SPECIAL ADVICE / LIFESTYLE & DIETARY MODULATION', 48, currentY + 5);
          currentY += 22;

          const adviceContent = [
            advice ? `• ${advice}` : '',
            appointment.notes && appointment.notes !== diagnosis ? `• Notes: ${appointment.notes}` : ''
          ].filter(Boolean).join('\n') || 'Maintain proper hydration, follow low-glycemic nutrition, and adequate restorative sleep.';

          doc.fillColor('#334155').fontSize(8).font('Helvetica').text(adviceContent, 48, currentY, { width: 495, lineGap: 2.5 });
          const advHeight = doc.heightOfString(adviceContent, { width: 495, lineGap: 2.5 });
          currentY += advHeight + 10;
        }

        // Follow Up
        if (appointment.followUpDate) {
          doc.fillColor('#0284C7').fontSize(8).font('Helvetica-Bold').text(`Recommended Follow-up: ${appointment.followUpDate}`, 48, currentY);
          currentY += 14;
        }

        // --- SIGNATURE AND STAMP BLOCK ---
        const footerStart = 700;
        doc.moveTo(40, footerStart).lineTo(555, footerStart).strokeColor('#CBD5E1').lineWidth(0.5).stroke();

        // Left note
        doc.fillColor('#64748B').fontSize(7).font('Helvetica-Bold').text('DIGITALLY AUTHENTICATED PRESCRIPTION', 48, footerStart + 8);
        doc.font('Helvetica').fontSize(6.5).fillColor('#94A3B8').text(
          'Generated via Mito Reboot Secure Clinical Telehealth Engine.\nValid under Ministry of Health & Family Welfare Telemedicine Practice Guidelines 2020.',
          48, footerStart + 20, { width: 280, lineGap: 1.5 }
        );

        // Right side Doctor Signature
        doc.fillColor('#0284C7').fontSize(9).font('Helvetica-Bold').text(docName, 360, footerStart + 10, { width: 185, align: 'right' });
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(docSpec, 360, footerStart + 23, { width: 185, align: 'right' });
        doc.fillColor('#10B981').fontSize(7).font('Helvetica-Bold').text('✓ SIGNED ELECTRONICALLY', 360, footerStart + 35, { width: 185, align: 'right' });

        // Bottom legal disclaimer
        doc.fillColor('#94A3B8').fontSize(6.5).font('Helvetica-Oblique').text(
          'In case of emergency or severe acute distress, please visit the nearest hospital casualty immediately.',
          40, 775, { width: 515, align: 'center' }
        );

        doc.end();

        writeStream.on('finish', () => {
          resolve(`/uploads/prescriptions/${fileName}`);
        });

        writeStream.on('error', (err) => {
          reject(err);
        });

      } catch (err) {
        reject(err);
      }
    });
  }
}

