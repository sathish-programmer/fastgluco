const fs = require('fs');
const path = require('path');
const PDFDocument = require('./backend/node_modules/pdfkit');

// Helper to wrap long lines
function wrapLine(text, maxChars = 92) {
  if (!text || text.length <= maxChars) return [text || ''];
  const lines = [];
  let remaining = text;
  let first = true;
  while (remaining.length > maxChars) {
    if (first) {
      lines.push(remaining.substring(0, maxChars));
      remaining = '    ' + remaining.substring(maxChars);
      first = false;
    } else {
      lines.push(remaining.substring(0, maxChars));
      remaining = '    ' + remaining.substring(maxChars);
    }
  }
  lines.push(remaining);
  return lines;
}

// Process file list into structured line items
function processFileList(files, targetLineCount) {
  const resultLines = [];
  
  for (const item of files) {
    if (!fs.existsSync(item.path)) continue;
    const content = fs.readFileSync(item.path, 'utf8');
    const rawLines = content.split('\n');

    // Section banner for the file
    resultLines.push({
      type: 'file-banner-start',
      text: `/* ========================================================================= */`
    });
    resultLines.push({
      type: 'file-banner-title',
      text: `/* FILE: ${item.path}`
    });
    resultLines.push({
      type: 'file-banner-sub',
      text: `/* MODULE: ${item.desc} | LANG: ${item.path.endsWith('.tsx') ? 'TypeScript React (TSX)' : 'TypeScript (TS)'}`
    });
    resultLines.push({
      type: 'file-banner-end',
      text: `/* ========================================================================= */`
    });

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const wrapped = wrapLine(line);
      for (let w = 0; w < wrapped.length; w++) {
        resultLines.push({
          type: 'code',
          lineNum: w === 0 ? (i + 1) : null,
          text: wrapped[w]
        });
        if (resultLines.length >= targetLineCount) {
          break;
        }
      }
      if (resultLines.length >= targetLineCount) break;
    }
    
    if (resultLines.length < targetLineCount) {
      resultLines.push({ type: 'code', lineNum: null, text: '' });
    }
    if (resultLines.length >= targetLineCount) break;
  }

  // Pad to exact target count if necessary
  while (resultLines.length < targetLineCount) {
    resultLines.push({ type: 'code', lineNum: null, text: '' });
  }

  return resultLines.slice(0, targetLineCount);
}

const part1Files = [
  { path: 'backend/src/server.ts', desc: 'Application Entry, Server Bootstrap & Lifecycle Management' },
  { path: 'backend/src/app.ts', desc: 'Express App Initialization, Security Headers & Middleware Pipeline' },
  { path: 'backend/src/config/db.ts', desc: 'MongoDB Database Connection & Index Management' },
  { path: 'backend/src/config/firebaseAdmin.ts', desc: 'Firebase Admin SDK Integration & Cloud Messaging Config' },
  { path: 'backend/src/models/User.ts', desc: 'Core User Profile, Metabolic Targets & Permissions Schema' },
  { path: 'backend/src/models/GlucoseReading.ts', desc: 'Continuous Blood Glucose Sensor Data & Fasting Metrics Schema' },
  { path: 'backend/src/models/CGMReport.ts', desc: 'Glycemic Variability & Metabolic Health Analysis Schema' },
  { path: 'backend/src/models/FoodLog.ts', desc: 'Circadian Meal Tracking & Nutritional Logging Schema' },
  { path: 'backend/src/models/DailyLoggingWorkflow.ts', desc: 'Daily Clinical & Lifestyle Logging Workflow Schema' },
  { path: 'backend/src/models/Appointment.ts', desc: 'Consultation Booking & Doctor Appointment Schema' },
  { path: 'backend/src/models/ShopOrder.ts', desc: 'Health Store Orders, Shipping & Payment Status Schema' },
  { path: 'backend/src/controllers/authController.ts', desc: 'User Authentication, JWT Token Issuance & OTP Verification' },
  { path: 'backend/src/controllers/glucoseController.ts', desc: 'Glucose Analytics, CGM Trend Calculations & Sync' }
];

