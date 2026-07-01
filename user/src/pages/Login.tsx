import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, AlertCircle, Smartphone, ChevronDown, Search, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult, ApplicationVerifier } from 'firebase/auth';
import { auth, isNativePlatform } from '../config/firebase';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
    confirmationResult: ConfirmationResult | null;
    verificationId: string | null;
  }
}

interface LoginProps {
  resetToken?: string | null;
  onClearResetToken?: () => void;
}

interface Country {
  name: string;
  code: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Ireland', code: '+353', flag: '🇮🇪' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
  { name: 'Nepal', code: '+977', flag: '🇳🇵' },
];

/**
 * Detect user's country from browser timezone.
 */
function detectCountryFromTimezone(): Country {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lower = tz.toLowerCase();
    if (lower.includes('calcutta') || lower.includes('kolkata') || lower.includes('india')) return COUNTRIES[0];
    if (lower.includes('london')) return COUNTRIES.find(c => c.name === 'United Kingdom')!;
    if (lower.includes('dubai')) return COUNTRIES.find(c => c.name === 'United Arab Emirates')!;
    if (lower.includes('singapore')) return COUNTRIES.find(c => c.name === 'Singapore')!;
    if (lower.includes('sydney') || lower.includes('australia')) return COUNTRIES.find(c => c.name === 'Australia')!;
    if (lower.includes('america') || lower.includes('pacific') || lower.includes('eastern') || lower.includes('central') || lower.includes('mountain')) return COUNTRIES.find(c => c.name === 'United States')!;
    if (lower.includes('toronto') || lower.includes('vancouver') || lower.includes('canada')) return COUNTRIES.find(c => c.name === 'Canada')!;
    if (lower.includes('berlin') || lower.includes('germany')) return COUNTRIES.find(c => c.name === 'Germany')!;
    if (lower.includes('paris') || lower.includes('france')) return COUNTRIES.find(c => c.name === 'France')!;
    if (lower.includes('riyadh') || lower.includes('saudi')) return COUNTRIES.find(c => c.name === 'Saudi Arabia')!;
    if (lower.includes('tokyo') || lower.includes('japan')) return COUNTRIES.find(c => c.name === 'Japan')!;
    if (lower.includes('manila') || lower.includes('philippine')) return COUNTRIES.find(c => c.name === 'Philippines')!;
    if (lower.includes('bangkok') || lower.includes('thai')) return COUNTRIES.find(c => c.name === 'Thailand')!;
    if (lower.includes('sao_paulo') || lower.includes('brazil')) return COUNTRIES.find(c => c.name === 'Brazil')!;
    if (lower.includes('mexico_city') || lower.includes('mexico')) return COUNTRIES.find(c => c.name === 'Mexico')!;
    if (lower.includes('colombo') || lower.includes('sri_lanka')) return COUNTRIES.find(c => c.name === 'Sri Lanka')!;
    if (lower.includes('kathmandu') || lower.includes('nepal')) return COUNTRIES.find(c => c.name === 'Nepal')!;
    if (lower.includes('dhaka') || lower.includes('bangladesh')) return COUNTRIES.find(c => c.name === 'Bangladesh')!;
  } catch (_) { }
  return COUNTRIES[0]; // Default to India
}

function getRecaptchaVerifier(): ApplicationVerifier {
  // If we are on a native platform (iOS/Android) AND we have disabled verification for testing,
  // we bypass the real RecaptchaVerifier completely. This prevents 'auth/internal-error' 
  // caused by the Web SDK failing to initialize reCAPTCHA in capacitor://localhost.
  if (isNativePlatform && auth.settings.appVerificationDisabledForTesting) {
    return {
      type: 'recaptcha',
      verify: async () => 'mock-token',
      clear: () => { },
      _reset: () => { },
    } as unknown as ApplicationVerifier;
  }



  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
  }
  return window.recaptchaVerifier;
}

