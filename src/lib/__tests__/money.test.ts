import { describe, it, expect } from 'vitest';
import {
  formatPaise,
  parseToPaise,
  splitEqually,
  validateCustomSplit,
  pairwiseNet,
} from '../money';

describe('formatPaise', () => {
  it('formats zero', () => {
    expect(formatPaise(0)).toBe('0.00');
  });

  it('formats small amounts', () => {
    expect(formatPaise(100)).toBe('1.00');
    expect(formatPaise(50)).toBe('0.50');
    expect(formatPaise(1)).toBe('0.01');
  });

  it('formats with Indian digit grouping', () => {
    expect(formatPaise(12345650)).toBe('1,23,456.50');
    expect(formatPaise(10000000)).toBe('1,00,000.00');
    expect(formatPaise(100000)).toBe('1,000.00');
  });

  it('formats large amounts', () => {
    expect(formatPaise(1000000000)).toBe('1,00,00,000.00');
  });
});

describe('parseToPaise', () => {
  it('parses whole rupees', () => {
    expect(parseToPaise('1234')).toBe(123400);
  });

  it('parses rupees with paise', () => {
    expect(parseToPaise('1234.50')).toBe(123450);
  });

  it('parses with commas and currency symbols', () => {
    expect(parseToPaise('₹1,23,456.50')).toBe(12345650);
  });

  it('returns NaN for invalid input', () => {
    expect(parseToPaise('abc')).toBeNaN();
    expect(parseToPaise('')).toBeNaN();
  });

  it('returns NaN for negative values', () => {
    expect(parseToPaise('-100')).toBeNaN();
  });
});

describe('splitEqually', () => {
  it('splits evenly', () => {
    const result = splitEqually(60000, 6);
    expect(result).toEqual([10000, 10000, 10000, 10000, 10000, 10000]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(60000);
  });

  it('distributes remainder to first members', () => {
    // 100 paise / 3 = 33 each, remainder 1
    const result = splitEqually(100, 3);
    expect(result).toEqual([34, 33, 33]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('distributes larger remainder', () => {
    // 10 paise / 3 = 3 each, remainder 1
    const result = splitEqually(10, 3);
    expect(result).toEqual([4, 3, 3]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(10);
  });

  it('handles remainder of 5 among 6 people', () => {
    // 305 / 6 = 50 base, remainder 5
    const result = splitEqually(305, 6);
    expect(result).toEqual([51, 51, 51, 51, 51, 50]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(305);
  });

  it('handles 1 person', () => {
    expect(splitEqually(500, 1)).toEqual([500]);
  });

  it('handles 0 people', () => {
    expect(splitEqually(500, 0)).toEqual([]);
  });

  it('handles 0 amount', () => {
    expect(splitEqually(0, 6)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('sum always equals total for large prime amounts', () => {
    const total = 99997; // prime
    const result = splitEqually(total, 6);
    expect(result.reduce((a, b) => a + b, 0)).toBe(total);
  });
});

describe('validateCustomSplit', () => {
  it('returns 0 when shares equal total', () => {
    expect(validateCustomSplit(30000, [10000, 10000, 10000])).toBe(0);
  });

  it('returns positive when under-assigned', () => {
    expect(validateCustomSplit(30000, [10000, 10000])).toBe(10000);
  });

  it('returns negative when over-assigned', () => {
    expect(validateCustomSplit(30000, [20000, 20000])).toBe(-10000);
  });

  it('handles empty shares', () => {
    expect(validateCustomSplit(30000, [])).toBe(30000);
  });
});

describe('pairwiseNet', () => {
  it('A owes B when A has shares on B-paid expenses', () => {
    // A's share on expenses B paid = 5000, no other activity
    expect(pairwiseNet(5000, 0, 0, 0)).toBe(5000);
  });

  it('nets out when both have shares', () => {
    // A owes B 5000, B owes A 3000 → net A owes B 2000
    expect(pairwiseNet(5000, 3000, 0, 0)).toBe(2000);
  });

  it('settlements reduce debt', () => {
    // A owes B 5000, A settled 2000 to B → net 3000
    expect(pairwiseNet(5000, 0, 2000, 0)).toBe(3000);
  });

  it('reverse settlements increase debt', () => {
    // A owes B 5000, B settled 1000 to A → net 6000
    expect(pairwiseNet(5000, 0, 0, 1000)).toBe(6000);
  });

  it('full settlement makes net zero', () => {
    expect(pairwiseNet(5000, 0, 5000, 0)).toBe(0);
  });

  it('overpayment flips the direction', () => {
    // A owes B 5000, A settled 8000 → net -3000 (B now owes A)
    expect(pairwiseNet(5000, 0, 8000, 0)).toBe(-3000);
  });

  it('complex scenario', () => {
    // A's share on B's expenses: 10000
    // B's share on A's expenses: 4000
    // A settled 3000 to B
    // B settled 1000 to A
    // Net: 10000 - 4000 - 3000 + 1000 = 4000 (A owes B)
    expect(pairwiseNet(10000, 4000, 3000, 1000)).toBe(4000);
  });

  it('all zeros means settled', () => {
    expect(pairwiseNet(0, 0, 0, 0)).toBe(0);
  });
});