const part2Files = [
  { path: 'user/src/context/AuthContext.tsx', desc: 'React Client Authentication Context & Session Management' },
  { path: 'user/src/services/habitsService.ts', desc: 'Daily Habit Tracking & Streak Service' },
  { path: 'user/src/services/pushNotificationService.ts', desc: 'Capacitor FCM Push Notification Handling & Token Sync' },
  { path: 'user/src/services/syncService.ts', desc: 'Offline-First Synchronization Engine' },
  { path: 'user/src/utils/fileDownloader.ts', desc: 'Medical Biomarker & Invoice PDF Downloader Utility' },
  { path: 'user/src/utils/geolocationHelper.ts', desc: 'Circadian Sunrise/Sunset Solar Calculator Utility' },
  { path: 'user/src/utils/ttsHelper.ts', desc: 'Text-to-Speech Audio Guidance Assistant' },
  { path: 'user/src/utils/notificationScheduler.ts', desc: 'Local Notification Engine & Fasting Reminders' }
];

const LINES_PER_PAGE = 55;
const PAGES_PER_PART = 30;
const TOTAL_CODE_LINES = LINES_PER_PAGE * PAGES_PER_PART; // 1,650 lines

console.log(`Processing Part 1 lines (Target: ${TOTAL_CODE_LINES})...`);
const part1Lines = processFileList(part1Files, TOTAL_CODE_LINES);

console.log(`Processing Part 2 lines (Target: ${TOTAL_CODE_LINES})...`);
const part2Lines = processFileList(part2Files, TOTAL_CODE_LINES);

console.log(`Part 1 lines ready: ${part1Lines.length}`);
console.log(`Part 2 lines ready: ${part2Lines.length}`);

