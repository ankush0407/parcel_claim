import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ClaimsPage from './pages/ClaimsPage';
import NewClaimPage from './pages/NewClaimPage';
import ClaimDetailPage from './pages/ClaimDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminTrackingPage from './pages/AdminTrackingPage';
import ProtectedRoute from './auth/ProtectedRoute';
import { AuthProvider } from './auth/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />

              <Route element={<ProtectedRoute allowedRoles={['merchant', 'cx_team']} />}>
                <Route path="/claims" element={<ClaimsPage />} />
                <Route path="/claims/new" element={<NewClaimPage />} />
                <Route path="/claims/:id" element={<ClaimDetailPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['cx_team', 'admin']} />}>
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/tracking" element={<AdminTrackingPage />} />
              </Route>

              <Route path="/settings" element={<Navigate to="/" replace />} />
              <Route path="/help" element={<Navigate to="/" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
