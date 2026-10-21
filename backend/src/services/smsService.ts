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
   */
  public static async sendFast2SmsOtp(phoneNumber: string, otp: string): Promise<boolean> {
    if (process.env.ENABLE_FAST2SMS !== 'true') {
      console.log('[Fast2SMS] Fast2SMS is explicitly DISABLED on this server (ENABLE_FAST2SMS is not true). Skipping SMS delivery.');
      return false;
    }

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey || apiKey === 'disabled') {
      console.log('[Fast2SMS] FAST2SMS_API_KEY is missing or disabled. Skipping SMS delivery.');
      return false;
    }

    const cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, '').slice(-10);
    if (cleaned.length !== 10) {
      console.error('[Fast2SMS] Invalid 10-digit phone number:', phoneNumber);
      return false;
    }

    try {
      // 1. Try OTP route first (Cost: ₹0.25 per SMS / 25 paise)
      let response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: cleaned
        })
      });

      let data: any = await response.json();
      return data.return === true || data.status_code === 200;
    } catch (err) {
      console.error('[Fast2SMS Exception]:', err);
      return false;
    }
  }

  /**
   * Sends an SMS to a normalized recipient number using Fast2SMS.
   * STRICT POLICY: Fast2SMS is exclusively reserved for rare emergency OTP login/signup fallback when Firebase fails.
   * All non-OTP SMS notifications (daily check-ins, appointments, orders, alerts) are strictly blocked to prevent credit deductions.
   */
  public static async sendSMS(to: string, message: string, otpCode?: string): Promise<boolean> {
    try {
      const normalizedTo = this.normalizePhoneNumber(to);
      if (!normalizedTo) {
        console.error('[SMS Service] Recipient phone number is empty or invalid.');
        return false;
      }

      // Check if this is an OTP message
      const code = otpCode || message.match(/\b\d{6}\b/)?.[0] || '';
      if (!code) {
        console.log(`[SMS Service] BLOCKED non-OTP SMS to ${normalizedTo}. Fast2SMS is strictly restricted to emergency OTP login fallback.`);
        return false;
      }

      const isMockMode = process.env.OTP_MOCK_MODE === 'true';
      if (isMockMode) {
        console.log(`\n--- [SMS MOCK SEND] ---`);
        console.log(`To      : ${normalizedTo}`);
        console.log(`Code    : ${code}`);
        console.log(`Reason  : OTP_MOCK_MODE is enabled`);
        console.log(`------------------------\n`);
        return true;
      }

      if (process.env.ENABLE_FAST2SMS !== 'true') {
        console.log(`[SMS Service] Fast2SMS is explicitly DISABLED. SMS to ${normalizedTo} skipped.`);
        return false;
      }

      // Send via Fast2SMS OTP route
      const sent = await this.sendFast2SmsOtp(normalizedTo, code);
      if (sent) {
        console.log(`[SMS Service] Fast2SMS OTP delivered to ${normalizedTo}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[SMS Service] Error sending SMS OTP:', error);
      return false;
    }
  }
}
