import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";
import { Wrench, Shield, Lock, User, ArrowRight } from "lucide-react";
import Button from "../../components/common/Button";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const redirectForRole = (role) => {
    if (role === ROLES.ADMIN) return "/admin/dashboard";
    if (role === ROLES.MANAGER) return "/manager/dashboard";
    return "/clerk/dashboard";
  };

  // Real login — replaces the old handleMockLogin. Actually awaits the
  // backend call and reads the real user object it resolves to.
  const performLogin = async (loginUsername, loginPassword) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const user = await login(loginUsername, loginPassword);
      navigate(redirectForRole(user.role), { replace: true });
    } catch (err) {
      setFormError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(username, password); // now actually uses what was typed
  };

  // Quick presets for the real seeded test accounts (per team convention,
  // scripts/create-user.js's own usage examples use "Passw0rd!" for these).
  const handleQuickLogin = (quickUsername, quickPassword) => {
    setUsername(quickUsername);
    setPassword(quickPassword);
    performLogin(quickUsername, quickPassword);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-950 mb-3">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            StockLink
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Multi-Branch Hardware & Tools Inventory Distribution
          </p>
          <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-xs font-semibold border border-slate-700">
            IM101 Finals • Phase 1 Prototype
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Quick-login with a seeded test account, or enter credentials
              manually.
            </p>
          </div>

          {formError && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          {/* Quick Login Presets — real accounts, not mock data */}
          <div className="space-y-2.5 mb-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Quick Login (Test Accounts)
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin("admin1", "Passw0rd!")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100/80 transition-all text-left group disabled:opacity-50"
            >
              <div>
                <div className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-600" />
                  Central Warehouse Admin
                </div>
                <div className="text-[11px] text-purple-700 mt-0.5">
                  admin1 — all branches, catalog, approvals
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin("manager1", "Passw0rd!")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100/80 transition-all text-left group disabled:opacity-50"
            >
              <div>
                <div className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  Branch Manager
                </div>
                <div className="text-[11px] text-blue-700 mt-0.5">
                  manager1 — unconfirmed password, may need updating
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin("clerk1", "Passw0rd!")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 transition-all text-left group disabled:opacity-50"
            >
              <div>
                <div className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  Branch Staff / Clerk
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  clerk1 — single branch access
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">
                Or enter credentials
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin1"
                  className="w-full px-3.5 py-2 pl-10 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
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
