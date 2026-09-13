#!/usr/bin/env python3
"""
Generate comprehensive Copyright Registration Dossier for Mito Reboot (user app).
Updated with:
  - Father's Name: Kumar (S/o Kumar)
  - Signature areas: Clean digital signature / physical sign placeholder boxes
  - Tagline: "Preventive Lifestyle App"
  - App Description: "Personalized Preventive Lifestyle & Metabolic Health Mobile Application"
  - Authors & Owners: Dr. Krithikaa and Dr. Lohith
  - Lead Developer: Sathish Kumar K
"""

import os
import subprocess

HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Copyright Registration Dossier - Mito Reboot</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  @page {
    size: A4;
    margin: 16mm 15mm 16mm 15mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.5;
    font-size: 9.2pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    page-break-after: always;
    position: relative;
    padding-bottom: 10px;
  }

  .page:last-child {
    page-break-after: avoid;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Typography */
  h1, h2, h3, h4, h5 {
    font-family: 'Inter', sans-serif;
    color: #0f172a;
    font-weight: 700;
  }

  h1 { font-size: 19pt; line-height: 1.25; margin-bottom: 6px; }
  h2 { font-size: 13pt; border-bottom: 2px solid #0f2a4a; padding-bottom: 4px; margin-top: 16px; margin-bottom: 10px; color: #0f2a4a; }
  h3 { font-size: 10.5pt; margin-top: 12px; margin-bottom: 5px; color: #1e3a8a; }
  p { margin-bottom: 7px; }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 7.2pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-pass { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
  .badge-rec { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
  .badge-info { background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }

  /* Cover Page */
  .cover {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    min-height: 252mm;
    border: 3px double #0f2a4a;
    padding: 30px;
    background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  }

  .cover-header {
    text-align: center;
    border-bottom: 2px solid #0f2a4a;
    padding-bottom: 14px;
  }
  .emblem-title {
    font-size: 10.5pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #475569;
    font-weight: 600;
    margin-bottom: 3px;
  }
  .gov-sub {
    font-size: 8pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }
  .dossier-tag {
    background-color: #0f2a4a;
    color: #ffffff;
    display: inline-block;
    padding: 5px 16px;
    font-size: 9.5pt;
    font-weight: 700;
    letter-spacing: 1.5px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .cover-body {
    text-align: center;
    margin: 20px 0;
  }
  .work-title {
    font-size: 24pt;
    font-weight: 800;
    color: #0f2a4a;
    line-height: 1.15;
    margin-bottom: 4px;
  }
  .work-tagline {
    font-size: 12pt;
    color: #0d9488;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 10px;
  }
  .work-sub {
    font-size: 10.5pt;
    color: #2563eb;
    font-weight: 600;
    margin-bottom: 16px;
  }
  .work-meta-table {
    margin: 0 auto;
    width: 92%;
    text-align: left;
    border-collapse: collapse;
    font-size: 9pt;
  }
  .work-meta-table td {
    padding: 6.5px 11px;
    border: 1px solid #cbd5e1;
  }
  .work-meta-table td.label {
    background-color: #f1f5f9;
    font-weight: 600;
    color: #334155;
    width: 34%;
  }

  .cover-footer {
    border-top: 1px solid #cbd5e1;
    padding-top: 12px;
    font-size: 8pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }

  /* Tables */
  table.content-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 14px 0;
    font-size: 8.5pt;
  }
  table.content-table th {
    background-color: #0f2a4a;
    color: #ffffff;
    text-align: left;
    padding: 6.5px 9px;
    font-weight: 600;
    font-size: 8.2pt;
    border: 1px solid #0f2a4a;
  }
  table.content-table td {
    padding: 6px 9px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  table.content-table tr:nth-child(even) {
    background-color: #f8fafc;
  }
  table.content-table td.key-col {
    font-weight: 600;
    color: #1e293b;
    width: 28%;
    background-color: #f1f5f9;
  }

  /* Box Styles */
  .statutory-box {
    border: 1px solid #94a3b8;
    background-color: #ffffff;
    padding: 12px 16px;
    border-radius: 4px;
    margin-bottom: 12px;
  }
  .statutory-box h3 {
    margin-top: 0;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
  }

  .callout {
    padding: 9px 12px;
    border-left: 4px solid #0f2a4a;
    background-color: #f8fafc;
    margin: 9px 0;
    font-size: 8.4pt;
    border-radius: 0 4px 4px 0;
  }
  .callout-info {
    border-left-color: #0284c7;
    background-color: #f0f9ff;
  }
  .callout-success {
    border-left-color: #16a34a;
    background-color: #f0fdf4;
  }

  /* Code Block */
  pre.code-sample {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 7.5pt;
    background-color: #0f172a;
    color: #f8fafc;
    padding: 9px;
    border-radius: 4px;
    line-height: 1.38;
    overflow: hidden;
    margin: 6px 0;
  }

  /* Digital Signature Box */
  .sig-slot {
    border: 1px dashed #94a3b8;
    background-color: #f8fafc;
    border-radius: 4px;
    padding: 8px;
    text-align: center;
    margin-bottom: 5px;
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sig-slot-text {
    font-size: 7.2pt;
    color: #64748b;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* Signature Block */
  .signature-grid {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px dashed #cbd5e1;
  }
  .signature-box {
    width: 46%;
    font-size: 8.3pt;
  }
  .sign-line {
    border-top: 1px solid #1e293b;
    padding-top: 4px;
    font-weight: 600;
  }

  .header-rule {
    display: flex;
    justify-content: space-between;
    font-size: 7.2pt;
    color: #64748b;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 3px;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>

<!-- PAGE 1: COVER PAGE -->
<div class="page">
  <div class="cover">
    <div class="cover-header">
      <div class="emblem-title">Government of India &bull; Copyright Office</div>
      <div class="gov-sub">Under Section 45 of The Copyright Act, 1957 & Rule 70 of The Copyright Rules, 2013</div>
      <div class="dossier-tag">Copyright Registration Dossier & Legal Handover Pack</div>
    </div>

    <div class="cover-body">
      <div style="font-size: 9.5pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Subject Software Application</div>
      <div class="work-title">MITO REBOOT</div>
      <div class="work-tagline">&mdash; PREVENTIVE LIFESTYLE APP &mdash;</div>
      <div class="work-sub">Personalized Preventive Lifestyle & Metabolic Health Mobile Software Application</div>
      
      <table class="work-meta-table">
        <tr>
          <td class="label">App Domain & Nature</td>
          <td><strong>Health & Wellness: Preventive Lifestyle App</strong></td>
        </tr>
        <tr>
          <td class="label">Statutory Classification</td>
          <td><strong>Literary Work &ndash; Computer Software</strong> [Sec. 2(o)]<br>
              <span style="font-size: 7.6pt; color: #64748b;">(Statutory classification for all Mobile Apps & Health Software under Indian Copyright Act)</span>
          </td>
        </tr>
        <tr>
          <td class="label">Authors & Owners</td>
          <td>
            <strong>Dr. Krithikaa</strong> & <strong>Dr. Lohith</strong><br>
            <span style="font-size: 8pt; color: #475569;">(Joint Authors & Sole Absolute Copyright Owners)</span>
          </td>
        </tr>
        <tr>
          <td class="label">Lead Software Developer</td>
          <td><strong>Sathish Kumar K</strong> (S/o Kumar &bull; Software Architect & Lead Engineer)</td>
        </tr>
        <tr>
          <td class="label">Publication Status</td>
          <td><strong>Published</strong> (Live Application in India)</td>
        </tr>
        <tr>
          <td class="label">Current Version</td>
          <td>v5.9.0 (Year of Completion: 2026)</td>
        </tr>
        <tr>
          <td class="label">Technology Stack</td>
          <td>TypeScript, React 18, Vite, Capacitor 6 (Android / iOS), Tailwind CSS</td>
        </tr>
        <tr>
          <td class="label">Supported Languages</td>
          <td>English, Tamil, Hindi, Kannada, Telugu (5 Languages)</td>
        </tr>
        <tr>
          <td class="label">Intended Recipient</td>
          <td>Client IP & Legal Counsel for Statutory E-Filing on <em>copyright.gov.in</em></td>
        </tr>
      </table>
    </div>

    <div class="cover-footer">
      <div>Date of Preparation: September 11, 2026</div>
      <div>Jurisdiction: Copyright Registry, New Delhi, India</div>
      <div>Legal Status: Ready for Client & Legal Submission</div>
    </div>
  </div>
</div>

<!-- PAGE 2: EXECUTIVE ANALYSIS & VERIFICATION FOR LEGAL TEAM -->
<div class="page">
  <div class="header-rule">
    <span>Mito Reboot &bull; Preventive Lifestyle App</span>
    <span>Section 1: Legal Classification & Ownership Structuring</span>
  </div>

  <h2>1. Legal Classification & Ownership Structuring (Client & Legal Brief)</h2>
  
  <div class="callout callout-info avoid-break" style="font-size: 8.8pt; line-height: 1.55; margin-bottom: 12px;">
    <strong>Why Does the Law Say "LITERARY WORK" for a Health App?</strong><br>
    Under the <strong>Indian Copyright Act, 1957 (Section 2(o))</strong> and international intellectual property law (the Berne Convention), all mobile applications, smartphone health apps, algorithms, and source codes are legally defined as <strong>"Literary Works"</strong>. In copyright law, the word <em>"Literary"</em> does not mean literature/novels; it signifies that software code is written in symbolic text, human-readable programming syntax, and alphanumeric languages. On the official Government portal (<strong>copyright.gov.in</strong>), the dropdown menu does not have a separate category for "Health App" or "Mobile App"; you must select <strong>"Literary / Dramatic" &rarr; "Computer Software"</strong>. In the title, description, and specifications, it is explicitly registered as: <em>"Mito Reboot: Preventive Lifestyle App (Metabolic Health Application)"</em>.
  </div>

  <table class="content-table">
    <thead>
      <tr>
        <th style="width: 22%;">Field</th>
        <th style="width: 33%;">Client Specification</th>
        <th style="width: 33%;">Statutory & Legal Analysis</th>
        <th style="width: 12%;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="key-col">Project Title & Tagline</td>
        <td><strong>Mito Reboot</strong><br>Tagline: <em>"Preventive Lifestyle App"</em></td>
        <td>
          <strong>Registered Title:</strong> <em>"Mito Reboot &ndash; Preventive Lifestyle App (Metabolic Health Software Application)"</em>. Omits "™" in official portal box to prevent Rule 70(6) TM-60 search requisitions while prominently securing the full brand and tagline.
        </td>
        <td><span class="badge badge-pass">Optimized</span></td>
      </tr>
      <tr>
        <td class="key-col">App Domain</td>
        <td>Health & Wellness / Preventive Healthcare</td>
        <td>
          <strong>Documented:</strong> Described across all forms as an interactive <em>Preventive Lifestyle App</em> managing glucose telemetry, breathwork, habit tracking, and cellular health.
        </td>
        <td><span class="badge badge-pass">Included</span></td>
      </tr>
      <tr>
        <td class="key-col">Authors & Owners</td>
        <td><strong>Dr. Krithikaa</strong> and <strong>Dr. Lohith</strong></td>
        <td>
          <strong>Joint Authorship & Ownership:</strong> Registered as Joint Applicants & Owners under Section 13 & 17 of the Copyright Act. Form XIV, SoP (Items 2, 10, 11), and SoFP reflect both names.
        </td>
        <td><span class="badge badge-pass">Updated</span></td>
      </tr>
      <tr>
        <td class="key-col">Publication Status</td>
        <td><strong>Published</strong> (App is Live; no exact date needed)</td>
        <td>
          <strong>Configured:</strong> Stated as <em>"Published in India"</em> without calendar day/month, perfectly avoiding version rollout scrutiny.
        </td>
        <td><span class="badge badge-pass">Configured</span></td>
      </tr>
      <tr>
        <td class="key-col">Developer to Owner Transition</td>
        <td>Software developed by Sathish Kumar K (S/o Kumar) for Dr. Krithikaa & Dr. Lohith</td>
        <td>
          <strong>Assignment & Work-for-Hire Declaration:</strong> A formal Developer Assignment & No-Objection Certificate (NOC) is incorporated in Section 7 so legal counsel can demonstrate an unbroken chain of title.
        </td>
        <td><span class="badge badge-pass">Protected</span></td>
      </tr>
      <tr>
        <td class="key-col">UI Languages</td>
        <td>English, Tamil, Hindi, Kannada, Telugu</td>
        <td>
          <strong>Codebase Verified:</strong> 5 localized modules confirmed in <code>/user/src/i18n/locales/</code> (<code>en.ts, ta.ts, hi.ts, kn.ts, te.ts</code>).
        </td>
        <td><span class="badge badge-pass">Verified</span></td>
      </tr>
    </tbody>
  </table>
</div>

<!-- PAGE 3: FORM XIV - STATUTORY APPLICATION -->
<div class="page">
  <div class="header-rule">
    <span>Mito Reboot &bull; Preventive Lifestyle App</span>
    <span>Section 2: Form XIV (Application for Registration)</span>
  </div>

  <h2>2. Form XIV: Application for Registration of Copyright</h2>
  <div style="font-size: 8.5pt; color: #475569; margin-bottom: 10px;">[See Rule 70 of the Copyright Rules, 2013 | Under Section 45 of Copyright Act, 1957]</div>

  <div class="statutory-box">
    <p><strong>To,</strong><br>
    The Registrar of Copyrights,<br>
    Copyright Office, Department for Promotion of Industry and Internal Trade (DPIIT),<br>
    Ministry of Commerce and Industry, Government of India,<br>
    Plot No. 32, Sector 14, Dwarka, New Delhi &ndash; 110078.
    </p>

    <p style="margin-top: 8px;"><strong>Sir,</strong><br>
    In accordance with Section 45 of the Copyright Act, 1957 (14 of 1957), we hereby apply for registration of copyright and request that the entries regarding the work described below be registered in the Register of Copyrights:
    </p>

    <ol style="margin-left: 20px; font-size: 8.5pt; line-height: 1.55; margin-top: 8px;">
      <li><strong>Names, Addresses, and Nationalities of the Applicants:</strong><br>
          1. <strong>Dr. Krithikaa</strong>, Indian National.<br>
          2. <strong>Dr. Lohith</strong>, Indian National.<br>
          <em>Address for Communication:</em> Parameshwari Nagar, Adyar, Chennai, Tamil Nadu &ndash; 600020, India.
      </li>
      <li><strong>Nature of the Applicants' Interest in the Copyright of the Work:</strong><br>
          <strong>Joint Authors and Sole Absolute Owners</strong> of the copyright (Section 17 of Copyright Act, 1957).
      </li>
      <li><strong>Class and Description of the Work:</strong><br>
          <strong>Literary Work &ndash; Computer Software / Computer Programme</strong> as defined under Section 2(o) of the Copyright Act, 1957<br>
          <em>(Subject: "Mito Reboot &ndash; Preventive Lifestyle App & Metabolic Health Software")</em>.
      </li>
      <li><strong>Title of the Work:</strong><br>
          <strong>Mito Reboot &ndash; Preventive Lifestyle App (Personalized Metabolic Health & Glucose Monitoring Software Application)</strong>
      </li>
      <li><strong>Language in which the Work is written:</strong><br>
          Source Code: TypeScript, JavaScript (ES6+), HTML5, CSS3.<br>
          UI Localization: English, Tamil, Hindi, Kannada, Telugu.
      </li>
      <li><strong>Publication Status:</strong><br>
          <strong>Published</strong> (Live Application in India).
      </li>
      <li><strong>Accompanying Enclosures:</strong><br>
          (a) Prescribed statutory fee paid via Bharatkosh.<br>
          (b) Statement of Particulars (Schedule 1) duly signed by Joint Applicants.<br>
          (c) Statement of Further Particulars (Schedule 2 for Computer Software).<br>
          (d) Two (2) printed copies of Source Code extracts (First 25 and Last 25 pages).<br>
          (e) Two (2) copies of CD-R containing full clean source code and production build.<br>
          (f) Developer Assignment & No-Objection Declaration from Lead Developer Sathish Kumar K.<br>
          (g) Self-attested Government Identity Proofs of the Applicants.
      </li>
    </ol>
  </div>

  <div class="signature-grid avoid-break">
    <div class="signature-box">
      <div class="sig-slot">
        <span class="sig-slot-text">[ Digital Signature / Sign in Ink ]</span>
      </div>
      <div class="sign-line">
        (DR. KRITHIKAA)<br>
        Joint Applicant & Author
      </div>
    </div>
    <div class="signature-box" style="text-align: right;">
      <div class="sig-slot">
        <span class="sig-slot-text">[ Digital Signature / Sign in Ink ]</span>
      </div>
      <div class="sign-line">
        (DR. LOHITH)<br>
        Joint Applicant & Author
      </div>
    </div>
  </div>
</div>

<!-- PAGE 4: STATEMENT OF PARTICULARS (SCHEDULE 1) -->
<div class="page">
  <div class="header-rule">
    <span>Mito Reboot &bull; Preventive Lifestyle App</span>
    <span>Section 3: Statement of Particulars (Schedule 1)</span>
  </div>

  <h2>3. Statement of Particulars (Schedule 1)</h2>
  <div style="font-size: 8.5pt; color: #475569; margin-bottom: 8px;">Mandatory 14-Item Schedule to Form XIV for Joint Applicants (Dr. Krithikaa & Dr. Lohith)</div>

  <table class="content-table">
    <thead>
      <tr>
        <th style="width: 8%;">No.</th>
        <th style="width: 38%;">Item Description</th>
        <th style="width: 54%;">Particulars to be Entered</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td class="key-col">Registration Number</td>
        <td><em>(To be allotted by the Copyright Office upon entry in the Register)</em></td>
      </tr>
      <tr>
        <td>2</td>
        <td class="key-col">Names, Addresses, and Nationalities of the Applicants</td>
        <td>
          <strong>1. Dr. Krithikaa</strong> (Indian National)<br>
          <strong>2. Dr. Lohith</strong> (Indian National)<br>
          Address: Parameshwari Nagar, Adyar, Chennai, Tamil Nadu &ndash; 600020, India.
        </td>
      </tr>
      <tr>
        <td>3</td>
        <td class="key-col">Nature of Applicants' Interest in the Copyright</td>
        <td><strong>Joint Authors and 100% Absolute Owners</strong> of the software work.</td>
      </tr>
      <tr>
        <td>4</td>
        <td class="key-col">Class and Description of the Work</td>
        <td>
          <strong>Literary Work &ndash; Computer Software</strong> [Sec. 2(o)]<br>
          <strong>App Description:</strong> Preventive Lifestyle App &ndash; An interactive mobile and web application for continuous glucose tracking, lifestyle habits coaching, and metabolic wellness.
        </td>
      </tr>
      <tr>
        <td>5</td>
        <td class="key-col">Title of the Work</td>
        <td><strong>Mito Reboot &ndash; Preventive Lifestyle App (Personalized Metabolic Health & Glucose Monitoring Software Application)</strong></td>
      </tr>
      <tr>
        <td>6</td>
        <td class="key-col">Language of the Work</td>
        <td>
          <strong>Source Code:</strong> TypeScript, JavaScript (ECMAScript 2022+), HTML5, CSS3.<br>
          <strong>UI Languages:</strong> English, Tamil, Hindi, Kannada, Telugu.
        </td>
      </tr>
      <tr>
        <td>7</td>
        <td class="key-col">Whether the Work is Published or Unpublished</td>
        <td><strong>Published</strong> (Live Application in India).</td>
      </tr>
      <tr>
        <td>8</td>
        <td class="key-col">Country of First Publication, Names & Address of Publishers</td>
        <td>
          Country: <strong>India</strong>.<br>
          Publishers: <strong>Dr. Krithikaa and Dr. Lohith</strong>, Chennai, Tamil Nadu, India.
        </td>
      </tr>
      <tr>
        <td>9</td>
        <td class="key-col">Subsequent Publications (if any)</td>
        <td>Nil.</td>
      </tr>
      <tr>
        <td>10</td>
        <td class="key-col">Names, Addresses & Nationalities of the Authors</td>
        <td>
          <strong>1. Dr. Krithikaa</strong> (Nationality: Indian, Address: Chennai, Tamil Nadu)<br>
          <strong>2. Dr. Lohith</strong> (Nationality: Indian, Address: Chennai, Tamil Nadu)<br>
          <em>(Both authors are living; Decease: N.A.)</em>
        </td>
      </tr>
      <tr>
        <td>11</td>
        <td class="key-col">Names, Addresses & Nationalities of Owners of Copyright</td>
        <td>
          <strong>Dr. Krithikaa & Dr. Lohith</strong>, Chennai, Tamil Nadu, India.<br>
          (Joint 100% Absolute Copyright Owners).
        </td>
      </tr>
      <tr>
        <td>12</td>
        <td class="key-col">Persons Authorized to Assign or License</td>
        <td>Dr. Krithikaa and Dr. Lohith exclusively.</td>
      </tr>
      <tr>
        <td>13</td>
        <td class="key-col">Capable of Being Used in Relation to Goods or Services (TM Search)</td>
        <td>
          <strong>NO.</strong> Registration is sought solely for the original source code as a Literary Work under Section 2(o) and not as a Trademark label/device. (No TM-60 search certificate required).
        </td>
      </tr>
      <tr>
        <td>14</td>
        <td class="key-col">Location of Original Work</td>
        <td>Chennai, Tamil Nadu, India.</td>
      </tr>
    </tbody>
  </table>

  <div class="signature-grid avoid-break">
    <div class="signature-box">
      <div class="sig-slot"><span class="sig-slot-text">[ Digital Signature / Sign in Ink ]</span></div>
      <div class="sign-line">(DR. KRITHIKAA)<br>Signature of Joint Applicant</div>
    </div>
    <div class="signature-box" style="text-align: right;">
      <div class="sig-slot"><span class="sig-slot-text">[ Digital Signature / Sign in Ink ]</span></div>
      <div class="sign-line">(DR. LOHITH)<br>Signature of Joint Applicant</div>
    </div>
  </div>
</div>

<!-- PAGE 5: STATEMENT OF FURTHER PARTICULARS (SCHEDULE 2) -->
<div class="page">
  <div class="header-rule">
    <span>Mito Reboot &bull; Preventive Lifestyle App</span>
    <span>Section 4: Statement of Further Particulars (Schedule 2)</span>
  </div>

  <h2>4. Statement of Further Particulars (Schedule 2)</h2>
  <div style="font-size: 8.5pt; color: #475569; margin-bottom: 8px;">Mandatory Technical Questionnaire for Computer Software Registration</div>

  <table class="content-table">
    <thead>
      <tr>
        <th style="width: 8%;">No.</th>
        <th style="width: 36%;">Technical Parameter</th>
        <th style="width: 56%;">Statutory Disclosure</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td class="key-col">Is the Work Original?</td>
        <td>
          <strong>Yes.</strong> The computer programme comprises original, creative source code conceived, architected, and developed specifically for Dr. Krithikaa and Dr. Lohith. It does not infringe upon any third-party proprietary copyright.
        </td>
      </tr>
      <tr>
        <td>2</td>
        <td class="key-col">What is the Object and Purpose of the Software?</td>
        <td>
          <strong>Mito Reboot</strong> is a high-performance cross-platform <strong>Preventive Lifestyle Health Application</strong>. Key functions include:
          <ul style="margin-left: 15px; margin-top: 3px; font-size: 8.3pt;">
            <li><strong>Preventive Metabolic Lifestyle Tracking:</strong> Continuous Glucose Monitoring (CGM) telemetry ingestion and personalized glycemic variability curves.</li>
            <li><strong>Interactive Lifestyle Coaching:</strong> Multi-lingual AI health chatbots (AskMito, Daily Logging, DeStress AI, Breathwork coaches).</li>
            <li><strong>Environmental & Biometric Correlation:</strong> Live AQI integration correlated with metabolic stress and lifestyle habit adherence.</li>
            <li><strong>Edge Offline Architecture:</strong> Resilient offline caching, local notifications, and transactional cloud data synchronization.</li>
          </ul>
        </td>
      </tr>
      <tr>
        <td>3</td>
        <td class="key-col">Programming Languages & Frameworks</td>
        <td>
          <strong>Languages:</strong> TypeScript 5.2, JavaScript (ES2022+), HTML5, CSS3.<br>
          <strong>Framework & Bundler:</strong> React 18.3, Vite 5.2.<br>
          <strong>Native Bridge:</strong> Capacitor 6.1 (Android, iOS, Camera, Geolocation, Notifications).
        </td>
      </tr>
      <tr>
        <td>4</td>
        <td class="key-col">Target Operating System & Runtime Environment</td>
        <td>
          <strong>Mobile Client:</strong> Android OS 8.0+ and Apple iOS 14.0+.<br>
          <strong>Web Browser Runtime:</strong> Chrome 90+, Safari 14+, Firefox 88+, Edge 90+.<br>
          <strong>Build Environment:</strong> Node.js (v18.x or v20.x LTS).
        </td>
      </tr>
      <tr>
        <td>5</td>
        <td class="key-col">Minimum Hardware Requirements</td>
        <td>
          <strong>Processor:</strong> Dual-core 1.5 GHz or higher (ARM64 / x86_64).<br>
          <strong>RAM:</strong> 2 GB minimum (4 GB recommended).<br>
          <strong>Storage:</strong> 50 MB available storage.<br>
          <strong>Display:</strong> Minimum 360x640 resolution screen.
        </td>
      </tr>
      <tr>
        <td>6</td>
        <td class="key-col">Source Code & Object Code Specifications</td>
        <td>
          <strong>Architecture:</strong> Modular component hierarchy (~120 source files across components, screens, services, state contexts, and localized dictionaries).<br>
          <strong>Compilation Target:</strong> ES2022 bundle generated by Vite compiler & TypeScript engine.
        </td>
      </tr>
      <tr>
        <td>7</td>
        <td class="key-col">Format of Code Deposited with Application</td>
        <td>
          1. <strong>Physical Extracts:</strong> First 25 pages and Last 25 pages of human-readable Source Code with line numbers, statutory headers, and page numbers.<br>
          2. <strong>Optical Media:</strong> Two (2) finalized write-once CD-R discs containing the complete clean source code repository and compiled production artifacts.
        </td>
      </tr>
      <tr>
        <td>8</td>
        <td class="key-col">Pre-existing or Open Source Frameworks</td>
        <td>
          Standard open-source libraries (React, Vite, Capacitor, Tailwind CSS) under MIT/Apache licenses are utilized purely as foundation frameworks. <strong>Copyright is claimed strictly on the original proprietary logic, UI architecture, coaching workflows, data algorithms, and localization schemas owned by the applicants.</strong>
        </td>
      </tr>
      <tr>
        <td>9</td>
        <td class="key-col">Prior Registration in any Country</td>
        <td><strong>No.</strong> This is the first application for registration.</td>
      </tr>
    </tbody>
  </table>

  <div class="signature-grid avoid-break">
    <div class="signature-box">
      <div class="sig-slot"><span class="sig-slot-text">[ Digital Signature / Sign in Ink ]</span></div>
      <div class="sign-line">(DR. KRITHIKAA)<br>Joint Applicant & Owner</div>
    </div>
    <div class="signature-box" style="text-align: right;">
      <div class="sig-slot"><span class="sig-slot-text">[ Digital Signature / Sign in Ink ]</span></div>
      <div class="sign-line">(DR. LOHITH)<br>Joint Applicant & Owner</div>
    </div>
  </div>
</div>

<!-- PAGE 6: SOFTWARE ARCHITECTURE & TECHNICAL SPECIFICATION -->
<div class="page">
  <div class="header-rule">
    <span>Mito Reboot &bull; Preventive Lifestyle App</span>
    <span>Section 5: Software Architecture & Modular Specification</span>
  </div>

  <h2>5. Software Architecture & Modular Specification (Preventive Health Features)</h2>
  <p>To substantiate the originality and architectural organization of the protected work for the Copyright Examiner and legal counsel:</p>

  <div class="statutory-box avoid-break">
    <h3>5.1 Modular Subsystems of Preventive Lifestyle Software</h3>
    <table class="content-table" style="margin-top: 4px;">
      <thead>
        <tr>
          <th>Subsystem</th>
          <th>Source Path</th>
          <th>Preventive Health Function</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Preventive Lifestyle Core & Shell</strong></td>
          <td><code>/user/capacitor.config.ts<br>/user/src/main.tsx<br>/user/src/App.tsx</code></td>
          <td>Configures app ID <code>com.mitoreboot.app</code>, native status bar, secure payment navigation gateways, offline listeners, and root UI navigation for wellness tracking.</td>
        </tr>
        <tr>
          <td><strong>Multi-Lingual Localization Engine</strong></td>
          <td><code>/user/src/i18n/<br>locales/{en,hi,ta,kn,te}.ts</code></td>
          <td>Proprietary 5-language localization system supporting English, Tamil, Hindi, Kannada, and Telugu with runtime dynamic language switching and localized health indicators.</td>
        </tr>
        <tr>
          <td><strong>AI Preventive Coach & Nudges</strong></td>
          <td><code>/user/src/components/<br>AskMitoDrawer.tsx<br>DailyLoggingChatbotModal.tsx<br>DeStressAIChatModal.tsx</code></td>
          <td>Contextual dialogue engines providing metabolic habit nudges, stress alleviation feedback, breathwork guidance, and nutrition logging workflows.</td>
        </tr>
        <tr>
          <td><strong>Biometric Analytics & Glycemic Curves</strong></td>
          <td><code>/user/src/components/<br>MitoProgressCard.tsx<br>TodaysFocusCard.tsx</code></td>
          <td>Visual time-series telemetry rendering continuous glucose monitoring curves, glycemic load distributions, and lifestyle habit adherence metrics.</td>
        </tr>
        <tr>
          <td><strong>Environmental Correlation & Data Sync</strong></td>
          <td><code>/user/src/components/<br>LiveAQIWidget.tsx<br>services/syncService.ts</code></td>
          <td>Correlates ambient PM2.5 / AQI indices with metabolic stress factors and orchestrates resilient offline-first cloud synchronization.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="statutory-box avoid-break">
    <h3>5.2 Codebase Organization</h3>
    <pre class="code-sample">
healthApp/user/
├── capacitor.config.ts        <-- Native mobile container specification (AppID: com.mitoreboot.app)
├── package.json               <-- Project manifest, version 5.9.0, dependency graphs
├── vite.config.ts             <-- Modern ES module packaging pipeline
└── src/
    ├── main.tsx               <-- Bootstrapper & Virtual DOM mount
    ├── App.tsx                <-- Central state orchestration & navigation engine
    ├── components/            <-- 29 proprietary UI modules (AskMito, DailyLoggingChatbot, etc.)
    ├── context/               <-- State providers (LanguageContext, AuthContext, ThemeContext)
    ├── i18n/locales/          <-- Multi-lingual dictionaries (en, hi, ta, kn, te)
    ├── services/              <-- Telemetry sync (syncService.ts, habitsService.ts)
    └── utils/                 <-- Mathematical transforms and glycemic algorithms
    </pre>
  </div>
</div>

<!-- PAGE 7: SOURCE CODE EXTRACTION GUIDE & CD-R SPECIFICATION -->
<div class="page">
  <div class="header-rule">
    <span>Mito Reboot &bull; Preventive Lifestyle App</span>
    <span>Section 6: Source Code Submission Blueprint</span>
  </div>

  <h2>6. Source Code Submission Blueprint (50-Page Extract)</h2>
  <p>Under Rule 70 of the Copyright Rules, 2013, applicants submitting computer software must file <strong>representative source code extracts (First 20&ndash;30 pages and Last 20&ndash;30 pages)</strong> along with a complete digital copy on optical disc.</p>

  <div class="statutory-box avoid-break">
    <h3>6.1 Manifest of Pre-compiled Code Extract Booklet</h3>
    <p style="font-size: 8.5pt; margin-bottom: 6px;">The companion document <strong><code>Mito_Reboot_Source_Code_Extracts.pdf</code> (31 Pages)</strong> contains:</p>
    <table class="content-table">
      <thead>
        <tr>
          <th style="width: 25%;">Extract Segment</th>
          <th style="width: 45%;">Selected Source Files</th>
          <th style="width: 30%;">Pages & Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>FIRST EXTRACT<br>(Entry & Foundation)</strong></td>
          <td>
            1. <code>capacitor.config.ts</code> (Native config)<br>
            2. <code>package.json</code> (Dependencies & Version)<br>
            3. <code>index.html</code> (Root shell)<br>
            4. <code>src/main.tsx</code> (App bootstrap)<br>
            5. <code>src/App.tsx</code> (Main routing & state)<br>
            6. <code>src/context/LanguageContext.tsx</code><br>
            7. <code>src/context/AuthContext.tsx</code>
          </td>
          <td>
            Pages 1 to 16<br>
            <em>(Proves foundational architecture, runtime lifecycles, and context orchestration)</em>
          </td>
        </tr>
        <tr>
          <td><strong>LAST EXTRACT<br>(Logic & Telemetry)</strong></td>
          <td>
            1. <code>src/services/syncService.ts</code> (Sync engine)<br>
            2. <code>src/services/habitsService.ts</code> (Habit logic)<br>
            3. <code>src/i18n/index.ts</code> (Localization hub)<br>
            4. <code>src/components/AskMitoDrawer.tsx</code> (AI Engine)<br>
            5. <code>src/components/DailyLoggingChatbotModal.tsx</code>
          </td>
          <td>
            Pages 17 to 31<br>
            <em>(Proves proprietary algorithmic calculations, data sync pipelines, and UI terminators)</em>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="callout callout-success avoid-break">
    <strong>Mandatory Physical Submission Requirements:</strong>
    <ol style="margin-left: 18px; margin-top: 3px; font-size: 8.4pt;">
      <li><strong>Print 2 Copies:</strong> Print two identical copies of <code>Mito_Reboot_Source_Code_Extracts.pdf</code> on A4 paper.</li>
      <li><strong>Headers & Footers:</strong> Every page already includes: <code>Project: Mito Reboot (Preventive Lifestyle App) | Owners: Dr. Krithikaa & Dr. Lohith | Copyright &copy; 2026</code>.</li>
      <li><strong>Binding:</strong> Spiral-bind or neatly staple each copy.</li>
    </ol>
  </div>

  <div class="statutory-box avoid-break" style="margin-top: 10px;">
    <h3>6.2 Digital Optical Disc (CD-R) Labeling Specification</h3>
    <p style="font-size: 8.4pt;">Prepare two (2) CD-Rs containing the complete repository and write the following label with a permanent marker:</p>
    <div style="border: 1px dashed #0f2a4a; padding: 8px 12px; background-color: #f8fafc; font-family: monospace; font-size: 8pt; border-radius: 4px;">
      ===============================================================<br>
      CD-R DISC LABEL TEMPLATE (FOR LEGAL FILING PACK)<br>
      ===============================================================<br>
      TITLE OF WORK   : MITO REBOOT &ndash; PREVENTIVE LIFESTYLE APP<br>
      WORK CATEGORY   : COMPUTER SOFTWARE [LITERARY WORK - HEALTH APP]<br>
      AUTHORS & OWNERS: DR. KRITHIKAA & DR. LOHITH<br>
      VERSION / STATUS: v5.9.0 / PUBLISHED (LIVE IN INDIA)<br>
      CONTENTS        : COMPLETE SOURCE CODE REPOSITORY + BUILT ARTIFACTS<br>
      DIARY NUMBER    : [Insert Diary Number allotted upon e-filing]<br>
      ===============================================================
    </div>
  </div>
</div>

<!-- PAGE 8: DEVELOPER NOC & COPYRIGHT ASSIGNMENT DECLARATION -->
<div class="page">
  <div class="header-rule">
    <span>Mito Reboot &bull; Preventive Lifestyle App</span>
    <span>Section 7: Developer NOC & Assignment Deed</span>
  </div>

  <h2>7. Developer No-Objection Certificate (NOC) & Assignment Deed</h2>
  <div style="font-size: 8.5pt; color: #475569; margin-bottom: 10px;">[Legal Chain of Title Confirmation from Lead Software Engineer to Owners]</div>

  <div class="statutory-box">
    <p style="text-align: center; font-weight: 700; font-size: 10.5pt; margin-bottom: 12px; text-transform: uppercase; color: #0f2a4a;">
      DECLARATION OF ASSIGNMENT & NO-OBJECTION CERTIFICATE (NOC)
    </p>

    <p>I, <strong>SATHISH KUMAR K</strong>, son of <strong>KUMAR</strong>, residing at <strong>Parameshwari Nagar, Adyar, Chennai, Tamil Nadu &ndash; 600020, India</strong>, Lead Software Developer of the software entitled <strong>"Mito Reboot &ndash; Preventive Lifestyle App"</strong>, do hereby solemnly declare, state, and affirm as under:</p>

    <ol style="margin-left: 20px; font-size: 8.5pt; line-height: 1.55; margin-top: 8px;">
      <li>That I was engaged as the lead software engineer and architect by <strong>Dr. Krithikaa</strong> and <strong>Dr. Lohith</strong> to develop and engineer the computer software application titled:
          <br><strong>"Mito Reboot &ndash; Preventive Lifestyle App (Personalized Metabolic Health & Glucose Monitoring Software Application)"</strong>.
      </li>
      <li>That the said software was conceived, commissioned, and created under the direct instructions, specifications, and guidance of <strong>Dr. Krithikaa and Dr. Lohith</strong>.</li>
      <li>That I have received full and complete remuneration / consideration for the software engineering and development services rendered in respect of the said software work.</li>
      <li>That I hereby unconditionally assign, transfer, and convey all proprietary rights, title, interest, and copyright in and to the said computer software source code, object code, and related architecture exclusively and perpetually to <strong>Dr. Krithikaa and Dr. Lohith</strong> as joint and absolute owners.</li>
      <li>That I have <strong>NO OBJECTION</strong> whatsoever to the registration of copyright of the said computer software in the names of <strong>Dr. Krithikaa and Dr. Lohith</strong> as Joint Authors / Owners in the Register of Copyrights, Government of India.</li>
      <li>That I shall execute any further documents or instruments as may be required by the Registrar of Copyrights to establish the absolute title of <strong>Dr. Krithikaa and Dr. Lohith</strong>.</li>
    </ol>
  </div>

  <div class="signature-grid avoid-break" style="margin-top: 30px;">
    <div class="signature-box">
      <p>Place: Chennai, Tamil Nadu<br>Date: September 11, 2026</p>
    </div>
    <div class="signature-box" style="text-align: right;">
      <div class="sig-slot">
        <span class="sig-slot-text">[ Digital Signature / Affix Signature ]</span>
      </div>
      <div class="sign-line">
        (SATHISH KUMAR K)<br>
        Lead Software Developer & Assignor
      </div>
    </div>
  </div>

  <div class="statutory-box avoid-break" style="margin-top: 22px; background-color: #f1f5f9;">
    <h3 style="margin-top: 0; color: #334155; font-size: 9.5pt;">ACCEPTANCE BY ASSIGNEES / OWNERS</h3>
    <p style="font-size: 8.3pt;">
      We, <strong>Dr. Krithikaa</strong> and <strong>Dr. Lohith</strong>, hereby accept the assignment of all copyright, rights, and title in the computer software "Mito Reboot – Preventive Lifestyle App".
    </p>
    <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 8.2pt;">
      <div style="width: 45%;">
        <div class="sig-slot"><span class="sig-slot-text">[ Digital Signature / Sign in Ink ]</span></div>
        <div style="text-align: center; font-weight: 600;">(Dr. Krithikaa)</div>
      </div>
      <div style="width: 45%;">
        <div class="sig-slot"><span class="sig-slot-text">[ Digital Signature / Sign in Ink ]</span></div>
        <div style="text-align: center; font-weight: 600;">(Dr. Lohith)</div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 9: JOINT AUTHORS' STATUTORY AFFIDAVIT -->
<div class="page">
  <div class="header-rule">
    <span>Mito Reboot &bull; Preventive Lifestyle App</span>
    <span>Section 8: Joint Owners' Statutory Declaration</span>
  </div>

  <h2>8. Joint Authors' & Owners' Statutory Declaration</h2>
  <div style="font-size: 8.5pt; color: #475569; margin-bottom: 10px;">[To be signed by Dr. Krithikaa & Dr. Lohith for Form XIV Enclosure]</div>

  <div class="statutory-box">
    <p style="text-align: center; font-weight: 700; font-size: 10.5pt; margin-bottom: 12px; text-transform: uppercase; color: #0f2a4a;">
      JOINT DECLARATION & UNDERTAKING UNDER THE COPYRIGHT ACT, 1957
    </p>

    <p>We, <strong>Dr. Krithikaa</strong> and <strong>Dr. Lohith</strong>, Indian Nationals, residing at Chennai, Tamil Nadu, India, do hereby solemnly declare and affirm as follows:</p>

    <ol style="margin-left: 20px; font-size: 8.5pt; line-height: 1.55; margin-top: 8px;">
      <li>That we are the Joint Authors, Creators, and Sole Absolute Owners of the original computer software entitled:
          <br><strong>"Mito Reboot &ndash; Preventive Lifestyle App (Personalized Metabolic Health & Glucose Monitoring Software Application)"</strong>.
      </li>
      <li>That the said computer programme / source code represents original creative software conceived and created for preventive lifestyle, metabolic health, and glucose management.</li>
      <li>That the software is currently <strong>Published and Live</strong> in India.</li>
      <li>That the software programme has not been copied, plagiarized, or reproduced from any pre-existing third-party copyrighted work in violation of the Indian Copyright Act, 1957.</li>
      <li>That we are the sole and exclusive joint owners of the copyright under Section 17 of the Copyright Act, 1957, and no other person or entity holds any proprietary interest therein.</li>
      <li>That the statements made in Form XIV, Statement of Particulars, and Statement of Further Particulars are true, correct, and complete to the best of our knowledge and belief.</li>
    </ol>
  </div>

  <div class="signature-grid avoid-break" style="margin-top: 30px;">
    <div class="signature-box">
      <div class="sig-slot"><span class="sig-slot-text">[ Digital Signature / Sign in Ink ]</span></div>
      <div class="sign-line">
        (DR. KRITHIKAA)<br>
        Joint Author & Owner
      </div>
    </div>
    <div class="signature-box" style="text-align: right;">
      <div class="sig-slot"><span class="sig-slot-text">[ Digital Signature / Sign in Ink ]</span></div>
      <div class="sign-line">
        (DR. LOHITH)<br>
        Joint Author & Owner
      </div>
    </div>
  </div>

  <div class="statutory-box avoid-break" style="margin-top: 25px; background-color: #f1f5f9;">
    <h3 style="margin-top: 0; color: #334155; font-size: 9.5pt;">VERIFICATION</h3>
    <p style="font-size: 8.3pt;">
      Verified at Chennai on this 11th day of September, 2026, that the contents of the above declaration are true and correct to the best of our knowledge and belief, and no part thereof is false.
    </p>
    <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 8.2pt;">
      <div style="width: 45%;">
        <div class="sig-slot"><span class="sig-slot-text">[ Verified Digitally / Signature ]</span></div>
        <div style="text-align: center; font-weight: 600;">(Dr. Krithikaa)</div>
      </div>
      <div style="width: 45%;">
        <div class="sig-slot"><span class="sig-slot-text">[ Verified Digitally / Signature ]</span></div>
        <div style="text-align: center; font-weight: 600;">(Dr. Lohith)</div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 10: E-FILING WALKTHROUGH & SUBMISSION DIRECTORY FOR LEGAL TEAM -->
<div class="page">
  <div class="header-rule">
    <span>Mito Reboot &bull; Preventive Lifestyle App</span>
    <span>Section 9: E-Filing Procedure & Physical Dispatch Checklist</span>
  </div>

  <h2>9. Step-by-Step E-Filing Guide on copyright.gov.in</h2>
  <div style="font-size: 8.5pt; color: #475569; margin-bottom: 8px;">Actionable instructions for the client / legal counsel to complete the registration</div>

  <div class="statutory-box avoid-break">
    <h3>Phase 1: Online Registration at copyright.gov.in</h3>
    <ol style="margin-left: 20px; font-size: 8.5pt; line-height: 1.55;">
      <li><strong>Portal Registration:</strong> Visit <a href="https://copyright.gov.in" target="_blank" style="color: #2563eb;">https://copyright.gov.in</a> &rarr; Click <em>"New User Registration"</em> &rarr; Create account for Dr. Krithikaa or Dr. Lohith.</li>
      <li><strong>Start E-Filing:</strong> Click <em>"Click for Online Copyright Registration"</em> &rarr; Open <strong>Form XIV</strong>.</li>
      <li><strong>Select Category:</strong> Choose <code>Literary/Dramatic</code> &rarr; Sub-category: <code>Computer Software</code> (Statutory classification for mobile health applications).</li>
      <li><strong>Input Statement of Particulars:</strong> Enter the particulars as specified in Section 3 of this document.
          <br>&bull; Title: <strong>Mito Reboot &ndash; Preventive Lifestyle App (Personalized Metabolic Health & Glucose Monitoring Software Application)</strong>
          <br>&bull; Select <strong>"Published"</strong> (Country: India, Publishers: Dr. Krithikaa & Dr. Lohith).
          <br>&bull; Item 13 (Trademark): Select <strong>"NO"</strong>.
      </li>
      <li><strong>Input Statement of Further Particulars:</strong> Enter technical parameters from Section 4.</li>
      <li><strong>Statutory Fee Payment:</strong> Pay the statutory fee of <strong>INR 500/-</strong> via Bharatkosh.</li>
      <li><strong>Download Acknowledgment:</strong> Note the <strong>Diary Number</strong> (e.g., <code>XXXXX/2026-CO/L</code>) and download the system-generated Form XIV.</li>
    </ol>
  </div>

  <div class="statutory-box avoid-break">
    <h3>Phase 2: Physical Dispatch Checklist (Within 30 Days)</h3>
    <table class="content-table">
      <thead>
        <tr>
          <th style="width: 10%;">Check</th>
          <th style="width: 50%;">Document Item</th>
          <th style="width: 40%;">Quantity & Specification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>[ &nbsp; ]</td>
          <td><strong>Signed System-Generated Form XIV</strong></td>
          <td>1 Original (Signed by Dr. Krithikaa & Dr. Lohith)</td>
        </tr>
        <tr>
          <td>[ &nbsp; ]</td>
          <td><strong>Statement of Particulars & Further Particulars</strong></td>
          <td>1 Copy (Duly signed by both joint owners)</td>
        </tr>
        <tr>
          <td>[ &nbsp; ]</td>
          <td><strong>Source Code Extract Booklets</strong></td>
          <td><strong>2 Copies</strong> (Printed from <code>Mito_Reboot_Source_Code_Extracts.pdf</code>)</td>
        </tr>
        <tr>
          <td>[ &nbsp; ]</td>
          <td><strong>Optical Discs (CD-R) in Jewel Cases</strong></td>
          <td><strong>2 Discs</strong> (Complete source code, permanently labeled)</td>
        </tr>
        <tr>
          <td>[ &nbsp; ]</td>
          <td><strong>Developer NOC & Assignment Deed</strong></td>
          <td>1 Original (Signed by developer Sathish Kumar K)</td>
        </tr>
        <tr>
          <td>[ &nbsp; ]</td>
          <td><strong>Joint Owners' Statutory Declaration</strong></td>
          <td>1 Original (Signed by Dr. Krithikaa & Dr. Lohith)</td>
        </tr>
        <tr>
          <td>[ &nbsp; ]</td>
          <td><strong>Government ID Proofs</strong></td>
          <td>Self-attested Aadhaar / Passport copies of both owners</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="callout callout-info avoid-break">
    <strong>Official Postal Address for Dispatch (Speed Post / Registered Post):</strong><br>
    <strong>To: The Registrar of Copyrights</strong><br>
    Copyright Office, Department for Promotion of Industry and Internal Trade (DPIIT),<br>
    Ministry of Commerce and Industry, Government of India,<br>
    Plot No. 32, Sector 14, Dwarka, New Delhi &ndash; 110078, India.<br>
    <em>(Superscribe on envelope: <strong>"SUBMISSION OF COPYRIGHT WORK - DIARY NO: [YOUR DIARY NUMBER]"</strong>)</em>
  </div>

  <div style="margin-top: 15px; font-size: 8pt; color: #64748b; text-align: center;">
    &mdash; End of Copyright Registration Dossier & Legal Handover Pack &mdash;
  </div>
</div>

</body>
</html>
"""

def generate_pdf():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    health_app_dir = os.path.abspath(os.path.join(script_dir, "..", ".."))
    user_app_dir = os.path.abspath(os.path.join(script_dir, ".."))
    
    html_path = os.path.join(user_app_dir, "Mito_Reboot_Copyright_Registration_Dossier.html")
    pdf_user_path = os.path.join(user_app_dir, "Mito_Reboot_Copyright_Registration_Dossier.pdf")
    pdf_root_path = os.path.join(health_app_dir, "Mito_Reboot_Copyright_Registration_Dossier.pdf")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)
    print(f"[OK] Wrote Updated HTML dossier to: {html_path}")

    chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    cmd = [
        chrome_bin,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_user_path}",
        f"file://{html_path}"
    ]

    print("[...] Compiling Updated PDF via Chrome Headless...")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        print("[ERR] Chrome headless failed:", result.stderr)
        return False

    if os.path.exists(pdf_user_path):
        size_kb = os.path.getsize(pdf_user_path) / 1024
        print(f"[SUCCESS] Created User App PDF: {pdf_user_path} ({size_kb:.1f} KB)")
        with open(pdf_user_path, "rb") as src, open(pdf_root_path, "wb") as dst:
            dst.write(src.read())
        print(f"[SUCCESS] Copied to Root Workspace: {pdf_root_path}")
        return True
    else:
        print("[ERR] Output PDF file not created.")
        return False

if __name__ == "__main__":
    generate_pdf()
