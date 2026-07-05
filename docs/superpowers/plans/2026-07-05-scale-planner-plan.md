# 2024 Scale Plan Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline, client-only React dashboard that projects Mar–Dec revenue/profit for a 2-territory (AU/US) e-commerce brand, replacing the original spec's live Gemini call with a local rule-based strategy generator.

**Architecture:** Vite + React 18 SPA. A memoized `useProjection` hook computes the 10-month data array from 5 lever inputs; a pure `generateStrategy` function derives tactical text from the same inputs; two Recharts components render the data; `App.jsx` holds state and layout.

**Tech Stack:** Vite, React 18, Tailwind CSS, Recharts, lucide-react, Vitest + @testing-library/react (hook tests only — chart/UI components verified manually in-browser).

---

## Reference: full math and design context

See `docs/superpowers/specs/2026-07-05-scale-planner-design.md` for the full spec this plan implements.

Key constants used throughout:
- `MONTHS = ["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]`
- `MARCH_REVENUE = 354000`
- `LAUNCH_MONTH_INDEX = 4` (July)
- `AU_SHARE = 0.6`, `US_SHARE = 0.4`

---

### Task 1: Scaffold project

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.jsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite React app in the current directory**

Run:
```bash
npm create vite@latest . -- --template react
```
Expected: creates `index.html`, `src/main.jsx`, `src/App.jsx` (placeholder, will be overwritten later), `package.json`, `vite.config.js`.

- [ ] **Step 2: Install runtime dependencies**

Run:
```bash
npm install recharts lucide-react
```

- [ ] **Step 3: Install and configure Tailwind CSS**

Run:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Edit `tailwind.config.js` to set content paths:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

Replace `src/index.css` entirely with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Install test tooling**

Run:
```bash
npm install -D vitest @testing-library/react jsdom
```

Edit `vite.config.js` to add a `test` block:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

Edit `package.json` `"scripts"` to add:
```json
"test": "vitest run"
```

- [ ] **Step 5: Verify the scaffold builds and dev server starts**

Run: `npm run dev -- --port 5173 &` then check it responds, or simply run `npm run build`.
Expected: build completes with no errors (the default placeholder App.jsx is fine at this point — it gets replaced in Task 7).

- [ ] **Step 6: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite/React/Tailwind project"
```

---

### Task 2: Projection math hook (`useProjection`)

**Files:**
- Create: `src/hooks/useProjection.js`
- Test: `src/hooks/useProjection.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useProjection.test.js`:
```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- useProjection`
Expected: FAIL — `useProjection` is not defined / module not found.

- [ ] **Step 3: Write the implementation**

Create `src/hooks/useProjection.js`:
```js
import { useMemo } from 'react';

export const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MARCH_REVENUE = 354000;
export const LAUNCH_MONTH_INDEX = 4;
const AU_SHARE = 0.6;
const US_SHARE = 0.4;

