import { useState, useEffect } from 'react';
import { en } from '../../i18n/en';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[var(--owe)] text-white px-4 py-3 text-center text-base font-semibold sticky top-0 z-50 shadow-md"
    >
      {en.offlineBanner}
    </div>
  );
}
