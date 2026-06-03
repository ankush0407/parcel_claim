import clsx from 'clsx';
import { ClaimStatus, ClaimType } from '../../types';
import { getStatusColors, getStatusLabel, getClaimTypeColors, getClaimTypeLabel } from '../../utils/helpers';

interface StatusBadgeProps {
  status: ClaimStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center font-medium rounded-full',
      getStatusColors(status),
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1',
    )}>
      {getStatusLabel(status)}
    </span>
  );
}

interface TypeBadgeProps {
  type: ClaimType;
  size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center font-medium rounded-full',
      getClaimTypeColors(type),
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1',
    )}>
      {getClaimTypeLabel(type)}
    </span>
  );
}

interface PriorityDotProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export function PriorityDot({ priority }: PriorityDotProps) {
  const colors = {
    low: 'bg-gray-300',
    medium: 'bg-blue-400',
    high: 'bg-orange-400',
    critical: 'bg-red-500 animate-pulse',
  };
  return (
    <span
      className={clsx('w-2 h-2 rounded-full inline-block', colors[priority])}
      title={priority.charAt(0).toUpperCase() + priority.slice(1) + ' priority'}
    />
  );
}
