import React, { useState, useEffect } from 'react';
import {
  Heart,
  Smartphone,
  ShieldCheck,
  Activity,
  Sparkles,
  FileText,
  Play,
  Mail,
  User,
  Phone,
  ExternalLink
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
  const [activeTab, setActiveTab] = useState<'home' | 'privacy' | 'terms'>('home');

  // Dynamic Data States
  const [privacyData, setPrivacyData] = useState<string>('Loading privacy policy...');
  const [termsData, setTermsData] = useState<string>('Loading terms of service...');
  const [faqsData, setFaqsData] = useState<any[]>([]);
  const [videosData, setVideosData] = useState<any[]>([]);
  const [foundersData, setFoundersData] = useState<any[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
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

  if (activeTab === 'privacy') {
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

  if (activeTab === 'terms') {
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
      <section className="bg-gradient-to-b from-blue-50/50 to-white py-16 px-6 md:py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-full">
              <Sparkles className="h-3.5 w-3.5 fill-primary" />
              <span>Patient-Centric Health Tracking</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Master Your Circadian Fasting with <span className="text-primary">{branding.appName}</span>
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              Upload Abbott FreeStyle Libre reports, log common Indian foods, calculate daily calorie target, and identify items causing blood sugar spikes instantly to reset your metabolism.
            </p>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 transition-all shadow-lg shadow-slate-900/10">
                <Smartphone className="h-6 w-6 text-white" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Download on the</span>
                  <span className="text-sm font-bold block leading-none">App Store</span>
                </div>
              </button>

              <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 transition-all shadow-lg shadow-slate-900/10">
                <Play className="h-6 w-6 fill-white text-white" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Get it on</span>
                  <span className="text-sm font-bold block leading-none">Google Play</span>
                </div>
              </button>
            </div>
          </div>

          {/* Visual Mobile CSS Mockup Card */}
          <div className="flex justify-center">
            <div className="bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-slate-800 max-w-[340px] w-full relative overflow-hidden">
              {/* Actual Dashboard Screen Screenshot */}
              <img
                src="/screenshot_dashboard.png"
                alt="Mito_Reboot App Dashboard"
                className="w-full h-auto rounded-[32px] block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Designed for Simple Self-Tracking</h2>
          <p className="text-sm text-slate-400 font-semibold mt-2">
            No complex analytics. Plain insights and clear guidelines tailored for daily health.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-soft space-y-4">
            <div className="p-3 bg-blue-50 text-primary rounded-2xl inline-block">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">CGM Report Upload</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Export your CSV or PDF log from Abbott FreeStyle Libre and upload directly. Our system extracts continuous readings automatically.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-soft space-y-4">
            <div className="p-3 bg-teal-50 text-secondary rounded-2xl inline-block">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Glycemic Spike Analysis</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Match food logs with glucose readings. Classify foods as Safe, Moderate, or Avoid based on post-meal blood sugar peaks.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-soft space-y-4">
            <div className="p-3 bg-green-50 text-success rounded-2xl inline-block">
              <ShieldCheck className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Pre-seeded Indian Foods</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Search a pre-seeded library covering common South/North Indian cuisines, snacks, fruits, and beverages to log food in seconds.
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
            <p className="text-xs text-slate-400 font-semibold mt-1">Have inquiries about Mito_Reboot? Complete the contact form below.</p>
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
            <Heart className="h-5 w-5 fill-primary text-primary" />
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
          <a
            href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : (import.meta.env.DEV ? 'http://localhost:5001' : 'https://api.mitoreboot.in')}/health`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1 transition-all"
          >
            <span>API Health</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
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
          <span className="text-white font-bold block mb-0.5">{branding.appName}</span>
          {branding.appTagline && (
            <span className="text-slate-500 block mb-2">{branding.appTagline}</span>
          )}
          <span>© 2026 {branding.appName}. All rights reserved.</span>
        </div>
        <div className="flex space-x-4 font-semibold">
          {hasFounders && (
            <a href="#founders" onClick={() => onTabChange('home')} className="hover:text-white transition-all">Our Founders</a>
          )}
          <button onClick={() => onTabChange('privacy')} className="hover:text-white transition-all">Privacy Policy</button>
          <button onClick={() => onTabChange('terms')} className="hover:text-white transition-all">Terms of Service</button>
          <a href="#contact" onClick={() => onTabChange('home')} className="hover:text-white transition-all">Help & Support</a>
        </div>
      </div>
    </footer>
  );
};
