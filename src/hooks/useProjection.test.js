import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjection, MONTHS, MARCH_REVENUE, LAUNCH_MONTH_INDEX } from './useProjection';

function computeExpected({ monthlyGrowth, currentAov, futureAov, auMargin, usMargin, launchMonthIndex = LAUNCH_MONTH_INDEX }) {
  let lastOrders = MARCH_REVENUE / currentAov;
  return MONTHS.map((month, index) => {
    const isActual = index === 0;
    const isPostLaunch = index >= launchMonthIndex;
    let orders;
    if (isActual) {
      orders = MARCH_REVENUE / currentAov;
    } else {
      lastOrders = lastOrders * (1 + monthlyGrowth / 100);
      orders = lastOrders;
    }
    const activeAov = isPostLaunch ? futureAov : currentAov;
    const totalRevenue = isActual ? MARCH_REVENUE : orders * activeAov;
    const auRevenue = totalRevenue * 0.6;
    const usRevenue = totalRevenue * 0.4;
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
  const defaultInputs = { monthlyGrowth: 4.8, currentAov: 235, futureAov: 350, auMargin: 8, usMargin: 6 };

  it('returns 10 rows in Mar-Dec order', () => {
    const { result } = renderHook(() => useProjection(defaultInputs));
    expect(result.current.map(r => r.name)).toEqual(MONTHS);
  });

  it('matches the hardcoded March baseline exactly', () => {
    const { result } = renderHook(() => useProjection(defaultInputs));
    expect(result.current[0]).toEqual({
      name: 'Mar', Total: 354000, AU: 212400, US: 141600, Profit: 25488, isActual: true,
    });
  });

  it('matches an independently computed projection for default inputs', () => {
    const { result } = renderHook(() => useProjection(defaultInputs));
    expect(result.current).toEqual(computeExpected(defaultInputs));
  });

  it('matches an independently computed projection when AOV and margins change', () => {
    const inputs = { monthlyGrowth: 9.2, currentAov: 180, futureAov: 400, auMargin: 3.5, usMargin: 12 };
    const { result } = renderHook(() => useProjection(inputs));
    expect(result.current).toEqual(computeExpected(inputs));
  });

  it('applies the AOV step-change in July using hand-computed values, independent of the compounding algorithm', () => {
    // With 0% growth, orders never change from the March baseline, so this isolates the AOV
    // step-change from the compounding logic: Mar-Jun should equal the March baseline exactly,
    // and Jul-Dec should equal marchOrders * futureAov (354000 / 235 * 350 = 527234, hand-computed).
    const inputs = { monthlyGrowth: 0, currentAov: 235, futureAov: 350, auMargin: 8, usMargin: 6 };
    const { result } = renderHook(() => useProjection(inputs));

    const marToJun = result.current.slice(0, 4).map(r => r.Total);
    expect(marToJun).toEqual([354000, 354000, 354000, 354000]);

    const julToDec = result.current.slice(4).map(r => r.Total);
    expect(julToDec).toEqual([527234, 527234, 527234, 527234, 527234, 527234]);
  });

  it('honors a custom launchMonthIndex for the AOV step-change', () => {
    const inputs = { monthlyGrowth: 0, currentAov: 235, futureAov: 350, auMargin: 8, usMargin: 6, launchMonthIndex: 9 };
    const { result } = renderHook(() => useProjection(inputs));

    // With launchMonthIndex 9 (Dec), every month except Dec should still use currentAov.
    const marToNov = result.current.slice(0, 9).map(r => r.Total);
    expect(marToNov).toEqual(new Array(9).fill(354000));

    expect(result.current[9].Total).toBe(527234);
  });

  it('matches an independently computed projection for a custom launchMonthIndex', () => {
    const inputs = { monthlyGrowth: 9.2, currentAov: 180, futureAov: 400, auMargin: 3.5, usMargin: 12, launchMonthIndex: 2 };
    const { result } = renderHook(() => useProjection(inputs));
    expect(result.current).toEqual(computeExpected(inputs));
  });
});
