import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, Phone, User, Activity, Goal, ChevronRight, ChevronLeft, Heart, Eye, EyeOff } from 'lucide-react';

interface RegisterProps {
  onNavigateToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigateToLogin }) => {
  const { register, error, isLoading, branding } = useAuth();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Demographics state
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [age, setAge] = useState<number>(30);
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(70);
  const [activityLevel, setActivityLevel] = useState<'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active'>('Moderately active');
  const [goal, setGoal] = useState<'Lose weight' | 'Maintain weight' | 'Gain weight'>('Maintain weight');
  const [cancerJourney, setCancerJourney] = useState<'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION'>('PREVENTION');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  const handleNext = async () => {
    if (step === 1) {
      if (!name || !email || !mobile || !password) return;
      setCheckingAvailability(true);
      setStep1Error(null);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://api.mitoreboot.in/api');
        const res = await fetch(`${baseUrl}/auth/check-availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, mobile })
        });
        const data = await res.json();
        if (!res.ok) {
          setStep1Error(data.message || 'Validation failed. Please try again.');
          setCheckingAvailability(false);
          return;
        }
      } catch (err: any) {
        setStep1Error('Network error. Failed to validate credentials.');
        setCheckingAvailability(false);
        return;
      }
      setCheckingAvailability(false);
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((cancerJourney === 'TREATMENT' || cancerJourney === 'SECONDARY_PREVENTION') && !disclaimerAccepted) {
      return; // UI restricts submission anyway, but safety check
    }
    await register(name, email, mobile, password, {
      gender,
      age,
      height,
      weight,
      activityLevel,
      goal,
      cancerJourney,
      cancerDisclaimerAccepted: cancerJourney === 'PREVENTION' ? true : disclaimerAccepted,
      cancerDisclaimerAcceptedAt: cancerJourney === 'PREVENTION' ? undefined : (disclaimerAccepted ? new Date().toISOString() : undefined)
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-primary-light text-primary rounded-2xl mb-3 shadow-soft">
            {branding.appLogoUrl ? (
              <img src={branding.appLogoUrl} alt="Logo" className="h-6 w-6 object-contain rounded-md" />
            ) : (
              <Heart className="h-6 w-6 fill-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-slate-500 mt-1 text-sm">{branding.appTagline}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-danger rounded-2xl text-xs font-semibold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 ? (
            /* STEP 1: Basic credentials */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Phone className="h-5 w-5" />
                  </span>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {step1Error && (
                <div className="mt-4 p-3 bg-red-50 text-danger rounded-2xl text-xs font-semibold border border-red-100 animate-fadeIn">
                  {step1Error}
                </div>
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={checkingAvailability}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-2xl shadow-soft flex items-center justify-center space-x-2 mt-6 disabled:opacity-50"
              >
                <span>{checkingAvailability ? 'Validating...' : 'Continue'}</span>
                {!checkingAvailability && <ChevronRight className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            /* STEP 2: Clinical demographics */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    required
                    min="30"
                    max="200"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center space-x-1">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <span>Activity Level</span>
                </label>
                <select
                  value={activityLevel}
                  onChange={(e: any) => setActivityLevel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                >
                  <option value="Sedentary">Sedentary (no exercise)</option>
                  <option value="Lightly active">Lightly active (1-2 days/wk)</option>
                  <option value="Moderately active">Moderately active (3-5 days/wk)</option>
                  <option value="Very active">Very active (6-7 days/wk)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center space-x-1">
                  <Goal className="h-4 w-4 text-slate-400" />
                  <span>Goal Target</span>
                </label>
                <select
                  value={goal}
                  onChange={(e: any) => setGoal(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                >
                  <option value="Lose weight">Lose weight</option>
                  <option value="Maintain weight">Maintain weight</option>
                  <option value="Gain weight">Gain weight</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center space-x-1">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <span>Cancer Care Journey</span>
                </label>
                <select
                  value={cancerJourney}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setCancerJourney(val);
                    setDisclaimerAccepted(false);
                    if (val === 'TREATMENT' || val === 'SECONDARY_PREVENTION') {
                      setShowDisclaimer(true);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                >
                  <option value="PREVENTION">CANCER PREVENTION [NO HISTORY OF CANCER]</option>
                  <option value="TREATMENT">CANCER TREATMENT</option>
                  <option value="SECONDARY_PREVENTION">CANCER SECONDARY PREVENTION [PREVIOUS HISTORY OF CANCER]</option>
                </select>
                {(cancerJourney === 'TREATMENT' || cancerJourney === 'SECONDARY_PREVENTION') && (
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold">
                    <span className={disclaimerAccepted ? 'text-emerald-600' : 'text-rose-500'}>
                      {disclaimerAccepted ? '✓ Disclaimer Accepted' : '✗ Disclaimer Declined / Not Accepted'}
                    </span>
                    {!disclaimerAccepted && (
                      <button
                        type="button"
                        onClick={() => setShowDisclaimer(true)}
                        className="text-primary hover:underline"
                      >
                        Read Disclaimer
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl flex items-center justify-center space-x-1"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading || ((cancerJourney === 'TREATMENT' || cancerJourney === 'SECONDARY_PREVENTION') && !disclaimerAccepted)}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-2xl shadow-soft disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Register'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 font-medium mt-4">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-primary font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>

      {/* Disclaimer Modal Overlay */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-xl animate-scaleIn">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
              <span>Medical Disclaimer</span>
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed mb-6">
              {cancerJourney === 'TREATMENT' 
                ? (branding.cancerTreatmentDisclaimer || 'Disclaimer: This app is for informational purposes only. If you are undergoing active cancer treatment, please consult with your oncologist before starting any circadian fasting protocols.')
                : (branding.cancerSecondaryDisclaimer || 'Disclaimer: This app is for informational purposes only. If you have a previous history of cancer (secondary prevention), please consult with your medical team before starting any circadian fasting protocols.')
              }
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(false);
                  setShowDisclaimer(false);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(true);
                  setShowDisclaimer(false);
                }}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-soft"
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
