import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Activity,
  Sparkles,
  Play,
  Mail,
  User,
  Phone,
  Stethoscope,
  ShoppingCart,
  BrainCircuit,
  Globe,
  Wind,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Languages,
  ChevronRight,
  ArrowRight,
  Droplet,
  RotateCcw,
  Check,
  HeartPulse,
  Smile,
  Menu,
  X,
  Apple,
  Flame
} from 'lucide-react';

const getEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/').split('&')[0];
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
  }
  return url;
};

// Reusable Brand Name component with styled TM symbol
export const BrandName: React.FC<{
  appName?: string;
  className?: string;
  supClassName?: string;
  showTM?: boolean;
}> = ({
  appName = 'Mito_Reboot',
  className = '',
  supClassName = 'text-[0.6em] font-extrabold text-blue-600 ml-0.5 -top-1.5 relative select-none leading-none tracking-normal',
  showTM = true
}) => {
  const formatted = appName ? appName.replace(/_/g, ' ') : 'Mito Reboot';
  return (
    <span className={`inline-flex items-baseline font-inherit ${className}`}>
      <span>{formatted}</span>
      {showTM && <sup className={supClassName}>TM</sup>}
    </span>
  );
};

export default function App() {
  const getInitialTab = (): 'home' | 'privacy-policy' | 'terms-and-conditions' => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('privacy')) return 'privacy-policy';
    if (path.includes('terms')) return 'terms-and-conditions';
    return 'home';
  };

  const [activeTab, setActiveTab] = useState<'home' | 'privacy-policy' | 'terms-and-conditions'>(getInitialTab());

  // Sync URL with tab state so the links are shareable
  useEffect(() => {
    const path = activeTab === 'home' ? '/' : `/${activeTab}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }, [activeTab]);

  // Dynamic Data States
  const [privacyData, setPrivacyData] = useState<string>('Loading privacy policy...');
  const [termsData, setTermsData] = useState<string>('Loading terms of service...');
  const [faqsData, setFaqsData] = useState<any[]>([]);
  const [videosData, setVideosData] = useState<any[]>([]);
  const [foundersData, setFoundersData] = useState<any[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Interactive Mockup Simulator State
  const [simStress, setSimStress] = useState<boolean>(true);
  const [simEnv, setSimEnv] = useState<boolean>(true);
  const [simSugarSpike, setSimSugarSpike] = useState<boolean>(false);
  const [simFasting, setSimFasting] = useState<boolean>(true);
  const [simExercise, setSimExercise] = useState<boolean>(true);
  const [simBreathwork, setSimBreathwork] = useState<boolean>(true);
  const [simAntioxidants, setSimAntioxidants] = useState<boolean>(false);
  const [simJoy, setSimJoy] = useState<boolean>(true);
  const [simMode, setSimMode] = useState<'PREVENTION' | 'TREATMENT'>('PREVENTION');
  const [showSimDisclaimer, setShowSimDisclaimer] = useState<boolean>(false);
  const [showSimWigsPopup, setShowSimWigsPopup] = useState<boolean>(false);

  // Interactive Breathwork Widget State
  const [breathType, setBreathType] = useState<'box' | 'relax' | 'coherent'>('box');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold2'>('inhale');
  const [breathTimer, setBreathTimer] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);

  // Active Disease Module Tab
  const [activeModule, setActiveModule] = useState<'cancer' | 'parkinson' | 'diabetes' | 'cardiac' | 'hypertension' | 'pcod' | 'longevity'>('cancer');

  // Active Regional Language Preview
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'ta' | 'te' | 'kn' | 'hi'>('en');

  const [branding, setBranding] = useState({
    appName: 'Mito_Reboot',
    appTagline: 'Preventive Lifestyle & Cellular Health',
    appLogoUrl: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://api.mitoreboot.in/api');
        const [priv, terms, fq, vid, config, fnd] = await Promise.all([
          fetch(`${baseUrl}/legal/PrivacyPolicy`).then(r => r.json()).catch(() => ({ content: '' })),
          fetch(`${baseUrl}/legal/TermsOfService`).then(r => r.json()).catch(() => ({ content: '' })),
          fetch(`${baseUrl}/faqs?platform=Website`).then(r => r.json()).catch(() => []),
          fetch(`${baseUrl}/videos`).then(r => r.json()).catch(() => []),
          fetch(`${baseUrl}/config/public`).then(r => r.json()).catch(() => ({})),
          fetch(`${baseUrl}/founders`).then(r => r.json()).catch(() => [])
        ]);
        if (priv.content) setPrivacyData(priv.content);
        if (terms.content) setTermsData(terms.content);
        setFaqsData(fq && fq.length > 0 ? fq : defaultFaqs);
        setFoundersData(fnd);
        const webVideos = vid && vid.length > 0 ? vid.filter((v: any) => v.targetPlatform === 'Website' || v.targetPlatform === 'Both') : [];
        setVideosData(webVideos.length > 0 ? webVideos : vid);
        if (config.appName) {
          const formattedName = config.appName.replace(/_/g, ' ');
          const tagline = (!config.appTagline || config.appTagline === 'The circadian fasting app') ? 'Preventive Lifestyle & Cellular Health' : config.appTagline;
          setBranding({
            appName: config.appName,
            appTagline: tagline,
            appLogoUrl: config.appLogoUrl || ''
          });
          document.title = `${formattedName}™ - ${tagline}`;
        }
      } catch (err) {
        console.error('Failed to load dynamic content', err);
        setFaqsData(defaultFaqs);
      }
    };
    fetchData();
  }, []);

  // Vagus Nerve Breathing Simulator Timer Loop
  useEffect(() => {
    if (!isBreathingActive) return;

    const interval = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          if (breathType === 'box') {
            if (breathPhase === 'inhale') { setBreathPhase('hold'); return 4; }
            if (breathPhase === 'hold') { setBreathPhase('exhale'); return 4; }
            if (breathPhase === 'exhale') { setBreathPhase('hold2'); return 4; }
            if (breathPhase === 'hold2') { setBreathPhase('inhale'); return 4; }
          } else if (breathType === 'relax') {
            if (breathPhase === 'inhale') { setBreathPhase('hold'); return 7; }
            if (breathPhase === 'hold') { setBreathPhase('exhale'); return 8; }
            if (breathPhase === 'exhale') { setBreathPhase('inhale'); return 4; }
          } else if (breathType === 'coherent') {
            if (breathPhase === 'inhale') { setBreathPhase('exhale'); return 5.5; }
            if (breathPhase === 'exhale') { setBreathPhase('inhale'); return 5.5; }
          }
          return 4;
        }
        return Number((prev - 0.5).toFixed(1));
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase, breathType]);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://api.mitoreboot.in/api');
      const res = await fetch(`${baseUrl}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactName, email: contactEmail, mobile: contactMobile, question: contactMessage })
      });
      if (res.ok) {
        setFormSuccess(true);
        setContactName('');
        setContactEmail('');
        setContactMobile('');
        setContactMessage('');
        setTimeout(() => setFormSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Damage vs Repair Calculation
  const damageScore = (simStress ? 1 : 0) + (simEnv ? 1 : 0) + (simSugarSpike ? 1 : 0);
  const repairScore = (simFasting ? 1 : 0) + (simExercise ? 1 : 0) + (simBreathwork ? 1 : 0) + (simAntioxidants ? 1 : 0) + (simJoy ? 1 : 0);
  const netBalance = repairScore - damageScore;

  if (activeTab === 'privacy-policy') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header activeTab={activeTab} onTabChange={setActiveTab} branding={branding} foundersCount={0} />
        <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12 bg-white rounded-3xl border border-slate-200 shadow-soft mt-8 mb-12">
          <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Privacy Policy for <BrandName appName={branding.appName} />
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">v5.9.0 Legal</span>
          </div>
          <div
            className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium space-y-4 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: privacyData }}
          />
        </main>
        <Footer onTabChange={setActiveTab} branding={branding} hasFounders={false} />
      </div>
    );
  }

  if (activeTab === 'terms-and-conditions') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header activeTab={activeTab} onTabChange={setActiveTab} branding={branding} foundersCount={0} />
        <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12 bg-white rounded-3xl border border-slate-200 shadow-soft mt-8 mb-12">
          <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Terms & Conditions for <BrandName appName={branding.appName} />
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">v5.9.0 Legal</span>
          </div>
          <div
            className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium space-y-4 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: termsData }}
          />
        </main>
        <Footer onTabChange={setActiveTab} branding={branding} hasFounders={false} />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Sticky Header Navigation */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} branding={branding} foundersCount={foundersData.length} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-indigo-50/20 to-white pt-12 pb-20 px-4 sm:px-6 md:pt-20 md:pb-28">
        {/* Floating Glowing Ambient Orbs */}
        <div className="absolute top-12 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full filter blur-3xl pointer-events-none animate-pulse-subtle"></div>
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-teal-400/15 rounded-full filter blur-3xl pointer-events-none animate-pulse-subtle"></div>
        <div className="absolute top-2/3 left-10 w-72 h-72 bg-purple-400/15 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Spotlight Release Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-blue-200/80 shadow-xs backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
                v5.9.0 Released
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-bold text-slate-600">
                Cellular Balance • CGM • Active Cancer Care
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Master Your Cellular Health & Longevity with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">
                <BrandName appName={branding.appName} />
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
              Log daily habits, upload Abbott FreeStyle Libre CGM sensors, track environmental carcinogens, practice vagus nerve breathwork, and balance cellular damage vs repair to reset metabolic vitality.
            </p>

            {/* Key feature pills */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold text-slate-700">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                Damage vs Repair Engine
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-teal-600" />
                Abbott CGM Spikes
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-indigo-600" />
                Vagus Breathwork
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-purple-600" />
                5 Regional Languages
              </span>
            </div>

            {/* App Store Download Badges */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="https://apps.apple.com/in/app/mito-reboot/id6783705985"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-slate-950 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl hover:translate-y-[-2px] border border-slate-800"
              >
                <Smartphone className="h-6 w-6 text-white group-hover:scale-105 transition-transform" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider leading-tight">Download on the</span>
                  <span className="text-sm font-bold block leading-none">App Store</span>
                </div>
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=com.mitoreboot.app"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-slate-950 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl hover:translate-y-[-2px] border border-slate-800"
              >
                <Play className="h-6 w-6 fill-white text-white group-hover:scale-105 transition-transform" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider leading-tight">Get it on</span>
                  <span className="text-sm font-bold block leading-none">Google Play</span>
                </div>
              </a>

              <a
                href="#interactive-simulator"
                className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-soft flex items-center gap-2 transition-all"
              >
                <span>Try Live Simulator</span>
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-2">
              <div className="flex -space-x-2">
                <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">M</span>
                <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center">R</span>
                <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">C</span>
              </div>
              <span>Trusted by 10,000+ individuals seeking preventive metabolic health & chronic disease reversal</span>
            </div>
          </div>

          {/* Interactive Mobile Simulator Device */}
          <div id="interactive-simulator" className="lg:col-span-5 flex justify-center">
            <div className="bg-slate-950 p-4 rounded-[46px] shadow-2xl border-[5px] border-slate-800 max-w-[360px] w-full relative overflow-hidden select-none">
              {/* Dynamic Island / Camera Notch */}
              <div className="absolute top-0 inset-x-0 h-5 flex justify-center z-30">
                <div className="bg-slate-950 w-28 h-4 rounded-b-xl flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-slate-900 mr-2"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-900/60"></div>
                </div>
              </div>

              {/* Simulated Screen Body */}
              <div className="bg-slate-50 rounded-[34px] overflow-hidden p-4 pt-6 text-left font-sans relative min-h-[500px] flex flex-col justify-between border border-slate-800/40">
                <div>
                  {/* Simulated App Header */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-xs">
                        <span className="text-[11px] text-white font-black">M</span>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <span className="text-xs font-extrabold text-slate-900 tracking-tight leading-none">
                            {branding.appName.replace(/_/g, ' ')}
                          </span>
                          <sup className="text-[6.5px] font-black text-blue-600 ml-0.5 -top-1 relative">TM</sup>
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold block">v5.9.0 Active</span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                      Pro
                    </span>
                  </div>

                  {/* Mode Switcher Toggle: Prevention vs Active Cancer Treatment */}
                  <div className="bg-slate-200/80 rounded-xl p-1 mb-3 flex text-[10px] font-extrabold">
                    <button
                      onClick={() => { setSimMode('PREVENTION'); setShowSimDisclaimer(false); }}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                        simMode === 'PREVENTION'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Prevention
                    </button>
                    <button
                      onClick={() => setSimMode('TREATMENT')}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                        simMode === 'TREATMENT'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Active Cancer Care
                    </button>
                  </div>

                  {/* Active Focus Header */}
                  <div className={`rounded-xl p-2.5 text-[10px] font-bold mb-3 text-white flex justify-between items-center transition-colors ${
                    simMode === 'PREVENTION' ? 'bg-indigo-600' : 'bg-emerald-600'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{simMode === 'PREVENTION' ? 'Lifestyle & Recurrence Defense' : 'Chemo Tolerance & Organ Care'}</span>
                    </span>
                    <span className="text-[8px] bg-white/25 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                      Live
                    </span>
                  </div>

                  {/* Cellular Balance Tug-of-War Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">
                          Cellular Balance Score
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-2xl font-black ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {netBalance > 0 ? `+${netBalance}` : netBalance}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {netBalance >= 2 ? 'Optimal Autophagy' : netBalance >= 0 ? 'Neutral Equilibrium' : 'Damage Dominated'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Abbott CGM Sync
                      </span>
                    </div>

                    {/* Balance Bar Indicator */}
                    <div>
                      <div className="flex justify-between text-[8px] font-extrabold uppercase mb-1">
                        <span className="text-rose-600">Damage Force ({damageScore})</span>
                        <span className="text-emerald-600">Repair Force ({repairScore})</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          className="bg-rose-500 transition-all duration-500 ease-out"
                          style={{ width: `${((damageScore / (damageScore + repairScore || 1))) * 100}%` }}
                        ></div>
                        <div
                          className="bg-emerald-500 transition-all duration-500 ease-out flex-1"
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Habit Logging Matrix */}
                  <div className="mt-2.5">
                    <p className="text-[8px] text-center font-bold text-indigo-600 uppercase tracking-wider mb-2">
                      👇 Tap any habit below to adjust balance:
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      {/* Damage Column */}
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest block pl-1">
                          Cellular Damage
                        </span>
                        <button
                          type="button"
                          onClick={() => setSimStress(!simStress)}
                          className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all cursor-pointer ${
                            simStress ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400 font-medium'
                          }`}
                        >
                          <span>Chronic Stress</span>
                          <span className="font-extrabold text-[10px]">{simStress ? '-1' : '+0'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSimEnv(!simEnv)}
                          className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all cursor-pointer ${
                            simEnv ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400 font-medium'
                          }`}
                        >
                          <span>PM2.5 / PFAS Toxins</span>
                          <span className="font-extrabold text-[10px]">{simEnv ? '-1' : '+0'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSimSugarSpike(!simSugarSpike)}
                          className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all cursor-pointer ${
                            simSugarSpike ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400 font-medium'
                          }`}
                        >
                          <span>CGM Glucose Spike</span>
                          <span className="font-extrabold text-[10px]">{simSugarSpike ? '-1' : '+0'}</span>
                        </button>
                      </div>

                      {/* Repair Column */}
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block pl-1">
                          Cellular Repair
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (simMode === 'TREATMENT' && !simFasting) {
                              setShowSimDisclaimer(true);
                            } else {
                              setSimFasting(!simFasting);
                            }
                          }}
                          className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all cursor-pointer ${
                            simFasting ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400 font-medium'
                          }`}
                        >
                          <span>Autophagy Fasting</span>
                          <span className="font-extrabold text-[10px]">{simFasting ? '+1' : '+0'}</span>
                        </button>

                        {simMode === 'TREATMENT' ? (
                          <button
                            type="button"
                            onClick={() => setShowSimWigsPopup(true)}
                            className="w-full p-2 rounded-xl text-left border border-purple-300 bg-purple-50 text-purple-800 font-bold flex justify-between items-center transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            <span>Scalp Caps & Wigs 🛍️</span>
                            <span className="text-[8px] uppercase bg-purple-200 px-1 py-0.5 rounded font-black">Shop</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSimExercise(!simExercise)}
                            className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all cursor-pointer ${
                              simExercise ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400 font-medium'
                            }`}
                          >
                            <span>Mito Zone 2 Cardio</span>
                            <span className="font-extrabold text-[10px]">{simExercise ? '+1' : '+0'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSimBreathwork(!simBreathwork)}
                          className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all cursor-pointer ${
                            simBreathwork ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400 font-medium'
                          }`}
                        >
                          <span>Vagus Breathwork</span>
                          <span className="font-extrabold text-[10px]">{simBreathwork ? '+1' : '+0'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSimAntioxidants(!simAntioxidants)}
                          className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all cursor-pointer ${
                            simAntioxidants ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400 font-medium'
                          }`}
                        >
                          <span>Mito Antioxidants</span>
                          <span className="font-extrabold text-[10px]">{simAntioxidants ? '+1' : '+0'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSimJoy(!simJoy)}
                          className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all cursor-pointer ${
                            simJoy ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400 font-medium'
                          }`}
                        >
                          <span>Things I Love</span>
                          <span className="font-extrabold text-[10px]">{simJoy ? '+1' : '+0'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Status bar */}
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[8px] text-slate-400 font-bold">
                  <span>Mito Reboot™ Engine v5.9.0</span>
                  <span className="text-emerald-600 font-extrabold">● Sync Active</span>
                </div>

                {/* Simulated Medical Fasting Disclaimer Popup */}
                {showSimDisclaimer && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs z-40 flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 max-w-[270px] w-full text-center space-y-2.5 shadow-2xl animate-in zoom-in-95 duration-150">
                      <div className="h-8 w-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-sm font-black">⚠️</div>
                      <h4 className="text-[11px] font-black text-slate-900 uppercase">Oncology Fasting Disclaimer</h4>
                      <p className="text-[9px] text-slate-600 leading-relaxed font-medium">
                        Intermittent fasting during active chemotherapy is experimental. Always consult your oncology team before initiating fasting protocols.
                      </p>
                      <div className="flex flex-col gap-1.5 text-[9px] font-bold pt-1">
                        <button
                          type="button"
                          onClick={() => { setSimFasting(true); setShowSimDisclaimer(false); }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer shadow-sm"
                        >
                          I Understand & Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSimDisclaimer(false)}
                          className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulated Shop Popup */}
                {showSimWigsPopup && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs z-40 flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 max-w-[270px] w-full text-center space-y-3 shadow-2xl animate-in zoom-in-95 duration-150">
                      <div className="h-9 w-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto text-base">🛍️</div>
                      <h4 className="text-[11px] font-black text-slate-900 uppercase">Curated Safe Living Store</h4>
                      <p className="text-[9px] text-slate-600 leading-relaxed font-medium">
                        Filtered for cancer care scalp cooling caps, chemical-free natural wigs, and targeted antioxidants to support treatment recovery.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSimWigsPopup(false)}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                      >
                        Understood!
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "What's New in v5.9.0" Highlights Strip */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md shrink-0">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                  Major Release
                </span>
                <span className="text-xs font-bold text-amber-200">v5.9.0 Live on Stores</span>
              </div>
              <p className="text-sm font-black text-white mt-0.5">
                Discover what's new in <BrandName appName={branding.appName} supClassName="text-[0.6em] font-extrabold text-amber-200 ml-0.5 -top-1 relative" />: Active Cancer Care Mode, Vagus Nerve Breathwork, Parkinson's Support, and Full Regional Language Localization.
              </p>
            </div>
          </div>
          <a
            href="#modules"
            className="shrink-0 bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Explore All Features</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Interactive Vagus Nerve Breathwork Experience Section */}
      <section id="breathwork" className="py-20 px-4 sm:px-6 bg-slate-900 text-white relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full mb-3 border border-indigo-500/30">
            <Wind className="h-3.5 w-3.5" />
            <span>Interactive Web Experience</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Vagus Nerve Stimulating Breathwork
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-medium max-w-2xl mx-auto mt-2">
            Experience our in-app breathing pacer right now. Stimulate the vagus nerve, activate the parasympathetic nervous system, and blunt glucose-elevating cortisol spikes in minutes.
          </p>

          {/* Breath Pattern Selector */}
          <div className="inline-flex p-1 bg-slate-800/80 rounded-2xl border border-slate-700/80 mt-8 mb-10 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => { setBreathType('box'); setBreathPhase('inhale'); setBreathTimer(4); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                breathType === 'box' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Box (4-4-4-4)
            </button>
            <button
              type="button"
              onClick={() => { setBreathType('relax'); setBreathPhase('inhale'); setBreathTimer(4); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                breathType === 'relax' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              4-7-8 Deep Calm
            </button>
            <button
              type="button"
              onClick={() => { setBreathType('coherent'); setBreathPhase('inhale'); setBreathTimer(5.5); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                breathType === 'coherent' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Coherent (5.5s)
            </button>
          </div>

          {/* Animated Breathwork Circle */}
          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
              {/* Pulsing Ripple rings */}
              <div
                className={`absolute inset-0 rounded-full border-2 border-blue-500/30 transition-all duration-1000 ${
                  isBreathingActive && breathPhase === 'inhale' ? 'scale-110 opacity-70' : 'scale-90 opacity-20'
                }`}
              ></div>
              <div
                className={`absolute inset-4 rounded-full border border-teal-500/20 transition-all duration-1000 ${
                  isBreathingActive && (breathPhase === 'hold' || breathPhase === 'hold2') ? 'scale-105 opacity-80' : 'scale-95 opacity-30'
                }`}
              ></div>

              {/* Main Core Circle */}
              <div
                className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center p-6 transition-all duration-1000 shadow-2xl ${
                  breathPhase === 'inhale'
                    ? 'bg-gradient-to-tr from-blue-600 to-teal-500 scale-105 shadow-glow-blue'
                    : breathPhase === 'hold' || breathPhase === 'hold2'
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 scale-100 shadow-glow-emerald'
                    : 'bg-gradient-to-tr from-slate-800 to-slate-700 scale-90'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                  {!isBreathingActive ? 'Ready' : breathPhase === 'inhale' ? 'Breathe In' : breathPhase === 'hold' || breathPhase === 'hold2' ? 'Hold Gently' : 'Release Slowly'}
                </span>
                <span className="text-4xl sm:text-5xl font-black text-white mt-1 tabular-nums">
                  {!isBreathingActive ? '4.0s' : `${breathTimer}s`}
                </span>
                <span className="text-[9px] font-bold text-white/70 mt-1 uppercase tracking-wider">
                  {breathType.toUpperCase()} MODE
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className={`px-6 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition-all shadow-lg cursor-pointer flex items-center gap-2 ${
                  isBreathingActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isBreathingActive ? 'Pause Breathwork' : 'Start Breath Session'}
              </button>
              <button
                type="button"
                onClick={() => { setIsBreathingActive(false); setBreathPhase('inhale'); setBreathTimer(4); }}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
                title="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-4 max-w-md">
              Synchronized with auditory guidance, vibration feedback, and daily reminders in the <BrandName appName={branding.appName} supClassName="text-[0.6em] font-extrabold text-blue-400 ml-0.5 -top-1 relative" /> mobile app.
            </p>
          </div>
        </div>
      </section>

      {/* Chronic Disease Reversal & Care Modules Interactive Showcase */}
      <section id="modules" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 border border-blue-200/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Specialized Clinical Protocols</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Targeted Modules for Chronic Disease Reversal
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            Whether you are preventing disease or navigating active medical care, <BrandName appName={branding.appName} /> provides evidence-based, doctor-formulated lifestyle guidance.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { id: 'cancer', label: 'Active Cancer Care', icon: <Sparkles className="h-4 w-4" /> },
            { id: 'parkinson', label: "Parkinson's Support", icon: <BrainCircuit className="h-4 w-4" /> },
            { id: 'diabetes', label: 'Diabetes & Abbott CGM', icon: <Activity className="h-4 w-4" /> },
            { id: 'cardiac', label: 'Cardiac & Lipids', icon: <Heart className="h-4 w-4" /> },
            { id: 'hypertension', label: 'Hypertension & BP', icon: <HeartPulse className="h-4 w-4" /> },
            { id: 'pcod', label: 'PCOD / PCOS Balance', icon: <Smile className="h-4 w-4" /> },
            { id: 'longevity', label: 'Longevity & Autophagy', icon: <Flame className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveModule(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeModule === tab.id
                  ? 'bg-blue-600 text-white shadow-md scale-102'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Module Content Card */}
        <div className="bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-soft">
          {activeModule === 'cancer' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                  New in v5.9.0 • Oncology Support
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Active Cancer Treatment & Tolerance Protocol
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Designed alongside oncologists to support patients through chemotherapy, radiation, and recovery. Safeguards non-cancerous cells, mitigates debilitating fatigue, and defends against secondary recurrence.
                </p>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Experimental fasting protocols coordinated around infusion days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Direct access to oncologists, scalp cooling caps, and chemical-free wigs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Strict microplastic and carcinogen exposure filters</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Focus Mode Active</span>
                  <span className="text-xs font-extrabold text-pink-600 bg-pink-50 px-2 py-0.5 rounded">Cancer Care</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-extrabold text-slate-900 block">Organ & Gut Shield</span>
                    <span className="text-slate-500 text-[11px]">Mitigate GI mucositis and protect liver/kidney filtration capacity.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-extrabold text-slate-900 block">Recurrence Defense</span>
                    <span className="text-slate-500 text-[11px]">Continuous glycemic stabilization to eliminate metabolic fuels for aberrant cells.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'parkinson' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  Neuro-Protection • Localized UI
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Parkinson's Disease Management & UPDRS Tracking
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Track motor symptoms (tremors, bradykinesia, rigidity) alongside non-motor markers (sleep quality, autonomic bowel motility, mood).
                </p>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Dopamine-supportive nutrition & amino acid timing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Mitochondrial biogenesis stimulation for substantia nigra neurons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Fully localized in English, தமிழ், తెలుగు, ಕನ್ನಡ, and हिन्दी</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">UPDRS Daily Log</span>
                  <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Motor Stability: 92%</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
                  <span className="font-extrabold text-purple-950 block">Mitochondrial CoQ10 & Polyphenol Protocol</span>
                  <span className="text-purple-800 text-[11px]">Tracked alongside levodopa timing to optimize cross-blood-brain-barrier absorption.</span>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'diabetes' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  Metabolic Reversal • Abbott CGM Sync
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Type 2 Diabetes Reversal & Abbott FreeStyle Libre Sync
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Continuous glucose monitoring is the cornerstone of metabolic repair. Upload your Abbott CSV or PDF sensor records directly into <BrandName appName={branding.appName} /> to classify meal spikes into Safe, Moderate, or Dangerous.
                </p>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Time In Range (TIR 70-140 mg/dL) optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Automated food matching to eliminate silent insulin-triggering meals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Circadian eating windows that lower HbA1c sustainably</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Abbott Sensor Telemetry</span>
                  <span className="text-xs font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">TIR: 94%</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-600">Morning Fasting Average:</span>
                    <span className="text-slate-900">92 mg/dL</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-600">Postprandial Peak:</span>
                    <span className="text-emerald-600">128 mg/dL (Safe)</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-600">Insulin Sensitivity Score:</span>
                    <span className="text-blue-600">A+ High</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'cardiac' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  Cardiovascular Longevity
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  ApoB, Lipid Panels & Arterial Flexibility
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Go beyond standard cholesterol. Track ApoB particle counts, triglycerides-to-HDL ratios, resting heart rate, and heart rate variability (HRV) to protect endothelial integrity.
                </p>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Atherosclerotic cardiovascular plaque risk reduction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Zone 2 aerobic interval prescription for mitochondrial density</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Cardiovascular Health</span>
                  <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">HRV: 68 ms</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs">
                  <span className="font-extrabold text-rose-950 block">Endothelial Nitric Oxide Protocol</span>
                  <span className="text-rose-800 text-[11px]">Targeted nitrate-rich dietary plans to naturally dilate blood vessels.</span>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'hypertension' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Vascular Tone & Blood Pressure
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Hypertension Control & Endothelial Restoration
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Reduce arterial stiffness through vagus nerve stimulation, DASH sodium-potassium balance, and continuous stress management.
                </p>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Daily Morning & Evening Blood Pressure logs with AI trend prediction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Instant autonomic nervous system reset via coherent breathing</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Target Range</span>
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">118/76 mmHg</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                  <span className="font-extrabold text-blue-950 block">Potassium-to-Sodium Mineral Sync</span>
                  <span className="text-blue-800 text-[11px]">Real-time feedback on mineral intake to prevent microvascular strain.</span>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'pcod' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Hormonal Metabolic Balance
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  PCOD / PCOS & Androgen Regulation
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  PCOD is rooted in underlying insulin resistance and chronic low-grade inflammation. Synchronize your ovarian cycle phases with circadian intermittent fasting.
                </p>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Luteal vs Follicular phase nutrition planning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Endocrine disruptor avoidance (BPA, phthalates, parabens)</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Cycle Phase</span>
                  <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Follicular (Day 9)</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-xs">
                  <span className="font-extrabold text-amber-950 block">Insulin-Sensitizing Inositol Protocol</span>
                  <span className="text-amber-800 text-[11px]">Balances LH/FSH ratios and encourages spontaneous ovulation.</span>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'longevity' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  Cellular Rejuvenation & Anti-Ageing
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Mitochondrial Biogenesis & Autophagy Activation
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Clean up senescent, malfunctioning cells through intermittent fasting-induced autophagy. Boost cellular NAD+ pools, protect telomeres, and optimize biological age markers.
                </p>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Autophagy timer tracking cellular recycling thresholds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Targeted sirtuin activators and heat shock protein logs</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Autophagy Hours</span>
                  <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">16h 45m Active</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                  <span className="font-extrabold text-indigo-950 block">Mitochondrial Turn-over Status</span>
                  <span className="text-indigo-800 text-[11px]">Deep cellular cleanout active; senescent cellular debris degraded into amino acids.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Environmental Carcinogen & Clean Living Audit Section */}
      <section id="environmental" className="py-20 px-4 sm:px-6 bg-slate-100/70 border-y border-slate-200/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-3 border border-emerald-200/80">
              <Globe className="h-3.5 w-3.5" />
              <span>Clean Living & Toxin Defense</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Environmental Carcinogens & Cookware Audit
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
              You cannot reverse disease if your environment is continuously poisoning your cellular mitochondria. <BrandName appName={branding.appName} /> screens your everyday surroundings.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3 hover:translate-y-[-4px] transition-all">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                <Wind className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">PM2.5 & Air Toxins</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Log regional AQI and indoor particulate matter. Actionable triggers for HEPA air purifiers and nasal antioxidant washes.
              </p>
              <span className="text-[10px] font-black uppercase text-indigo-600 block pt-1">Audited Daily</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3 hover:translate-y-[-4px] transition-all">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black">
                <Droplet className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Drinking Water Contaminants</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Screen municipal tap water for heavy metals (lead, arsenic), chlorine, fluoride, and microplastics. Direct water filter kits.
              </p>
              <span className="text-[10px] font-black uppercase text-teal-600 block pt-1">RO / Carbon Guidance</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3 hover:translate-y-[-4px] transition-all">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Teflon & PFAS Cookware</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Eliminate forever chemicals from scratched non-stick pans. Swap to 304 food-grade stainless steel, cast iron, and 100% pure ceramic.
              </p>
              <span className="text-[10px] font-black uppercase text-rose-600 block pt-1">Kitchen Audit</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3 hover:translate-y-[-4px] transition-all">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                <Apple className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Pesticides & Dirty Dozen</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Review annual chemical pesticide residue guides for produce. Learn baking soda washes to degrade organophosphates on fruit skins.
              </p>
              <span className="text-[10px] font-black uppercase text-amber-600 block pt-1">Produce Safety</span>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Lingual Regional Support Interactive Section */}
      <section id="languages" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 rounded-[36px] p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 text-blue-200 text-xs font-bold rounded-full backdrop-blur-md">
              <Languages className="h-3.5 w-3.5" />
              <span>5 Regional Languages Supported</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Health Insights in Your Mother Tongue
            </h2>
            <p className="text-sm sm:text-base text-blue-100/80 font-medium leading-relaxed">
              Medical knowledge should have no language barriers. <BrandName appName={branding.appName} supClassName="text-[0.6em] font-extrabold text-amber-300 ml-0.5 -top-1 relative" /> is completely localized across English, Tamil, Telugu, Kannada, and Hindi.
            </p>
          </div>

          {/* Interactive Language Selector Tabs */}
          <div className="flex flex-wrap gap-2.5 my-8">
            {[
              { code: 'en', label: 'English', native: 'English' },
              { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
              { code: 'te', label: 'Telugu', native: 'తెలుగు' },
              { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
              { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setPreviewLanguage(lang.code as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  previewLanguage === lang.code
                    ? 'bg-white text-blue-950 shadow-lg scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                <span>{lang.native}</span>
                <span className="text-[9px] opacity-70 font-semibold">({lang.label})</span>
              </button>
            ))}
          </div>

          {/* Localized Sample Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 max-w-2xl text-left space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
              In-App Preview ({previewLanguage.toUpperCase()})
            </span>
            <p className="text-base sm:text-lg font-bold text-white leading-snug">
              {previewLanguage === 'en' && '“Master your cellular health, track continuous glucose spikes, and balance damage vs repair every single day.”'}
              {previewLanguage === 'ta' && '“உங்கள் செல்லுலார் ஆரோக்கியத்தை மேம்படுத்தி, ரத்த சர்க்கரை அளவை துல்லியமாக கண்காணிக்கவும்.”'}
              {previewLanguage === 'te' && '“మీ సెల్యులార్ ఆరోగ్యాన్ని బలోపేతం చేయండి, నిరంతర గ్లూకోజ్ స్థాయిలను ట్రాక్ చేయండి.”'}
              {previewLanguage === 'kn' && '“ನಿಮ್ಮ ಸೆಲ್ಯುಲಾರ್ ಆರೋಗ್ಯವನ್ನು ಸುಧಾರಿಸಿ ಮತ್ತು ನಿರಂತರ ಗ್ಲೂಕೋಸ್ ಮಟ್ಟವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.”'}
              {previewLanguage === 'hi' && '“अपने सेलुलर स्वास्थ्य को बेहतर बनाएं, ग्लूकोज स्पाइक्स को ट्रैक करें और बीमारी को मात दें।”'}
            </p>
            <span className="text-xs text-blue-200/70 font-medium block pt-1">
              Switch anytime from the app header or profile with instant language synchronization.
            </span>
          </div>
        </div>
      </section>

      {/* Application Screenshots Showcase Section */}
      <section id="screenshots" className="bg-slate-50 py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 border border-blue-200/80">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Native Mobile Experience</span>
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">Application Screens</h2>
            <p className="text-sm text-slate-500 font-semibold mt-2">
              Designed with medical clarity, accessibility, and high contrast for daily tracking.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
            {[
              { title: '1. Secure Access', file: '/screenshot_login.png', desc: 'Encrypted Biometric & OTP Login' },
              { title: '2. Dashboard', file: '/screenshot_dashboard.png', desc: 'Cellular Damage vs Repair' },
              { title: '3. CGM Analytics', file: '/screenshot_reports.png', desc: 'Continuous Abbott Telemetry' },
              { title: '4. Food & Spike Log', file: '/screenshot_foodlog.png', desc: 'Safe vs Dangerous Meals' },
              { title: '5. Deep Analysis', file: '/screenshot_analysis.png', desc: 'Predictive Glucose Trends' }
            ].map((scr, idx) => (
              <div
                key={idx}
                className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-soft hover:shadow-card hover:translate-y-[-4px] transition-all"
              >
                <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  {scr.title}
                </span>
                <div className="aspect-[9/16] bg-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden shadow-inner relative group">
                  <img
                    src={scr.file}
                    alt={scr.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-600 block mt-2 text-center truncate">
                  {scr.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curated Clean Living Store Section */}
      <section id="store" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full mb-3 border border-amber-200/80">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>In-App Wellness Store</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Curated Products for Toxin-Free Living
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            Avoid counterfeit sensors and harmful kitchenware. Order verified products vetted directly by the <BrandName appName={branding.appName} /> clinical team.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">Metabolic Hardware</span>
              <h3 className="text-lg font-bold text-slate-900">Abbott FreeStyle Libre Sensors</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                14-day continuous glucose monitoring patches with protective waterproof shields and sensor applicators.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-400">In-App Delivery</span>
              <span className="text-blue-600">Available in App →</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">Cancer Care Specialty</span>
              <h3 className="text-lg font-bold text-slate-900">Scalp Cooling Caps & Natural Wigs</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Medical-grade scalp hypothermia caps to preserve follicles during chemotherapy, plus hypoallergenic wigs.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-400">Oncology Approved</span>
              <span className="text-blue-600">Available in App →</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Environmental Safety</span>
              <h3 className="text-lg font-bold text-slate-900">Zero-PFAS Titanium Cookware</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                100% heavy-metal-free, scratch-resistant cookware crafted for oil-free cooking without teflon fumes.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-400">Lab Tested Non-Toxic</span>
              <span className="text-blue-600">Available in App →</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video tutorials & Guides */}
      {videosData.length > 0 && (
        <section id="tutorials" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/60">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 border border-blue-200/80">
              <Play className="h-3.5 w-3.5 fill-blue-600" />
              <span>Video Instructions</span>
            </span>
            <h2 className="text-3xl font-bold text-slate-900">Video Guides & Sensor Setup</h2>
            <p className="text-sm text-slate-500 font-semibold mt-2">
              Step-by-step video instructions on applying sensors, logging meals, and interpreting glucose spikes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {videosData.map((video, idx) => (
              <div key={idx} className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 shadow-soft">
                <div className="aspect-video bg-slate-200 flex items-center justify-center relative">
                  <iframe
                    src={getEmbedUrl(video.url)}
                    className="w-full h-full border-none"
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold text-primary uppercase bg-blue-50 px-2 py-0.5 rounded-full">{video.category}</span>
                  <h4 className="text-base font-bold text-slate-800 mt-2">{video.title}</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Meet Our Founders Section */}
      {foundersData.length > 0 && (
        <section id="founders" className="bg-slate-50 py-20 px-4 sm:px-6 border-t border-slate-200">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full mb-3 border border-indigo-200/80">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Executive Leadership</span>
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Meet Our Founders</h2>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Discover the medical credentials, achievements, and driving vision behind <BrandName appName={branding.appName} />.
              </p>
            </div>

            <div className="space-y-16">
              {foundersData.map((founder, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-soft flex flex-col lg:flex-row gap-8 lg:gap-10 items-stretch">
                  <div className="w-full lg:w-5/12 flex items-center justify-center shrink-0">
                    {founder.videoUrl ? (
                      <div className="w-full aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative">
                        <iframe
                          src={getEmbedUrl(founder.videoUrl)}
                          className="absolute inset-0 w-full h-full border-none"
                          title={`Video of ${founder.name}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex flex-col items-center justify-center border border-slate-200 p-6">
                        <span className="text-5xl mb-2">🩺</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{founder.role}</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-7/12 flex flex-col justify-between space-y-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{founder.name}</h3>
                      <p className="text-sm font-bold text-blue-600 tracking-wide uppercase mt-0.5">{founder.role}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                      <div className="bg-slate-50/70 hover:bg-slate-50 p-5 rounded-2xl border border-slate-200/70 transition-all">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">🎓 Background</span>
                        <p className="leading-relaxed font-medium text-slate-600 whitespace-pre-line">{founder.background}</p>
                      </div>
                      <div className="bg-slate-50/70 hover:bg-slate-50 p-5 rounded-2xl border border-slate-200/70 transition-all">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">🔬 Work Done</span>
                        <p className="leading-relaxed font-medium text-slate-600 whitespace-pre-line">{founder.workDone}</p>
                      </div>
                      <div className="bg-slate-50/70 hover:bg-slate-50 p-5 rounded-2xl border border-slate-200/70 transition-all">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">🏆 Achievements</span>
                        <p className="leading-relaxed font-medium text-slate-600 whitespace-pre-line">{founder.achievements}</p>
                      </div>
                      <div className="bg-slate-50/70 hover:bg-slate-50 p-5 rounded-2xl border border-slate-200/70 transition-all">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">🎯 Mission Solved</span>
                        <p className="leading-relaxed font-medium text-slate-600 whitespace-pre-line">{founder.tryingToSolve}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Frequently Asked Questions Section */}
      <section id="faqs" className="bg-white py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full mb-3 border border-slate-200">
            <span>Got Questions?</span>
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-500 font-semibold mt-2">
            Everything you need to know about <BrandName appName={branding.appName} />, sensor uploads, and clinical modules.
          </p>
        </div>

        <div className="space-y-4">
          {faqsData.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-xs">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center p-5 sm:p-6 text-left hover:bg-slate-100/80 transition-all focus:outline-none cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-800">{faq.question}</span>
                  <span className="text-slate-400 font-bold ml-4 text-xs shrink-0">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>
                {isOpen && (
                  <div
                    className="px-5 sm:px-6 pb-6 pt-2 text-xs sm:text-sm text-slate-600 border-t border-slate-200/60 leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="bg-slate-50 py-20 px-4 sm:px-6 border-t border-slate-200/60">
        <div className="max-w-xl mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-soft">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 border border-blue-200/80">
              <Mail className="h-3.5 w-3.5" />
              <span>We're Here to Help</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Get in Touch</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
              Inquiries regarding <BrandName appName={branding.appName} />? Send us a message or email us directly at{' '}
              <a href="mailto:support@mitoreboot.in" className="text-blue-600 hover:underline">
                support@mitoreboot.in
              </a>.
            </p>
          </div>

          {formSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 text-center flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Thank you! Your inquiry has been forwarded to our support team.</span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Number (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  value={contactMobile}
                  onChange={(e) => setContactMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your Question or Inquiry</label>
              <textarea
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Ask about Abbott sensor uploads, cancer care protocols, or app features..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs h-28 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>{submitting ? 'Submitting Inquiry...' : 'Send Inquiry to Support'}</span>
            </button>
          </form>
        </div>
      </section>

      {/* Footer Legal & Trademark */}
      <Footer onTabChange={setActiveTab} branding={branding} hasFounders={foundersData.length > 0} />
    </div>
  );
}

// Fallback FAQs
const defaultFaqs = [
  {
    question: "How does Mito Reboot™ track Continuous Glucose Monitoring (CGM)?",
    answer: "Mito Reboot™ allows you to upload Abbott FreeStyle Libre sensor export files (CSV or PDF). Our system automatically parses postprandial glucose curves, detects glycemic spikes, and correlates them with your food logs to identify trigger meals."
  },
  {
    question: "What is Active Cancer Care Support Mode?",
    answer: "Active Cancer Care Mode is a specialized app environment tailored for individuals currently undergoing chemotherapy, radiation, or oncological therapies. It focuses on organ protection, managing treatment-induced fatigue, guided fasting safety, and booking consults with oncology specialists."
  },
  {
    question: "How does the Vagus Nerve Breathwork trainer work?",
    answer: "Our interactive breathwork tool provides real-time visual and pacing guidance for Box Breathing (4-4-4-4), 4-7-8 relaxing breath, and Coherent 5.5s resonance. These pacing protocols stimulate the vagus nerve to decrease heart rate, lower cortisol, and blunt blood sugar elevations."
  },
  {
    question: "Which regional languages are supported?",
    answer: "Mito Reboot™ supports 5 complete native languages: English, தமிழ் (Tamil), తెలుగు (Telugu), ಕನ್ನಡ (Kannada), and हिन्दी (Hindi). You can switch your preferred language at any time in the app header or profile settings."
  },
  {
    question: "Is intermittent fasting safe for everyone?",
    answer: "While intermittent fasting stimulates autophagy and cellular cleanup, individuals with active cancer treatments, type 1 diabetes, or pregnant/nursing mothers must consult their treating physician prior to starting. Mito Reboot™ includes interactive medical disclaimers to ensure safe practice."
  }
];

interface BrandingProp {
  appName: string;
  appTagline: string;
  appLogoUrl: string;
}

// STICKY HEADER COMPONENT
const Header: React.FC<{
  activeTab: string;
  onTabChange: (tab: any) => void;
  branding: BrandingProp;
  foundersCount: number;
}> = ({ activeTab, onTabChange, branding, foundersCount }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="glass-panel border-b border-slate-200/80 py-3.5 px-4 sm:px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo & Name with TM */}
        <div
          onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }}
          className="flex items-center space-x-2.5 cursor-pointer select-none"
        >
          {branding.appLogoUrl ? (
            <img src={branding.appLogoUrl} alt="Logo" className="h-7 w-auto object-contain rounded-lg" />
          ) : (
            <img src="/favicon.jpg" alt="Logo" className="h-7 w-auto object-contain rounded-lg shadow-2xs" />
          )}
          <div className="flex flex-col text-left">
            <BrandName
              appName={branding.appName}
              className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none"
            />
            {branding.appTagline && (
              <span className="text-[9px] text-slate-500 font-bold leading-none mt-0.5 hidden sm:block">
                {branding.appTagline}
              </span>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold text-slate-600">
          <a href="#features" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#breathwork" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Breathwork</a>
          <a href="#modules" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Chronic Modules</a>
          <a href="#environmental" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Clean Living</a>
          <a href="#languages" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Languages</a>
          <a href="#screenshots" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Screenshots</a>
          {foundersCount > 0 && (
            <a href="#founders" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Founders</a>
          )}
          <a href="#faqs" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">FAQ</a>
          <a href="#contact" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Contact</a>
        </nav>

        {/* Action Button & Tab Return */}
        <div className="flex items-center space-x-2.5">
          {activeTab !== 'home' ? (
            <button
              type="button"
              onClick={() => onTabChange('home')}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              ← Back to Home
            </button>
          ) : (
            <a
              href="https://play.google.com/store/apps/details?id=com.mitoreboot.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Get Mito Reboot™</span>
            </a>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 text-left font-bold text-sm text-slate-700">
          <a href="#features" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Features</a>
          <a href="#breathwork" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Breathwork</a>
          <a href="#modules" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Chronic Modules</a>
          <a href="#environmental" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Clean Living</a>
          <a href="#languages" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Languages</a>
          <a href="#screenshots" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Screenshots</a>
          <a href="#faqs" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">FAQ</a>
          <a href="#contact" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Contact Us</a>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <a
              href="https://apps.apple.com/in/app/mito-reboot/id6783705985"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Download on iOS App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.mitoreboot.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Download on Google Play
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

// FOOTER COMPONENT
const Footer: React.FC<{
  onTabChange: (tab: any) => void;
  branding: BrandingProp;
  hasFounders: boolean;
}> = ({ onTabChange, branding, hasFounders }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-14 px-4 sm:px-6 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-3 max-w-md text-left">
            <div className="flex items-center space-x-2.5">
              {branding.appLogoUrl ? (
                <img src={branding.appLogoUrl} alt="Logo" className="h-7 w-auto object-contain rounded-lg" />
              ) : (
                <img src="/favicon.jpg" alt="Logo" className="h-7 w-auto object-contain rounded-lg" />
              )}
              <BrandName
                appName={branding.appName}
                className="text-white text-lg font-black tracking-tight"
                supClassName="text-[0.6em] font-extrabold text-blue-400 ml-0.5 -top-1.5 relative"
              />
            </div>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              A science-driven cellular health and chronic disease reversal platform. Empowering individuals with continuous glucose telemetry, vagus breathwork, and environmental carcinogen auditing.
            </p>
            {/* Trademark Legal Notice */}
            <p className="text-[11px] text-slate-500 font-bold">
              © 2026 <BrandName appName={branding.appName} className="text-slate-300" supClassName="text-[0.6em] text-blue-400 -top-1 relative" />. All rights reserved. Mito Reboot™ is a trademark of Mito Reboot.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-left font-semibold">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 block">Product</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><a href="#features" onClick={() => onTabChange('home')} className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#breathwork" onClick={() => onTabChange('home')} className="hover:text-white transition-colors">Vagus Breathwork</a></li>
                <li><a href="#modules" onClick={() => onTabChange('home')} className="hover:text-white transition-colors">Active Cancer Care</a></li>
                <li><a href="#languages" onClick={() => onTabChange('home')} className="hover:text-white transition-colors">5 Regional Languages</a></li>
                <li><a href="#store" onClick={() => onTabChange('home')} className="hover:text-white transition-colors">Clean Living Store</a></li>
                {hasFounders && (
                  <li><a href="#founders" onClick={() => onTabChange('home')} className="hover:text-white transition-colors">Founders</a></li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 block">Legal & Privacy</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><button type="button" onClick={() => onTabChange('privacy-policy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button></li>
                <li><button type="button" onClick={() => onTabChange('terms-and-conditions')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button></li>
                <li><a href="#contact" onClick={() => onTabChange('home')} className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 block">Download App</span>
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href="https://apps.apple.com/in/app/mito-reboot/id6783705985"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold border border-slate-700 flex items-center gap-1.5"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>iOS App Store</span>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.mitoreboot.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold border border-slate-700 flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Google Play Store</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Medical Disclaimer */}
        <div className="pt-6 border-t border-slate-900 text-[10px] text-slate-500 text-center sm:text-left leading-relaxed">
          <p>
            <strong>Medical Disclaimer:</strong> <BrandName appName={branding.appName} supClassName="text-[0.6em] text-slate-400 -top-1 relative" /> is a mobile lifestyle, metabolic tracking, and wellness application. The content, protocols, and suggestions provided are for informational and educational purposes only, and are not intended as a substitute for clinical diagnosis, oncology counsel, or professional medical advice. Always consult your oncologist or healthcare provider before undertaking intensive dietary modifications or experimental fasting.
          </p>
        </div>
      </div>
    </footer>
  );
};
