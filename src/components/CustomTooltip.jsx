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
