import React, { useState } from 'react';
import { Heart, Sparkles, FileUp, Utensils, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OnboardingTourProps {
  onComplete: () => void;
}

interface Slide {
  title: string;
  description: string;
  icon: React.ReactNode;
  bgGradient: string;
  accentColor: string;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const { branding } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      title: `Welcome to ${branding.appName}!`,
      description: 'Your premium circadian fasting companion. We help you monitor glucose spikes, log meals, and get intelligent clinical recommendations to optimize your metabolic health.',
      icon: branding.appLogoUrl ? (
        <img src={branding.appLogoUrl} alt={branding.appName} className="h-16 w-auto object-contain max-w-[100px]" />
      ) : (
        <Heart className="h-16 w-16 text-rose-500 fill-rose-500 animate-pulse" />
      ),
      bgGradient: 'from-rose-500/10 to-orange-500/10',
      accentColor: 'bg-rose-500'
    },
    {
      title: 'CGM Report Analysis',
      description: 'Upload your Abbott CGM export CSV or PDF reports. Our parsing algorithms immediately digitize your historical readings and generate comprehensive visual charts.',
      icon: <FileUp className="h-16 w-16 text-blue-500 animate-bounce" />,
      bgGradient: 'from-blue-500/10 to-indigo-500/10',
      accentColor: 'bg-blue-500'
    },
    {
      title: 'Glycemic Food Log',
      description: 'Track your meals and search through a rich food master. Log quantity and discover how specific foods impact your personal glucose spike thresholds.',
      icon: <Utensils className="h-16 w-16 text-emerald-500 animate-pulse" />,
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
      accentColor: 'bg-emerald-500'
    },
    {
      title: 'AI Health Coach',
      description: 'Interact with our integrated AI Coach for personalized feedback on your metrics. Receive advice tailored to your activity level, demographics, and health goals.',
      icon: <Sparkles className="h-16 w-16 text-violet-500" />,
      bgGradient: 'from-violet-500/10 to-fuchsia-500/10',
      accentColor: 'bg-violet-500'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };

  const activeSlide = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col relative transition-all duration-300 transform scale-100">
        
        {/* Close/Skip button at top right */}
        <button
          onClick={onComplete}
          className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Dynamic Graphic Header */}
        <div className={`h-48 bg-gradient-to-br ${activeSlide.bgGradient} flex items-center justify-center transition-colors duration-500`}>
          <div className="p-5 bg-white/80 backdrop-blur-sm rounded-[24px] shadow-sm">
            {activeSlide.icon}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 flex-1 flex flex-col justify-between text-center min-h-[220px]">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-3">
              {activeSlide.title}
            </h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed px-2">
              {activeSlide.description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 my-6">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide ? `w-6 ${activeSlide.accentColor}` : 'w-2.5 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between space-x-3">
            <button
              onClick={onComplete}
              className="text-xs font-black text-slate-400 hover:text-slate-600 px-4 py-3"
            >
              Skip
            </button>

            <div className="flex space-x-2">
              {currentSlide > 0 && (
                <button
                  onClick={handleBack}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full transition-all flex items-center justify-center"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={handleNext}
                className={`px-5 py-3 ${activeSlide.accentColor} hover:opacity-95 text-white font-extrabold text-xs rounded-full shadow-md transition-all flex items-center space-x-1.5`}
              >
                <span>{currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
