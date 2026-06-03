import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  Ship,
  Upload,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../auth/AuthContext';
import { fetchDashboardData } from '../../api/client';
import { Claim } from '../../types';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true, roles: ['merchant', 'cx_team', 'admin'] },
  { to: '/claims', icon: FileText, label: 'Claims', roles: ['merchant', 'cx_team'] },
  { to: '/claims/new', icon: PlusCircle, label: 'New Claim', roles: ['merchant', 'cx_team'] },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['cx_team', 'admin'] },
  { to: '/admin/tracking', icon: Upload, label: 'Tracking Upload', roles: ['admin'] },
];

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help & Support' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const allowedItems = navItems.filter((item) => user && item.roles.includes(user.role));
  const [statusCounts, setStatusCounts] = useState({ active: 0, pending: 0, escalated: 0 });

  useEffect(() => {
    let isMounted = true;
    async function loadStatusOverview() {
      if (!user) {
        if (isMounted) setStatusCounts({ active: 0, pending: 0, escalated: 0 });
        return;
      }

      try {
        const data = await fetchDashboardData(user.id);
        const claims = data.claims as Claim[];
        const active = claims.filter((c) => !['approved', 'rejected', 'closed'].includes(c.status)).length;
        const pending = claims.filter((c) => ['submitted', 'under_review', 'documentation_requested', 'carrier_review'].includes(c.status)).length;
        const escalated = claims.filter((c) => c.status === 'escalated').length;
        if (isMounted) {
          setStatusCounts({ active, pending, escalated });
        }
      } catch {
        if (isMounted) {
          setStatusCounts({ active: 0, pending: 0, escalated: 0 });
        }
      }
    }

    loadStatusOverview();
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <aside className="w-64 min-h-screen bg-maersk-navy flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-maersk-sky rounded-lg flex items-center justify-center">
          <Ship className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Maersk</p>
          <p className="text-maersk-sky text-xs leading-tight">Claims Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider px-3 mb-2">Main Menu</p>
        <ul className="space-y-0.5">
          {allowedItems.map(({ to, icon: Icon, label, exact }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={exact}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-maersk-sky/20 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={clsx('w-4.5 h-4.5 w-[18px] h-[18px]', isActive ? 'text-maersk-sky' : '')} />
                    {label}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-maersk-sky" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-6 mb-2">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider px-3 mb-2">Status Overview</p>
          <div className="px-3 py-3 bg-white/5 rounded-lg space-y-2">
            {[
              { label: 'Active Claims', count: statusCounts.active, color: 'bg-yellow-400' },
              { label: 'Pending Review', count: statusCounts.pending, color: 'bg-blue-400' },
              { label: 'Escalated', count: statusCounts.escalated, color: 'bg-red-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={clsx('w-2 h-2 rounded-full', color)} />
                  <span className="text-white/60 text-xs">{label}</span>
                </div>
                <span className="text-white text-xs font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}

        {/* User */}
        <button className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg hover:bg-white/10 transition-all">
          <div className="w-8 h-8 rounded-full bg-maersk-sky flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.fullName ?? 'User'}</p>
            <p className="text-white/40 text-[11px] truncate">{user?.role.replace('_', ' ') ?? 'No role'}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-white/40" />
        </button>

        <button
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
