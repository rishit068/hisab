import { useState, useMemo } from 'react';
import type { Member, Category } from '../../types/database';
import { en } from '../../i18n/en';
import { formatPaise, parseToPaise, splitEqually, validateCustomSplit } from '../../lib/money';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  categories: Category[];
  currentMemberId: string;
  onSave: (data: {
    title: string;
    amount_paise: number;
    paid_by: string;
    category_id: string | null;
    expense_date: string;
    splits: { member_id: string; share_paise: number }[];
  }) => Promise<string>;
  onSavedWithUndo: (expenseId: string) => void;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  members,
  categories,
  currentMemberId,
  onSave,
  onSavedWithUndo,
}: AddExpenseModalProps) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [amountStr, setAmountStr] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Eligible members for splitting expenses: only non-admin members
  const splitMembers = useMemo(() => {
    return members.filter((m) => !m.is_admin);
  }, [members]);

  // Default payer: current member if non-admin, else the first non-admin member
  const defaultPayerId = useMemo(() => {
    const isCurrentAdmin = members.find((m) => m.id === currentMemberId)?.is_admin;
    if (!isCurrentAdmin) return currentMemberId;
    return splitMembers[0]?.id || currentMemberId;
  }, [members, currentMemberId, splitMembers]);

  const [paidBy, setPaidBy] = useState<string>(defaultPayerId);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    () => new Set(splitMembers.map((m) => m.id))
  );
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [customSharesStr, setCustomSharesStr] = useState<Record<string, string>>({});
  const [expenseDate, setExpenseDate] = useState(todayStr);

  const [isReviewing, setIsReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sorted non-admin members for deterministic allocation
  const sortedMembers = useMemo(() => {
    return [...splitMembers].sort((a, b) => a.name.localeCompare(b.name));
  }, [splitMembers]);

  const amountPaise = useMemo(() => {
    const parsed = parseToPaise(amountStr);
    return isNaN(parsed) ? 0 : parsed;
  }, [amountStr]);

  // Selected members in alphabetical order
  const activeSelectedMembers = useMemo(() => {
    return sortedMembers.filter((m) => selectedMemberIds.has(m.id));
  }, [sortedMembers, selectedMemberIds]);

  // Equal split calculation
  const equalSplits = useMemo(() => {
    if (amountPaise <= 0 || activeSelectedMembers.length === 0) return [];
    const shares = splitEqually(amountPaise, activeSelectedMembers.length);
    return activeSelectedMembers.map((m, i) => ({
      member_id: m.id,
      share_paise: shares[i],
    }));
  }, [amountPaise, activeSelectedMembers]);

  // Custom split calculation & validation
  const { customSplits, customDiffPaise } = useMemo(() => {
    if (!isCustomSplit) return { customSplits: [], customDiffPaise: 0 };

    const sharesArray = activeSelectedMembers.map((m) => {
      const valStr = customSharesStr[m.id] || '';
      const parsed = parseToPaise(valStr);
      return isNaN(parsed) ? 0 : parsed;
    });

    const diff = validateCustomSplit(amountPaise, sharesArray);

    const splits = activeSelectedMembers.map((m, i) => ({
      member_id: m.id,
      share_paise: sharesArray[i],
    }));

    return { customSplits: splits, customDiffPaise: diff };
  }, [isCustomSplit, activeSelectedMembers, customSharesStr, amountPaise]);

  const isValidToReview = useMemo(() => {
    if (!title.trim()) return false;
    if (amountPaise <= 0) return false;
    if (activeSelectedMembers.length === 0) return false;
    if (isCustomSplit && customDiffPaise !== 0) return false;
    return true;
  }, [title, amountPaise, activeSelectedMembers, isCustomSplit, customDiffPaise]);

  if (!isOpen) return null;

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) {
          next.delete(id);
        }
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCustomShareChange = (memberId: string, val: string) => {
    setCustomSharesStr((prev) => ({
      ...prev,
      [memberId]: val,
    }));
  };

  const handleOpenReview = () => {
    if (!isValidToReview) return;
    setIsReviewing(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const finalSplits = isCustomSplit ? customSplits : equalSplits;
      const expenseId = await onSave({
        title: title.trim(),
        amount_paise: amountPaise,
        paid_by: paidBy,
        category_id: selectedCategoryId,
        expense_date: expenseDate,
        splits: finalSplits,
      });

      onSavedWithUndo(expenseId);
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || en.errorGeneric);
      setSaving(false);
    }
  };

  const payerName = members.find((m) => m.id === paidBy)?.name ?? '';
  const selectedCatName = categories.find((c) => c.id === selectedCategoryId)?.name ?? 'Expense';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-expense-heading"
      className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-[var(--bg)] w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface)]">
          <h2 id="add-expense-heading" className="text-2xl font-bold text-[var(--text)]">
            {en.addExpenseTitle}
          </h2>
          <button
            onClick={onClose}
            className="min-h-[44px] px-3 py-1 text-lg font-semibold text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            Cancel
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-100 border border-red-300 text-[var(--owe)] rounded-xl text-base font-semibold">
              {errorMessage}
            </div>
          )}

          {/* 1. How much? */}
          <div>
            <label htmlFor="expense-amount" className="block text-lg font-bold text-[var(--text)] mb-2">
              {en.addExpenseHowMuch}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-3xl font-bold text-[var(--primary)] select-none">
                ₹
              </span>
              <input
                id="expense-amount"
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl text-3xl font-bold text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* 2. What was it for? */}
          <div>
            <label htmlFor="expense-title" className="block text-lg font-bold text-[var(--text)] mb-2">
              {en.addExpenseWhatFor}
            </label>
            <input
              id="expense-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Milk & Vegetables"
              className="w-full px-4 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl text-lg text-[var(--text)] focus:border-[var(--primary)] focus:outline-none mb-3"
            />

            {/* Category selection as text buttons */}
            <p className="text-base font-semibold text-[var(--muted)] mb-2">
              {en.addExpenseCategory}
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                    className={`min-h-[48px] px-4 py-2 rounded-xl text-base font-semibold transition-colors border-2 ${
                      isSelected
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-gray-50'
                    }`}
                  >
                    {cat.name} {isSelected && '(Selected)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Who paid? */}
          <div>
            <label className="block text-lg font-bold text-[var(--text)] mb-2">
              {en.addExpenseWhoPaid}
            </label>
            {/* Who paid? Only non-admin participants */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {splitMembers.map((m) => {
                const isPayer = paidBy === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaidBy(m.id)}
                    className={`min-h-[56px] px-3 py-2 rounded-xl text-lg font-semibold transition-colors border-2 ${
                      isPayer
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-gray-50'
                    }`}
                  >
                    {m.name} {isPayer && '(Paid)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Split between */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-lg font-bold text-[var(--text)]">
                {en.addExpenseSplitBetween}
              </label>
              <button
                type="button"
                onClick={() => setIsCustomSplit((prev) => !prev)}
                className={`min-h-[44px] px-3 py-1 rounded-lg text-base font-semibold border-2 transition-colors ${
                  isCustomSplit
                    ? 'bg-[var(--text)] text-white border-[var(--text)]'
                    : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'
                }`}
              >
                {en.addExpenseCustomAmounts}
              </button>
            </div>

            <div className="space-y-2">
              {sortedMembers.map((m) => {
                const isSelected = selectedMemberIds.has(m.id);
                const equalShare = equalSplits.find((s) => s.member_id === m.id)?.share_paise ?? 0;

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[var(--surface)] border-[var(--primary)]'
                        : 'bg-gray-50 border-[var(--border)] opacity-60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMemberSelection(m.id)}
                      className="min-h-[44px] flex-1 text-left text-lg font-semibold text-[var(--text)]"
                    >
                      {m.name} {isSelected ? '(Included)' : '(Excluded)'}
                    </button>

                    {isSelected && !isCustomSplit && (
                      <span className="text-base font-bold text-[var(--primary)]">
                        ₹{formatPaise(equalShare)}
                      </span>
                    )}

                    {isSelected && isCustomSplit && (
                      <div className="flex items-center gap-1 w-36">
                        <span className="text-lg font-bold text-[var(--text)]">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customSharesStr[m.id] ?? ''}
                          onChange={(e) => handleCustomShareChange(m.id, e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1 bg-white border border-[var(--border)] rounded-lg text-base font-bold text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Split live feedback */}
            {isCustomSplit && (
              <div className="mt-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
                {customDiffPaise > 0 && (
                  <p className="text-base font-bold text-[var(--muted)]">
                    {en.addExpenseStillToAssign.replace('{{amount}}', formatPaise(customDiffPaise))}
                  </p>
                )}
                {customDiffPaise < 0 && (
                  <p className="text-base font-bold text-[var(--owe)]">
                    {en.addExpenseOverAssigned.replace('{{amount}}', formatPaise(-customDiffPaise))}
                  </p>
                )}
                {customDiffPaise === 0 && amountPaise > 0 && (
                  <p className="text-base font-bold text-[var(--get)]">
                    {en.addExpenseAllAssigned}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 5. Date */}
          <div>
            <label htmlFor="expense-date" className="block text-lg font-bold text-[var(--text)] mb-2">
              {en.addExpenseDate}
            </label>
            <input
              id="expense-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl text-lg text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Sticky Save Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
          <Button
            onClick={handleOpenReview}
            disabled={!isValidToReview}
            aria-label={en.addExpenseSave}
          >
            {en.addExpenseSave}
          </Button>
        </div>
      </div>

      {/* Review Dialog overlay (§7.6) */}
      {isReviewing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4"
        >
          <Card className="max-w-md w-full">
            <h3 className="text-2xl font-bold text-[var(--text)] mb-4">
              {en.addExpenseReviewTitle}
            </h3>
            <p className="text-lg text-[var(--text)] leading-relaxed mb-6">
              {!isCustomSplit
                ? en.addExpenseReviewEqual
                    .replace('{{name}}', payerName)
                    .replace('{{amount}}', formatPaise(amountPaise))
                    .replace('{{category}}', selectedCatName)
                    .replace('{{count}}', activeSelectedMembers.length.toString())
                    .replace(
                      '{{share}}',
                      formatPaise(equalSplits[0]?.share_paise ?? 0)
                    )
                : en.addExpenseReviewCustom
                    .replace('{{name}}', payerName)
                    .replace('{{amount}}', formatPaise(amountPaise))
                    .replace('{{category}}', selectedCatName)}
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleConfirmSave}
                disabled={saving}
                aria-label={en.addExpenseConfirm}
              >
                {saving ? 'Saving...' : en.addExpenseConfirm}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsReviewing(false)}
                disabled={saving}
                aria-label={en.addExpenseGoBack}
              >
                {en.addExpenseGoBack}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
