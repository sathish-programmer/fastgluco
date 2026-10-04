import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { downloadFile } from './fileDownloader';

/**
 * Initializes global link and window.open interception for Capacitor native apps.
 * Prevents black/blank screens caused by WebView popup restrictions or unhandled target="_blank" links.
 */
export function initNativeLinkInterceptor(): void {
  if (typeof window === 'undefined') return;

  // 1. Override window.open on native platforms to use In-App Browser with native Close bar
  if (Capacitor.isNativePlatform()) {
    const originalWindowOpen = window.open;
    window.open = (url?: string | URL, target?: string, features?: string): Window | null => {
      if (!url) return null;
      const urlStr = url.toString();

      // If it's a PDF or downloadable file, use downloadFile
      if (isDownloadUrl(urlStr)) {
        handleNativeDownload(urlStr);
        return null;
      }

      // If it's an external URL or target is _blank, open via Chrome Custom Tabs / Safari View Controller
      if (target === '_blank' || target === '_system' || isExternalUrl(urlStr)) {
        Browser.open({ url: urlStr }).catch((err) => {
          console.warn('[NativeLinkInterceptor] Browser.open failed, trying original open:', err);
          originalWindowOpen.call(window, urlStr, target, features);
        });
        return null;
      }

      return originalWindowOpen.call(window, urlStr, target, features);
    };
  }

  // 2. Global DOM click listener to intercept <a> clicks that could trigger blank screens
  document.addEventListener('click', (event: MouseEvent) => {
    // Find closest anchor tag
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest('a') as HTMLAnchorElement | null;
    if (!anchor || !anchor.href) return;

    const href = anchor.href;
    const isBlank = anchor.target === '_blank' || anchor.getAttribute('target') === '_blank';
    const hasDownloadAttr = anchor.hasAttribute('download');

    // Case A: File Download Link
    if (hasDownloadAttr || isDownloadUrl(href)) {
      if (Capacitor.isNativePlatform()) {
        event.preventDefault();
        event.stopPropagation();
        const filename = anchor.getAttribute('download') || getFilenameFromUrl(href);
        handleNativeDownload(href, filename);
        return;
      }
    }

    // Case B: External link or target="_blank" on native platform
    if (Capacitor.isNativePlatform() && (isBlank || isExternalUrl(href))) {
      // Don't intercept app internal deep links or javascript:
      if (href.startsWith('javascript:') || href.startsWith('mitoreboot:') || href.startsWith('tel:') || href.startsWith('mailto:')) {
        return;
      }

      // If it points to app.mitoreboot.in or localhost without _blank, let the router handle it
      if (!isBlank && isInternalAppUrl(href)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      Browser.open({ url: href }).catch((err) => {
        console.warn('[NativeLinkInterceptor] Failed to open external link via Browser plugin:', err);
        window.location.href = href;
      });
    }
  }, true); // Use capture phase
}

function isExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.href);
    const host = parsed.hostname.toLowerCase();
    // Allow internal API calls or app domain
    if (host === window.location.hostname.toLowerCase()) return false;
    return true;
  } catch {
    return false;
  }
}

function isInternalAppUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.href);
    const host = parsed.hostname.toLowerCase();
    return host === 'app.mitoreboot.in' || host === 'localhost' || host === window.location.hostname.toLowerCase();
  } catch {
    return false;
  }
}

function isDownloadUrl(url: string): boolean {
  const clean = url.toLowerCase().split('?')[0];
  return (
    clean.endsWith('.pdf') ||
    clean.endsWith('.csv') ||
    clean.endsWith('.xlsx') ||
    clean.endsWith('.zip') ||
    clean.includes('/download') ||
    clean.includes('/invoice')
  );
}

function getFilenameFromUrl(url: string): string {
  try {
    const clean = url.split('?')[0];
    const parts = clean.split('/');
    const last = parts[parts.length - 1];
    if (last && last.length > 2) return last;
  } catch {
    // fallback
  }
  return 'downloaded-file.pdf';
}

async function handleNativeDownload(url: string, filename?: string): Promise<void> {
  const finalFilename = filename || getFilenameFromUrl(url);
  try {
    // Retrieve auth token from localStorage if present
    let token: string | null = null;
    try {
      token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    } catch {
      // ignore
    }

    await downloadFile({
      url,
      filename: finalFilename,
      token
    });
  } catch (err: any) {
    console.error('[NativeLinkInterceptor] Download failed:', err);
    // Fallback: try opening via Browser plugin
    Browser.open({ url }).catch(() => {});
  }
}
