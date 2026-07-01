import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Notification Container Overlay */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4 space-y-2 pointer-events-none">
        {toasts.map((toast) => {
          let bgColor = 'bg-slate-900/95 text-white';
          let borderColor = 'border-slate-800';
          let icon = <Info className="h-5 w-5 text-blue-400 shrink-0" />;

          if (toast.type === 'success') {
            bgColor = 'bg-white/95 text-slate-800 shadow-xl';
            borderColor = 'border-emerald-100';
            icon = <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />;
          } else if (toast.type === 'error') {
            bgColor = 'bg-white/95 text-slate-800 shadow-xl';
            borderColor = 'border-red-100';
            icon = <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start justify-between p-4 rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-md shadow-lg pointer-events-auto transition-all duration-300 animate-slide-in`}
            >
              <div className="flex items-start space-x-3">
                {icon}
                <p className="text-xs font-bold leading-normal">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors ml-3 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
