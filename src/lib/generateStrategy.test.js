import { describe, it, expect } from 'vitest';
import { generateStrategy } from './generateStrategy';

describe('generateStrategy', () => {
  const base = {
    monthlyGrowth: 4.8, currentAov: 235, futureAov: 350,
    auMargin: 8, usMargin: 6, marRevenue: 354000, decRevenue: 700000, decMargin: 7.1,
  };

  it('returns exactly 4 recommendation strings', () => {
    expect(generateStrategy(base)).toHaveLength(4);
  });

  it('flags aggressive growth above 7%', () => {
    const [growthLine] = generateStrategy({ ...base, monthlyGrowth: 9 });
    expect(growthLine).toMatch(/aggressive/i);
  });

  it('flags conservative growth below 3%', () => {
    const [growthLine] = generateStrategy({ ...base, monthlyGrowth: 2 });
    expect(growthLine).toMatch(/conservative/i);
  });

  it('flags steady growth between 3% and 7%', () => {
    const [growthLine] = generateStrategy({ ...base, monthlyGrowth: 5 });
    expect(growthLine).toMatch(/steady/i);
  });

  it('flags a large AOV jump above 30% with bundling/upsell language', () => {
    const [, aovLine] = generateStrategy({ ...base, currentAov: 200, futureAov: 350 });
    expect(aovLine).toMatch(/bundling|upsell/i);
  });

  it('calls a small AOV jump low-risk', () => {
    const [, aovLine] = generateStrategy({ ...base, currentAov: 340, futureAov: 350 });
    expect(aovLine).toMatch(/low-risk|modest/i);
  });

  it('flags AU margin when it trails US margin', () => {
    const [, , marginLine] = generateStrategy({ ...base, auMargin: 4, usMargin: 10 });
    expect(marginLine).toMatch(/AU margin/);
  });

  it('flags US margin when it trails AU margin', () => {
    const [, , marginLine] = generateStrategy({ ...base, auMargin: 10, usMargin: 4 });
    expect(marginLine).toMatch(/US margin/);
  });

  it('includes the December revenue and blended margin in the final line', () => {
    const lines = generateStrategy(base);
    expect(lines[3]).toContain('700,000');
    expect(lines[3]).toContain('7.1%');
  });
});
