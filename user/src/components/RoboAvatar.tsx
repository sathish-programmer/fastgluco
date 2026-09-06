import React from 'react';
import { motion } from 'framer-motion';

export interface RoboAvatarProps {
  isSpeaking?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  showSoundwaves?: boolean;
}

export const RoboAvatar: React.FC<RoboAvatarProps> = ({
  isSpeaking = false,
  size = 'md',
  className = '',
  showSoundwaves = true,
}) => {
  // Determine numerical pixel dimensions based on preset or explicit number
  const getSizePx = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs': return 24;
      case 'sm': return 32;
      case 'md': return 40;
      case 'lg': return 52;
      case 'xl': return 72;
      case '2xl': return 96;
      default: return 40;
    }
  };

  const dim = getSizePx();

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: dim, height: dim }}
    >
      {/* ── SPEAKING SOUNDWAVE AURA RINGS ── */}
      {showSoundwaves && isSpeaking && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-400/30 dark:bg-cyan-400/40 pointer-events-none"
            animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-500/25 dark:bg-blue-400/30 pointer-events-none"
            animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
        </>
      )}

      {/* ── VECTOR ROBOT SVG ── */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Head Body Gradient */}
          <linearGradient id="roboHeadGrad" x1="10" y1="20" x2="90" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Face Plate Metallic Shield */}
          <linearGradient id="roboFaceGrad" x1="20" y1="30" x2="80" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Eye Glow Gradient */}
          <radialGradient id="roboEyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.8" />
          </radialGradient>

          {/* Ears Chrome Accent */}
          <linearGradient id="roboEarGrad" x1="0" y1="0" x2="0" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>

        {/* ── ANTENNA ── */}
        <line x1="50" y1="18" x2="50" y2="7" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
        <motion.circle
          cx="50"
          cy="6"
          r="4.5"
          fill={isSpeaking ? '#F59E0B' : '#38BDF8'}
          animate={
            isSpeaking
              ? { scale: [1, 1.4, 1], fill: ['#F59E0B', '#38BDF8', '#F59E0B'] }
              : { scale: [1, 1.15, 1] }
          }
          transition={{ duration: isSpeaking ? 0.4 : 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ── EARS / SIDE BOLTS ── */}
        <rect x="10" y="44" width="7" height="16" rx="3.5" fill="url(#roboEarGrad)" />
        <rect x="83" y="44" width="7" height="16" rx="3.5" fill="url(#roboEarGrad)" />

        {/* ── HEAD OUTER SHELL ── */}
        <rect x="16" y="18" width="68" height="66" rx="22" fill="url(#roboHeadGrad)" stroke="#60A5FA" strokeWidth="2.5" />

        {/* Outer Head Shine Highlight */}
        <path d="M 24 24 Q 50 19 76 24" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

        {/* ── INNER FACE PLATE (Visor Screen) ── */}
        <rect x="22" y="27" width="56" height="48" rx="15" fill="url(#roboFaceGrad)" stroke="#334155" strokeWidth="2" />

        {/* ── EYES WITH BLINK ANIMATION ── */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
          style={{ originX: '50%', originY: '42%' }}
        >
          {/* Left Eye */}
          <circle cx="37" cy="42" r="7.5" fill="url(#roboEyeGlow)" />
          <circle cx="35" cy="40" r="2.5" fill="#FFFFFF" opacity="0.9" />

          {/* Right Eye */}
          <circle cx="63" cy="42" r="7.5" fill="url(#roboEyeGlow)" />
          <circle cx="61" cy="40" r="2.5" fill="#FFFFFF" opacity="0.9" />
        </motion.g>

        {/* Eye Glow aura when speaking */}
        {isSpeaking && (
          <motion.g
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            <circle cx="37" cy="42" r="9" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.7" />
            <circle cx="63" cy="42" r="9" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.7" />
          </motion.g>
        )}

        {/* ── CHEEK BLUSH / LED DOTS ── */}
        <circle cx="29" cy="55" r="2.5" fill="#F472B6" opacity="0.4" />
        <circle cx="71" cy="55" r="2.5" fill="#F472B6" opacity="0.4" />

        {/* ── DYNAMIC ANIMATED MOUTH ── */}
        {isSpeaking ? (
          /* ── SPEAKING MOUTH ANIMATION (Moves & Morphing Open/Close + Audio Wave Bars) ── */
          <g>
            {/* Opening/Closing Mouth Cavity */}
            <motion.ellipse
              cx="50"
              cy="62"
              rx="12"
              ry="6"
              fill="#0284C7"
              stroke="#38BDF8"
              strokeWidth="1.5"
              animate={{
                ry: [2, 7, 3, 9, 4, 8, 2],
                rx: [9, 13, 10, 14, 11, 13, 9],
              }}
              transition={{
                duration: 0.45,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Inner Voice Equalizer Bars Moving Inside Mouth */}
            <motion.rect
              x="43"
              y="59"
              width="2.5"
              height="6"
              rx="1"
              fill="#F59E0B"
              animate={{ height: [2, 8, 3, 7, 2] }}
              transition={{ duration: 0.3, repeat: Infinity, delay: 0 }}
            />
            <motion.rect
              x="48.7"
              y="58"
              width="2.5"
              height="8"
              rx="1"
              fill="#FFFFFF"
              animate={{ height: [4, 10, 2, 9, 4] }}
              transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
            />
            <motion.rect
              x="54.5"
              y="59"
              width="2.5"
              height="6"
              rx="1"
              fill="#F59E0B"
              animate={{ height: [3, 7, 2, 8, 3] }}
              transition={{ duration: 0.3, repeat: Infinity, delay: 0.2 }}
            />
          </g>
        ) : (
          /* ── IDLE / SMILE MOUTH ── */
          <path
            d="M 38 60 Q 50 67 62 60"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
};
