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
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.error('[Fast2SMS] Missing FAST2SMS_API_KEY environment variable.');
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
      console.log('[Fast2SMS OTP Route Response (₹0.25)]:', data);

      if (data.return === true || data.status_code === 200) {
        return true;
      }

      // 2. Fallback to Quick SMS route if OTP route template/KYC is pending (Cost: ₹5 per SMS)
      console.log('[Fast2SMS] OTP route fallback to Quick route...');
      response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
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

      data = (await response.json()) as any;
      console.log('[Fast2SMS Quick Route Response]:', data);
      return data.return === true || data.status_code === 200;
    } catch (err) {
      console.error('[Fast2SMS Exception]:', err);
      return false;
    }
  }

  /**
   * Sends an SMS to a normalized recipient number using Fast2SMS.
   */
  public static async sendSMS(to: string, message: string, otpCode?: string): Promise<boolean> {
    try {
      const normalizedTo = this.normalizePhoneNumber(to);
      if (!normalizedTo) {
        console.error('[SMS Service] Recipient phone number is empty or invalid.');
        return false;
      }

      const isMockMode = process.env.OTP_MOCK_MODE === 'true';
      if (isMockMode) {
        console.log(`\n--- [SMS MOCK SEND] ---`);
        console.log(`To      : ${normalizedTo}`);
        console.log(`Message : ${message}`);
        console.log(`Reason  : OTP_MOCK_MODE is enabled`);
        console.log(`------------------------\n`);
        return true;
      }

      // Send via Fast2SMS
      const code = otpCode || message.match(/\b\d{6}\b/)?.[0] || '';
      if (code) {
        const sent = await this.sendFast2SmsOtp(normalizedTo, code);
        if (sent) {
          console.log(`[SMS Service] Fast2SMS delivered to ${normalizedTo}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('[SMS Service] Error sending SMS:', error);
      return false;
    }
  }
}