export const Login: React.FC<LoginProps> = () => {
  const { verifyOtpToken, error, clearError, isLoading: authLoading, branding } = useAuth();
  const { showToast } = useToast();

  const [screen, setScreen] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  // Phone input
  const [country, setCountry] = useState<Country>(() => detectCountryFromTimezone());
  const [mobileNumber, setMobileNumber] = useState('');
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // OTP input
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [timer, setTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountrySelector(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Set up Native Phone Auth Listeners
  useEffect(() => {
    if (!isNativePlatform || auth.settings.appVerificationDisabledForTesting) return;
    let codeSentListener: any;
    let verificationCompletedListener: any;
    let verificationFailedListener: any;

    const setupListeners = async () => {
      codeSentListener = await FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
        if ((window as any).nativePhoneAuthTimeout) {
          window.clearTimeout((window as any).nativePhoneAuthTimeout);
        }
        window.verificationId = event.verificationId;
        setScreen('otp');
        setTimer(60);
        showToast('Verification code sent natively', 'success');
        setLoading(false);
      });

      verificationCompletedListener = await FirebaseAuthentication.addListener('phoneVerificationCompleted', async () => {
        if ((window as any).nativePhoneAuthTimeout) {
          window.clearTimeout((window as any).nativePhoneAuthTimeout);
        }
        // Auto retrieved on Android
        try {
          const idTokenResult = await FirebaseAuthentication.getIdToken();
          const ok = await verifyOtpToken(idTokenResult.token);
          if (ok) showToast('Authenticated successfully! Welcome.', 'success');
        } catch (e) {
          console.error(e);
        }
      });

      verificationFailedListener = await FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
        if ((window as any).nativePhoneAuthTimeout) {
          window.clearTimeout((window as any).nativePhoneAuthTimeout);
        }
        setPhoneError(event.message || 'Verification failed natively');
        setLoading(false);
      });
    };

    setupListeners();

    return () => {
      if (codeSentListener) codeSentListener.remove();
      if (verificationCompletedListener) verificationCompletedListener.remove();
      if (verificationFailedListener) verificationFailedListener.remove();
    };
  }, [verifyOtpToken, showToast]);

  // Countdown timer for resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // WebOTP API — auto-read OTP from SMS on web (Chrome / Edge)
  useEffect(() => {
    if (screen !== 'otp' || !('OTPCredential' in window)) return;
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ['sms'] }, signal: ac.signal } as any)
      .then((otp: any) => {
        if (otp?.code) {
          setOtpCode(otp.code);
          showToast('OTP auto-filled from SMS!', 'success');
          submitOtp(otp.code);
        }
      })
      .catch(() => { });
    return () => ac.abort();
  }, [screen]);

  // Sanitize phone — strip leading 0, spaces, non-digits
  const sanitize = (num: string) => num.replace(/[^0-9]/g, '').replace(/^0+/, '');

  // Validate E.164
  const buildE164 = (num: string): string | null => {
    const clean = sanitize(num);
    if (!clean || clean.length < 4) return null;
    const e164 = `${country.code}${clean}`;
    return /^\+[1-9]\d{4,14}$/.test(e164) ? e164 : null;
  };

  // ─── SEND OTP ────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e?: any) => {
    e?.preventDefault?.();
    setPhoneError('');
    clearError();

    const e164 = buildE164(mobileNumber);
    if (!e164) {
      setPhoneError('Please enter a valid mobile number (digits only, no country code).');
      return;
    }

    setLoading(true);
    let nativeFlowStarted = false;

    try {
      console.log("isNativePlatform", isNativePlatform);
      if (isNativePlatform && !auth.settings.appVerificationDisabledForTesting) {
        showToast('Sending verification...', 'success');
        nativeFlowStarted = true;

        // Add a timeout fallback in case listeners never fire
        const timeoutId = window.setTimeout(() => {
          setLoading((currentLoading) => {
            if (currentLoading) {
              setPhoneError('Verification request timed out. Please check your network and try again.');
              return false; // clear loading state
            }
            return currentLoading;
          });
        }, 15000); // 15 seconds timeout
        (window as any).nativePhoneAuthTimeout = timeoutId;

        await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: e164 });
        // State updates are handled by the 'phoneCodeSent' listener
      } else {
        const verifier = getRecaptchaVerifier();
        const confirmation = await signInWithPhoneNumber(auth, e164, verifier);
        setConfirmationResult(confirmation);
        window.confirmationResult = confirmation;

        setScreen('otp');
        setTimer(60);
        showToast(`Verification code sent to ${e164}`, 'success');
        setTimeout(() => otpInputRef.current?.focus(), 100);
      }
    } catch (err: any) {
      console.error('sendOtp error:', err);
      // Provide friendly error messages
      if (err.code === 'auth/invalid-phone-number') {
        setPhoneError('Invalid phone number. Please double-check the number and country code.');
      } else if (err.code === 'auth/too-many-requests') {
        setPhoneError('Too many attempts. Please wait a few minutes before trying again.');
      } else if (err.code === 'auth/quota-exceeded') {
        setPhoneError('SMS quota exceeded. Please try again later.');
      } else {
        setPhoneError(err.message || 'Failed to send verification code. Please try again.');
      }
      nativeFlowStarted = false; // ensure loading is cleared on error
    } finally {
      if (!nativeFlowStarted) {
        setLoading(false);
      }
    }
  };

  // ─── VERIFY OTP ──────────────────────────────────────────────────────────────
  const submitOtp = async (code: string) => {
    if (code.length !== 6) {
      setOtpError('Enter the 6-digit code from your SMS.');
      return;
    }
    if (!isNativePlatform && !confirmationResult) {
      setOtpError('Verification session expired. Please go back and request a new code.');
      return;
    }

    setOtpError('');
    setLoading(true);
    clearError();

    try {
      if (isNativePlatform && !auth.settings.appVerificationDisabledForTesting) {
        const verificationId = window.verificationId;
        if (!verificationId) throw new Error('Verification ID missing. Please request a new code.');

        await FirebaseAuthentication.confirmVerificationCode({
          verificationId,
          verificationCode: code
        });

        const idTokenResult = await FirebaseAuthentication.getIdToken();
        const ok = await verifyOtpToken(idTokenResult.token);
        if (ok) {
          showToast('Authenticated successfully! Welcome.', 'success');
        }
      } else {
        const result = await confirmationResult.confirm(code);
        const idToken = await result.user.getIdToken();

        const ok = await verifyOtpToken(idToken);
        if (ok) {
          showToast('Authenticated successfully! Welcome.', 'success');
        }
      }
    } catch (err: any) {
      console.error('verifyOtp error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setOtpError('Incorrect code. Please check the SMS and try again.');
      } else if (err.code === 'auth/code-expired') {
        setOtpError('Code expired. Please go back and request a new code.');
      } else {
        setOtpError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e?: any) => {
    e?.preventDefault?.();
    submitOtp(otpCode);
  };

  // ─── RESEND OTP ───────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (timer > 0) return;
    setOtpCode('');
    setOtpError('');
    setScreen('phone');
    // Re-trigger send after brief delay
    setTimeout(() => {
      handleSendOtp({ preventDefault: () => { } } as React.FormEvent);
    }, 100);
  };

  const handleBackToPhone = () => {
    setScreen('phone');
    setOtpCode('');
    setOtpError('');
    setConfirmationResult(null);
    window.confirmationResult = null;
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.includes(searchQuery)
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8 relative">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary-light text-primary rounded-2xl mb-3 shadow-soft">
            {branding.appLogoUrl ? (
              <img src={branding.appLogoUrl} alt="Logo" className="h-8 w-auto object-contain rounded-md" />
            ) : (
              <Heart className="h-8 w-8 fill-primary text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{branding.appName}</h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">{branding.appTagline}</p>
        </div>

        {/* Global Auth Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-danger rounded-2xl flex items-start space-x-3 text-sm font-medium border border-red-100">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              <button onClick={clearError} className="block mt-1 underline hover:text-red-700 text-xs">Dismiss</button>
            </div>
          </div>
        )}

        {screen === 'phone' ? (
          /* ── SCREEN 1: Phone Number ─────────────────────────────────────── */
          <form className="space-y-6" noValidate>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Number</label>

              <div className="flex space-x-2 relative" ref={dropdownRef}>
                {/* Country Code Button */}
                <button
                  type="button"
                  onClick={() => setShowCountrySelector(!showCountrySelector)}
                  className="flex items-center space-x-1.5 px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all font-bold text-slate-800 text-sm shrink-0"
                >
                  <span>{country.flag}</span>
                  <span>{country.code}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>

                {/* Country Dropdown */}
                {showCountrySelector && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden py-2 animate-scaleIn">
                    <div className="px-2.5 pb-2 border-b border-slate-100 flex items-center space-x-1.5">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search country / code..."
                        className="w-full text-xs py-1 focus:outline-none text-slate-700"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto pt-1 no-scrollbar">
                      {filteredCountries.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setCountry(c); setShowCountrySelector(false); setSearchQuery(''); }}
                          className="w-full px-3 py-2 text-left hover:bg-primary-light hover:text-primary text-xs font-bold text-slate-700 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                          </div>
                          <span className="text-slate-400">{c.code}</span>
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div className="px-3 py-4 text-center text-xs text-slate-400">No country found</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone Input */}
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    required
                    value={mobileNumber}
                    onChange={(e) => { setMobileNumber(e.target.value.replace(/[^0-9]/g, '')); setPhoneError(''); }}
                    placeholder="Enter mobile number"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 placeholder:text-slate-400 font-bold tracking-wide ${phoneError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  />
                </div>
              </div>

              {phoneError && (
                <p className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {phoneError}
                </p>
              )}

              <p className="mt-2 text-[11px] text-slate-400 font-medium">
                Enter digits only — no country code prefix. A verification SMS will be sent.
              </p>
            </div>

            <button
              id="send-otp-btn"
              type="button"
              onClick={handleSendOtp}
              disabled={loading || authLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-primary-light transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading || authLoading ? (
                <><RefreshCw className="h-5 w-5 animate-spin mr-2" />Sending Code...</>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        ) : (
          /* ── SCREEN 2: OTP Verification ─────────────────────────────────── */
          <form className="space-y-6 animate-fadeIn" noValidate>
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="flex items-center text-xs text-primary font-bold hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Change Number
                </button>
                <span className="text-xs text-slate-500 font-semibold">
                  Sent to {country.code} {mobileNumber}
                </span>
              </div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">Verification Code</label>

              <input
                id="otp-input"
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => { setOtpCode(e.target.value.replace(/[^0-9]/g, '')); setOtpError(''); }}
                placeholder="• • • • • •"
                autoComplete="one-time-code"
                className={`w-full py-4 text-center rounded-2xl border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 placeholder:text-slate-300 font-extrabold text-2xl tracking-widest ${otpError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                autoFocus
              />

              {otpError && (
                <p className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {otpError}
                </p>
              )}

              <p className="text-[11px] text-slate-400 mt-2 font-medium text-center">
                Enter the 6-digit code delivered via SMS.
              </p>
            </div>

            <button
              id="verify-otp-btn"
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || authLoading || otpCode.length < 6}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-primary-light transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading || authLoading ? (
                <><RefreshCw className="h-5 w-5 animate-spin mr-2" />Verifying...</>
              ) : (
                'Verify & Sign In'
              )}
            </button>

            <div className="text-center">
              {timer > 0 ? (
                <span className="text-xs text-slate-400 font-semibold">
                  Resend code in {timer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Resend verification code
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Hidden anchor required by Firebase invisible reCAPTCHA */}
      <div id="recaptcha-container" style={{ display: 'none' }} />
    </div>
  );
};
