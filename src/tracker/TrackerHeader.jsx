import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  CircleDollarSign,
  Flame,
  Gift,
  LayoutGrid,
  ListTodo,
  Search,
  Zap,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const navItems = [
  { to: '/tracker', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { to: '/tracker/airdrops', label: 'Airdrops', icon: Gift },
  { to: '/tracker/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/tracker/daily', label: 'Daily Tasks', icon: CalendarDays },
];

function NavLink({ to, label, icon: Icon, active }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? 'bg-violet-50 text-violet-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {React.createElement(Icon, { className: 'h-4 w-4', 'aria-hidden': true })}
      <span>{label}</span>
      {active && <span className="absolute inset-x-3 -bottom-2 h-0.5 rounded-full bg-violet-600" />}
    </Link>
  );
}

function StatPill({ icon: Icon, iconClassName, value, label }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 shadow-sm">
      <div className="relative">
        {React.createElement(Icon, {
          className: `h-5 w-5 ${iconClassName}`,
          'aria-hidden': true,
        })}
        <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-white" />
      </div>
      <div className="leading-tight">
        <div className="text-[13px] font-bold text-slate-900">{value}</div>
        <div className="whitespace-nowrap text-[9px] font-medium text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function TrackerHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const authenticated = !!user;

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const generateAvatar = (address) => {
    if (!address) return 'hsl(0, 0%, 80%)';
    let hash = 0;
    for (let index = 0; index < address.length; index += 1) {
      hash = address.charCodeAt(index) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Sailor');

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div className="mx-auto mt-4 max-w-[1600px] px-4">
        <div className="flex h-16 items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
          <div className="flex min-w-0 items-center gap-6 xl:gap-10">
            <Link to="/" className="group flex shrink-0 items-center gap-2.5">
              <img
                src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png"
                alt="AirdropSailor"
                className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
              />
              <div className="flex items-center">
                <span className="text-lg font-bold tracking-tight text-slate-900">AirdropSailor</span>
                <span className="ml-2 rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600">
                  Tracker
                </span>
              </div>
            </Link>

            <div className="hidden h-7 w-px bg-slate-200 xl:block" />

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Tracker navigation">
              {navItems.map(({ to, label, icon, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  label={label}
                  icon={icon}
                  active={isActive(to, exact)}
                />
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3 xl:gap-4">
            <div className="relative hidden items-center md:flex">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                aria-label="Search tasks, projects, and articles"
                placeholder="Search tasks, projects, articles..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="h-9 w-52 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-12 text-xs font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white"
              />
              <kbd className="pointer-events-none absolute right-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-sm ring-1 ring-slate-100">
                ⌘K
              </kbd>
              {isSearchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 top-full z-50 mt-2 w-[320px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Suggestions
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
                    >
                      <Search className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      Search tasks for &quot;{searchQuery}&quot;
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
                    >
                      <LayoutGrid className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      Search projects for &quot;{searchQuery}&quot;
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 2xl:flex">
              <StatPill icon={Flame} iconClassName="text-orange-500" value="27" label="Day Streak" />
              <StatPill icon={Zap} iconClassName="text-amber-400" value="1,280" label="Total XP" />
              <StatPill icon={CircleDollarSign} iconClassName="text-yellow-500" value="560" label="SAIL" />
            </div>

            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {authenticated ? (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50 text-xs font-bold text-white shadow-inner"
                  style={{ background: generateAvatar(user?.email) }}
                >
                  {user?.email ? user.email[0].toUpperCase() : 'S'}
                </span>
                <span className="max-w-[100px] truncate text-xs font-semibold text-slate-700">
                  {displayName}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
              >
                Signup/Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
