import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';
import { en } from '../i18n/en';

interface SnackbarContextValue {
  showSavedWithUndo: (onUndo: () => Promise<void> | void) => void;
  showMessage: (message: string, durationMs?: number) => void;
  showSnackbar: (message: string, durationMs?: number) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string>(en.addExpenseSaved);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [hasUndo, setHasUndo] = useState(true);
  const undoActionRef = useRef<(() => Promise<void> | void) | null>(null);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const hideSnackbar = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setVisible(false);
    undoActionRef.current = null;
  }, []);

  const showSavedWithUndo = useCallback((onUndo: () => Promise<void> | void) => {
    // Clear any active timers
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);

    undoActionRef.current = onUndo;
    setMessage(en.addExpenseSaved);
    setHasUndo(true);
    setSecondsRemaining(10);
    setVisible(true);

    // 1-second countdown interval
    intervalRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Dismiss after 10 seconds
    timerRef.current = window.setTimeout(() => {
      hideSnackbar();
    }, 10000);
  }, [hideSnackbar]);

  const showMessage = useCallback((msg: string, durationMs = 4000) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);

    undoActionRef.current = null;
    setMessage(msg);
    setHasUndo(false);
    setVisible(true);

    timerRef.current = window.setTimeout(() => {
      hideSnackbar();
    }, durationMs);
  }, [hideSnackbar]);

  const handleUndo = async () => {
    const action = undoActionRef.current;
    hideSnackbar();
    if (action) {
      await action();
    }
  };

  return (
    <SnackbarContext.Provider
      value={{
        showSavedWithUndo,
        showMessage,
        showSnackbar: showMessage,
        hideSnackbar,
      }}
    >
      {children}
      {visible && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-[var(--text)] text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{message}</span>
            {hasUndo && <span className="text-sm text-gray-300">({secondsRemaining}s)</span>}
          </div>
          {hasUndo ? (
            <button
              onClick={handleUndo}
              className="min-h-[48px] px-5 py-2 bg-white text-[var(--text)] text-lg font-bold rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label={en.addExpenseUndo}
            >
              {en.addExpenseUndo}
            </button>
          ) : (
            <button
              onClick={hideSnackbar}
              className="min-h-[44px] px-3 py-1 text-sm font-semibold text-gray-300 hover:text-white"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          )}
        </aside>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}
