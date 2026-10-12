import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { en } from '../../i18n/en';
import { Card } from '../../components/ui/Card';

interface MenuItemProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  adminOnly?: boolean;
  isAdmin: boolean;
}

function MenuItem({ label, onClick, disabled, adminOnly, isAdmin }: MenuItemProps) {
  if (adminOnly && !isAdmin) return null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        'w-full text-left px-4 py-4 min-h-[56px] text-lg text-[var(--text)] ' +
        'border-b border-[var(--border)] last:border-b-0 ' +
        'hover:bg-gray-50 transition-colors duration-150 ' +
        'disabled:opacity-40 disabled:cursor-not-allowed ' +
        'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-inset'
      }
      aria-label={label}
    >
      {label}
      {disabled && (
        <span className="text-base text-[var(--muted)] ml-2">
          ({en.menuComingSoon})
        </span>
      )}
    </button>
  );
}

export function MenuPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">
        {en.menuTitle}
      </h1>

      <Card className="!p-0 overflow-hidden">
        <MenuItem
          label={en.menuMembers}
          adminOnly
          isAdmin={isAdmin}
          disabled
        />
        <MenuItem
          label={en.menuCategories}
          adminOnly
          isAdmin={isAdmin}
          disabled
        />
        <MenuItem
          label={en.menuTextSize}
          isAdmin={isAdmin}
          disabled
        />
        <MenuItem
          label={en.menuExport}
          isAdmin={isAdmin}
          disabled
        />
        <MenuItem
          label={en.menuLogout}
          isAdmin={isAdmin}
          onClick={() => navigate('/logout')}
        />
      </Card>
    </div>
  );
}
