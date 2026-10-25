import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { IPhoneBanner } from '../../features/auth/IPhoneBanner';
import { OfflineBanner } from './OfflineBanner';

export function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <OfflineBanner />
      <IPhoneBanner />
      <main className="flex-1 pb-24 max-w-lg w-full mx-auto px-4 pt-3 sm:pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
