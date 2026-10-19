import React from 'react';
import { X, Stethoscope, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DEFAULT_FOUNDER_NOTE_TEXT = `# A Note from the Founder

## MitoReboot — Reboot Your Lifestyle. Restore Your Health.

As a radiation oncologist and cancer researcher, I have spent years understanding cancer not just as a disease of abnormal cells, but as a complex biological process influenced by genetics, metabolism, inflammation, the environment, and the way we live.

One question has stayed with me: *What if we could intervene much earlier, before years of accumulated biological damage translate into disease?*

Our lifestyle is more than a collection of daily habits. What we eat, when we eat, how well we sleep, how much we move, how we manage stress, and the environmental exposures we encounter can influence the body's metabolic balance, inflammatory pathways, oxidative stress, and mitochondrial function.

Mitochondria, the energy-producing structures within our cells, play a vital role in cellular energy metabolism, redox balance, and cell survival. When these systems are disrupted, they may contribute to metabolic dysfunction, chronic inflammation, and an environment that favours disease development. These mechanisms are relevant to cancer and several other chronic conditions, including type 2 diabetes, cardiovascular disease, and fatty liver disease.

Cancer prevention, therefore, must extend beyond screening and early diagnosis. It must also include understanding and modifying the lifestyle and environmental factors that influence our long-term health. Although not every cancer or metabolic disease is preventable, addressing established risk factors offers an important opportunity to reduce risk and improve overall well-being.

*This is the philosophy behind MitoReboot.*

We created MitoReboot to help people understand the relationship between everyday choices and long-term health through a simple, practical approach: identifying potential sources of biological damage and strengthening the body's natural repair and resilience mechanisms.

Through daily lifestyle scoring, nutrition awareness, physical activity, sleep, stress management, metabolic health tracking, and environmental awareness, MitoReboot aims to transform health knowledge into consistent, measurable action.

Our vision is to move from a reactive model of healthcare to a proactive culture of prevention — where people do not wait for disease to appear before taking responsibility for their health.

I believe prevention should not be complicated, inaccessible, or limited to occasional medical visits. It should begin with the choices we make every day.

*MitoReboot is more than an app. It is an invitation to understand your biology, rethink your habits, and take meaningful steps towards a healthier future.*

Let us make prevention a daily practice, not a distant promise.

*Dr. Krithikaa Sekar*
Founder & Chairman, MitoReboot Private Limited
Consultant, Radiation Oncology | Cancer Researcher`;

export const FounderNoteContent: React.FC<{ rawNote?: string }> = ({ rawNote }) => {
  const { branding } = useAuth();
  const noteText = (rawNote || branding?.founderNote || DEFAULT_FOUNDER_NOTE_TEXT).trim();

  const isHtml = noteText.includes('<p>') || noteText.includes('<div>') || noteText.includes('<br>') || noteText.includes('<h1>') || noteText.includes('<h2>');

  if (isHtml) {
    return (
      <div 
        className="founder-note-content prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3"
        dangerouslySetInnerHTML={{ __html: noteText }}
      />
    );
  }

  // Parse markdown-style blocks
  const lines = noteText.split('\n');
  const elements: React.ReactNode[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = (key: string) => {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(' ').trim();
    paragraphBuffer = [];

    // Check if it's the signature block
    if (text.includes('Dr. Krithikaa Sekar') || text.includes('Founder & Chairman')) {
      elements.push(
        <div key={key} className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 border border-rose-200/80 dark:border-rose-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              🩺
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                Dr. Krithikaa Sekar
              </h5>
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                Founder & Chairman, MitoReboot Private Limited
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Consultant, Radiation Oncology | Cancer Researcher
              </p>
            </div>
          </div>
        </div>
      );
      return;
    }

    // Check if it's a quote / italic callout
    const isQuote = (text.startsWith('*') && text.endsWith('*')) || text.startsWith('_');
    const cleanText = text.replace(/^\*|\*$|^_|_$/g, '');

    if (isQuote) {
      elements.push(
        <div key={key} className="p-3.5 my-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-l-3 border-rose-500 text-xs sm:text-sm font-bold italic text-slate-800 dark:text-slate-200">
          "{cleanText}"
        </div>
      );
    } else {
      elements.push(
        <p key={key} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {cleanText}
        </p>
      );
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph(`p-${index}`);
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushParagraph(`pre-h1-${index}`);
      elements.push(
        <div key={`h1-${index}`} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {trimmed.replace(/^#\s+/, '')}
          </h3>
        </div>
      );
    } else if (trimmed.startsWith('## ')) {
      flushParagraph(`pre-h2-${index}`);
      elements.push(
        <div key={`h2-${index}`} className="mb-3">
          <h4 className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 tracking-wide uppercase">
            {trimmed.replace(/^##\s+/, '')}
          </h4>
        </div>
      );
    } else {
      paragraphBuffer.push(trimmed);
    }
  });

  flushParagraph('p-final');

  return (
    <div className="space-y-3.5 font-sans">
      {elements}
    </div>
  );
};

interface FounderNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FounderNoteModal: React.FC<FounderNoteModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col border-t sm:border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden relative font-sans antialiased text-slate-800 dark:text-slate-100">
        
        {/* Mobile handle indicator */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0 text-lg">
              👑
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Founder's Vision
                </span>
                <span className="text-[10px] text-slate-400 font-bold">•</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-rose-500" />
                  Oncology & Lifestyle
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight mt-0.5">
                A Note from the Founder
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700 shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 no-scrollbar">
          <FounderNoteContent />
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>MitoReboot — Prevention as a Daily Practice</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
