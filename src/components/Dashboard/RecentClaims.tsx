import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Claim } from '../../types';
import { getStatusColors, getStatusLabel, getClaimTypeLabel, formatCurrency, formatDate } from '../../utils/helpers';
import clsx from 'clsx';

interface RecentClaimsProps {
  claims: Claim[];
}

export default function RecentClaims({ claims }: RecentClaimsProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div>
          <h3 className="font-semibold text-maersk-navy text-sm">Recent Claims</h3>
          <p className="text-xs text-gray-400 mt-0.5">Latest activity across all claims</p>
        </div>
        <button
          onClick={() => navigate('/claims')}
          className="text-xs text-maersk-blue hover:text-maersk-navy font-medium flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {claims.map((claim) => (
          <button
            key={claim.id}
            onClick={() => navigate(`/claims/${claim.id}`)}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors text-left"
          >
            {/* Claim type icon */}
            <div className="w-9 h-9 rounded-lg bg-maersk-light flex items-center justify-center flex-shrink-0">
              <span className="text-maersk-navy text-xs font-bold">
                {claim.type === 'lost' ? '⚠' : claim.type === 'damaged' ? '📦' : '⏱'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-maersk-navy">{claim.claimNumber}</p>
                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', getStatusColors(claim.status))}>
                  {getStatusLabel(claim.status)}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">
                {claim.carrier} · {getClaimTypeLabel(claim.type)} · {claim.contact.company}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-maersk-navy">
                {formatCurrency(claim.claimedAmount, claim.currency)}
              </p>
              <p className="text-xs text-gray-400">{formatDate(claim.filedDate)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
