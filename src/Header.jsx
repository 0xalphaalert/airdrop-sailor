import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Search, Bell, ChevronDown } from 'lucide-react';

export default function Header() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Generate a fallback avatar color based on wallet address
  const generateAvatar = (address) => {
    if (!address) return '#2563EB'; // Brand Blue
    let hash = 0;
    for (let i = 0; i < address.length; i++) { hash = address.charCodeAt(i) + ((hash << 5) - hash); }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  // Resolve display name
  const displayUsername = user?.twitter?.username || 
                          user?.discord?.username || 
                          (user?.wallet?.address ? `${user.wallet.address.slice(0, 5)}...${user.wallet.address.slice(-4)}` : 'airdropsailor');

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#E8EDF5] shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px] gap-8">
          
          {/* 1. LOGO BRANDING */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 flex items-center justify-center bg-[#2563EB] rounded-[12px] shadow-sm group-hover:scale-105 transition-transform">
              <img 
                src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
                alt="AirdropSailor" 
                className="w-6 h-6 object-contain brightness-0 invert" 
              />
            </div>
            <span className="font-black text-[20px] text-[#0F172A] tracking-tight">AirdropSailor</span>
          </Link>

          {/* 2. SEARCH BAR (Centered & Expanded) */}
          <div className="hidden md:flex flex-1 max-w-[600px] mx-auto">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-blue-500" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Search projects, tasks, or guides..."
                className="block w-full pl-11 pr-16 py-2.5 bg-slate-50/80 border border-slate-100 rounded-full text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-1 rounded-[6px] tracking-wide">
                  Ctrl K
                </span>
              </div>
            </div>
          </div>

          {/* 3. RIGHT CONTROLS */}
          <div className="flex items-center gap-3 shrink-0">
            
            {ready && authenticated ? (
              <>
                {/* Sail Balance Pill */}
                <div className="hidden lg:flex items-center gap-3 pl-1.5 pr-4 py-1.5 border border-[#E8EDF5] rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-md transition-shadow cursor-default">
                  <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#2563EB] flex items-center justify-center font-black text-[14px]">
                    $
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Sail Balance</span>
                    <span className="text-[13px] font-black text-[#0F172A] leading-none">149,478</span>
                  </div>
                </div>

                {/* Notification Bell */}
                <button className="relative w-10 h-10 border border-[#E8EDF5] rounded-full flex items-center justify-center bg-white hover:bg-slate-50 transition-colors shadow-[0_2px_8px_rgba(15,23,42,0.03)] shrink-0">
                  <Bell size={18} className="text-slate-600" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                {/* Profile Dropdown Component */}
                <div 
                  className="relative"
                  onMouseEnter={() => setIsProfileOpen(true)}
                  onMouseLeave={() => setIsProfileOpen(false)}
                >
                  <button className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 border border-[#E8EDF5] rounded-full bg-white hover:border-slate-300 hover:shadow-md transition-all shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                    <div 
                      className="w-8 h-8 rounded-full shadow-inner flex items-center justify-center relative overflow-hidden"
                      style={{ background: generateAvatar(user?.wallet?.address) }}
                    >
                       <img 
                         src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
                         className="w-4 h-4 object-contain brightness-0 invert opacity-70" 
                         alt="" 
                       />
                    </div>
                    <div className="flex flex-col items-start justify-center hidden sm:flex">
                      <span className="text-[13px] font-bold text-[#0F172A] leading-none mb-0.5">{displayUsername}</span>
                      <span className="text-[10px] font-medium text-slate-500 leading-none">Level 150</span>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 ml-1 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute top-full right-0 pt-2 w-52 z-50">
                      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1">
                        <Link to="/profile/overview" className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#2563EB] transition-colors">
                          Command Center
                        </Link>
                        <Link to="/profile" className="flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#2563EB] transition-colors">
                          Settings
                        </Link>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button 
                          onClick={logout}
                          className="w-full text-left flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button 
                onClick={login}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-colors shadow-sm"
              >
                Signup / Login
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}