export function useProjection({ monthlyGrowth, currentAov, futureAov, auMargin, usMargin }) {
  return useMemo(() => {
    let lastOrders = MARCH_REVENUE / currentAov;

    return MONTHS.map((month, index) => {
      const isActual = index === 0;
      const isPostLaunch = index >= LAUNCH_MONTH_INDEX;

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
  }, [monthlyGrowth, currentAov, futureAov, auMargin, usMargin]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- useProjection`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useProjection.js src/hooks/useProjection.test.js
git commit -m "feat: add useProjection revenue/profit projection hook"
```

---

### Task 3: Local strategy generator (`generateStrategy`)

**Files:**
- Create: `src/lib/generateStrategy.js`
- Test: `src/lib/generateStrategy.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/generateStrategy.test.js`:
```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- generateStrategy`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/generateStrategy.js`:
```js
export function generateStrategy({
  monthlyGrowth, currentAov, futureAov, auMargin, usMargin, marRevenue, decRevenue, decMargin,
}) {
  const lines = [];

  if (monthlyGrowth < 3) {
    lines.push(
      `At ${monthlyGrowth}% monthly order growth, you're in conservative territory — retention and repeat-purchase flows can likely carry this pace without adding paid acquisition risk.`
    );
  } else if (monthlyGrowth <= 7) {
    lines.push(
      `${monthlyGrowth}% monthly order growth is a steady scaling pace — keep a balanced mix of paid and organic acquisition so CAC doesn't creep up as volume increases.`
    );
  } else {
    lines.push(
      `${monthlyGrowth}% monthly order growth is aggressive — watch CAC and inventory coverage closely, and diversify acquisition channels so you aren't dependent on one paid source scaling with you.`
    );
  }

  const aovJump = (futureAov - currentAov) / currentAov;
  if (aovJump > 0.3) {
    lines.push(
      `The July AOV jump from $${currentAov} to $${futureAov} (${(aovJump * 100).toFixed(0)}% increase) is significant — reinforce it with bundling, upsells, or a free-shipping threshold so the higher basket size sticks rather than reverting.`
    );
  } else {
    lines.push(
      `The July AOV move from $${currentAov} to $${futureAov} is a modest, low-risk step — achievable through merchandising and pricing alone.`
    );
  }

  if (auMargin < usMargin) {
    lines.push(
      `AU margin (${auMargin}%) is trailing US (${usMargin}%) despite AU carrying 60% of revenue — prioritize AU freight cost or discount-depth review to close the gap, since the regional split itself is fixed.`
    );
  } else if (usMargin < auMargin) {
    lines.push(
      `US margin (${usMargin}%) is trailing AU (${auMargin}%) — look at US freight, discounting, or FX exposure to close the gap, since the regional split itself is fixed.`
    );
  } else {
    lines.push(
      `AU and US margins are matched at ${auMargin}% — maintain parity as you scale rather than letting one region absorb more discounting than the other.`
    );
  }

  const multiple = decRevenue / marRevenue;
  lines.push(
    `December is projected at $${Math.round(decRevenue).toLocaleString()}, a ${multiple.toFixed(1)}x multiple of the $${marRevenue.toLocaleString()} March baseline, at a ${decMargin.toFixed(1)}% blended margin — treat this as the north star the above tactics need to serve.`
  );

  return lines;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- generateStrategy`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/generateStrategy.js src/lib/generateStrategy.test.js
git commit -m "feat: add local rule-based strategy generator"
```

---

### Task 4: Custom tooltip component

**Files:**
- Create: `src/components/CustomTooltip.jsx`

- [ ] **Step 1: Write the component**

Create `src/components/CustomTooltip.jsx`:
```jsx
export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const { Total, AU, US } = payload[0].payload;

  return (
    <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-8 items-center border-b border-slate-50 pb-2 mb-2">
          <span className="text-sm font-black text-slate-900 uppercase">Total Revenue</span>
          <span className="text-sm font-black text-blue-600">${Total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4 text-xs font-medium">
          <span className="text-slate-500">Australia</span>
          <span className="text-emerald-600">${AU.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4 text-xs font-medium">
          <span className="text-slate-500">United States</span>
          <span className="text-blue-500">${US.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CustomTooltip.jsx
git commit -m "feat: add custom revenue tooltip component"
```

(No unit test — pure presentational Recharts tooltip; verified visually in Task 8.)

---

### Task 5: Revenue area chart component

**Files:**
- Create: `src/components/RevenueChart.jsx`

- [ ] **Step 1: Write the component**

Create `src/components/RevenueChart.jsx`:
```jsx
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { CustomTooltip } from './CustomTooltip';

export function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Area stackId="1" type="monotone" dataKey="AU" name="Australia" stroke="#10b981" strokeWidth={0} fill="#10b981" fillOpacity={0.8} />
        <Area stackId="1" type="monotone" dataKey="US" name="United States" stroke="#3b82f6" strokeWidth={0} fill="#3b82f6" fillOpacity={0.8} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RevenueChart.jsx
git commit -m "feat: add stacked revenue area chart component"
```

---

### Task 6: Profit bar chart component

**Files:**
- Create: `src/components/ProfitChart.jsx`

- [ ] **Step 1: Write the component**

Create `src/components/ProfitChart.jsx`:
```jsx
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';

export function ProfitChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{ borderRadius: '12px', border: 'none' }}
          formatter={(value) => [`$${value.toLocaleString()}`, 'Profit']}
        />
        <Bar dataKey="Profit" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.isActual ? '#cbd5e1' : '#0f172a'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProfitChart.jsx
git commit -m "feat: add net profit progression bar chart component"
```

---

### Task 7: Wire up App.jsx

**Files:**
- Modify: `src/App.jsx` (overwrite scaffold placeholder entirely)
- Modify: `src/main.jsx` (verify it imports `./index.css` and `./App.jsx` — scaffold default is already correct, confirm not change)

- [ ] **Step 1: Confirm `src/main.jsx` is unchanged from scaffold**

Open `src/main.jsx` and confirm it contains:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
If it differs (e.g. older Vite template), edit it to match.

- [ ] **Step 2: Replace `src/App.jsx` entirely**

```jsx
import { useState } from 'react';
import { TrendingUp, Globe, Percent, Zap, Sparkles, Target, MessageSquare } from 'lucide-react';
import { useProjection, MARCH_REVENUE } from './hooks/useProjection';
import { generateStrategy } from './lib/generateStrategy';
import { RevenueChart } from './components/RevenueChart';
import { ProfitChart } from './components/ProfitChart';

function App() {
  const [monthlyGrowth, setMonthlyGrowth] = useState(4.8);
  const [currentAov, setCurrentAov] = useState(235);
  const [futureAov, setFutureAov] = useState(350);
  const [auMargin, setAuMargin] = useState(8);
  const [usMargin, setUsMargin] = useState(6);
  const [strategyLines, setStrategyLines] = useState(null);

  const data = useProjection({ monthlyGrowth, currentAov, futureAov, auMargin, usMargin });
  const decData = data[data.length - 1];
  const blendedMargin = ((decData.Profit / decData.Total) * 100).toFixed(1);

  const handleGenerateStrategy = () => {
    const lines = generateStrategy({
      monthlyGrowth,
      currentAov,
      futureAov,
      auMargin,
      usMargin,
      marRevenue: MARCH_REVENUE,
      decRevenue: decData.Total,
      decMargin: parseFloat(blendedMargin),
    });
    setStrategyLines(lines);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-12 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight">2024 SCALE PLAN</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Globe size={16} /> AU (60%) / US (40%) Split • Baseline: ${MARCH_REVENUE.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dec Exit Target</p>
            <p className="text-5xl font-black text-blue-600">${decData.Total.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          <div className="space-y-10">
            <section className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                  <Sparkles size={14} /> AI Strategist
                </h3>
              </div>
              <button
                onClick={handleGenerateStrategy}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
              >
                <Zap size={16} />
                ✨ Generate Scale Strategy
              </button>

              {strategyLines && (
                <div className="mt-4 p-4 bg-white/80 rounded-2xl text-[11px] leading-relaxed text-slate-700 border border-indigo-100 max-h-[200px] overflow-y-auto whitespace-pre-wrap font-medium space-y-2">
                  {strategyLines.map((line, i) => <p key={i}>{line}</p>)}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <TrendingUp size={14} /> Revenue Levers
              </h3>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-3 text-sm font-bold">
                    <span>Order Growth (MoM)</span>
                    <span className="text-blue-600">{monthlyGrowth}%</span>
                  </div>
                  <input type="range" min="0" max="15" step="0.1" value={monthlyGrowth} onChange={(e) => setMonthlyGrowth(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 mb-4 text-slate-900">
                    <Target size={14} className="text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">AOV Step Change</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pre-July</p>
                      <input type="number" value={currentAov} onChange={(e) => setCurrentAov(Number(e.target.value))} className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Post-July</p>
                      <input type="number" value={futureAov} onChange={(e) => setFutureAov(Number(e.target.value))} className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Percent size={14} /> Net Profit Targets
              </h3>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-3 text-sm font-bold">
                    <span>AU Margin</span>
                    <span className="text-emerald-600">{auMargin}%</span>
                  </div>
                  <input type="range" min="0" max="20" step="0.5" value={auMargin} onChange={(e) => setAuMargin(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-3 text-sm font-bold">
                    <span>US Margin</span>
                    <span className="text-blue-500">{usMargin}%</span>
                  </div>
                  <input type="range" min="0" max="20" step="0.5" value={usMargin} onChange={(e) => setUsMargin(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
              </div>
            </section>

            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-blue-100">
              <p className="text-[10px] font-bold opacity-50 uppercase mb-4 tracking-widest">Projected Dec Net</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-black">${decData.Profit.toLocaleString()}</p>
                  <p className="text-xs font-bold opacity-60">Monthly Profit</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-400">{blendedMargin}%</p>
                  <p className="text-[10px] font-bold opacity-50 uppercase">Blended</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-12">
            <div className="h-[350px] w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase">Revenue Growth Projection</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> AU
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> US
                  </div>
                </div>
              </div>
              <RevenueChart data={data} />
            </div>

            <div className="h-[200px] w-full">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-6">Net Profit Progression</h3>
              <ProfitChart data={data} />
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <MessageSquare className="text-indigo-500" size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 tracking-tight">Need a customized marketing breakdown?</p>
                <p className="text-xs text-slate-500">The Strategist considers your current margins to suggest where to deploy capital.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Run the full test suite**

Run: `npm run test`
Expected: All hook/lib tests still PASS (App.jsx has no unit tests — verified visually in Task 8).

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/main.jsx
git commit -m "feat: wire up dashboard layout, controls, and charts in App.jsx"
```

---

### Task 8: Manual verification in browser

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Use the Preview tool (`preview_start`) with a `.claude/launch.json` config:
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 5173 }
  ]
}
```

- [ ] **Step 2: Verify default render**

Load the page. Confirm:
- Header shows "2024 SCALE PLAN", baseline $354,000, and a Dec Exit Target dollar figure
- Revenue chart shows a visible step-change jump in July
- Profit bar chart shows March bar in light slate/grey, Apr–Dec bars in dark slate

- [ ] **Step 3: Verify interactivity**

- Drag the MoM growth slider — confirm Dec Exit Target and both charts update
- Change Pre-July/Post-July AOV number inputs — confirm the July step-change moves accordingly
- Drag AU/US margin sliders — confirm the bottom-line profit card and profit chart update
- Click "Generate Scale Strategy" — confirm 4 lines of text appear, referencing the current slider values
- Hover the revenue chart — confirm the custom tooltip shows Total, AU, and US dollar breakdowns

- [ ] **Step 4: Check console for errors**

Use `preview_console_logs` (level: error) — expect no errors.

- [ ] **Step 5: Commit any fixes found during manual verification**

If manual testing reveals issues, fix them and commit with a descriptive message (e.g. `fix: correct tooltip payload access`).

---

## Self-review notes

- Spec coverage: math rules (Task 2), AI replacement (Task 3), tooltip requirement (Task 4), stacked area chart with step-change (Task 5), profit bar chart with March-as-actual coloring (Task 6), full layout/header/controls (Task 7), responsiveness via `ResponsiveContainer` (Tasks 5–6) — all covered.
- No placeholders — every step has complete, runnable code.
- Type/signature consistency checked: `useProjection` returns `{name, Total, AU, US, Profit, isActual}` — same shape consumed by `RevenueChart`, `ProfitChart`, `CustomTooltip`, and `App.jsx`. `generateStrategy` input keys match what `App.jsx` passes in Task 7.
