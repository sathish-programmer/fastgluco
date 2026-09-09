import React from 'react';
import { Trash2, AlertTriangle, Smartphone, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const DeleteAccount: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-5xl w-full rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
        
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-100">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('auth.deleteAccount')}</h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">{t('auth.confirmDeleteAccount')}</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-8 flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-rose-800 leading-relaxed">
            Warning: Deleting your account is permanent. All your food logs, CGM reports, subscriptions, and health analysis data will be permanently erased from our servers.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-800">{t('delAcc.howToDelete', 'How to delete your account:')}</h2>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-slate-800">{t('delAcc.method1InsideApp', 'Method 1: Inside the App (Fastest)')}</h3>
            </div>
            <ol className="list-decimal pl-5 space-y-2 text-xs font-semibold text-slate-600">
              <li>{t('deleteStep1')}</li>
              <li>{t('deleteStep2Part1')}<strong>{t('nav.profile')}</strong>{t('deleteStep2Part2')}</li>
              <li>{t('deleteStep3Part1')}<strong>{t('profile.requestAccountDeletion', 'Request Account Deletion')}</strong>{t('deleteStep3Part2')}</li>
              <li>{t('deleteStep4')}</li>
            </ol>
          </div>


        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <a href="/" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>{t('returnToAppBtn')}</span>
          </a>
        </div>

      </div>
    </div>
  );
};
