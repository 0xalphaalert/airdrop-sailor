import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import { 
  Bell, ChevronDown, ListTodo, 
  Settings as SettingsIcon, LogOut, Zap, TrendingDown,
  LayoutDashboard, User // Added missing icons for new menu
} from 'lucide-react';

export default function TopHeader() {
  const { ready, authenticated, user, logout } = useAuth();
  
  const [profilePic, setProfilePic] = useState(null);
  const [lifetimeXP, setLifetimeXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [dbUsername, setDbUsername] = useState(null); 
  
  // Dropdown & Notification States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Refs for "Click Outside" logic
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchHeaderData();
      fetchNotifications();
    }
  }, [ready, authenticated, user]);

  // Handle clicking outside of dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getUsername = () => {
    if (!user) return 'Sailor';
    const email = user.email?.address || user.email; 
    if (email) return email.split('@')[0];
    const wallet = user.wallet?.address;
    if (wallet) return wallet.slice(0, 6) + '...' + wallet.slice(-4);
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

  if (!ready || !authenticated) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent px-6 py-4 flex justify-end items-center gap-4 pointer-events-none">
      
      {/* 1. SAIL Balance Pill */}
      <Link 
        to="/xp-levels" 
        className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl pl-2 pr-5 py-1.5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer pointer-events-auto"
      >
        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
          <span className="text-blue-500 font-black text-lg leading-none">$</span>
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-0.5">
            SAIL Balance
          </span>
          <span className="text-sm font-black text-slate-900 leading-none">
            {lifetimeXP.toLocaleString()}
          </span>
        </div>
      </Link>

      {/* 2. Notification Bell Dropdown */}
      <div ref={notifRef} className="relative pointer-events-auto">
        <button 
          onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
          className={`relative flex items-center justify-center w-12 h-12 border rounded-2xl shadow-sm transition-colors ${
            isNotifOpen ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-5 h-5" />
          <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></div>
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

      {/* 3. Profile Dropdown */}
      <div ref={profileRef} className="relative pointer-events-auto">
        <button 
          onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
          className={`flex items-center gap-3 border rounded-2xl p-1.5 pr-4 shadow-sm transition-all group ${
            isProfileOpen ? 'bg-slate-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-blue-200'
          }`}
        >
          {/* Circular Avatar */}
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0 relative overflow-hidden border border-slate-100 shadow-inner">
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
          
          <div className="flex flex-col justify-center text-left">
            <span className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
              {dbUsername || getUsername()}
            </span>
            <span className="text-[10px] font-bold text-slate-500 leading-tight">
              Level {userLevel}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 ml-2 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 mt-3 w-60 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 py-2">
            
            <div className="px-5 py-2 mb-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Account</p>
            </div>
            
            {/* 🚀 NEW MENU OPTIONS */}
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

    </header>
  );
}