import { User } from '../types';

export const demoPassword = 'demo123';

export const mockUsers: User[] = [
  {
    id: '12a4da2d-07f9-47a7-9f1e-f3f3ed2f5001',
    email: 'sarah.mitchell@globaltradegroup.com',
    fullName: 'Sarah Mitchell',
    role: 'merchant',
    isActive: true,
    merchantIds: ['8dfc4f97-cfe1-4fa8-b412-c495f58d7b01'],
  },
  {
    id: '12a4da2d-07f9-47a7-9f1e-f3f3ed2f5002',
    email: 'k.weber@europeanautomotive.de',
    fullName: 'Klaus Weber',
    role: 'merchant',
    isActive: true,
    merchantIds: ['8dfc4f97-cfe1-4fa8-b412-c495f58d7b02'],
  },
  {
    id: '12a4da2d-07f9-47a7-9f1e-f3f3ed2f5003',
    email: 'cx.ops@maersk-deliver.com',
    fullName: 'CX Operations Team',
    role: 'cx_team',
    isActive: true,
    merchantIds: [],
  },
  {
    id: '12a4da2d-07f9-47a7-9f1e-f3f3ed2f5004',
    email: 'admin.tracking@maersk-deliver.com',
    fullName: 'Tracking Admin',
    role: 'admin',
    isActive: true,
    merchantIds: [],
  },
];
