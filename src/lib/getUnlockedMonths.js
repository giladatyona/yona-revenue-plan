import { MONTHS } from '../hooks/useProjection';

const APP_YEAR = 2026;
const MONTH_CALENDAR_INDEX = { Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

export function getUnlockedMonths(now = new Date()) {
  return Object.fromEntries(
    MONTHS.map((month) => {
      const followingMonthStart = new Date(APP_YEAR, MONTH_CALENDAR_INDEX[month] + 1, 1);
      return [month, now >= followingMonthStart];
    })
  );
}
