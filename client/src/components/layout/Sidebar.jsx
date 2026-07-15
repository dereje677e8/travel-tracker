import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileBarChart, History, UserCog, PlaneTakeoff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/athletes', label: 'Athletes', icon: Users },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/activity', label: 'Activity Log', icon: History },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-surface dark:bg-surface-dark">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="rounded-lg bg-primary-600 p-1.5 text-white">
          <PlaneTakeoff size={18} />
        </div>
        <span className="text-sm font-bold tracking-tight text-ink dark:text-ink-dark">Travel Tracker</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        {user?.role === 'administrator' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <UserCog size={18} />
            Users
          </NavLink>
        )}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-4">
        <p className="text-xs text-slate-400">Athlete Travel Tracking System</p>
      </div>
    </aside>
  );
}
