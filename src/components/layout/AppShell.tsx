import { Outlet } from 'react-router-dom';
import { IPhoneBanner } from '../../features/auth/IPhoneBanner';
import { OfflineBanner } from './OfflineBanner';

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col" style={{background: 'linear-gradient(165deg, #DFF0F0 0%, #EEF6F5 20%, #FAF8F4 55%, #F5EDE2 85%, #F0E4D4 100%)', backgroundAttachment: 'fixed'}}>
      <OfflineBanner />
      <IPhoneBanner />
      <main className="flex-1 pb-10 max-w-lg w-full mx-auto px-4 pt-3 sm:pt-4">
        <Outlet />
      </main>
    </div>
  );
}