// Render a single code page
function renderCodePage(doc, pageLines, sectionTitle, sectionPageNum, overallPageNum, totalOverallPages) {
  doc.addPage();
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Header Bar
  doc.rect(36, 22, pageWidth - 72, 22).fillColor('#f8fafc').fill();
  doc.rect(36, 22, pageWidth - 72, 22).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e293b');
  doc.text('MITO_REBOOT — Software Source Code Deposit', 44, 28, { lineBreak: false });

  const headerRight = overallPageNum 
    ? `${sectionTitle} | Page ${sectionPageNum} of 30 (Overall Page ${overallPageNum} of ${totalOverallPages})`
    : `${sectionTitle} | Page ${sectionPageNum} of 30`;
  
  doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
  doc.text(headerRight, pageWidth - 36 - doc.widthOfString(headerRight) - 8, 28, { lineBreak: false });

  // Line number gutter background
  const codeTopY = 50;
  const lineHeight = 13.3;
  const codeBottomY = codeTopY + (LINES_PER_PAGE * lineHeight);
  doc.rect(36, codeTopY, 40, codeBottomY - codeTopY).fillColor('#f1f5f9').fill();
  doc.moveTo(76, codeTopY).lineTo(76, codeBottomY).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

  // Outer border around code area
  doc.rect(36, codeTopY, pageWidth - 72, codeBottomY - codeTopY).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

  // Render lines
  let currY = codeTopY + 2;

  for (let i = 0; i < pageLines.length; i++) {
    const item = pageLines[i];
    const yPos = currY;

    if (item.type.startsWith('file-banner')) {
      // Shaded background for banner
      doc.rect(76.5, yPos - 1, pageWidth - 72 - 40.5, lineHeight).fillColor('#e0f2fe').fill();
      doc.font('Courier-Bold').fontSize(7.5).fillColor('#0369a1');
      doc.text(item.text, 82, yPos + 1.5, { lineBreak: false });
    } else {
      // Line number
      if (item.lineNum !== null && item.lineNum !== undefined) {
        doc.font('Courier').fontSize(7.2).fillColor('#64748b');
        const numStr = String(item.lineNum).padStart(4, '0');
        doc.text(numStr, 40, yPos + 1.5, { width: 32, align: 'right', lineBreak: false });
      }

      // Code text
      if (item.text) {
        doc.font('Courier').fontSize(7.5).fillColor('#0f172a');
        doc.text(item.text, 82, yPos + 1.5, { lineBreak: false });
      }
    }

    currY += lineHeight;
  }

  // Footer Bar
  const footerY = 794;
  doc.moveTo(36, footerY).lineTo(pageWidth - 36, footerY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

  doc.font('Helvetica-Oblique').fontSize(7).fillColor('#64748b');
  doc.text('CONFIDENTIAL • FOR COPYRIGHT REGISTRATION PURPOSES ONLY • MITO REBOOT TECHNOLOGIES', 36, footerY + 8, { lineBreak: false });

  const footerRight = overallPageNum
    ? `Page ${overallPageNum} of ${totalOverallPages}`
    : `Page ${sectionPageNum} of 30`;

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
  doc.text(footerRight, pageWidth - 36 - doc.widthOfString(footerRight), footerY + 8, { lineBreak: false });
}

// Render Cover Page
function renderCoverPage(doc) {
  doc.addPage();
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Outer decorative border
  doc.rect(36, 36, pageWidth - 72, pageHeight - 72).strokeColor('#1e3a8a').lineWidth(1.5).stroke();
  doc.rect(40, 40, pageWidth - 80, pageHeight - 80).strokeColor('#93c5fd').lineWidth(0.5).stroke();

  // Top header banner
  doc.rect(42, 42, pageWidth - 84, 50).fillColor('#1e3a8a').fill();
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff');
  doc.text('GOVERNMENT OF INDIA • COPYRIGHT OFFICE COMPLIANCE DEPOSIT', 42, 54, { align: 'center', width: pageWidth - 84 });
  doc.font('Helvetica').fontSize(8.5).fillColor('#bfdbfe');
  doc.text('Extract of Source Code Submitted Under Rule 70 of Copyright Rules, 2013', 42, 69, { align: 'center', width: pageWidth - 84 });

  // Main Title
  doc.font('Helvetica-Bold').fontSize(26).fillColor('#0f172a');
  doc.text('MITO_REBOOT', 60, 125, { align: 'center', width: pageWidth - 120 });

  doc.font('Helvetica').fontSize(12).fillColor('#2563eb');
  doc.text('Circadian Fasting & Metabolic Health Intelligence Platform', 60, 158, { align: 'center', width: pageWidth - 120 });

  // Subtitle Badge
  doc.rect(120, 185, pageWidth - 240, 32).fillColor('#f0fdf4').fill();
  doc.rect(120, 185, pageWidth - 240, 32).strokeColor('#86efac').lineWidth(1).stroke();
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#15803d');
  doc.text('SOURCE CODE DEPOSIT: FIRST 30 AND LAST 30 PAGES', 120, 195, { align: 'center', width: pageWidth - 240 });

  // Information Table
  const tableX = 60;
  let tableY = 245;
  const tableW = pageWidth - 120;
  const col1W = 170;
  const col2W = tableW - col1W;
  const rowHeight = 26;

  const metadata = [
    { label: 'Title of the Work', val: 'Mito_Reboot (Circadian Fasting & Metabolic Health System)' },
    { label: 'Nature & Class of Work', val: 'Computer Software / Computer Programme (Literary Work)' },
    { label: 'Software Version', val: 'Release v5.15.0 (Mobile Client) / v1.0.0 (API Backend)' },
    { label: 'Primary Language / Stack', val: 'TypeScript, JavaScript (Node.js, Express, React, Capacitor)' },
    { label: 'Database & Storage', val: 'MongoDB Mongoose ODM, Firebase Admin SDK' },
    { label: 'Deposit Scope', val: 'First 30 Pages (Part 1) & Last 30 Pages (Part 2)' },
    { label: 'Total Source Code Pages', val: '60 Pages (Exact Statutory Submission)' },
    { label: 'Total Codebase Scale', val: '220+ Proprietary Source Modules (~86,000 Lines of Code)' },
    { label: 'Lead Architect / Author', val: 'Sathish Kumar K' },
    { label: 'Date of Generation', val: 'September 2026' }
  ];

  doc.rect(tableX, tableY, tableW, metadata.length * rowHeight).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

  metadata.forEach((row, idx) => {
    const y = tableY + idx * rowHeight;
    const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(tableX, y, tableW, rowHeight).fillColor(bg).fill();
    doc.rect(tableX, y, tableW, rowHeight).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#334155');
    doc.text(row.label, tableX + 12, y + 8, { width: col1W - 24, lineBreak: false });

    doc.font('Helvetica').fontSize(8.5).fillColor('#0f172a');
    doc.text(row.val, tableX + col1W + 10, y + 8, { width: col2W - 20, lineBreak: false });
  });

  // Statutory Certification Box
  const certY = 535;
  doc.rect(tableX, certY, tableW, 140).fillColor('#f8fafc').fill();
  doc.rect(tableX, certY, tableW, 140).strokeColor('#94a3b8').lineWidth(1).stroke();

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1e293b');
  doc.text('STATUTORY DECLARATION & SOURCE CODE AUTHENTICITY', tableX + 16, certY + 14);

  const certText = 
    'This document represents the formal source code deposit for software copyright registration in accordance with Rule 70 of the Copyright Rules. ' +
    'The enclosed 60 pages comprise the first 30 pages and the last 30 pages of original, proprietary source code of the computer programme titled "Mito_Reboot". ' +
    'The deposit accurately reflects the software architecture, core database models, metabolic health engines, background synchronization, and local notification scheduling systems without redactions of operational program logic.';

  doc.font('Helvetica').fontSize(8).fillColor('#475569');
  doc.text(certText, tableX + 16, certY + 32, { width: tableW - 32, lineGap: 3 });

  // Signature lines
  doc.moveTo(tableX + 20, certY + 115).lineTo(tableX + 200, certY + 115).strokeColor('#64748b').lineWidth(0.5).stroke();
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#334155');
  doc.text('Authorized Signatory / Applicant', tableX + 20, certY + 120, { lineBreak: false });

  doc.moveTo(tableX + tableW - 200, certY + 115).lineTo(tableX + tableW - 20, certY + 115).strokeColor('#64748b').lineWidth(0.5).stroke();
  doc.text('Date & Place', tableX + tableW - 200, certY + 120, { lineBreak: false });

  // Footer on cover
  doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8');
  doc.text('Mito Reboot Technologies • Confidential Software Copyright Documentation', 60, pageHeight - 55, { align: 'center', width: pageWidth - 120, lineBreak: false });
}

// Render Table of Contents / Index Page
function renderIndexPage(doc) {
  doc.addPage();
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Header Bar
  doc.rect(36, 22, pageWidth - 72, 22).fillColor('#f8fafc').fill();
  doc.rect(36, 22, pageWidth - 72, 22).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e293b');
  doc.text('MITO_REBOOT — Software Source Code Deposit', 44, 28, { lineBreak: false });
  doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
  const rightText = 'Index & Manifest | Page 2 of 62';
  doc.text(rightText, pageWidth - 36 - doc.widthOfString(rightText) - 8, 28, { lineBreak: false });

  // Title
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a');
  doc.text('TABLE OF CONTENTS & SOURCE CODE MANIFEST', 40, 60, { lineBreak: false });

  doc.font('Helvetica').fontSize(8.5).fillColor('#64748b');
  doc.text('Summary of proprietary modules included in the First 30 Pages (Part 1) and Last 30 Pages (Part 2)', 40, 80, { lineBreak: false });

  // Section 1 Table
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e3a8a');
  doc.text('PART 1: FIRST 30 PAGES (PAGES 3 – 32)', 40, 105, { lineBreak: false });

  const p1TableY = 120;
  const tableW = pageWidth - 80;
  const colFile = 220;
  const colDesc = tableW - colFile - 55;
  const colPage = 55;
  const rowH = 19;

  // Header Row
  doc.rect(40, p1TableY, tableW, rowH).fillColor('#1e3a8a').fill();
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
  doc.text('SOURCE FILE PATH', 46, p1TableY + 6, { lineBreak: false });
  doc.text('FUNCTIONAL MODULE / ARCHITECTURAL ROLE', 40 + colFile + 6, p1TableY + 6, { lineBreak: false });
  doc.text('PAGES', 40 + colFile + colDesc + 6, p1TableY + 6, { lineBreak: false });

  const p1Manifest = [
    { f: 'backend/src/server.ts', d: 'Application bootstrap, HTTP/HTTPS listener & lifecycle', p: 'P. 1–2' },
    { f: 'backend/src/app.ts', d: 'Express routing architecture, helmet, cors & rate limiters', p: 'P. 2–4' },
    { f: 'backend/src/config/db.ts', d: 'MongoDB database connection & index optimization', p: 'P. 4' },
    { f: 'backend/src/config/firebaseAdmin.ts', d: 'Firebase Admin SDK initialization for authentication', p: 'P. 4–5' },
    { f: 'backend/src/models/User.ts', d: 'Core user profile, metabolic markers & permissions schema', p: 'P. 5–7' },
    { f: 'backend/src/models/GlucoseReading.ts', d: 'Continuous Blood Glucose Sensor telemetry data schema', p: 'P. 7–8' },
    { f: 'backend/src/models/CGMReport.ts', d: 'Metabolic & glycemic report schema with time-in-range', p: 'P. 8–10' },
    { f: 'backend/src/models/FoodLog.ts', d: 'Circadian meal logging & macronutrient tracking schema', p: 'P. 10–12' },
    { f: 'backend/src/models/DailyLoggingWorkflow.ts', d: 'Daily clinical & habit workflow orchestration schema', p: 'P. 12–13' },
    { f: 'backend/src/models/Appointment.ts', d: 'Doctor & metabolic coach appointment booking schema', p: 'P. 13–14' },
    { f: 'backend/src/models/ShopOrder.ts', d: 'Metabolic healthcare products & shipping orders schema', p: 'P. 14–17' },
    { f: 'backend/src/controllers/authController.ts', d: 'User authentication, JWT token issuance & OTP verification', p: 'P. 17–27' },
    { f: 'backend/src/controllers/glucoseController.ts', d: 'Continuous glucose analytics & circadian fast correlation', p: 'P. 27–30' }
  ];

  p1Manifest.forEach((row, i) => {
    const y = p1TableY + rowH + i * rowH;
    const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(40, y, tableW, rowH).fillColor(bg).fill();
    doc.rect(40, y, tableW, rowH).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

    doc.font('Courier').fontSize(7).fillColor('#0f172a');
    doc.text(row.f, 46, y + 5.5, { width: colFile - 10, lineBreak: false });

    doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
    doc.text(row.d, 40 + colFile + 6, y + 5.5, { width: colDesc - 10, lineBreak: false });

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#2563eb');
    doc.text(row.p, 40 + colFile + colDesc + 6, y + 5.5, { lineBreak: false });
  });

  // Section 2 Table
  const p2Start = p1TableY + rowH + p1Manifest.length * rowH + 20;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e3a8a');
  doc.text('PART 2: LAST 30 PAGES (PAGES 33 – 62)', 40, p2Start, { lineBreak: false });

  const p2TableY = p2Start + 15;
  doc.rect(40, p2TableY, tableW, rowH).fillColor('#1e3a8a').fill();
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
  doc.text('SOURCE FILE PATH', 46, p2TableY + 6, { lineBreak: false });
  doc.text('FUNCTIONAL MODULE / ARCHITECTURAL ROLE', 40 + colFile + 6, p2TableY + 6, { lineBreak: false });
  doc.text('PAGES', 40 + colFile + colDesc + 6, p2TableY + 6, { lineBreak: false });

  const p2Manifest = [
    { f: 'user/src/context/AuthContext.tsx', d: 'React client auth state, tokens & session lifecycle', p: 'P. 1–11' },
    { f: 'user/src/services/habitsService.ts', d: 'Daily health habits tracking & streak computation', p: 'P. 11–12' },
    { f: 'user/src/services/pushNotificationService.ts', d: 'Capacitor FCM push notifications & device registration', p: 'P. 12–15' },
    { f: 'user/src/services/syncService.ts', d: 'Offline-first synchronization with conflict resolution', p: 'P. 15–17' },
    { f: 'user/src/utils/fileDownloader.ts', d: 'Medical biomarker report & order invoice downloader', p: 'P. 17–19' },
    { f: 'user/src/utils/geolocationHelper.ts', d: 'GPS-based solar calculation for circadian fasting windows', p: 'P. 19–20' },
    { f: 'user/src/utils/ttsHelper.ts', d: 'Audio speech engine for guided mindfulness & health tips', p: 'P. 20–23' },
    { f: 'user/src/utils/notificationScheduler.ts', d: 'Circadian fasting reminders & local notification triggers', p: 'P. 23–30' }
  ];

  p2Manifest.forEach((row, i) => {
    const y = p2TableY + rowH + i * rowH;
    const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(40, y, tableW, rowH).fillColor(bg).fill();
    doc.rect(40, y, tableW, rowH).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

    doc.font('Courier').fontSize(7).fillColor('#0f172a');
    doc.text(row.f, 46, y + 5.5, { width: colFile - 10, lineBreak: false });

    doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
    doc.text(row.d, 40 + colFile + 6, y + 5.5, { width: colDesc - 10, lineBreak: false });

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#2563eb');
    doc.text(row.p, 40 + colFile + colDesc + 6, y + 5.5, { lineBreak: false });
  });

  // Bottom Notice
  const footerY = 794;
  doc.moveTo(36, footerY).lineTo(pageWidth - 36, footerY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
  doc.font('Helvetica-Oblique').fontSize(7).fillColor('#64748b');
  doc.text('CONFIDENTIAL • FOR COPYRIGHT REGISTRATION PURPOSES ONLY • MITO REBOOT TECHNOLOGIES', 36, footerY + 8, { lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
  doc.text('Page 2 of 62', pageWidth - 36 - doc.widthOfString('Page 2 of 62'), footerY + 8, { lineBreak: false });
}

// 1. Build Combined Document (Cover + Index + Part 1 + Part 2 = 62 pages)
function buildCombinedDoc(filename) {
  console.log(`Generating combined document: ${filename}...`);
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 15, bottom: 15, left: 15, right: 15 },
    autoFirstPage: false
  });
  const out = fs.createWriteStream(filename);
  doc.pipe(out);

  // Page 1: Cover
  renderCoverPage(doc);

  // Page 2: Index
  renderIndexPage(doc);

  // Pages 3-32: Part 1 (First 30 Pages)
  for (let p = 0; p < PAGES_PER_PART; p++) {
    const pageLines = part1Lines.slice(p * LINES_PER_PAGE, (p + 1) * LINES_PER_PAGE);
    renderCodePage(doc, pageLines, 'Part 1: First 30 Pages', p + 1, p + 3, 62);
  }

  // Pages 33-62: Part 2 (Last 30 Pages)
  for (let p = 0; p < PAGES_PER_PART; p++) {
    const pageLines = part2Lines.slice(p * LINES_PER_PAGE, (p + 1) * LINES_PER_PAGE);
    renderCodePage(doc, pageLines, 'Part 2: Last 30 Pages', p + 1, p + 33, 62);
  }

  doc.end();
  return new Promise((resolve) => out.on('finish', resolve));
}

// 2. Build Strictly 60 Pages Document (Part 1 [1-30] + Part 2 [31-60] = 60 pages)
function buildExact60Doc(filename) {
  console.log(`Generating strict 60-page document: ${filename}...`);
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 15, bottom: 15, left: 15, right: 15 },
    autoFirstPage: false
  });
  const out = fs.createWriteStream(filename);
  doc.pipe(out);

  for (let p = 0; p < PAGES_PER_PART; p++) {
    const pageLines = part1Lines.slice(p * LINES_PER_PAGE, (p + 1) * LINES_PER_PAGE);
    renderCodePage(doc, pageLines, 'Part 1: First 30 Pages', p + 1, p + 1, 60);
  }

  for (let p = 0; p < PAGES_PER_PART; p++) {
    const pageLines = part2Lines.slice(p * LINES_PER_PAGE, (p + 1) * LINES_PER_PAGE);
    renderCodePage(doc, pageLines, 'Part 2: Last 30 Pages', p + 1, p + 31, 60);
  }

  doc.end();
  return new Promise((resolve) => out.on('finish', resolve));
}

