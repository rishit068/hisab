import { Outlet } from 'react-router-dom';
import { IPhoneBanner } from '../../features/auth/IPhoneBanner';
import { OfflineBanner } from './OfflineBanner';

export function AppShell() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5ED] via-[#FAF8F4] to-[#F5ECE1] flex flex-col">
      <OfflineBanner />
      <IPhoneBanner />
      <main className="flex-1 pb-10 max-w-lg w-full mx-auto px-4 pt-3 sm:pt-4">
        <Outlet />
      </main>
    </div>
  );
}
