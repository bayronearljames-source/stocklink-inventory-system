import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";
import { Wrench, Lock, User } from "lucide-react";
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

  // Quick login removed for production deployment

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
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access the system.
            </p>
          </div>

          {formError && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          {/* Login Form */}
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
