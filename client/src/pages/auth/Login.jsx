import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../../utils/constants';
import { Wrench, Shield, Lock, User, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleMockLogin = (roleKey) => {
    const user = login(roleKey);
    // Navigate based on role
    const redirectPath =
      location.state?.from?.pathname ||
      (user.role === ROLES.ADMIN
        ? '/admin/dashboard'
        : user.role === ROLES.MANAGER
        ? '/manager/dashboard'
        : '/clerk/dashboard');
    navigate(redirectPath, { replace: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Default form submission logs in as Admin
    handleMockLogin('admin');
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-950 mb-3">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">StockLink</h1>
          <p className="text-sm text-slate-400 mt-1">Multi-Branch Hardware & Tools Inventory Distribution</p>
          <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-xs font-semibold border border-slate-700">
            IM101 Finals • Phase 1 Prototype
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-1">Select a role below for instant prototype testing, or enter credentials.</p>
          </div>

          {/* Quick 1-Click Role Login Presets */}
          <div className="space-y-2.5 mb-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Role Presets (Testing)</div>

            <button
              type="button"
              onClick={() => handleMockLogin('admin')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100/80 transition-all text-left group"
            >
              <div>
                <div className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-600" />
                  Central Warehouse Admin
                </div>
                <div className="text-[11px] text-purple-700 mt-0.5">Carlos Mendoza (All Branches, Catalog, Approvals)</div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleMockLogin('manager')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100/80 transition-all text-left group"
            >
              <div>
                <div className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  Branch Manager
                </div>
                <div className="text-[11px] text-blue-700 mt-0.5">Elena Ramos (Quezon City Branch #1)</div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleMockLogin('clerk')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 transition-all text-left group"
            >
              <div>
                <div className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  Branch Staff / Clerk
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Marco Santos (Quezon City Branch #1)</div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">Or enter credentials</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username / Email</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@stocklink.local"
                  className="w-full px-3.5 py-2 pl-10 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 pl-10 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Sign In (Defaults to Admin)
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          PostgreSQL Database Trigger & Stored Procedure Automation Layer
        </p>
      </div>
    </div>
  );
};

export default Login;
