import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { ChartDataPoint } from '../../types';

interface ClaimsChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-maersk-navy mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-gray-600">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span>{entry.name}:</span>
            <span className="font-medium text-maersk-navy">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ClaimsBarChart({ data }: ClaimsChartProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-maersk-navy text-sm">Claims Overview</h3>
          <p className="text-xs text-gray-400 mt-0.5">Filed vs Approved — last 7 months</p>
        </div>
        <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-500 focus:outline-none focus:ring-2 focus:ring-maersk-sky/30">
          <option>Last 7 months</option>
          <option>Last 12 months</option>
          <option>This year</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={4} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            formatter={(value) => <span className="text-gray-500">{value}</span>}
          />
          <Bar dataKey="filed" name="Filed" fill="#42B0D5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="approved" name="Approved" fill="#00243D" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const RecoveryTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-maersk-navy mb-1">{label}</p>
        <p className="text-gray-600">
          Recovered: <span className="font-medium text-green-600">${(payload[0].value / 1000).toFixed(1)}k</span>
        </p>
      </div>
    );
  }
  return null;
};

export function RecoveryAreaChart({ data }: ClaimsChartProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-maersk-navy text-sm">Recovery Trend</h3>
          <p className="text-xs text-gray-400 mt-0.5">Total amount recovered (USD)</p>
        </div>
        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">+18.3% vs last month</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#42B0D5" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#42B0D5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<RecoveryTooltip />} />
          <Area
            type="monotone"
            dataKey="recovered"
            stroke="#42B0D5"
            strokeWidth={2.5}
            fill="url(#recoveryGradient)"
            dot={{ fill: '#42B0D5', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#0073AB' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
