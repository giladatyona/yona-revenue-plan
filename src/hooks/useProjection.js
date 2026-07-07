import { useMemo } from 'react';

export const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MARCH_REVENUE = 354000;
export const LAUNCH_MONTH_INDEX = 4;
const AU_SHARE = 0.6;
const US_SHARE = 0.4;

export function useProjection({
  monthlyGrowth,
  auCurrentAov,
  auFutureAov,
  usCurrentAov,
  usFutureAov,
  auMargin,
  usMargin,
  launchMonthIndex = LAUNCH_MONTH_INDEX,
}) {
  return useMemo(() => {
    const marchAuRevenue = MARCH_REVENUE * AU_SHARE;
    const marchUsRevenue = MARCH_REVENUE * US_SHARE;

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
  }, [monthlyGrowth, auCurrentAov, auFutureAov, usCurrentAov, usFutureAov, auMargin, usMargin, launchMonthIndex]);
}
