import type { Member, Category, Settlement } from '../types/database';
import type { ExpenseWithSplits } from '../hooks/useData';
import { formatPaise } from './money';

interface ExportDataParams {
  expenses: ExpenseWithSplits[];
  settlements: Settlement[];
  members: Member[];
  categories: Category[];
}

export function generateCsvContent({
  expenses,
  settlements,
  members,
  categories,
}: ExportDataParams): string {
  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;
  const getCategoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? 'None';

  const rows: string[] = [];

  // 1. Expenses Table
  rows.push('--- EXPENSES ---');
  rows.push('Date,Title,Category,Paid By,Amount (INR),Splits,Added By,Status');

  for (const exp of expenses) {
    const splitsSummary = exp.splits
      .map((s) => `${getMemberName(s.member_id)}: Rs ${formatPaise(s.share_paise)}`)
      .join(' | ');

    const status = exp.deleted_at ? 'Deleted' : 'Active';
    const cleanTitle = `"${exp.title.replace(/"/g, '""')}"`;
    const cleanSplits = `"${splitsSummary.replace(/"/g, '""')}"`;

    rows.push(
      [
        exp.expense_date,
        cleanTitle,
        getCategoryName(exp.category_id),
        getMemberName(exp.paid_by),
        formatPaise(exp.amount_paise),
        cleanSplits,
        getMemberName(exp.created_by),
        status,
      ].join(',')
    );
  }

  // 2. Settlements Table
  rows.push('');
  rows.push('--- PAYMENTS (SETTLED) ---');
  rows.push('Date,From,To,Amount (INR),Note,Status');

  for (const st of settlements) {
    const status = st.deleted_at ? 'Deleted' : 'Active';
    const cleanNote = st.note ? `"${st.note.replace(/"/g, '""')}"` : '""';

    rows.push(
      [
        st.settled_on,
        getMemberName(st.from_member),
        getMemberName(st.to_member),
        formatPaise(st.amount_paise),
        cleanNote,
        status,
      ].join(',')
    );
  }

  return rows.join('\r\n');
}

export function downloadCsv(csvContent: string, filename?: string) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const finalFilename = filename || `hisaab-data-${dateStr}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
