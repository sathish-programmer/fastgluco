import React, { useState, useEffect } from 'react';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react';

type BreathPhase = 'Inhale' | 'Hold (Full)' | 'Exhale' | 'Hold (Empty)';

export const InteractiveBreathworkPacer: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(4);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);

  const PHASES: { name: BreathPhase; duration: number; tip: string }[] = [
    { name: 'Inhale', duration: 4, tip: 'Breathe in slowly through your nose. Expand diaphragm.' },
    { name: 'Hold (Full)', duration: 4, tip: 'Gently suspend breath. Keep chest relaxed and shoulders soft.' },
    { name: 'Exhale', duration: 4, tip: 'Smoothly release air through slightly parted lips. Feel tension drop.' },
    { name: 'Hold (Empty)', duration: 4, tip: 'Stillness. Stimulates the vagal brake to lower heart rate.' }
  ];

  const currentPhase = PHASES[phaseIndex];

  useEffect(() => {
    let timer: any;
    if (isActive) {
      timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setPhaseIndex(pIndex => {
              const nextIndex = (pIndex + 1) % PHASES.length;
              if (nextIndex === 0) {
                setCyclesCompleted(c => c + 1);
              }
              return nextIndex;
            });
            return PHASES[(phaseIndex + 1) % PHASES.length].duration;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phaseIndex]);

  const handleReset = () => {
    setIsActive(false);
    setPhaseIndex(0);
    setSecondsLeft(4);
    setCyclesCompleted(0);
  };

  const getCircleScale = () => {
    if (!isActive) return 'scale-100';
    if (currentPhase.name === 'Inhale') return 'scale-125';
    if (currentPhase.name === 'Hold (Full)') return 'scale-125';
    if (currentPhase.name === 'Exhale') return 'scale-90';
    return 'scale-90';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-9 shadow-card border border-indigo-900/50 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/15 rounded-full filter blur-3xl pointer-events-none animate-pulse-subtle"></div>
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-teal-500/10 rounded-full filter blur-3xl pointer-events-none animate-pulse-subtle"></div>

      <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left: Info & Scientific Context */}
        <div className="lg:col-span-6 space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/70 border border-indigo-700/60 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Wind className="h-3.5 w-3.5 text-indigo-400" />
            <span>Interactive Vagus Nerve Studio</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Try 1-Minute Box Breathing Right Now
          </h3>

          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Box Breathing (4-4-4-4) is clinically proven to stimulate the parasympathetic vagal brake, reducing stress hormones (cortisol) and blunting post-meal glucose spikes within 5 minutes.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
              <span className="text-[10px] text-indigo-300 font-bold uppercase block">HRV Coherence</span>
              <span className="text-sm font-black text-emerald-400">+38% Balance</span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
              <span className="text-[10px] text-indigo-300 font-bold uppercase block">Cycles Done</span>
              <span className="text-sm font-black text-indigo-200">{cyclesCompleted} Rounds</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
            >
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
              <span>{isActive ? 'Pause Pacer' : 'Start 1-Minute Session'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset Pacer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: Animated Breathing Orb Canvas */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-3xl border border-indigo-900/40">
          <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64">
            {/* Outer pulsating ring */}
            <div
              className={`absolute inset-0 rounded-full border-2 border-indigo-400/30 transition-transform duration-1000 ease-in-out ${getCircleScale()}`}
            />
            {/* Inner glowing core */}
            <div
              className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-indigo-600 to-teal-400 opacity-90 shadow-[0_0_50px_rgba(99,102,241,0.5)] flex flex-col items-center justify-center transition-transform duration-1000 ease-in-out ${getCircleScale()}`}
            >
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {secondsLeft}s
              </span>
              <span className="text-xs font-bold text-indigo-100 uppercase tracking-widest mt-0.5">
                {currentPhase.name}
              </span>
            </div>
          </div>

          <p className="text-xs text-indigo-200/90 font-medium text-center mt-6 max-w-xs min-h-[36px]">
            {currentPhase.tip}
          </p>
        </div>
      </div>
    </div>
  );
};
