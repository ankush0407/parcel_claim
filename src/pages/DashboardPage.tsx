import { useCallback, useEffect, useState } from 'react';
import { FileText, DollarSign, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '../components/Layout/Header';
import MetricCard from '../components/Dashboard/MetricCard';
import { ClaimsBarChart, RecoveryAreaChart } from '../components/Dashboard/ClaimsCharts';
import { ClaimsByStatus, ClaimsByType } from '../components/Dashboard/ClaimsDistribution';
import RecentClaims from '../components/Dashboard/RecentClaims';
import { formatCurrency } from '../utils/helpers';
import { fetchDashboardData } from '../api/client';
import { Claim, ChartDataPoint, DashboardMetrics } from '../types';
import { PageError, PageLoading } from '../components/Common/PageState';
import { useAuth } from '../auth/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      const data = await fetchDashboardData(user.id);
      setClaims(data.claims);
      setDashboardMetrics(data.dashboardMetrics);
      setChartData(data.chartData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data. Start API with npm run dev:api');
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

  if (error || !dashboardMetrics) {
    return <PageError error={error || 'Dashboard metrics missing.'} onRetry={load} />;
  }

  const recent = [...claims].sort((a, b) =>
    new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime()
  ).slice(0, 5);

  return (
    <div>
      <Header
        title="Claims Dashboard"
        subtitle="Overview of all shipping claims — May 2026"
      />

      <div className="px-4 md:px-8 py-4 md:py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Claims"
            value={dashboardMetrics.totalClaims}
            change={dashboardMetrics.changeVsLastMonth.totalClaims}
            changeLabel="vs last month"
            icon={<FileText className="w-5 h-5 text-maersk-blue" />}
            iconBg="bg-maersk-light"
            accent="border-maersk-blue"
          />
          <MetricCard
            title="Active Claims"
            value={dashboardMetrics.activeClaims}
            icon={<AlertCircle className="w-5 h-5 text-orange-500" />}
            iconBg="bg-orange-50"
            accent="border-orange-400"
          />
          <MetricCard
            title="Approved"
            value={dashboardMetrics.approvedClaims}
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            iconBg="bg-green-50"
            accent="border-green-400"
          />
          <MetricCard
            title="Total Recovered"
            value={formatCurrency(dashboardMetrics.totalRecoveredAmount, 'USD')}
            change={dashboardMetrics.changeVsLastMonth.recovered}
            changeLabel="vs last month"
            icon={<DollarSign className="w-5 h-5 text-green-600" />}
            iconBg="bg-green-50"
            accent="border-green-500"
          />
          <MetricCard
            title="Avg Resolution"
            value={dashboardMetrics.avgResolutionDays}
            change={dashboardMetrics.changeVsLastMonth.avgResolution}
            changeLabel="days improvement"
            suffix="days"
            icon={<Clock className="w-5 h-5 text-purple-500" />}
            iconBg="bg-purple-50"
            accent="border-purple-400"
          />
          <MetricCard
            title="Success Rate"
            value={`${dashboardMetrics.successRate}%`}
            change={dashboardMetrics.changeVsLastMonth.successRate}
            changeLabel="vs last month"
            icon={<TrendingUp className="w-5 h-5 text-maersk-sky" />}
            iconBg="bg-maersk-light"
            accent="border-maersk-sky"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <ClaimsBarChart data={chartData} />
          </div>
          <ClaimsByStatus claims={claims} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <RecoveryAreaChart data={chartData} />
          </div>
          <ClaimsByType claims={claims} />
        </div>

        {/* Recent claims */}
        <RecentClaims claims={recent} />
      </div>
    </div>
  );
}
