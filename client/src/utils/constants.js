export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CLERK: 'clerk',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Central Warehouse Admin',
  [ROLES.MANAGER]: 'Branch Manager',
  [ROLES.CLERK]: 'Branch Staff / Clerk',
};

export const ROLE_BADGE_COLORS = {
  [ROLES.ADMIN]: 'bg-purple-100 text-purple-800 border-purple-300',
  [ROLES.MANAGER]: 'bg-blue-100 text-blue-800 border-blue-300',
  [ROLES.CLERK]: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export const STORAGE_KEYS = {
  TOKEN: 'stocklink_token',
  USER: 'stocklink_user',
};

// Mock user profiles for quick login testing during development/defense
export const MOCK_USERS = {
  admin: {
    id: 'usr_admin_001',
    name: 'Carlos Mendoza',
    email: 'admin@stocklink.local',
    role: ROLES.ADMIN,
    branchId: null,
    branchName: 'Central Warehouse (HQ)',
  },
  manager: {
    id: 'usr_mgr_002',
    name: 'Elena Ramos',
    email: 'manager.qc@stocklink.local',
    role: ROLES.MANAGER,
    branchId: 'BR-01',
    branchName: 'Quezon City Branch #1',
  },
  clerk: {
    id: 'usr_clk_003',
    name: 'Marco Santos',
    email: 'clerk.qc@stocklink.local',
    role: ROLES.CLERK,
    branchId: 'BR-01',
    branchName: 'Quezon City Branch #1',
  },
};
