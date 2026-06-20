import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, AlertCircle, Smartphone, ChevronDown, Search, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth, isMock } from '../config/firebase';

declare global {
  interface Window {
    recaptchaVerifier: any;
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
  { name: 'Italy', code: '+39', flag: '🇮🇹' }
];

export const Login: React.FC<LoginProps> = () => {
  const { verifyOtpToken, error, clearError, isLoading: authLoading, branding } = useAuth();
  const { showToast } = useToast();

  // Screen state
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);

  // Phone input states
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [mobileNumber, setMobileNumber] = useState('');
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // OTP Verification states
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Dropdown reference
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-detect country based on device locale/timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const lowerTz = tz.toLowerCase();
      
      let detected: Country | undefined;
      
      if (lowerTz.includes('calcutta') || lowerTz.includes('kolkata') || lowerTz.includes('india')) {
        detected = COUNTRIES.find(c => c.name === 'India');
      } else if (lowerTz.includes('london') || lowerTz.includes('europe/london')) {
        detected = COUNTRIES.find(c => c.name === 'United Kingdom');
      } else if (lowerTz.includes('dubai') || lowerTz.includes('asia/dubai')) {
        detected = COUNTRIES.find(c => c.name === 'United Arab Emirates');
      } else if (lowerTz.includes('singapore') || lowerTz.includes('asia/singapore')) {
        detected = COUNTRIES.find(c => c.name === 'Singapore');
      } else if (lowerTz.includes('sydney') || lowerTz.includes('australia')) {
        detected = COUNTRIES.find(c => c.name === 'Australia');
      } else if (lowerTz.includes('america') || lowerTz.includes('us') || lowerTz.includes('pacific') || lowerTz.includes('eastern')) {
        detected = COUNTRIES.find(c => c.name === 'United States');
      } else if (lowerTz.includes('canada') || lowerTz.includes('toronto') || lowerTz.includes('vancouver')) {
        detected = COUNTRIES.find(c => c.name === 'Canada');
      }

      if (detected) {
        setCountry(detected);
      }
    } catch (err) {
      console.warn('Error auto-detecting location:', err);
    }
  }, []);

  // Handle click outside country selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountrySelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // OTP Resend Res countdown timer
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // WebOTP API SMS Auto-read
  useEffect(() => {
    if (!showOtpInput || !('OTPCredential' in window)) return;

    const ac = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      } as any)
      .then((otp: any) => {
        if (otp && otp.code) {
          setOtpCode(otp.code);
          showToast('OTP auto-filled from SMS!', 'success');
          // Automatically submit
          handleVerifyOtpCode(otp.code);
        }
      })
      .catch((err) => {
        console.log('WebOTP auto-read aborted or failed:', err);
      });

    return () => {
      ac.abort();
    };
  }, [showOtpInput]);

  // Sanitize the phone number
  const sanitizePhoneNumber = (num: string) => {
    let clean = num.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = clean.substring(1);
    }
    return clean;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = sanitizePhoneNumber(mobileNumber);
    if (!cleanNum) {
      showToast('Please enter a valid mobile number.', 'error');
      return;
    }

    setLoading(true);
    clearError();

    const fullPhoneNumber = `${country.code}${cleanNum}`;

    try {
      if (isMock) {
        // Simulated network delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        showToast(`[MOCK MODE] OTP verification SMS sent to ${fullPhoneNumber}`, 'success');
        setShowOtpInput(true);
        setTimer(30);
        setOtpCode('123456'); // Pre-fill OTP code for mock testing
      } else {
        // Real Firebase Phone Auth
        // Verify recaptcha container exists
        let recaptchaContainer = document.getElementById('recaptcha-container');
        if (!recaptchaContainer) {
          const div = document.createElement('div');
          div.id = 'recaptcha-container';
          document.body.appendChild(div);
        }

        const appVerifier = window.recaptchaVerifier || new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
        window.recaptchaVerifier = appVerifier;

        const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        showToast(`Verification code sent to ${fullPhoneNumber}`, 'success');
        setShowOtpInput(true);
        setTimer(60);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to send OTP verification code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleVerifyOtpCode(otpCode);
  };

  const handleVerifyOtpCode = async (codeToSubmit: string) => {
    if (codeToSubmit.length !== 6) {
      showToast('Please enter a valid 6-digit verification code.', 'error');
      return;
    }

    setLoading(true);
    clearError();

    try {
      let idToken: string;
      const cleanNum = sanitizePhoneNumber(mobileNumber);
      const fullPhoneNumber = `${country.code}${cleanNum}`;

      if (isMock) {
        // Exchange mock token directly at backend
        idToken = `mock-token-${fullPhoneNumber}`;
      } else {
        // Real mode confirmation check
        if (!confirmationResult) {
          throw new Error('Verification session has expired. Please request a new code.');
        }
        const result = await confirmationResult.confirm(codeToSubmit);
        idToken = await result.user.getIdToken();
      }

      const res = await verifyOtpToken(idToken);
      if (res) {
        showToast('Authenticated successfully!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Invalid verification code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setOtpCode('');
    await handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleBackToNumber = () => {
    setShowOtpInput(false);
    setOtpCode('');
    setConfirmationResult(null);
  };

  // Filter countries by search query
  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
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

        {/* Mock Mode Alert */}
        {isMock && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl text-xs font-semibold flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">DEVELOPER MOCK MODE ACTIVE</p>
              <p className="font-medium text-[10px] text-amber-700 mt-0.5">Use any phone number. A simulated verification OTP (123456) will be autofilled.</p>
            </div>
          </div>
        )}

        {/* Backend Auth Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-danger rounded-2xl flex items-start space-x-3 text-sm font-medium border border-red-100">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              <button onClick={clearError} className="block mt-1 underline hover:text-red-700">Clear error</button>
            </div>
          </div>
        )}

        {!showOtpInput ? (
          /* SCREEN 1: Phone Number Input */
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Number</label>
              
              <div className="flex space-x-2 relative" ref={dropdownRef}>
                {/* Custom Country Flag Selector */}
                <button
                  type="button"
                  onClick={() => setShowCountrySelector(!showCountrySelector)}
                  className="flex items-center space-x-1.5 px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all font-bold text-slate-800 text-sm shrink-0"
                >
                  <span>{country.flag}</span>
                  <span>{country.code}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>

                {/* Country Search Dropdown overlay */}
                {showCountrySelector && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden py-2 animate-scaleIn">
                    <div className="px-2.5 pb-2 border-b border-slate-100 flex items-center space-x-1.5">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search country/code..."
                        className="w-full text-xs py-1 focus:outline-none text-slate-700"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto pt-1 no-scrollbar">
                      {filteredCountries.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setCountry(c);
                            setShowCountrySelector(false);
                            setSearchQuery('');
                          }}
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
                        <div className="px-3 py-4 text-center text-xs text-slate-400">
                          No country found
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone Text Input */}
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter mobile number"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 placeholder:text-slate-400 font-bold tracking-wide"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-primary-light transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading || authLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        ) : (
          /* SCREEN 2: OTP Verification Input */
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={handleBackToNumber}
                  className="flex items-center text-xs text-primary font-bold hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
                <span className="text-xs text-slate-500 font-semibold">
                  Sent to {country.code} {mobileNumber}
                </span>
              </div>
              
              <label className="block text-sm font-semibold text-slate-700 mb-2">Verification Code</label>
              
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0 0 0 0 0 0"
                className="w-full py-4 text-center rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 placeholder:text-slate-300 font-extrabold text-2xl tracking-widest"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-2 font-medium text-center">
                Enter the 6-digit confirmation code delivered via SMS text message.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-primary-light transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading || authLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify & Sign In'
              )}
            </button>

            <div className="text-center">
              {timer > 0 ? (
                <span className="text-xs text-slate-400 font-semibold">
                  Resend code in {timer} seconds
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Resend verification code
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Hidden Recaptcha Anchor for real Firebase SMS validation */}
      <div id="recaptcha-container" className="hidden"></div>
    </div>
  );
};
