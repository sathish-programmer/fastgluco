import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { AlertCircle, Smartphone, ChevronDown, Search, ArrowLeft, RefreshCw, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { auth, isNativePlatform } from '../config/firebase';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
    confirmationResult: ConfirmationResult | null;
    verificationId: string | null;
  }
}

function getRecaptchaVerifier(): RecaptchaVerifier {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (_) { }
    window.recaptchaVerifier = null;
  }
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
  return window.recaptchaVerifier;
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


export const Login: React.FC<LoginProps> = ({ resetToken: _resetToken, onClearResetToken: _onClearResetToken }) => {
  const { sendOtp, verifyOtp, loginWithFirebaseToken, error, clearError, isLoading: authLoading, branding, apiUrl } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [screen, setScreen] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  // Phone input
  const [country, setCountry] = useState<Country>(() => detectCountryFromTimezone());
  const [mobileNumber, setMobileNumber] = useState('');
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Email input
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // OTP input
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [timer, setTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'sms' | 'email' | 'sms_and_email' | 'mock'>('sms_and_email');
  const [_otpProvider, setOtpProvider] = useState<'FIREBASE' | 'FAST2SMS' | null>(null);
  const [isAutoVerifying, setIsAutoVerifying] = useState<boolean>(false);

  const mobileNumberRef = useRef(mobileNumber);
  const emailRef = useRef(email);
  const screenRef = useRef<'phone' | 'otp'>(screen);
  const otpProviderRef = useRef<'FIREBASE' | 'FAST2SMS' | null>(null);
  const codeSentRef = useRef<boolean>(false);

  useEffect(() => { mobileNumberRef.current = mobileNumber; }, [mobileNumber]);
  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Native Android Firebase Phone Auth event listeners
  useEffect(() => {
    if (!isNativePlatform) return;

    let isMounted = true;

    const codeSentSub = FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
      console.log('[Native Firebase] phoneCodeSent event received, verificationId:', event.verificationId);
      if (!isMounted) return;
      window.verificationId = event.verificationId;
      codeSentRef.current = true;
      otpProviderRef.current = 'FIREBASE';
      setOtpProvider('FIREBASE');
      setDeliveryMethod('sms');
      setScreen('otp');
      setTimer(60);
      setLoading(false);
      showToast(`Verification code sent to ${mobileNumberRef.current}`, 'success');
      setTimeout(() => otpInputRef.current?.focus(), 100);
    });

    const completedSub = FirebaseAuthentication.addListener('phoneVerificationCompleted', async (event) => {
      console.log('[Native Firebase] phoneVerificationCompleted automatically!', event);
      if (!isMounted) return;
      setIsAutoVerifying(true);
      setLoading(true);
      try {
        // Give the user a moment to see the SMS auto-detected animation
        await new Promise(r => setTimeout(r, 700));
        const idTokenRes = await FirebaseAuthentication.getIdToken();
        const e164 = buildE164(mobileNumberRef.current);
        if (idTokenRes.token && e164) {
          const res = await loginWithFirebaseToken(idTokenRes.token, emailRef.current, e164);
          if (res) {
            showToast('Authenticated successfully! Welcome.', 'success');
          }
        }
      } catch (err: any) {
        console.error('[Native Firebase] Auto-verification error:', err);
        if (isMounted) setIsAutoVerifying(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    const failedSub = FirebaseAuthentication.addListener('phoneVerificationFailed', async (event) => {
      const errorMsg = event.message || 'Firebase phone verification failed.';
      console.error('[OTP Priority] Native Firebase phoneVerificationFailed:', errorMsg);
      if (!isMounted) return;

      // DO NOT fallback to Fast2SMS if Firebase has already sent an OTP
      if (codeSentRef.current || screenRef.current === 'otp') {
        console.warn('[OTP Priority] Code was already sent by Firebase. Ignoring initiation fallback to avoid duplicate SMS.');
        return;
      }

      showToast(`Firebase Auth Error: ${errorMsg}`, 'error');

      const curPhone = mobileNumberRef.current;
      const curEmail = emailRef.current;
      const e164 = buildE164(curPhone);
      if (e164 && curEmail) {
        console.log('[OTP Priority] Firebase initiation failed before send. Attempting fallback...');
        const res = await sendOtp(e164, curEmail, true);
        if (!isMounted) return;
        setLoading(false);
        if (res.success) {
          codeSentRef.current = true;
          otpProviderRef.current = 'FAST2SMS';
          setOtpProvider('FAST2SMS');
          setDeliveryMethod('sms_and_email');
          setScreen('otp');
          setTimer(60);
          showToast('Verification code sent via Email.', 'info');
          setTimeout(() => otpInputRef.current?.focus(), 100);
        } else {
          setPhoneError(`Firebase failed: ${errorMsg}. Backup: ${res.message || 'SMS service unavailable.'}`);
        }
      } else {
        setLoading(false);
        setPhoneError(errorMsg);
      }
    });

    return () => {
      isMounted = false;
      codeSentSub.then(h => h.remove()).catch(() => { });
      completedSub.then(h => h.remove()).catch(() => { });
      failedSub.then(h => h.remove()).catch(() => { });
    };
  }, []);

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
      .then(async (otp: any) => {
        if (otp?.code) {
          setIsAutoVerifying(true);
          setOtpCode(otp.code);
          showToast('OTP auto-filled from SMS!', 'success');
          await new Promise(r => setTimeout(r, 600));
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
    setEmailError('');
    clearError();

    const e164 = buildE164(mobileNumber);
    if (!e164) {
      setPhoneError(t('auth.validMobilePrompt', 'Please enter a valid mobile number (digits only, no country code).'));
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('auth.validEmailPrompt', 'Please enter a valid email address.'));
      return;
    }

    if (!navigator.onLine) {
      setPhoneError(t('network.offlineTitle', 'No Internet Connection') + '. ' + t('network.offlineDesc', 'Please turn on your Wi-Fi or mobile data to continue.'));
      return;
    }

    codeSentRef.current = false;
    otpProviderRef.current = null;
    setOtpProvider(null);
    setIsAutoVerifying(false);
    setLoading(true);

    // Fallback helper to dispatch OTP via Fast2SMS
    const dispatchFast2SmsFallback = async (reason: string) => {
      if (codeSentRef.current) {
        console.warn('[OTP Priority] Code was already sent by Firebase. Skipping Fast2SMS fallback.');
        return;
      }
      console.warn(`[OTP Priority] Firebase initiation failed (${reason}). Falling back...`);
      showToast(`Firebase Error: ${reason}`, 'error');
      const res = await sendOtp(e164, email, true);
      setLoading(false);
      if (res.success) {
        codeSentRef.current = true;
        otpProviderRef.current = 'FAST2SMS';
        setOtpProvider('FAST2SMS');
        setDeliveryMethod('sms_and_email');
        setScreen('otp');
        setTimer(60);
        showToast('Verification code sent via Email.', 'info');
        setTimeout(() => otpInputRef.current?.focus(), 100);
      } else {
        setPhoneError(`Firebase failed: ${reason}. Backup: ${res.message || 'SMS service unavailable.'}`);
      }
    };

    // 1. Android Native Firebase Phone Auth (Primary)
    if (isNativePlatform) {
      try {
        console.log('[OTP Priority] Attempting Primary: Native Firebase Phone Auth for:', e164);
        otpProviderRef.current = 'FIREBASE';
        await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: e164 });
        // phoneCodeSent listener will transition screen to 'otp' and set codeSentRef.current = true
      } catch (nativeErr: any) {
        console.warn('[OTP Priority] Native Firebase Phone Auth initiation error:', nativeErr);
        await dispatchFast2SmsFallback(nativeErr?.message || 'Native Firebase error');
      }
      return;
    }

    // 2. Web Firebase Phone Auth (Primary)
    try {
      console.log('[OTP Priority] Attempting Primary: Web Firebase Phone Auth for:', e164);
      const verifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, e164, verifier);

      codeSentRef.current = true;
      otpProviderRef.current = 'FIREBASE';
      setOtpProvider('FIREBASE');
      setConfirmationResult(confirmation);
      window.confirmationResult = confirmation;
      setDeliveryMethod('sms');
      setScreen('otp');
      setTimer(60);
      showToast(t('auth.codeSentToMobile', { mobileNumber: e164 }, `Verification code sent to ${e164}`), 'success');
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (firebaseErr: any) {
      console.warn('[OTP Priority] Web Firebase initiation error:', firebaseErr);
      setConfirmationResult(null);
      window.confirmationResult = null;
      await dispatchFast2SmsFallback(firebaseErr?.message || 'Web Firebase error');
    } finally {
      setLoading(false);
    }
  };

  // ─── VERIFY OTP ──────────────────────────────────────────────────────────────
  const submitOtp = async (code: string) => {
    if (code.length !== 6) {
      setOtpError(t('auth.enter6DigitsFromSms', 'Enter the 6-digit code from your SMS or Email.'));
      return;
    }

    setOtpError('');
    setLoading(true);
    clearError();

    try {
      const e164 = buildE164(mobileNumber);
      if (!e164) throw new Error("Invalid mobile number.");

      const currentProvider = otpProviderRef.current || (window.verificationId || confirmationResult ? 'FIREBASE' : 'FAST2SMS');

      if (currentProvider === 'FIREBASE') {
        // --- 1. FIREBASE AUTHENTICATION FLOW (PRIMARY) ---
        let idToken: string | null = null;

        if (isNativePlatform && window.verificationId) {
          try {
            console.log('[Auth] Verifying Firebase OTP with verificationId:', window.verificationId);
            await FirebaseAuthentication.confirmVerificationCode({
              verificationId: window.verificationId,
              verificationCode: code
            });
            const idTokenRes = await FirebaseAuthentication.getIdToken();
            idToken = idTokenRes.token || null;
          } catch (fbErr: any) {
            console.error('[Auth] Native Firebase confirmation failed:', fbErr);
            // DO NOT fallback to Fast2SMS for an incorrect or expired Firebase OTP!
            setOtpError(t('auth.invalidOtp', 'Invalid or expired Firebase verification code. Please check your SMS and try again.'));
            return;
          }
        } else if (confirmationResult) {
          try {
            console.log('[Auth] Verifying Web Firebase OTP...');
            const userCredential = await confirmationResult.confirm(code);
            idToken = await userCredential.user.getIdToken();
          } catch (fbErr: any) {
            console.error('[Auth] Web Firebase confirmation failed:', fbErr);
            // DO NOT fallback to Fast2SMS for an incorrect or expired Firebase OTP!
            setOtpError(t('auth.invalidOtp', 'Invalid or expired Firebase verification code. Please check your SMS and try again.'));
            return;
          }
        }

        if (!idToken) {
          setOtpError('Unable to retrieve Firebase verification token. Please request a new OTP.');
          return;
        }

        // Post Firebase ID token to backend for cryptographic verification & session issuance
        console.log('[Auth] Submitting Firebase ID token to /api/auth/firebase-login...');
        const res = await loginWithFirebaseToken(idToken, email, e164);
        if (res) {
          showToast(t('auth.authSuccessWelcome', 'Authenticated successfully! Welcome.'), 'success');
        } else {
          setOtpError('Authentication failed with server. Please try again.');
        }

      } else {
        // --- 2. FAST2SMS / BACKEND OTP FLOW (FALLBACK) ---
        console.log('[Auth] Submitting Fast2SMS OTP to /api/auth/verify-otp...');
        const ok = await verifyOtp(e164, code, email);
        if (ok) {
          showToast(t('auth.authSuccessWelcome', 'Authenticated successfully! Welcome.'), 'success');
        } else {
          setOtpError(t('auth.invalidOtp', 'Invalid or expired verification code. Please check your SMS or Email and try again.'));
        }
      }
    } catch (err: any) {
      console.error('verifyOtp error:', err);
      setOtpError(err.message || 'Verification failed. Please try again.');
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



  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.includes(searchQuery)
  );

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-blue-50/30 via-white to-white flex flex-col justify-between px-6 py-8 relative">
      {/* Top Header Language Selector */}
      <div className="absolute top-[max(1rem,calc(env(safe-area-inset-top,0px)+12px))] right-4 sm:right-6 z-30">
        <LanguageSelector variant="dropdown" />
      </div>

      <div className="w-full max-w-sm mx-auto my-auto py-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          {/* Emblem Tile */}
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white p-2 shadow-sm border border-blue-100/80 mb-3 flex items-center justify-center">
            {branding.appLogoUrl ? (
              <img
                src={branding.appLogoUrl.startsWith('http') ? branding.appLogoUrl : `${apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl}${branding.appLogoUrl.startsWith('/') ? '' : '/'}${branding.appLogoUrl}`}
                alt={t('logoAlt')}
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <img
                src="/icon.png"
                alt={t('logoAlt')}
                className="w-full h-full object-contain rounded-xl"
              />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-start justify-center">
            <span>{branding.appName ? branding.appName.replace(/_/g, ' ') : 'Mito Reboot'}</span>
            <sup className="text-[10px] font-bold text-primary ml-1 -top-1.5 relative select-none leading-none tracking-tight">
              TM
            </sup>
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-xs sm:text-sm">
            {branding.appTagline || 'Preventive Lifestyle App'}
          </p>
        </div>

        {/* Global Auth Error */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 text-danger rounded-2xl flex items-start space-x-3 text-xs font-medium border border-red-100 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-danger" />
            <div className="flex-1">
              <span>{error}</span>
              <button onClick={clearError} className="block mt-1 underline hover:text-red-700 text-[11px] cursor-pointer">{t('auth.dismiss', 'Dismiss')}</button>
            </div>
          </div>
        )}

        {screen === 'phone' ? (
          /* ── SCREEN 1: Phone Number & Email ───────────────────────────── */
          <form className="space-y-4" noValidate onSubmit={handleSendOtp}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{t('auth.mobileNumber', 'Mobile Number')}</label>

              <div className="flex space-x-2 relative" ref={dropdownRef}>
                {/* Country Code Button */}
                <button
                  type="button"
                  onClick={() => setShowCountrySelector(!showCountrySelector)}
                  className="flex items-center space-x-1.5 px-3 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all font-bold text-slate-800 text-xs sm:text-sm shrink-0 cursor-pointer"
                >
                  <span>{country.flag}</span>
                  <span>{country.code}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {/* Country Dropdown */}
                {showCountrySelector && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-150 rounded-2xl shadow-xl z-20 overflow-hidden py-2 animate-scaleIn">
                    <div className="px-2.5 pb-2 border-b border-slate-100 flex items-center space-x-1.5">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('searchCountryCodePlaceholder')}
                        className="w-full text-xs py-1 focus:outline-none text-slate-700 font-medium"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto pt-1 no-scrollbar">
                      {filteredCountries.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setCountry(c); setShowCountrySelector(false); setSearchQuery(''); }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 hover:text-primary text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                          </div>
                          <span className="text-slate-400 font-bold">{c.code}</span>
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div className="px-3 py-4 text-center text-xs text-slate-400">{t('auth.noCountryFound', 'No country found')}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone Input */}
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Smartphone className="h-4 w-4" />
                  </span>
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    required
                    value={mobileNumber}
                    onChange={(e) => { setMobileNumber(e.target.value.replace(/[^0-9]/g, '')); setPhoneError(''); }}
                    placeholder={t('enterMobileNumberPlaceholder')}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 placeholder:text-slate-400 font-bold text-sm tracking-wide transition-all ${phoneError ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                  />
                </div>
              </div>

              {phoneError && (
                <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {phoneError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{t('auth.emailAddress', 'Email Address')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value.trim()); setEmailError(''); }}
                  placeholder={t('enterYourEmailPlaceholder')}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 placeholder:text-slate-400 font-bold text-sm tracking-wide transition-all ${emailError ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                />
              </div>
              {emailError && (
                <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {emailError}
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Used to deliver health reports and secure appointment confirmations.
              </p>
            </div>

            <button
              id="send-otp-btn"
              type="submit"
              disabled={loading || authLoading}
              className="w-full mt-2 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              {loading || authLoading ? (
                <><RefreshCw className="h-4 w-4 animate-spin mr-2" />{t('common.loading')}</>
              ) : (
                t('auth.getOtp')
              )}
            </button>

            {/* Health Security Trust Badges */}
            <div className="pt-3 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Your Health Data is Safe & Never Shared</span>
            </div>
          </form>
        ) : (
          /* ── SCREEN 2: OTP Verification ─────────────────────────────────── */
          <form className="space-y-4 animate-fadeIn" noValidate onSubmit={handleVerifyOtp}>
            <div className="mb-4 animate-slideUp">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setScreen('phone');
                    setOtpCode('');
                    setTimer(0);
                    setIsAutoVerifying(false);
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>{t('common.back', 'Edit Details')}</span>
                </button>

                <span className="text-[11px] font-bold text-primary bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Step 2 of 2
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{t('auth.verificationCode', 'Verification Code')}</h2>

              {/* Destination Pill */}
              <div className="mt-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    {deliveryMethod === 'sms' ? 'Sent code via SMS' : 'Sent verification code'}
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 tracking-wide mt-0.5">{mobileNumber}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>

            {/* Live Auto-Reading SMS Animation Banner */}
            {isAutoVerifying ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center space-x-3 text-slate-800 shadow-sm animate-pulse">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs font-bold text-slate-900">SMS Detected Automatically!</p>
                  <p className="text-[11px] text-slate-600 font-medium">Verifying code and logging you in...</p>
                </div>
                <RefreshCw className="h-4 w-4 text-primary animate-spin shrink-0" />
              </div>
            ) : timer > 0 ? (
              <div className="p-3 bg-blue-50/70 border border-blue-150 rounded-2xl flex items-center space-x-3 text-slate-700">
                <div className="relative flex items-center justify-center h-8 w-8 rounded-xl bg-primary/10 shrink-0">
                  <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-primary/30 opacity-75"></span>
                  <Smartphone className="h-4 w-4 text-primary relative z-10" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center space-x-1.5">
                    <p className="text-xs font-bold text-slate-800">Auto-reading SMS</p>
                    <span className="flex space-x-1 items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Waiting for incoming SMS to verify automatically...</p>
                </div>
              </div>
            ) : null}

            <div>
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
                className={`w-full py-3.5 text-center rounded-2xl border focus:outline-none focus:ring-2 focus:border-transparent font-extrabold text-2xl tracking-widest transition-all ${isAutoVerifying
                  ? 'border-primary bg-blue-50/40 text-primary ring-2 ring-primary/20'
                  : otpError
                    ? 'border-red-400 bg-red-50 text-slate-800 focus:ring-red-400'
                    : 'border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 focus:ring-primary/20 focus:border-primary'
                  }`}
                autoFocus
              />

              {otpError && (
                <p className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {otpError}
                </p>
              )}

              <p className="text-[11px] text-slate-400 mt-2 font-medium text-center">
                {deliveryMethod === 'sms'
                  ? t('auth.enterCodeDeliveredSms', 'Enter the 6-digit code delivered via SMS.')
                  : t('auth.enterCodeDeliveredTo', 'Enter the 6-digit code delivered to your Email or SMS.')}
              </p>
            </div>

            <button
              id="verify-otp-btn"
              type="submit"
              disabled={loading || authLoading || otpCode.length < 6 || isAutoVerifying}
              className="w-full font-bold py-3.5 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer bg-primary hover:bg-primary-dark text-white shadow-primary/25"
            >
              {isAutoVerifying ? (
                <><CheckCircle2 className="h-4 w-4 mr-2 animate-pulse text-white" /> Auto-Verifying SMS...</>
              ) : loading || authLoading ? (
                <><RefreshCw className="h-4 w-4 animate-spin mr-2" />{t('auth.verifying', 'Verifying...')}</>
              ) : (
                t('auth.verifyAndSignIn', 'Verify & Sign In')
              )}
            </button>

            <div className="text-center pt-2">
              {timer > 0 ? (
                <span className="text-xs text-slate-400 font-semibold bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  {t('auth.resendCodeIn', { timer }, `Resend code in ${timer}s`)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  {t('auth.resendVerificationCode', 'Resend verification code')}
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
};
