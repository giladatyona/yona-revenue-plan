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
