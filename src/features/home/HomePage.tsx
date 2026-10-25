import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { en } from '../../i18n/en';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  useMembers,
  useCategories,
  useExpenses,
  useSettlements,
  useBalances,
  useExpenseMutations,
} from '../../hooks/useData';
import { useSnackbar } from '../../context/SnackbarContext';
import { useRealtime } from '../../hooks/useRealtime';
import { formatPaise } from '../../lib/money';
import { AddExpenseModal } from '../expenses/AddExpenseModal';
import { EditExpenseModal } from '../expenses/EditExpenseModal';
import { SettleUpModal } from '../settlements/SettleUpModal';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Good morning 👋';
  if (hour >= 12 && hour < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
}

export function HomePage() {
  const { member } = useAuth();
  const navigate = useNavigate();
  const { showSavedWithUndo } = useSnackbar();

  const { members, loading: loadingMembers, refetch: refetchMembers } = useMembers();
  const { categories, refetch: refetchCategories } = useCategories();
  const { expenses, loading: loadingExpenses, refetch: refetchExpenses } = useExpenses();
  const { settlements, loading: loadingSettlements, refetch: refetchSettlements } = useSettlements();

  // Multi-device realtime subscription
  useRealtime({
    onDataChange: () => {
      refetchExpenses();
      refetchSettlements();
      refetchMembers();
      refetchCategories();
    },
  });

  const {
    createExpense,
    updateExpense,
    softDeleteExpense,
    createSettlement,
  } = useExpenseMutations(() => {
    refetchExpenses();
    refetchSettlements();
  });

  // Split members (exclude admin)
  const splitMembers = useMemo(() => members.filter((m) => !m.is_admin), [members]);
  const { overallNetPaise, pairwise } = useBalances(splitMembers, expenses, settlements);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [settleUpTarget, setSettleUpTarget] = useState<{ memberId: string; amountPaise: number } | null>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [hideAmounts, setHideAmounts] = useState(false);

  const name = member?.name ?? '';
  const initial = name ? name.charAt(0).toUpperCase() : 'H';
  const isLoading = loadingMembers || loadingExpenses || loadingSettlements;

  // Breakdown calculations for the two summary cards
  const totalYouOwePaise = useMemo(() => {
    return pairwise.reduce((acc, curr) => (curr.netPaise > 0 ? acc + curr.netPaise : acc), 0);
  }, [pairwise]);

  const totalYouGetBackPaise = useMemo(() => {
    return pairwise.reduce((acc, curr) => (curr.netPaise < 0 ? acc + Math.abs(curr.netPaise) : acc), 0);
  }, [pairwise]);

  const peopleYouOweCount = useMemo(() => {
    return pairwise.filter((p) => p.netPaise > 0).length;
  }, [pairwise]);

  const peopleWhoOweYouCount = useMemo(() => {
    return pairwise.filter((p) => p.netPaise < 0).length;
  }, [pairwise]);

  const handleSavedWithUndo = (expenseId: string) => {
    showSavedWithUndo(async () => {
      await softDeleteExpense(expenseId);
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Top Header: User Profile on Left, Menu Button on Top Right (Search removed) */}
      <header className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3.5">
          {/* User Avatar */}
          <div
            className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xl font-bold shadow-sm ring-2 ring-[var(--primary)]/20 shrink-0"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-[var(--muted)] flex items-center gap-1 leading-tight">
              {getGreeting()}
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text)] tracking-tight leading-tight mt-0.5">
              {name || 'Hisaab'}
            </h1>
          </div>
        </div>

        {/* Top-Right: Menu button only */}
        <button
          type="button"
          onClick={() => navigate('/menu')}
          className="w-12 h-12 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] flex items-center justify-center card-shadow active:scale-95 transition-all duration-150 focus:outline-none"
          aria-label="Open menu"
          title="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      </header>

      {/* 2. Hero Overview Card (Gradient backdrop with high radius) */}
      <section
        aria-label="Overall summary card"
        className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF9] to-[#F5F0E6] rounded-3xl p-6 sm:p-7 border border-[#E0D9CD] float-shadow animate-slide-up"
      >
        <div className="flex items-center justify-between text-[var(--muted)] mb-2">
          <span className="text-sm font-semibold tracking-wide uppercase text-[var(--muted)]">
            Overall status
          </span>
          <button
            type="button"
            onClick={() => setHideAmounts((prev) => !prev)}
            className="p-1.5 rounded-lg hover:bg-black/5 text-[var(--muted)] hover:text-[var(--text)] transition-colors focus:outline-none"
            aria-label={hideAmounts ? 'Show amount' : 'Hide amount'}
            title={hideAmounts ? 'Show amount' : 'Hide amount'}
          >
            {hideAmounts ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* Hero Amount */}
        <div className="my-2">
          <p className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">
            {hideAmounts
              ? '₹ •••••'
              : `₹${formatPaise(Math.abs(overallNetPaise))}`}
          </p>
        </div>

        {/* Status Badge */}
        <div className="mt-3 flex items-center">
          {overallNetPaise > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-sm font-bold bg-[var(--owe-bg)] text-[var(--owe)] border border-[var(--owe-border)]">
              <span className="w-2 h-2 rounded-full bg-[var(--owe)]" />
              You owe overall
            </span>
          )}
          {overallNetPaise < 0 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-sm font-bold bg-[var(--get-bg)] text-[var(--get)] border border-[var(--get-border)]">
              <span className="w-2 h-2 rounded-full bg-[var(--get)]" />
              You get back overall
            </span>
          )}
          {overallNetPaise === 0 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-sm font-bold bg-[#E8F3F3] text-[var(--primary)] border border-[#CDE3E3]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {en.homeAllSettled}
            </span>
          )}
        </div>
      </section>

      {/* 3. Action Buttons: 'Add' and 'History' — elongated pill shape */}
      <section aria-label="Quick actions" className="animate-slide-up stagger-1">
        <div className="flex gap-3.5">
          {/* Add Expense */}
          <button
            type="button"
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex-1 flex items-center justify-center gap-2.5 min-h-[60px] px-5 rounded-full bg-[var(--primary)] text-white shadow-md hover:bg-[var(--primary-hover)] hover:shadow-lg active:scale-[0.97] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            aria-label="Add expense"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-base font-bold tracking-tight">Add</span>
          </button>

          {/* History */}
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="flex-1 flex items-center justify-center gap-2.5 min-h-[60px] px-5 rounded-full bg-[var(--surface-raised)] border-2 border-[var(--border)] text-[var(--text)] shadow-sm hover:border-[var(--primary)] hover:text-[var(--primary)] active:scale-[0.97] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            aria-label="History"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-base font-bold tracking-tight">History</span>
          </button>
        </div>
      </section>

      {/* 4. Two Side-by-Side Summary Cards */}
      <section aria-label="Breakdown summary" className="grid grid-cols-2 gap-3 sm:gap-4 animate-slide-up stagger-2">
        {/* You Owe Card */}
        <div className="bg-[#FFFDF9] rounded-3xl p-4 sm:p-5 border border-[var(--owe-border)]/80 card-shadow hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[var(--owe-bg)] text-[var(--owe)] flex items-center justify-center font-bold text-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-bold text-[var(--muted)]">
              You owe
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-[var(--owe)] tracking-tight">
            {hideAmounts ? '₹ ••••' : `₹${formatPaise(totalYouOwePaise)}`}
          </p>
          <p className="text-xs font-semibold text-[var(--muted)] mt-1">
            {peopleYouOweCount > 0
              ? `to ${peopleYouOweCount} ${peopleYouOweCount === 1 ? 'person' : 'people'}`
              : 'Nothing owed'}
          </p>
        </div>

        {/* You Get Back Card */}
        <div className="bg-[#FFFDF9] rounded-3xl p-4 sm:p-5 border border-[var(--get-border)]/80 card-shadow hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[var(--get-bg)] text-[var(--get)] flex items-center justify-center font-bold text-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="17" y1="7" x2="7" y2="17" />
                <polyline points="17 17 7 17 7 7" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-bold text-[var(--muted)]">
              You get back
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-[var(--get)] tracking-tight">
            {hideAmounts ? '₹ ••••' : `₹${formatPaise(totalYouGetBackPaise)}`}
          </p>
          <p className="text-xs font-semibold text-[var(--muted)] mt-1">
            {peopleWhoOweYouCount > 0
              ? `from ${peopleWhoOweYouCount} ${peopleWhoOweYouCount === 1 ? 'person' : 'people'}`
              : 'All clear'}
          </p>
        </div>
      </section>

      {/* 5. People Section — single combined card with all names */}
      <section aria-labelledby="people-heading" className="animate-slide-up stagger-3 space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 id="people-heading" className="text-lg sm:text-xl font-bold text-[var(--text)]">
            People ({pairwise.length})
          </h2>
        </div>

        {isLoading && (
          <Card className="!p-6 text-center rounded-[28px]">
            <p className="text-base text-[var(--muted)] font-semibold">Loading people...</p>
          </Card>
        )}

        {!isLoading && pairwise.length === 0 && (
          <Card className="!p-6 text-center rounded-[28px]">
            <p className="text-base text-[var(--muted)] font-semibold">
              {en.homeNoExpenses}
            </p>
          </Card>
        )}

        {!isLoading && pairwise.length > 0 && (
          <div className="bg-[var(--surface-raised)] rounded-[28px] border border-[#E0D8CC] card-shadow overflow-hidden">
            {pairwise.map(({ otherMember, netPaise }, index) => {
              const hasDebt = netPaise > 0;
              const hasCredit = netPaise < 0;
              const initialLetter = otherMember.name.charAt(0).toUpperCase();

              let sentence = en.homeSettledWith.replace('{{name}}', otherMember.name);
              let textColor = 'text-[var(--muted)]';

              if (hasDebt) {
                sentence = en.homeYouOwe
                  .replace('{{name}}', otherMember.name)
                  .replace('{{amount}}', formatPaise(netPaise));
                textColor = 'text-[var(--owe)]';
              } else if (hasCredit) {
                sentence = en.homeOwesYou
                  .replace('{{name}}', otherMember.name)
                  .replace('{{amount}}', formatPaise(-netPaise));
                textColor = 'text-[var(--get)]';
              }

              return (
                <div key={otherMember.id}>
                  {/* Divider between rows (not before first) */}
                  {index > 0 && (
                    <div className="h-px bg-[var(--border-light)] mx-4" />
                  )}

                  <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 sm:py-5 hover:bg-[#FAFAF8] active:bg-[#F5F2EC] transition-colors duration-150">
                    <div
                      onClick={() => navigate(`/history?member=${otherMember.id}`)}
                      className="cursor-pointer flex items-center justify-between gap-3"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/history?member=${otherMember.id}`);
                        }
                      }}
                    >
                      {/* Left: Round Initial Badge & Name */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="w-11 h-11 rounded-full bg-[#EAF3F3] text-[var(--primary)] border border-[#CFE5E5] flex items-center justify-center text-base font-bold shrink-0"
                          aria-hidden="true"
                        >
                          {initialLetter}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-extrabold text-[var(--text)] truncate">
                            {otherMember.name}
                          </h3>
                          <p className={`text-sm font-semibold truncate ${textColor}`}>
                            {hideAmounts && (hasDebt || hasCredit)
                              ? hasDebt
                                ? `You owe ${otherMember.name} ₹••••`
                                : `${otherMember.name} owes you ₹••••`
                              : sentence}
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount Pill & Arrow */}
                      <div className="flex items-center gap-2 shrink-0">
                        {hasDebt && (
                          <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-[var(--owe-bg)] text-[var(--owe)] border border-[var(--owe-border)]">
                            {hideAmounts ? '₹ •••' : `₹${formatPaise(netPaise)}`}
                          </span>
                        )}
                        {hasCredit && (
                          <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-[var(--get-bg)] text-[var(--get)] border border-[var(--get-border)]">
                            {hideAmounts ? '₹ •••' : `+₹${formatPaise(-netPaise)}`}
                          </span>
                        )}
                        {!hasDebt && !hasCredit && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-[var(--muted)]">
                            Settled
                          </span>
                        )}
                        <div className="text-[var(--muted)]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Settle up button — shown inline when you owe this person */}
                    {hasDebt && (
                      <div>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setSettleUpTarget({
                              memberId: otherMember.id,
                              amountPaise: netPaise,
                            })
                          }
                          className="!min-h-[44px] !text-base rounded-full"
                          aria-label={`Settle up with ${otherMember.name}`}
                        >
                          {en.settleTitle}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modals */}
      {/* 1. Add Expense Modal */}
      {isAddExpenseOpen && member && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          members={members}
          categories={categories}
          currentMemberId={member.id}
          onSave={createExpense}
          onSavedWithUndo={handleSavedWithUndo}
        />
      )}

      {/* 2. Settle Up Modal */}
      {settleUpTarget && (
        <SettleUpModal
          isOpen={!!settleUpTarget}
          onClose={() => setSettleUpTarget(null)}
          members={members}
          initialTargetMemberId={settleUpTarget.memberId}
          initialAmountPaise={settleUpTarget.amountPaise}
          onSave={createSettlement}
          onSuccess={() => {
            refetchExpenses();
            refetchSettlements();
          }}
        />
      )}

      {/* 3. Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          isOpen={Boolean(editingExpense)}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          members={members}
          categories={categories}
          onSave={async (id, data) => {
            const res = await updateExpense(id, data);
            refetchExpenses();
            return res;
          }}
        />
      )}
    </div>
  );
}
