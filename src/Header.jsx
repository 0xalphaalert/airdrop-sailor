import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react'; // Make sure Zap is imported
import { usePrivy } from '@privy-io/react-auth';
import { Anchor, ArrowDownUp, ChevronDown, Flame, LayoutGrid, ShieldCheck, Target, DollarSign } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  // 🚀 Added logout
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  // 🚀 Added profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Helper to check active routes
  const isActive = (path) => location.pathname === path;

  // Generate the gradient avatar based on wallet address
  const generateAvatar = (address) => {
    if (!address) return 'hsl(0, 0%, 80%)';
    let hash = 0;
    for (let i = 0; i < address.length; i++) { hash = address.charCodeAt(i) + ((hash << 5) - hash); }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  const NavLink = ({ to, label, exact = false }) => {
    const active = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          active 
            ? 'bg-blue-50 text-blue-600' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* 1. LOGO BRANDING */}
          <div className="flex items-center gap-8 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img 
                  src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
                  alt="AirdropSailor Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">AirdropSailor</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5 ml-4">
              <NavLink to="/" label="Airdrops" exact={true} />
              <NavLink to="/early-airdrops" label="Early Airdrops" />
              <NavLink to="/fundraising" label="Fundraising" />
              
                            
              {/* Premium Points Arena Badge */}
<Link 
  to="/subscription" 
  className={`ml-2 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 transition-all duration-200 border ${
    isActive('/subscription') 
      ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/20' 
      : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
  }`}
>
  <Flame className="w-3.5 h-3.5" />
  Points Arena
</Link>

              {/* Tools Dropdown */}
              <div 
                className="relative ml-2"
                onMouseEnter={() => setIsToolsOpen(true)}
                onMouseLeave={() => setIsToolsOpen(false)}
              >
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                  Tools <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Simple Dropdown Menu */}
                {isToolsOpen && (
                  <div className="absolute top-full left-0 w-48 pt-2">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-2 flex flex-col gap-1">
                      
                      <Link to="/early-tasks" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                        <Target className="w-4 h-4" /> Early Tasks
                      </Link>

                      {/* 🚀 NEW: Exchange Offers Link */}
                      <Link to="/exchange-offers" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                        <ArrowDownUp className="w-4 h-4" /> Exchange Offers
                      </Link>

                      
                      <Link to="/chains" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                        <LayoutGrid className="w-4 h-4" /> Chains Hub
                      </Link>

                      {/* 🚀 NEW: Sybil Scanner Link */}
                      <Link to="/scanner" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors group/item">
                        <ShieldCheck className="w-4 h-4 group-hover/item:scale-110 transition-transform" /> Sybil Scanner
                      </Link>
                      
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* 2. AUTH & PROFILE SECTION */}
          <div className="flex items-center gap-4">
            
            {/* 🚀 REMOVED the floating Profile text link */}

            {ready && authenticated ? (
              <div 
                className="relative"
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
              >
                {/* The Sleek User Pill */}
                <div className="flex items-center gap-2 pl-4 py-1 pr-1 bg-white border border-slate-200 rounded-full hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                  <span className="text-sm font-bold text-slate-700 font-mono tracking-tight group-hover:text-blue-600 transition-colors">
                    {user?.wallet?.address ? `${user.wallet.address.slice(0, 5)}...${user.wallet.address.slice(-4)}` : 'Connected'}
                  </span>
                  <div 
                    className="w-7 h-7 rounded-full shadow-inner border border-white/50"
                    style={{ background: generateAvatar(user?.wallet?.address) }}
                  />
                </div>

                {/* 🚀 NEW: The Professional Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute top-full right-0 pt-2 w-52 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 flex flex-col gap-1">
                      
                      <Link to="/profile/overview" className="flex items-center px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                        Command Center
                      </Link>
                      
                      <Link to="/profile/settings" className="flex items-center px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                        Settings
                      </Link>
                      
                      <div className="h-px bg-slate-100 my-1"></div>
                      
                      <button 
                        onClick={logout}
                        className="w-full text-left flex items-center px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={login}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-colors shadow-sm"
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
