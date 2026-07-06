import { useState } from 'react';
import { TrendingUp, Globe, Percent, Target, MessageSquare } from 'lucide-react';
import { useProjection, MARCH_REVENUE, MONTHS } from './hooks/useProjection';
import { useSharedState } from './hooks/useSharedState';
import { getUnlockedMonths } from './lib/getUnlockedMonths';
import { getActualRows } from './lib/getActualRows';
import { RevenueChart } from './components/RevenueChart';
import { ProfitChart } from './components/ProfitChart';

const STEP_CHANGE_MONTH_OPTIONS = MONTHS.map((month, index) => ({ month, index })).slice(1);

const DEFAULT_SHARED_STATE = {
  monthlyGrowth: 4.8,
  currentAov: 235,
  futureAov: 350,
  launchMonthIndex: 4,
  auMargin: 8,
  usMargin: 6,
  actuals: {},
};

function App() {
  const [shared, updateShared, isLoaded] = useSharedState(DEFAULT_SHARED_STATE);
  const { monthlyGrowth, currentAov, futureAov, launchMonthIndex, auMargin, usMargin, actuals } = shared;
  const [activeTab, setActiveTab] = useState('prediction');

  const data = useProjection({ monthlyGrowth, currentAov, futureAov, auMargin, usMargin, launchMonthIndex });
  const decData = data[data.length - 1];
  const blendedMargin = ((decData.Profit / decData.Total) * 100).toFixed(1);

  const unlockedMonths = getUnlockedMonths();
  const actualRows = getActualRows(actuals);
  const unlockedMonthNames = MONTHS.filter((month) => unlockedMonths[month]);

  const updateActual = (month, field, value) => {
    updateShared({
      actuals: {
        ...actuals,
        [month]: { ...actuals[month], [field]: value === '' ? undefined : Number(value) },
      },
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-sm text-slate-400 font-medium">
        Loading shared plan...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-12 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight">YONA SCALE PLAN — 2026</h1>
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
                  <input type="range" min="0" max="15" step="0.1" value={monthlyGrowth} onChange={(e) => updateShared({ monthlyGrowth: parseFloat(e.target.value) })} aria-label="Order Growth Month over Month" className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 mb-4 text-slate-900">
                    <Target size={14} className="text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">AOV Step Change</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pre Step-Change</p>
                      <input type="number" value={currentAov} onChange={(e) => updateShared({ currentAov: Number(e.target.value) })} aria-label="Pre Step-Change Average Order Value" className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Post Step-Change</p>
                      <input type="number" value={futureAov} onChange={(e) => updateShared({ futureAov: Number(e.target.value) })} aria-label="Post Step-Change Average Order Value" className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Step-Change Month</p>
                    <select
                      value={launchMonthIndex}
                      onChange={(e) => updateShared({ launchMonthIndex: Number(e.target.value) })}
                      aria-label="AOV Step-Change Month"
                      className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold"
                    >
                      {STEP_CHANGE_MONTH_OPTIONS.map(({ month, index }) => (
                        <option key={month} value={index}>{month}</option>
                      ))}
                    </select>
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
                  <input type="range" min="0" max="20" step="0.5" value={auMargin} onChange={(e) => updateShared({ auMargin: parseFloat(e.target.value) })} aria-label="Australia Net Profit Margin" className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-3 text-sm font-bold">
                    <span>US Margin</span>
                    <span className="text-blue-500">{usMargin}%</span>
                  </div>
                  <input type="range" min="0" max="20" step="0.5" value={usMargin} onChange={(e) => updateShared({ usMargin: parseFloat(e.target.value) })} aria-label="United States Net Profit Margin" className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500" />
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
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase">Revenue Growth Projection</h3>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('prediction')}
                      className={`text-[10px] font-bold uppercase px-3 py-1 rounded-md transition-all ${activeTab === 'prediction' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                      Prediction
                    </button>
                    <button
                      onClick={() => setActiveTab('actual')}
                      className={`text-[10px] font-bold uppercase px-3 py-1 rounded-md transition-all ${activeTab === 'actual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                      Actual
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> AU
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> US
                    </div>
                  </div>
                </div>
              </div>

              {activeTab === 'prediction' && (
                <div className="h-[350px] w-full">
                  <RevenueChart data={data} />
                </div>
              )}

              {activeTab === 'actual' && (
                <div>
                  {actualRows.length > 0 ? (
                    <div className="h-[350px] w-full">
                      <RevenueChart data={actualRows} />
                    </div>
                  ) : (
                    <div className="h-[100px] flex items-center justify-center text-sm text-slate-400 font-medium">
                      No actuals entered yet — fill in a month below.
                    </div>
                  )}

                  <div className="mt-6 space-y-3">
                    {unlockedMonthNames.length === 0 && (
                      <p className="text-xs text-slate-400 font-medium">No months are unlocked yet.</p>
                    )}
                    {unlockedMonthNames.map((month) => (
                      <div key={month} className="grid grid-cols-3 gap-3 items-center">
                        <span className="text-xs font-bold text-slate-500">{month}</span>
                        <input
                          type="number"
                          placeholder="AU actual"
                          value={actuals[month]?.au ?? ''}
                          onChange={(e) => updateActual(month, 'au', e.target.value)}
                          aria-label={`${month} Australia Actual Revenue`}
                          className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold"
                        />
                        <input
                          type="number"
                          placeholder="US actual"
                          value={actuals[month]?.us ?? ''}
                          onChange={(e) => updateActual(month, 'us', e.target.value)}
                          aria-label={`${month} United States Actual Revenue`}
                          className="w-full bg-slate-50 border-0 rounded-lg p-2 text-sm font-bold text-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <p className="text-xs text-slate-500">Adjust the levers on the left to model different growth and margin scenarios.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
