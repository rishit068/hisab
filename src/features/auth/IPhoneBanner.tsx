import { useState, useEffect } from 'react';
import { en } from '../../i18n/en';
import { Button } from '../../components/ui/Button';

const BANNER_DISMISSED_KEY = 'hisaab-iphone-banner-dismissed';

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isStandalone = ('standalone' in window.navigator) && (window.navigator as unknown as { standalone: boolean }).standalone;
  return isIOS && !isStandalone;
}

export function IPhoneBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isIOSSafari() && !localStorage.getItem(BANNER_DISMISSED_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setVisible(false);
  };

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 bg-[var(--primary)] text-white p-4 z-50 flex items-center justify-between gap-3"
    >
      <p className="text-base">{en.iphoneBanner}</p>
      <Button
        variant="secondary"
        onClick={dismiss}
        className="!bg-white !text-[var(--primary)] shrink-0"
        aria-label={en.iphoneBannerDismiss}
      >
        {en.iphoneBannerDismiss}
      </Button>
    </div>
  );
}
