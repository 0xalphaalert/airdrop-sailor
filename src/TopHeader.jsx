import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from './supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, ChevronDown, ListTodo, Search, 
  LogOut, Zap, TrendingDown, LayoutDashboard, User,
  Loader2, FileText, CheckCircle2, ShieldCheck, Flame, Coins, LayoutGrid
} from 'lucide-react';

// Predefined static app pages for quick navigation
const APP_PAGES = [
  { name: 'Airdrop Radar Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
  { name: 'Fundraising & Investors', path: '/fundraising', icon: <Coins size={16} /> },
  { name: 'Active Sprints', path: '/sprints', icon: <Zap size={16} /> },
  { name: 'Points Arena', path: '/subscription', icon: <Flame size={16} /> },
  { name: 'Chains Hub', path: '/chains', icon: <LayoutGrid size={16} /> },
  { name: 'Sybil Scanner', path: '/scanner', icon: <ShieldCheck size={16} /> },
  { name: 'Tracker Overview', path: '/tracker/overview', icon: <LayoutDashboard size={16} /> },
  { name: 'My Daily Tasks', path: '/tracker/daily', icon: <ListTodo size={16} /> },
  { name: 'My Profile & Settings', path: '/profile', icon: <User size={16} /> },
  { name: 'SAIL Rewards', path: '/xp-levels', icon: <Zap size={16} /> }
];

export default function TopHeader() {
  const { ready, authenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profilePic, setProfilePic] = useState(null);
  const [lifetimeXP, setLifetimeXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [dbUsername, setDbUsername] = useState(null); 
  
  // Dropdown & Notification States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ pages: [], projects: [], tasks: [] });
  
  // Refs
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchHeaderData();
      fetchNotifications();
    }
  }, [ready, authenticated, user]);

  // Handle clicking outside of dropdowns and search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) setIsSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl + K or Cmd + K) to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (searchQuery.trim().length > 0) setIsSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // Debounced Search Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults({ pages: [], projects: [], tasks: [] });
        setIsSearching(false);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setIsSearching(true);
    const searchTerm = `%${query}%`;

    try {
      // 1. Search local app pages
      const matchedPages = APP_PAGES.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3);

      // 2. Search projects in Supabase
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, logo_url, slug, status')
        .ilike('name', searchTerm)
        .limit(4);

      // 3. Search tasks in Supabase (and join project slug to allow linking)
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, name, task_category, projects!inner(slug)')
        .ilike('name', searchTerm)
        .limit(4);

      setSearchResults({
        pages: matchedPages,
        projects: projectsData || [],
        tasks: tasksData || []
      });
      setIsSearchOpen(true);
    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchHeaderData = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('lifetime_xp, profile_picture_url, username, twitter_handle')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profile) {
        setLifetimeXP(profile.lifetime_xp || 0);
        setProfilePic(profile.profile_picture_url || null);
        setUserLevel(Math.floor((profile.lifetime_xp || 0) / 1000) + 1);
        setDbUsername(profile.twitter_handle || profile.username || null); 
      }
    } catch (error) {
      console.error("Error fetching header data:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: ledgerData } = await supabase
        .from('xp_ledger')
        .select('id, amount, action_type, created_at')
        .eq('auth_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ledgerData) setNotifications(ledgerData);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Safely resolve display name
  const getUsername = () => {
    if (!user) return 'Sailor';
    const emailString = typeof user?.email === 'string' ? user.email : '';
    if (emailString) return emailString.split('@')[0];
    const wallet = user.wallet?.address;
    if (wallet) return wallet.slice(0, 5) + '...' + wallet.slice(-4);
    return 'Sailor';
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `Just now`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleResultClick = (path) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const hasResults = searchResults.pages.length > 0 || searchResults.projects.length > 0 || searchResults.tasks.length > 0;

  if (!ready || !authenticated) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#E8EDF5] shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px] gap-8">
          
          {/* 1. LOGO BRANDING (Hidden on Desktop because of Sidebar) */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group lg:hidden">
            <div className="w-10 h-10 flex items-center justify-center bg-[#2563EB] rounded-[12px] shadow-sm group-hover:scale-105 transition-transform">
              <img 
                src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
                alt="AirdropSailor" 
                className="w-6 h-6 object-contain brightness-0 invert" 
              />
            </div>
            <span className="font-black text-[20px] text-[#0F172A] tracking-tight">AirdropSailor</span>
          </Link>

          {/* 2. GLOBAL SEARCH BAR */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-[600px] mx-auto relative z-50">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Search className="h-4 w-4 text-blue-500" strokeWidth={2.5} />
                )}
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length >= 2) setIsSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setIsSearchOpen(true);
                }}
                placeholder="Search projects, tasks, or guides..."
                className={`block w-full pl-11 pr-16 py-2.5 bg-slate-50/80 border text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ${isSearchOpen && hasResults ? 'border-blue-200 rounded-t-2xl rounded-b-none' : 'border-slate-100 rounded-full'}`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-1 rounded-[6px] tracking-wide">
                  Ctrl K
                </span>
              </div>
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {isSearchOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 w-full bg-white border border-t-0 border-blue-200 rounded-b-2xl shadow-[0_12px_32px_rgba(15,23,42,0.1)] overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                
                {!isSearching && !hasResults && (
                  <div className="p-6 text-center text-sm font-medium text-slate-500">
                    No results found for "{searchQuery}"
                  </div>
                )}

                {/* PAGES MATCHES */}
                {searchResults.pages.length > 0 && (
                  <div className="pt-2">
                    <div className="px-4 py-1.5 bg-slate-50/50 border-y border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Pages & Tools
                    </div>
                    {searchResults.pages.map((page, idx) => (
                      <button 
                        key={`page-${idx}`} 
                        onClick={() => handleResultClick(page.path)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          {page.icon}
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 group-hover:text-blue-700">{page.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* PROJECTS MATCHES */}
                {searchResults.projects.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-slate-50/50 border-y border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Projects
                    </div>
                    {searchResults.projects.map(project => (
                      <button 
                        key={project.id} 
                        onClick={() => handleResultClick(`/${project.slug || project.id}/airdropguide`)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors group"
                      >
                        <img 
                          src={project.logo_url} 
                          alt="" 
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-white"
                        />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-900 group-hover:text-blue-700">{project.name}</span>
                          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{project.status || 'Active'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* TASKS MATCHES */}
                {searchResults.tasks.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-slate-50/50 border-y border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Tasks & Quests
                    </div>
                    {searchResults.tasks.map(task => {
                      const slug = task.projects?.slug;
                      const linkPath = slug ? `/${slug}/airdropguide` : '/tracker/tasks';
                      
                      return (
                        <button 
                          key={task.id} 
                          onClick={() => handleResultClick(linkPath)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center">
                            <CheckCircle2 size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-900 group-hover:text-blue-700 line-clamp-1">{task.name}</span>
                            <span className="text-[10px] font-medium text-slate-500">{task.task_category || 'General Task'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* 3. RIGHT CONTROLS */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* SAIL Balance Pill */}
            <Link 
              to="/xp-levels" 
              className="hidden lg:flex items-center gap-3 pl-1.5 pr-4 py-1.5 border border-[#E8EDF5] rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#2563EB] flex items-center justify-center font-black text-[14px]">
                $
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                  SAIL Balance
                </span>
                <span className="text-[13px] font-black text-[#0F172A] leading-none">
                  {lifetimeXP.toLocaleString()}
                </span>
              </div>
            </Link>

            {/* Notification Bell Dropdown */}
            <div ref={notifRef} className="relative">
              <button 
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                className={`relative w-10 h-10 border rounded-full flex items-center justify-center transition-colors shadow-[0_2px_8px_rgba(15,23,42,0.03)] shrink-0 ${
                  isNotifOpen ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-white border-[#E8EDF5] text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Bell size={18} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900">Recent Activity</h3>
                  </div>
                  
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500 font-medium">No recent activity found.</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {notifications.map(notif => (
                          <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.amount > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                              {notif.amount > 0 ? <Zap className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{notif.action_type}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{timeAgo(notif.created_at)}</p>
                            </div>
                            
                            <div className={`font-black text-sm shrink-0 ${notif.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {notif.amount > 0 ? '+' : ''}{notif.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                    <Link to="/xp-levels" onClick={() => setIsNotifOpen(false)} className="text-xs font-bold text-blue-600 hover:text-blue-700">View Full History</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button 
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                className={`flex items-center gap-3 pl-1.5 pr-3 py-1.5 border rounded-full shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-all group ${
                  isProfileOpen ? 'bg-slate-50 border-blue-200' : 'bg-white border-[#E8EDF5] hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Circular Avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0 relative overflow-hidden shadow-inner">
                  {(() => {
                    const cleanHandle = dbUsername ? dbUsername.replace('@', '').trim() : null;
                    const avatarSrc = profilePic || (cleanHandle ? `https://unavatar.io/twitter/${cleanHandle}` : null);
                    const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${dbUsername || getUsername()}`;

                    if (avatarSrc) {
                      return (
                        <img 
                          src={avatarSrc} 
                          alt="avatar" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = fallbackUrl; 
                          }}
                        />
                      );
                    }
                    return <span>{(dbUsername || getUsername())[0].toUpperCase()}</span>;
                  })()}
                </div>
                
                <div className="flex flex-col items-start justify-center hidden sm:flex">
                  <span className="text-[13px] font-bold text-[#0F172A] leading-none mb-0.5 group-hover:text-blue-600 transition-colors">
                    {dbUsername || getUsername()}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 leading-none">
                    Level {userLevel}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 ml-1 hidden sm:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 py-2">
                  
                  <div className="px-5 py-2 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Account</p>
                  </div>
                  
                  <Link 
                    to="/tracker/overview" 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" /> Tracker Dashboard
                  </Link>
                  
                  <Link 
                    to="/tracker/daily" 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <ListTodo className="w-4 h-4 text-slate-400" /> Daily Tasks
                  </Link>

                  <Link 
                    to="/xp-levels" 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <Zap className="w-4 h-4 text-slate-400" /> SAIL
                  </Link>

                  <Link 
                    to="/profile" 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" /> Profile
                  </Link>
                  
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <button 
                      onClick={() => { setIsProfileOpen(false); logout(); }} 
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-[14px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                  
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}