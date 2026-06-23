import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Layout/Header';
import { ClaimsBarChart, RecoveryAreaChart } from '../components/Dashboard/ClaimsCharts';
import { ClaimsByStatus, ClaimsByType } from '../components/Dashboard/ClaimsDistribution';
import { formatCurrency } from '../utils/helpers';
import { fetchAnalyticsData } from '../api/client';
import { ChartDataPoint, Claim } from '../types';
import { PageError, PageLoading } from '../components/Common/PageState';
import { useAuth } from '../auth/AuthContext';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      const data = await fetchAnalyticsData(user.id);
      setClaims(data.claims);
      setChartData(data.chartData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics data. Start API with npm run dev:api');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} onRetry={load} />;
  }

  const byCarrier = claims.reduce<Record<string, { count: number; amount: number }>>((acc, c) => {
    if (!acc[c.carrier]) acc[c.carrier] = { count: 0, amount: 0 };
    acc[c.carrier].count++;
    acc[c.carrier].amount += c.claimedAmount;
    return acc;
  }, {});

  return (
    <div>
      <Header
        title="Analytics"
        subtitle="Claims performance insights and trends"
      />
      <div className="px-8 py-6 space-y-6">
        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <ClaimsBarChart data={chartData} />
          <RecoveryAreaChart data={chartData} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <ClaimsByStatus claims={claims} />
          <ClaimsByType claims={claims} />

          {/* Claims by Carrier */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-maersk-navy text-sm mb-1">Claims by Carrier</h3>
            <p className="text-xs text-gray-400 mb-4">Volume and claimed amounts</p>
            <div className="space-y-3">
              {Object.entries(byCarrier)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([carrier, { count, amount }]) => (
                  <div key={carrier}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{carrier}</span>
                      <span className="text-gray-400">{count} claim{count !== 1 ? 's' : ''} · {formatCurrency(amount, 'USD')}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-maersk-sky"
                        style={{ width: `${claims.length === 0 ? 0 : (count / claims.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* SLA performance */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-maersk-navy text-sm mb-4">SLA Performance by Claim Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { type: 'Lost', avg: 26, sla: 30, pct: 87 },
              { type: 'Damaged', avg: 18, sla: 21, pct: 91 },
              { type: 'Late Delivery', avg: 8, sla: 14, pct: 97 },
              { type: 'Missing Items', avg: 22, sla: 28, pct: 84 },
              { type: 'Shortage', avg: 19, sla: 25, pct: 89 },
              { type: 'Wrong Delivery', avg: 12, sla: 14, pct: 94 },
            ].map(({ type, avg, sla, pct }) => (
              <div key={type} className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs font-medium text-gray-600 mb-3">{type}</p>
                <div className="relative w-14 h-14 mx-auto mb-2">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22"
                      fill="none"
                      stroke={pct >= 90 ? '#17A44B' : pct >= 80 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="5"
                      strokeDasharray={`${(pct / 100) * 138.2} 138.2`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-maersk-navy">{pct}%</span>
                </div>
                <p className="text-xs text-gray-400">Avg {avg}d / SLA {sla}d</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
