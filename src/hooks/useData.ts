import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, Category, Expense, ExpenseSplit, Settlement } from '../types/database';
import { useAuth } from '../features/auth/AuthProvider';
import { calculateBalances, type UserBalancesSummary } from '../lib/balances';
import {
  getPendingExpenses,
  getPendingSettlements,
  queueOfflineExpense,
  queueOfflineSettlement,
  removePendingExpense,
  pendingToExpenseWithSplits,
  pendingToSettlement,
  subscribeToQueueChanges,
} from '../lib/offlineQueue';
import {
  getCachedMembers,
  setCachedMembers,
  getCachedCategories,
  setCachedCategories,
  getCachedExpenses,
  setCachedExpenses,
  getCachedSettlements,
  setCachedSettlements,
} from '../lib/offlineCache';

export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[];
  category?: Category | null;
  paid_by_member?: Member | null;
  created_by_member?: Member | null;
  is_pending?: boolean;
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>(() => getCachedMembers());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('members')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (err) throw err;
      const fetched = data ?? [];
      setCachedMembers(fetched);
      setMembers(fetched);
    } catch (e: any) {
      // If offline, stay with cached data silently
      const cached = getCachedMembers();
      if (cached.length > 0) {
        setMembers(cached);
      } else {
        setError(e.message ?? 'Failed to load members');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, error, refetch: fetchMembers };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories());
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort', { ascending: true });

      if (err) throw err;
      const fetched = data ?? [];
      setCachedCategories(fetched);
      setCategories(fetched);
    } catch {
      // If offline, stay with cached data silently
      const cached = getCachedCategories();
      if (cached.length > 0) {
        setCategories(cached);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, refetch: fetchCategories };
}

