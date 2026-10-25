import { NavLink } from 'react-router-dom';
import { en } from '../../i18n/en';

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

const navItems = [
  { to: '/', label: en.navHome, icon: HomeIcon },
  { to: '/history', label: en.navHistory, icon: HistoryIcon },
  { to: '/menu', label: en.navMenu, icon: MenuIcon },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] z-40"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center max-w-lg mx-auto min-h-[64px]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2 text-sm font-semibold transition-all duration-200 relative ` +
              (isActive
                ? 'text-[var(--primary)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]')
            }
            aria-label={item.label}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-1.5 w-1 h-1 rounded-full bg-[var(--primary)]" aria-hidden="true" />
                )}
                <item.icon />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
