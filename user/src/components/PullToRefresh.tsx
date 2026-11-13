import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../utils/hapticHelper';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, disabled = false }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const touchStartY = useRef(0);
  const hasTriggeredThresholdHaptic = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 72;
  const MAX_PULL = 115;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only initiate pull when scroll is at the very top
      if (container.scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY;
        hasTriggeredThresholdHaptic.current = false;
      } else {
        touchStartY.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY.current || isRefreshing || container.scrollTop > 0) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;

      if (diff > 0) {
        // Smooth logarithmic resistance curve
        const pull = Math.min(MAX_PULL, diff * 0.45);
        setPullDistance(pull);

        if (pull >= THRESHOLD && !hasTriggeredThresholdHaptic.current) {
          triggerHaptic('medium');
          hasTriggeredThresholdHaptic.current = true;
        } else if (pull < THRESHOLD && hasTriggeredThresholdHaptic.current) {
          hasTriggeredThresholdHaptic.current = false;
        }

        if (e.cancelable && pull > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!touchStartY.current || isRefreshing) return;

      if (pullDistance >= THRESHOLD) {
        setIsRefreshing(true);
        triggerHaptic('medium');
        setPullDistance(THRESHOLD);

        const startTime = Date.now();
        try {
          await onRefresh();
          // Ensure smooth perceived sync feedback (at least 600ms)
          const elapsed = Date.now() - startTime;
          if (elapsed < 600) {
            await new Promise(resolve => setTimeout(resolve, 600 - elapsed));
          }
          triggerHaptic('success');
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
          }, 1400);
        } catch {
          // ignore error
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
      touchStartY.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, disabled, onRefresh]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-y-auto overscroll-none">
      {/* Instagram-Style Circular Floating Pull Indicator */}
      <div
        className="fixed top-2.5 left-1/2 -translate-x-1/2 z-[999] pointer-events-none transition-all duration-200 ease-out"
        style={{
          transform: `translate(-50%, ${isRefreshing || showSuccess ? '16px' : Math.max(-48, pullDistance - 48)}px) scale(${pullDistance > 8 || isRefreshing || showSuccess ? 1 : 0.6})`,
          opacity: pullDistance > 8 || isRefreshing || showSuccess ? 1 : 0
        }}
      >
        <div className="w-10 h-10 rounded-full bg-white/95 dark:bg-[#262626]/95 backdrop-blur-md border border-slate-200/90 dark:border-white/10 shadow-xl shadow-black/15 flex items-center justify-center transition-all">
          {showSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-150" />
          ) : isRefreshing ? (
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="38 20"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-slate-700 dark:text-slate-200 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              style={{ transform: `rotate(${Math.min(360, (pullDistance / THRESHOLD) * 270)}deg)` }}
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="56.5"
                strokeDashoffset={56.5 * (1 - Math.min(1, pullDistance / THRESHOLD))}
              />
            </svg>
          )}
        </div>
      </div>

      <div
        style={{
          transform: (pullDistance > 0 || isRefreshing) ? `translateY(${pullDistance}px)` : undefined,
          transition: isRefreshing ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};
