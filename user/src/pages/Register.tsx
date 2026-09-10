import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { User, Activity, ChevronRight, ChevronLeft, Heart, Mail } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface RegisterProps {
  onNavigateToLogin: () => void; // Used as fallback/logout in onboarding
}

export const Register: React.FC<RegisterProps> = ({ onNavigateToLogin }) => {
  const { completeOnboarding, error, isLoading, branding, user, apiUrl } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  
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
  const [cancerJourney, setCancerJourney] = useState<'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION' | ''>('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender || age === '' || height === '' || weight === '' || !activityLevel || !cancerJourney) {
      showToast(t('auth.completeAllProfileDetails', 'Please complete all profile details.'), 'error');
      return;
    }

    if (cancerJourney !== 'PREVENTION' && !disclaimerAccepted) {
      showToast(t('auth.acceptJourneyDisclaimer', 'You must accept the journey disclaimer to proceed.'), 'error');
      return;
    }

    const success = await completeOnboarding({
      name,
      email: email.trim() || undefined,
      gender: gender as any,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      activityLevel: activityLevel as any,
      goal: 'Maintain weight',
      cancerJourney: cancerJourney as any,
      cancerDisclaimerAccepted: cancerJourney === 'PREVENTION' ? undefined : disclaimerAccepted,
      cancerDisclaimerAcceptedAt: cancerJourney === 'PREVENTION' ? undefined : (disclaimerAccepted ? new Date().toISOString() : undefined)
    });

    if (success) {
      showToast(t('auth.onboardingSuccess', 'Onboarding profile completed successfully!'), 'success');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8 relative">
      {/* Top Header Language Selector */}
      <div className="absolute top-[max(1rem,calc(env(safe-area-inset-top,0px)+12px))] right-4 sm:right-6 z-30">
        <LanguageSelector variant="dropdown" />
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-4 bg-primary-light text-primary rounded-[2rem] mb-4 shadow-soft">
            {branding.appLogoUrl ? (
              <img 
                src={branding.appLogoUrl.startsWith('http') ? branding.appLogoUrl : `${apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl}${branding.appLogoUrl.startsWith('/') ? '' : '/'}${branding.appLogoUrl}`} 
                alt="Logo" 
                className="h-20 w-20 object-contain rounded-2xl" 
              />
            ) : (
              <img 
                src="/icon.png" 
                alt="Logo" 
                className="h-20 w-20 object-contain rounded-2xl" 
              />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('auth.completeProfile', 'Complete Profile')}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t('auth.tellUsAboutYourself', 'Please tell us a bit about yourself to customize your preventive lifestyle journey.')}</p>
          <div className="mt-2 text-xs font-semibold text-slate-400">
            {t('auth.phoneVerified', { phone: user?.mobileNumber || '' }, `Phone Verified: ${user?.mobileNumber}`)}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-danger rounded-2xl text-xs font-semibold border border-red-100">
            {error}
          </div>
        )}

        {/* Step Indicator Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 ? (
            /* STEP 1: Basic details */
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('profile.fullName')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('auth.emailOptional', 'Email address (Optional)')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{t('auth.emailUsageNotice', 'Used for security alerts and generating weekly reports.')}</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-center text-sm cursor-pointer"
                >
                  {t('nav.logout', 'Log Out')}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-2xl shadow-soft flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{t('auth.continue', 'Continue')}</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Clinical demographics */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('profile.gender')}</label>
                  <select
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                  >
                    <option value="" disabled>{t('selectGenderLabel')}</option>
                    <option value="Male">{t('genderMale')}</option>
                    <option value="Female">{t('genderFemale')}</option>
                    <option value="Other">{t('genderOther')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('auth.ageYears', 'Age (Years)')}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="10"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('auth.heightCm', 'Height (cm)')}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="100"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('auth.weightKg', 'Weight (kg)')}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="30"
                    max="200"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center space-x-1">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <span>{t('activityLevelLabel')}</span>
                </label>
                <select
                  value={activityLevel}
                  onChange={(e: any) => setActivityLevel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                >
                  <option value="" disabled>{t('selectActivityLevel')}</option>
                  <option value="Sedentary">{t('actSedentary')}</option>
                  <option value="Lightly active">{t('actLight')}</option>
                  <option value="Moderately active">{t('actModerate')}</option>
                  <option value="Very active">{t('actVeryActive')}</option>
                </select>
              </div>


              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center space-x-1">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <span>{t('cancerCareJourneyLabel')}</span>
                </label>
                <select
                  value={cancerJourney}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setCancerJourney(val);
                    setDisclaimerAccepted(false);
                    setShowDisclaimer(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
                >
                  <option value="" disabled>{t('selectCancerJourney', 'Select Your Health Focus')}</option>
                  <option value="PREVENTION">{t('modes.preventionTitle', 'Cancer Prevention')}</option>
                  <option value="TREATMENT">{t('modes.treatmentTitle', 'Cancer Treatment')}</option>
                  <option value="SECONDARY_PREVENTION">{t('modes.secondaryPreventionTitle', 'Secondary Prevention')}</option>
                  <option value="AGEING">{t('modes.ageingTitle', 'Ageing & Longevity')}</option>
                  <option value="PCOD">{t('modes.pcodTitle', 'PCOD / PCOS Care')}</option>
                  <option value="DIABETES">{t('modes.diabetesTitle', 'Diabetes & Glucose')}</option>
                  <option value="HYPERTENSION">{t('modes.hypertensionTitle', 'Hypertension (HTN)')}</option>
                  <option value="PARKINSON">{t('modes.parkinsonTitle', "Parkinson's Care")}</option>
                  <option value="CARDIAC">{t('modes.cardiacTitle', 'Cardiac Health')}</option>
                </select>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold">
                  <span className={disclaimerAccepted ? 'text-emerald-600' : 'text-rose-500'}>
                    {disclaimerAccepted ? `✓ ${t('profile.disclaimerAccepted', 'Disclaimer Accepted')}` : `✗ ${t('profile.disclaimerNotAccepted', 'Disclaimer Not Accepted')}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDisclaimer(true)}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {t('profile.readDisclaimer', 'Read Disclaimer')}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>{t('common.back', 'Back')}</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !disclaimerAccepted}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-2xl shadow-soft disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? t('common.completing', 'Completing...') : t('auth.finishSetup', 'Finish Setup')}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Disclaimer Modal Overlay */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-xl animate-scaleIn">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
              <span>{t('medicalDisclaimerTitle')}</span>
            </h3>
            <div
              className="max-h-60 overflow-y-auto pr-1 text-xs text-slate-600 font-medium leading-relaxed mb-6 whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: cancerJourney === 'TREATMENT'
                  ? branding.cancerTreatmentDisclaimer
                  : cancerJourney === 'SECONDARY_PREVENTION'
                  ? branding.cancerSecondaryDisclaimer
                  : branding.cancerPreventionDisclaimer
              }}
            ></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(false);
                  setShowDisclaimer(false);
                }}
                className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold order-2 sm:order-1 cursor-pointer"
              >
                {t('common.decline', 'Decline')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(true);
                  setShowDisclaimer(false);
                }}
                className="w-full sm:flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-soft order-1 sm:order-2 cursor-pointer"
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
