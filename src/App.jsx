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
