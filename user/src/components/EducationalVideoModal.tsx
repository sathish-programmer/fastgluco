import React, { useEffect } from 'react';
import { X, ExternalLink, Sparkles, AlertCircle, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface EducationalVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  title?: string;
  description?: string;
  guidelines?: string[];
}

export const getYouTubeEmbedUrl = (url?: string): string => {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1`;
  }
  return url;
};

export const getYouTubeThumbnailUrl = (url?: string): string => {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return '';
};

export const EducationalVideoModal: React.FC<EducationalVideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl = 'https://youtu.be/hymu-0jWtdM?si=n8pz91JRuhK4opin',
  title,
  description,
  guidelines
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  const displayTitle = title || t('video.breastExamTitle', 'Animated Self Breast Examination Guide');
  const displayDesc = description || t('video.breastExamDesc', 'Watch this medical animated guide to learn the correct 3-step technique for monthly breast self-examination and awareness.');

  const defaultGuidelines = [
    t('video.guideTiming', 'Best timing: 3 to 5 days after your period ends when breast tissue is least swollen or tender.'),
    t('video.guidePostMeno', 'If post-menopausal or pregnant: Choose a fixed, easy-to-remember day each month (e.g., the 1st of every month).'),
    t('video.guideReport', 'What to look for: New painless lump, skin dimpling, nipple inversion, or unusual nipple discharge.')
  ];

  const activeGuidelines = guidelines && guidelines.length > 0 ? guidelines : defaultGuidelines;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-rose-50/70 via-pink-50/50 to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <Heart className="w-4 h-4 fill-rose-500/20" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-900/40 px-2 py-0.5 rounded-full">
                  {t('video.medicalAnimation', 'Medical Animation')}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">· Self Care</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                {displayTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* 16:9 Video Embed Player */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-slate-800 aspect-video group">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={displayTitle}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
                <p className="text-sm font-semibold">{t('video.notAvailable', 'Video temporarily unavailable')}</p>
              </div>
            )}
          </div>

          {/* Description & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed flex-1">
              {displayDesc}
            </p>
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-900/40 transition-colors shrink-0"
              >
                <span>{t('video.openInYoutube', 'Watch on YouTube')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Clinical Advice Box */}
          <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">
                {t('video.guidelinesTitle', 'Clinical Self-Exam Guidelines')}
              </h4>
            </div>
            <ul className="space-y-1.5">
              {activeGuidelines.map((item, i) => (
                <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {t('close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
