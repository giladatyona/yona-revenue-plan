# Selectable AOV Step-Change Month + Actual Revenue Tracking — Design

## Summary

Two additions to the existing Yona Scale Plan dashboard:

1. The AOV step-change month (currently hardcoded to July) becomes a user-selectable dropdown.
2. Users can enter real ("actual") AU/US revenue for months that have already fully elapsed on the calendar, and compare it against the original Prediction via a tab toggle on the Revenue chart.

This builds on the existing app (see `docs/superpowers/specs/2026-07-05-scale-planner-design.md` for the original math/layout spec). No changes to the Net Profit chart, the AI-Strategist-removal, or the underlying compounding math — Prediction stays exactly as it is today.

## 1. Selectable AOV step-change month

- Replace the hardcoded `LAUNCH_MONTH_INDEX` constant usage with a new piece of `App.jsx` state: `launchMonthIndex` (number, default `4`, i.e. July — matches current behavior).
- `useProjection` changes its signature to accept `launchMonthIndex` as an input (in addition to the existing 5 lever inputs), and uses it wherever it currently uses the hardcoded `LAUNCH_MONTH_INDEX` constant. The constant itself can remain exported as the *default* value, but the hook must use the passed-in parameter for its `isPostLaunch` calculation.
- UI: in the Revenue Levers card's "AOV Step Change" subsection, add a `<select>` directly below the existing Pre-July/Post-July number inputs, listing month names **April through December** (index 1-9; March is excluded because it's the fixed baseline). Label it "Step-Change Month". Selecting a month updates `launchMonthIndex` and the projection recomputes immediately (already memoized via `useMemo`, now also keyed on this new input). Existing "Pre-July"/"Post-July" input labels stay as-is (out of scope to rename them dynamically based on the selected month).
- No other math changes: `isPostLaunch = index >= launchMonthIndex` replaces the old `index >= LAUNCH_MONTH_INDEX`.

## 2. Actual revenue tracking

### Data model

New `App.jsx` state: `actuals`, an object keyed by month name, e.g.:
```js
{ Jun: { au: 210000, us: 145000 } }
```
A month counts as "filled" only when **both** `au` and `us` are present (non-empty, valid numbers). A month with only one side entered is treated as not-yet-filled and excluded from the Actual chart — avoids charting a half-real total.

### Unlock logic

A month is editable once it has fully elapsed on the real calendar. The app's 10 months are fixed to year 2026 (per the "YONA SCALE PLAN — 2026" header). A helper function (e.g. `getUnlockedMonths(now = new Date())`) computes, for each of the 10 months, whether `now` is on or after the 1st of the *following* calendar month:

| App month | Real calendar month (2026) | Unlocked when `now >=` |
|---|---|---|
| Mar | March | Apr 1, 2026 |
| Apr | April | May 1, 2026 |
| ... | ... | ... |
| Dec | December | Jan 1, 2027 |

This is a pure function of `now`, recomputed on each render (no timers/polling needed — it only changes once a month). Locked months do not appear in the edit list at all. Passing `now` as a parameter (rather than calling `new Date()` internally) keeps the function testable with fixed dates.

Given today's real date (July 5, 2026), Mar/Apr/May/Jun are unlocked now; Jul unlocks Aug 1, 2026; Aug-Dec remain locked until their turn.

### UI: Prediction / Actual tab toggle

- A small tab toggle (`Prediction` | `Actual`) sits directly above the existing Revenue Growth chart, replacing nothing else in the layout.
- **Prediction tab** (default): renders exactly what exists today — `RevenueChart` fed the full `data` array from `useProjection`. Unchanged.
- **Actual tab**: renders the same `RevenueChart` component, but fed a derived array containing only the "filled" months, with `Total = AU + US` computed per row (same field shape as prediction rows: `{name, Total, AU, US}`), so `CustomTooltip` requires no changes.
  - Below the chart, an inline edit list: one row per **unlocked** month (regardless of whether it's filled yet), each with two number inputs (AU actual $, US actual $), pre-filled if already entered. Editing updates `actuals` state and the Actual chart re-renders immediately.
  - If zero months are filled yet, show a plain empty-state message instead of an empty chart (e.g. "No actuals entered yet — fill in a month below.").
  - Locked months are simply absent from the edit list (no disabled placeholder rows).

### Scope boundaries (explicitly out of scope, per earlier decisions)

- The Net Profit chart is **not** affected — no Actual/Prediction toggle there, stays prediction-only.
- Entering an actual does **not** reshape the Prediction curve for later months — the two stay fully independent.
- No new input validation beyond what already exists elsewhere in the app (no min/max on the actual AU/US inputs, consistent with existing AOV/margin inputs).

## Testing

- Unit test `getUnlockedMonths(now)` against several fixed `now` values (before year 2026, mid-2026 at various months, after 2026) to confirm the unlock boundary is exactly "1st of the month following."
- Unit test the Actual-tab data derivation (filtering to filled months, computing `Total = AU + US`) as a small pure function, independent of any component.
- Unit test `useProjection` still produces correct output when `launchMonthIndex` varies (e.g. index 1, index 9), confirming the new parameter replaces the old hardcoded constant correctly.
- Manual/browser check: selecting different AOV step-change months visibly moves the step in the Revenue chart; switching to the Actual tab shows only unlocked+filled months; entering/editing actual values updates the Actual chart live; Prediction tab remains unaffected by any actual entries.
