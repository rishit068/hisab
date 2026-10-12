import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { en } from '../../i18n/en';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTextSize, type TextSize } from '../../context/TextSizeContext';
import { useMembers, useCategories, useExpenses, useSettlements } from '../../hooks/useData';
import { generateCsvContent, downloadCsv } from '../../lib/exportCsv';
import { MembersAdminModal } from './MembersAdminModal';
import { CategoriesAdminModal } from './CategoriesAdminModal';
import { useSnackbar } from '../../context/SnackbarContext';

export function MenuPage() {
  const navigate = useNavigate();
  const { isAdmin, member } = useAuth();
  const { textSize, setTextSize } = useTextSize();
  const { showSnackbar } = useSnackbar();

  const [showMembers, setShowMembers] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load all data for CSV export (include deleted)
  const { members } = useMembers();
  const { categories } = useCategories();
  const { expenses } = useExpenses(true);
  const { settlements } = useSettlements(true);

  const textSizeOptions: { label: string; value: TextSize }[] = [
    { label: en.menuTextSizeNormal, value: 'normal' },
    { label: en.menuTextSizeLarge, value: 'large' },
    { label: en.menuTextSizeExtraLarge, value: 'extra-large' },
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = generateCsvContent({ expenses, settlements, members, categories });
      downloadCsv(csv);
    } catch {
      showSnackbar(en.errorGeneric);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">
        {en.menuTitle}
      </h1>

      {member && (
        <p className="text-lg text-[var(--muted)]">
          {en.greeting.replace('{{name}}', member.name)}
        </p>
      )}

      {/* Text size */}
      <section aria-labelledby="text-size-heading">
        <h2 id="text-size-heading" className="text-base font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
          {en.menuTextSize}
        </h2>
        <Card className="!p-4">
          <div className="flex gap-3">
            {textSizeOptions.map(({ label, value }) => {
              const isSelected = textSize === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTextSize(value)}
                  aria-pressed={isSelected}
                  className={
                    'flex-1 min-h-[56px] px-3 py-3 rounded-xl font-semibold transition-colors border-2 ' +
                    (isSelected
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-gray-50')
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Admin section */}
      {isAdmin && (
        <section aria-labelledby="admin-heading">
          <h2 id="admin-heading" className="text-base font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
            Admin
          </h2>
          <Card className="!p-0 overflow-hidden">
            <button
              onClick={() => setShowMembers(true)}
              className={menuItemClass}
              aria-label={en.menuMembers}
            >
              <span>{en.menuMembers}</span>
              <ChevronRight />
            </button>
            <button
              onClick={() => setShowCategories(true)}
              className={menuItemClass + ' border-b-0'}
              aria-label={en.menuCategories}
            >
              <span>{en.menuCategories}</span>
              <ChevronRight />
            </button>
          </Card>
        </section>
      )}

      {/* Data */}
      <section aria-labelledby="data-heading">
        <h2 id="data-heading" className="text-base font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
          Data
        </h2>
        <Card className="!p-4">
          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="secondary"
            aria-label={en.menuExport}
          >
            {exporting ? 'Exporting...' : en.menuExport}
          </Button>
        </Card>
      </section>

      {/* Account */}
      <section aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-base font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
          Account
        </h2>
        <Card className="!p-0 overflow-hidden">
          <button
            onClick={() => navigate('/logout')}
            className={menuItemClass + ' border-b-0 text-[var(--owe)]'}
            aria-label={en.menuLogout}
          >
            <span>{en.menuLogout}</span>
          </button>
        </Card>
      </section>

      {/* Modals */}
      {showMembers && (
        <MembersAdminModal onClose={() => setShowMembers(false)} />
      )}
      {showCategories && (
        <CategoriesAdminModal onClose={() => setShowCategories(false)} />
      )}
    </div>
  );
}

const menuItemClass =
  'w-full flex items-center justify-between text-left px-4 py-4 min-h-[56px] text-lg text-[var(--text)] ' +
  'border-b border-[var(--border)] ' +
  'hover:bg-gray-50 transition-colors duration-150 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset';

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-[var(--muted)] flex-shrink-0"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
