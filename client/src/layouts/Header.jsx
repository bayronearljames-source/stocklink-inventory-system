import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../utils/constants';
import { LogOut, User, Building } from 'lucide-react';
import Button from '../components/common/Button';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
