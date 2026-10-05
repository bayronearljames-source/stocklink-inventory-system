import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../utils/navConfig';
import { ROLE_LABELS } from '../utils/constants';
import { Boxes, ShieldCheck } from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null;

  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const categories = Array.from(new Set(visibleNavItems.map((item) => item.category)));

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[#263d37] bg-[#142923] text-slate-300">
      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8eee0] text-[#174a38] shadow-sm">
          <Boxes className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold tracking-tight text-white">StockLink</span>
            <span className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b5d5c2]">
              Ops
            </span>
          </div>
          <div className="mt-0.5 truncate text-[11px] font-medium text-[#a5b9b1]">
            Hardware &amp; Tools Distribution
          </div>
        </div>
      </div>

      <div className="mx-3 mt-5 rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-3">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a5b9b1]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#a9d4b7]" />
          Signed in as
        </div>
        <div className="truncate text-sm font-semibold text-white">{ROLE_LABELS[user.role]}</div>
        <div className="mt-1 truncate text-xs text-[#a5b9b1]">
          {user.branchName || 'All system branches'}
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {categories.map((category) => (
          <div key={category}>
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#789188]">
              {category}
            </div>
            <ul className="space-y-1">
              {visibleNavItems
                .filter((item) => item.category === category)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                            isActive
                              ? 'bg-[#d8eee0] font-semibold text-[#174a38] shadow-sm'
                              : 'font-medium text-[#bdcdc6] hover:bg-white/[0.07] hover:text-white'
                          }`
                        }
                      >
                        <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center justify-between text-[10px] font-medium text-[#91a79e]">
          <span>IM101 · Group 3</span>
          <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] uppercase tracking-wider">v1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
