import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  CircleDollarSign,
  Flame,
  Gift,
  LayoutGrid,
  ListTodo,
  Menu,
  Search,
  X,
  Zap,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { calculateStreak, TRACKER_UPDATED_EVENT } from './trackerUtils';

const navItems = [
  { to: '/tracker', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { to: '/tracker/airdrops', label: 'Airdrops', icon: Gift },
  { to: '/tracker/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/tracker/daily', label: 'Daily Tasks', icon: CalendarDays },
];

const EMPTY_STATS = { streak: 0, xp: 0, sail: 0 };
const EMPTY_PROFILE = { avatarUrl: null, username: null, fullName: null };

/** Never let a null/undefined/NaN column break the header layout. */
const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Counts a task's rewards. Recurring tasks bank their reward once per
 * completion, so we lean on `completion_count` when the column is populated.
 */
const rewardMultiplier = (row) => {
  if (!row?.last_completed_at) return 0;
  return Math.max(1, safeNumber(row.completion_count));
};

/**
 * Smoothly tweens a number so the pills animate instead of snapping when a
 * task is completed elsewhere in the app. Falls back to an instant set when
 * the user prefers reduced motion.
 */
function useAnimatedNumber(target, duration = 550) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const frameRef = useRef(null);

  // Keep the ref in step with the rendered value without re-running the tween.
  const commit = useCallback((next) => {
    valueRef.current = next;
    setValue(next);
  }, []);

  useEffect(() => {
    const from = valueRef.current;
    if (from === target) return undefined;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Reduced motion: snap to the value on the next frame (never synchronously
    // inside the effect body, which would trigger a cascading render).
    if (reduceMotion) {
      frameRef.current = requestAnimationFrame(() => commit(target));
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    }

    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3; // easeOutCubic
      commit(Math.round(from + (target - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, commit]);

  return value;
}



function NavLink({ to, label, icon: Icon, active }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${
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

/**
 * Live stat pill. `value` is a raw number so the pill can tween between the
 * previous and the incoming figure whenever another page completes a task.
 */
function StatPill({ icon: Icon, iconClassName, value, label, loading }) {
  const animated = useAnimatedNumber(safeNumber(value));

  return (
    <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 shadow-sm transition-shadow duration-150 hover:shadow-md">
      <div className="relative">
        {React.createElement(Icon, {
          className: `h-5 w-5 ${iconClassName}`,
          'aria-hidden': true,
        })}
        <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      </div>
      <div className="leading-tight">
        {loading ? (
          <div className="h-3 w-10 animate-pulse rounded bg-slate-200" />
        ) : (
          <div
            className="text-[13px] font-bold tabular-nums text-slate-900"
            aria-live="polite"
          >
            {animated.toLocaleString()}
          </div>
        )}
        <div className="whitespace-nowrap text-[9px] font-medium text-slate-500">{label}</div>
      </div>
    </div>
  );
}


export default function TrackerHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUser(data?.user || null))
      .catch(() => setUser(null));

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /**
   * Loads the live stats (streak / XP / SAIL) plus the profile bits the header
   * renders. Every branch is defensive: a missing row, an RLS rejection or a
   * dropped connection resolves to zeros instead of leaving the pills stuck in
   * their skeleton state.
   *
   * @param {object|null} currentUser supabase auth user
   * @param {boolean} silent          background refresh (keeps the last value
   *                                  on screen instead of flashing skeletons)
   */
  const loadStats = useCallback(async (currentUser, { silent = false } = {}) => {
    if (!currentUser) {
      setStats(EMPTY_STATS);
      setProfile(EMPTY_PROFILE);
      setStatsLoading(false);
      return;
    }

    if (!silent) setStatsLoading(true);

    try {
      // `Promise.allSettled` keeps one failing table from nuking the others.
      const [projectResult, customResult, profileResult] = await Promise.allSettled([
        supabase
          .from('tracker_user_tasks')
          .select('last_completed_at, status, completion_count, sail_reward, tasks (xp, sail, sail_reward)')
          .eq('auth_id', currentUser.id),
        supabase
          .from('tracker_custom_tasks')
          .select('last_completed_at, status, completion_count, xp, sail, sail_reward')
          .eq('auth_id', currentUser.id),
        supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_id', currentUser.id)
          .maybeSingle(),
      ]);

      const projectRows =
        projectResult.status === 'fulfilled' ? projectResult.value?.data || [] : [];
      const customRows =
        customResult.status === 'fulfilled' ? customResult.value?.data || [] : [];
      const profileRow =
        profileResult.status === 'fulfilled' ? profileResult.value?.data || {} : {};

      if (projectResult.status === 'fulfilled' && projectResult.value?.error) {
        console.warn('Tracker header: project tasks unavailable —', projectResult.value.error.message);
      }
      if (customResult.status === 'fulfilled' && customResult.value?.error) {
        console.warn('Tracker header: personal tasks unavailable —', customResult.value.error.message);
      }

      const allRows = [...projectRows, ...customRows];

      // Streak: one active day per calendar day, across both task sources.
      const streak = calculateStreak(allRows.map((row) => row.last_completed_at));

      // Rewards actually banked by completing tracker tasks.
      const earnedXp = allRows.reduce(
        (sum, row) => sum + safeNumber(row.tasks?.xp ?? row.xp) * rewardMultiplier(row),
        0,
      );
      const earnedSail = allRows.reduce(
        (sum, row) =>
          sum +
          safeNumber(row.tasks?.sail ?? row.tasks?.sail_reward ?? row.sail ?? row.sail_reward) *
            rewardMultiplier(row),
        0,
      );

      // The profile columns are the ledger balance; the derived totals update
      // the instant a task is completed. Showing the larger of the two keeps
      // the pills truthful *and* instantly responsive.
      const profileXp = safeNumber(profileRow?.tracker_xp ?? profileRow?.xp_balance);
      const profileSail = safeNumber(profileRow?.sail_balance ?? profileRow?.lifetime_xp);

      if (!mountedRef.current) return;

      setStats({
        streak,
        xp: Math.max(profileXp, earnedXp),
        sail: Math.max(profileSail, earnedSail),
      });

      const twitterHandle = profileRow?.twitter_handle?.replace('@', '') || null;
      setProfile({
        avatarUrl:
          profileRow?.avatar_url ||
          profileRow?.profile_picture_url ||
          (twitterHandle ? `https://unavatar.io/twitter/${twitterHandle}` : null),
        username: profileRow?.username || twitterHandle || null,
        fullName: profileRow?.full_name || null,
      });
    } catch (error) {
      // Network glitch / offline: default safely instead of breaking layout.
      console.error('Unable to load tracker header stats:', error);
      if (mountedRef.current) setStats(EMPTY_STATS);
    } finally {
      if (mountedRef.current) setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred a tick so the initial paint isn't blocked by the fetch's
    // loading flag (and so the effect body stays free of sync setState).
    const timeout = window.setTimeout(() => loadStats(user), 0);
    return () => window.clearTimeout(timeout);
  }, [user, loadStats]);

  /* ------------------------------------------------------------------ */
  /* Live sync: Supabase Realtime + in-app events + tab focus            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!user?.id) return undefined;

    let timeout = null;
    // Coalesce bursts (a completion writes several rows) into one refetch.
    const refresh = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => loadStats(user, { silent: true }), 150);
    };

    // 1. Same-tab updates dispatched by TrackerTasks / TrackerDaily.
    window.addEventListener(TRACKER_UPDATED_EVENT, refresh);

    // 2. Coming back to the tab (or another device wrote while we were away).
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);

    // 3. Supabase Realtime so other tabs/devices stay in sync too.
    let channel = null;
    try {
      channel = supabase
        .channel(`tracker-header-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tracker_user_tasks',
            filter: `auth_id=eq.${user.id}`,
          },
          refresh,
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tracker_custom_tasks',
            filter: `auth_id=eq.${user.id}`,
          },
          refresh,
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_profiles',
            filter: `auth_id=eq.${user.id}`,
          },
          refresh,
        )
        .subscribe();
    } catch (error) {
      // Realtime may be disabled on the project — the event bus still works.
      console.warn('Tracker header realtime unavailable:', error?.message || error);
    }

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener(TRACKER_UPDATED_EVENT, refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, loadStats]);


  /* ---- Global ⌘K / Ctrl+K to focus search ---- */
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (key === 'escape') {
        setMobileMenuOpen(false);
        if (document.activeElement === searchRef.current) searchRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ---- Close the mobile drawer whenever the route changes ---- */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const authenticated = !!user;

  const isActive = useCallback(
    (to, exact) => (exact ? location.pathname === to : location.pathname.startsWith(to)),
    [location.pathname],
  );

  const generateAvatar = (address) => {
    if (!address) return 'hsl(0, 0%, 80%)';
    let hash = 0;
    for (let index = 0; index < address.length; index += 1) {
      hash = address.charCodeAt(index) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  /** username ➔ full_name ➔ email prefix ➔ 'Sailor' (profile row wins). */
  const displayName = useMemo(
    () =>
      profile.username ||
      user?.user_metadata?.username ||
      profile.fullName ||
      user?.user_metadata?.full_name ||
      (user?.email ? user.email.split('@')[0] : 'Sailor'),
    [profile.username, profile.fullName, user],
  );

  const avatarUrl = profile.avatarUrl || user?.user_metadata?.avatar_url || null;

  /** Seed the generated colour on whatever identifier we actually have. */
  const avatarSeed = profile.username || user?.email || user?.id || '';
  const avatarInitial = (displayName || 'S').trim()[0]?.toUpperCase() || 'S';

  /**
   * A broken remote avatar falls back to the generated colour tile. Storing the
   * failed URL (rather than a boolean) means a new avatar is retried
   * automatically without needing a reset effect.
   */
  const [failedAvatarUrl, setFailedAvatarUrl] = useState(null);
  const avatarFailed = !!avatarUrl && failedAvatarUrl === avatarUrl;


  return (
    <header className="sticky top-0 z-50 w-full bg-transparent font-sans">
      <div className="mx-auto mt-4 max-w-[1600px] px-4">
        <div className="flex h-16 items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
          <div className="flex min-w-0 items-center gap-4 xl:gap-10">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-150 hover:bg-violet-50 hover:text-violet-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <Link to="/" className="group flex shrink-0 items-center gap-2.5">
              <img
                src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png"
                alt="AirdropSailor"
                className="h-8 w-8 object-contain transition-transform duration-150 group-hover:scale-105"
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
                ref={searchRef}
                type="search"
                aria-label="Search tasks, projects, and articles"
                placeholder="Search tasks, projects, articles..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="h-9 w-52 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-12 text-xs font-medium text-slate-700 outline-none transition duration-150 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
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
                      onClick={() => navigate('/tracker/tasks')}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-semibold text-slate-600 transition duration-150 hover:bg-violet-50 hover:text-violet-600"
                    >
                      <Search className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      Search tasks for &quot;{searchQuery}&quot;
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/tracker/airdrops')}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-semibold text-slate-600 transition duration-150 hover:bg-violet-50 hover:text-violet-600"
                    >
                      <LayoutGrid className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      Search projects for &quot;{searchQuery}&quot;
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 2xl:flex">
              <StatPill
                icon={Flame}
                iconClassName="text-amber-500"
                value={stats.streak}
                label="Day Streak"
                loading={statsLoading}
              />
              <StatPill
                icon={Zap}
                iconClassName="text-violet-600"
                value={stats.xp}
                label="Total XP"
                loading={statsLoading}
              />
              <StatPill
                icon={CircleDollarSign}
                iconClassName="text-emerald-600"
                value={stats.sail}
                label="SAIL"
                loading={statsLoading}
              />
            </div>

            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-150 hover:bg-violet-50 hover:text-violet-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {authenticated ? (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3">
                {avatarUrl && !avatarFailed ? (
                  <img
                    src={avatarUrl}
                    alt={`${displayName} avatar`}
                    onError={() => setFailedAvatarUrl(avatarUrl)}
                    className="h-7 w-7 rounded-full border border-white/50 object-cover shadow-inner"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50 text-xs font-bold text-white shadow-inner"
                    style={{ background: generateAvatar(avatarSeed) }}
                  >
                    {avatarInitial}
                  </span>
                )}
                <span className="hidden max-w-[100px] truncate text-xs font-semibold text-slate-700 sm:block">
                  {displayName}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors duration-150 hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
              >
                Signup/Login
              </button>
            )}
          </div>
        </div>

        {/* ─── Mobile navigation drawer (below lg) ─── */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-0 z-40 cursor-default bg-slate-950/20 backdrop-blur-[1px]"
            />
            <nav
              aria-label="Mobile tracker navigation"
              className="relative z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
            >
              <div className="flex flex-col gap-1">
                {navItems.map(({ to, label, icon, exact }) => {
                  const active = isActive(to, exact);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors duration-150 ${
                        active
                          ? 'bg-violet-50 text-violet-600'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {React.createElement(icon, { className: 'h-4 w-4', 'aria-hidden': true })}
                      {label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 2xl:hidden">
                <StatPill
                  icon={Flame}
                  iconClassName="text-amber-500"
                  value={stats.streak}
                  label="Day Streak"
                  loading={statsLoading}
                />
                <StatPill
                  icon={Zap}
                  iconClassName="text-violet-600"
                  value={stats.xp}
                  label="Total XP"
                  loading={statsLoading}
                />
                <StatPill
                  icon={CircleDollarSign}
                  iconClassName="text-emerald-600"
                  value={stats.sail}
                  label="SAIL"
                  loading={statsLoading}
                />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
