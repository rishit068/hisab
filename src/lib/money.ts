/**
 * Pure money logic for Hisaab.
 * All amounts are in integer paise (1 INR = 100 paise).
 * No floats. No UI code. Fully tested.
 */

/**
 * Format paise as an INR string with Indian digit grouping.
 * Example: 12345650 → "1,23,456.50"
 * Always returns the formatted number WITHOUT the ₹ symbol (add it in UI).
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Parse a rupee string (e.g. "1234.50" or "1234") to paise.
 * Returns NaN if invalid.
 */
export function parseToPaise(rupeeString: string): number {
  if (rupeeString.includes('-')) return NaN;
  const cleaned = rupeeString.replace(/[^\d.]/g, '');
  if (!cleaned) return NaN;
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) return NaN;
  return Math.round(num * 100);
}

/**
 * Split an amount equally among `count` members.
 * Remainder paise are given one each to the first members
 * (sorted alphabetically by name in the caller).
 *
 * Returns an array of `count` paise values that always sum to `totalPaise`.
 */
export function splitEqually(totalPaise: number, count: number): number[] {
  if (count <= 0) return [];
  if (totalPaise <= 0) return new Array(count).fill(0);

  const base = Math.floor(totalPaise / count);
  const remainder = totalPaise - base * count;

  return Array.from({ length: count }, (_, i) =>
    i < remainder ? base + 1 : base
  );
}

/**
 * Validate that custom split shares sum to the total.
 * Returns the difference (positive = under-assigned, negative = over-assigned).
 */
export function validateCustomSplit(totalPaise: number, shares: number[]): number {
  const sum = shares.reduce((acc, s) => acc + s, 0);
  return totalPaise - sum;
}

/**
 * Calculate pairwise net amount between two members.
 * Positive = A owes B. Negative = B owes A.
 *
 * Parameters:
 * - aSharesOnBPaid: sum of A's shares on expenses B paid (A owes B)
 * - bSharesOnAPaid: sum of B's shares on expenses A paid (B owes A)
 * - aToB: sum of settlements from A to B (reduces A's debt to B)
 * - bToA: sum of settlements from B to A (reduces B's debt to A)
 */
export function pairwiseNet(
  aSharesOnBPaid: number,
  bSharesOnAPaid: number,
  aToB: number,
  bToA: number
): number {
  return aSharesOnBPaid - bSharesOnAPaid - aToB + bToA;
}
