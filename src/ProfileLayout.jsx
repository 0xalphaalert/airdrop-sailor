import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Gift, ListTodo, Zap, 
  TrendingUp, Activity, Settings, LogOut, Menu, X 
} from 'lucide-react';

export default function ProfileLayout() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const navigate = useNavigate();
  
  // Sidebar Toggle State (Defaults to true on desktop)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Sidebar Data State
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [subscription, setSubscription] = useState('Free');

  // Avatar Logic
  const generateAvatar = (address) => {
    if (!address) return 'hsl(0, 0%, 80%)';
    let hash = 0;
    for (let i = 0; i < address.length; i++) { hash = address.charCodeAt(i) + ((hash << 5) - hash); }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchSidebarData();
    }
  }, [ready, authenticated, user]);

  const fetchSidebarData = async () => {
    try {
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('auth_id', user.id).maybeSingle();
      if (!profile) {
        await supabase.from('user_profiles').insert({
          auth_id: user.id, email: user.email?.address, subscription_tier: 'Free'
        });
      } else {
        setSubscription(profile.subscription_tier);
      }

      const { data: pData } = await supabase.from('user_points').select('total_points').eq('auth_id', user.id).maybeSingle();
      if (pData) setPoints(pData.total_points || 0);

      const { data: sData } = await supabase.from('user_checkins').select('streak_count').eq('auth_id', user.id).maybeSingle();
      if (sData) setStreak(sData.streak_count || 0);

      const { count } = await supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('auth_id', user.id);
      setProjectCount(count || 0);

    } catch (error) {
      console.error("Sidebar Data Error:", error);
    }
  };

  // --- SECURITY BARRIER ---
  if (!ready) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-medium">Booting Terminal...</div>;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center max-w-md w-full shadow-lg shadow-slate-200/50">
          <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-sm text-slate-500 font-medium mb-8">Please sign in to access your Command Center.</p>
          <button onClick={login} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-600/20">Sign In</button>
        </div>
      </div>
    );
  }

  // 🚀 MODERNIZED SIDEBAR LINK
  const SidebarLink = ({ to, icon: Icon, label }) => (
    <NavLink 
      to={to}
      onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
      className={({ isActive }) => `
        group flex items-center gap-3 px-4 py-3 mx-3 rounded-xl font-semibold text-sm transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
        }
      `}
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
          {label}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="w-full bg-[#F8FAFC] flex font-sans antialiased text-slate-900 min-h-[calc(100vh-4rem)]">
      
      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- 🚀 THE STICKY MODERN SIDEBAR --- */}
      <aside 
        className={`
          fixed md:sticky top-16 z-50 h-[calc(100vh-4rem)] 
          bg-white border-r border-slate-200 flex flex-col shrink-0 
          shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out overflow-hidden
          ${isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'}
        `}
      >
        <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-[10px] shadow-sm shadow-blue-600/20">AS</div>
            <span className="font-bold text-sm tracking-tight text-slate-900 whitespace-nowrap uppercase">Command Center</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-900 bg-slate-100 p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-6 flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar">
          <SidebarLink to="/profile/overview" label="Overview" icon={LayoutDashboard} />
          <SidebarLink to="/profile/airdrops" label="Airdrops" icon={Gift} />
          <SidebarLink to="/profile/tasks" label="Task Archive" icon={ListTodo} />
          <SidebarLink to="/profile/daily-tasks" label="Action Radar" icon={Zap} />
          <SidebarLink to="/profile/performance" label="Performance" icon={TrendingUp} />
          <SidebarLink to="/profile/onchain-analysis" label="Sybil & On-Chain" icon={Activity} />
          
          <div className="my-2 mx-6 h-px bg-slate-100"></div>
          
          <SidebarLink to="/profile/settings" label="Settings" icon={Settings} />
        </div>

        {/* --- 🚀 MODERN BOTTOM WIDGET --- */}
        <div className="p-4 border-t border-slate-200 space-y-4 shrink-0 bg-slate-50/50">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse" />
                <p className="text-sm font-black text-slate-900 whitespace-nowrap">{points} PTS</p>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100 uppercase tracking-widest whitespace-nowrap">{streak}d Streak</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center gap-3">
               <div style={{ backgroundColor: generateAvatar(user?.wallet?.address) }} className="w-9 h-9 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
               <div className="overflow-hidden">
                 <p className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[110px]">
                   {user?.email?.address?.split('@')[0] || "User"}
                 </p>
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">{subscription}</p>
               </div>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-lg transition-all" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- DYNAMIC MAIN CONTENT WINDOW --- */}
      <div className="flex-1 min-w-0 flex flex-col relative h-[calc(100vh-4rem)] overflow-y-auto">
        
        {/* THE TOGGLE BAR */}
        <div className="w-full h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 sticky top-0 z-30 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-2"
          >
            <Menu className="w-5 h-5" />
            <span className="text-sm font-bold text-slate-700 hidden sm:block">
              {isSidebarOpen ? 'Close Menu' : 'Menu'}
            </span>
          </button>
        </div>

        {/* The Actual Page Content */}
        <div className="flex-1 w-full pb-10">
          <Outlet /> 
        </div>

      </div>

    </div>
  );
}