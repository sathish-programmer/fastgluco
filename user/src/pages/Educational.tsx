import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  BookOpen, Video, Eye, HelpCircle, MessageSquare, Send, 
  Lock, Sparkles, Crown, ExternalLink, Search, ShieldAlert, 
  ChevronDown, ChevronUp, Clock, CheckCircle2, 
  Flame, Award
} from 'lucide-react';
import { FALLBACK_EDUCATIONAL_VIDEOS } from '../data/educationalLibrarySeeds';

const getEmbedUrl = (url: string) => {
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/').split('&')[0];
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
  }
  return url;
};

const isDirectYouTube = (url: string) => {
  return /youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\//.test(url) && !url.includes('/results?search_query=');
};

const getYouTubeThumbnail = (url: string) => {
  let videoId = '';
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('watch?v=')[1]?.split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1]?.split('?')[0];
  }
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

export const Educational: React.FC = () => {
  const { token, apiUrl } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  
  const [guides, setGuides] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>(FALLBACK_EDUCATIONAL_VIDEOS);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isPaidUser, setIsPaidUser] = useState<boolean>(false);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [activeGuideContent, setActiveGuideContent] = useState<any | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'guides' | 'videos' | 'faqs' | 'support'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', question: '' });
  const [supportStatus, setSupportStatus] = useState<string | null>(null);

  // Video Link Filtering Controls
  const [videoFilterCategory, setVideoFilterCategory] = useState<'all' | 'damage' | 'repair'>('all');
  const [videoSearchTerm, setVideoSearchTerm] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [expandedTakeaways, setExpandedTakeaways] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMaterials();
  }, [token]);

  const fetchMaterials = async () => {
    try {
      // Check user subscription status (paid users vs free / trial)
      if (token) {
        try {
          const subRes = await fetch(`${apiUrl}/subscriptions/current`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            const sub = subData.subscription;
            const isPaid = !!(
              sub &&
              sub.status !== 'trialing' &&
              (sub.status === 'active' || sub.status === 'cancelled') &&
              new Date(sub.endDate) > new Date()
            );
            setIsPaidUser(isPaid);
          }
        } catch (subErr) {
          console.error('Failed to verify subscription for educational videos:', subErr);
        }
      }

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
        if (Array.isArray(videosData) && videosData.length > 0) {
          setVideos(videosData);
        } else {
          setVideos(FALLBACK_EDUCATIONAL_VIDEOS);
        }
      } else {
        setVideos(FALLBACK_EDUCATIONAL_VIDEOS);
      }

      // Fetch FAQs
      const faqsRes = await fetch(`${apiUrl}/faqs?platform=App`);
      if (faqsRes.ok) {
        const faqsData = await faqsRes.json();
        setFaqs(faqsData);
      }
    } catch (err) {
      console.error('Failed to load educational materials:', err);
      setVideos(FALLBACK_EDUCATIONAL_VIDEOS);
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

  const localizeEducationText = (text: string) => {
    if (!text) return text;
    const mapping: Record<string, string> = {
      'Optimal Fasting Window Tips': t('learn.optimalFastingTitle', 'Optimal Fasting Window Tips'),
      'Understanding Glycaemic Index (GI)': t('learn.understandingGiTitle', 'Understanding Glycaemic Index (GI)'),
      'How to Attach and Pair Abbott CGM Sensor': t('learn.cgmSensorTitle', 'Optimal Nutrition & Glucose Balance'),
      'A step-by-step video guide explaining sensor application, cleaning the skin site, and scanning to activate.': t('learn.cgmSensorDesc', 'Educational guide on balancing meals and understanding glycemic response.'),
      'CGM GUIDE': t('learn.cgmGuideBadge', 'Nutrition Guide'),
      'DIET': t('foodLog.diet', 'Diet')
    };
    return mapping[text] || text;
  };

  // Distinct topics list for dropdown
  const availableTopics = useMemo(() => {
    const topicSet = new Set<string>();
    videos.forEach((v) => {
      if (v.topic) topicSet.add(v.topic);
    });
    return Array.from(topicSet);
  }, [videos]);

  // Filtered video links
  const filteredVideos = useMemo(() => {
    return videos.filter((vid) => {
      // Category filter
      if (videoFilterCategory === 'damage') {
        const cat = (vid.category || '').toUpperCase();
        if (!cat.includes('DAMAGE')) return false;
      } else if (videoFilterCategory === 'repair') {
        const cat = (vid.category || '').toUpperCase();
        if (!cat.includes('REPAIR')) return false;
      }

      // Topic filter
      if (selectedTopic !== 'all') {
        if (vid.topic !== selectedTopic) return false;
      }

      // Search query filter
      if (videoSearchTerm.trim()) {
        const query = videoSearchTerm.toLowerCase();
        const inTitle = (vid.title || '').toLowerCase().includes(query);
        const inDesc = (vid.description || '').toLowerCase().includes(query);
        const inTopic = (vid.topic || '').toLowerCase().includes(query);
        const inSpeaker = (vid.speaker || '').toLowerCase().includes(query);
        const inFocus = (vid.focus || '').toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inTopic && !inSpeaker && !inFocus) return false;
      }

      return true;
    });
  }, [videos, videoFilterCategory, selectedTopic, videoSearchTerm]);

  const toggleTakeaways = (id: string) => {
    setExpandedTakeaways(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-5xl mx-auto bg-white dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* Category selector */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => { setActiveCategory('all'); setActiveGuideId(null); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'all' && !activeGuideId ? 'bg-primary text-white border-primary shadow-soft' : 'bg-cardBg dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
          }`}
        >
          {t('common.viewAll')}
        </button>
        <button
          onClick={() => { setActiveCategory('guides'); setActiveGuideId(null); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'guides' && !activeGuideId ? 'bg-primary text-white border-primary shadow-soft' : 'bg-cardBg dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
          }`}
        >
          {t('learn.guides', 'Guides')}
        </button>
        <button
          onClick={() => { setActiveCategory('videos'); setActiveGuideId(null); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'videos' && !activeGuideId ? 'bg-primary text-white border-primary shadow-soft' : 'bg-cardBg dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
          }`}
        >
          {t('learn.videos', 'Video Links')}
        </button>
        <button
          onClick={() => { setActiveCategory('faqs'); setActiveGuideId(null); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'faqs' && !activeGuideId ? 'bg-primary text-white border-primary shadow-soft' : 'bg-cardBg dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
          }`}
        >
          {t('modals.faq', 'FAQs')}
        </button>
        <button
          onClick={() => { setActiveCategory('support'); setActiveGuideId(null); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'support' && !activeGuideId ? 'bg-primary text-white border-primary shadow-soft' : 'bg-cardBg dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
          }`}
        >
          {t('modals.helpSupport', 'Support')}
        </button>
      </div>

      {/* Guide Detail Modal / Sub-view */}
      {activeGuideId && activeGuideContent ? (
        <div className="bg-cardBg dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-soft">
          <button
            onClick={() => setActiveGuideId(null)}
            className="text-xs font-bold text-primary hover:underline mb-4 block"
          >
            ← {t('nav.back')}
          </button>
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider bg-secondary-light/50 px-2.5 py-0.5 rounded-full">
            {localizeEducationText(activeGuideContent.category)} • {activeGuideContent.readTime} {t('learn.minRead', 'min read')}
          </span>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-2 mb-4">{localizeEducationText(activeGuideContent.title)}</h3>
          
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line space-y-4">
            {activeGuideContent.content}
          </div>
        </div>
      ) : (
        /* Grid Listings */
        <div className="space-y-6">
          {/* Guide list */}
          {(activeCategory === 'all' || activeCategory === 'guides') && (
            <div>
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <BookOpen className="h-4.5 w-4.5 text-primary" />
                <span>{t('profile.educationCenter', 'Health & Diet Guides')}</span>
              </h3>
              
              <div className="space-y-3">
                {guides.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold pl-2">{t('common.noDataFound', 'No guide documents available.')}</p>
                ) : (
                  guides.map((guide) => (
                    <div 
                      key={guide._id}
                      onClick={() => handleReadGuide(guide._id)}
                      className="bg-cardBg dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-card"
                    >
                      <div className="max-w-[80%]">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">{localizeEducationText(guide.title)}</h4>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1 block">
                          {localizeEducationText(guide.category)} • {guide.readTime} {t('learn.minRead', 'min read')}
                        </span>
                      </div>
                      <Eye className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Educational Video Links Section */}
          {(activeCategory === 'all' || activeCategory === 'videos') && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                    <Video className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <span>{t('learn.videoTutorials', 'Educational Video Links')}</span>
                      <span className="text-[10px] font-black bg-primary/10 text-primary dark:bg-primary/20 px-2 py-0.5 rounded-full lowercase">
                        {filteredVideos.length} links
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">MitoReboot Podcast & Video Learning Library</p>
                  </div>
                </div>

                {/* Subcategory Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setVideoFilterCategory('all')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
                      videoFilterCategory === 'all'
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-cardBg dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    All ({videos.length})
                  </button>
                  <button
                    onClick={() => setVideoFilterCategory('damage')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all border flex items-center gap-1 ${
                      videoFilterCategory === 'damage'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50/70 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'
                    }`}
                  >
                    <Flame className="w-3 h-3" />
                    <span>Damage (Reduce Load)</span>
                  </button>
                  <button
                    onClick={() => setVideoFilterCategory('repair')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all border flex items-center gap-1 ${
                      videoFilterCategory === 'repair'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50/70 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
                    }`}
                  >
                    <Award className="w-3 h-3" />
                    <span>Repair (Build Defence)</span>
                  </button>
                </div>
              </div>

              {/* Search & Topic Selector Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                <div className="sm:col-span-2 relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={videoSearchTerm}
                    onChange={(e) => setVideoSearchTerm(e.target.value)}
                    placeholder="Search topics, clinicians, podcasts, mechanisms..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-700 dark:text-slate-200"
                  />
                  {videoSearchTerm && (
                    <button
                      onClick={() => setVideoSearchTerm('')}
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-700 dark:text-slate-200 font-bold"
                  >
                    <option value="all">All Topics (19)</option>
                    {availableTopics.map((top) => (
                      <option key={top} value={top}>
                        {top}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Video List */}
              <div className="space-y-4">
                {filteredVideos.length === 0 ? (
                  <div className="text-center py-8 bg-cardBg dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs text-slate-400 font-semibold">{t('common.noDataFound', 'No educational video links match your filter.')}</p>
                    <button
                      onClick={() => { setVideoFilterCategory('all'); setVideoSearchTerm(''); setSelectedTopic('all'); }}
                      className="mt-2 text-xs font-bold text-primary hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  filteredVideos.map((video, idx) => {
                    const videoId = video._id || `vid-${video.order || idx}`;
                    const isLocked = !!video.isPaidOnly && !isPaidUser;
                    const isEmbed = isDirectYouTube(video.url);
                    const thumbnail = getYouTubeThumbnail(video.url);
                    const isDamage = (video.category || '').toUpperCase().includes('DAMAGE');
                    const isExpanded = !!expandedTakeaways[videoId];

                    return (
                      <div 
                        key={videoId}
                        className="bg-cardBg dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft transition-all duration-300 hover:shadow-md"
                      >
                        {isLocked ? (
                          /* Modern Locked Preview Card */
                          <div className="relative aspect-video w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                            {thumbnail && (
                              <img 
                                src={thumbnail} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md scale-105 pointer-events-none"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/85 pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center max-w-xs space-y-2.5">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
                                <Lock className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider mb-1">
                                  <Crown className="w-3 h-3" />
                                  {t('subscription.paidSubscribersOnly', 'Paid Members Only')}
                                </span>
                                <h5 className="text-xs font-bold text-white tracking-wide">
                                  {t('learn.lockedVideoHeading', 'Exclusive Subscriber Content')}
                                </h5>
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                                  {t('learn.lockedVideoSubtext', 'This video is reserved for active paid subscribers. Not available on free or trial plans.')}
                                </p>
                              </div>

                              <button
                                onClick={() => window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'Subscription' }))}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[11px] shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{t('subscription.upgradeToUnlock', 'Upgrade to Unlock')}</span>
                              </button>
                            </div>
                          </div>
                        ) : isEmbed ? (
                          /* Direct Video Player Embed */
                          <div className="aspect-video w-full bg-slate-950">
                            <iframe
                              title={video.title}
                              src={getEmbedUrl(video.url)}
                              allowFullScreen
                              className="w-full h-full border-none"
                            />
                          </div>
                        ) : null}

                        <div className="p-4 sm:p-5">
                          {/* Badges Bar */}
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Category Badge */}
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                isDamage
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
                              }`}>
                                {isDamage ? 'Damage · Reduce Load' : 'Repair · Build Defence'}
                              </span>

                              {/* Topic Badge */}
                              {video.topic && (
                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                  {video.topic}
                                </span>
                              )}

                              {/* Duration */}
                              {video.duration && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{video.duration}</span>
                                </span>
                              )}
                            </div>

                            {video.isPaidOnly ? (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isPaidUser 
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              }`}>
                                <Crown className="w-3 h-3" />
                                {isPaidUser ? t('subscription.proUnlocked', 'Pro Unlocked') : t('subscription.paidOnly', 'Paid Only')}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400">
                                {t('common.free', 'Free Access')}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                            {localizeEducationText(video.title)}
                          </h4>

                          {/* Speaker / Expert */}
                          {video.speaker && (
                            <p className="text-[11px] font-bold text-primary dark:text-primary-light mt-1 flex items-center gap-1">
                              <span>🎙️ {video.speaker}</span>
                            </p>
                          )}

                          {/* Scientific Focus / Description */}
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-relaxed">
                            {localizeEducationText(video.description || video.focus || '')}
                          </p>

                          {/* Key Takeaways & Practical Action Drawer */}
                          {((video.takeaways && video.takeaways.length > 0) || video.practicalAction) && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                              <button
                                onClick={() => toggleTakeaways(videoId)}
                                className="flex items-center justify-between w-full text-left text-[11px] font-extrabold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors py-0.5"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Key Clinical Takeaways & Action</span>
                                </span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              {isExpanded && (
                                <div className="mt-2.5 space-y-2.5 animate-in fade-in duration-200">
                                  {/* Takeaway bullets */}
                                  {video.takeaways && video.takeaways.length > 0 && (
                                    <div className="space-y-1.5 pl-1">
                                      {video.takeaways.map((takeaway: string, tIdx: number) => (
                                        <div key={tIdx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                          <span>{takeaway}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Practical Action Box */}
                                  {video.practicalAction && (
                                    <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 rounded-xl p-2.5 text-[11px]">
                                      <span className="font-black text-sky-800 dark:text-sky-300 uppercase tracking-wider text-[10px] block mb-0.5">
                                        ⚡ Practical Lifestyle Action:
                                      </span>
                                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                                        {video.practicalAction}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Button: Open Video / Podcast Link */}
                          {!isLocked && video.url && (
                            <div className="mt-3.5 pt-2 flex items-center justify-end">
                              <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-all shadow-xs active:scale-95"
                              >
                                <span>Watch Video / Listen</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Medical Disclaimer Banner */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Clinical & Editorial Safeguards: </span>
                  This educational library contains vetted podcasts, video resources, and scientific discussions across the Damage and Repair frameworks. Lifestyle and fasting practices during active cancer therapy require individualized supervision by your treating oncology medical team.
                </p>
              </div>
            </div>
          )}

          {/* FAQs list */}
          {(activeCategory === 'all' || activeCategory === 'faqs') && (
            <div>
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <HelpCircle className="h-4.5 w-4.5 text-blue-500" />
                <span>{t('modals.faq', 'Frequently Asked Questions')}</span>
              </h3>
              <div className="space-y-3">
                {faqs.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold pl-2">{t('common.noDataFound', 'No FAQs available.')}</p>
                ) : (
                  faqs.map((faq) => {
                    const isOpen = openFaqId === faq._id;
                    return (
                      <div key={faq._id} className="bg-cardBg rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft overflow-hidden transition-all">
                        <button
                          onClick={() => setOpenFaqId(isOpen ? null : faq._id)}
                          className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all focus:outline-none"
                        >
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{faq.question}</span>
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-3">
                            {isOpen ? '▲' : '▼'}
                          </span>
                        </button>
                        {isOpen && (
                          <div 
                            className="px-4 pb-4 pt-2 text-xs text-slate-600 dark:text-slate-350 border-t border-slate-50 dark:border-slate-800 leading-relaxed whitespace-pre-line"
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Support Ticket form */}
          {activeCategory === 'support' && (
            <div className="bg-cardBg p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft">
              <h3 className="text-sm font-bold text-slate-655 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <MessageSquare className="h-4.5 w-4.5 text-primary" />
                <span>{t('modals.helpSupport', 'Ask Support')}</span>
              </h3>
              {supportStatus && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 text-success text-xs font-bold rounded-xl border border-green-100 dark:border-green-900/35">
                  {supportStatus}
                </div>
              )}
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t('profile.fullName', 'Your Name')}</label>
                  <input type="text" required value={supportForm.name} onChange={e => setSupportForm({...supportForm, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t('profile.emailAddress', 'Email')}</label>
                  <input type="email" required value={supportForm.email} onChange={e => setSupportForm({...supportForm, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t('common.details', 'Question')}</label>
                  <textarea required value={supportForm.question} onChange={e => setSupportForm({...supportForm, question: e.target.value})} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm h-32 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-soft flex justify-center items-center space-x-2">
                  <Send className="h-4.5 w-4.5" />
                  <span>{t('common.submit', 'Submit Question')}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
