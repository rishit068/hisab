import type { Member, Category, Settlement } from '../types/database';
import type { ExpenseWithSplits } from '../hooks/useData';

const CACHE_MEMBERS_KEY = 'hisaab_cached_members_v1';
const CACHE_CATEGORIES_KEY = 'hisaab_cached_categories_v1';
const CACHE_EXPENSES_KEY = 'hisaab_cached_expenses_v1';
const CACHE_SETTLEMENTS_KEY = 'hisaab_cached_settlements_v1';
const CACHE_CURRENT_MEMBER_KEY = 'hisaab_cached_current_member_v1';

export function getCachedMembers(): Member[] {
  try {
    const raw = localStorage.getItem(CACHE_MEMBERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCachedMembers(members: Member[]): void {
  try {
    if (members && members.length > 0) {
      localStorage.setItem(CACHE_MEMBERS_KEY, JSON.stringify(members));
    }
  } catch {}
}

export function getCachedCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CACHE_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCachedCategories(categories: Category[]): void {
  try {
    if (categories && categories.length > 0) {
      localStorage.setItem(CACHE_CATEGORIES_KEY, JSON.stringify(categories));
    }
  } catch {}
}

export function getCachedExpenses(): ExpenseWithSplits[] {
  try {
    const raw = localStorage.getItem(CACHE_EXPENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCachedExpenses(expenses: ExpenseWithSplits[]): void {
  try {
    if (expenses && expenses.length > 0) {
      localStorage.setItem(CACHE_EXPENSES_KEY, JSON.stringify(expenses));
    }
  } catch {}
}

export function getCachedSettlements(): Settlement[] {
  try {
    const raw = localStorage.getItem(CACHE_SETTLEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCachedSettlements(settlements: Settlement[]): void {
  try {
    if (settlements && settlements.length > 0) {
      localStorage.setItem(CACHE_SETTLEMENTS_KEY, JSON.stringify(settlements));
    }
  } catch {}
}

export function getCachedCurrentMember(): Member | null {
  try {
    const raw = localStorage.getItem(CACHE_CURRENT_MEMBER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedCurrentMember(member: Member | null): void {
  try {
    if (member) {
      localStorage.setItem(CACHE_CURRENT_MEMBER_KEY, JSON.stringify(member));
    } else {
      localStorage.removeItem(CACHE_CURRENT_MEMBER_KEY);
    }
  } catch {}
}
