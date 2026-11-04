import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Browser } from '@capacitor/browser';

export interface ForceUpdateModalProps {
  isOpen: boolean;
  isMandatory: boolean;
  latestVersion: string;
  currentVersion: string;
  updateUrl: string;
  releaseNotes?: string;
  onDismiss?: () => void;
}

export const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({
  isOpen,
  isMandatory,
  latestVersion,
  currentVersion,
  updateUrl,
  releaseNotes,
  onDismiss
}) => {
  if (!isOpen) return null;

  const handleOpenStore = async () => {
    try {
      if (updateUrl) {
        await Browser.open({ url: updateUrl });
      } else {
        window.open(updateUrl, '_system');
      }
    } catch {
      window.open(updateUrl, '_system');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl text-center relative overflow-hidden"
        >
          {/* Decorative glowing gradient top bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

          {/* Icon Header */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-blue-500/15 to-purple-500/10 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center mb-4 text-primary relative">
            <RefreshCw className={`w-8 h-8 text-primary ${isMandatory ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full shadow-xs">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1.5">
            {isMandatory ? 'Update Required' : 'New Version Available'}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-4">
            {isMandatory ? (
              <>
                A critical update (<strong>v{latestVersion}</strong>) is required to continue using Mito_Reboot. This release includes essential improvements, clinical accuracy, and authentication fixes.
              </>
            ) : (
              <>
                A new version of Mito_Reboot (<strong>v{latestVersion}</strong>) is available with the latest improvements and bug fixes.
              </>
            )}
          </p>

          {/* Version Comparison Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 mb-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="text-left">
              <span className="block text-[9px] uppercase font-bold text-slate-400">Current App</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">v{currentVersion || 'Current'}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="text-right">
              <span className="block text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Required</span>
              <span className="font-mono font-black text-primary dark:text-indigo-400">v{latestVersion}</span>
            </div>
          </div>

          {/* Release Notes if provided */}
          {releaseNotes && (
            <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl p-2.5 mb-5 text-[11px] text-slate-600 dark:text-slate-400 text-left font-medium">
              <p className="text-[9.5px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>What's In This Update</span>
              </p>
              <p className="line-clamp-3">{releaseNotes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleOpenStore}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:opacity-95 active:scale-98 text-white rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Update App Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isMandatory && onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Maybe Later
              </button>
            )}
          </div>

          {isMandatory && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-3 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>You must update to continue using the application.</span>
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

