import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-xl font-semibold text-maersk-navy">Access denied</h1>
        <p className="text-sm text-gray-500 mt-2">Your current role does not have access to this page.</p>
        <div className="mt-5">
          <Link
            to="/"
            className="inline-flex px-4 py-2 bg-maersk-blue text-white rounded-lg text-sm font-medium hover:bg-maersk-navy transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
