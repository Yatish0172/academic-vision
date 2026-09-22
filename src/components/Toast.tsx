import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles, X, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  iconType?: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, iconType, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#213145] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#3e536e] flex items-center gap-3 max-w-md">
        <div className="w-6 h-6 rounded-full bg-[#006e4b] text-white flex items-center justify-center shrink-0">
          {iconType === 'check' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : iconType === 'sparkles' ? (
            <Sparkles className="w-4 h-4" />
          ) : iconType === 'flag' ? (
            <AlertTriangle className="w-4 h-4 text-amber-300" />
          ) : (
            <Info className="w-4 h-4" />
          )}
        </div>

        <span className="text-[12px] font-medium text-[#eaf1ff] leading-snug">{message}</span>

        <button
          onClick={onClose}
          className="text-[#a2b5cd] hover:text-white ml-2 p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
