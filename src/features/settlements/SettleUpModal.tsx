import { useState, useMemo } from 'react';
import type { Member } from '../../types/database';
import { en } from '../../i18n/en';
import { formatPaise, parseToPaise } from '../../lib/money';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  initialTargetMemberId?: string;
  initialAmountPaise?: number; // Pre-filled net amount owed
  onSave: (data: {
    to_member: string;
    amount_paise: number;
    settled_on: string;
    note?: string | null;
  }) => Promise<void>;
  onSuccess: () => void;
}

export function SettleUpModal({
  isOpen,
  onClose,
  members,
  initialTargetMemberId,
  initialAmountPaise = 0,
  onSave,
  onSuccess,
}: SettleUpModalProps) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [targetMemberId, setTargetMemberId] = useState<string>(() => {
    return initialTargetMemberId || members[0]?.id || '';
  });

  const [amountStr, setAmountStr] = useState<string>(() => {
    return initialAmountPaise > 0 ? (initialAmountPaise / 100).toString() : '';
  });

  const [settledOn, setSettledOn] = useState<string>(todayStr);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetMember = members.find((m) => m.id === targetMemberId);

  const amountPaise = useMemo(() => {
    const parsed = parseToPaise(amountStr);
    return isNaN(parsed) ? 0 : parsed;
  }, [amountStr]);

  if (!isOpen) return null;

  const handleOpenReview = () => {
    if (amountPaise <= 0 || !targetMemberId) return;
    setIsReviewing(true);
  };

  const handleConfirmSettle = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      await onSave({
        to_member: targetMemberId,
        amount_paise: amountPaise,
        settled_on: settledOn,
      });
      onSuccess();
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
      aria-labelledby="settle-up-heading"
      className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-[var(--bg)] w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface)]">
          <h2 id="settle-up-heading" className="text-2xl font-bold text-[var(--text)]">
            {en.settleTitle}
          </h2>
          <button
            onClick={onClose}
            className="min-h-[44px] px-3 py-1 text-lg font-semibold text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            Cancel
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-100 border border-red-300 text-[var(--owe)] rounded-xl text-base font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Member picker */}
          <div>
            <label className="block text-lg font-bold text-[var(--text)] mb-2">
              Who did you pay?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {members.map((m) => {
                const isSelected = targetMemberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTargetMemberId(m.id)}
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

          {/* Amount */}
          <div>
            <label htmlFor="settle-amount" className="block text-lg font-bold text-[var(--text)] mb-2">
              {en.settleAmount}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-3xl font-bold text-[var(--primary)] select-none">
                ₹
              </span>
              <input
                id="settle-amount"
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl text-3xl font-bold text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="settle-date" className="block text-lg font-bold text-[var(--text)] mb-2">
              Date
            </label>
            <input
              id="settle-date"
              type="date"
              value={settledOn}
              onChange={(e) => setSettledOn(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl text-lg text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
          <Button
            onClick={handleOpenReview}
            disabled={amountPaise <= 0 || !targetMemberId}
            aria-label="Continue to review"
          >
            Continue
          </Button>
        </div>
      </div>

      {/* Review Dialog */}
      {isReviewing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4"
        >
          <Card className="max-w-md w-full">
            <h3 className="text-2xl font-bold text-[var(--text)] mb-4">
              {en.settleTitle}
            </h3>
            <p className="text-lg text-[var(--text)] leading-relaxed mb-6">
              {en.settleReview
                .replace('{{amount}}', formatPaise(amountPaise))
                .replace('{{name}}', targetMember?.name ?? '')}
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleConfirmSettle}
                disabled={saving}
                aria-label={en.settleConfirm}
              >
                {saving ? 'Recording...' : en.settleConfirm}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsReviewing(false)}
                disabled={saving}
                aria-label={en.settleGoBack}
              >
                {en.settleGoBack}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
