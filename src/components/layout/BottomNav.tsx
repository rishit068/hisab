import { NavLink } from 'react-router-dom';
import { en } from '../../i18n/en';

const navItems = [
  { to: '/', label: en.navHome },
  { to: '/history', label: en.navHistory },
  { to: '/menu', label: en.navMenu },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] z-40"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center min-h-[56px] text-lg font-semibold transition-colors duration-150 ` +
              (isActive
                ? 'text-[var(--primary)] border-t-2 border-[var(--primary)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]')
            }
            aria-label={item.label}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
