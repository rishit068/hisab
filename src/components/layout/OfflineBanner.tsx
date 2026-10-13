import { useState, useEffect, useCallback } from 'react';
import { en } from '../../i18n/en';
import {
  getPendingExpenses,
  getPendingSettlements,
  flushOfflineQueue,
  subscribeToQueueChanges,
} from '../../lib/offlineQueue';
import { useSnackbar } from '../../context/SnackbarContext';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(
    getPendingExpenses().length + getPendingSettlements().length
  );
  const [isSending, setIsSending] = useState(false);
  const { showMessage } = useSnackbar();

  const updateCounts = useCallback(() => {
    setPendingCount(getPendingExpenses().length + getPendingSettlements().length);
  }, []);

  const triggerFlush = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSending(true);
    try {
      const res = await flushOfflineQueue();
      if (res.expensesSent > 0 || res.settlementsSent > 0) {
        showMessage(en.offlineSentSuccess, 3000);
      }
    } finally {
      setIsSending(false);
      updateCounts();
    }
  }, [showMessage, updateCounts]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      triggerFlush();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to local queue additions
    const unsubscribe = subscribeToQueueChanges(() => {
      updateCounts();
      if (navigator.onLine) {
        triggerFlush();
      }
    });

    // Periodic check every 30 seconds when online to process any pending items
    const interval = setInterval(() => {
      if (navigator.onLine && (getPendingExpenses().length > 0 || getPendingSettlements().length > 0)) {
        triggerFlush();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, [triggerFlush, updateCounts]);

  if (!isOffline && pendingCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 shadow-md transition-colors"
    >
      {isOffline ? (
        <div className="bg-[var(--owe)] text-white px-4 py-3 text-center text-base font-semibold">
          {pendingCount > 0 ? (
            <span>
              {pendingCount === 1
                ? en.offlinePendingNotice.replace('{{count}}', '1')
                : en.offlinePendingNoticePlural.replace('{{count}}', pendingCount.toString())}
            </span>
          ) : (
            <span>{en.offlineBanner}</span>
          )}
        </div>
      ) : pendingCount > 0 ? (
        <div className="bg-[var(--primary)] text-white px-4 py-2 flex items-center justify-between gap-3 text-base font-semibold">
          <span>
            {pendingCount === 1
              ? en.offlinePendingNotice.replace('{{count}}', '1')
              : en.offlinePendingNoticePlural.replace('{{count}}', pendingCount.toString())}
          </span>
          <button
            onClick={triggerFlush}
            disabled={isSending}
            className="px-3 py-1 bg-white text-[var(--primary)] rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send now'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
