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
  RotateCcw,
  HeartPulse,
  Smile,
  Menu,
  X,
  Flame,
  TestTube,
  Video,
  Award,
  ChevronDown
} from 'lucide-react';

const CURRENT_APP_VERSION = 'v6.0.7';

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
  const [simMode, setSimMode] = useState<'PREVENTION' | 'TREATMENT'>('PREVENTION');
  const [showSimDisclaimer, setShowSimDisclaimer] = useState<boolean>(false);
  const [showSimWigsPopup, setShowSimWigsPopup] = useState<boolean>(false);
  const [isSimulatorHighlighted, setIsSimulatorHighlighted] = useState<boolean>(false);

  const handleTrySimulator = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('interactive-simulator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setIsSimulatorHighlighted(true);
    setTimeout(() => {
      setIsSimulatorHighlighted(false);
    }, 4500);
  };

  // Smart Deep-Link: Opens app if installed on device, otherwise falls back to App Store / Google Play
  const openAppOrStore = (path = '') => {
    const cleanPath = path.replace(/^\//, '');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);

    const appSchemeUrl = cleanPath ? `mitoreboot://${cleanPath}` : 'mitoreboot://home';
    const appStoreUrl = 'https://apps.apple.com/in/app/mito-reboot/id6742055660';
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.mitoreboot.app';

    if (isAndroid) {
      // Android Intent scheme launches the installed package, or automatically falls back to browser fallback url
      const fallbackParam = encodeURIComponent(playStoreUrl);
      const intentUrl = `intent://${cleanPath}#Intent;scheme=mitoreboot;package=com.mitoreboot.app;S.browser_fallback_url=${fallbackParam};end`;
      window.location.href = intentUrl;
      return;
    }

    if (isIOS) {
      const startTime = Date.now();
      window.location.href = appSchemeUrl;
      setTimeout(() => {
        // If still on the browser page after timeout, app is not installed
        if (Date.now() - startTime < 2500) {
          window.location.href = appStoreUrl;
        }
      }, 1500);
      return;
    }

    // Desktop or other browser
    const startTime = Date.now();
    window.location.href = appSchemeUrl;
    setTimeout(() => {
      if (Date.now() - startTime < 2000) {
        window.open(playStoreUrl, '_blank');
      }
    }, 1200);
  };

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
  const repairScore = (simFasting ? 1 : 0) + (simExercise ? 1 : 0) + (simBreathwork ? 1 : 0) + (simAntioxidants ? 1 : 0);
  const netBalance = repairScore - damageScore;

  if (activeTab === 'privacy-policy') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header activeTab={activeTab} onTabChange={setActiveTab} branding={branding} foundersCount={0} onOpenApp={openAppOrStore} />
        <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12 bg-white rounded-3xl border border-slate-200/80 shadow-soft mt-8 mb-12">
          <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Privacy Policy for <BrandName appName={branding.appName} />
            </h1>
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">{CURRENT_APP_VERSION} Legal</span>
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
        <Header activeTab={activeTab} onTabChange={setActiveTab} branding={branding} foundersCount={0} onOpenApp={openAppOrStore} />
        <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12 bg-white rounded-3xl border border-slate-200/80 shadow-soft mt-8 mb-12">
          <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Terms & Conditions for <BrandName appName={branding.appName} />
            </h1>
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">{CURRENT_APP_VERSION} Legal</span>
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
      <Header activeTab={activeTab} onTabChange={setActiveTab} branding={branding} foundersCount={foundersData.length} onOpenApp={openAppOrStore} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-indigo-50/20 to-white pt-10 pb-16 px-4 sm:px-6 md:pt-16 md:pb-24">
        {/* Floating Glowing Ambient Orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full filter blur-3xl pointer-events-none animate-pulse-subtle"></div>
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-teal-400/15 rounded-full filter blur-3xl pointer-events-none animate-pulse-subtle"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Spotlight Release Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-blue-200/80 shadow-xs backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
                {CURRENT_APP_VERSION} Live
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-bold text-slate-600">
                Cellular Balance • Abbott CGM • Specialist Care • At-Home Blood Tests
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Your Cellular Health & Longevity Platform with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">
                <BrandName appName={branding.appName} />
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
              Reverse chronic metabolic risk, track real-time Abbott FreeStyle Libre CGM glucose spikes, consult certified radiation oncologists & lifestyle physicians, practice vagus breathwork, and restore your biological balance every day.
            </p>

            {/* Key feature pills */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold text-slate-700">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                Damage vs Repair Engine
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1.5 shadow-2xs">
                <Activity className="h-3.5 w-3.5 text-teal-600" />
                Abbott CGM Spikes
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1.5 shadow-2xs">
                <Video className="h-3.5 w-3.5 text-emerald-600" />
                Doctor Tele-Consultations
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1.5 shadow-2xs">
                <TestTube className="h-3.5 w-3.5 text-purple-600" />
                Home Diagnostic Tests
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1.5 shadow-2xs">
                <Wind className="h-3.5 w-3.5 text-indigo-600" />
                Vagus Breathwork
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1.5 shadow-2xs">
                <Languages className="h-3.5 w-3.5 text-rose-600" />
                5 Regional Languages
              </span>
            </div>

            {/* App Store Download & Try in App Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => openAppOrStore()}
                className="group bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 transition-all duration-200 shadow-card hover:translate-y-[-2px] cursor-pointer"
                title="Opens the Mito Reboot app directly if installed on your phone"
              >
                <Smartphone className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <span className="text-[10px] text-blue-100 block font-bold uppercase tracking-wider leading-tight">Installed on phone?</span>
                  <span className="text-sm font-black block leading-none">Try in App</span>
                </div>
              </button>

              <a
                href="https://apps.apple.com/in/app/mito-reboot/id6783705985"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-slate-950 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 transition-all duration-200 shadow-card hover:translate-y-[-2px] border border-slate-800"
              >
                <Smartphone className="h-5 w-5 text-white group-hover:scale-105 transition-transform" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider leading-tight">Download on the</span>
                  <span className="text-sm font-bold block leading-none">App Store</span>
                </div>
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=com.mitoreboot.app"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-slate-950 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 transition-all duration-200 shadow-card hover:translate-y-[-2px] border border-slate-800"
              >
                <Play className="h-5 w-5 fill-white text-white group-hover:scale-105 transition-transform" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider leading-tight">Get it on</span>
                  <span className="text-sm font-bold block leading-none">Google Play</span>
                </div>
              </a>

              <button
                type="button"
                onClick={handleTrySimulator}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isSimulatorHighlighted
                    ? 'bg-blue-600 text-white shadow-glow-blue scale-105 ring-2 ring-blue-400'
                    : 'text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-soft'
                }`}
              >
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>Try Live Simulator</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium text-slate-500 pt-1">
              <div className="flex -space-x-2">
                <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">M</span>
                <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center">R</span>
                <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">C</span>
              </div>
              <span className="text-[11px]">Clinical oncology backing • Abbott FreeStyle Libre telemetry • End-to-end encrypted</span>
            </div>
          </div>

          {/* Interactive Mobile Simulator Device */}
          <div id="interactive-simulator" className="lg:col-span-5 flex justify-center relative">
            {isSimulatorHighlighted && (
              <div className="absolute -top-11 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black shadow-lg animate-bounce flex items-center gap-1.5 border border-white/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Active Simulator: Tap habits inside to adjust Cellular Balance!</span>
              </div>
            )}

            <div className={`bg-slate-950 p-3 sm:p-4 rounded-[44px] shadow-2xl border-[5px] transition-all duration-500 max-w-[350px] w-full relative overflow-hidden select-none ${
              isSimulatorHighlighted
                ? 'border-blue-500 ring-4 ring-blue-500/50 shadow-glow-blue scale-105'
                : 'border-slate-800'
            }`}>
              {/* Dynamic Island / Camera Notch */}
              <div className="absolute top-0 inset-x-0 h-5 flex justify-center z-30">
                <div className="bg-slate-950 w-28 h-4 rounded-b-xl flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-slate-900 mr-2"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-900/60"></div>
                </div>
              </div>

              {/* Simulated Screen Body */}
              <div className="bg-slate-50 rounded-[34px] overflow-hidden p-4 pt-6 text-left font-sans relative min-h-[490px] flex flex-col justify-between border border-slate-800/40">
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
                        <span className="text-[8px] text-slate-400 font-bold block">{CURRENT_APP_VERSION} Active</span>
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
                            {netBalance >= 2 ? 'Optimal Autophagy' : netBalance >= 0 ? 'Equilibrium' : 'Damage Dominated'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Abbott CGM Sync
                      </span>
                    </div>

                    {/* Balance Bar Indicator */}
                    <div>
                      <div className="flex justify-between text-[8px] font-extrabold uppercase mb-1">
                        <span className="text-rose-600">Damage ({damageScore})</span>
                        <span className="text-emerald-600">Repair ({repairScore})</span>
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
                    {/* 1-Tap Quick Presets */}
                    <div className="flex items-center justify-between gap-1 mb-2 px-1">
                      <span className="text-[7.5px] font-black uppercase text-slate-400">Presets:</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSimStress(true);
                            setSimSugarSpike(true);
                            setSimEnv(true);
                            setSimFasting(false);
                            setSimExercise(false);
                          }}
                          className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer active:scale-95 transition-all"
                        >
                          ⚡ Stress Spike
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSimStress(false);
                            setSimSugarSpike(false);
                            setSimEnv(false);
                            setSimFasting(true);
                            setSimExercise(true);
                          }}
                          className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer active:scale-95 transition-all"
                        >
                          🌿 Autophagy
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSimStress(false);
                            setSimSugarSpike(false);
                            setSimEnv(false);
                            setSimFasting(false);
                            setSimExercise(false);
                          }}
                          className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer active:scale-95 transition-all"
                        >
                          ↺ Reset
                        </button>
                      </div>
                    </div>

                    <p className="text-[7.5px] text-center font-bold text-indigo-600 uppercase tracking-wider mb-1.5">
                      👇 Tap any habit to test live balance:
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
                          <span>Toxins / Non-Stick</span>
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
                            <span>Zone 2 Cardio</span>
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Status bar */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[8px] text-slate-400 font-bold">
                  <span>Mito Reboot™ Engine {CURRENT_APP_VERSION}</span>
                  <span className="text-emerald-600 font-extrabold">● Sync Active</span>
                </div>

                {/* Simulated Medical Fasting Disclaimer Popup */}
                {showSimDisclaimer && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs z-40 flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 max-w-[270px] w-full text-center space-y-2.5 shadow-2xl">
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
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 max-w-[270px] w-full text-center space-y-3 shadow-2xl">
                      <div className="h-9 w-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto text-base">🛍️</div>
                      <h4 className="text-[11px] font-black text-slate-900 uppercase">Curated Safe Living Store</h4>
                      <p className="text-[9px] text-slate-600 leading-relaxed font-medium">
                        Filtered for cancer care scalp cooling caps, chemical-free natural wigs, and targeted antioxidants in Indian Rupees (₹).
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

      {/* "What's New in v6.0.3" Highlights Banner */}
      <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white py-5 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md shrink-0">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                  What's New in {CURRENT_APP_VERSION}
                </span>
                <span className="text-xs font-bold text-amber-200">Live on iOS & Android</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white/95 mt-0.5">
                Oncologist & Lifestyle Doctor Tele-Consultations • At-Home Blood Lab Testing • Standardized ₹ INR Store • Non-Stick Cookware Toxic Risk Audit
              </p>
            </div>
          </div>
          <a
            href="#features"
            className="shrink-0 bg-white text-blue-800 hover:bg-blue-50 font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>Explore Key Points</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {/* Core Key Features (Important Points Not All - Clean & Modern) */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 border border-blue-200/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Core Health Pillars</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Important Features Designed for Real Clinical Impact
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            No endless fluff. <BrandName appName={branding.appName} /> combines real-time continuous biological telemetry with verified medical consultations to help you take control of your health.
          </p>
        </div>

        {/* 6 Clean Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Cellular Balance */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Two-Force Cellular Balance</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Our dynamic proprietary algorithm balances biological damage (glucose spikes, chronic stress, non-stick toxins) against cellular repair forces (autophagy fasting, cardio, restorative breathwork).
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
              <span>Real-Time Daily Scoring</span>
              <span className="text-[10px] text-slate-400">Patented Algorithm</span>
            </div>
          </div>

          {/* Card 2: Abbott FreeStyle Libre CGM */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Abbott FreeStyle Libre CGM</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Seamless continuous glucose tracking. Upload Abbott Libre CSV or PDF exports to instantly map food triggers, calculate Time In Range (TIR 70–140 mg/dL), and neutralize hidden glycemic surges.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600">
              <span>Safe vs Dangerous Spikes</span>
              <span className="text-[10px] text-slate-400">FreeStyle Libre Sync</span>
            </div>
          </div>

          {/* Card 3: Certified Specialist Doctors */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Specialist Video Consultations</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Book confidential 1-on-1 video consultations with verified Radiation Oncologists, Lifestyle Medicine Specialists, and Metabolic Doctors directly through the mobile app.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>Certified Doctors (Dr. Muthiah & more)</span>
              <span className="text-[10px] text-slate-400">HD Video Appointments</span>
            </div>
          </div>

          {/* Card 4: Home Diagnostic Blood Tests */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                <TestTube className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">At-Home Diagnostic Lab Tests</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Order comprehensive blood biomarker testing with certified phlebotomists collecting samples at your doorstep. Fast digital delivery for HbA1c, lipid profiles, hs-CRP, and vitamins.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Home Sample Collection</span>
              <span className="text-[10px] text-slate-400">NABL Accredited Labs</span>
            </div>
          </div>

          {/* Card 5: Vagus Nerve Breathwork */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                <Wind className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Vagus Breathwork Studio</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Guided visual pacing for Box Breathing (4-4-4-4), 4-7-8 Deep Calm, and Coherent 5.5s resonance. Stimulates the parasympathetic nervous system to rapidly lower stress-induced blood sugar.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Audio Pacing & Haptics</span>
              <span className="text-[10px] text-slate-400">Immediate Stress Relief</span>
            </div>
          </div>

          {/* Card 6: Clean Living Store in INR */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Curated Clean Living Store</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Authentic, lab-tested health hardware in Indian Rupees (₹ INR): genuine Abbott CGM sensors, non-stick risk-free cast-iron and ceramic cookware, HEPA air purifiers, and cancer scalp cooling caps.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
              <span>Standard ₹ INR Pricing</span>
              <span className="text-[10px] text-slate-400">Zero Toxic Coatings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Specialist Doctors Showcase Section */}
      <section id="specialists" className="py-20 px-4 sm:px-6 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-3 border border-emerald-200/80">
              <Award className="h-3.5 w-3.5" />
              <span>Verified Medical Experts</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Consult Top Specialists In-App
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
              Book live, secure video appointments with certified oncologists, pulmonologists, and lifestyle doctors who treat the root cellular cause of disease.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {/* Doctor 1: Dr. Krithikaa Sekar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src="/assets/dr_krithikaa_sekar.jpg"
                    alt="Dr. Krithikaa Sekar"
                    className="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-100"
                    onError={(e) => { (e.target as any).src = '/favicon.jpg'; }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 leading-snug">Dr. Krithikaa Sekar</h3>
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200">
                        Founder & Chairman
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">Radiation Oncology & Metabolic Modulation</p>
                    <p className="text-[11px] text-slate-500 font-medium">Radiation Oncology MD • 12+ Yrs Exp</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Founder & Chairman Mitoreboot. Specialized in metabolic lifestyle modulation for cancer prevention, treatment tolerance, and long-term recurrence defense.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-slate-900 font-black">₹1,000</span>
                  <span className="text-[10px] text-slate-500 font-medium"> / 30 mins</span>
                </div>
                <button
                  type="button"
                  onClick={() => openAppOrStore('doctors')}
                  className="text-blue-600 font-extrabold hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Opens doctor booking in the Mito Reboot mobile app"
                >
                  <span>Book via App</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Doctor 2: Dr. Ritesh Santosham */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src="/assets/dr_ritesh_santosham.jpg"
                    alt="Dr. Ritesh Santosham"
                    className="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-100"
                    onError={(e) => { (e.target as any).src = '/favicon.jpg'; }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 leading-snug">Dr. Ritesh Santosham</h3>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">Clinical Oncologist & Palliative Care</p>
                    <p className="text-[11px] text-slate-500 font-medium">M.D., F.R.C.R(UK)., Fellowship (TMC) • 9 Yrs Exp</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Comprehensive cancer management through precision radiotherapy, chemotherapy, immunotherapy, pain relief, and integrated palliative care.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-slate-900 font-black">₹750</span>
                  <span className="text-[10px] text-slate-500 font-medium"> / 30 mins</span>
                </div>
                <button
                  type="button"
                  onClick={() => openAppOrStore('doctors')}
                  className="text-blue-600 font-extrabold hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Opens doctor booking in the Mito Reboot mobile app"
                >
                  <span>Book via App</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Doctor 3: Dr. Muthiah Kasi */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src="/assets/dr_muthiah_kasi.jpg"
                    alt="Dr. Muthiah Kasi"
                    className="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-100"
                    onError={(e) => { (e.target as any).src = '/favicon.jpg'; }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 leading-snug">Dr. Muthiah Kasi</h3>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">Radiation Oncology & Lifestyle Medicine</p>
                    <p className="text-[11px] text-slate-500 font-medium">MD Radiation Oncology (ISLM) • 7 Yrs Exp</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Member of Indian Society Of Lifestyle Medicine (ISLM). Specialized in targeted oncology care, radiotherapy support, metabolic therapy, and circadian fasting.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-slate-900 font-black">₹700</span>
                  <span className="text-[10px] text-slate-500 font-medium"> / 30 mins</span>
                </div>
                <button
                  type="button"
                  onClick={() => openAppOrStore('doctors')}
                  className="text-blue-600 font-extrabold hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Opens doctor booking in the Mito Reboot mobile app"
                >
                  <span>Book via App</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Doctor 4: Dr Krishnaveni Renganathan */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src="/assets/dr_krishnaveni_renganathan.jpg"
                    alt="Dr Krishnaveni Renganathan"
                    className="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-100"
                    onError={(e) => { (e.target as any).src = '/favicon.jpg'; }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 leading-snug">Dr Krishnaveni R.</h3>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">Pulmonologist, Allergy & Sleep</p>
                    <p className="text-[11px] text-slate-500 font-medium">MBBS, MD, DNB, DAA (CMC) • 13 Yrs Exp</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Consultant pulmonologist, allergy, and sleep specialist. Fellow in Sleep Medicine (St. John's) helping detect treatable sleep disorders to optimize recovery and immunity.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-slate-900 font-black">₹750</span>
                  <span className="text-[10px] text-slate-500 font-medium"> / 30 mins</span>
                </div>
                <button
                  type="button"
                  onClick={() => openAppOrStore('doctors')}
                  className="text-blue-600 font-extrabold hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Opens doctor booking in the Mito Reboot mobile app"
                >
                  <span>Book via App</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Doctor 5: Dr. Pavithra Dilip */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src="/assets/dr_pavithra_dilip.jpg"
                    alt="Dr. Pavithra Dilip"
                    className="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-100"
                    onError={(e) => { (e.target as any).src = '/favicon.jpg'; }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 leading-snug">Dr. Pavithra Dilip</h3>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">Preventive Dentistry & Oral Health</p>
                    <p className="text-[11px] text-slate-500 font-medium">BDS, MDS (Preventive Dentistry) • 22 Yrs Exp</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  22 years of clinical expertise. Oral health & preventive dentistry for systemic wellness, early screening, oral microbiome balance, and toxic burden reduction.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-slate-900 font-black">₹750</span>
                  <span className="text-[10px] text-slate-500 font-medium"> / 30 mins</span>
                </div>
                <button
                  type="button"
                  onClick={() => openAppOrStore('doctors')}
                  className="text-blue-600 font-extrabold hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Opens doctor booking in the Mito Reboot mobile app"
                >
                  <span>Book via App</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Doctor 6: Ms. Sailee Dayanand Rao */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src="/assets/ms_sailee_dayanand_rao.jpg"
                    alt="Ms. Sailee Dayanand Rao"
                    className="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-100"
                    onError={(e) => { (e.target as any).src = '/favicon.jpg'; }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 leading-snug">Ms. Sailee D. Rao</h3>
                      <span className="text-[9px] bg-purple-50 text-purple-700 font-extrabold px-1.5 py-0.5 rounded border border-purple-200">
                        Counselor
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">Psycho-Oncology & De-Addiction</p>
                    <p className="text-[11px] text-slate-500 font-medium">M.Sc Psycho-oncology • 5 Yrs Exp</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Specialist in psycho-oncology and certified addiction counselling for restorative emotional resilience, coping strategies, and mental well-being for patients and caregivers.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-slate-900 font-black">₹500</span>
                  <span className="text-[10px] text-slate-500 font-medium"> / 30 mins</span>
                </div>
                <button
                  type="button"
                  onClick={() => openAppOrStore('doctors')}
                  className="text-blue-600 font-extrabold hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Opens doctor booking in the Mito Reboot mobile app"
                >
                  <span>Book via App</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
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
              Synchronized with auditory cues, vibration feedback, and daily reminders in the <BrandName appName={branding.appName} supClassName="text-[0.6em] font-extrabold text-blue-400 ml-0.5 -top-1 relative" /> mobile app.
            </p>
          </div>
        </div>
      </section>

      {/* Chronic Disease Reversal & Care Modules Interactive Showcase */}
      <section id="modules" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 border border-blue-200/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Targeted Clinical Protocols</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Specialized Care Programs
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
                  Oncology Support
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
                  Continuous glucose monitoring is the cornerstone of metabolic repair. Upload your Abbott CSV or PDF sensor records directly into <BrandName appName={branding.appName} /> to classify meal spikes into Safe, Moderate, or Avoid.
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

      {/* Clean Living & Cookware Audit Section */}
      <section id="environmental" className="py-20 px-4 sm:px-6 bg-slate-100/70 border-y border-slate-200/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-3 border border-emerald-200/80">
              <Globe className="h-3.5 w-3.5" />
              <span>Clean Living & Cookware Audit</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Eliminate Silent Environmental Carcinogens
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
              Chronic inflammation is often driven by daily hidden exposures. Audit and eliminate toxic synthetic coatings, microplastics, and contaminated water.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3 hover:-translate-y-1 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Synthetic Non-Stick & PFAS</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Eliminate forever chemicals released from scratched non-stick pans. Swap to 304 food-grade stainless steel, seasoned cast iron, and pure ceramic.
              </p>
              <span className="text-[10px] font-black uppercase text-rose-600 block pt-1">Kitchen Safety Audit</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3 hover:-translate-y-1 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">PM2.5 Smog & Microplastics</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Audit fine particulate inhalation and heated food storage in disposable plastic. Protect alveoli and gut epithelial lining with HEPA filtration.
              </p>
              <span className="text-[10px] font-black uppercase text-teal-600 block pt-1">Air & Storage Defense</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3 hover:-translate-y-1 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Pesticides & Water Quality</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Detect organophosphates and endocrine disruptors in tap water and raw produce. Use multi-stage RO/UV filtration and baking soda soak rinses.
              </p>
              <span className="text-[10px] font-black uppercase text-amber-600 block pt-1">Produce & Water Audit</span>
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

      {/* Curated Clean Living Store Section */}
      <section id="store" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full mb-3 border border-amber-200/80">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Curated Health Store</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Verified Clean Living Products
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            Avoid counterfeit sensors and toxic kitchenware. Order verified products vetted directly by the <BrandName appName={branding.appName} /> clinical team, priced strictly in Indian Rupees (₹).
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
              <span className="text-slate-500">₹ Fast Dispatch</span>
              <button
                type="button"
                onClick={() => openAppOrStore('shop')}
                className="text-blue-600 font-extrabold hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                title="Opens shop catalog in the Mito Reboot mobile app"
              >
                <span>Available in App</span>
                <span>→</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">Cancer Care Specialty</span>
              <h3 className="text-lg font-bold text-slate-900">Scalp Cooling Caps & Natural Wigs</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Medical-grade scalp hypothermia caps to preserve follicles during chemotherapy, plus hypoallergenic natural wigs.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-500">Oncology Approved</span>
              <button
                type="button"
                onClick={() => openAppOrStore('shop')}
                className="text-blue-600 font-extrabold hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                title="Opens scalp caps in the Mito Reboot mobile app"
              >
                <span>Available in App</span>
                <span>→</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Kitchen Safety</span>
              <h3 className="text-lg font-bold text-slate-900">Zero-PFAS Cast Iron Cookware</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                100% heavy-metal-free, pre-seasoned natural cookware crafted for high-heat cooking without synthetic non-stick fumes.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-500">Non-Toxic Living</span>
              <button
                type="button"
                onClick={() => openAppOrStore('shop')}
                className="text-blue-600 font-extrabold hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                title="Opens non-toxic cookware in the Mito Reboot mobile app"
              >
                <span>Available in App</span>
                <span>→</span>
              </button>
            </div>
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
                className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all"
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

      {/* Video tutorials & Guides */}
      {videosData.length > 0 && (
        <section id="tutorials" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/60">
          <div className="text-center max-w-2xl mx-auto mb-14">
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
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full mb-3 border border-indigo-200/80">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Executive Leadership</span>
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Meet Our Founders</h2>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Discover the medical credentials, achievements, and driving vision behind <BrandName appName={branding.appName} />.
              </p>
            </div>

            <div className="space-y-12">
              {foundersData.map((founder, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-soft flex flex-col lg:flex-row gap-8 items-stretch">
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
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">🎓 Background</span>
                        <p className="leading-relaxed font-medium text-slate-600 whitespace-pre-line">{founder.background}</p>
                      </div>
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">🔬 Work Done</span>
                        <p className="leading-relaxed font-medium text-slate-600 whitespace-pre-line">{founder.workDone}</p>
                      </div>
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">🏆 Achievements</span>
                        <p className="leading-relaxed font-medium text-slate-600 whitespace-pre-line">{founder.achievements}</p>
                      </div>
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">🎯 Mission</span>
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
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 border border-blue-200/80">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Questions & Answers</span>
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-500 font-medium mt-2">
            Everything you need to know about <BrandName appName={branding.appName} />, sensor uploads, and specialist consultations.
          </p>
        </div>

        <div className="space-y-3">
          {faqsData.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/60 transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-5 text-left flex justify-between items-center text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${openFaqIndex === idx ? 'rotate-180 text-blue-600' : ''}`} />
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-200/60 bg-white">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support Section */}
      <section id="contact" className="bg-slate-50 py-20 px-4 sm:px-6 border-t border-slate-200/60">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200/80">
            <Mail className="h-3.5 w-3.5" />
            <span>Support & Medical Inquiries</span>
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Need Assistance? Reach Our Team</h2>
          <p className="text-sm text-slate-500 font-medium">
            Have questions about Abbott sensor uploads, doctor video consultations, or lab tests? Our clinical support team is here to help.
          </p>

          {formSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Thank you! Your message has been received. Our team will contact you shortly.</span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft text-left space-y-4 mt-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
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
                placeholder="Ask about Abbott sensor uploads, doctor consults, cancer care protocols, or app features..."
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
    question: "How do in-app specialist doctor consultations work?",
    answer: "You can book confidential 1-on-1 video consultations with registered Radiation Oncologists and Lifestyle Medicine Physicians directly in the app. Appointments are conducted through end-to-end encrypted video, with prescriptions and care plans provided in-app."
  },
  {
    question: "How can I book at-home diagnostic blood tests?",
    answer: "Browse accredited lab panels (HbA1c, comprehensive lipid profiles, hs-CRP inflammatory markers, vitamin levels) within the app, select your preferred home collection date, and a certified phlebotomist visits your doorstep. Reports are delivered digitally in your health dashboard."
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
  onOpenApp?: (path?: string) => void;
}> = ({ activeTab, onTabChange, branding, foundersCount, onOpenApp }) => {
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
          <a href="#specialists" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Doctors</a>
          <a href="#breathwork" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Breathwork</a>
          <a href="#modules" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Care Programs</a>
          <a href="#environmental" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Clean Living</a>
          <a href="#store" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Store</a>
          <a href="#languages" onClick={() => onTabChange('home')} className="hover:text-blue-600 transition-colors">Languages</a>
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
            <button
              type="button"
              onClick={() => (onOpenApp ? onOpenApp() : window.open('https://play.google.com/store/apps/details?id=com.mitoreboot.app', '_blank'))}
              className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
              title="Opens Mito Reboot app directly if installed on your phone"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Try in App</span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
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
          <a href="#specialists" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Doctors</a>
          <a href="#breathwork" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Breathwork</a>
          <a href="#modules" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Care Programs</a>
          <a href="#environmental" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Clean Living</a>
          <a href="#store" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Store</a>
          <a href="#languages" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Languages</a>
          <a href="#screenshots" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Screenshots</a>
          <a href="#faqs" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">FAQ</a>
          <a href="#contact" onClick={() => { onTabChange('home'); setMobileMenuOpen(false); }} className="block py-1 hover:text-blue-600">Contact Us</a>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); if (onOpenApp) onOpenApp(); }}
              className="w-full text-center py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="h-4 w-4" />
              <span>Try in App (Open Mobile App)</span>
            </button>
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
              className="w-full text-center py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-200"
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
              A science-driven cellular health and chronic disease reversal platform. Empowering individuals with continuous glucose telemetry, vagus breathwork, verified doctor video consults, and environmental carcinogen auditing.
            </p>
            {/* Trademark Legal Notice */}
            <p className="text-[11px] text-slate-500 font-bold">
              © 2026 <BrandName appName={branding.appName} className="text-slate-300" supClassName="text-[0.6em] text-blue-400 -top-1 relative" />. All rights reserved. Mito Reboot™ is a registered trademark.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-left font-semibold">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 block">Product</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><a href="#features" onClick={() => onTabChange('home')} className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#specialists" onClick={() => onTabChange('home')} className="hover:text-white transition-colors">Specialist Doctors</a></li>
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
                  <span>iOS App Store ({CURRENT_APP_VERSION})</span>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.mitoreboot.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold border border-slate-700 flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Google Play Store ({CURRENT_APP_VERSION})</span>
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
