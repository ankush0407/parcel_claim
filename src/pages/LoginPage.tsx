import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Ship, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { fetchUsers } from '../api/client';
import { User } from '../types';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ?? '/';

  const [email, setEmail] = useState('cx.ops@maersk-deliver.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [demoPassword, setDemoPassword] = useState('demo123');

  const grouped = useMemo(() => ({
    merchant: users.filter((u) => u.role === 'merchant'),
    cx_team: users.filter((u) => u.role === 'cx_team'),
    admin: users.filter((u) => u.role === 'admin'),
  }), [users]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetchUsers();
        setUsers(response.users);
        setDemoPassword(response.demoPassword || 'demo123');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load users. Start API with npm run dev:api');
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (!result.ok) {
      setError(result.message ?? 'Unable to login.');
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-maersk-navy via-[#003860] to-maersk-blue flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-white p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-maersk-sky rounded-lg flex items-center justify-center">
              <Ship className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-maersk-navy font-semibold">Maersk Deliver</p>
              <p className="text-xs text-gray-500">Claims Portal</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-maersk-navy">Sign in</h1>
          <p className="text-sm text-gray-500 mt-1">Use demo credentials to test role-based access.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-maersk-blue text-white rounded-lg text-sm font-medium hover:bg-maersk-navy transition-colors"
            >
              Sign in
            </button>
          </form>

          <div className="mt-4 text-xs text-gray-500">
            Demo password for all users: <span className="font-semibold text-maersk-navy">{demoPassword}</span>
          </div>
        </div>

        <div className="bg-maersk-light p-8 md:p-10 border-l border-maersk-sky/20">
          <h2 className="text-lg font-semibold text-maersk-navy mb-3">Demo Personas</h2>
          <p className="text-sm text-gray-600 mb-4">Choose any email below and sign in with the demo password.</p>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Merchant</p>
              {grouped.merchant.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setEmail(u.email)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white transition-colors"
                  type="button"
                >
                  <p className="font-medium text-maersk-navy">{u.fullName}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">CX Team</p>
              {grouped.cx_team.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setEmail(u.email)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white transition-colors"
                  type="button"
                >
                  <p className="font-medium text-maersk-navy">{u.fullName}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Admin</p>
              {grouped.admin.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setEmail(u.email)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white transition-colors"
                  type="button"
                >
                  <p className="font-medium text-maersk-navy">{u.fullName}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
