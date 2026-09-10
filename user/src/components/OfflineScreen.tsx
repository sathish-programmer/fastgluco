import React, { useState } from 'react';
import { WifiOff, RefreshCw, Smartphone, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface OfflineScreenProps {
  onRetry?: () => void;
  appName?: string;
  logoUrl?: string;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({
  onRetry,
  appName = 'Mito Reboot',
  logoUrl
}) => {
  const { t } = useLanguage();
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    if (onRetry) {
      await onRetry();
    } else {
      window.location.reload();
    }
    setTimeout(() => {
      setIsRetrying(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-300">
      {/* Top Bar with Brand and Language Selector */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between pt-[max(1rem,calc(env(safe-area-inset-top,0px)+12px))] px-1 pb-4">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-7 w-auto object-contain" />
          ) : (
            <div className="h-7 w-7 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
              M
            </div>
          )}
          <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight">
            {appName}
          </span>
        </div>
        <LanguageSelector variant="dropdown" />
      </header>

      {/* Main Offline Content */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto text-center px-2 py-6">
        {/* Animated Radar Pulse Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-rose-500/20 dark:bg-rose-500/30 animate-ping duration-1000"></div>
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-gradient-to-tr from-rose-500/10 via-rose-50/60 to-indigo-50/40 dark:from-rose-950/40 dark:via-rose-900/20 dark:to-indigo-950/30 border border-rose-200/80 dark:border-rose-800/60 shadow-xl flex items-center justify-center backdrop-blur-md">
            <WifiOff className="h-10 w-10 sm:h-12 sm:w-12 text-rose-500 dark:text-rose-400 stroke-[2.2]" />
          </div>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2.5">
          {t('network.offlineTitle', 'No Internet Connection')}
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
          {t('network.offlineDesc', 'Please turn on your Wi-Fi or mobile data to access your health dashboard and sync logs.')}
        </p>

        {/* Tips Box */}
        <div className="w-full bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6 text-left space-y-2">
          <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <Smartphone className="h-4 w-4 text-blue-500 shrink-0" />
            <span>Check Cellular / Mobile Data switch in Settings</span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <Globe className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Verify Wi-Fi network connection & signal strength</span>
          </div>
        </div>

        {/* Retry Button */}
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? t('network.checking', 'Checking Connection...') : t('network.retry', 'Retry Connection')}</span>
        </button>
      </main>

      {/* Footer */}
      <footer className="text-center py-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        <span>{appName} • Offline Protection</span>
      </footer>
    </div>
  );
};