export function useExpenses(includeDeleted = false) {
  const [serverExpenses, setServerExpenses] = useState<ExpenseWithSplits[]>(() =>
    includeDeleted ? [] : getCachedExpenses()
  );
  const [pendingExpenses, setPendingExpenses] = useState(getPendingExpenses());
  const [loading, setLoading] = useState(true);
  const { categories } = useCategories();

  // Listen to queue changes
  useEffect(() => {
    return subscribeToQueueChanges(() => {
      setPendingExpenses(getPendingExpenses());
    });
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      let query = supabase
        .from('expenses')
        .select('*, expense_splits(*), categories(*), paid_by_member:members!expenses_paid_by_fkey(*), created_by_member:members!expenses_created_by_fkey(*)')
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }

      const { data, error: err } = await query;
      if (err) {
        // Fallback without foreign key aliases if needed
        const { data: simpleData, error: simpleErr } = await supabase
          .from('expenses')
          .select('*, expense_splits(*)')
          .order('expense_date', { ascending: false });

        if (simpleErr) throw simpleErr;
        const mapped = (simpleData ?? []).map((e: any) => ({
          ...e,
          splits: e.expense_splits ?? [],
        }));
        if (!includeDeleted) setCachedExpenses(mapped);
        setServerExpenses(mapped);
      } else {
        const mapped: ExpenseWithSplits[] = (data ?? []).map((e: any) => ({
          ...e,
          splits: e.expense_splits ?? [],
          category: e.categories ?? null,
          paid_by_member: e.paid_by_member ?? null,
          created_by_member: e.created_by_member ?? null,
        }));
        if (!includeDeleted) setCachedExpenses(mapped);
        setServerExpenses(mapped);
      }
    } catch (e: any) {
      console.error('Failed to load expenses', e);
      // If offline, stay with cached data
      if (!includeDeleted) {
        const cached = getCachedExpenses();
        if (cached.length > 0) {
          setServerExpenses(cached);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [includeDeleted]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Combine server expenses and pending local expenses
  const expenses = useMemo(() => {
    const formattedPending = pendingExpenses.map((p) =>
      pendingToExpenseWithSplits(p, categories)
    );
    // Pending items appear on top, followed by server items (filtering out any duplicates)
    const serverIds = new Set(serverExpenses.map((s) => s.id));
    const nonDuplicatedPending = formattedPending.filter((p) => !serverIds.has(p.id));
    return [...nonDuplicatedPending, ...serverExpenses];
  }, [serverExpenses, pendingExpenses, categories]);

  return { expenses, loading, refetch: fetchExpenses };
}

export function useSettlements(includeDeleted = false) {
  const [serverSettlements, setServerSettlements] = useState<Settlement[]>(() =>
    includeDeleted ? [] : getCachedSettlements()
  );
  const [pendingSettlements, setPendingSettlements] = useState(getPendingSettlements());
  const [loading, setLoading] = useState(true);

  // Listen to queue changes
  useEffect(() => {
    return subscribeToQueueChanges(() => {
      setPendingSettlements(getPendingSettlements());
    });
  }, []);

  const fetchSettlements = useCallback(async () => {
    try {
      let query = supabase
        .from('settlements')
        .select('*')
        .order('settled_on', { ascending: false })
        .order('created_at', { ascending: false });

      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      const fetched = data ?? [];
      if (!includeDeleted) setCachedSettlements(fetched);
      setServerSettlements(fetched);
    } catch (e: any) {
      console.error('Failed to load settlements', e);
      // If offline, stay with cached data
      if (!includeDeleted) {
        const cached = getCachedSettlements();
        if (cached.length > 0) {
          setServerSettlements(cached);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [includeDeleted]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // Combine server settlements and pending settlements
  const settlements = useMemo(() => {
    const formattedPending = pendingSettlements.map((p) => pendingToSettlement(p));
    const serverIds = new Set(serverSettlements.map((s) => s.id));
    const nonDuplicatedPending = formattedPending.filter((p) => !serverIds.has(p.id));
    return [...nonDuplicatedPending, ...serverSettlements];
  }, [serverSettlements, pendingSettlements]);

  return { settlements, loading, refetch: fetchSettlements };
}

export function useBalances(
  members: Member[],
  expenses: ExpenseWithSplits[],
  settlements: Settlement[]
): UserBalancesSummary {
  const { member } = useAuth();

  return useMemo(() => {
    if (!member) {
      return { overallNetPaise: 0, pairwise: [] };
    }

    return calculateBalances({
      currentMemberId: member.id,
      members,
      expenses,
      settlements,
    });
  }, [member, members, expenses, settlements]);
}

export function useExpenseMutations(onSuccess?: () => void) {
  const { member } = useAuth();

  const createExpense = async (input: {
    title: string;
    amount_paise: number;
    paid_by: string;
    category_id: string | null;
    expense_date: string;
    note?: string | null;
    splits: { member_id: string; share_paise: number }[];
  }) => {
    if (!member) throw new Error('Not authenticated');

    const generatedId = crypto.randomUUID();

    // If offline, queue locally immediately
    if (!navigator.onLine) {
      queueOfflineExpense({
        id: generatedId,
        title: input.title,
        amount_paise: input.amount_paise,
        paid_by: input.paid_by,
        category_id: input.category_id,
        expense_date: input.expense_date,
        note: input.note || null,
        created_by: member.id,
        created_at: new Date().toISOString(),
        splits: input.splits,
      });
      try {
        onSuccess?.();
      } catch {}
      return generatedId;
    }

    try {
      // 1. Insert expense online
      const { data: expData, error: expErr } = await supabase
        .from('expenses')
        .insert({
          id: generatedId,
          title: input.title,
          amount_paise: input.amount_paise,
          paid_by: input.paid_by,
          category_id: input.category_id,
          expense_date: input.expense_date,
          note: input.note || null,
          created_by: member.id,
        })
        .select('id')
        .single();

      if (expErr || !expData) throw expErr || new Error('Failed to create expense');

      const expenseId = expData.id;

      // 2. Insert splits
      const splitsPayload = input.splits.map((s) => ({
        expense_id: expenseId,
        member_id: s.member_id,
        share_paise: s.share_paise,
      }));

      const { error: splitsErr } = await supabase
        .from('expense_splits')
        .insert(splitsPayload);

      if (splitsErr) throw splitsErr;

      try {
        onSuccess?.();
      } catch {}
      return expenseId;
    } catch (err: any) {
      // Check if this was a known Postgres database constraint/schema error (e.g. invalid code)
      const isPostgresConstraint = Boolean(
        err?.code && typeof err.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code)
      );

      // If it is NOT an explicit Postgres database constraint, treat it as a network/offline condition
      if (!isPostgresConstraint) {
        queueOfflineExpense({
          id: generatedId,
          title: input.title,
          amount_paise: input.amount_paise,
          paid_by: input.paid_by,
          category_id: input.category_id,
          expense_date: input.expense_date,
          note: input.note || null,
          created_by: member.id,
          created_at: new Date().toISOString(),
          splits: input.splits,
        });
        try {
          onSuccess?.();
        } catch {}
        return generatedId;
      }
      throw err;
    }
  };

  const updateExpense = async (
    expenseId: string,
    input: {
      title: string;
      amount_paise: number;
      paid_by: string;
      category_id: string | null;
      expense_date: string;
      note?: string | null;
      splits: { member_id: string; share_paise: number }[];
    }
  ) => {
    if (!member) throw new Error('Not authenticated');

    // 1. Update expense row
    const { error: expErr } = await supabase
      .from('expenses')
      .update({
        title: input.title,
        amount_paise: input.amount_paise,
        paid_by: input.paid_by,
        category_id: input.category_id,
        expense_date: input.expense_date,
        note: input.note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', expenseId);

    if (expErr) throw expErr;

    // 2. Replace splits
    const { error: delErr } = await supabase
      .from('expense_splits')
      .delete()
      .eq('expense_id', expenseId);

    if (delErr) throw delErr;

    const splitsPayload = input.splits.map((s) => ({
      expense_id: expenseId,
      member_id: s.member_id,
      share_paise: s.share_paise,
    }));

    const { error: splitsErr } = await supabase
      .from('expense_splits')
      .insert(splitsPayload);

    if (splitsErr) throw splitsErr;

    onSuccess?.();
    return expenseId;
  };

  const softDeleteExpense = async (expenseId: string) => {
    if (!member) throw new Error('Not authenticated');

    const pending = getPendingExpenses();
    if (pending.some((e) => e.id === expenseId)) {
      removePendingExpense(expenseId);
      try {
        onSuccess?.();
      } catch {}
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: member.id,
      })
      .eq('id', expenseId);

    if (error) throw error;
    try {
      onSuccess?.();
    } catch {}
  };

  const restoreExpense = async (expenseId: string) => {
    const { error } = await supabase
      .from('expenses')
      .update({
        deleted_at: null,
        deleted_by: null,
      })
      .eq('id', expenseId);

    if (error) throw error;
    try {
      onSuccess?.();
    } catch {}
  };

  const createSettlement = async (input: {
    to_member: string;
    amount_paise: number;
    settled_on: string;
    note?: string | null;
  }) => {
    if (!member) throw new Error('Not authenticated');

    const generatedId = crypto.randomUUID();

    if (!navigator.onLine) {
      queueOfflineSettlement({
        id: generatedId,
        from_member: member.id,
        to_member: input.to_member,
        amount_paise: input.amount_paise,
        settled_on: input.settled_on,
        note: input.note || null,
        created_by: member.id,
        created_at: new Date().toISOString(),
      });
      try {
        onSuccess?.();
      } catch {}
      return;
    }

    try {
      const { error } = await supabase.from('settlements').insert({
        id: generatedId,
        from_member: member.id,
        to_member: input.to_member,
        amount_paise: input.amount_paise,
        settled_on: input.settled_on,
        note: input.note || null,
        created_by: member.id,
      });

      if (error) throw error;
      try {
        onSuccess?.();
      } catch {}
    } catch (err: any) {
      const isPostgresConstraint = Boolean(
        err?.code && typeof err.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code)
      );

      if (!isPostgresConstraint) {
        queueOfflineSettlement({
          id: generatedId,
          from_member: member.id,
          to_member: input.to_member,
          amount_paise: input.amount_paise,
          settled_on: input.settled_on,
          note: input.note || null,
          created_by: member.id,
          created_at: new Date().toISOString(),
        });
        try {
          onSuccess?.();
        } catch {}
        return;
      }
      throw err;
    }
  };

  return {
    createExpense,
    updateExpense,
    softDeleteExpense,
    restoreExpense,
    createSettlement,
  };
}
