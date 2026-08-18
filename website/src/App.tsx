import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Activity,
  Sparkles,
  FileText,
  Play,
  Mail,
  User,
  Phone,
  Stethoscope,
  ShoppingCart,
  BrainCircuit,
  Globe
} from 'lucide-react';

const getEmbedUrl = (url: string) => {
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/').split('&')[0];
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
  }
  return url;
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
  const [simFasting, setSimFasting] = useState<boolean>(true);
  const [simExercise, setSimExercise] = useState<boolean>(true);
  const [simAntioxidants, setSimAntioxidants] = useState<boolean>(false);
  const [simJoy, setSimJoy] = useState<boolean>(true);
  const [simMode, setSimMode] = useState<'PREVENTION' | 'TREATMENT'>('PREVENTION');
  const [showSimDisclaimer, setShowSimDisclaimer] = useState<boolean>(false);

  const [branding, setBranding] = useState({
    appName: 'Mito_Reboot',
    appTagline: 'The circadian fasting app',
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
        setFaqsData(fq);
        setFoundersData(fnd);
        // Filter videos for Website or Both
        const webVideos = vid.filter((v: any) => v.targetPlatform === 'Website' || v.targetPlatform === 'Both');
        setVideosData(webVideos.length > 0 ? webVideos : vid);
        if (config.appName) {
          setBranding({
            appName: config.appName,
            appTagline: config.appTagline,
            appLogoUrl: config.appLogoUrl || ''
          });
          document.title = `${config.appName} - ${config.appTagline}`;
        }
      } catch (err) {
        console.error('Failed to load dynamic content', err);
      }
    };
    fetchData();
  }, []);

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

  if (activeTab === 'privacy-policy') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header activeTab={activeTab} onTabChange={setActiveTab} branding={branding} foundersCount={0} />
        <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12 bg-white rounded-3xl border border-slate-200 shadow-soft mt-6 mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Privacy Policy</h2>
          <div
            className="text-xs text-slate-600 leading-relaxed font-medium space-y-4"
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
        <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12 bg-white rounded-3xl border border-slate-200 shadow-soft mt-6 mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Terms and Conditions</h2>
          <div
            className="text-xs text-slate-600 leading-relaxed font-medium space-y-4"
            dangerouslySetInnerHTML={{ __html: termsData }}
          />
        </main>
        <Footer onTabChange={setActiveTab} branding={branding} hasFounders={false} />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col justify-between">
      {/* Header Navigation */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} branding={branding} foundersCount={foundersData.length} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white py-16 px-6 md:py-24">
        {/* Floating Ambient Blobs */}
        <div className="absolute top-1/4 left-5 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none"></div>
        <div className="absolute top-1/3 right-5 w-80 h-80 bg-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none"></div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-full">
              <Sparkles className="h-3.5 w-3.5 fill-primary" />
              <span>Track the Two Forces: Damage vs Repair</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Master Your Cellular Health with <span className="text-primary">{branding.appName}</span>
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              Log daily habits, upload Abbott CGM sensors, analyze blood sugar spikes, track environmental carcinogens, and keep stress balanced to reset your metabolism.
            </p>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="https://apps.apple.com/in/app/mito-reboot/id6783705985"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 transition-all shadow-lg hover:translate-y-[-2px]"
              >
                <Smartphone className="h-6 w-6 text-white" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Download on the</span>
                  <span className="text-sm font-bold block leading-none">App Store</span>
                </div>
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=com.mitoreboot.app"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 transition-all shadow-lg hover:translate-y-[-2px]"
              >
                <Play className="h-6 w-6 fill-white text-white" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Get it on</span>
                  <span className="text-sm font-bold block leading-none">Google Play</span>
                </div>
              </a>
            </div>
          </div>

          {/* Interactive CSS Mobile Mockup Simulator */}
          <div className="flex justify-center">
            <div className="bg-slate-900 p-3.5 rounded-[44px] shadow-2xl border-4 border-slate-800 max-w-[340px] w-full relative overflow-hidden select-none">
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-4 flex justify-center z-20">
                <div className="bg-slate-900 w-28 h-4 rounded-b-xl"></div>
              </div>

              {/* Simulated Screen */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-[32px] overflow-hidden p-4 pt-6 text-left font-sans relative min-h-[460px] flex flex-col justify-between">
                <div>
                  {/* Simulated Header */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 bg-primary rounded-md flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">M</span>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{branding.appName}</span>
                    </div>
                    <span className="text-[8px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full uppercase">Premium</span>
                  </div>

                  {/* Mode Switcher Toggle inside simulator */}
                  <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-1 mb-3 flex text-[9px] font-bold">
                    <button
                      onClick={() => { setSimMode('PREVENTION'); setShowSimDisclaimer(false); }}
                      className={`flex-1 py-1 rounded-lg text-center transition-all ${simMode === 'PREVENTION' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}
                    >
                      Prevention
                    </button>
                    <button
                      onClick={() => { setSimMode('TREATMENT'); }}
                      className={`flex-1 py-1 rounded-lg text-center transition-all ${simMode === 'TREATMENT' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'}`}
                    >
                      Treatment
                    </button>
                  </div>

                  {/* Active Focus Header */}
                  <div className={`rounded-xl p-2.5 text-[10px] font-bold mb-3 text-white flex justify-between items-center ${simMode === 'PREVENTION' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                    <span>Focus: {simMode === 'PREVENTION' ? 'Cancer Prevention' : 'Active Treatment'}</span>
                    <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded-md">Live</span>
                  </div>

                  {/* Simulated Tug of War Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-2">
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Cellular Balance Score</span>
                      <span className={`text-lg font-black block mt-0.5 ${(simFasting ? 1 : 0) + (simExercise ? 1 : 0) + (simAntioxidants ? 1 : 0) + (simJoy ? 1 : 0) - (simStress ? 1 : 0) - (simEnv ? 1 : 0) >= 0
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                        }`}>
                        {((simFasting ? 1 : 0) + (simExercise ? 1 : 0) + (simAntioxidants ? 1 : 0) + (simJoy ? 1 : 0) - (simStress ? 1 : 0) - (simEnv ? 1 : 0) > 0 ? '+' : '')}
                        {(simFasting ? 1 : 0) + (simExercise ? 1 : 0) + (simAntioxidants ? 1 : 0) + (simJoy ? 1 : 0) - (simStress ? 1 : 0) - (simEnv ? 1 : 0)}
                      </span>
                    </div>

                    {/* Balance Bar */}
                    <div>
                      <div className="flex justify-between text-[7px] font-bold uppercase mb-1">
                        <span className="text-rose-500">Damage ({(simStress ? 1 : 0) + (simEnv ? 1 : 0)})</span>
                        <span className="text-emerald-500">Repair ({(simFasting ? 1 : 0) + (simExercise ? 1 : 0) + (simAntioxidants ? 1 : 0) + (simJoy ? 1 : 0)})</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="bg-rose-500 transition-all duration-500"
                          style={{ width: `${(((simStress ? 1 : 0) + (simEnv ? 1 : 0)) / (((simStress ? 1 : 0) + (simEnv ? 1 : 0)) + ((simFasting ? 1 : 0) + (simExercise ? 1 : 0) + (simAntioxidants ? 1 : 0) + (simJoy ? 1 : 0)) || 1)) * 100}%` }}
                        ></div>
                        <div
                          className="bg-emerald-500 transition-all duration-500 flex-1"
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Click Hint */}
                  <p className="text-[7px] text-center font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider my-2 animate-pulse">
                    👉 Tap items to log habits!
                  </p>

                  {/* Simulated Columns */}
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    {/* Damage Column */}
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-bold text-rose-500 uppercase tracking-widest block pl-1">Damage</span>
                      <button
                        onClick={() => setSimStress(!simStress)}
                        className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all ${simStress ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400' : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-400'
                          }`}
                      >
                        <span className="font-bold">Stress</span>
                        <span className="font-extrabold">{simStress ? '-1' : '•'}</span>
                      </button>

                      <button
                        onClick={() => setSimEnv(!simEnv)}
                        className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all ${simEnv ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400' : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-400'
                          }`}
                      >
                        <span className="font-bold">Environment</span>
                        <span className="font-extrabold">{simEnv ? '-1' : '•'}</span>
                      </button>
                    </div>

                    {/* Repair Column */}
                    <div className="space-y-1.5">
                      <span className={`text-[8px] font-bold uppercase tracking-widest block pl-1 ${simMode === 'PREVENTION' ? 'text-emerald-500' : 'text-purple-500'}`}>Repair</span>

                      <button
                        onClick={() => {
                          if (simMode === 'TREATMENT' && !simFasting) {
                            setShowSimDisclaimer(true);
                          } else {
                            setSimFasting(!simFasting);
                          }
                        }}
                        className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all ${simFasting ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-400'
                          }`}
                      >
                        <span className="font-bold">Fasting</span>
                        <span className="font-extrabold">{simFasting ? '+1' : '•'}</span>
                      </button>

                      {simMode === 'TREATMENT' ? (
                        <button
                          onClick={() => alert("Exploring wigs for treatment-related hair loss in Shop...")}
                          className="w-full p-2 rounded-xl text-left border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/10 text-purple-700 dark:text-purple-400 flex justify-between items-center transition-all active:scale-95"
                        >
                          <span className="font-bold">Explore Wigs 🛍️</span>
                          <span className="font-extrabold">Shop</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSimExercise(!simExercise)}
                          className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all ${simExercise ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-400'
                            }`}
                        >
                          <span className="font-bold">Exercise</span>
                          <span className="font-extrabold">{simExercise ? '+1' : '•'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSimAntioxidants(!simAntioxidants)}
                        className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all ${simAntioxidants ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-400'
                          }`}
                      >
                        <span className="font-bold">Antioxidant</span>
                        <span className="font-extrabold">{simAntioxidants ? '+1' : '•'}</span>
                      </button>

                      <button
                        onClick={() => setSimJoy(!simJoy)}
                        className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all ${simJoy ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-400'
                          }`}
                      >
                        <span className="font-bold">Things I Love</span>
                        <span className="font-extrabold">{simJoy ? '+1' : '•'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulated Fasting Disclaimer Modal Popup */}
                {showSimDisclaimer && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex items-center justify-center p-3">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 max-w-[260px] w-full text-center space-y-2.5 shadow-xl">
                      <div className="h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xs font-bold">⚠️</div>
                      <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none">Medical Disclaimer</h4>
                      <p className="text-[8px] text-slate-500 dark:text-slate-400 leading-tight">
                        Intermittent fasting during active cancer treatment is experimental. Consult an oncologist and intimate your treating team first.
                      </p>
                      <div className="flex flex-col gap-1 text-[8px] font-bold">
                        <button
                          onClick={() => { setSimFasting(true); setShowSimDisclaimer(false); }}
                          className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"
                        >
                          I Understand & Accept
                        </button>
                        <button
                          onClick={() => setShowSimDisclaimer(false)}
                          className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-350 rounded-lg transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Designed for Simple Self-Tracking</h2>
          <p className="text-sm text-slate-400 font-semibold mt-2">
            No complex medical jargon. Plain insights and clear guidelines tailored for daily cellular health.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-soft space-y-4 hover:translate-y-[-4px] transition-all duration-300">
            <div className="p-3 bg-blue-50 text-primary rounded-2xl inline-block">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">CGM Report Upload</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Export your CSV or PDF log from Abbott FreeStyle Libre and upload directly. Our system extracts continuous glucose readings automatically.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-soft space-y-4 hover:translate-y-[-4px] transition-all duration-300">
            <div className="p-3 bg-teal-50 text-secondary rounded-2xl inline-block">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Glycemic Spike Analysis</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Match food logs with glucose readings. Classify meals as Safe, Moderate, or Avoid based on post-meal blood sugar peaks.
            </p>
          </div>

          {/* Card 3 (New - Environmental) */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-soft space-y-4 hover:translate-y-[-4px] transition-all duration-300">
            <div className="p-3 bg-indigo-50 text-indigo-650 rounded-2xl inline-block">
              <Globe className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Environmental Exposure Tracker</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Assess carcinogen loads. Log Air Quality (AQI), screen drinking water, review pesticide residues (Dirty Dozen), and limit Microplastics.
            </p>
          </div>

          {/* Card 4 (New - Stress & Intimacy) */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-soft space-y-4 hover:translate-y-[-4px] transition-all duration-300">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl inline-block">
              <BrainCircuit className="h-6 w-6 text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Stress & Intimacy Logs</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Log contributors like work-life balance, mood swings, or intimacy. Instantly access specialist support and mental wellness consultants.
            </p>
          </div>

          {/* Card 5 (Updated - Doctor & Lab) */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-soft space-y-4 hover:translate-y-[-4px] transition-all duration-300">
            <div className="p-3 bg-purple-50 text-purple-650 rounded-2xl inline-block">
              <Stethoscope className="h-6 w-6 text-purple-650" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Specialist Appointments</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Book consults with Oncologists, Pulmonologists, or Counselors, and schedule local diagnostic vitamin screening with home sample collection.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-soft space-y-4 hover:translate-y-[-4px] transition-all duration-300">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl inline-block">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Health Products Store</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Order continuous glucose patches, premium antioxidant supplements, and drinking water testing kits with live tracking and checkout.
            </p>
          </div>

          {/* Card 7 (New - Cancer Care Journey) */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-soft space-y-4 hover:translate-y-[-4px] transition-all duration-300">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl inline-block">
              <Sparkles className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Active Cancer Treatment Focus</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Switch focus mode to unlock specialized oncology support, hair loss wig recommendations, and safe-fasting experimental warnings.
            </p>
          </div>
        </div>
      </section>

      {/* Screen View Screenshots Section */}
      <section id="screenshots" className="bg-slate-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Application Screens</h2>
            <p className="text-sm text-slate-400 font-semibold mt-2">Beautiful, light medical layout optimized for accessibility.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {/* Screen 1 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">1. Secure Access</span>
              <div className="aspect-[9/16] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                <img
                  src="/screenshot_login.png"
                  alt="Login Screen"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Screen 2 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">2. Dashboard</span>
              <div className="aspect-[9/16] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                <img
                  src="/screenshot_dashboard.png"
                  alt="Dashboard Screen"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Screen 3 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">3. CGM Reports</span>
              <div className="aspect-[9/16] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                <img
                  src="/screenshot_reports.png"
                  alt="CGM Reports Screen"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Screen 4 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">4. Food & Diet Log</span>
              <div className="aspect-[9/16] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                <img
                  src="/screenshot_foodlog.png"
                  alt="Food Log Screen"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Screen 5 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">5. Glucose Analysis</span>
              <div className="aspect-[9/16] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                <img
                  src="/screenshot_analysis.png"
                  alt="Analysis Screen"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video tutorials */}
      <section id="tutorials" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Video Guides & Support</h2>
          <p className="text-sm text-slate-400 font-semibold mt-2">Watch video instructions on using Abbott CGM sensors.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {videosData.map((video, idx) => (
            <div key={idx} className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 shadow-soft">
              <div className="aspect-video bg-slate-200 flex items-center justify-center relative">
                <iframe src={getEmbedUrl(video.url)} className="w-full h-full border-none" title={video.title} />
              </div>
              <div className="p-5">
                <span className="text-[10px] font-bold text-primary uppercase bg-primary-light/50 px-2 py-0.5 rounded-full">{video.category}</span>
                <h4 className="text-base font-bold text-slate-800 mt-2">{video.title}</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">{video.description}</p>
              </div>
            </div>
          ))}
          {videosData.length === 0 && (
            <div className="col-span-2 text-center text-slate-500 py-10">No videos available at the moment.</div>
          )}
        </div>
      </section>

      {/* Meet Our Founders Section */}
      {foundersData.length > 0 && (
        <section id="founders" className="bg-slate-50 py-20 px-6 border-t border-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Meet Our Founders</h2>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Discover the credentials, achievements, and driving vision of our founding team.
              </p>
            </div>

            <div className="space-y-16">
              {foundersData.map((founder, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-soft flex flex-col lg:flex-row gap-8 lg:gap-10 items-stretch">
                  {/* Left Column: Video or Medical Placeholder */}
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
                      <div className="w-full aspect-video bg-gradient-to-br from-primary/5 to-indigo-50 rounded-2xl flex flex-col items-center justify-center border border-slate-200 p-6">
                        <span className="text-5xl mb-2">🩺</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{founder.role}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Bio & Details Grid */}
                  <div className="w-full lg:w-7/12 flex flex-col justify-between space-y-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{founder.name}</h3>
                      <p className="text-sm font-bold text-primary tracking-wide uppercase mt-0.5">{founder.role}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                      <div className="bg-slate-50/50 hover:bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-all duration-300">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">🎓 Background</span>
                        <p className="leading-relaxed font-medium text-slate-500 whitespace-pre-line">{founder.background}</p>
                      </div>
                      <div className="bg-slate-50/50 hover:bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-all duration-300">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">🔬 Work Done</span>
                        <p className="leading-relaxed font-medium text-slate-500 whitespace-pre-line">{founder.workDone}</p>
                      </div>
                      <div className="bg-slate-50/50 hover:bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-all duration-300">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">🏆 Achievements</span>
                        <p className="leading-relaxed font-medium text-slate-500 whitespace-pre-line">{founder.achievements}</p>
                      </div>
                      <div className="bg-slate-50/50 hover:bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-all duration-300">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">🎯 What we are solving</span>
                        <p className="leading-relaxed font-medium text-slate-500 whitespace-pre-line">{founder.tryingToSolve}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs Section */}
      {faqsData.length > 0 && (
        <section id="faqs" className="bg-white py-20 px-6 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400 font-semibold mt-2">Answers to common questions about Mito_Reboot.</p>
          </div>
          <div className="space-y-4">
            {faqsData.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-100/80 transition-all focus:outline-none"
                  >
                    <span className="text-base font-bold text-slate-800">{faq.question}</span>
                    <span className="text-slate-400 font-bold ml-4 text-xs">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="px-6 pb-6 pt-3 text-sm text-slate-600 border-t border-slate-200/50 leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Contact Form Section */}
      <section id="contact" className="bg-slate-50 py-20 px-6">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-soft">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Get in Touch</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Have inquiries about Mito_Reboot? Complete the contact form below or email us directly at <a href="mailto:support@mitoreboot.in" className="text-primary hover:underline">support@mitoreboot.in</a>.
            </p>
          </div>

          {formSuccess && (
            <div className="mb-4 p-4 bg-green-50 text-success text-xs font-semibold rounded-xl border border-green-100 text-center">
              Thank you! Your inquiry has been forwarded to our support queue.
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Your Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={contactMobile}
                  onChange={(e) => setContactMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Message Inquiry</label>
              <textarea
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Write your query here..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs h-24 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-soft flex items-center justify-center space-x-2"
            >
              {submitting ? 'Submitting...' : 'Send Inquiry'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer legal */}
      <Footer onTabChange={setActiveTab} branding={branding} hasFounders={foundersData.length > 0} />
    </div>
  );
}

interface BrandingProp {
  appName: string;
  appTagline: string;
  appLogoUrl: string;
}

// HEADER COMPONENT
const Header: React.FC<{ activeTab: string; onTabChange: (tab: any) => void; branding: BrandingProp; foundersCount: number }> = ({ activeTab, onTabChange, branding, foundersCount }) => {
  return (
    <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div
          onClick={() => onTabChange('home')}
          className="flex items-center space-x-1.5 cursor-pointer"
        >
          {branding.appLogoUrl ? (
            <img src={branding.appLogoUrl} alt="Logo" className="h-5 w-auto object-contain rounded-md" />
          ) : (
            <img src="/favicon.jpg" alt="Logo" className="h-6 w-auto object-contain rounded-md" />
          )}
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-slate-800 tracking-tight leading-none">{branding.appName}</span>
            {branding.appTagline && (
              <span className="text-[9px] text-slate-500 font-semibold leading-none mt-0.5">{branding.appTagline}</span>
            )}
          </div>
        </div>

        <nav className="hidden md:flex space-x-6 text-xs font-bold text-slate-500">
          <a href="#features" onClick={() => onTabChange('home')} className="hover:text-primary transition-all">Features</a>
          <a href="#screenshots" onClick={() => onTabChange('home')} className="hover:text-primary transition-all">Screenshots</a>
          <a href="#tutorials" onClick={() => onTabChange('home')} className="hover:text-primary transition-all">Tutorials</a>
          {foundersCount > 0 && (
            <a href="#founders" onClick={() => onTabChange('home')} className="hover:text-primary transition-all">Our Founders</a>
          )}
          <a href="#contact" onClick={() => onTabChange('home')} className="hover:text-primary transition-all">Contact Us</a>
        </nav>

        <div className="flex space-x-2">
          {activeTab !== 'home' && (
            <button
              onClick={() => onTabChange('home')}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-3.5 py-2 rounded-xl"
            >
              Home
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// FOOTER COMPONENT
const Footer: React.FC<{ onTabChange: (tab: any) => void; branding: BrandingProp; hasFounders: boolean }> = ({ onTabChange, branding, hasFounders }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 px-6 text-xs border-t border-slate-800">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            {branding.appLogoUrl ? (
              <img src={branding.appLogoUrl} alt="Logo" className="h-6 w-auto object-contain rounded-md" />
            ) : (
              <img src="/favicon.jpg" alt="Logo" className="h-8 w-auto object-contain rounded-md" />
            )}
            <div className="flex flex-col">
              <span className="text-white font-bold leading-none">{branding.appName}</span>
              {branding.appTagline && (
                <span className="text-[10px] text-slate-500 font-semibold leading-none mt-1">{branding.appTagline}</span>
              )}
            </div>
          </div>
          <span>© 2026 {branding.appName}. All rights reserved. | Contact: <a href="mailto:support@mitoreboot.in" className="hover:text-white underline">support@mitoreboot.in</a></span>
        </div>
        <div className="flex space-x-4 font-semibold">
          {hasFounders && (
            <a href="#founders" onClick={() => onTabChange('home')} className="hover:text-white transition-all">Our Founders</a>
          )}
          <button onClick={() => onTabChange('privacy-policy')} className="hover:text-white transition-all">Privacy Policy</button>
          <button onClick={() => onTabChange('terms-and-conditions')} className="hover:text-white transition-all">Terms of Service</button>
          <a href="#contact" onClick={() => onTabChange('home')} className="hover:text-white transition-all">Help & Support</a>
        </div>
      </div>
    </footer>
  );
};
