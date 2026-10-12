import type { Expense, ExpenseSplit, Settlement, Member } from '../types/database';
import { pairwiseNet } from './money';

export interface PairwiseBalance {
  otherMember: Member;
  /**
   * Positive = current user owes other member.
   * Negative = other member owes current user.
   * Zero = settled up.
   */
  netPaise: number;
}

export interface UserBalancesSummary {
  overallNetPaise: number; // positive = overall user owes, negative = overall user gets back
  pairwise: PairwiseBalance[];
}

interface CalculateBalancesParams {
  currentMemberId: string;
  members: Member[];
  expenses: (Expense & { splits: ExpenseSplit[] })[];
  settlements: Settlement[];
}

/**
 * Calculates pairwise balances and overall net debt from the perspective of currentMemberId.
 * Soft-deleted expenses and settlements are assumed to be excluded (or filtered here).
 */
export function calculateBalances({
  currentMemberId,
  members,
  expenses,
  settlements,
}: CalculateBalancesParams): UserBalancesSummary {
  // Only non-deleted items
  const activeExpenses = expenses.filter((e) => !e.deleted_at);
  const activeSettlements = settlements.filter((s) => !s.deleted_at);

  const otherMembers = members.filter((m) => m.id !== currentMemberId);

  const pairwise: PairwiseBalance[] = otherMembers.map((other) => {
    const otherId = other.id;

    // 1. Current member's shares on expenses OTHER paid (current owes other)
    let mySharesOnOtherPaid = 0;
    for (const exp of activeExpenses) {
      if (exp.paid_by === otherId) {
        const mySplit = exp.splits.find((s) => s.member_id === currentMemberId);
        if (mySplit) {
          mySharesOnOtherPaid += mySplit.share_paise;
        }
      }
    }

    // 2. Other member's shares on expenses CURRENT member paid (other owes current)
    let otherSharesOnMePaid = 0;
    for (const exp of activeExpenses) {
      if (exp.paid_by === currentMemberId) {
        const otherSplit = exp.splits.find((s) => s.member_id === otherId);
        if (otherSplit) {
          otherSharesOnMePaid += otherSplit.share_paise;
        }
      }
    }

    // 3. Settlements from CURRENT to OTHER (reduces current's debt to other)
    let meToOtherSettlements = 0;
    for (const st of activeSettlements) {
      if (st.from_member === currentMemberId && st.to_member === otherId) {
        meToOtherSettlements += st.amount_paise;
      }
    }

    // 4. Settlements from OTHER to CURRENT (reduces other's debt to current)
    let otherToMeSettlements = 0;
    for (const st of activeSettlements) {
      if (st.from_member === otherId && st.to_member === currentMemberId) {
        otherToMeSettlements += st.amount_paise;
      }
    }

    const netPaise = pairwiseNet(
      mySharesOnOtherPaid,
      otherSharesOnMePaid,
      meToOtherSettlements,
      otherToMeSettlements
    );

    return {
      otherMember: other,
      netPaise,
    };
  });

  // Sort pairwise by absolute amount descending (biggest balances first)
  pairwise.sort((a, b) => Math.abs(b.netPaise) - Math.abs(a.netPaise));

  // Overall net for current member (sum of all debts minus credits)
  const overallNetPaise = pairwise.reduce((acc, p) => acc + p.netPaise, 0);

  return {
    overallNetPaise,
    pairwise,
  };
}
