import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

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
   * Sends an SMS to a normalized recipient number.
   * Automatically prints mock logs if credentials are not configured or OTP_MOCK_MODE=true.
   */
  public static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const normalizedTo = this.normalizePhoneNumber(to);
      if (!normalizedTo) {
        console.error('[SMS Service] Recipient phone number is empty or invalid.');
        return false;
      }

      const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
      const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
      const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
      const isMockMode = process.env.OTP_MOCK_MODE === 'true';

      if (isMockMode || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        console.log(`\n--- [SMS MOCK SEND] ---`);
        console.log(`To      : ${normalizedTo}`);
        console.log(`Message : ${message}`);
        console.log(`Reason  : ${isMockMode ? 'OTP_MOCK_MODE is enabled' : 'Twilio environment credentials missing'}`);
        console.log(`------------------------\n`);
        return true;
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const params = new URLSearchParams();
      params.append('To', normalizedTo);
      params.append('From', TWILIO_PHONE_NUMBER);
      params.append('Body', message);

      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const twilioData = await twilioResponse.json();
      if (!twilioResponse.ok) {
        console.error(`[SMS Service] Twilio API Error (${twilioResponse.status}):`, twilioData);
        return false;
      }

      console.log(`[SMS Service] SMS successfully sent to ${normalizedTo}`);
      return true;
    } catch (error) {
      console.error('[SMS Service] Error sending SMS:', error);
      return false;
    }
  }
}
