import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import ShopOrder from '../models/ShopOrder';

const router = express.Router();

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

  const displayId = orderData?.vendorOrderId || orderId || 'Recent Order';
  const totalAmount = orderData ? `₹${Number(orderData.totalAmount || 0).toFixed(2)}` : '';
  const deliveryStatus = orderData?.deliveryStatus || orderData?.status || 'Processing';
  const customerName = orderData?.patientName || 'Customer';
  const itemsCount = orderData?.products?.length || 0;

  const webFallbackUrl = orderId 
    ? `https://app.mitoreboot.in/?tab=orders&orderId=${encodeURIComponent(orderId)}`
    : `https://app.mitoreboot.in/?tab=orders`;

  const appSchemeUrl = orderId 
    ? `mitoreboot://orders/${encodeURIComponent(orderId)}`
    : `mitoreboot://orders`;

  const androidIntentUrl = orderId
    ? `intent://orders/${encodeURIComponent(orderId)}#Intent;scheme=mitoreboot;package=com.mitoreboot.app;S.browser_fallback_url=${encodeURIComponent(webFallbackUrl)};end`
    : `intent://orders#Intent;scheme=mitoreboot;package=com.mitoreboot.app;S.browser_fallback_url=${encodeURIComponent(webFallbackUrl)};end`;

  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.mitoreboot.app';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Order #${displayId} — MitoReboot</title>
  <meta name="description" content="View your order #${displayId} status, items, and tracking details in the MitoReboot app." />
  <link rel="icon" href="https://app.mitoreboot.in/favicon.ico" />
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
    .logo {
      width: 64px;
      height: 64px;
      border-radius: 1rem;
      margin: 0 auto 1.25rem;
      background: #047857;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
    }
    .logo img {
      width: 42px;
      height: 42px;
      object-fit: contain;
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
      display: block;
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
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #E2E8F0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
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
    <div class="logo">
      <img src="https://app.mitoreboot.in/assets/mitoreboot-logo.png" alt="MitoReboot" onerror="this.style.display='none'" />
    </div>

    <h1>MitoReboot Shop</h1>
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

    <div class="spinner"></div>
    <p class="status-text" id="statusMessage">Opening order in MitoReboot app...</p>

    <a href="${appSchemeUrl}" id="appBtn" class="btn btn-primary">
      📱 Open in MitoReboot App
    </a>

    <a href="${webFallbackUrl}" class="btn btn-secondary">
      🌐 View Order on Web
    </a>

    <div class="footer-links">
      Don't have the app installed? <br />
      <a href="${playStoreUrl}" target="_blank" rel="noopener noreferrer">Get it on Google Play</a>
    </div>
  </div>

  <script>
    (function() {
      const orderId = "${orderId}";
      const appSchemeUrl = "${appSchemeUrl}";
      const androidIntentUrl = "${androidIntentUrl}";
      const webFallbackUrl = "${webFallbackUrl}";
      const statusMessage = document.getElementById('statusMessage');

      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      // Attempt to launch the native app
      if (isAndroid) {
        window.location.href = androidIntentUrl;
      } else if (isIOS) {
        window.location.href = appSchemeUrl;
      } else {
        // Desktop browser: smoothly forward to web app view
        setTimeout(function() {
          window.location.href = webFallbackUrl;
        }, 1000);
        return;
      }

      // If still visible after 2.5 seconds on mobile (app not installed or blocked), fallback to web
      setTimeout(function() {
        if (!document.hidden) {
          if (statusMessage) {
            statusMessage.textContent = 'App not detected. Forwarding to web...';
          }
          window.location.href = webFallbackUrl;
        }
      }, 2500);
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).send(html);
};

router.get('/orders/:orderId', renderOrderBridge);
router.get('/orders', renderOrderBridge);
router.get('/open/order/:orderId', renderOrderBridge);

export default router;
