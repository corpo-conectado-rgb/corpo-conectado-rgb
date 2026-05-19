import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-500',
    textColor: 'text-emerald-800',
    progress: 'bg-emerald-400'
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    textColor: 'text-red-800',
    progress: 'bg-red-400'
  }
};

export default function Toast({ message, type = 'success', duration = 4000, onClose }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const v = VARIANTS[type] || VARIANTS.success;
  const Icon = v.icon;

  useEffect(() => {
    // Trigger de entrada
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onClose?.(), 350);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-6 right-6 z-[9999] pointer-events-auto">
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-xl backdrop-blur-sm transition-all duration-350 ease-out ${v.bg} ${v.border} ${
          visible && !exiting
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-4 scale-95'
        }`}
        style={{ minWidth: '320px', maxWidth: '440px' }}
      >
        <Icon size={20} className={`${v.iconColor} shrink-0`} />
        <p className={`text-sm font-bold flex-1 ${v.textColor}`}>{message}</p>
        <button
          onClick={() => {
            setExiting(true);
            setTimeout(() => onClose?.(), 350);
          }}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition shrink-0"
        >
          <X size={13} />
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-black/5 overflow-hidden">
          <div
            className={`h-full ${v.progress} rounded-full`}
            style={{
              animation: `toast-progress ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
