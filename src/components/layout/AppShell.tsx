import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { IPhoneBanner } from '../../features/auth/IPhoneBanner';

export function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <IPhoneBanner />
      <main className="pb-20 max-w-lg mx-auto px-4 pt-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
