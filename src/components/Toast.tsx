/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type Toast = {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
};

export interface ToastContextValue {
  showToast: (titleOrMessage: string, messageOrType?: string | ToastType, type?: ToastType) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TOAST_ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_THEMES: Record<ToastType, {
  border: string;
  bg: string;
  badge: string;
  badgeText: string;
  iconColor: string;
  titleColor: string;
  glow: string;
}> = {
  success: {
    border: 'border-emerald-500/40',
    bg: 'bg-slate-900/95 text-slate-100 dark:bg-slate-900/95',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    badgeText: 'SUCCESS',
    iconColor: 'text-emerald-400',
    titleColor: 'text-white font-semibold',
    glow: 'shadow-[0_8px_30px_rgb(16,185,129,0.15)]',
  },
  error: {
    border: 'border-red-500/40',
    bg: 'bg-slate-900/95 text-slate-100 dark:bg-slate-900/95',
    badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
    badgeText: 'ERROR',
    iconColor: 'text-red-400',
    titleColor: 'text-white font-semibold',
    glow: 'shadow-[0_8px_30px_rgb(239,68,68,0.18)]',
  },
  warning: {
    border: 'border-amber-500/40',
    bg: 'bg-slate-900/95 text-slate-100 dark:bg-slate-900/95',
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    badgeText: 'ALERT',
    iconColor: 'text-amber-400',
    titleColor: 'text-white font-semibold',
    glow: 'shadow-[0_8px_30px_rgb(245,158,11,0.15)]',
  },
  info: {
    border: 'border-blue-500/40',
    bg: 'bg-slate-900/95 text-slate-100 dark:bg-slate-900/95',
    badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    badgeText: 'NOTICE',
    iconColor: 'text-blue-400',
    titleColor: 'text-white font-semibold',
    glow: 'shadow-[0_8px_30px_rgb(59,130,246,0.15)]',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = toast.duration ?? 4200;

    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, [dismiss]);

  const showToast = useCallback((
    titleOrMessage: string,
    messageOrType?: string | ToastType,
    type?: ToastType
  ) => {
    // Support showToast(message, type)
    if (!type && (messageOrType === 'success' || messageOrType === 'error' || messageOrType === 'warning' || messageOrType === 'info')) {
      addToast({
        message: titleOrMessage,
        type: messageOrType as ToastType,
      });
      return;
    }

    // Support showToast(title, message, type)
    if (typeof messageOrType === 'string' && type) {
      addToast({
        title: titleOrMessage,
        message: messageOrType,
        type,
      });
      return;
    }

    // Support showToast(message) default info
    addToast({
      message: titleOrMessage,
      type: (messageOrType as ToastType) || 'info',
    });
  }, [addToast]);

  const success = useCallback((title: string, message?: string) => {
    addToast({ title, message: message || '', type: 'success' });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ title, message: message || '', type: 'error' });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ title, message: message || '', type: 'warning' });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ title, message: message || '', type: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismiss }}>
      {children}
      <aside
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const theme = TOAST_THEMES[toast.type];
          const Icon = TOAST_ICONS[toast.type];

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${theme.border} ${theme.bg} ${theme.glow} backdrop-blur-md transition-all duration-200 transform translate-y-0 shadow-2xl`}
              style={{
                animation: 'slideInToast 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${theme.iconColor}`} />
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${theme.badge}`}>
                    {theme.badgeText}
                  </span>
                  {toast.title && (
                    <h4 className={`text-xs ${theme.titleColor} truncate`}>
                      {toast.title}
                    </h4>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}
