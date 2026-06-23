export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'documentation_requested'
  | 'carrier_review'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'escalated'
  | 'closed';

export type ClaimType =
  | 'lost'
  | 'damaged'
  | 'late_delivery'
  | 'wrong_delivery'
  | 'missing_items'
  | 'shortage';

export type CarrierName =
  | 'Maersk'
  | 'DHL'
  | 'UPS'
  | 'FedEx'
  | 'CMA CGM'
  | 'MSC'
  | 'Evergreen'
  | 'Hapag-Lloyd';

export type EvidenceType = 'invoice' | 'photo' | 'bill_of_lading' | 'packing_list' | 'survey_report' | 'email' | 'other';

export type UserRole = 'merchant' | 'cx_team' | 'admin';

export interface Merchant {
  id: string;
  merchantCode: string;
  legalName: string;
  displayName: string;
  contactEmail?: string;
  contactPhone?: string;
  billingCurrency: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  merchantIds: string[];
}

export interface ContactInfo {
  name: string;
  email: string;
  company: string;
  phone: string;
  role?: string;
}

export interface ShipmentInfo {
  trackingNumber: string;
  carrierName?: string;
  carrier?: string;
  clientName?: string;
  clientOrderNumber?: string;
  originLocation?: string;
  destinationLocation?: string;
  originZip?: string;
  destinationZip?: string;
  origin?: string;
  destination?: string;
  itemValue?: number;
  insuredValue?: number;
  itemWeight?: string;
  weight?: string;
  shippingCharge?: number;
  currency: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  labelPrintDate?: string;
  lastTrackingEvent?: string;
  lastTrackingEventDate?: string;
  bookingReference?: string;
  service?: string;
  shipDate?: string;
  deliveryDate?: string;
  dimensions?: string;
  commodityType?: string;
  containerNumber?: string;
}

export interface Evidence {
  id: string;
  name: string;
  type: EvidenceType;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'submitted' | 'update' | 'carrier_response' | 'document_request' | 'approved' | 'rejected' | 'note' | 'escalated' | 'closed';
  user?: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  isInternal: boolean;
}

export interface Claim {
  id: string;
  claimNumber: string;
  trackingNumber: string;
  bookingReference?: string;
  carrier: string;
  type: ClaimType;
  status: ClaimStatus;
  claimedAmount: number;
  approvedAmount?: number;
  currency: string;
  filedDate: string;
  incidentDate: string;
  resolutionDate?: string;
  description: string;
  contact: ContactInfo;
  shipment: ShipmentInfo;
  evidence: Evidence[];
  timeline: TimelineEvent[];
  notes: Note[];
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  daysOpen: number;
  slaDeadline: string;
  autoProcessRecommended?: boolean;
  autoProcessReason?: string;
}

export interface DashboardMetrics {
  totalClaims: number;
  activeClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalClaimedAmount: number;
  totalRecoveredAmount: number;
  avgResolutionDays: number;
  successRate: number;
  changeVsLastMonth: {
    totalClaims: number;
    recovered: number;
    successRate: number;
    avgResolution: number;
  };
}

export interface ChartDataPoint {
  month: string;
  filed: number;
  approved: number;
  recovered: number;
}

export interface NewClaimFormData {
  // Step 1 - Contact
  contactName: string;
  contactEmail: string;
  contactCompany: string;
  contactPhone: string;
  contactRole: string;

  // Step 2 - Shipment & Claim
  trackingNumber: string;
  claimType: ClaimType | '';
  commodityType: string;
  description: string;
  quantity: string;
  weight: string;
  unitCost: string;
  claimedAmount: string;
  currency: string;

  // kept for review/legacy compatibility (not shown in wizard)
  bookingReference: string;
  carrier: CarrierName | '';
  service: string;
  origin: string;
  destination: string;
  shipDate: string;
  deliveryDate: string;
  dimensions: string;
  insuredValue: string;
  containerNumber: string;
  incidentDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Step 3 - Evidence
  evidence: File[];
}
