import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjection } from './useProjection';

const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MARCH_REVENUE = 354000;

function computeExpected({ monthlyGrowth, currentAov, futureAov, auMargin, usMargin }) {
  let lastOrders = MARCH_REVENUE / currentAov;
  return MONTHS.map((month, index) => {
    const isActual = index === 0;
    const isPostLaunch = index >= 4;
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
});
