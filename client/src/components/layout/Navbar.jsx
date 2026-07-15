import { useState } from 'react';
import { Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar({ title }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-surface dark:bg-surface-dark px-6 py-4">
      <h1 className="text-xl font-bold text-ink dark:text-ink-dark">{title}</h1>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
              {user?.fullName?.[0] || '?'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-ink dark:text-ink-dark">{user?.fullName}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark shadow-lg py-1">
              <p className="px-3 py-1.5 text-xs text-slate-400 capitalize">{user?.role}</p>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-status-action hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
