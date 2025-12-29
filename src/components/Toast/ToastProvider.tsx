'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './Toast.module.css';

const AUTO_DISMISS_MS = 5000;

interface Toast {
  id: string;
  message: string;
  iconSrc?: string;
  iconAlt?: string;
}

interface ToastContextValue {
  notify: (message: string, options?: { iconSrc?: string; iconAlt?: string }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message: string, options?: { iconSrc?: string; iconAlt?: string }) => {
      const id = createToastId();
      setToasts((prev) => [
        ...prev,
        { id, message, iconSrc: options?.iconSrc, iconAlt: options?.iconAlt },
      ]);
      const timer = setTimeout(() => {
        dismiss(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={styles.viewport}
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast}>
            {toast.iconSrc ? (
              <img
                className={styles.icon}
                src={toast.iconSrc}
                alt={toast.iconAlt ?? ''}
                loading="lazy"
              />
            ) : null}
            <span className={styles.message}>{toast.message}</span>
            <button
              className={styles.close}
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
