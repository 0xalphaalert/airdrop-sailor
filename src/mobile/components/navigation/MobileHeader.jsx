// src/mobile/components/navigation/MobileHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Zap, TrendingDown } from 'lucide-react';
import { useAuth } from '../../../useAuth';
import { supabase } from '../../../supabaseClient';

export default function MobileHeader() {
  const { user } = useAuth();
  const [sailBalance, setSailBalance] = useState(0);
  
  // Notification States
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchHeaderData();
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchHeaderData = async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('lifetime_xp')
        .eq('auth_id', user.id)
        .maybeSingle();
        
      if (data) setSailBalance(data.lifetime_xp || 0);
    } catch (error) {
      console.error("Error fetching balance:", error);
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

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 h-[68px] flex flex-col justify-center">
      <div className="flex items-center justify-between px-4">
        
        {/* LEFT: Logo Only */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 active:opacity-70 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] shadow-sm shrink-0 overflow-hidden">
              {/* 🚀 HERE IS YOUR REAL LOGO FROM THE PUBLIC FOLDER */}
              <img 
                src="/logo-icon.png" 
                alt="AirdropSailor" 
                className="h-full w-full object-cover" 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "/logo-icon.svg"; // Fallback just in case it's an SVG
                }}
              />
            </div>
            <h1 className="text-[19px] font-black tracking-tight text-slate-900 mt-0.5">
              AirdropSailor
            </h1>
          </Link>
        </div>

        {/* RIGHT: Live Balance Pill & Notifications */}
        <div className="flex items-center gap-3 relative">
          
          {/* SAIL Balance Pill */}
          <Link to="/levels" className="flex items-center bg-white border-2 border-slate-100 rounded-full py-1 pr-3 pl-1 shadow-sm active:scale-95 transition-transform">
            <div className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center mr-2">
              <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5 ml-0.5">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">SAIL Balance</span>
              <span className="text-xs font-black text-slate-900 leading-none">{sailBalance.toLocaleString()}</span>
            </div>
          </Link>
          
          {/* Notification Bell Dropdown */}
          <div ref={notifRef} className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-transform active:scale-95 ${
                isNotifOpen ? 'bg-slate-50 border-slate-300 text-slate-900' : 'border-slate-100 bg-white text-slate-600 shadow-sm'
              }`}
            >
              <Bell size={18} strokeWidth={2} className="text-slate-700" />
              <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-red-400" />
            </button>

            {/* Mobile Notification Drawer */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-[85vw] max-w-[320px] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-900">Recent Activity</h3>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 font-medium">No recent activity found.</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map(notif => (
                        <div key={notif.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.amount > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                            {notif.amount > 0 ? <Zap className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{notif.action_type}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{timeAgo(notif.created_at)}</p>
                          </div>
                          
                          <div className={`font-black text-xs shrink-0 ${notif.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {notif.amount > 0 ? '+' : ''}{notif.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                  <Link to="/levels" onClick={() => setIsNotifOpen(false)} className="text-xs font-bold text-blue-600 hover:text-blue-700">View Full History</Link>
                </div>
              </div>
            )}
          </div>
          
        </div>

      </div>
    </header>
  );
}