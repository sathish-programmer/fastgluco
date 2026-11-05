import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { AlertCircle, Smartphone, ChevronDown, Search, ArrowLeft, RefreshCw, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Capacitor } from '@capacitor/core';
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
  const container = document.getElementById('recaptcha-container');
  if (container) {
    container.innerHTML = '';
  }
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
  return window.recaptchaVerifier;
}

function cleanErrorMessage(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const lower = raw.toLowerCase();
  if (lower.includes('recaptcha') || lower.includes('cloud.google.com') || lower.includes('load failed') || lower.includes('internal-error') || lower.includes('firebase')) {
    return fallback;
  }
  return raw;
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
  const [accountDeletedInfo, setAccountDeletedInfo] = useState<{ isDeleted: boolean; daysLeft: number; message: string } | null>(null);

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
  const [isInputFocused, setIsInputFocused] = useState<boolean>(true);
  const [autoFillStep, setAutoFillStep] = useState<number>(0);

  const mobileNumberRef = useRef(mobileNumber);
  const emailRef = useRef(email);
  const screenRef = useRef<'phone' | 'otp'>(screen);
  const otpProviderRef = useRef<'FIREBASE' | 'FAST2SMS' | null>(null);
  const codeSentRef = useRef<boolean>(false);
  const fallbackTriggeredRef = useRef<boolean>(false);
  const userInitiatedSendRef = useRef<boolean>(false);
  const iosTimeoutTimerRef = useRef<any>(null);

  useEffect(() => { mobileNumberRef.current = mobileNumber; }, [mobileNumber]);
  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Native Mobile (iOS & Android) Firebase Phone Auth event listeners
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isMounted = true;

    const codeSentSub = FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
      console.log('[Native Firebase] phoneCodeSent event received, verificationId:', event.verificationId);
      if (iosTimeoutTimerRef.current) {
        clearTimeout(iosTimeoutTimerRef.current);
        iosTimeoutTimerRef.current = null;
      }
      if (!isMounted) return;
      if (fallbackTriggeredRef.current) {
        console.warn('[Native Firebase] Ignoring late phoneCodeSent event because fallback OTP was already dispatched.');
        return;
      }
      window.verificationId = event.verificationId;
      codeSentRef.current = true;
      userInitiatedSendRef.current = false;
      otpProviderRef.current = 'FIREBASE';
      setOtpProvider('FIREBASE');
      setDeliveryMethod('sms_and_email');
      setScreen('otp');
      setTimer(60);
      setLoading(false);
      showToast(t('auth.codeSentToBoth', 'Verification code sent to your Mobile & Email'), 'success');
      setTimeout(() => otpInputRef.current?.focus(), 100);
    });

    const completedSub = FirebaseAuthentication.addListener('phoneVerificationCompleted', async (event: any) => {
      console.log('[Native Firebase] phoneVerificationCompleted automatically!', event);
      if (!isMounted) return;
      setIsAutoVerifying(true);
      setLoading(true);
      userInitiatedSendRef.current = false;
      try {
        if (event?.code) {
          const code = String(event.code).replace(/[^0-9]/g, '').slice(0, 6);
          for (let i = 1; i <= code.length; i++) {
            await new Promise(r => setTimeout(r, 70));
            setOtpCode(code.slice(0, i));
          }
        }
        // Give the user a moment to see the SMS auto-detected animation
        await new Promise(r => setTimeout(r, 900));
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
      if (iosTimeoutTimerRef.current) {
        clearTimeout(iosTimeoutTimerRef.current);
        iosTimeoutTimerRef.current = null;
      }
      const errorMsg = event.message || 'Firebase phone verification failed.';
      const failureDetail = (event as any).code ? `${(event as any).code}: ${errorMsg}` : errorMsg;
      console.warn('[Firebase Auth] Native Firebase phoneVerificationFailed:', failureDetail);
      if (!isMounted) return;

      // CRITICAL GUARD 1: Only handle if user actually initiated send OTP
      if (!userInitiatedSendRef.current) {
        console.warn('[Firebase Auth] Ignoring unsolicited phoneVerificationFailed event (user did not trigger send).');
        return;
      }

      // CRITICAL GUARD 2: Prevent duplicate fallback if code was already sent or fallback already running
      if (codeSentRef.current || screenRef.current === 'otp' || fallbackTriggeredRef.current) {
        console.warn('[Firebase Auth] Code was already sent or fallback already dispatched. Skipping duplicate.');
        return;
      }
      fallbackTriggeredRef.current = true;

      // Seamless fallback to Backend OTP (Fast2SMS on iOS, Email on Android)
      const isIOS = Capacitor.getPlatform() === 'ios';
      console.log(`[Firebase Auth] ${isIOS ? 'iOS' : 'Android'} phoneVerificationFailed: Triggering backup OTP fallback...`);
      try {
        const e164 = buildE164(mobileNumberRef.current);
        if (e164 && emailRef.current) {
          otpProviderRef.current = 'FAST2SMS';
          setOtpProvider('FAST2SMS');
          const sendRes = await sendOtp(e164, emailRef.current, isIOS, 'FIREBASE_VERIFICATION_FAILED', failureDetail.slice(0, 200), true);
          if (sendRes.success) {
            codeSentRef.current = true;
            userInitiatedSendRef.current = false;
            setDeliveryMethod(sendRes.smsDelivered ? 'sms_and_email' : 'email');
            setScreen('otp');
            setTimer(60);
            setLoading(false);
            showToast(sendRes.message || (sendRes.smsDelivered ? t('auth.codeSentToMobileAndEmail', 'Verification code sent to your mobile and email') : t('auth.codeSentToEmail', { email: emailRef.current }, `Verification code sent to ${emailRef.current}`)), 'success');
            setTimeout(() => otpInputRef.current?.focus(), 150);
            return;
          } else {
            setLoading(false);
            userInitiatedSendRef.current = false;
            setPhoneError(sendRes.message || cleanErrorMessage(errorMsg, t('auth.sendOtpFailed', 'Failed to send verification code. Please try again.')));
            return;
          }
        }
      } catch (fallbackErr: any) {
        console.error('[Firebase Auth] Fallback OTP failed:', fallbackErr);
        setLoading(false);
        userInitiatedSendRef.current = false;
        setPhoneError(fallbackErr?.message || cleanErrorMessage(errorMsg, t('auth.sendOtpFailed', 'Failed to send verification code. Please try again.')));
        return;
      }

      setLoading(false);
      userInitiatedSendRef.current = false;
      setPhoneError(cleanErrorMessage(errorMsg, t('auth.sendOtpFailed', 'Failed to send verification code via Firebase. Please try again.')));
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

  // Smooth cascading animation when auto-verifying SMS
  useEffect(() => {
    if (isAutoVerifying) {
      setAutoFillStep(0);
      const timerIds: Array<ReturnType<typeof setTimeout>> = [];
      for (let i = 1; i <= 6; i++) {
        timerIds.push(
          setTimeout(() => {
            setAutoFillStep(i);
          }, i * 85)
        );
      }
      return () => {
        timerIds.forEach(clearTimeout);
      };
    } else {
      setAutoFillStep(0);
    }
  }, [isAutoVerifying]);

  // WebOTP API — auto-read OTP from SMS on web (Chrome / Edge)
  useEffect(() => {
    if (screen !== 'otp' || !('OTPCredential' in window)) return;
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ['sms'] }, signal: ac.signal } as any)
      .then(async (otp: any) => {
        if (otp?.code) {
          setIsAutoVerifying(true);
          const cleanCode = String(otp.code).replace(/[^0-9]/g, '').slice(0, 6);
          for (let i = 1; i <= cleanCode.length; i++) {
            await new Promise(r => setTimeout(r, 70));
            setOtpCode(cleanCode.slice(0, i));
          }
          showToast('OTP auto-filled from SMS!', 'success');
          await new Promise(r => setTimeout(r, 450));
          submitOtp(cleanCode);
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
    fallbackTriggeredRef.current = false;
    window.verificationId = null;
    window.confirmationResult = null;
    setConfirmationResult(null);
    otpProviderRef.current = null;
    setOtpProvider(null);
    setIsAutoVerifying(false);
    setLoading(true);
    userInitiatedSendRef.current = true;

    // Apple Reviewer Account Bypass (Strictly for Apple App Store review credentials or @apple.com addresses)
    const pDigits = e164.replace(/[^0-9]/g, '');
    const cleanEmail = email.toLowerCase().trim();
    const isAppleDomain = cleanEmail.endsWith('@apple.com') || cleanEmail === 'review@mitoreboot.in';
    const isKnownReviewCredentials =
      (pDigits.endsWith('9597042107') && cleanEmail === 'sathishkumarksk007@gmail.com') ||
      pDigits.endsWith('9999999999') ||
      pDigits.endsWith('15555555555') ||
      pDigits === '5555555555';

    // Bypass if running with official reviewer credentials or Apple reviewer domain
    const isReviewAccount = isKnownReviewCredentials || isAppleDomain;

    if (isReviewAccount) {
      console.log('[Auth] Reviewer / Demo Account detected. Skipping Firebase SMS flow and using direct verification.');
      otpProviderRef.current = 'FAST2SMS';
      setOtpProvider('FAST2SMS');
      try {
        const sendRes = await sendOtp(e164, email, false);
        if (sendRes.success) {
          codeSentRef.current = true;
          userInitiatedSendRef.current = false;
          setDeliveryMethod('sms_and_email');
          setScreen('otp');
          setTimer(60);
          showToast(t('auth.demoCodePrompt', 'Verification code sent. Enter 123456 to continue.'), 'success');
          setTimeout(() => otpInputRef.current?.focus(), 150);
        } else {
          setPhoneError(sendRes.message || t('auth.sendOtpFailed', 'Unable to send verification code. Please try again.'));
        }
      } catch (err: any) {
        if (err?.isAccountDeleted || err?.message?.includes('quarantine') || err?.message?.includes('deleted and is')) {
          setAccountDeletedInfo({
            isDeleted: true,
            daysLeft: err.daysLeft || 30,
            message: err.message
          });
          return;
        }
        setPhoneError(err?.message || t('auth.sendOtpFailed', 'Unable to send verification code. Please try again.'));
      } finally {
        setLoading(false);
        userInitiatedSendRef.current = false;
      }
      return;
    }

    // Helper to safely trigger iOS fallback without duplicate email
    const triggerIosFallback = async (reason: string, failureCategory?: string) => {
      try {
        otpProviderRef.current = 'FAST2SMS';
        setOtpProvider('FAST2SMS');
        const sendRes = await sendOtp(e164, email, true, reason, failureCategory, true);
        if (sendRes.success) {
          codeSentRef.current = true;
          userInitiatedSendRef.current = false;
          setDeliveryMethod(sendRes.smsDelivered ? 'sms_and_email' : 'email');
          setScreen('otp');
          setTimer(60);
          showToast(
            sendRes.message || (sendRes.smsDelivered ? t('auth.codeSentToMobileAndEmail', 'Verification code sent to your mobile and email') : t('auth.codeSentToEmail', { email }, `Verification code sent to ${email}`)),
            'success'
          );
          setTimeout(() => otpInputRef.current?.focus(), 150);
        } else {
          setPhoneError(sendRes.message || t('auth.sendOtpFailed', 'Failed to send verification code. Please try again.'));
        }
      } catch (fallbackErr: any) {
        setPhoneError(fallbackErr?.message || t('auth.sendOtpFailed', 'Failed to send verification code. Please try again.'));
      } finally {
        setLoading(false);
        userInitiatedSendRef.current = false;
      }
    };

    // Helper to safely trigger Android Email-only fallback
    const triggerAndroidEmailFallback = async (nativeErr: any) => {
      try {
        otpProviderRef.current = 'FAST2SMS';
        setOtpProvider('FAST2SMS');
        setDeliveryMethod('email');
        setScreen('otp');
        setTimer(60);
        showToast(t('auth.codeSentToEmail', { email }, `SMS delivery delayed. Please use the verification code sent to ${email}.`), 'info');
        setTimeout(() => otpInputRef.current?.focus(), 150);
        return;
      } catch (_) { }
      setLoading(false);
      userInitiatedSendRef.current = false;
      setPhoneError(cleanErrorMessage(nativeErr?.message, t('auth.sendOtpFailed', 'Unable to send verification code via Firebase. Please try again.')));
    };

    // ALWAYS dispatch Email OTP in parallel to registered email (Requirement 2)
    console.log('[Auth] Dispatching Email OTP in parallel for:', email);
    const emailOtpPromise = sendOtp(e164, email, false, 'INITIAL_DISPATCH', 'NONE', false).catch((err) => {
      console.warn('[Auth] Background Email OTP dispatch notice:', err);
      return null;
    });

    // 1. Native Mobile (iOS & Android): Native Firebase Phone Auth with Google Play Integrity / APNs
    if (Capacitor.isNativePlatform()) {
      const isIOS = Capacitor.getPlatform() === 'ios';

      if (isIOS) {
        // Safety timeout for iOS Native Firebase (35 seconds)
        // Gives ample time for silent APNs delivery or user reCAPTCHA challenge.
        if (iosTimeoutTimerRef.current) clearTimeout(iosTimeoutTimerRef.current);
        iosTimeoutTimerRef.current = setTimeout(async () => {
          if (!codeSentRef.current && screenRef.current !== 'otp' && !fallbackTriggeredRef.current) {
            console.warn('[Firebase Auth] iOS Native Firebase timed out (35s). Triggering fallback OTP...');
            fallbackTriggeredRef.current = true;
            await triggerIosFallback('FIREBASE_NATIVE_TIMEOUT', 'TIMEOUT_35S');
          }
        }, 35000);
      }

      try {
        console.log(`[Firebase Auth] Attempting Native Firebase Phone Auth (${Capacitor.getPlatform()}) for:`, e164);
        otpProviderRef.current = 'FIREBASE';
        setOtpProvider('FIREBASE');
        await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: e164 });
        // Native phoneCodeSent listener will transition screen to 'otp' and set codeSentRef.current = true
      } catch (nativeErr: any) {
        if (iosTimeoutTimerRef.current) {
          clearTimeout(iosTimeoutTimerRef.current);
          iosTimeoutTimerRef.current = null;
        }
        console.warn(`[Firebase Auth] Native Firebase Phone Auth (${Capacitor.getPlatform()}) error:`, nativeErr);

        if (!codeSentRef.current && !fallbackTriggeredRef.current) {
          fallbackTriggeredRef.current = true;
          if (isIOS) {
            console.log('[Firebase Auth] iOS Native Firebase error, triggering Fast2SMS backup OTP...');
            await triggerIosFallback('FIREBASE_NATIVE_EXCEPTION', nativeErr?.code || nativeErr?.message);
          } else {
            console.warn('[Firebase Auth] Android Firebase Phone Auth failed, using parallel email OTP...');
            await triggerAndroidEmailFallback(nativeErr);
          }
        }
      }
      return;
    }

    // 2. Web: Web Firebase Phone Auth via Web SDK (Invisible reCAPTCHA)
    try {
      console.log('[Firebase Auth] Attempting Web Firebase Phone Auth for:', e164);
      const verifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, e164, verifier);

      codeSentRef.current = true;
      userInitiatedSendRef.current = false;
      otpProviderRef.current = 'FIREBASE';
      setOtpProvider('FIREBASE');
      setConfirmationResult(confirmation);
      window.confirmationResult = confirmation;
      setDeliveryMethod('sms_and_email');
      setScreen('otp');
      setTimer(60);
      showToast(t('auth.codeSentToBoth', 'Verification code sent to your Mobile & Email'), 'success');
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (webErr: any) {
      console.warn('[Firebase Auth] Web Firebase initiation error, falling back to Email OTP:', webErr);
      setConfirmationResult(null);
      window.confirmationResult = null;
      try {
        otpProviderRef.current = 'FAST2SMS';
        setOtpProvider('FAST2SMS');
        // Await the parallel email OTP that was already dispatched; avoid duplicate API request that triggers 429 rate limit
        const sendRes = await emailOtpPromise;
        if (sendRes && sendRes.success) {
          codeSentRef.current = true;
          userInitiatedSendRef.current = false;
          setDeliveryMethod('email');
          setScreen('otp');
          setTimer(60);
          showToast(sendRes.message || t('auth.codeSentToEmail', { email }, `Verification code sent to ${email}`), 'success');
          setTimeout(() => otpInputRef.current?.focus(), 150);
        } else {
          // If the initial parallel send failed, attempt a fallback send
          const fallbackRes = await sendOtp(e164, email, false, 'FIREBASE_WEB_ERROR', webErr?.code || webErr?.message);
          if (fallbackRes.success) {
            codeSentRef.current = true;
            userInitiatedSendRef.current = false;
            setDeliveryMethod('email');
            setScreen('otp');
            setTimer(60);
            showToast(fallbackRes.message || t('auth.codeSentToEmail', { email }, `Verification code sent to ${email}`), 'success');
            setTimeout(() => otpInputRef.current?.focus(), 150);
          } else {
            setPhoneError(fallbackRes.message || cleanErrorMessage(webErr?.message, t('auth.sendOtpFailed', 'Unable to send verification code. Please try again.')));
          }
        }
      } catch (fallbackErr: any) {
        setPhoneError(cleanErrorMessage(fallbackErr?.message, t('auth.sendOtpFailed', 'Unable to send verification code. Please try again.')));
      }
    } finally {
      setLoading(false);
      userInitiatedSendRef.current = false;
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

        if (confirmationResult) {
          // 1. Web Firebase Phone Auth (Used on iOS and Web via reCAPTCHA inside WebView)
          try {
            console.log('[Auth] Verifying Firebase OTP (confirmationResult)...');
            const userCredential = await confirmationResult.confirm(code);
            idToken = await userCredential.user.getIdToken();
          } catch (fbErr: any) {
            console.warn('[Auth] Firebase confirmation failed, checking backup verification:', fbErr);
            const ok = await verifyOtp(e164, code, email);
            if (ok) {
              showToast(t('auth.authSuccessWelcome', 'Authenticated successfully! Welcome.'), 'success');
              return;
            }
            setOtpError(t('auth.invalidOtp', 'Invalid or expired verification code. Please check your SMS or Email and try again.'));
            return;
          }
        } else if (Capacitor.isNativePlatform() && window.verificationId) {
          // 2. Native Firebase Plugin (Used on Android, or iOS if sent via native plugin)
          try {
            console.log(`[Auth] Verifying Native Firebase OTP (${Capacitor.getPlatform()}) with verificationId:`, window.verificationId);
            await FirebaseAuthentication.confirmVerificationCode({
              verificationId: window.verificationId,
              verificationCode: code
            });
            const idTokenRes = await FirebaseAuthentication.getIdToken();
            idToken = idTokenRes.token || null;
          } catch (fbErr: any) {
            console.warn('[Auth] Native Firebase confirmation failed, checking backup verification:', fbErr);
            // Check if code verifies with backend OTP before failing
            const ok = await verifyOtp(e164, code, email);
            if (ok) {
              showToast(t('auth.authSuccessWelcome', 'Authenticated successfully! Welcome.'), 'success');
              return;
            }
            setOtpError(t('auth.invalidOtp', 'Invalid or expired verification code. Please check your SMS or Email and try again.'));
            return;
          }
        }

        if (!idToken) {
          const ok = await verifyOtp(e164, code, email);
          if (ok) {
            showToast(t('auth.authSuccessWelcome', 'Authenticated successfully! Welcome.'), 'success');
            return;
          }
          setOtpError('Unable to retrieve verification token. Please request a new OTP.');
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
      if (err?.isAccountDeleted || err?.message?.includes('quarantine') || err?.message?.includes('deleted and is')) {
        setScreen('phone');
        setAccountDeletedInfo({
          isDeleted: true,
          daysLeft: err.daysLeft || 30,
          message: err.message
        });
        return;
      }
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
        {accountDeletedInfo && (
          <div className="mb-5 p-4 bg-amber-50 text-amber-950 rounded-2xl flex items-start space-x-3 text-xs font-medium border border-amber-200 animate-shake shadow-xs">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <p className="font-bold text-amber-950 mb-1 text-sm">Account In 30-Day Quarantine</p>
              <p className="leading-relaxed text-amber-900">{accountDeletedInfo.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={`mailto:support@mitoreboot.in?subject=Revoke%20and%20Restore%20Deleted%20Account%20Request&body=Hi%20MitoReboot%20Support%20Team%2C%0A%0AI%20recently%20deleted%20my%20account%20associated%20with%20mobile%20${encodeURIComponent(mobileNumber)}%20and%20email%20${encodeURIComponent(email)}.%20Please%20revoke%20the%20deletion%20and%20restore%20my%20account.%0A%0AThank%20you.`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-[11px] shadow-xs hover:bg-blue-700 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Support to Restore</span>
                </a>
                <button
                  type="button"
                  onClick={() => setAccountDeletedInfo(null)}
                  className="px-2.5 py-1.5 text-amber-800 hover:text-amber-950 text-xs font-semibold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {error && !accountDeletedInfo && (
          <div className="mb-5 p-3.5 bg-red-50 text-danger rounded-2xl flex items-start space-x-3 text-xs font-medium border border-red-100 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-danger" />
            <div className="flex-1">
              <span className="leading-relaxed">{error}</span>
              {error.includes('support@mitoreboot.in') && (
                <a
                  href="mailto:support@mitoreboot.in?subject=Restore%20Deleted%20Account%20Request"
                  className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-[11px] shadow-xs hover:bg-red-700 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Support to Restore Account</span>
                </a>
              )}
              <button onClick={clearError} className="block mt-1.5 underline hover:text-red-700 text-[11px] cursor-pointer">{t('auth.dismiss', 'Dismiss')}</button>
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
                <div className="mt-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <div className="flex items-start gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                    <span className="leading-relaxed">{phoneError}</span>
                  </div>
                  {phoneError.includes('support@mitoreboot.in') && (
                    <a
                      href="mailto:support@mitoreboot.in?subject=Restore%20Deleted%20Account%20Request"
                      className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-[11px] shadow-xs hover:bg-rose-700 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Contact Support to Restore</span>
                    </a>
                  )}
                </div>
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
              <div className="mt-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-150 transition-all">
                {deliveryMethod === 'sms_and_email' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {t('auth.codeSentToBothDestinations', 'Sent code to Mobile & Email')}
                      </p>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Mobile & Email
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-2xs">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Smartphone className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-0.5">Mobile (SMS)</p>
                          <p className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide truncate">
                            {country.code} {mobileNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-2xs">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-0.5">Email</p>
                          <p className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide truncate">
                            {email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : deliveryMethod === 'email' ? (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {t('auth.sentViaEmail', 'Sent verification code via Email')}
                      </p>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide mt-0.5 truncate">
                        {email}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {t('auth.sentViaSms', 'Sent verification code via SMS')}
                      </p>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide mt-0.5 truncate">
                        {country.code} {mobileNumber}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Auto-Reading SMS / Email Delivery Banner */}
            {isAutoVerifying ? (
              <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl flex items-center space-x-3 text-slate-800 shadow-sm animate-pulse">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    SMS Detected Automatically!
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">Verifying code and logging you in...</p>
                </div>
                <RefreshCw className="h-4 w-4 text-emerald-600 animate-spin shrink-0" />
              </div>
            ) : deliveryMethod === 'email' ? (
              <div className="p-3 bg-emerald-50/70 border border-emerald-150 rounded-2xl flex items-center space-x-3 text-slate-700">
                <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-100 shrink-0">
                  <Mail className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">Email Verification Code</p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    Check your inbox or spam folder for the 6-digit code
                  </p>
                </div>
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
              {/* Modern 6-Box Segmented OTP Input */}
              <div
                className="relative my-4 cursor-pointer"
                onClick={() => otpInputRef.current?.focus()}
              >
                {/* Native input overlay for keyboard, autofill, paste, and screen readers */}
                <input
                  id="otp-input"
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtpCode(val);
                    setOtpError('');
                    if (val.length === 6) {
                      submitOtp(val);
                    }
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  autoComplete="one-time-code"
                  disabled={isAutoVerifying || loading}
                  className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer caret-transparent"
                  autoFocus
                />

                {/* 6 Visual Segmented Boxes */}
                <div className="flex items-center justify-between gap-2 sm:gap-2.5 max-w-[340px] mx-auto select-none">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = otpCode[index] || '';
                    const isFilled = Boolean(digit);
                    const isAutoFilled = isAutoVerifying && (index < autoFillStep || isFilled);
                    const isActive = isInputFocused && !isAutoVerifying && (otpCode.length === index || (otpCode.length === 6 && index === 5));

                    let boxClass = 'border-slate-200 bg-slate-50/70 text-slate-400';
                    if (otpError) {
                      boxClass = 'border-red-400 bg-red-50/50 text-red-600 ring-2 ring-red-400/20';
                    } else if (isAutoFilled) {
                      boxClass = 'border-emerald-500 bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/10 scale-105';
                    } else if (isActive) {
                      boxClass = 'border-primary bg-white text-slate-900 ring-4 ring-primary/20 shadow-md shadow-primary/15 scale-105';
                    } else if (isFilled) {
                      boxClass = 'border-slate-300 bg-white text-slate-900 shadow-sm';
                    }

                    return (
                      <div
                        key={index}
                        className={`h-14 flex-1 rounded-2xl border flex items-center justify-center font-black text-2xl transition-all duration-200 relative ${boxClass}`}
                      >
                        {isAutoFilled ? (
                          digit ? (
                            <span className="animate-in zoom-in-75 duration-150">{digit}</span>
                          ) : (
                            <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-in zoom-in-50 duration-200" />
                          )
                        ) : digit ? (
                          <span className="text-slate-900 animate-in zoom-in-90 duration-100">{digit}</span>
                        ) : isActive ? (
                          <span className="w-0.5 h-6 bg-primary rounded-full animate-pulse" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300/80" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {otpError && (
                <p className="mt-2 text-xs text-red-600 font-semibold flex items-center justify-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {otpError}
                </p>
              )}

              <p className="text-[11px] text-slate-400 mt-2 font-medium text-center">
                {deliveryMethod === 'email'
                  ? t('auth.enterCodeDeliveredEmail', 'Enter the 6-digit code delivered to your Email.')
                  : deliveryMethod === 'sms'
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
