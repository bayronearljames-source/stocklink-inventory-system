import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_COLORS, ROLES } from '../utils/constants';
import { LogOut, UserRound, Building2 } from 'lucide-react';
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
    navigate('/');
  };

  if (!user) return null;

  return (
    <header className="z-10 flex min-h-[72px] shrink-0 items-center justify-between gap-4 border-b border-[#e1e8e3] bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-[#e4ebe6] bg-[#f7f9f7] px-3 py-2">
          <Building2 className="h-4 w-4 shrink-0 text-[#477260]" strokeWidth={1.8} />
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#82938a]">Current location</div>
            <div className="truncate text-xs font-semibold text-[#263b34]">
              {user.branchName || 'Central Warehouse HQ'}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 border-l border-[#e4ebe6] pl-4 xl:flex">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-[#82938a]">Demo role</span>
          {[
            ['admin', ROLES.ADMIN, 'Admin'],
            ['manager', ROLES.MANAGER, 'Manager'],
            ['clerk', ROLES.CLERK, 'Clerk'],
          ].map(([key, role, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleQuickSwitch(key)}
              aria-pressed={user.role === role}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d7d5b] ${
                user.role === role
                  ? 'bg-[#174a38] text-white'
                  : 'text-[#63776d] hover:bg-[#eef4ef] hover:text-[#174a38]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dce7df] bg-[#eaf3ec] text-[#315f49]">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="hidden text-left sm:block">
            <div className="max-w-[160px] truncate text-xs font-semibold leading-tight text-[#263b34]">{user.name}</div>
            <span
              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                ROLE_BADGE_COLORS[user.role] || 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          icon={LogOut}
          className="border-[#e1e8e3] text-[#53675d] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        >
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
