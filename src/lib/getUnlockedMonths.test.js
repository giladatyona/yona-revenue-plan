import { describe, it, expect } from 'vitest';
import { getUnlockedMonths } from './getUnlockedMonths';

describe('getUnlockedMonths', () => {
  it('unlocks no months before the app year has started', () => {
    const unlocked = getUnlockedMonths(new Date(2025, 11, 31));
    expect(unlocked).toEqual({
      Mar: false, Apr: false, May: false, Jun: false, Jul: false,
      Aug: false, Sep: false, Oct: false, Nov: false, Dec: false,
    });
  });

  it('unlocks Mar-Jun but not Jul when today is July 5, 2026', () => {
    const unlocked = getUnlockedMonths(new Date(2026, 6, 5));
    expect(unlocked).toEqual({
      Mar: true, Apr: true, May: true, Jun: true, Jul: false,
      Aug: false, Sep: false, Oct: false, Nov: false, Dec: false,
    });
  });

  it('unlocks Jul exactly on August 1, 2026', () => {
    const unlocked = getUnlockedMonths(new Date(2026, 7, 1));
    expect(unlocked.Jul).toBe(true);
    expect(unlocked.Aug).toBe(false);
  });

  it('keeps Jun locked on the last moment of June', () => {
    const unlocked = getUnlockedMonths(new Date(2026, 5, 30, 23, 59, 59));
    expect(unlocked.Jun).toBe(false);
    expect(unlocked.May).toBe(true);
  });

  it('unlocks every month once the app year is fully in the past', () => {
    const unlocked = getUnlockedMonths(new Date(2027, 0, 1));
    expect(unlocked).toEqual({
      Mar: true, Apr: true, May: true, Jun: true, Jul: true,
      Aug: true, Sep: true, Oct: true, Nov: true, Dec: true,
    });
  });
});
