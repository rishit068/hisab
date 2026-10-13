import { supabase } from './supabase';
import type { ExpenseWithSplits } from '../hooks/useData';
import type { Settlement } from '../types/database';

export interface PendingExpensePayload {
  id: string; // client-generated UUID
  title: string;
  amount_paise: number;
  paid_by: string;
  category_id: string | null;
  expense_date: string;
  note?: string | null;
  created_by: string;
  created_at: string;
  splits: { member_id: string; share_paise: number }[];
}

export interface PendingSettlementPayload {
  id: string;
  from_member: string;
  to_member: string;
  amount_paise: number;
  settled_on: string;
  note?: string | null;
  created_by: string;
  created_at: string;
}

const EXPENSES_QUEUE_KEY = 'hisaab_pending_expenses_v1';
const SETTLEMENTS_QUEUE_KEY = 'hisaab_pending_settlements_v1';

// Get queued expenses
export function getPendingExpenses(): PendingExpensePayload[] {
  try {
    const raw = localStorage.getItem(EXPENSES_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Get queued settlements
export function getPendingSettlements(): PendingSettlementPayload[] {
  try {
    const raw = localStorage.getItem(SETTLEMENTS_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Add an expense to offline queue
export function queueOfflineExpense(expense: PendingExpensePayload) {
  const current = getPendingExpenses();
  current.push(expense);
  localStorage.setItem(EXPENSES_QUEUE_KEY, JSON.stringify(current));
  notifyQueueChange();
}

// Add a settlement to offline queue
export function queueOfflineSettlement(settlement: PendingSettlementPayload) {
  const current = getPendingSettlements();
  current.push(settlement);
  localStorage.setItem(SETTLEMENTS_QUEUE_KEY, JSON.stringify(current));
  notifyQueueChange();
}

// Remove an expense from offline queue
export function removePendingExpense(id: string) {
  const current = getPendingExpenses().filter((e) => e.id !== id);
  localStorage.setItem(EXPENSES_QUEUE_KEY, JSON.stringify(current));
  notifyQueueChange();
}

// Remove a settlement from offline queue
export function removePendingSettlement(id: string) {
  const current = getPendingSettlements().filter((s) => s.id !== id);
  localStorage.setItem(SETTLEMENTS_QUEUE_KEY, JSON.stringify(current));
  notifyQueueChange();
}

// Convert pending expense to viewable ExpenseWithSplits
export function pendingToExpenseWithSplits(
  pending: PendingExpensePayload,
  categories: any[]
): ExpenseWithSplits & { is_pending?: boolean } {
  const cat = categories.find((c) => c.id === pending.category_id) || null;
  return {
    id: pending.id,
    title: pending.title,
    amount_paise: pending.amount_paise,
    paid_by: pending.paid_by,
    category_id: pending.category_id,
    expense_date: pending.expense_date,
    note: pending.note || null,
    created_by: pending.created_by,
    created_at: pending.created_at,
    updated_at: null,
    deleted_at: null,
    deleted_by: null,
    category: cat,
    splits: pending.splits.map((s) => ({
      expense_id: pending.id,
      member_id: s.member_id,
      share_paise: s.share_paise,
    })),
    is_pending: true,
  };
}

// Convert pending settlement to viewable Settlement
export function pendingToSettlement(
  pending: PendingSettlementPayload
): Settlement & { is_pending?: boolean } {
  return {
    id: pending.id,
    from_member: pending.from_member,
    to_member: pending.to_member,
    amount_paise: pending.amount_paise,
    settled_on: pending.settled_on,
    note: pending.note || null,
    created_by: pending.created_by,
    created_at: pending.created_at,
    deleted_at: null,
    is_pending: true,
  };
}

// Process all queued items when internet is active
let isSyncing = false;

export async function flushOfflineQueue(): Promise<{
  expensesSent: number;
  settlementsSent: number;
  hasErrors: boolean;
}> {
  if (isSyncing || !navigator.onLine) {
    return { expensesSent: 0, settlementsSent: 0, hasErrors: false };
  }

  isSyncing = true;
  let expensesSent = 0;
  let settlementsSent = 0;
  let hasErrors = false;

  try {
    // 1. Process Expenses
    const pendingExpenses = getPendingExpenses();
    for (const exp of pendingExpenses) {
      try {
        const { error: expErr } = await supabase.from('expenses').insert({
          id: exp.id,
          title: exp.title,
          amount_paise: exp.amount_paise,
          paid_by: exp.paid_by,
          category_id: exp.category_id,
          expense_date: exp.expense_date,
          note: exp.note || null,
          created_by: exp.created_by,
        });

        if (expErr && !expErr.message.includes('duplicate key')) {
          throw expErr;
        }

        const splitsPayload = exp.splits.map((s) => ({
          expense_id: exp.id,
          member_id: s.member_id,
          share_paise: s.share_paise,
        }));

        const { error: splitsErr } = await supabase
          .from('expense_splits')
          .insert(splitsPayload);

        if (splitsErr && !splitsErr.message.includes('duplicate key')) {
          throw splitsErr;
        }

        removePendingExpense(exp.id);
        expensesSent++;
      } catch (err) {
        console.error('Failed to submit offline expense', exp.id, err);
        hasErrors = true;
        break; // Stop and retry later if network failed mid-way
      }
    }

    // 2. Process Settlements
    const pendingSettlements = getPendingSettlements();
    for (const st of pendingSettlements) {
      try {
        const { error: stErr } = await supabase.from('settlements').insert({
          id: st.id,
          from_member: st.from_member,
          to_member: st.to_member,
          amount_paise: st.amount_paise,
          settled_on: st.settled_on,
          note: st.note || null,
          created_by: st.created_by,
        });

        if (stErr && !stErr.message.includes('duplicate key')) {
          throw stErr;
        }

        removePendingSettlement(st.id);
        settlementsSent++;
      } catch (err) {
        console.error('Failed to submit offline settlement', st.id, err);
        hasErrors = true;
        break;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { expensesSent, settlementsSent, hasErrors };
}

// Queue change event listeners
const queueListeners = new Set<() => void>();

export function subscribeToQueueChanges(listener: () => void) {
  queueListeners.add(listener);
  return () => {
    queueListeners.delete(listener);
  };
}

function notifyQueueChange() {
  for (const listener of queueListeners) {
    listener();
  }
}
