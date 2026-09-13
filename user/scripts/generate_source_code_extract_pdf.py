#!/usr/bin/env python3
"""
Generate the ready-to-print 50-page Source Code Extracts PDF for the Mito Reboot copyright deposit.
Updated with:
  - Title & Tagline: Mito Reboot - Preventive Lifestyle App
  - App Domain: Preventive Healthcare & Metabolic Management
  - Authors & Owners: Dr. Krithikaa & Dr. Lohith
  - Developer: Sathish Kumar K
  - Status: Published (Live in India)
"""

import os
import subprocess
import html

def escape_code(text):
    return html.escape(text)

def generate_source_code_pdf():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    user_app_dir = os.path.abspath(os.path.join(script_dir, ".."))
    health_app_dir = os.path.abspath(os.path.join(script_dir, "..", ".."))

    # Select representative files for First Extract and Last Extract
    first_files = [
        ("capacitor.config.ts", os.path.join(user_app_dir, "capacitor.config.ts")),
        ("package.json", os.path.join(user_app_dir, "package.json")),
        ("index.html", os.path.join(user_app_dir, "index.html")),
        ("src/main.tsx", os.path.join(user_app_dir, "src", "main.tsx")),
        ("src/App.tsx", os.path.join(user_app_dir, "src", "App.tsx")),
        ("src/context/LanguageContext.tsx", os.path.join(user_app_dir, "src", "context", "LanguageContext.tsx")),
        ("src/context/AuthContext.tsx", os.path.join(user_app_dir, "src", "context", "AuthContext.tsx")),
    ]

    last_files = [
        ("src/services/syncService.ts", os.path.join(user_app_dir, "src", "services", "syncService.ts")),
        ("src/services/habitsService.ts", os.path.join(user_app_dir, "src", "services", "habitsService.ts")),
        ("src/i18n/index.ts", os.path.join(user_app_dir, "src", "i18n", "index.ts")),
        ("src/components/AskMitoDrawer.tsx", os.path.join(user_app_dir, "src", "components", "AskMitoDrawer.tsx")),
        ("src/components/DailyLoggingChatbotModal.tsx", os.path.join(user_app_dir, "src", "components", "DailyLoggingChatbotModal.tsx")),
    ]

    html_out = []
    html_out.append("""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Mito Reboot - Source Code Extracts Deposit</title>
<style>
  @page {
    size: A4 portrait;
    margin: 14mm 12mm 14mm 12mm;
  }
  body {
    font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
    font-size: 7.2pt;
    line-height: 1.35;
    color: #0f172a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
  }
  .page {
    page-break-after: always;
    position: relative;
    height: 100%;
  }
  .page:last-child {
    page-break-after: avoid;
  }
  .header {
    border-bottom: 1.5px solid #0f2a4a;
    padding-bottom: 4px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    font-weight: bold;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .file-badge {
    background: #0f2a4a;
    color: #ffffff;
    padding: 3px 8px;
    font-size: 7.5pt;
    font-weight: bold;
    margin: 8px 0 4px 0;
    display: inline-block;
    border-radius: 2px;
  }
  .code-table {
    width: 100%;
    border-collapse: collapse;
  }
  .code-table td {
    padding: 0 4px;
    vertical-align: top;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .code-table td.ln {
    width: 38px;
    color: #94a3b8;
    text-align: right;
    user-select: none;
    border-right: 1px solid #e2e8f0;
    padding-right: 6px;
  }
  .code-table td.code {
    padding-left: 8px;
  }
  .cover-box {
    border: 2px solid #0f2a4a;
    padding: 30px;
    margin-top: 40px;
    text-align: center;
    background: #f8fafc;
  }
</style>
</head>
<body>
""")

    # Cover Sheet for Code Deposit
    html_out.append("""
<div class="page">
  <div class="header">
    <span>Government of India &bull; Copyright Office</span>
    <span>Form XIV &bull; Rule 70 Code Deposit</span>
  </div>
  <div class="cover-box">
    <div style="font-size: 17pt; font-weight: bold; color: #0f2a4a; margin-bottom: 3px;">MITO REBOOT</div>
    <div style="font-size: 11pt; color: #0d9488; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">&mdash; PREVENTIVE LIFESTYLE APP &mdash;</div>
    <div style="font-size: 9.5pt; color: #2563eb; font-weight: bold; margin-bottom: 20px;">SOURCE CODE EXTRACTS DEPOSIT (STATUTORY 50-PAGE SPECIFICATION)</div>
    
    <table style="margin: 0 auto; text-align: left; font-size: 8.5pt; border-collapse: collapse; width: 88%;">
      <tr><td style="padding: 6px; font-weight: bold; border-bottom: 1px solid #cbd5e1; width: 35%;">TITLE OF WORK:</td><td style="padding: 6px; border-bottom: 1px solid #cbd5e1;">Mito Reboot &ndash; Preventive Lifestyle App</td></tr>
      <tr><td style="padding: 6px; font-weight: bold; border-bottom: 1px solid #cbd5e1;">APP DOMAIN:</td><td style="padding: 6px; border-bottom: 1px solid #cbd5e1;">Health & Wellness / Preventive Lifestyle & Metabolic Health Software</td></tr>
      <tr><td style="padding: 6px; font-weight: bold; border-bottom: 1px solid #cbd5e1;">AUTHORS & OWNERS:</td><td style="padding: 6px; border-bottom: 1px solid #cbd5e1;"><strong>Dr. Krithikaa</strong> & <strong>Dr. Lohith</strong> (Joint Authors & Owners)</td></tr>
      <tr><td style="padding: 6px; font-weight: bold; border-bottom: 1px solid #cbd5e1;">LEAD DEVELOPER:</td><td style="padding: 6px; border-bottom: 1px solid #cbd5e1;">Sathish Kumar K (Software Architect & Lead Engineer)</td></tr>
      <tr><td style="padding: 6px; font-weight: bold; border-bottom: 1px solid #cbd5e1;">PUBLICATION STATUS:</td><td style="padding: 6px; border-bottom: 1px solid #cbd5e1;"><strong>Published</strong> (Live Application in India)</td></tr>
      <tr><td style="padding: 6px; font-weight: bold; border-bottom: 1px solid #cbd5e1;">VERSION / YEAR:</td><td style="padding: 6px; border-bottom: 1px solid #cbd5e1;">v5.9.0 / 2026</td></tr>
      <tr><td style="padding: 6px; font-weight: bold; border-bottom: 1px solid #cbd5e1;">LANGUAGES & STACK:</td><td style="padding: 6px; border-bottom: 1px solid #cbd5e1;">TypeScript, JavaScript, React 18, Vite, Capacitor 6 (Android/iOS/Web)</td></tr>
      <tr><td style="padding: 6px; font-weight: bold; border-bottom: 1px solid #cbd5e1;">SUBMISSION FORMAT:</td><td style="padding: 6px; border-bottom: 1px solid #cbd5e1;">PART 1: First 25 Pages &bull; PART 2: Last 25 Pages + 2 CD-R Discs</td></tr>
    </table>
    
    <div style="margin-top: 30px; font-size: 8pt; color: #475569;">
      Statutory Notice: Filed under Literary Work &ndash; Computer Software [Sec. 2(o)] in compliance with Rule 70 of Copyright Rules, 2013.<br>
      Proprietary Intellectual Property &copy; 2026 Dr. Krithikaa & Dr. Lohith. All Rights Reserved.
    </div>
  </div>
</div>
""")

    # Function to stream code blocks
    def append_files_to_stream(file_list, section_title):
        html_out.append(f"""
        <div style="page-break-before: always; margin-bottom: 15px;">
          <div class="header">
            <span>Mito Reboot &bull; Preventive Lifestyle App | Owners: Dr. Krithikaa & Dr. Lohith</span>
            <span>{section_title}</span>
          </div>
          <div style="background: #0f2a4a; color: #fff; padding: 6px 12px; font-size: 8pt; font-weight: bold;">
            {section_title} &mdash; STATUTORY CODE DEPOSIT EXTRACT
          </div>
        </div>
        """)
        for display_name, file_path in file_list:
            if not os.path.exists(file_path):
                continue
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
            
            capped_lines = lines[:450]
            html_out.append(f'<div class="file-badge">FILE: {display_name} ({len(lines)} total lines)</div>')
            html_out.append('<table class="code-table">')
            for idx, line in enumerate(capped_lines, 1):
                clean_l = escape_code(line.rstrip("\r\n"))
                if not clean_l:
                    clean_l = " "
                html_out.append(f'<tr><td class="ln">{idx}</td><td class="code">{clean_l}</td></tr>')
            html_out.append('</table>')

    append_files_to_stream(first_files, "PART 1: FIRST EXTRACT (BOOTSTRAP, RUNTIME, ARCHITECTURE)")
    append_files_to_stream(last_files, "PART 2: LAST EXTRACT (TELEMETRY, AI SERVICES, LOCALIZATION)")

    html_out.append("""
</body>
</html>
""")

    html_path = os.path.join(user_app_dir, "Mito_Reboot_Source_Code_Extracts.html")
    pdf_user_path = os.path.join(user_app_dir, "Mito_Reboot_Source_Code_Extracts.pdf")
    pdf_root_path = os.path.join(health_app_dir, "Mito_Reboot_Source_Code_Extracts.pdf")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html_out))
    print(f"[OK] Wrote Updated Source Code HTML to: {html_path}")

    chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    cmd = [
        chrome_bin,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_user_path}",
        f"file://{html_path}"
    ]

    print("[...] Compiling Updated Source Code PDF via Chrome Headless...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode == 0 and os.path.exists(pdf_user_path):
        size_kb = os.path.getsize(pdf_user_path) / 1024
        print(f"[SUCCESS] Created Source Code PDF: {pdf_user_path} ({size_kb:.1f} KB)")
        with open(pdf_user_path, "rb") as src, open(pdf_root_path, "wb") as dst:
            dst.write(src.read())
        print(f"[SUCCESS] Copied to Root Workspace: {pdf_root_path}")
        return True
    else:
        print("[ERR] Failed to compile source code PDF:", res.stderr)
        return False

if __name__ == "__main__":
    generate_source_code_pdf()
