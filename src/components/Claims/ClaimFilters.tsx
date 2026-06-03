import { Search, Filter, Download, X } from 'lucide-react';
import { ClaimStatus, ClaimType, CarrierName } from '../../types';
import { getStatusLabel, getClaimTypeLabel } from '../../utils/helpers';
import clsx from 'clsx';

const allStatuses: ClaimStatus[] = [
  'submitted', 'under_review', 'documentation_requested',
  'carrier_review', 'approved', 'partially_approved', 'rejected', 'escalated', 'closed',
];

const allTypes: ClaimType[] = ['lost', 'damaged', 'late_delivery', 'wrong_delivery', 'missing_items', 'shortage'];

const allCarriers: CarrierName[] = ['Maersk', 'DHL', 'UPS', 'FedEx', 'CMA CGM', 'MSC', 'Evergreen', 'Hapag-Lloyd'];

export interface FilterState {
  search: string;
  status: ClaimStatus | '';
  type: ClaimType | '';
  carrier: CarrierName | '';
  merchantCompany: string;
  priority: string;
  dateFrom: string;
  dateTo: string;
}

interface ClaimFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  onExport: () => void;
  canFilterByMerchant: boolean;
  merchantCompanies: string[];
  showCarrierFilter?: boolean;
}

export default function ClaimFilters({
  filters,
  onChange,
  totalCount,
  filteredCount,
  selectedCount,
  onExport,
  canFilterByMerchant,
  merchantCompanies,
  showCarrierFilter = true,
}: ClaimFiltersProps) {
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  const activeFilterCount = [filters.status, filters.type, filters.carrier, filters.merchantCompany, filters.priority, filters.dateFrom, filters.dateTo].filter(Boolean).length;

  const clearAll = () =>
    onChange({ search: '', status: '', type: '', carrier: '', merchantCompany: '', priority: '', dateFrom: '', dateTo: '' });

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search claim #, tracking number, company..."
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky"
          />
        </div>

        {/* Result count */}
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {filteredCount} of {totalCount} claims
          {selectedCount > 0 && <span className="text-maersk-blue font-medium"> · {selectedCount} selected</span>}
        </span>

        {/* Export */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" /> Clear filters ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />

        <select
          value={filters.status}
          onChange={e => update({ status: e.target.value as ClaimStatus | '' })}
          className={clsx(
            'text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky',
            filters.status ? 'border-maersk-sky bg-maersk-light text-maersk-navy' : 'border-gray-200 text-gray-500'
          )}
        >
          <option value="">All Statuses</option>
          {allStatuses.map(s => (
            <option key={s} value={s}>{getStatusLabel(s)}</option>
          ))}
        </select>

        <select
          value={filters.type}
          onChange={e => update({ type: e.target.value as ClaimType | '' })}
          className={clsx(
            'text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky',
            filters.type ? 'border-maersk-sky bg-maersk-light text-maersk-navy' : 'border-gray-200 text-gray-500'
          )}
        >
          <option value="">All Types</option>
          {allTypes.map(t => (
            <option key={t} value={t}>{getClaimTypeLabel(t)}</option>
          ))}
        </select>

        {showCarrierFilter && (
          <select
            value={filters.carrier}
            onChange={e => update({ carrier: e.target.value as CarrierName | '' })}
            className={clsx(
              'text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky',
              filters.carrier ? 'border-maersk-sky bg-maersk-light text-maersk-navy' : 'border-gray-200 text-gray-500'
            )}
          >
            <option value="">All Carriers</option>
            {allCarriers.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {canFilterByMerchant && (
          <select
            value={filters.merchantCompany}
            onChange={e => update({ merchantCompany: e.target.value })}
            className={clsx(
              'text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky',
              filters.merchantCompany ? 'border-maersk-sky bg-maersk-light text-maersk-navy' : 'border-gray-200 text-gray-500'
            )}
          >
            <option value="">All Merchants</option>
            {merchantCompanies.map((company) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        )}

        <select
          value={filters.priority}
          onChange={e => update({ priority: e.target.value })}
          className={clsx(
            'text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky',
            filters.priority ? 'border-maersk-sky bg-maersk-light text-maersk-navy' : 'border-gray-200 text-gray-500'
          )}
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-gray-400">From:</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => update({ dateFrom: e.target.value })}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky"
          />
          <span className="text-xs text-gray-400">To:</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => update({ dateTo: e.target.value })}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky"
          />
        </div>
      </div>
    </div>
  );
}
