import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface FeedbackContextType {
  toast: (message: string, kind?: ToastKind) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

const TOAST_DURATION_MS = 4000;

/** In-app replacement for window.alert / window.confirm, styled to match the app */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = nextId.current++;
    setToasts(prev => [...prev.slice(-2), { id, message, kind }]);
    window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
  }, [dismiss]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setPendingConfirm({ ...options, resolve });
    });
  }, []);

  const settleConfirm = useCallback((ok: boolean) => {
    setPendingConfirm(current => {
      current?.resolve(ok);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pendingConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settleConfirm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingConfirm, settleConfirm]);

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div
        className="fixed top-4 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-[400px] flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg border text-sm animate-[toast-in_0.2s_ease-out] ${
              t.kind === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : t.kind === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {t.kind === 'error' ? <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              : t.kind === 'success' ? <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
              : <Info size={18} className="flex-shrink-0 mt-0.5 text-orange-500" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="flex-shrink-0 opacity-60">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {pendingConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40"
          onClick={() => settleConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-[430px] bg-white rounded-t-3xl p-6 pb-8"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="text-lg font-bold text-slate-900">{pendingConfirm.title}</h2>
            {pendingConfirm.message && (
              <p className="text-sm text-slate-600 mt-2">{pendingConfirm.message}</p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => settleConfirm(false)}
                className="flex-1 bg-slate-100 text-slate-800 py-3 rounded-xl font-medium active:scale-95 transition-transform"
              >
                {pendingConfirm.cancelLabel ?? 'Cancel'}
              </button>
              <button
                autoFocus
                onClick={() => settleConfirm(true)}
                className={`flex-1 text-white py-3 rounded-xl font-medium active:scale-95 transition-transform ${
                  pendingConfirm.destructive
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500'
                }`}
              >
                {pendingConfirm.confirmLabel ?? 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback(): FeedbackContextType {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider');
  return ctx;
}
