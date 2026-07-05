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
