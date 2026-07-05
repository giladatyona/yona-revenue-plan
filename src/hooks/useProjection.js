import { useMemo } from 'react';

export const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MARCH_REVENUE = 354000;
export const LAUNCH_MONTH_INDEX = 4;
const AU_SHARE = 0.6;
const US_SHARE = 0.4;

export function useProjection({ monthlyGrowth, currentAov, futureAov, auMargin, usMargin, launchMonthIndex = LAUNCH_MONTH_INDEX }) {
  return useMemo(() => {
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

      const auRevenue = totalRevenue * AU_SHARE;
      const usRevenue = totalRevenue * US_SHARE;

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
  }, [monthlyGrowth, currentAov, futureAov, auMargin, usMargin, launchMonthIndex]);
}
