import { ClaimStatus, ClaimType } from '../types';

export function getStatusLabel(status: ClaimStatus): string {
  const labels: Record<ClaimStatus, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    documentation_requested: 'Docs Requested',
    carrier_review: 'Carrier Review',
    approved: 'Approved',
    partially_approved: 'Partially Approved',
    rejected: 'Rejected',
    escalated: 'Escalated',
    closed: 'Closed',
  };
  return labels[status];
}

export function getStatusColors(status: ClaimStatus): string {
  const colors: Record<ClaimStatus, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    documentation_requested: 'bg-orange-100 text-orange-700',
    carrier_review: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-700',
    partially_approved: 'bg-teal-100 text-teal-700',
    rejected: 'bg-red-100 text-red-700',
    escalated: 'bg-red-100 text-red-700',
    closed: 'bg-gray-100 text-gray-500',
  };
  return colors[status];
}

export function getClaimTypeLabel(type: ClaimType): string {
  const labels: Record<ClaimType, string> = {
    lost: 'Lost Shipment',
    damaged: 'Damaged Goods',
    late_delivery: 'Late Delivery',
    wrong_delivery: 'Wrong Delivery',
    missing_items: 'Missing Items',
    shortage: 'Shortage',
  };
  return labels[type];
}

export function getClaimTypeColors(type: ClaimType): string {
  const colors: Record<ClaimType, string> = {
    lost: 'bg-red-50 text-red-600',
    damaged: 'bg-orange-50 text-orange-600',
    late_delivery: 'bg-yellow-50 text-yellow-600',
    wrong_delivery: 'bg-purple-50 text-purple-600',
    missing_items: 'bg-pink-50 text-pink-600',
    shortage: 'bg-blue-50 text-blue-600',
  };
  return colors[type];
}

export function getPriorityColors(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-500',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    critical: 'bg-red-100 text-red-600',
  };
  return colors[priority] ?? 'bg-gray-100 text-gray-500';
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
