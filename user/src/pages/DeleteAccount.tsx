import React from 'react';
import { Trash2, AlertTriangle, Mail, Smartphone, ArrowLeft } from 'lucide-react';

export const DeleteAccount: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-5xl w-full rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
        
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-100">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Account Deletion</h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">Request to permanently delete your data.</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-8 flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-rose-800 leading-relaxed">
            Warning: Deleting your account is permanent. All your food logs, CGM reports, subscriptions, and health analysis data will be permanently erased from our servers.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-800">How to delete your account:</h2>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-slate-800">Method 1: Inside the App (Fastest)</h3>
            </div>
            <ol className="list-decimal pl-5 space-y-2 text-xs font-semibold text-slate-600">
              <li>Open the Mito Reboot app on your device.</li>
              <li>Go to the <strong>Profile</strong> tab in the bottom navigation.</li>
              <li>Tap on the <strong>Request Account Deletion</strong> button near the bottom.</li>
              <li>Follow the prompts to send the deletion request.</li>
            </ol>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-slate-800">Method 2: Email Request</h3>
            </div>
            <p className="text-xs font-semibold text-slate-600 mb-3">
              If you no longer have access to the app, you can request data deletion via email:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-xs font-semibold text-slate-600 mb-4">
              <li>Send an email to <strong>support@mitoreboot.in</strong></li>
              <li>Use the subject line: "Account Deletion Request"</li>
              <li>Include the phone number you used to register your account.</li>
            </ol>
            <a 
              href="mailto:support@mitoreboot.in?subject=Account Deletion Request" 
              className="inline-flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all w-full md:w-auto"
            >
              <Mail className="h-4 w-4" />
              <span>Email Support Now</span>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <a href="/" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to App</span>
          </a>
        </div>

      </div>
    </div>
  );
};
