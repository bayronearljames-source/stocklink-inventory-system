import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../utils/navConfig';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../utils/constants';
import { Wrench, Shield } from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Filter navigation items by active user role
  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  // Group items by category
  const categories = Array.from(new Set(visibleNavItems.map((item) => item.category)));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
            StockLink
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              v1.0
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Hardware & Tools Dist.</div>
        </div>
      </div>

      {/* Role Scoping Banner */}
      <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
          <Shield className="w-3 h-3 text-slate-400" /> Active Role Scope
        </div>
        <div className="text-xs font-semibold text-white truncate">{ROLE_LABELS[user.role]}</div>
        <div className="text-[11px] text-slate-400 truncate mt-0.5">
          {user.branchName || 'All System Branches'}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {categories.map((category) => (
          <div key={category}>
            <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
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
                          `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
        IM101 Final Project • Group 3
      </div>
    </aside>
  );
};

export default Sidebar;
