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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const [priv, terms, fq, vid] = await Promise.all([
          fetch(`${baseUrl}/legal/PrivacyPolicy`).then(r => r.json()).catch(() => ({ content: '' })),
          fetch(`${baseUrl}/legal/TermsOfService`).then(r => r.json()).catch(() => ({ content: '' })),
          fetch(`${baseUrl}/faqs?platform=Website`).then(r => r.json()).catch(() => []),
          fetch(`${baseUrl}/videos`).then(r => r.json()).catch(() => [])
        ]);
        if (priv.content) setPrivacyData(priv.content);
        if (terms.content) setTermsData(terms.content);
        setFaqsData(fq);
        // Filter videos for Website or Both
        const webVideos = vid.filter((v: any) => v.targetPlatform === 'Website' || v.targetPlatform === 'Both');
        setVideosData(webVideos.length > 0 ? webVideos : vid);
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
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
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
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12 bg-white rounded-3xl border border-slate-200 shadow-soft mt-6 mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Privacy Policy</h2>
          <div 
            className="text-xs text-slate-600 leading-relaxed font-medium space-y-4"
            dangerouslySetInnerHTML={{ __html: privacyData }}
          />
        </main>
        <Footer onTabChange={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'terms') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12 bg-white rounded-3xl border border-slate-200 shadow-soft mt-6 mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Terms and Conditions</h2>
          <div 
            className="text-xs text-slate-600 leading-relaxed font-medium space-y-4"
            dangerouslySetInnerHTML={{ __html: termsData }}
          />
        </main>
        <Footer onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col justify-between">
      {/* Header Navigation */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50/50 to-white py-16 px-6 md:py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-full">
              <Sparkles className="h-3.5 w-3.5 fill-primary" />
              <span>Patient-Centric Health Tracking</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Master Your Blood Glucose with <span className="text-primary">FastGluco</span>
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              Upload Abbott FreeStyle Libre reports, log common Indian foods, calculate daily calorie target, and identify items causing blood sugar spikes instantly.
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
            <div className="bg-slate-900 p-3.5 rounded-[40px] shadow-2xl border-4 border-slate-800 max-w-[280px] w-full aspect-[9/19] relative overflow-hidden flex flex-col justify-between">
              {/* Internal Mock Screen */}
              <div className="bg-white rounded-[32px] p-4 flex-1 flex flex-col justify-between overflow-hidden text-slate-800">
                <div className="flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <Heart className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-xs font-extrabold">FastGluco</span>
                </div>

                <div className="space-y-3 mt-4">
                  {/* Glucose Summary */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Glucose</span>
                    <div className="flex items-baseline space-x-0.5">
                      <span className="text-2xl font-extrabold text-slate-800">200</span>
                      <span className="text-[10px] font-bold text-slate-400">mg/dL</span>
                    </div>
                    <span className="text-[8px] font-bold text-red-500 block mt-0.5">⚠️ Very High</span>
                  </div>

                  {/* Meal Spike */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase line-clamp-1">Brownie Slice</span>
                        <span className="text-[8px] text-slate-400 font-bold block">Breakfast</span>
                      </div>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-danger border border-red-100">Avoid</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[9px] font-bold text-slate-500">
                      <span>Before: 95</span>
                      <span>Peak: 200</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Bottom Navigation */}
                <div className="border-t border-slate-100 pt-2 flex justify-around items-center mt-auto text-[8px] text-slate-400 font-bold">
                  <span className="text-primary">Home</span>
                  <span>Reports</span>
                  <span>Food Log</span>
                  <span>Analysis</span>
                  <span>Profile</span>
                </div>
              </div>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Screen 1 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">1. Dashboard</span>
              <div className="aspect-[9/16] bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between text-slate-700 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Latest Glucose</span>
                  <span className="text-xl font-extrabold">200 mg/dL</span>
                  <span className="text-[8px] font-bold text-red-500 block mt-1">⚠️ Very High</span>
                </div>
                <div className="p-2 bg-red-50 text-danger font-bold text-[9px] rounded-xl border border-red-100 text-center">
                  Time in Range: 71%
                </div>
              </div>
            </div>

            {/* Screen 2 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">2. CGM Upload</span>
              <div className="aspect-[9/16] bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between text-slate-700 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Report Import</span>
                  <h4 className="font-bold text-[10px] mt-1">Abbott Libre CSV</h4>
                  <span className="text-[8px] text-slate-400">Processed 466 records</span>
                </div>
                <div className="p-2 bg-blue-50 text-primary font-bold text-[9px] rounded-xl border border-blue-100 text-center">
                  Analyze Spikes
                </div>
              </div>
            </div>

            {/* Screen 3 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">3. Spike Match</span>
              <div className="aspect-[9/16] bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between text-slate-700 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Meal Analyzer</span>
                  <h4 className="font-bold text-[10px] mt-1 line-clamp-1">Brownie Slice</h4>
                  <span className="text-[8px] text-slate-400 block mt-0.5">Baseline: 95 mg/dL</span>
                  <span className="text-[8px] text-slate-400 block">Peak Post: 200 mg/dL</span>
                </div>
                <div className="p-2 bg-red-50 text-danger font-bold text-[9px] rounded-xl border border-red-100 text-center">
                  Level: Avoid
                </div>
              </div>
            </div>

            {/* Screen 4 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">4. Top Foods</span>
              <div className="aspect-[9/16] bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between text-slate-700 text-xs">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Safest Portion Diets</span>
                  <div className="space-y-1 text-[8px] font-bold">
                    <div className="flex justify-between text-green-700"><span>Boiled Egg</span><span>70 mg/dL</span></div>
                    <div className="flex justify-between text-green-700"><span>Whole Wheat Roti</span><span>85 mg/dL</span></div>
                  </div>
                </div>
                <div className="p-2 bg-teal-50 text-secondary font-bold text-[9px] rounded-xl border border-teal-100 text-center">
                  Analytics & Trends
                </div>
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

      {/* FAQs Section */}
      {faqsData.length > 0 && (
        <section id="faqs" className="bg-white py-20 px-6 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400 font-semibold mt-2">Answers to common questions about FastGluco.</p>
          </div>
          <div className="space-y-4">
            {faqsData.map((faq, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-base font-bold text-slate-800">{faq.question}</h3>
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact Form Section */}
      <section id="contact" className="bg-slate-50 py-20 px-6">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-soft">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Get in Touch</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Have inquiries about FastGluco? Complete the contact form below.</p>
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
      <Footer onTabChange={setActiveTab} />
    </div>
  );
}

// HEADER COMPONENT
const Header: React.FC<{ activeTab: string; onTabChange: (tab: any) => void }> = ({ activeTab, onTabChange }) => {
  return (
    <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div 
          onClick={() => onTabChange('home')}
          className="flex items-center space-x-1.5 cursor-pointer"
        >
          <Heart className="h-5 w-5 fill-primary text-primary" />
          <span className="text-base font-extrabold text-slate-800 tracking-tight">FastGluco</span>
        </div>
        
        <nav className="hidden md:flex space-x-6 text-xs font-bold text-slate-500">
          <a href="#features" onClick={() => onTabChange('home')} className="hover:text-primary transition-all">Features</a>
          <a href="#screenshots" onClick={() => onTabChange('home')} className="hover:text-primary transition-all">Screenshots</a>
          <a href="#tutorials" onClick={() => onTabChange('home')} className="hover:text-primary transition-all">Tutorials</a>
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
            href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5001'}/health`} 
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
const Footer: React.FC<{ onTabChange: (tab: any) => void }> = ({ onTabChange }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 px-6 text-xs border-t border-slate-800">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div>
          <span className="text-white font-bold block mb-1">FastGluco Central</span>
          <span>© 2026 FastGluco. All rights reserved.</span>
        </div>
        <div className="flex space-x-4 font-semibold">
          <button onClick={() => onTabChange('privacy')} className="hover:text-white transition-all">Privacy Policy</button>
          <button onClick={() => onTabChange('terms')} className="hover:text-white transition-all">Terms of Service</button>
          <a href="#contact" onClick={() => onTabChange('home')} className="hover:text-white transition-all">Help & Support</a>
        </div>
      </div>
    </footer>
  );
};
