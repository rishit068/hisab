import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { en } from '../../i18n/en';
import { Card } from '../../components/ui/Card';
import { useExpenses, useMembers, useCategories, useExpenseMutations, type ExpenseWithSplits } from '../../hooks/useData';
import { useSnackbar } from '../../context/SnackbarContext';
import { useRealtime } from '../../hooks/useRealtime';
import { formatPaise } from '../../lib/money';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { AddExpenseModal } from '../expenses/AddExpenseModal';
import { EditExpenseModal } from '../expenses/EditExpenseModal';
import { CategoryIcon } from '../../components/ui/CategoryIcon';

type FilterType = 'all' | 'mine' | 'month';

function formatDateHeader(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().slice(0, 10);

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(parseInt(year, 10), month, day);
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return dateStr;
}

export function HistoryPage() {
  const { member } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterMemberId = searchParams.get('member');

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithSplits | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithSplits | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const { members, refetch: refetchMembers } = useMembers();
  const { categories, refetch: refetchCategories } = useCategories();
  const { expenses, loading, refetch } = useExpenses(showDeleted);

  useRealtime({
    onDataChange: () => {
      refetch();
      refetchMembers();
      refetchCategories();
    },
  });
  const { createExpense, updateExpense, softDeleteExpense, restoreExpense } = useExpenseMutations(() => {
    refetch();
  });
  const { showSavedWithUndo } = useSnackbar();

  const handleSavedWithUndo = (expenseId: string) => {
    showSavedWithUndo(async () => {
      await softDeleteExpense(expenseId);
    });
  };

  const currentMonthPrefix = useMemo(() => {
    return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  }, []);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // 1. Deleted filter
      if (!showDeleted && exp.deleted_at) return false;
      if (showDeleted && !exp.deleted_at) return false;

      // 2. Member filter from query params if present
      if (filterMemberId) {
        const isPayer = exp.paid_by === filterMemberId;
        const isInSplit = exp.splits.some((s) => s.member_id === filterMemberId);
        if (!isPayer && !isInSplit) return false;
      }

      // 3. Category filter
      if (selectedCategoryId !== 'all' && exp.category_id !== selectedCategoryId) {
        return false;
      }

      // 4. Time/Ownership filter chips
      if (activeFilter === 'mine') {
        const isMyExpense = exp.paid_by === member?.id || exp.created_by === member?.id;
        if (!isMyExpense) return false;
      } else if (activeFilter === 'month') {
        if (!exp.expense_date.startsWith(currentMonthPrefix)) return false;
      }

      return true;
    });
  }, [expenses, showDeleted, filterMemberId, selectedCategoryId, activeFilter, member, currentMonthPrefix]);

  // Group by date
  const groupedExpenses = useMemo(() => {
    const map = new Map<string, ExpenseWithSplits[]>();
    for (const exp of filteredExpenses) {
      const dateKey = exp.expense_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(exp);
    }
    return Array.from(map.entries());
  }, [filteredExpenses]);

  const activeFilteredMemberName = members.find((m) => m.id === filterMemberId)?.name;

  return (
    <div className="flex flex-col gap-5">
      {/* Page Title & Add Button */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-11 h-11 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] flex items-center justify-center card-shadow active:scale-95 transition-all focus:outline-none"
            aria-label="Back to home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {en.historyTitle}
          </h1>
        </div>
        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="min-h-[44px] px-4 py-2 bg-[var(--primary)] text-white text-base font-bold rounded-full shadow hover:bg-[#0a5555] active:scale-95 transition-all"
          aria-label={en.homeAddExpense}
        >
          + {en.homeAddExpense}
        </button>
      </div>

      {/* Member filter banner if filtered by URL */}
      {filterMemberId && activeFilteredMemberName && (
        <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-xl">
          <span className="text-base font-semibold text-[var(--primary)]">
            Showing with {activeFilteredMemberName}
          </span>
          <button
            onClick={() => setSearchParams({})}
            className="min-h-[36px] px-2 text-base font-bold text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Clear member filter"
          >
            Clear
          </button>
        </div>
      )}

      {/* Filter Chips: All · Mine · This month */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`min-h-[48px] flex-1 px-3 py-2 rounded-xl text-base font-semibold border-2 transition-colors ${
            activeFilter === 'all'
              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'
          }`}
        >
          {en.historyFilterAll}
        </button>
        <button
          onClick={() => setActiveFilter('mine')}
          className={`min-h-[48px] flex-1 px-3 py-2 rounded-xl text-base font-semibold border-2 transition-colors ${
            activeFilter === 'mine'
              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'
          }`}
        >
          {en.historyFilterMine}
        </button>
        <button
          onClick={() => setActiveFilter('month')}
          className={`min-h-[48px] flex-1 px-3 py-2 rounded-xl text-base font-semibold border-2 transition-colors ${
            activeFilter === 'month'
              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'
          }`}
        >
          {en.historyFilterThisMonth}
        </button>
      </div>

      {/* Category selector + Show Deleted toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="min-h-[48px] px-3 py-2 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl text-base font-semibold text-[var(--text)] focus:border-[var(--primary)] focus:outline-none flex-1"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowDeleted((prev) => !prev)}
          className={`min-h-[48px] px-4 py-2 rounded-xl text-base font-semibold border-2 transition-colors ${
            showDeleted
              ? 'bg-[var(--owe)] text-white border-[var(--owe)]'
              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'
          }`}
        >
          {showDeleted ? en.historyHideDeleted : en.historyShowDeleted}
        </button>
      </div>

      {/* Expenses Feed */}
      {loading && (
        <Card>
          <p className="text-lg text-[var(--muted)] text-center">Loading expenses...</p>
        </Card>
      )}

      {!loading && groupedExpenses.length === 0 && (
        <Card>
          <p className="text-lg text-[var(--muted)] text-center">
            {en.historyEmpty}
          </p>
        </Card>
      )}

      {!loading &&
        groupedExpenses.map(([dateKey, items]) => (
          <div key={dateKey} className="space-y-3">
            {/* Date Group Heading — inline divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-[var(--border)]"/>
              <span className="text-sm font-semibold text-[var(--muted)] whitespace-nowrap">{formatDateHeader(dateKey)}</span>
              <div className="flex-1 h-px bg-[var(--border)]"/>
            </div>

            {/* Expenses on this date */}
            <div className="space-y-2">
              {items.map((exp) => {
                const payerName = members.find((m) => m.id === exp.paid_by)?.name ?? 'Member';
                const categoryName = exp.category?.name ?? 'Expense';

                return (
                  <div
                    key={exp.id}
                    onClick={() => setSelectedExpense(exp)}
                    className="bg-[var(--surface-raised)] rounded-2xl p-3.5 sm:p-4 border border-[var(--border)] card-shadow flex items-center justify-between gap-3 cursor-pointer hover:border-[var(--primary)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 relative overflow-hidden"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedExpense(exp);
                      }
                    }}
                    aria-label={`View details for ${exp.title}`}
                  >
                    {/* Left accent strip for pending items */}
                    {exp.is_pending && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" aria-hidden="true" />
                    )}

                    {/* Left: Category Icon + Title & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon name={categoryName} size={20} />
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text)] truncate leading-tight">
                          {exp.title}
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-[var(--muted)] truncate mt-0.5">
                          {categoryName} · Paid by {payerName}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount & Status */}
                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-extrabold text-[var(--text)]">
                        ₹{formatPaise(exp.amount_paise)}
                      </p>
                      {exp.deleted_at && (
                        <span className="text-xs font-bold text-[var(--owe)] block mt-0.5">
                          Deleted
                        </span>
                      )}
                      {exp.is_pending && (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded block mt-0.5">
                          {en.offlineWaitingToSend}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {/* Detail Modal */}
      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          members={members}
          onEdit={(exp) => setEditingExpense(exp)}
          onDelete={async (id) => {
            await softDeleteExpense(id);
            refetch();
          }}
          onRestore={async (id) => {
            await restoreExpense(id);
            refetch();
          }}
        />
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          isOpen={Boolean(editingExpense)}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          members={members}
          categories={categories}
          onSave={async (id, data) => {
            const res = await updateExpense(id, data);
            refetch();
            return res;
          }}
        />
      )}

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
    </div>
  );
}
