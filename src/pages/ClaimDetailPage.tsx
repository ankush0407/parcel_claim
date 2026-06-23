import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClaimDetail from '../components/ClaimDetail/ClaimDetail';
import Header from '../components/Layout/Header';
import { fetchClaimById } from '../api/client';
import { Claim } from '../types';
import { PageError, PageLoading } from '../components/Common/PageState';
import { useAuth } from '../auth/AuthContext';

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id || !user) {
      setLoading(false);
      setError('Claim context is missing.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await fetchClaimById(id, user.id);
      setClaim(data.claim);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load claim details.');
      setClaim(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} onRetry={load} />;
  }

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-400 text-sm mb-3">Claim not found.</p>
        <button
          onClick={() => navigate('/claims')}
          className="text-maersk-blue text-sm hover:underline"
        >
          Return to Claims
        </button>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={claim.claimNumber}
        subtitle={`${claim.carrier} · ${claim.type.replace('_', ' ')} · Filed ${new Date(claim.filedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
      />
      <div className="px-4 md:px-8 py-4 md:py-6">
        <ClaimDetail claim={claim} />
      </div>
    </div>
  );
}
