import { describe, it, expect } from 'vitest';
import { en } from '../en';

const BANNED_WORDS = ['balance', 'net', 'ledger', 'settlement', 'sync', 'authenticate'];

describe('i18n vocabulary compliance (§8 and §12)', () => {
  it('does not contain any banned words in UI copy', () => {
    const entries = Object.entries(en);

    for (const [key, value] of entries) {
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        for (const word of BANNED_WORDS) {
          // Check for word boundary or occurrence
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          const matches = regex.test(lower);
          expect(
            matches,
            `Banned word "${word}" found in i18n key "${key}": "${value}"`
          ).toBe(false);
        }
      }
    }
  });
});
