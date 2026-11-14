import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import ShopOrder from '../models/ShopOrder';

const router = express.Router();

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mitoreboot.app';
const APP_STORE_URL = 'https://apps.apple.com/in/app/mito-reboot/id6783705985';

/**
 * Universal Smart Deep Link Bridge Page
 * Handles:
 * - GET /open-app
 * - GET /app
 * - GET /open
 *
 * Query Params:
 * - target / screen / tab / path: target screen inside the app (e.g. habits, glucose, orders, home)
 * - orderId: optional specific order ID
 */
const renderUniversalAppBridge = async (req: Request, res: Response) => {
  const target = (req.query.target || req.query.screen || req.query.tab || req.query.path || '').toString().trim();
  const orderId = (req.query.orderId || req.query.id || '').toString().trim();
  const store = (req.query.store || '').toString().toLowerCase().trim();

  let cleanPath = 'home';
  let title = 'Open Mito_Reboot App';
  let subtitle = 'Opening Mito_Reboot on your device...';

  if (orderId) {
    cleanPath = `orders/${encodeURIComponent(orderId)}`;
    title = `Order #${orderId.slice(-6).toUpperCase()} • Mito_Reboot`;
    subtitle = 'Opening order details in the Mito_Reboot app...';
  } else if (target) {
    cleanPath = target.replace(/^\//, '');
    const formatted = cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1);
    title = `${formatted} • Mito_Reboot`;
    subtitle = `Opening ${formatted} in the Mito_Reboot app...`;
  }

  const fallback = (req.query.fallback || req.query.default || '').toString().trim();
  const websiteUrl = 'https://www.mitoreboot.in';
  const targetFallbackUrl = (fallback === 'store' || store === 'google' || store === 'play') ? PLAY_STORE_URL : websiteUrl;
  const iosFallbackUrl = (fallback === 'store' || store === 'apple' || store === 'ios') ? APP_STORE_URL : websiteUrl;

  const ua = req.headers['user-agent'] || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  // 1. Direct Store Redirects for non-matching mobile platforms or desktop
  if (store === 'google' || store === 'play') {
    if (!isAndroid) {
      return res.redirect(302, PLAY_STORE_URL);
    }
  } else if (store === 'apple' || store === 'ios') {
    if (!isIOS) {
      return res.redirect(302, APP_STORE_URL);
    }
  } else if (!isAndroid && !isIOS) {
    // Desktop browser for general links: forward smoothly to website or store
    if (fallback === 'store') {
      return res.redirect(302, PLAY_STORE_URL);
    }
    return res.redirect(302, websiteUrl);
  }

  const appSchemeUrl = `mitoreboot://${cleanPath}`;
  const androidIntentUrl = `intent://${cleanPath}#Intent;scheme=mitoreboot;package=com.mitoreboot.app;S.browser_fallback_url=${encodeURIComponent(targetFallbackUrl)};end`;
  const primaryAutoUrl = isAndroid ? androidIntentUrl : (isIOS ? appSchemeUrl : targetFallbackUrl);
  const primaryFallbackUrl = isIOS ? iosFallbackUrl : targetFallbackUrl;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${title}</title>
  <meta name="description" content="Open the Mito_Reboot app directly or download it from the official App Store and Google Play." />
  <meta http-equiv="refresh" content="0;url=${primaryAutoUrl}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0B1120;
      color: #F8FAFC;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      text-align: center;
    }
    .card {
      background: linear-gradient(180deg, #1E293B 0%, #0F172A 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.5rem;
      padding: 2.5rem 1.75rem;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: -80px;
      left: 50%;
      transform: translateX(-50%);
      width: 220px;
      height: 220px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0) 70%);
      pointer-events: none;
    }
    .logo-badge {
      width: 72px;
      height: 72px;
      border-radius: 1.25rem;
      margin: 0 auto 1.25rem;
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 12px 28px -6px rgba(37, 99, 235, 0.5);
      overflow: hidden;
    }
    .logo-badge img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    h1 {
      font-size: 1.45rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.4rem;
      color: #FFFFFF;
    }
    .tagline {
      font-size: 0.85rem;
      color: #94A3B8;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(255, 255, 255, 0.15);
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 1.25rem auto 0.75rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .status-text {
      font-size: 0.85rem;
      color: #94A3B8;
      margin-bottom: 1.5rem;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.95rem 1.25rem;
      border-radius: 0.875rem;
      font-size: 0.92rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
      margin-bottom: 0.75rem;
    }
    .btn-primary {
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      color: #FFFFFF;
      box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
    }
    .btn-primary:hover {
      background: #1D4ED8;
      transform: translateY(-1px);
    }
    .btn-store {
      background: #020617;
      color: #F8FAFC;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .btn-store:hover {
      background: #0F172A;
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }
    .btn-store svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    .store-grid {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-top: 1rem;
    }
    .footer-note {
      margin-top: 1.75rem;
      font-size: 0.75rem;
      color: #64748B;
      line-height: 1.5;
    }
    .footer-note a {
      color: #60A5FA;
      text-decoration: none;
      font-weight: 600;
    }
    .desktop-only {
      display: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-badge">
      <img src="/uploads/app-logo.png" alt="Mito_Reboot" onerror="this.onerror=null; this.src='https://app.mitoreboot.in/assets/mitoreboot-logo.png';" />
    </div>

    <h1>Mito_Reboot</h1>
    <p class="tagline">Preventive Lifestyle App</p>

    <div class="spinner" id="spinner"></div>
    <p class="status-text" id="statusMessage">${subtitle}</p>

    <!-- Direct Launch Button -->
    <a href="${isAndroid ? androidIntentUrl : appSchemeUrl}" id="appBtn" class="btn btn-primary">
      📱 Open Mito_Reboot App
    </a>

    <!-- Mobile App Store Fallbacks -->
    <div class="store-grid">
      <a href="${APP_STORE_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-store" id="iosBtn">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.95 2.77.99.08 2.03-.5 2.68-1.27z"/>
        </svg>
        <span>Download on App Store</span>
      </a>

      <a href="${PLAY_STORE_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-store" id="androidBtn">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.609 1.814L13.793 12 3.61 22.186a2.38 2.38 0 0 1-.61-.925c-.244-.705-.244-1.529 0-2.234V4.973c0-.687.2-1.348.609-1.865v-1.294zm11.598 11.598l2.259 2.259-11.834 6.83 9.575-9.089zm0-2.824L5.632 1.503l11.834 6.83-2.259 2.259zm1.414 1.412l3.414-1.972c1.3-.751 1.3-1.977 0-2.728l-3.414-1.972-2.485 2.485 2.485 2.187z"/>
        </svg>
        <span>Get it on Google Play</span>
      </a>
    </div>

    <div class="footer-note">
      Mito_Reboot is available for iOS and Android. <br />
      Visit our website at <a href="https://www.mitoreboot.in">www.mitoreboot.in</a>
    </div>
  </div>

  <script>
    (function() {
      var primaryAutoUrl = "${primaryAutoUrl}";
      var primaryFallbackUrl = "${primaryFallbackUrl}";
      var isAndroid = ${isAndroid ? 'true' : 'false'};
      var isIOS = ${isIOS ? 'true' : 'false'};
      var statusMessage = document.getElementById('statusMessage');
      var spinner = document.getElementById('spinner');

      var iosBtn = document.getElementById('iosBtn');
      var androidBtn = document.getElementById('androidBtn');

      if (isAndroid) {
        if (iosBtn) iosBtn.style.display = 'none';
        try {
          window.location.replace(primaryAutoUrl);
        } catch (e) {
          window.location.href = primaryAutoUrl;
        }
        setTimeout(function() {
          if (!document.hidden) {
            window.location.replace(primaryFallbackUrl);
          }
        }, 800);
      } else if (isIOS) {
        if (androidBtn) androidBtn.style.display = 'none';
        var startTime = Date.now();
        try {
          window.location.replace(primaryAutoUrl);
        } catch (e) {
          window.location.href = primaryAutoUrl;
        }
        setTimeout(function() {
          if (!document.hidden && Date.now() - startTime < 2000) {
            window.location.replace(primaryFallbackUrl);
          }
        }, 800);
      }

      // If browser blocks auto navigation, prompt user to tap button
      setTimeout(function() {
        if (spinner) spinner.style.display = 'none';
        if (statusMessage) statusMessage.textContent = 'Tap below to open or download Mito_Reboot:';
      }, 1500);
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).send(html);
};

/**
 * Smart Deep Link Bridge Page for Shop Orders
 * Handles:
 * - GET /orders/:orderId
 * - GET /orders
 * - GET /open/order/:orderId
 */
const renderOrderBridge = async (req: Request, res: Response) => {
  const orderId = (req.params.orderId || req.query.orderId || req.query.id || '').toString().trim();

  let orderData: any = null;
  if (orderId && mongoose.isValidObjectId(orderId)) {
    try {
      orderData = await ShopOrder.findById(orderId).lean();
    } catch {
      // ignore
    }
  }

  const displayId = orderData?.vendorOrderId || (orderId ? orderId.slice(-6).toUpperCase() : 'Recent Order');
  const totalAmount = orderData ? `₹${Number(orderData.totalAmount || 0).toFixed(2)}` : '';
  const deliveryStatus = orderData?.deliveryStatus || orderData?.status || 'Processing';
  const itemsCount = orderData?.products?.length || 0;

  const appSchemeUrl = orderId 
    ? `mitoreboot://orders/${encodeURIComponent(orderId)}`
    : `mitoreboot://orders`;

  const androidIntentUrl = orderId
    ? `intent://orders/${encodeURIComponent(orderId)}#Intent;scheme=mitoreboot;package=com.mitoreboot.app;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`
    : `intent://orders#Intent;scheme=mitoreboot;package=com.mitoreboot.app;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Order #${displayId} — Mito_Reboot</title>
  <meta name="description" content="View your order #${displayId} status and tracking details in the Mito_Reboot app." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0B1120;
      color: #F8FAFC;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      text-align: center;
    }
    .card {
      background: linear-gradient(180deg, #1E293B 0%, #0F172A 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.5rem;
      padding: 2.25rem 1.75rem;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: -80px;
      left: 50%;
      transform: translateX(-50%);
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%);
      pointer-events: none;
    }
    .logo-badge {
      width: 64px;
      height: 64px;
      border-radius: 1rem;
      margin: 0 auto 1.25rem;
      background: linear-gradient(135deg, #047857 0%, #065f46 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
      overflow: hidden;
    }
    .logo-badge img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    h1 {
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.35rem;
      color: #FFFFFF;
    }
    .badge {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      margin-bottom: 1.25rem;
    }
    .info-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 1rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-around;
      text-align: left;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94A3B8;
      margin-bottom: 0.2rem;
    }
    .info-val {
      font-size: 0.95rem;
      font-weight: 700;
      color: #F1F5F9;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.9rem 1.25rem;
      border-radius: 0.875rem;
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
      margin-bottom: 0.75rem;
    }
    .btn-primary {
      background: #10B981;
      color: #FFFFFF;
      box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);
    }
    .btn-primary:hover {
      background: #059669;
      transform: translateY(-1px);
    }
    .btn-store {
      background: #020617;
      color: #F8FAFC;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .btn-store:hover {
      background: #0F172A;
      border-color: rgba(255, 255, 255, 0.3);
    }
    .btn-store svg {
      width: 16px;
      height: 16px;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255, 255, 255, 0.15);
      border-top-color: #10B981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 1.25rem auto 0.5rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .status-text {
      font-size: 0.8rem;
      color: #94A3B8;
      margin-bottom: 1.25rem;
    }
    .footer-links {
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: #64748B;
    }
    .footer-links a {
      color: #10B981;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-badge">
      <img src="/uploads/app-logo.png" alt="Mito_Reboot Shop" onerror="this.onerror=null; this.src='https://app.mitoreboot.in/assets/mitoreboot-logo.png';" />
    </div>

    <h1>Mito_Reboot Shop</h1>
    <div class="badge">Order #${displayId}</div>

    <div class="info-box">
      <div class="info-item">
        <span class="info-label">Status</span>
        <span class="info-val">${deliveryStatus}</span>
      </div>
      ${totalAmount ? `
      <div class="info-item">
        <span class="info-label">Total</span>
        <span class="info-val">${totalAmount}</span>
      </div>` : ''}
      ${itemsCount > 0 ? `
      <div class="info-item">
        <span class="info-label">Items</span>
        <span class="info-val">${itemsCount}</span>
      </div>` : ''}
    </div>

    <div class="spinner" id="spinner"></div>
    <p class="status-text" id="statusMessage">Opening order in Mito_Reboot app...</p>

    <a href="${appSchemeUrl}" id="appBtn" class="btn btn-primary">
      📱 Open in Mito_Reboot App
    </a>

    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
      <a href="${APP_STORE_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-store" id="iosBtn">
        <span>🍏 App Store</span>
      </a>
      <a href="${PLAY_STORE_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-store" id="androidBtn">
        <span>🤖 Google Play</span>
      </a>
    </div>

    <div class="footer-links">
      Track all orders on the Mito_Reboot app. <br />
      Visit our website at <a href="https://www.mitoreboot.in">www.mitoreboot.in</a>
    </div>
  </div>

  <script>
    (function() {
      const appSchemeUrl = "${appSchemeUrl}";
      const androidIntentUrl = "${androidIntentUrl}";
      const playStoreUrl = "${PLAY_STORE_URL}";
      const appStoreUrl = "${APP_STORE_URL}";
      const statusMessage = document.getElementById('statusMessage');
      const spinner = document.getElementById('spinner');

      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isAndroid) {
        const iosBtn = document.getElementById('iosBtn');
        if (iosBtn) iosBtn.style.display = 'none';

        window.location.href = androidIntentUrl;
        setTimeout(function() {
          if (!document.hidden) {
            if (statusMessage) statusMessage.textContent = 'App not installed. Opening Google Play...';
            window.location.href = playStoreUrl;
          }
        }, 1500);
      } else if (isIOS) {
        const androidBtn = document.getElementById('androidBtn');
        if (androidBtn) androidBtn.style.display = 'none';

        const startTime = Date.now();
        window.location.href = appSchemeUrl;
        setTimeout(function() {
          if (!document.hidden && Date.now() - startTime < 2500) {
            if (statusMessage) statusMessage.textContent = 'App not installed. Opening App Store...';
            window.location.href = appStoreUrl;
          }
        }, 1500);
      } else {
        if (spinner) spinner.style.display = 'none';
        if (statusMessage) statusMessage.textContent = 'Download the MitoReboot mobile app to track your live order:';
      }
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).send(html);
};

// Mount Universal App Bridge
router.get('/open-app', renderUniversalAppBridge);
router.get('/app', renderUniversalAppBridge);
router.get('/open', renderUniversalAppBridge);

// Mount Order Bridge
router.get('/orders/:orderId', renderOrderBridge);
router.get('/orders', renderOrderBridge);
router.get('/open/order/:orderId', renderOrderBridge);

export default router;
