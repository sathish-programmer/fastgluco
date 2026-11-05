import { Router, Request, Response } from 'express';
import { LegalDocument } from '../models/LegalDocument';
import { OFFICIAL_TERMS_HTML } from '../constants/legalTerms';

const router = Router();

const renderHtmlPage = (title: string, bodyContent: string) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | MitoReboot</title>
  <meta name="robots" content="index, follow">
  <link rel="icon" href="https://app.mitoreboot.in/favicon.ico" />
  <style>
    :root {
      --primary: #2563eb;
      --text-dark: #0f172a;
      --text-muted: #64748b;
      --bg-light: #f8fafc;
      --card-bg: #ffffff;
      --border-color: #e2e8f0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-light);
      color: #334155;
      line-height: 1.6;
      padding: 24px 16px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      padding: 32px 24px;
    }
    @media (min-width: 768px) {
      .container {
        padding: 48px;
      }
    }
    .header-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--border-color);
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #eff6ff;
      color: var(--primary);
      font-weight: 800;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid #bfdbfe;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-dark);
      letter-spacing: -0.02em;
    }
    .footer-bar {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
    }
    a {
      color: var(--primary);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar">
      <div class="logo-badge">MitoReboot™</div>
      <div class="brand-title">MitoReboot Private Limited</div>
    </div>
    <div class="legal-content">
      ${bodyContent}
    </div>
    <div class="footer-bar">
      <p><strong>MitoReboot Private Limited</strong></p>
      <p>No 11/7, Krishna Residency, Flat No B-1, Basavanagudi, Bangalore South, Bangalore - 560004, Karnataka, India</p>
      <p style="margin-top: 8px;">Contact: <a href="mailto:support@mitoreboot.in">support@mitoreboot.in</a></p>
      <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} MitoReboot Private Limited. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};

const handleTermsPage = async (req: Request, res: Response) => {
  try {
    let doc = await LegalDocument.findOne({ type: 'TermsOfService' });
    const content = doc?.content || OFFICIAL_TERMS_HTML;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderHtmlPage('Terms and Conditions', content));
  } catch (err: any) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderHtmlPage('Terms and Conditions', OFFICIAL_TERMS_HTML));
  }
};

const handlePrivacyPage = async (req: Request, res: Response) => {
  try {
    let doc = await LegalDocument.findOne({ type: 'PrivacyPolicy' });
    const content = doc?.content || OFFICIAL_TERMS_HTML;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderHtmlPage('Privacy Policy', content));
  } catch (err: any) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderHtmlPage('Privacy Policy', OFFICIAL_TERMS_HTML));
  }
};

// Terms routes
router.get('/terms', handleTermsPage);
router.get('/terms.html', handleTermsPage);
router.get('/terms-and-conditions', handleTermsPage);
router.get('/terms-and-conditions.html', handleTermsPage);
router.get('/terms-of-service', handleTermsPage);
router.get('/terms-of-service.html', handleTermsPage);
router.get('/legal/terms', handleTermsPage);

// Privacy routes
router.get('/privacy', handlePrivacyPage);
router.get('/privacy.html', handlePrivacyPage);
router.get('/privacy-policy', handlePrivacyPage);
router.get('/privacy-policy.html', handlePrivacyPage);
router.get('/legal/privacy', handlePrivacyPage);

export default router;
