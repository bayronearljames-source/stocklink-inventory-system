import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_COLORS, ROLES } from '../utils/constants';
import { LogOut, User, Building, ShieldAlert } from 'lucide-react';
import Button from '../components/common/Button';

export const Header = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickSwitch = (roleKey) => {
    switchRole(roleKey);
    // Redirect to root so RoleBasedRedirect automatically sends them to their proper dashboard
    navigate('/');
  };

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0">
      {/* Left: Branch Scoping Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Building className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-800">{user.branchName || 'Central Warehouse HQ'}</span>
        </div>

        {/* Quick Role Switcher (Convenient for Defense & Grading Demonstration) */}
        <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-200">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Demo Switch:</span>
          <button
            onClick={() => handleQuickSwitch('admin')}
            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
              user.role === ROLES.ADMIN ? 'bg-purple-600 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => handleQuickSwitch('manager')}
            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
              user.role === ROLES.MANAGER ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Manager
          </button>
          <button
            onClick={() => handleQuickSwitch('clerk')}
            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
              user.role === ROLES.CLERK ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Clerk
          </button>
        </div>
      </div>

      {/* Right: User Profile & Logout */}
      <div className="flex items-center gap-4">
        {/* User Tag */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-none">{user.name}</div>
            <div className="mt-1">
              <span
                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  ROLE_BADGE_COLORS[user.role] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          icon={LogOut}
          className="text-slate-600 hover:text-rose-600 hover:border-rose-300"
        >
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Header;
