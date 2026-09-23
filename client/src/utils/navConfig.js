import {
  LayoutDashboard,
  Package,
  Building2,
  Truck,
  Boxes,
  ClipboardList,
  ArrowLeftRight,
  ShieldCheck,
  FileBarChart,
} from 'lucide-react';
import { ROLES } from './constants';

export const NAV_ITEMS = [
  // Dashboards (Role-specific)
  {
    id: 'admin-dashboard',
    label: 'Central Dashboard',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN],
    category: 'Overview',
  },
  {
    id: 'manager-dashboard',
    label: 'Branch Dashboard',
    path: '/manager/dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.MANAGER],
    category: 'Overview',
  },
  {
    id: 'clerk-dashboard',
    label: 'Staff Dashboard',
    path: '/clerk/dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.CLERK],
    category: 'Overview',
  },

  // Inventory & Stock Operations
  {
    id: 'items',
    label: 'Master Catalog',
    path: '/items',
    icon: Package,
    roles: [ROLES.ADMIN],
    category: 'Catalog & Stock',
  },
  {
    id: 'stock',
    label: 'Branch Stock Levels',
    path: '/stock',
    icon: Boxes,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
    category: 'Catalog & Stock',
  },
  {
    id: 'stock-movements',
    label: 'Stock Movements',
    path: '/stock-movements',
    icon: ArrowLeftRight,
    roles: [ROLES.CLERK, ROLES.MANAGER],
    category: 'Operations',
  },
  {
    id: 'restock-requests',
    label: 'Restock Queue',
    path: '/restock-requests',
    icon: ClipboardList,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
    category: 'Operations',
  },

  // System Administration & Data
  {
    id: 'branches',
    label: 'Branch Locations',
    path: '/branches',
    icon: Building2,
    roles: [ROLES.ADMIN],
    category: 'Administration',
  },
  {
    id: 'suppliers',
    label: 'Suppliers & Pricing',
    path: '/suppliers',
    icon: Truck,
    roles: [ROLES.ADMIN],
    category: 'Administration',
  },
  {
    id: 'audit-logs',
    label: 'Database Audit Logs',
    path: '/audit-logs',
    icon: ShieldCheck,
    roles: [ROLES.ADMIN],
    category: 'System',
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    path: '/reports',
    icon: FileBarChart,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
    category: 'System',
  },
];