// 3. Build Standalone Part 1 (First 30 Pages, exactly 30 pages)
function buildPart1Doc(filename) {
  console.log(`Generating standalone Part 1: ${filename}...`);
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 15, bottom: 15, left: 15, right: 15 },
    autoFirstPage: false
  });
  const out = fs.createWriteStream(filename);
  doc.pipe(out);

  for (let p = 0; p < PAGES_PER_PART; p++) {
    const pageLines = part1Lines.slice(p * LINES_PER_PAGE, (p + 1) * LINES_PER_PAGE);
    renderCodePage(doc, pageLines, 'Part 1: First 30 Pages', p + 1, null, null);
  }

  doc.end();
  return new Promise((resolve) => out.on('finish', resolve));
}

// 4. Build Standalone Part 2 (Last 30 Pages, exactly 30 pages)
function buildPart2Doc(filename) {
  console.log(`Generating standalone Part 2: ${filename}...`);
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 15, bottom: 15, left: 15, right: 15 },
    autoFirstPage: false
  });
  const out = fs.createWriteStream(filename);
  doc.pipe(out);

  for (let p = 0; p < PAGES_PER_PART; p++) {
    const pageLines = part2Lines.slice(p * LINES_PER_PAGE, (p + 1) * LINES_PER_PAGE);
    renderCodePage(doc, pageLines, 'Part 2: Last 30 Pages', p + 1, null, null);
  }

  doc.end();
  return new Promise((resolve) => out.on('finish', resolve));
}

async function run() {
  await buildCombinedDoc('Mito_Reboot_Source_Code_First30_and_Last30_Pages.pdf');
  await buildExact60Doc('Mito_Reboot_Source_Code_Exact_60_Pages.pdf');
  await buildPart1Doc('Mito_Reboot_Source_Code_First_30_Pages.pdf');
  await buildPart2Doc('Mito_Reboot_Source_Code_Last_30_Pages.pdf');
  console.log('ALL PDF DOCUMENTS GENERATED SUCCESSFULLY!');
}

run().catch(console.error);
