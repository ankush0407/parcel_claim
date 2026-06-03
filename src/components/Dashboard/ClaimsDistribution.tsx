import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Claim, ClaimStatus } from '../../types';

const statusMeta: { status: ClaimStatus; name: string; color: string }[] = [
  { status: 'approved', name: 'Approved', color: '#17A44B' },
  { status: 'under_review', name: 'Under Review', color: '#F59E0B' },
  { status: 'carrier_review', name: 'Carrier Review', color: '#8B5CF6' },
  { status: 'escalated', name: 'Escalated', color: '#EF4444' },
  { status: 'rejected', name: 'Rejected', color: '#6B7280' },
  { status: 'submitted', name: 'Submitted', color: '#0EA5E9' },
  { status: 'documentation_requested', name: 'Doc Requested', color: '#F97316' },
  { status: 'partially_approved', name: 'Partially Approved', color: '#22C55E' },
  { status: 'closed', name: 'Closed', color: '#64748B' },
  { status: 'draft', name: 'Draft', color: '#94A3B8' },
];

const typeMeta: { type: Claim['type']; name: string; color: string }[] = [
  { type: 'lost', name: 'Lost', color: '#EF4444' },
  { type: 'damaged', name: 'Damaged', color: '#F97316' },
  { type: 'late_delivery', name: 'Late Delivery', color: '#EAB308' },
  { type: 'missing_items', name: 'Missing Items', color: '#EC4899' },
  { type: 'shortage', name: 'Shortage', color: '#3B82F6' },
  { type: 'wrong_delivery', name: 'Wrong Delivery', color: '#14B8A6' },
];

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg shadow-md px-3 py-2 text-xs">
        <span className="font-medium text-maersk-navy">{payload[0].name}: {payload[0].value}</span>
      </div>
    );
  }
  return null;
};

function DonutChart({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-maersk-navy">{total}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
      </div>
    </div>
  );
}

export function ClaimsByStatus({ claims }: { claims: Claim[] }) {
  const statusData = statusMeta
    .map(({ status, name, color }) => ({
      name,
      color,
      value: claims.filter((c) => c.status === status).length,
    }))
    .filter((row) => row.value > 0);
  const total = claims.length;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-maersk-navy text-sm mb-1">Claims by Status</h3>
      <p className="text-xs text-gray-400 mb-3">Current distribution</p>
      <DonutChart data={statusData} total={total} />
      <div className="mt-3 space-y-1.5">
        {statusData.map(({ name, value, color }) => (
          <div key={name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-gray-500">{name}</span>
            </div>
            <span className="font-semibold text-maersk-navy">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClaimsByType({ claims }: { claims: Claim[] }) {
  const typeData = typeMeta
    .map(({ type, name, color }) => ({
      name,
      color,
      value: claims.filter((c) => c.type === type).length,
    }))
    .filter((row) => row.value > 0);
  const total = claims.length;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-maersk-navy text-sm mb-1">Claims by Type</h3>
      <p className="text-xs text-gray-400 mb-3">Incident breakdown</p>
      <DonutChart data={typeData} total={total} />
      <div className="mt-3 space-y-1.5">
        {typeData.map(({ name, value, color }) => (
          <div key={name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-gray-500">{name}</span>
            </div>
            <span className="font-semibold text-maersk-navy">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
