# 2024 Scale Plan Dashboard — Design

## Summary
A single-page, client-only React dashboard for modeling a two-territory (AU/US) e-commerce revenue and profit forecast across 10 months (Mar–Dec). Fully offline: no network calls, no backend. Replaces the spec's live Gemini API integration with a local, rule-based strategy generator that reads the same live state.

## Stack
- Vite + React 18 (functional components, hooks)
- Tailwind CSS
- Recharts (`AreaChart`, `BarChart`)
- lucide-react icons
- No routing, no backend, no external API calls

## File structure
```
src/
  App.jsx                  — top-level state, layout shell, sliders/inputs
  hooks/useProjection.js   — useMemo'd 10-month math engine
  lib/generateStrategy.js  — pure function: state -> 3-4 recommendation strings
  components/RevenueChart.jsx
  components/ProfitChart.jsx
  components/CustomTooltip.jsx
```

## State (in App.jsx)
- `monthlyGrowth` (0–15%, step 0.1, default 4.8)
- `currentAov` (default 235), `futureAov` (default 350)
- `launchMonth` = 4 (fixed, index of July)
- `auMargin` (0–20%, step 0.5, default 8.0), `usMargin` (0–20%, step 0.5, default 6.0)
- `strategyText` (string | null) — output of `generateStrategy`, replaces `aiAnalysis`
- No `isAnalyzing` loading state needed (synchronous, no network) — button click computes and sets `strategyText` immediately

## Math engine (`useProjection`)
Timeline: `["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]`

- March revenue is hardcoded actual: `$354,000`. March orders = `354000 / currentAov`.
- For Apr–Dec, orders compound: `orders = prevOrders * (1 + monthlyGrowth/100)`.
- Active AOV: `currentAov` for Mar–Jun (indices 0–3), `futureAov` for Jul–Dec (indices 4–9, i.e. `index >= launchMonth`).
- Total revenue = `orders * activeAov`, except March which stays `354000`.
- AU revenue = `Total * 0.60`, US revenue = `Total * 0.40` (fixed split, independent of margins).
- AU profit = `AU revenue * (auMargin/100)`, US profit = `US revenue * (usMargin/100)`.
- Monthly profit = AU profit + US profit.
- December blended margin = `(Dec profit / Dec total) * 100`.
- Hook signature: `useProjection({ monthlyGrowth, currentAov, futureAov, auMargin, usMargin })`, memoized on those 5 inputs, returns the 10-row data array.

## Local strategy generator (`generateStrategy`)
Pure function `generateStrategy(state) -> string[]` (3-4 items), called synchronously on button click (also fine to call live/on every render since it's cheap — button click is the trigger to *display* it). Rules:

1. **Growth-rate band**: `<3%` → conservative commentary (steady retention-led growth, low CAC risk); `3–7%` → steady scaling commentary (balanced paid/organic mix); `>7%` → aggressive commentary (flag CAC/inventory risk, recommend diversifying acquisition channels). Interpolates the live `monthlyGrowth` value into the sentence.
2. **AOV jump size**: compute `(futureAov - currentAov) / currentAov`. If `>30%`, recommend bundling/upsell/free-shipping-threshold tactics to defend the higher post-July AOV; otherwise note the jump is low-risk and achievable via merchandising alone. Interpolates `currentAov`/`futureAov`.
3. **AU/US margin delta**: compare `auMargin` vs `usMargin`. Whichever is lower gets a targeted suggestion (freight cost, discount depth, FX hedging) to close the gap, since the 60/40 revenue split is fixed regardless of margin performance. Interpolates both margin values.
4. **December target framing**: compute Mar→Dec revenue multiple (`decTotal / marRev`) and blended margin; state as a one-line "north star" that ties the other three tactics to the number they need to hit.

Each string is plain text (no markdown rendering needed — displayed in the existing `whitespace-pre-wrap` block). Button click sets `strategyText` to the array joined with double newlines.

## UI/Layout
Matches the original spec and reference code, with these substitutions:
- AI Strategist card: button label stays "✨ Generate Scale Strategy", but `onClick` calls `generateStrategy(state)` synchronously (no loader spinner needed, but keep the Zap/Sparkles icons for visual consistency; drop `Loader2`/`isAnalyzing` since there's no async wait)
- Everything else (header, revenue levers, profit sliders, bottom-line summary, stacked AreaChart with custom tooltip, Profit BarChart with March-as-actual grey bar) — implemented exactly as described in the original spec.

## Testing
- Unit test `useProjection` math against hand-computed values for default inputs (verify March baseline, one compounding step, the July AOV step-change, and December blended margin).
- Unit test `generateStrategy` returns 4 strings and that each threshold branch produces the expected commentary variant.
- Manual/browser check: sliders update charts and summary card live; tooltip shows AU/US breakdown; profit chart bars are grey for March and dark slate for Apr–Dec.
