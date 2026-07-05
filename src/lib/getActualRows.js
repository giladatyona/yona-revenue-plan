import { MONTHS } from '../hooks/useProjection';

export function getActualRows(actuals) {
  return MONTHS.filter((month) => {
    const entry = actuals[month];
    return entry != null && entry.au != null && entry.us != null;
  }).map((month) => {
    const { au, us } = actuals[month];
    return { name: month, Total: au + us, AU: au, US: us };
  });
}
