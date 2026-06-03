import { UserRole } from '../types';

export interface PersonaDefinition {
  role: UserRole;
  name: string;
  summary: string;
  capabilities: string[];
}

export const personaDefinitions: PersonaDefinition[] = [
  {
    role: 'merchant',
    name: 'Merchant Claim Filer',
    summary: 'Merchant users can submit and track only their own organization claims.',
    capabilities: [
      'Create claims for shipments belonging to assigned merchant accounts',
      'Upload evidence and respond to documentation requests',
      'View claim status, timeline, and outcomes for own merchants',
      'Cannot view claims from other merchants',
    ],
  },
  {
    role: 'cx_team',
    name: 'CX Operations Team',
    summary: 'CX users can visualize and manage claims across all merchants.',
    capabilities: [
      'View all merchants, shipments, and claims across the platform',
      'Assign claims, update claim status, and add internal notes',
      'Analyze trends and SLA compliance across carriers and merchants',
      'Coordinate with carriers during review and escalation',
    ],
  },
  {
    role: 'admin',
    name: 'Tracking Data Admin',
    summary: 'Admins upload and validate tracking event feeds used to auto-assess claim eligibility.',
    capabilities: [
      'Upload tracking event files and monitor ingestion batches',
      'Correct rejected records and reprocess data uploads',
      'Configure automation rules that recommend carrier claim processing',
      'Maintain carrier integrations and reference data',
    ],
  },
];
