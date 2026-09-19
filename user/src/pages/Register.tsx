import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { 
  User, ChevronLeft, Mail, Check, 
  Calendar, Ruler, Scale, CheckCircle2, ShieldCheck, 
  ArrowRight, ChevronDown, Coffee, Footprints, HeartPulse, Zap,
  Stethoscope, Dna, Hourglass, Droplet, Heart, Activity, Sparkles, Brain
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface RegisterProps {
  onNavigateToLogin: () => void;
}

interface ActivityOption {
  value: 'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active';
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  { value: 'Sedentary', title: 'Sedentary', desc: 'Desk work, < 4,000 steps/day', icon: Coffee },
  { value: 'Lightly active', title: 'Lightly Active', desc: '1-2 days/week light movement', icon: Footprints },
  { value: 'Moderately active', title: 'Moderate', desc: '3-5 days/week workouts', icon: HeartPulse },
  { value: 'Very active', title: 'Very Active', desc: '6-7 days/week intense training', icon: Zap },
];

interface FocusPathway {
  value: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION' | 'AGEING' | 'PCOD' | 'DIABETES' | 'HYPERTENSION' | 'PARKINSON' | 'CARDIAC';
  titleKey: string;
  defaultTitle: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const HEALTH_PATHWAYS: FocusPathway[] = [
  { value: 'PREVENTION', titleKey: 'modes.preventionTitle', defaultTitle: 'Cancer Prevention', desc: 'Cellular longevity, autophagy & metabolic resilience', icon: ShieldCheck },
  { value: 'TREATMENT', titleKey: 'modes.treatmentTitle', defaultTitle: 'Cancer Treatment', desc: 'Integrative supportive care & nutritional protocols', icon: Stethoscope },
  { value: 'SECONDARY_PREVENTION', titleKey: 'modes.secondaryPreventionTitle', defaultTitle: 'Secondary Prevention', desc: 'Recurrence risk reduction & immune surveillance', icon: Dna },
  { value: 'AGEING', titleKey: 'modes.ageingTitle', defaultTitle: 'Ageing & Longevity', desc: 'Mitochondrial vitality, NAD+ support & biological healthspan', icon: Hourglass },
  { value: 'DIABETES', titleKey: 'modes.diabetesTitle', defaultTitle: 'Diabetes & Glucose', desc: 'Insulin sensitivity, HbA1c optimization & glycemic stability', icon: Droplet },
  { value: 'CARDIAC', titleKey: 'modes.cardiacTitle', defaultTitle: 'Cardiac Health', desc: 'Arterial elasticity, circulation & cardiovascular resilience', icon: Heart },
  { value: 'HYPERTENSION', titleKey: 'modes.hypertensionTitle', defaultTitle: 'Hypertension (HTN)', desc: 'Vascular tone, stress modulation & BP stabilization', icon: Activity },
  { value: 'PCOD', titleKey: 'modes.pcodTitle', defaultTitle: 'PCOD / PCOS Care', desc: 'Hormonal balance, ovarian wellness & metabolic rhythm', icon: Sparkles },
  { value: 'PARKINSON', titleKey: 'modes.parkinsonTitle', defaultTitle: "Parkinson's Care", desc: 'Neuroprotective nutrition, motor support & cognitive vitality', icon: Brain },
];

export const Register: React.FC<RegisterProps> = ({ onNavigateToLogin }) => {
  const { completeOnboarding, error, isLoading, branding, user, apiUrl } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email || '');

  // Demographics state
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  // Lifestyle state
  const [activityLevel, setActivityLevel] = useState<'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active' | ''>('');

  // Medical state
  const [cancerJourney, setCancerJourney] = useState<FocusPathway['value'] | ''>('PREVENTION');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPathwaySheet, setShowPathwaySheet] = useState(false);

  // Real-time BMI calculation & Clinical Categorization
  const numericHeight = Number(height);
  const numericWeight = Number(weight);
  const calculatedBmi = (numericHeight > 0 && numericWeight > 0)
    ? (numericWeight / Math.pow(numericHeight / 100, 2)).toFixed(1)
    : null;

  const bmiValue = calculatedBmi ? Number(calculatedBmi) : null;

  const bmiCategory = (() => {
    if (!bmiValue) return null;
    if (bmiValue < 18.5) return { label: 'Underweight', color: 'text-amber-700 bg-amber-50 border-amber-200', position: 15 };
    if (bmiValue < 25.0) return { label: 'Healthy Baseline', color: 'text-blue-700 bg-blue-50 border-blue-200', position: 42 };
    if (bmiValue < 30.0) return { label: 'Overweight', color: 'text-amber-700 bg-amber-50 border-amber-200', position: 70 };
    return { label: 'Elevated Risk', color: 'text-rose-600 bg-rose-50 border-rose-200', position: 90 };
  })();

  const currentPathway = HEALTH_PATHWAYS.find(p => p.value === cancerJourney) || HEALTH_PATHWAYS[0];
  const PathwayIcon = currentPathway.icon;

  const handleNext = () => {
    if (!name.trim()) {
      showToast(t('auth.enterFullName', 'Please enter your full name.'), 'error');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSelectPathway = (pathwayValue: FocusPathway['value']) => {
    setCancerJourney(pathwayValue);
    setShowPathwaySheet(false);
    if (pathwayValue !== 'PREVENTION') {
      setDisclaimerAccepted(false);
      setShowDisclaimer(true);
    } else {
      setDisclaimerAccepted(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender || age === '' || height === '' || weight === '' || !activityLevel || !cancerJourney) {
      showToast(t('auth.completeAllProfileDetails', 'Please complete all required vitals and metrics.'), 'error');
      return;
    }

    if (cancerJourney !== 'PREVENTION' && !disclaimerAccepted) {
      showToast(t('auth.acceptJourneyDisclaimer', 'Please review and acknowledge the clinical disclaimer to proceed.'), 'error');
      setShowDisclaimer(true);
      return;
    }

    const success = await completeOnboarding({
      name: name.trim(),
      email: email.trim() || undefined,
      gender: gender as any,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      activityLevel: activityLevel as any,
      goal: 'Maintain weight',
      cancerJourney: cancerJourney as any,
      cancerDisclaimerAccepted: cancerJourney === 'PREVENTION' ? true : disclaimerAccepted,
      cancerDisclaimerAcceptedAt: new Date().toISOString()
    });

    if (success) {
      showToast(t('auth.onboardingSuccess', 'Health profile initialized successfully!'), 'success');
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-blue-50/30 via-slate-50/20 to-white flex flex-col justify-between px-5 py-6 pb-24 sm:px-8 relative">
      {/* Top Bar: Back & Language Selector */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pt-[max(0.5rem,calc(env(safe-area-inset-top,0px)+4px))] mb-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer shadow-2xs transition-all"
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
            <span>{t('common.back', 'Back')}</span>
          </button>
        ) : (
          <div />
        )}

        <LanguageSelector variant="dropdown" />
      </div>

      <div className="w-full max-w-md mx-auto my-auto py-2">
        {/* Step Progression Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
            <span className={step === 1 ? 'text-primary' : 'text-slate-400'}>
              Step 1: Personal Details
            </span>
            <span className={step === 2 ? 'text-primary' : 'text-slate-400'}>
              Step 2: Vitals & Lifestyle
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-primary' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-primary' : 'bg-slate-200'}`} />
          </div>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-sm border border-blue-100 mb-3 flex items-center justify-center">
            {branding.appLogoUrl ? (
              <img 
                src={branding.appLogoUrl.startsWith('http') ? branding.appLogoUrl : `${apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl}${branding.appLogoUrl.startsWith('/') ? '' : '/'}${branding.appLogoUrl}`} 
                alt="Logo" 
                className="w-full h-full object-contain rounded-xl" 
              />
            ) : (
              <img 
                src="/icon.png" 
                alt="Logo" 
                className="w-full h-full object-contain rounded-xl" 
              />
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {step === 1 ? t('auth.completeProfile', 'Complete Profile') : 'Vitals & Body Metrics'}
          </h1>
          <p className="text-slate-500 mt-1 text-xs font-medium max-w-xs">
            {step === 1 
              ? t('auth.tellUsAboutYourself', 'Please tell us a bit about yourself to customize your preventive lifestyle journey.')
              : 'Enter your biometric baseline to calibrate personalized health recommendations.'}
          </p>
        </div>

        {/* Verified Phone Chip */}
        {user?.mobileNumber && (
          <div className="mb-4 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-primary text-[11px] font-bold">
              <Check className="h-3 w-3 text-primary" />
              <span>{t('auth.phoneVerified', { phone: user.mobileNumber }, `Phone Verified: ${user.mobileNumber}`)}</span>
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-danger rounded-2xl text-xs font-semibold border border-red-100 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            /* ═════════════════ STEP 1: PERSONAL DETAILS ═════════════════ */
            <div className="space-y-4 animate-fadeIn">
              {/* Full Name */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('profile.fullName', 'Full Name')}
                </label>
                <div className="relative flex items-center">
                  <User className="h-4 w-4 text-primary shrink-0 mr-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('namePlaceholder', 'Enter your full name')}
                    className="w-full bg-transparent font-bold text-sm text-slate-900 focus:outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {t('auth.emailOptional', 'Email Address')}
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
                </div>
                <div className="relative flex items-center">
                  <Mail className="h-4 w-4 text-primary shrink-0 mr-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder', 'name@example.com')}
                    className="w-full bg-transparent font-bold text-sm text-slate-900 focus:outline-none placeholder:text-slate-300"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  Used to deliver health reports and secure appointment confirmations.
                </p>
              </div>

              {/* Step 1 Actions */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl text-center text-xs cursor-pointer transition-colors"
                >
                  {t('nav.logout', 'Log Out')}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-2/3 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-2xl shadow-md shadow-primary/25 flex items-center justify-center space-x-2 cursor-pointer text-xs active:scale-[0.99] transition-all"
                >
                  <span>{t('auth.continue', 'Continue')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* ═════════════════ STEP 2: VITALS & BIOMETRICS ═════════════════ */
            <div className="space-y-4 animate-fadeIn">
              {/* Gender Segmented Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  {t('profile.gender', 'Gender')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'Male', label: t('genderMale', 'Male'), symbol: '♂' },
                    { value: 'Female', label: t('genderFemale', 'Female'), symbol: '♀' },
                    { value: 'Other', label: t('genderOther', 'Other'), symbol: '⚥' },
                  ].map((g) => {
                    const isSelected = gender === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setGender(g.value as any)}
                        className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-50 border-primary text-primary ring-2 ring-primary/20 shadow-xs font-bold'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold shadow-2xs'
                        }`}
                      >
                        <span className="text-base font-bold mb-0.5 leading-none">{g.symbol}</span>
                        <span className="text-xs">{g.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vitals Biometrics Grid */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Vitals & Body Metrics
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {/* Age */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-2xs transition-all">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Age</span>
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <input
                        type="number"
                        step="any"
                        required
                        min="10"
                        max="100"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="30"
                        className="w-full bg-transparent font-black text-lg text-slate-900 focus:outline-none placeholder:text-slate-300"
                      />
                      <span className="text-[11px] font-bold text-slate-400">yrs</span>
                    </div>
                  </div>

                  {/* Height */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-2xs transition-all">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Height</span>
                      <Ruler className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <input
                        type="number"
                        step="any"
                        required
                        min="80"
                        max="250"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="165"
                        className="w-full bg-transparent font-black text-lg text-slate-900 focus:outline-none placeholder:text-slate-300"
                      />
                      <span className="text-[11px] font-bold text-slate-400">cm</span>
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-2xs transition-all">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Weight</span>
                      <Scale className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <input
                        type="number"
                        step="any"
                        required
                        min="25"
                        max="250"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="62"
                        className="w-full bg-transparent font-black text-lg text-slate-900 focus:outline-none placeholder:text-slate-300"
                      />
                      <span className="text-[11px] font-bold text-slate-400">kg</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Dynamic BMI Gauge */}
                {calculatedBmi && bmiCategory && (
                  <div className="mt-2.5 p-3 bg-white rounded-2xl border border-blue-100 shadow-2xs animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs font-bold text-slate-700">Body Mass Index (BMI):</span>
                        <span className="text-sm font-extrabold text-slate-900">{calculatedBmi}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${bmiCategory.color}`}>
                        {bmiCategory.label}
                      </span>
                    </div>

                    {/* Minimalist Spectrum Bar */}
                    <div className="relative pt-1 pb-1">
                      <div className="h-1.5 w-full rounded-full bg-slate-100 flex overflow-hidden">
                        <div className="w-1/4 bg-amber-200" />
                        <div className="w-1/4 bg-blue-500" />
                        <div className="w-1/4 bg-amber-400" />
                        <div className="w-1/4 bg-rose-400" />
                      </div>
                      <div 
                        className="absolute top-0 transform -translate-x-1/2 transition-all duration-300"
                        style={{ left: `${Math.min(96, Math.max(4, bmiCategory.position))}%` }}
                      >
                        <div className="w-2.5 h-3.5 bg-slate-800 rounded-xs shadow-xs border border-white" />
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] font-semibold text-slate-400 mt-1">
                      <span>Underweight</span>
                      <span className="text-primary font-bold">Healthy Baseline</span>
                      <span>Overweight</span>
                      <span>High Risk</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Level Segmented Cards */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Activity Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_OPTIONS.map((opt) => {
                    const isSelected = activityLevel === opt.value;
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setActivityLevel(opt.value)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-primary ring-2 ring-primary/20 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">{opt.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Health Focus / Care Pathway */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Cancer Care & Health Journey
                </label>

                {/* Selected Pathway Card */}
                <div 
                  onClick={() => setShowPathwaySheet(true)}
                  className="p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0">
                      <PathwayIcon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {t(currentPathway.titleKey, currentPathway.defaultTitle)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5 block">
                        {currentPathway.desc}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                </div>
              </div>

              {/* Disclaimer Acknowledgment Card */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${disclaimerAccepted ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {disclaimerAccepted ? 'Disclaimer Accepted' : 'Medical Disclaimer'}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                      {disclaimerAccepted ? 'Informed consent on file' : 'Action required'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDisclaimer(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    disclaimerAccepted
                      ? 'bg-blue-50 text-primary border border-blue-100 hover:bg-blue-100'
                      : 'bg-primary text-white shadow-xs hover:bg-primary-dark'
                  }`}
                >
                  {disclaimerAccepted ? 'Read' : 'Review & Sign'}
                </button>
              </div>

              {/* Step 2 Actions */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-1 cursor-pointer text-xs transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{t('common.back', 'Back')}</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-2xl shadow-md shadow-primary/25 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer text-xs active:scale-[0.99] transition-all"
                >
                  {isLoading ? (
                    <span>{t('common.completing', 'Completing...')}</span>
                  ) : (
                    <span>{t('auth.finishSetup', 'Finish Setup')}</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Trust & Privacy Badge */}
      <div className="w-full max-w-md mx-auto pt-4 pb-2 text-center text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        <span>Your Health Data is Safe & Never Shared</span>
      </div>

      {/* ═════════════════ HEALTH PATHWAY MODAL SHEET ═════════════════ */}
      {showPathwaySheet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-100 animate-slideUp sm:animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Select Health Focus
                </h3>
                <p className="text-slate-500 text-[11px] font-medium mt-0.5">
                  Select your primary preventive health or care journey.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPathwaySheet(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 pr-1 no-scrollbar">
              {HEALTH_PATHWAYS.map((p) => {
                const isSelected = cancerJourney === p.value;
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSelectPathway(p.value)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-primary ring-2 ring-primary/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {t(p.titleKey, p.defaultTitle)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                          {p.desc}
                        </p>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPathwaySheet(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════ MEDICAL DISCLAIMER MODAL ═════════════════ */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl animate-scaleIn">
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>{t('medicalDisclaimerTitle', 'Medical & Care Disclaimer')}</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mb-3">
              Please review this medical protocol notice before activating your personalized care journey.
            </p>
            <div
              className="max-h-56 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-medium leading-relaxed mb-5 whitespace-pre-line no-scrollbar"
              dangerouslySetInnerHTML={{
                __html: language !== 'en'
                  ? (cancerJourney === 'TREATMENT'
                      ? t('disclaimer.cancerTreatmentText', branding.cancerTreatmentDisclaimer)
                      : cancerJourney === 'SECONDARY_PREVENTION'
                      ? t('disclaimer.cancerSecondaryText', branding.cancerSecondaryDisclaimer)
                      : t('disclaimer.cancerPreventionText', branding.cancerPreventionDisclaimer))
                  : (cancerJourney === 'TREATMENT'
                      ? branding.cancerTreatmentDisclaimer
                      : cancerJourney === 'SECONDARY_PREVENTION'
                      ? branding.cancerSecondaryDisclaimer
                      : branding.cancerPreventionDisclaimer)
              }}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(false);
                  setShowDisclaimer(false);
                }}
                className="w-full sm:flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold order-2 sm:order-1 cursor-pointer"
              >
                {t('common.decline', 'Decline')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(true);
                  setShowDisclaimer(false);
                  showToast('Disclaimer accepted.', 'info');
                }}
                className="w-full sm:flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 order-1 sm:order-2 cursor-pointer"
              >
                {t('profile.understandAccept', 'I Understand & Accept')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
