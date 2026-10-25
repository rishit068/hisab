import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { IPhoneBanner } from '../../features/auth/IPhoneBanner';
import { OfflineBanner } from './OfflineBanner';

export function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <OfflineBanner />
      <IPhoneBanner />
      <header className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex items-center">
        <span className="text-xl font-bold tracking-tight text-[var(--primary)]">Hisaab</span>
      </header>
      <main className="pb-20 max-w-lg mx-auto px-4 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
