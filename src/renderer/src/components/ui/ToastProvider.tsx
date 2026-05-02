import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ToastContext, type ToastInput, type ToastContextValue } from './toast-context';

interface Toast extends Required<ToastInput> {
  id: string;
}

const toastDurationMs = 4200;

const createToastId = (): string => {
  return window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((toastId: string): void => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  }, []);

  const notify = useCallback(
    (toast: ToastInput): void => {
      const nextToast: Toast = {
        id: createToastId(),
        title: toast.title,
        description: toast.description ?? '',
        tone: toast.tone ?? 'info',
      };

      setToasts((currentToasts) => [nextToast, ...currentToasts].slice(0, 4));
      window.setTimeout(() => dismiss(nextToast.id), toastDurationMs);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success(title, description) {
        notify({ title, description, tone: 'success' });
      },
      error(title, description) {
        notify({ title, description, tone: 'error' });
      },
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast" data-tone={toast.tone}>
            <div>
              <strong>{toast.title}</strong>
              {toast.description ? <p>{toast.description}</p> : null}
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}>
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
