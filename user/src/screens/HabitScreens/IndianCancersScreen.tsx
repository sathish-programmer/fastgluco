import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';

interface CancerVideo {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  displayOrder: number;
}

interface CancerData {
  _id: string;
  name: string;
  percentage: number;
  riskFactors: string[];
  description: string;
  videos: CancerVideo[];
}

interface IndianCancersScreenProps {
  onBack: () => void;
}

const maleColors = ["#1F6F6B", "#2C8C86", "#4AABA3", "#7FC4BD", "#B7DED8", "#64748B"];
const femaleColors = ["#8B2F5C", "#B23A6E", "#D14E82", "#E27FA6", "#F0B4CC", "#64748B"];

const getYoutubeEmbedUrl = (url: string) => {
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/').split('&')[0];
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
  }
  return url;
};

const getYoutubeThumbnailUrl = (url: string) => {
  if (!url) return '';
  let videoId = '';
  try {
    const cleanUrl = url.trim();
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
      if (cleanUrl.includes('watch?v=')) {
        const parts = cleanUrl.split('watch?v=');
        if (parts[1]) {
          videoId = parts[1].split('&')[0];
        }
      } else if (cleanUrl.includes('embed/')) {
        const parts = cleanUrl.split('embed/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0];
        }
      } else if (cleanUrl.includes('youtu.be/')) {
        const parts = cleanUrl.split('youtu.be/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0];
        }
      } else if (cleanUrl.includes('shorts/')) {
        const parts = cleanUrl.split('shorts/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0];
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  videoId = videoId.trim();
  if (videoId && videoId.length === 11) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return '';
};

export const IndianCancersScreen: React.FC<IndianCancersScreenProps> = ({ onBack }) => {
  const { apiUrl, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ men: CancerData[]; women: CancerData[] }>({ men: [], women: [] });
  const [activeTab, setActiveTab] = useState<'Men' | 'Women'>('Men');
  const [activePieIndex, setActivePieIndex] = useState<number>(0);
  const [activeVideo, setActiveVideo] = useState<CancerVideo | null>(null);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  const resolveThumbnail = (thumbnailUrl: string, videoUrl: string) => {
    const ytThumbFromThumb = getYoutubeThumbnailUrl(thumbnailUrl);
    if (ytThumbFromThumb) return ytThumbFromThumb;
    if (thumbnailUrl) {
      return thumbnailUrl.startsWith('/uploads/') ? `${apiUrl.replace('/api', '')}${thumbnailUrl}` : thumbnailUrl;
    }
    const ytThumbFromVideo = getYoutubeThumbnailUrl(videoUrl);
    if (ytThumbFromVideo) return ytThumbFromVideo;
    return '';
  };

  useEffect(() => {
    const fetchCancers = async () => {
      try {
        const res = await fetch(`${apiUrl}/cancer-screening/indian-cancers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCancers();
  }, [apiUrl, token]);

  const currentList = activeTab === 'Men' ? data.men : data.women;
  const currentColors = activeTab === 'Men' ? maleColors : femaleColors;
  const currentAccent = activeTab === 'Men' ? '#4AABA3' : '#D14E82';

  const selectedCancer = currentList[activePieIndex] || currentList[0];

  const renderVideoPlayer = (url: string, title: string) => {
    if (url.startsWith('/uploads/')) {
      const baseUrl = apiUrl.replace('/api', '');
      const fullUrl = `${baseUrl}${url}`;
      return (
        <video controls className="w-full aspect-video rounded-2xl bg-black" poster={activeVideo?.thumbnailUrl ? `${baseUrl}${activeVideo.thumbnailUrl}` : undefined}>
          <source src={fullUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }
    return (
      <iframe
        title={title}
        src={getYoutubeEmbedUrl(url)}
        allowFullScreen
        className="w-full aspect-video rounded-2xl border-none"
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-500">
        Loading Indian Cancers & Risks data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-4 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 active:scale-95 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans">Indian Cancers & Risks</h1>
            <p className="text-xs text-slate-500">Understand common cancers in India and their associated risk factors.</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800">
          <button
            onClick={() => { setActiveTab('Men'); setActivePieIndex(0); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'Men' 
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Men
          </button>
          <button
            onClick={() => { setActiveTab('Women'); setActivePieIndex(0); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'Women' 
                ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Women
          </button>
        </div>

        {/* Donut Chart Card */}
        {currentList.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-6 flex flex-col items-center shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Top Cancer Sites Share</h2>
            
            <div className="w-full h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentList}
                    dataKey="percentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    stroke="transparent"
                    onMouseEnter={(_, i) => setActivePieIndex(i)}
                    activeIndex={activePieIndex}
                  >
                    {currentList.map((_, i) => (
                      <Cell
                        key={i}
                        fill={currentColors[i % currentColors.length]}
                        className="cursor-pointer focus:outline-none"
                        style={{
                          filter: activePieIndex === i ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.15))' : 'none'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-3xl font-black font-mono text-slate-800 dark:text-slate-100">{selectedCancer?.percentage}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider max-w-[120px] truncate">{selectedCancer?.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Detail and Risk Factors Card */}
        {selectedCancer && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-4 shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: currentAccent }}>Selected Site</span>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{selectedCancer.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">{selectedCancer.description}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Major Risk Factors</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCancer.riskFactors.map((factor, idx) => (
                  <span key={idx} className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                    {factor}
                  </span>
                ))}
              </div>
            </div>

            {/* Video Card in User App if configured */}
            {selectedCancer.videos && selectedCancer.videos.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Watch Awareness Videos</span>
                <div className="grid gap-3">
                  {selectedCancer.videos.map((video) => (
                    <button
                      key={video._id}
                      onClick={() => setActiveVideo(video)}
                      className="w-full bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/70 border border-slate-200/60 dark:border-slate-850 p-3 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-[0.98]"
                    >
                      <div className="relative w-16 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {resolveThumbnail(video.thumbnailUrl || '', video.videoUrl) && !imageErrors[video._id] ? (
                          <img 
                            src={resolveThumbnail(video.thumbnailUrl || '', video.videoUrl)} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={() => setImageErrors(prev => ({ ...prev, [video._id]: true }))}
                          />
                        ) : (
                          <Play className="h-5 w-5 text-slate-500 fill-slate-500" />
                        )}
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <div className="h-6 w-6 rounded-full bg-white/90 flex items-center justify-center shadow">
                            <Play className="h-3 w-3 text-slate-900 fill-slate-900 ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{video.title}</h4>
                        {video.description && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{video.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend for quickly switching */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-3 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Indian Cancer Site Distribution</span>
          <div className="grid gap-2">
            {currentList.map((c, i) => (
              <button
                key={c._id || c.name}
                onClick={() => setActivePieIndex(i)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border text-left ${
                  activePieIndex === i 
                    ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold' 
                    : 'border-transparent hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-3.5 w-3.5 rounded-full shrink-0" style={{ background: currentColors[i % currentColors.length] }}></div>
                  <span className="text-xs text-slate-700 dark:text-slate-350">{c.name}</span>
                </div>
                <span className="text-xs font-bold font-mono" style={{ color: activePieIndex === i ? currentAccent : undefined }}>{c.percentage}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Attribution & Disclaimer */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm">
          <p className="text-[10.5px] text-slate-500 dark:text-slate-450 leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">Data Attribution:</strong> New case estimates based on IARC / GLOBOCAN 2024 India Fact Sheet.
          </p>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-450 leading-relaxed mt-2">
            <strong className="text-slate-750 dark:text-slate-300">Disclaimer:</strong> Tobacco use (smoked and chewed) is the single largest preventable driver of cancer in India, contributing heavily to oral, lung, and oesophageal cancers. Cervical cancer is highly preventable through HPV vaccination and regular screening. Percentages reflect the share of new cases within each sex, not absolute risk.
          </p>
        </div>

      </div>

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-4 pt-12 space-y-4">
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black">
                {renderVideoPlayer(activeVideo.videoUrl, activeVideo.title)}
              </div>
              <div className="px-2 pb-2">
                <h3 className="text-sm font-bold text-white">{activeVideo.title}</h3>
                {activeVideo.description && (
                  <p className="text-xs text-slate-400 mt-1">{activeVideo.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
