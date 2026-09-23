import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

// Layouts & Guards
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import MainLayout from '../layouts/MainLayout';

// Public & Error Pages
import Login from '../pages/auth/Login';
import Unauthorized from '../pages/auth/Unauthorized';
import NotFound from '../pages/not-found/NotFound';

// Dashboards
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import ManagerDashboard from '../pages/dashboard/ManagerDashboard';
import ClerkDashboard from '../pages/dashboard/ClerkDashboard';

// Core Pages
import ItemCatalog from '../pages/catalog/ItemCatalog';
import BranchManagement from '../pages/branches/BranchManagement';
import SupplierManagement from '../pages/suppliers/SupplierManagement';
import BranchStock from '../pages/stock/BranchStock';
import RestockRequests from '../pages/restock/RestockRequests';
import StockMovements from '../pages/movements/StockMovements';
import AuditLogs from '../pages/audit/AuditLogs';
import Reports from '../pages/reports/Reports';

// Helper component that redirects "/" to the user's role-specific dashboard
const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === ROLES.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === ROLES.MANAGER) {
    return <Navigate to="/manager/dashboard" replace />;
  }

  if (user.role === ROLES.CLERK) {
    return <Navigate to="/clerk/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes inside Main Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Root Role-Based Landing Redirect */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Admin Only Routes */}
          <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/items" element={<ItemCatalog />} />
            <Route path="/branches" element={<BranchManagement />} />
            <Route path="/suppliers" element={<SupplierManagement />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Branch Manager Only Routes */}
          <Route element={<RoleGuard allowedRoles={[ROLES.MANAGER]} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          </Route>

          {/* Branch Clerk / Staff Only Routes */}
          <Route element={<RoleGuard allowedRoles={[ROLES.CLERK]} />}>
            <Route path="/clerk/dashboard" element={<ClerkDashboard />} />
          </Route>

          {/* Admin & Manager Shared Routes */}
          <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]} />}>
            <Route path="/stock" element={<BranchStock />} />
            <Route path="/restock-requests" element={<RestockRequests />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Manager & Clerk Shared Routes */}
          <Route element={<RoleGuard allowedRoles={[ROLES.CLERK, ROLES.MANAGER]} />}>
            <Route path="/stock-movements" element={<StockMovements />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
