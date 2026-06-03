import { useCallback, useEffect, useState } from 'react';

import Header from '../components/Layout/Header';
import ClaimsTable from '../components/Claims/ClaimsTable';
import ClaimFilters, { FilterState } from '../components/Claims/ClaimFilters';
import { Claim } from '../types';
import { fetchClaims, processClaimsQueue } from '../api/client';
import { PageError, PageLoading } from '../components/Common/PageState';
import { useAuth } from '../auth/AuthContext';

function applyFilters(claims: Claim[], f: FilterState): Claim[] {
  return claims.filter(c => {
    if (f.search) {
      const q = f.search.toLowerCase();
      if (
        !c.claimNumber.toLowerCase().includes(q) &&
        !c.trackingNumber.toLowerCase().includes(q) &&
        !c.contact.company.toLowerCase().includes(q) &&
        !c.contact.name.toLowerCase().includes(q)
      ) return false;
    }
    if (f.status && c.status !== f.status) return false;
    if (f.type && c.type !== f.type) return false;
    if (f.carrier && c.carrier !== f.carrier) return false;
    if (f.priority && c.priority !== f.priority) return false;
    if (f.merchantCompany && c.contact.company !== f.merchantCompany) return false;
    if (f.dateFrom && c.filedDate < f.dateFrom) return false;
    if (f.dateTo && c.filedDate > f.dateTo) return false;
    return true;
  });
}

export default function ClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [merchantCompanies, setMerchantCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    search: '', status: '', type: '', carrier: '', merchantCompany: '', priority: '', dateFrom: '', dateTo: '',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [processResult, setProcessResult] = useState('');

  const load = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      const data = await fetchClaims(user.id, filters.merchantCompany || undefined);
      setClaims(data.claims);
      setMerchantCompanies(data.merchantCompanies);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load claims data. Start API with npm run dev:api');
    } finally {
      setLoading(false);
    }
  }, [filters.merchantCompany, user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} onRetry={load} />;
  }

  const filtered = applyFilters(claims, filters);

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map(c => c.id) : []);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const headers = ['Claim #', 'Tracking #', 'Carrier', 'Type', 'Status', 'Claimed Amount', 'Currency', 'Filed Date', 'Days Open', 'Assigned To'];
    const rows = filtered.map(c => [
      c.claimNumber, c.trackingNumber, c.carrier, c.type, c.status,
      c.claimedAmount, c.currency, c.filedDate, c.daysOpen, c.assignedTo ?? '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maersk-claims-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProcessQueue = async () => {
    if (!user) return;
    try {
      setProcessingQueue(true);
      setProcessResult('');
      const result = await processClaimsQueue(user.id);
      setProcessResult(`Processed ${result.processed} claims · Approved ${result.approved} · Rejected ${result.rejected} · Exception Queue ${result.exception}`);
      await load();
    } catch (e) {
      setProcessResult(e instanceof Error ? e.message : 'Failed to process claims queue.');
    } finally {
      setProcessingQueue(false);
    }
  };

  return (
    <div>
      <Header
        title="Claims Management"
        subtitle={`${claims.length} total claims across all carriers`}
      />

      <div className="px-8 py-6 space-y-4">
        {(user?.role === 'cx_team' || user?.role === 'admin') && (
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-maersk-navy">CX Analyst Queue Processing</p>
              <p className="text-xs text-gray-500">Run adjudication for newly submitted merchant claims using tracking snapshot rules.</p>
              {processResult && <p className="text-xs mt-1 text-maersk-blue">{processResult}</p>}
            </div>
            <button
              onClick={handleProcessQueue}
              disabled={processingQueue}
              className="px-4 py-2.5 bg-maersk-blue text-white rounded-lg text-sm font-medium hover:bg-maersk-navy transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processingQueue ? 'Processing...' : 'Process Claims Queue'}
            </button>
          </div>
        )}

        <ClaimFilters
          filters={filters}
          onChange={setFilters}
          totalCount={claims.length}
          filteredCount={filtered.length}
          selectedCount={selectedIds.length}
          onExport={handleExport}
          canFilterByMerchant={user?.role === 'cx_team' || user?.role === 'admin'}
          merchantCompanies={merchantCompanies}
          showCarrierFilter={user?.role !== 'merchant'}
        />

        <ClaimsTable
          claims={filtered}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
        />
      </div>
    </div>
  );
}
