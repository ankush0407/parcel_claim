import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { Claim } from '../../types';
import { StatusBadge, TypeBadge, PriorityDot } from './Badges';
import { formatCurrency, formatDate } from '../../utils/helpers';
import clsx from 'clsx';
import { useAuth } from '../../auth/AuthContext';

interface ClaimsTableProps {
  claims: Claim[];
  selectedIds: string[];
  onSelectAll: (selected: boolean) => void;
  onSelectOne: (id: string) => void;
}

type SortKey = 'claimNumber' | 'carrier' | 'type' | 'status' | 'claimedAmount' | 'filedDate' | 'daysOpen';
type SortDir = 'asc' | 'desc';

export default function ClaimsTable({ claims, selectedIds, onSelectAll, onSelectOne }: ClaimsTableProps) {
  const navigate = useNavigate();
    const { user } = useAuth();
    const isMerchant = user?.role === 'merchant';
  const [sortKey, setSortKey] = useState<SortKey>('filedDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...claims].sort((a, b) => {
    let va: string | number = a[sortKey] as string | number;
    let vb: string | number = b[sortKey] as string | number;
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="inline-flex flex-col ml-1">
      {sortKey === col && sortDir === 'asc'
        ? <ChevronUp className="w-3 h-3 text-maersk-blue" />
        : sortKey === col && sortDir === 'desc'
        ? <ChevronDown className="w-3 h-3 text-maersk-blue" />
        : <ChevronUp className="w-3 h-3 text-gray-300" />}
    </span>
  );

  const TH = ({ label, col }: { label: string; col: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-maersk-navy select-none whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      {label}<SortIcon col={col} />
    </th>
  );

  const allChecked = claims.length > 0 && selectedIds.length === claims.length;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Mobile card list — visible below md */}
      <div className="md:hidden divide-y divide-gray-100">
        {sorted.length === 0 && (
          <p className="text-center py-12 text-gray-400 text-sm">No claims found matching your filters.</p>
        )}
        {sorted.map((claim) => (
          <div
            key={claim.id}
            onClick={() => navigate(`/claims/${claim.id}`)}
            className="p-4 cursor-pointer hover:bg-blue-50/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-maersk-navy text-sm">{claim.claimNumber}</p>
                <p className="text-xs text-gray-400 font-mono">{claim.trackingNumber}</p>
              </div>
              <StatusBadge status={claim.status} size="sm" />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {!isMerchant && <span>{claim.carrier}</span>}
              <span><TypeBadge type={claim.type} size="sm" /></span>
              <span className="font-semibold text-maersk-navy">{formatCurrency(claim.claimedAmount, claim.currency)}</span>
              <span>{formatDate(claim.filedDate)}</span>
              <span className={clsx(
                'px-1.5 py-0.5 rounded-full font-medium',
                claim.daysOpen > 45 ? 'bg-red-50 text-red-600' :
                claim.daysOpen > 20 ? 'bg-orange-50 text-orange-600' :
                'bg-gray-50 text-gray-500'
              )}>{claim.daysOpen}d open</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table — hidden below md */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-maersk-blue focus:ring-maersk-sky"
                  checked={allChecked}
                  onChange={e => onSelectAll(e.target.checked)}
                />
              </th>
              <TH label="Claim #" col="claimNumber" />
              {!isMerchant && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Carrier</th>}
              <TH label="Type" col="type" />
              <TH label="Status" col="status" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
              <TH label="Claimed" col="claimedAmount" />
              <TH label="Filed" col="filedDate" />
              <TH label="Days Open" col="daysOpen" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((claim) => (
              <tr
                key={claim.id}
                className={clsx(
                  'hover:bg-blue-50/30 transition-colors cursor-pointer',
                  selectedIds.includes(claim.id) && 'bg-maersk-pale'
                )}
                onClick={() => navigate(`/claims/${claim.id}`)}
              >
                <td className="px-4 py-3" onClick={e => { e.stopPropagation(); onSelectOne(claim.id); }}>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-maersk-blue focus:ring-maersk-sky"
                    checked={selectedIds.includes(claim.id)}
                    onChange={() => onSelectOne(claim.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-maersk-navy">{claim.claimNumber}</p>
                    <p className="text-xs text-gray-400 font-mono">{claim.trackingNumber}</p>
                  </div>
                </td>
                {!isMerchant && (
                  <td className="px-4 py-3">
                    <span className="text-gray-700 font-medium">{claim.carrier}</span>
                  </td>
                )}
                <td className="px-4 py-3">
                  <TypeBadge type={claim.type} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={claim.status} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <PriorityDot priority={claim.priority} />
                    <span className="text-xs text-gray-500 capitalize">{claim.priority}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-maersk-navy">{formatCurrency(claim.claimedAmount, claim.currency)}</p>
                    {claim.approvedAmount && (
                      <p className="text-xs text-green-600">
                        Approved: {formatCurrency(claim.approvedAmount, claim.currency)}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(claim.filedDate)}</td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    claim.daysOpen > 45 ? 'bg-red-50 text-red-600' :
                    claim.daysOpen > 20 ? 'bg-orange-50 text-orange-600' :
                    'bg-gray-50 text-gray-500'
                  )}>
                    {claim.daysOpen}d
                  </span>
                </td>
                <td className="px-4 py-3">
                  {claim.assignedTo ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-maersk-sky/20 flex items-center justify-center">
                        <span className="text-maersk-blue text-[10px] font-bold">
                          {claim.assignedTo.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 whitespace-nowrap">{claim.assignedTo}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/claims/${claim.id}`)}
                    className="p-1.5 rounded-lg hover:bg-maersk-light transition-colors text-gray-400 hover:text-maersk-blue"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {claims.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No claims found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
