import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjection, MONTHS, MARCH_REVENUE, LAUNCH_MONTH_INDEX } from './useProjection';

function computeExpected({
  monthlyGrowth, auCurrentAov, auFutureAov, usCurrentAov, usFutureAov, auMargin, usMargin,
  launchMonthIndex = LAUNCH_MONTH_INDEX,
}) {
  const marchAuRevenue = MARCH_REVENUE * 0.6;
  const marchUsRevenue = MARCH_REVENUE * 0.4;
  let lastAuOrders = marchAuRevenue / auCurrentAov;
  let lastUsOrders = marchUsRevenue / usCurrentAov;

  return MONTHS.map((month, index) => {
    const isActual = index === 0;
    const isPostLaunch = index >= launchMonthIndex;
    let auOrders;
    let usOrders;
    if (isActual) {
      auOrders = marchAuRevenue / auCurrentAov;
      usOrders = marchUsRevenue / usCurrentAov;
    } else {
      lastAuOrders = lastAuOrders * (1 + monthlyGrowth / 100);
      lastUsOrders = lastUsOrders * (1 + monthlyGrowth / 100);
      auOrders = lastAuOrders;
      usOrders = lastUsOrders;
    }
    const activeAuAov = isPostLaunch ? auFutureAov : auCurrentAov;
    const activeUsAov = isPostLaunch ? usFutureAov : usCurrentAov;
    const auRevenue = isActual ? marchAuRevenue : auOrders * activeAuAov;
    const usRevenue = isActual ? marchUsRevenue : usOrders * activeUsAov;
    const totalRevenue = isActual ? MARCH_REVENUE : auRevenue + usRevenue;
    const auProfit = auRevenue * (auMargin / 100);
    const usProfit = usRevenue * (usMargin / 100);
    return {
      name: month,
      Total: Math.round(totalRevenue),
      AU: Math.round(auRevenue),
      US: Math.round(usRevenue),
      Profit: Math.round(auProfit + usProfit),
      isActual,
    };
  });
}

describe('useProjection', () => {
  const defaultInputs = {
    monthlyGrowth: 4.8, auCurrentAov: 235, auFutureAov: 350, usCurrentAov: 235, usFutureAov: 350, auMargin: 8, usMargin: 6,
  };

  it('returns 10 rows in Mar-Dec order', () => {
    const { result } = renderHook(() => useProjection(defaultInputs));
    expect(result.current.map(r => r.name)).toEqual(MONTHS);
  });

  it('matches the hardcoded March 60/40 baseline regardless of region AOVs', () => {
    const inputs = { ...defaultInputs, auCurrentAov: 200, usCurrentAov: 300 };
    const { result } = renderHook(() => useProjection(inputs));
    expect(result.current[0]).toEqual({
      name: 'Mar', Total: 354000, AU: 212400, US: 141600, Profit: 25488, isActual: true,
    });
  });

  it('matches an independently computed projection when AU and US AOVs are equal', () => {
    const { result } = renderHook(() => useProjection(defaultInputs));
    expect(result.current).toEqual(computeExpected(defaultInputs));
  });

  it('matches an independently computed projection when AU and US AOVs diverge', () => {
    const inputs = {
      monthlyGrowth: 6, auCurrentAov: 200, auFutureAov: 400, usCurrentAov: 300, usFutureAov: 320,
      auMargin: 5, usMargin: 10, launchMonthIndex: 6,
    };
    const { result } = renderHook(() => useProjection(inputs));
    expect(result.current).toEqual(computeExpected(inputs));
  });

  it('keeps the 60/40 revenue split at every month when AU and US AOVs stay equal', () => {
    const { result } = renderHook(() => useProjection(defaultInputs));
    result.current.forEach((row) => {
      expect(row.AU / row.Total).toBeCloseTo(0.6, 5);
    });
  });

  it('produces a revenue split away from 60/40 once AU and US AOVs diverge', () => {
    const inputs = { ...defaultInputs, auFutureAov: 600 };
    const { result } = renderHook(() => useProjection(inputs));
    const decRow = result.current[9];
    expect(decRow.AU / decRow.Total).not.toBeCloseTo(0.6, 2);
  });
});
