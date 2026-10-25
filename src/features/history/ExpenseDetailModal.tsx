import { useState } from 'react';
import type { ExpenseWithSplits } from '../../hooks/useData';
import type { Member } from '../../types/database';
import { en } from '../../i18n/en';
import { formatPaise } from '../../lib/money';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ExpenseDetailModalProps {
  expense: ExpenseWithSplits | null;
  onClose: () => void;
  members: Member[];
  onEdit?: (expense: ExpenseWithSplits) => void;
  onDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
}

export function ExpenseDetailModal({
  expense,
  onClose,
  members,
  onEdit,
  onDelete,
  onRestore,
}: ExpenseDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!expense) return null;

  const isDeleted = Boolean(expense.deleted_at);
  const payerName = members.find((m) => m.id === expense.paid_by)?.name ?? 'Unknown';
  const creatorName = members.find((m) => m.id === expense.created_by)?.name ?? 'Unknown';
  const categoryName = expense.category?.name ?? 'Expense';

  const handleDelete = async () => {
    setProcessing(true);
    try {
      await onDelete(expense.id);
      onClose();
    } catch {
      setProcessing(false);
    }
  };

  const handleRestore = async () => {
    setProcessing(true);
    try {
      await onRestore(expense.id);
      onClose();
    } catch {
      setProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-detail-heading"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <Card className="max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="expense-detail-heading" className="text-2xl font-bold text-[var(--text)]">
              {expense.title}
            </h2>
            <span className="inline-block mt-1 px-3 py-1 bg-[var(--border)] rounded-lg text-base font-semibold text-[var(--text)]">
              {categoryName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] px-2 text-lg font-bold text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Amount */}
        <div className="mb-6 p-4 bg-[#EEF6F6] rounded-xl text-center">
          <p className="text-3xl font-bold text-[var(--primary)]">
            ₹{formatPaise(expense.amount_paise)}
          </p>
          <p className="text-base text-[var(--muted)] mt-1">
            {en.historyPaidBy.replace('{{name}}', payerName)} · {en.historyAddedBy.replace('{{name}}', creatorName)}
          </p>
          <p className="text-base text-[var(--muted)]">
            Date: {expense.expense_date}
          </p>
          {isDeleted && (
            <p className="text-base font-bold text-[var(--owe)] mt-2">
              (Deleted item)
            </p>
          )}
        </div>

        {/* Splits breakdown */}
        <div className="flex-1 overflow-y-auto mb-6">
          <h3 className="text-lg font-bold text-[var(--text)] mb-3">
            Split Breakdown
          </h3>
          <div className="space-y-2">
            {expense.splits.map((s) => {
              const personName = members.find((m) => m.id === s.member_id)?.name ?? 'Member';
              return (
                <div
                  key={s.member_id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)]"
                >
                  <span className="text-lg font-medium text-[var(--text)]">
                    {personName}
                  </span>
                  <span className="text-lg font-bold text-[var(--text)]">
                    ₹{formatPaise(s.share_paise)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2 border-t border-[var(--border)]">
          {!isDeleted ? (
            !confirmDelete ? (
              <div className="flex flex-col gap-2">
                {onEdit && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      onClose();
                      onEdit(expense);
                    }}
                    aria-label={en.detailEdit}
                  >
                    {en.detailEdit}
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => setConfirmDelete(true)}
                  aria-label={en.detailDelete}
                >
                  {en.detailDelete}
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-base font-semibold text-[var(--owe)] mb-3 text-center">
                  {en.detailDeleteConfirm}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={processing}
                    className="!min-h-[48px]"
                  >
                    {en.detailDeleteYes}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmDelete(false)}
                    disabled={processing}
                    className="!min-h-[48px]"
                  >
                    {en.detailDeleteNo}
                  </Button>
                </div>
              </div>
            )
          ) : (
            !confirmRestore ? (
              <Button
                onClick={() => setConfirmRestore(true)}
                aria-label={en.detailRestore}
              >
                {en.detailRestore}
              </Button>
            ) : (
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <p className="text-base font-semibold text-[var(--get)] mb-3 text-center">
                  {en.detailRestoreConfirm}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRestore}
                    disabled={processing}
                    className="!min-h-[48px]"
                  >
                    {en.detailRestoreYes}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmRestore(false)}
                    disabled={processing}
                    className="!min-h-[48px]"
                  >
                    Keep it
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );
}
