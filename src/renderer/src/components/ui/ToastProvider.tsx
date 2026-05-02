import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  const timeoutIdsRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((toastId: string): void => {
    const timeoutId = timeoutIdsRef.current.get(toastId);

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(toastId);
    }

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
      const timeoutId = window.setTimeout(() => dismiss(nextToast.id), toastDurationMs);
      timeoutIdsRef.current.set(nextToast.id, timeoutId);
    },
    [dismiss],
  );

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIds.clear();
    };
  }, []);

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
