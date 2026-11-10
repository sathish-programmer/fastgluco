import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { RefreshCw, CheckCircle2, ArrowDown, Loader2 } from 'lucide-react';
import { triggerHaptic } from '../utils/hapticHelper';
import { useLanguage } from '../context/LanguageContext';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, disabled = false }) => {
  const { t } = useLanguage();
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

  const rotation = Math.min(360, (pullDistance / THRESHOLD) * 360);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-y-auto overscroll-none">
      {/* Modern Floating Dynamic Pill Indicator */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] pointer-events-none transition-all duration-200 ease-out"
        style={{
          transform: `translate(-50%, ${isRefreshing || showSuccess ? '0' : Math.max(-50, pullDistance - 55)}px)`,
          opacity: pullDistance > 12 || isRefreshing || showSuccess ? 1 : 0
        }}
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/50 text-xs font-bold text-slate-800 dark:text-slate-100 transition-all">
          {showSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-300 font-black text-[11px] tracking-tight">
                {t('pullToRefresh.recordsUpToDate', 'Records Up to Date')}
              </span>
            </>
          ) : isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
              <span className="text-slate-700 dark:text-slate-200 font-extrabold text-[11px] tracking-tight">
                {t('pullToRefresh.syncingLogs', 'Syncing Cellular Logs...')}
              </span>
            </>
          ) : pullDistance >= THRESHOLD ? (
            <>
              <ArrowDown className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-bounce shrink-0" />
              <span className="text-blue-600 dark:text-blue-400 font-black text-[11px] tracking-tight">
                {t('pullToRefresh.releaseToRefresh', 'Release to Refresh')}
              </span>
            </>
          ) : (
            <>
              <RefreshCw
                className="w-3.5 h-3.5 text-slate-500 shrink-0"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              <span className="text-slate-500 font-medium text-[11px]">
                {t('pullToRefresh.pullToRefresh', 'Pull to Refresh')}
              </span>
            </>
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
