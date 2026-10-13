import { useState, useMemo } from 'react';
import type { ExpenseWithSplits } from '../../hooks/useData';
import type { Member, Category } from '../../types/database';
import { en } from '../../i18n/en';
import { formatPaise, parseToPaise, splitEqually, validateCustomSplit } from '../../lib/money';
import { Button } from '../../components/ui/Button';

interface EditExpenseModalProps {
  isOpen: boolean;
  expense: ExpenseWithSplits;
  onClose: () => void;
  members: Member[];
  categories: Category[];
  onSave: (
    expenseId: string,
    data: {
      title: string;
      amount_paise: number;
      paid_by: string;
      category_id: string | null;
      expense_date: string;
      splits: { member_id: string; share_paise: number }[];
    }
  ) => Promise<string>;
}

export function EditExpenseModal({
  isOpen,
  expense,
  onClose,
  members,
  categories,
  onSave,
}: EditExpenseModalProps) {
  const [amountStr, setAmountStr] = useState(() => (expense.amount_paise / 100).toString());
  const [title, setTitle] = useState(expense.title);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(expense.category_id);
  const [paidBy, setPaidBy] = useState<string>(expense.paid_by);

  const initialMemberIds = useMemo(
    () => new Set(expense.splits.map((s) => s.member_id)),
    [expense.splits]
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(initialMemberIds);

  const isCustomInitially = useMemo(() => {
    if (expense.splits.length <= 1) return false;
    const firstShare = expense.splits[0].share_paise;
    return expense.splits.some((s) => Math.abs(s.share_paise - firstShare) > 1);
  }, [expense.splits]);

  const [isCustomSplit, setIsCustomSplit] = useState(isCustomInitially);
  const [customSharesStr, setCustomSharesStr] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of expense.splits) {
      map[s.member_id] = (s.share_paise / 100).toString();
    }
    return map;
  });

  const [expenseDate, setExpenseDate] = useState(expense.expense_date);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Eligible members for splitting: only non-admin members
  const splitMembers = useMemo(() => {
    return members.filter((m) => !m.is_admin);
  }, [members]);

  const sortedMembers = useMemo(() => {
    return [...splitMembers].sort((a, b) => a.name.localeCompare(b.name));
  }, [splitMembers]);

  const amountPaise = useMemo(() => {
    const parsed = parseToPaise(amountStr);
    return isNaN(parsed) ? 0 : parsed;
  }, [amountStr]);

  const activeSelectedMembers = useMemo(() => {
    return sortedMembers.filter((m) => selectedMemberIds.has(m.id));
  }, [sortedMembers, selectedMemberIds]);

  const equalSplits = useMemo(() => {
    if (amountPaise <= 0 || activeSelectedMembers.length === 0) return [];
    const shares = splitEqually(amountPaise, activeSelectedMembers.length);
    return activeSelectedMembers.map((m, i) => ({
      member_id: m.id,
      share_paise: shares[i],
    }));
  }, [amountPaise, activeSelectedMembers]);

  const { customSplits, customDiffPaise } = useMemo(() => {
    if (!isCustomSplit) {
      return { customSplits: [], customDiffPaise: 0 };
    }

    const sharesArray = activeSelectedMembers.map((m) => {
      const val = customSharesStr[m.id];
      const parsed = val ? parseToPaise(val) : 0;
      return isNaN(parsed) ? 0 : parsed;
    });

    const diff = validateCustomSplit(amountPaise, sharesArray);

    const splits = activeSelectedMembers.map((m, i) => ({
      member_id: m.id,
      share_paise: sharesArray[i],
    }));

    return { customSplits: splits, customDiffPaise: diff };
  }, [isCustomSplit, activeSelectedMembers, customSharesStr, amountPaise]);

  if (!isOpen) return null;

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCustomShareChange = (memberId: string, val: string) => {
    setCustomSharesStr((prev) => ({ ...prev, [memberId]: val }));
  };

  const handleSave = async () => {
    if (!title.trim() || amountPaise <= 0 || !paidBy || activeSelectedMembers.length === 0) {
      return;
    }
    if (isCustomSplit && customDiffPaise !== 0) {
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const finalSplits = isCustomSplit ? customSplits : equalSplits;
      await onSave(expense.id, {
        title: title.trim(),
        amount_paise: amountPaise,
        paid_by: paidBy,
        category_id: selectedCategoryId,
        expense_date: expenseDate,
        splits: finalSplits,
      });
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || en.errorGeneric);
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-expense-heading"
      className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-[var(--bg)] w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface)]">
          <h2 id="edit-expense-heading" className="text-2xl font-bold text-[var(--text)]">
            {en.detailEdit} {expense.title}
          </h2>
          <button
            onClick={onClose}
            className="min-h-[44px] px-3 py-1 text-lg font-semibold text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            Cancel
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-100 border border-red-300 text-[var(--owe)] rounded-xl text-base font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Amount */}
          <div>
            <label htmlFor="edit-expense-amount" className="block text-lg font-bold text-[var(--text)] mb-2">
              {en.addExpenseHowMuch}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-3xl font-bold text-[var(--primary)] select-none">
                ₹
              </span>
              <input
                id="edit-expense-amount"
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl text-3xl font-bold text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="edit-expense-title" className="block text-lg font-bold text-[var(--text)] mb-2">
              {en.addExpenseWhatFor}
            </label>
            <input
              id="edit-expense-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vegetables, Milk, Petrol"
              className="w-full px-4 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl text-lg text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-lg font-bold text-[var(--text)] mb-2">
              {en.addExpenseCategory}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((c) => {
                const isSelected = selectedCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={`min-h-[56px] px-3 py-2 rounded-xl text-lg font-semibold transition-colors border-2 ${
                      isSelected
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-gray-50'
                    }`}
                  >
                    {c.name} {isSelected && '(Selected)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Who paid */}
          <div>
            <label className="block text-lg font-bold text-[var(--text)] mb-2">
              {en.addExpenseWhoPaid}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {splitMembers.map((m) => {
                const isSelected = paidBy === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaidBy(m.id)}
                    className={`min-h-[56px] px-3 py-2 rounded-xl text-lg font-semibold transition-colors border-2 ${
                      isSelected
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-gray-50'
                    }`}
                  >
                    {m.name} {isSelected && '(Selected)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split between */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-lg font-bold text-[var(--text)]">
                {en.addExpenseSplitBetween}
              </label>
              <button
                type="button"
                onClick={() => setIsCustomSplit((prev) => !prev)}
                className="text-base font-bold text-[var(--primary)] underline min-h-[44px] flex items-center"
              >
                {isCustomSplit ? 'Split equally' : en.addExpenseCustomAmounts}
              </button>
            </div>

            <div className="space-y-2">
              {sortedMembers.map((m) => {
                const isSelected = selectedMemberIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl min-h-[56px]"
                  >
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMemberSelection(m.id)}
                        className="w-6 h-6 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <span className="text-lg font-bold text-[var(--text)]">{m.name}</span>
                    </label>

                    {isCustomSplit && isSelected && (
                      <div className="relative w-32 flex items-center">
                        <span className="absolute left-2 text-base font-bold text-[var(--muted)]">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customSharesStr[m.id] ?? ''}
                          onChange={(e) => handleCustomShareChange(m.id, e.target.value)}
                          placeholder="0"
                          className="w-full pl-6 pr-2 py-1 bg-white border border-[var(--border)] rounded-lg text-base font-bold text-right"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Split Live Status */}
            {isCustomSplit && (
              <div className="mt-3 p-3 rounded-xl border font-bold text-base text-center">
                {customDiffPaise === 0 ? (
                  <span className="text-[var(--get)]">{en.addExpenseAllAssigned}</span>
                ) : customDiffPaise > 0 ? (
                  <span className="text-[var(--owe)]">
                    {en.addExpenseStillToAssign.replace('{{amount}}', formatPaise(customDiffPaise))}
                  </span>
                ) : (
                  <span className="text-[var(--owe)]">
                    {en.addExpenseOverAssigned.replace('{{amount}}', formatPaise(Math.abs(customDiffPaise)))}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="edit-expense-date" className="block text-lg font-bold text-[var(--text)] mb-2">
              {en.addExpenseDate}
            </label>
            <input
              id="edit-expense-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl text-lg text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              !title.trim() ||
              amountPaise <= 0 ||
              !paidBy ||
              activeSelectedMembers.length === 0 ||
              (isCustomSplit && customDiffPaise !== 0)
            }
            aria-label={en.addExpenseSave}
          >
            {saving ? 'Saving...' : en.addExpenseSave}
          </Button>
        </div>
      </div>
    </div>
  );
}
