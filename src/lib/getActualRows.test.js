import { describe, it, expect } from 'vitest';
import { getActualRows } from './getActualRows';

describe('getActualRows', () => {
  it('returns an empty array when no months are filled', () => {
    expect(getActualRows({})).toEqual([]);
  });

  it('includes only months with both AU and US entered', () => {
    const actuals = {
      Mar: { au: 200000, us: 130000 },
      Apr: { au: 210000 }, // US missing, should be excluded
      May: { us: 140000 }, // AU missing, should be excluded
    };
    expect(getActualRows(actuals)).toEqual([
      { name: 'Mar', Total: 330000, AU: 200000, US: 130000 },
    ]);
  });

  it('preserves Mar-Dec chronological order regardless of object key order', () => {
    const actuals = {
      Jun: { au: 100, us: 50 },
      Mar: { au: 200, us: 100 },
    };
    expect(getActualRows(actuals).map(r => r.name)).toEqual(['Mar', 'Jun']);
  });

  it('computes Total as the sum of AU and US', () => {
    const actuals = { Dec: { au: 500000, us: 300000 } };
    expect(getActualRows(actuals)[0].Total).toBe(800000);
  });
});
