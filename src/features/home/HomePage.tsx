import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { en } from '../../i18n/en';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useMembers, useCategories, useExpenses, useSettlements, useBalances, useExpenseMutations } from '../../hooks/useData';
import { useSnackbar } from '../../context/SnackbarContext';
import { useRealtime } from '../../hooks/useRealtime';
import { formatPaise } from '../../lib/money';
import { AddExpenseModal } from '../expenses/AddExpenseModal';
import { SettleUpModal } from '../settlements/SettleUpModal';

export function HomePage() {
  const { member } = useAuth();
  const navigate = useNavigate();
  const { showSavedWithUndo } = useSnackbar();

  const { members, loading: loadingMembers, refetch: refetchMembers } = useMembers();
  const { categories, refetch: refetchCategories } = useCategories();
  const { expenses, loading: loadingExpenses, refetch: refetchExpenses } = useExpenses();
  const { settlements, loading: loadingSettlements, refetch: refetchSettlements } = useSettlements();

  // Multi-device realtime subscription (§9)
  useRealtime({
    onDataChange: () => {
      refetchExpenses();
      refetchSettlements();
      refetchMembers();
      refetchCategories();
    },
  });

  const { createExpense, softDeleteExpense, createSettlement } = useExpenseMutations(() => {
    refetchExpenses();
    refetchSettlements();
  });

  // Pass members filtered so admin is not shown as a split peer
  const splitMembers = members.filter((m) => !m.is_admin);
  const { overallNetPaise, pairwise } = useBalances(splitMembers, expenses, settlements);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [settleUpTarget, setSettleUpTarget] = useState<{ memberId: string; amountPaise: number } | null>(null);

  const name = member?.name ?? '';
  const isLoading = loadingMembers || loadingExpenses || loadingSettlements;

  const handleSavedWithUndo = (expenseId: string) => {
    showSavedWithUndo(async () => {
      await softDeleteExpense(expenseId);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Greeting */}
      <h1 className="text-xl font-semibold text-[var(--muted)]">
        Good to see you, {name}
      </h1>

      {/* 2. Overall Summary Hero Card */}
      <div className="bg-[#EEF6F6] rounded-2xl p-6 card-shadow text-center">
        {overallNetPaise > 0 && (
          <p className="text-3xl font-bold text-[var(--owe)]">
            {en.homeOverallOwed.replace('{{amount}}', formatPaise(overallNetPaise))}
          </p>
        )}
        {overallNetPaise < 0 && (
          <p className="text-3xl font-bold text-[var(--get)]">
            {en.homeOverallGetBack.replace('{{amount}}', formatPaise(-overallNetPaise))}
          </p>
        )}
        {overallNetPaise === 0 && (
          <p className="text-3xl font-bold text-[var(--primary)]">
            {en.homeAllSettled}
          </p>
        )}
      </div>

      {/* 3. One Card Per Other Member */}
      <div className="space-y-4">
        {isLoading && (
          <Card>
            <p className="text-lg text-[var(--muted)] text-center">Loading...</p>
          </Card>
        )}

        {!isLoading && pairwise.length === 0 && (
          <Card>
            <p className="text-lg text-[var(--muted)] text-center">
              {en.homeNoExpenses}
            </p>
          </Card>
        )}

        {!isLoading &&
          pairwise.map(({ otherMember, netPaise }) => {
            const hasDebt = netPaise > 0;
            const hasCredit = netPaise < 0;
            const initial = otherMember.name.charAt(0).toUpperCase();

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
              <Card
                key={otherMember.id}
                className="hover:border-[var(--primary)] transition-all duration-200 flex flex-col gap-4"
              >
                <div
                  onClick={() => navigate(`/history?member=${otherMember.id}`)}
                  className="cursor-pointer flex items-center gap-4"
                >
                  {/* Avatar circle */}
                  <div
                    className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xl font-bold shrink-0"
                    aria-hidden="true"
                  >
                    {initial}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text)]">
                      {otherMember.name}
                    </h2>
                    <p className={`text-base font-semibold ${textColor}`}>
                      {sentence}
                    </p>
                  </div>
                </div>

                {/* Settle up button visible when you owe this person */}
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
                      className="!min-h-[48px] !text-base"
                      aria-label={`Settle up with ${otherMember.name}`}
                    >
                      {en.settleTitle}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
      </div>

      {/* 4. Large Primary Add Expense Button */}
      <div className="pt-2">
        <Button
          onClick={() => setIsAddExpenseOpen(true)}
          aria-label={en.homeAddExpense}
        >
          {en.homeAddExpense}
        </Button>
      </div>

      {/* Add Expense Modal */}
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

      {/* Settle Up Modal */}
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
    </div>
  );
}
