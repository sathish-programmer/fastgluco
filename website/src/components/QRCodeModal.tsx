import React from 'react';
import { Smartphone, X, CheckCircle2, Apple, Play } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, appName = 'Mito Reboot' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Smartphone className="h-3.5 w-3.5 text-blue-600" />
          <span>Scan to Install</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Get {appName} on Your Phone
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Scan the QR code below with your phone camera to download directly from the App Store.
        </p>

        {/* QR Code Container */}
        <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-3xl inline-flex flex-col items-center justify-center shadow-inner">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('https://apps.apple.com/in/app/mito-reboot/id6783705985')}`}
            alt="Mito Reboot App Store QR Code"
            className="w-44 h-44 rounded-2xl bg-white p-2 shadow-sm"
          />
          <span className="text-[11px] font-bold text-slate-500 mt-2">
            Point camera at QR code
          </span>
        </div>

        {/* App Store Links */}
        <div className="flex items-center justify-center gap-3">
          <a
            href="https://apps.apple.com/in/app/mito-reboot/id6783705985"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Apple className="h-4 w-4" />
            <span>App Store</span>
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=in.mitoreboot.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Play Store</span>
          </a>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Free to Install</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> iOS & Android</span>
        </div>
      </div>
    </div>
  );
};

