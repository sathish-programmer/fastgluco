import React, { useState } from 'react';
import { ServerOff, RefreshCw, Headphones, LogOut, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface ServerUnavailableScreenProps {
  onRetry: () => void | Promise<void>;
  onContactSupport?: () => void;
  onLogout?: () => void;
  appName?: string;
  logoUrl?: string;
  errorMessage?: string;
}

export const ServerUnavailableScreen: React.FC<ServerUnavailableScreenProps> = ({
  onRetry,
  onContactSupport,
  onLogout,
  appName = 'Mito Reboot',
  logoUrl,
  errorMessage
}) => {
  const { t } = useLanguage();
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } catch {
      // Handled by parent
    } finally {
      setTimeout(() => {
        setIsRetrying(false);
      }, 1200);
    }
  };

  const handleSupportClick = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      window.location.href = 'mailto:support@mitoreboot.in?subject=Server%20Connection%20Issue%20Report';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-300">
      {/* Top Header */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between pt-[max(1rem,calc(env(safe-area-inset-top,0px)+12px))] px-1 pb-4">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-7 w-auto object-contain rounded-lg" />
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto text-center px-2 py-6">
        {/* Soft Animated Server Pulse Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 dark:bg-amber-500/25 animate-ping duration-1000" />
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-gradient-to-tr from-amber-500/10 via-amber-50/60 to-orange-50/40 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-xl flex items-center justify-center backdrop-blur-md">
            <ServerOff className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500 dark:text-amber-400 stroke-[2.2]" />
          </div>
        </div>

        {/* Title & Empathetic Notice */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {t('serverDown.title', 'Server Temporarily Unavailable')}
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
          {t('serverDown.desc', 'We are having trouble connecting to our application servers right now. Please rest assured that your active subscription, habits, and health reports are completely safe.')}
        </p>

        {/* Reassurance Badge */}
        <div className="w-full bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-800 text-left mb-6 space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{t('serverDown.safeTitle', 'Your account & data are secure')}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal pl-6">
            {errorMessage || t('serverDown.safeDesc', 'This is usually caused by brief network interruptions or routine server updates. It is not an issue with your membership.')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? t('serverDown.retrying', 'Reconnecting...') : t('serverDown.retryBtn', 'Refresh & Reconnect')}</span>
          </button>

          <button
            type="button"
            onClick={handleSupportClick}
            className="w-full py-3 px-6 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-[0.98] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-xs rounded-2xl shadow-2xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Headphones className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>{t('serverDown.supportBtn', 'Raise Support / Help')}</span>
          </button>
        </div>

        {/* Optional Sign Out */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="mt-6 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="h-3 w-3" />
            <span>{t('auth.signOut', 'Sign Out')}</span>
          </button>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
        <span>{appName} • Cloud Resilience Engine</span>
      </footer>
    </div>
  );
};
