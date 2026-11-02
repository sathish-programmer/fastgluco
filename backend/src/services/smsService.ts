export class SMSService {
  /**
   * Normalize input phone numbers to E.164 format.
   * - If it already starts with '+', returns as is.
   * - If it's a 10-digit number, prepends '+91' (default India).
   * - Otherwise, prepends '+' to the digits.
   */
  public static normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleaned) return '';
    
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    
    return `+${cleaned}`;
  }

  /**
   * Send OTP via Fast2SMS (Instant Indian SMS gateway)
   * Priority: Low-cost DLT/OTP route (₹0.25).
   * Emergency iOS Fallback: Quick route ('q') if low-cost route is rejected.
   */
  public static async sendFast2SmsOtp(
    phoneNumber: string,
    otp: string
  ): Promise<{ success: boolean; routeUsed?: string; reason?: string }> {
    if (process.env.ENABLE_FAST2SMS !== 'true') {
      console.log('[Fast2SMS] Fast2SMS is explicitly DISABLED on this server (ENABLE_FAST2SMS is not true). Skipping SMS delivery.');
      return { success: false, reason: 'DISABLED' };
    }

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey || apiKey === 'disabled') {
      console.log('[Fast2SMS] FAST2SMS_API_KEY is missing or disabled. Skipping SMS delivery.');
      return { success: false, reason: 'MISSING_API_KEY' };
    }

    const cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, '').slice(-10);
    if (cleaned.length !== 10) {
      console.error('[Fast2SMS] Invalid 10-digit phone number format');
      return { success: false, reason: 'INVALID_PHONE_NUMBER' };
    }

    try {
      // 1. Check if custom DLT Template ID & Sender ID are configured
      const dltTeId = process.env.FAST2SMS_DLT_TE_ID;
      const dltSenderId = process.env.FAST2SMS_SENDER_ID;

      let payload: any;
      let selectedRoute = 'otp';

      if (dltTeId && dltSenderId) {
        selectedRoute = 'dlt';
        payload = {
          route: 'dlt',
          sender_id: dltSenderId,
          message: dltTeId,
          variables_values: otp,
          numbers: cleaned
        };
      } else {
        // Fast2SMS default low-cost OTP route (₹0.25 / 25 paise)
        selectedRoute = 'otp';
        payload = {
          route: 'otp',
          variables_values: otp,
          numbers: cleaned
        };
      }

      console.log(`[Fast2SMS] Attempting low-cost route: "${selectedRoute}" (₹0.25) to destination ***${cleaned.slice(-4)}`);

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data: any = await response.json();
      const statusMsg = data?.message?.[0] || data?.message || (data?.return ? 'Delivered' : 'Failed');
      console.log(`[Fast2SMS Response] Route: ${selectedRoute} | Status: ${data?.return ? 'SUCCESS' : 'FAILED'} | Gateway Msg: ${statusMsg}`);

      if (data?.return === true || data?.status_code === 200) {
        return { success: true, routeUsed: selectedRoute };
      }

      // Emergency fallback for iOS: If low-cost OTP route is rejected (e.g. pending website verification/DLT),
      // use Fast2SMS Quick route ('q') so paid iOS users 100% receive their SMS verification code.
      console.warn(`[Fast2SMS] Low-cost route "${selectedRoute}" rejected by gateway (${statusMsg}). Triggering emergency Quick route ('q') fallback for iOS...`);

      const quickResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message: `Your Mito Reboot verification code is ${otp}. Valid for 10 minutes.`,
          numbers: cleaned
        })
      });

      const quickData: any = await quickResponse.json();
      const quickStatusMsg = quickData?.message?.[0] || quickData?.message || (quickData?.return ? 'Delivered' : 'Failed');
      console.log(`[Fast2SMS Quick Route Response] Status: ${quickData?.return ? 'SUCCESS' : 'FAILED'} | Gateway Msg: ${quickStatusMsg}`);

      if (quickData?.return === true || quickData?.status_code === 200) {
        return { success: true, routeUsed: 'q' };
      }

      return {
        success: false,
        routeUsed: 'q',
        reason: quickStatusMsg || statusMsg || 'DLT_TEMPLATE_REQUIRED'
      };
    } catch (err: any) {
      console.error('[Fast2SMS Exception]:', err?.message || err);
      return { success: false, reason: 'GATEWAY_NETWORK_ERROR' };
    }
  }

  /**
   * Sends an SMS to a normalized recipient number using Fast2SMS.
   * STRICT POLICY: Fast2SMS is exclusively reserved for rare emergency OTP login/signup fallback on iOS devices ONLY.
   * Android, Web, and all other non-iOS platforms or non-OTP SMS are strictly blocked.
   */
  public static async sendSMS(
    to: string,
    otpCode: string,
    platform?: string
  ): Promise<{ success: boolean; routeUsed?: string; reason?: string }> {
    try {
      const normalizedPlatform = (platform || '').toString().toLowerCase().trim();
      if (normalizedPlatform !== 'ios') {
        console.log(`[SMS Service] BLOCKED Fast2SMS delivery. Fast2SMS is strictly restricted to iOS devices only (current platform: "${platform || 'unknown'}").`);
        return { success: false, reason: 'BLOCKED_NON_IOS_PLATFORM' };
      }

      const normalizedTo = this.normalizePhoneNumber(to);
      if (!normalizedTo) {
        console.error('[SMS Service] Recipient phone number is empty or invalid.');
        return { success: false, reason: 'INVALID_RECIPIENT_PHONE' };
      }

      if (!otpCode) {
        console.log(`[SMS Service] BLOCKED non-OTP SMS. Fast2SMS is strictly restricted to iOS emergency OTP login fallback.`);
        return { success: false, reason: 'MISSING_OTP_CODE' };
      }

      const isMockMode = process.env.OTP_MOCK_MODE === 'true';
      if (isMockMode) {
        console.log(`[SMS MOCK SEND] Platform: ${normalizedPlatform} | Mock delivery active`);
        return { success: true, routeUsed: 'mock' };
      }

      if (process.env.ENABLE_FAST2SMS !== 'true') {
        console.log(`[SMS Service] Fast2SMS is explicitly DISABLED. SMS skipped.`);
        return { success: false, reason: 'FAST2SMS_DISABLED' };
      }

      // Send via Fast2SMS low-cost OTP route only
      const result = await this.sendFast2SmsOtp(normalizedTo, otpCode);
      if (result.success) {
        console.log(`[SMS Service] Fast2SMS low-cost OTP delivered to iOS device`);
      }
      return result;
    } catch (error: any) {
      console.error('[SMS Service] Error in sendSMS:', error?.message || error);
      return { success: false, reason: 'INTERNAL_ERROR' };
    }
  }
}
