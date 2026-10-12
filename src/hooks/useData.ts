import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, Category, Expense, ExpenseSplit, Settlement } from '../types/database';
import { useAuth } from '../features/auth/AuthProvider';
import { calculateBalances, type UserBalancesSummary } from '../lib/balances';

export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[];
  category?: Category | null;
  paid_by_member?: Member | null;
  created_by_member?: Member | null;
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
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
      setMembers(data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load members');
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort', { ascending: true });

      if (err) throw err;
      setCategories(data ?? []);
    } catch {
      // fallback
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
  const [expenses, setExpenses] = useState<ExpenseWithSplits[]>([]);
  const [loading, setLoading] = useState(true);

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
        setExpenses(mapped);
      } else {
        const mapped: ExpenseWithSplits[] = (data ?? []).map((e: any) => ({
          ...e,
          splits: e.expense_splits ?? [],
          category: e.categories ?? null,
          paid_by_member: e.paid_by_member ?? null,
          created_by_member: e.created_by_member ?? null,
        }));
        setExpenses(mapped);
      }
    } catch (e: any) {
      console.error('Failed to load expenses', e);
    } finally {
      setLoading(false);
    }
  }, [includeDeleted]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, refetch: fetchExpenses };
}

export function useSettlements(includeDeleted = false) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

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
      setSettlements(data ?? []);
    } catch (e: any) {
      console.error('Failed to load settlements', e);
    } finally {
      setLoading(false);
    }
  }, [includeDeleted]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

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

    // 1. Insert expense
    const { data: expData, error: expErr } = await supabase
      .from('expenses')
      .insert({
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

    onSuccess?.();
    return expenseId;
  };

  const softDeleteExpense = async (expenseId: string) => {
    if (!member) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('expenses')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: member.id,
      })
      .eq('id', expenseId);

    if (error) throw error;
    onSuccess?.();
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
    onSuccess?.();
  };

  const createSettlement = async (input: {
    to_member: string;
    amount_paise: number;
    settled_on: string;
    note?: string | null;
  }) => {
    if (!member) throw new Error('Not authenticated');

    const { error } = await supabase.from('settlements').insert({
      from_member: member.id,
      to_member: input.to_member,
      amount_paise: input.amount_paise,
      settled_on: input.settled_on,
      note: input.note || null,
      created_by: member.id,
    });

    if (error) throw error;
    onSuccess?.();
  };

  return {
    createExpense,
    softDeleteExpense,
    restoreExpense,
    createSettlement,
  };
}
