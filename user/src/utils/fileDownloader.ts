import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface DownloadFileOptions {
  url: string;
  filename: string;
  token?: string | null;
  mimeType?: string;
}

/**
 * Robust cross-platform file downloader supporting Web, Android, and iOS.
 * - On Web: Triggers standard browser blob download via programmatic anchor.
 * - On Native (Android / iOS): Downloads file buffer, saves to Cache directory via
 *   Capacitor Filesystem, and presents the native OS share/save dialog via Capacitor Share.
 */
export async function downloadFile({
  url,
  filename,
  token,
  mimeType = 'application/pdf'
}: DownloadFileOptions): Promise<void> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    let errorMsg = `Download failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) errorMsg = errorJson.message;
      else if (errorJson.error) errorMsg = errorJson.error;
    } catch {
      // response is not JSON
    }
    throw new Error(errorMsg);
  }

  const rawBlob = await response.blob();
  if (!rawBlob || rawBlob.size === 0) {
    throw new Error('Downloaded file is empty.');
  }
  const blob = rawBlob.type ? rawBlob : new Blob([rawBlob], { type: mimeType });

  // 1. Native Mobile Platform (Android / iOS)
  if (Capacitor.isNativePlatform()) {
    // Convert Blob to Base64 string for Capacitor Filesystem
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:mime/type;base64, prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to convert file to binary format.'));
      reader.readAsDataURL(blob);
    });

    // Write file into native app cache directory
    const writtenFile = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache
    });

    // Trigger native share/save sheet so user can open in viewer or save to device
    try {
      await Share.share({
        title: filename,
        text: filename,
        url: writtenFile.uri,
        dialogTitle: 'Save / Open PDF'
      });
    } catch (shareErr: any) {
      const msg = (shareErr?.message || '').toLowerCase();
      // If user simply closed/dismissed the share sheet, do not treat as an error
      if (msg.includes('cancel') || msg.includes('abort') || msg.includes('dismiss')) {
        return;
      }
      throw shareErr;
    }
    return;
  }

  // 2. Web Browser
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 2000);
}
