import { ChartDataPoint, Claim, DashboardMetrics, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface DashboardResponse {
  claims: Claim[];
  dashboardMetrics: DashboardMetrics;
  chartData: ChartDataPoint[];
}

export interface AnalyticsResponse {
  claims: Claim[];
  chartData: ChartDataPoint[];
}

export interface ClaimsResponse {
  claims: Claim[];
  merchantCompanies: string[];
}

export async function fetchDashboardData(userId: string, merchantCompany?: string) {
  const params = new URLSearchParams({ userId });
  if (merchantCompany) params.set('merchantCompany', merchantCompany);
  return request<DashboardResponse>(`/api/dashboard?${params.toString()}`);
}

export async function fetchAnalyticsData(userId: string, merchantCompany?: string) {
  const params = new URLSearchParams({ userId });
  if (merchantCompany) params.set('merchantCompany', merchantCompany);
  return request<AnalyticsResponse>(`/api/analytics?${params.toString()}`);
}

export async function fetchClaims(userId: string, merchantCompany?: string) {
  const params = new URLSearchParams({ userId });
  if (merchantCompany) params.set('merchantCompany', merchantCompany);
  return request<ClaimsResponse>(`/api/claims?${params.toString()}`);
}

export async function fetchClaimById(id: string, userId: string) {
  return request<{ claim: Claim }>(`/api/claims/${id}?userId=${encodeURIComponent(userId)}`);
}

export async function fetchUsers() {
  return request<{ users: User[]; demoPassword: string }>('/api/users');
}

export async function loginApi(email: string, password: string) {
  return request<{ ok: boolean; user?: User; message?: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export interface MerchantProfile {
  id: string;
  code: string;
  legalName: string;
  displayName: string;
  contactEmail: string;
  contactPhone: string;
  billingCurrency: string;
  isActive: boolean;
}

export async function fetchMerchantById(merchantId: string) {
  return request<{ merchant: MerchantProfile }>(`/api/merchants/${encodeURIComponent(merchantId)}`);
}

export interface SubmitClaimPayload {
  userId: string;
  trackingNumber: string;
  claimType: string;
  description: string;
  claimedAmount: string;
  currency: string;
  priority: string;
}

export interface SubmitClaimResponse {
  ok: boolean;
  claimId: string;
  claimNumber: string;
  autoProcessRecommended: boolean;
  autoProcessReason: string;
  shipmentFound: boolean;
}

export async function submitClaim(payload: SubmitClaimPayload) {
  return request<SubmitClaimResponse>('/api/claims', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface ProcessClaimsQueueResponse {
  ok: boolean;
  message: string;
  processed: number;
  approved: number;
  rejected: number;
  exception: number;
}

export async function processClaimsQueue(userId: string) {
  return request<ProcessClaimsQueueResponse>('/api/claims/process', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}
