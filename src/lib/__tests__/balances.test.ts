import { describe, it, expect } from 'vitest';
import { calculateBalances } from '../balances';
import type { Member, Expense, ExpenseSplit, Settlement } from '../../types/database';

const members: Member[] = [
  { id: 'm1', name: 'Ramesh', is_admin: true, active: true, created_at: '2026-01-01' },
  { id: 'm2', name: 'Meena', is_admin: false, active: true, created_at: '2026-01-01' },
  { id: 'm3', name: 'Suresh', is_admin: false, active: true, created_at: '2026-01-01' },
];

function createExpense(
  id: string,
  paid_by: string,
  amount_paise: number,
  splits: ExpenseSplit[],
  deleted_at: string | null = null
): Expense & { splits: ExpenseSplit[] } {
  return {
    id,
    title: 'Test Expense',
    amount_paise,
    paid_by,
    category_id: null,
    expense_date: '2026-10-12',
    note: null,
    created_by: paid_by,
    created_at: '2026-10-12T10:00:00Z',
    updated_at: null,
    deleted_at,
    deleted_by: null,
    splits,
  };
}

describe('calculateBalances', () => {
  it('returns all zeros when no expenses or settlements exist', () => {
    const result = calculateBalances({
      currentMemberId: 'm1',
      members,
      expenses: [],
      settlements: [],
    });

    expect(result.overallNetPaise).toBe(0);
    expect(result.pairwise).toHaveLength(2);
    expect(result.pairwise[0].netPaise).toBe(0);
    expect(result.pairwise[1].netPaise).toBe(0);
  });

  it('calculates debt when someone else paid for me', () => {
    // Meena (m2) paid ₹300 (30000 paise), split equally between m1, m2, m3 (10000 each)
    const exp = createExpense('e1', 'm2', 30000, [
      { expense_id: 'e1', member_id: 'm1', share_paise: 10000 },
      { expense_id: 'e1', member_id: 'm2', share_paise: 10000 },
      { expense_id: 'e1', member_id: 'm3', share_paise: 10000 },
    ]);

    const result = calculateBalances({
      currentMemberId: 'm1',
      members,
      expenses: [exp],
      settlements: [],
    });

    // m1 owes m2 10000 paise (positive)
    const m2Balance = result.pairwise.find((p) => p.otherMember.id === 'm2');
    expect(m2Balance?.netPaise).toBe(10000);

    // m1 and m3 have no debt between them
    const m3Balance = result.pairwise.find((p) => p.otherMember.id === 'm3');
    expect(m3Balance?.netPaise).toBe(0);

    // Overall m1 owes 10000
    expect(result.overallNetPaise).toBe(10000);
  });

  it('calculates credit when I paid for someone else', () => {
    // Ramesh (m1) paid ₹600 (60000 paise), split between m1 and m2 (30000 each)
    const exp = createExpense('e1', 'm1', 60000, [
      { expense_id: 'e1', member_id: 'm1', share_paise: 30000 },
      { expense_id: 'e1', member_id: 'm2', share_paise: 30000 },
    ]);

    const result = calculateBalances({
      currentMemberId: 'm1',
      members,
      expenses: [exp],
      settlements: [],
    });

    // m2 owes m1 30000 (negative from m1 perspective)
    const m2Balance = result.pairwise.find((p) => p.otherMember.id === 'm2');
    expect(m2Balance?.netPaise).toBe(-30000);
    expect(result.overallNetPaise).toBe(-30000);
  });

  it('correctly incorporates settlements into balances', () => {
    // Meena (m2) paid ₹600, split between m1 and m2 (30000 each). m1 owes m2 30000.
    const exp = createExpense('e1', 'm2', 60000, [
      { expense_id: 'e1', member_id: 'm1', share_paise: 30000 },
      { expense_id: 'e1', member_id: 'm2', share_paise: 30000 },
    ]);

    // m1 pays m2 ₹200 (20000 paise) via settlement
    const settlement: Settlement = {
      id: 's1',
      from_member: 'm1',
      to_member: 'm2',
      amount_paise: 20000,
      settled_on: '2026-10-12',
      note: null,
      created_by: 'm1',
      created_at: '2026-10-12T11:00:00Z',
      deleted_at: null,
    };

    const result = calculateBalances({
      currentMemberId: 'm1',
      members,
      expenses: [exp],
      settlements: [settlement],
    });

    // m1 now owes m2 only 10000 (30000 - 20000)
    const m2Balance = result.pairwise.find((p) => p.otherMember.id === 'm2');
    expect(m2Balance?.netPaise).toBe(10000);
  });

  it('excludes soft-deleted expenses and settlements', () => {
    // Active expense: m2 paid 10000 for m1
    const activeExp = createExpense('e1', 'm2', 10000, [
      { expense_id: 'e1', member_id: 'm1', share_paise: 10000 },
    ]);

    // Deleted expense: m2 paid 50000 for m1
    const deletedExp = createExpense(
      'e2',
      'm2',
      50000,
      [{ expense_id: 'e2', member_id: 'm1', share_paise: 50000 }],
      '2026-10-12T12:00:00Z'
    );

    // Deleted settlement
    const deletedSettlement: Settlement = {
      id: 's1',
      from_member: 'm1',
      to_member: 'm2',
      amount_paise: 10000,
      settled_on: '2026-10-12',
      note: null,
      created_by: 'm1',
      created_at: '2026-10-12T11:00:00Z',
      deleted_at: '2026-10-12T12:00:00Z',
    };

    const result = calculateBalances({
      currentMemberId: 'm1',
      members,
      expenses: [activeExp, deletedExp],
      settlements: [deletedSettlement],
    });

    // Only activeExp counts: m1 owes m2 10000
    const m2Balance = result.pairwise.find((p) => p.otherMember.id === 'm2');
    expect(m2Balance?.netPaise).toBe(10000);
  });
});
