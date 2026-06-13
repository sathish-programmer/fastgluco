import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookOpen, Video, Eye, HelpCircle, MessageSquare, Send } from 'lucide-react';

const getEmbedUrl = (url: string) => {
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/').split('&')[0];
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
  }
  return url;
};

export const Educational: React.FC = () => {
  const { token, apiUrl } = useAuth();
  const { showToast } = useToast();
  
  const [guides, setGuides] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [activeGuideContent, setActiveGuideContent] = useState<any | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'guides' | 'videos' | 'faqs' | 'support'>('all');
  const [supportForm, setSupportForm] = useState({ name: '', email: '', question: '' });
  const [supportStatus, setSupportStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, [token]);

  const fetchMaterials = async () => {
    try {
      // Fetch guides
      const guidesRes = await fetch(`${apiUrl}/guides`);
      if (guidesRes.ok) {
        const guidesData = await guidesRes.json();
        setGuides(guidesData);
      }

      // Fetch videos
      const videosRes = await fetch(`${apiUrl}/videos`);
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData);
      }

      // Fetch FAQs
      const faqsRes = await fetch(`${apiUrl}/faqs?platform=App`);
      if (faqsRes.ok) {
        const faqsData = await faqsRes.json();
        setFaqs(faqsData);
      }
    } catch (err) {
      console.error('Failed to load educational materials:', err);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportStatus(null);
    try {
      const response = await fetch(`${apiUrl}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supportForm)
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Question submitted successfully!', 'success');
        setSupportStatus('Question submitted! Our team will email you back soon.');
        setSupportForm({ name: '', email: '', question: '' });
      } else {
        showToast(data.message || 'Error submitting question.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred. Please try again.', 'error');
    }
  };

  const handleReadGuide = async (guideId: string) => {
    try {
      const response = await fetch(`${apiUrl}/guides/${guideId}`);
      if (response.ok) {
        const data = await response.json();
        setActiveGuideContent(data);
        setActiveGuideId(guideId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-white min-h-screen">
      {/* Category selector */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => { setActiveCategory('all'); setActiveGuideId(null); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'all' && !activeGuideId ? 'bg-primary text-white border-primary shadow-soft' : 'bg-cardBg text-slate-500 border-slate-100'
          }`}
        >
          All Resources
        </button>
        <button
          onClick={() => { setActiveCategory('guides'); setActiveGuideId(null); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'guides' && !activeGuideId ? 'bg-primary text-white border-primary shadow-soft' : 'bg-cardBg text-slate-500 border-slate-100'
          }`}
        >
          Guides
        </button>
        <button
          onClick={() => { setActiveCategory('videos'); setActiveGuideId(null); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'videos' && !activeGuideId ? 'bg-primary text-white border-primary shadow-soft' : 'bg-cardBg text-slate-500 border-slate-100'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => { setActiveCategory('faqs'); setActiveGuideId(null); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'faqs' && !activeGuideId ? 'bg-primary text-white border-primary shadow-soft' : 'bg-cardBg text-slate-500 border-slate-100'
          }`}
        >
          FAQs
        </button>
        <button
          onClick={() => { setActiveCategory('support'); setActiveGuideId(null); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'support' && !activeGuideId ? 'bg-primary text-white border-primary shadow-soft' : 'bg-cardBg text-slate-500 border-slate-100'
          }`}
        >
          Support
        </button>
      </div>

      {/* Guide Detail Modal / Sub-view */}
      {activeGuideId && activeGuideContent ? (
        <div className="bg-cardBg rounded-3xl p-5 border border-slate-100 shadow-soft">
          <button
            onClick={() => setActiveGuideId(null)}
            className="text-xs font-bold text-primary hover:underline mb-4 block"
          >
            ← Back to List
          </button>
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider bg-secondary-light/50 px-2.5 py-0.5 rounded-full">
            {activeGuideContent.category} • {activeGuideContent.readTime} min read
          </span>
          <h3 className="text-xl font-bold text-slate-800 mt-2 mb-4">{activeGuideContent.title}</h3>
          
          <div className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line space-y-4">
            {activeGuideContent.content}
          </div>
        </div>
      ) : (
        /* Grid Listings */
        <div className="space-y-6">
          {/* Guide list */}
          {(activeCategory === 'all' || activeCategory === 'guides') && (
            <div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <BookOpen className="h-4.5 w-4.5 text-primary" />
                <span>Health & Diet Guides</span>
              </h3>
              
              <div className="space-y-3">
                {guides.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold pl-2">No guide documents available.</p>
                ) : (
                  guides.map((guide) => (
                    <div 
                      key={guide._id}
                      onClick={() => handleReadGuide(guide._id)}
                      className="bg-cardBg p-4 rounded-2xl border border-slate-100 shadow-soft flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-card"
                    >
                      <div className="max-w-[80%]">
                        <h4 className="text-xs font-bold text-slate-700">{guide.title}</h4>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1 block">
                          {guide.category} • {guide.readTime} min read
                        </span>
                      </div>
                      <Eye className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Video list */}
          {(activeCategory === 'all' || activeCategory === 'videos') && (
            <div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <Video className="h-4.5 w-4.5 text-secondary" />
                <span>Video Tutorials</span>
              </h3>

              <div className="space-y-4">
                {videos.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold pl-2">No video tutorials available.</p>
                ) : (
                  videos.map((video) => (
                    <div 
                      key={video._id}
                      className="bg-cardBg rounded-3xl border border-slate-100 overflow-hidden shadow-soft"
                    >
                      {/* Video Player Embed */}
                      <div className="aspect-video w-full">
                        <iframe
                          title={video.title}
                          src={getEmbedUrl(video.url)}
                          allowFullScreen
                          className="w-full h-full border-none"
                        />
                      </div>
                      <div className="p-4">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary-light/50 px-2 py-0.5 rounded-full">
                          {video.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-2">{video.title}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          {video.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* FAQs list */}
          {(activeCategory === 'all' || activeCategory === 'faqs') && (
            <div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <HelpCircle className="h-4.5 w-4.5 text-blue-500" />
                <span>Frequently Asked Questions</span>
              </h3>
              <div className="space-y-3">
                {faqs.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold pl-2">No FAQs available.</p>
                ) : (
                  faqs.map((faq) => (
                    <div key={faq._id} className="bg-cardBg p-4 rounded-2xl border border-slate-100 shadow-soft">
                      <h4 className="text-sm font-bold text-slate-800 mb-2">{faq.question}</h4>
                      <p className="text-xs text-slate-600 font-medium whitespace-pre-line">{faq.answer}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Support Ticket form */}
          {activeCategory === 'support' && (
            <div className="bg-cardBg p-5 rounded-3xl border border-slate-100 shadow-soft">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <MessageSquare className="h-4.5 w-4.5 text-primary" />
                <span>Ask Support</span>
              </h3>
              {supportStatus && (
                <div className="mb-4 p-3 bg-green-50 text-success text-xs font-bold rounded-xl border border-green-100">
                  {supportStatus}
                </div>
              )}
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Name</label>
                  <input type="text" required value={supportForm.name} onChange={e => setSupportForm({...supportForm, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input type="email" required value={supportForm.email} onChange={e => setSupportForm({...supportForm, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Question</label>
                  <textarea required value={supportForm.question} onChange={e => setSupportForm({...supportForm, question: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm h-32" />
                </div>
                <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-soft flex justify-center items-center space-x-2">
                  <Send className="h-4.5 w-4.5" />
                  <span>Submit Question</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
