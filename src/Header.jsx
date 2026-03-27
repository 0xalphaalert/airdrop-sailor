import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Activity, Droplet, Server, Flame, Menu, X } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

export default function Header() {
  // 1. ADD linkWallet to the usePrivy hook
  const { login, ready, authenticated, user, logout, linkWallet } = usePrivy();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 2. ADD this new state for the profile dropdown
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Helper to check active route
  const isActive = (path) => location.pathname === path;

  // Helper to truncate wallet
  const truncateWallet = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper to generate a unique gradient avatar based on wallet address (Jazzicon alternative)
  const generateAvatarGradient = (address) => {
    if (!address) return 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
    const charCode = address.charCodeAt(2) || 0;
    const hues = [200, 250, 300, 350, 40, 100];
    const h1 = hues[charCode % hues.length];
    const h2 = hues[(charCode + 2) % hues.length];
    return `linear-gradient(135deg, hsl(${h1}, 80%, 60%), hsl(${h2}, 80%, 60%))`;
  };

  return (
    <header className="h-[64px] bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 flex items-center justify-between px-6">
      
      {/* 1. LEFT SECTION: LOGO & BRAND */}
<div className="flex-1 flex items-center justify-start">
  <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
    {/* Just the square icon */}
    <img 
      src="/logo-icon.png" 
      alt="AirdropSailor Icon" 
      className="h-8 w-8 object-contain" 
    />
    {/* Native text for crispness */}
    <span className="text-[18px] font-bold tracking-wide text-gray-900 hidden sm:block">
      AirdropSailor
    </span>
  </Link>
</div>

      {/* 2. CENTER SECTION: PRIMARY NAVIGATION */}
      <nav className="hidden md:flex flex-1 items-center justify-center h-full gap-6">
        <Link 
          to="/" 
          className={`flex items-center h-full text-[14px] font-medium tracking-[0.02em] transition-all border-b-2 px-1 ${
            isActive('/') 
              ? 'text-gray-900 border-blue-600' 
              : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          Airdrops
        </Link>
        <Link 
          to="/fundraising" 
          className={`flex items-center h-full text-[14px] font-medium tracking-[0.02em] transition-all border-b-2 px-1 ${
            isActive('/fundraising') 
              ? 'text-gray-900 border-blue-600' 
              : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          Fundraising
        </Link>
        <Link 
          to="/early-tasks" 
          className={`flex items-center h-full text-[14px] font-medium tracking-[0.02em] transition-all border-b-2 px-1 ${
            isActive('/early-tasks') 
              ? 'text-gray-900 border-blue-600' 
              : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          Early Tasks
        </Link>

        {/* NEW: POINTS ARENA LINK */}
        <Link 
          to="/subscription" 
          className={`flex items-center h-full text-[14px] font-medium tracking-[0.02em] transition-all border-b-2 px-1 ${
            isActive('/subscription') 
              ? 'text-blue-600 border-blue-600' 
              : 'text-amber-600 border-transparent hover:text-amber-700 hover:border-amber-300'
          }`}
        >
          <Flame className="w-3.5 h-3.5 mr-1.5" /> Points Arena
        </Link>

        {/* TOOLS DROPDOWN */}
        <div className="relative group h-full flex items-center">
          <button className={`flex items-center gap-1.5 h-full text-[14px] font-medium tracking-[0.02em] transition-all border-b-2 px-1 ${
            location.pathname.includes('/chains') 
              ? 'text-gray-900 border-blue-600' 
              : 'text-gray-500 border-transparent group-hover:text-gray-900 group-hover:border-gray-300'
          }`}>
            Tools <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:text-blue-600 transition-colors" />
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute top-[64px] left-1/2 -translate-x-1/2 w-56 bg-white border border-gray-100 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden transform group-hover:translate-y-0 -translate-y-2">
            <div className="p-2 flex flex-col gap-1">
              
              <Link to="/chains" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group/item">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 leading-none mb-1">Chains Hub</p>
                  <p className="text-[11px] font-medium text-gray-500 leading-tight">Networks & RPCs</p>
                </div>
              </Link>

              <Link to="/#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group/item">
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 leading-none mb-1">Faucets</p>
                  <p className="text-[11px] font-medium text-gray-500 leading-tight">Claim Testnet Tokens</p>
                </div>
              </Link>

              <Link to="/#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group/item">
                <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600 group-hover/item:bg-purple-600 group-hover/item:text-white transition-colors">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 leading-none mb-1">RPC Tools</p>
                  <p className="text-[11px] font-medium text-gray-500 leading-tight">Endpoints & Latency</p>
                </div>
              </Link>

            </div>
          </div>
        </div>
      </nav>

      {/* 3. RIGHT SECTION: PROFILE & WALLET */}
      <div className="flex-1 flex items-center justify-end gap-3">
        
        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Profile Link (Desktop Only) */}
        {authenticated && (
          <Link 
            to="/profile" 
            className="hidden md:block text-[14px] font-medium text-gray-500 hover:text-gray-900 tracking-[0.02em] transition-colors mr-2"
          >
            Profile
          </Link>
        )}

        {/* PRIVY AUTH BUTTON */}
        {!ready ? (
          <div className="h-[40px] w-[120px] bg-gray-100 animate-pulse rounded-full" />
        ) : authenticated ? (
          // LOGGED IN: Avatar + Dropdown Menu
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50 py-1.5 pl-1.5 pr-3.5 rounded-full transition-all shadow-sm group"
            >
              <div 
                className="w-[32px] h-[32px] rounded-full border border-gray-100 shrink-0 shadow-inner"
                style={{ background: generateAvatarGradient(user?.wallet?.address || user?.email?.address) }}
              />
              <span className="text-[14px] font-medium text-gray-700 group-hover:text-blue-700 tracking-wide transition-colors">
                {user?.wallet ? truncateWallet(user.wallet.address) : user?.email?.address?.split('@')[0]}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* THE DROPDOWN MENU */}
            {isProfileMenuOpen && (
              <div className="absolute top-[54px] right-0 w-64 bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* User Identity Section */}
                <div className="p-3 border-b border-gray-50 mb-1 bg-slate-50/50 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                  <p className="text-[13px] font-semibold text-slate-900 truncate">
                    {user?.email?.address || 'No email attached'}
                  </p>
                  {user?.wallet && (
                    <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                      Wallet: {truncateWallet(user.wallet.address)}
                    </p>
                  )}
                </div>

                {/* Web3 Bridge Action */}
                {!user?.wallet && (
                  <button 
                    onClick={() => { linkWallet(); setIsProfileMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 rounded-xl transition-colors text-[13px] font-semibold text-slate-700 group/link my-1"
                  >
                    <span>Link Web3 Wallet</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider group-hover/link:bg-blue-600 group-hover/link:text-white transition-colors">Action</span>
                  </button>
                )}

                {/* Dashboard Shortcut */}
                <Link 
                  to="/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full flex items-center px-3 py-2.5 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors text-[13px] font-semibold my-1"
                >
                  View Profile & Stats
                </Link>

                {/* Safe Logout */}
                <button 
                  onClick={() => { logout(); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors text-[13px] font-semibold mt-1 border-t border-gray-50 pt-3"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          // LOGGED OUT
          <button 
            onClick={login}
            className="bg-gray-900 hover:bg-blue-600 text-white px-5 py-2 rounded-full font-medium text-[14px] transition-colors shadow-sm tracking-wide"
          >
            Sign In
          </button>
        )}
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="absolute top-[64px] left-0 w-full bg-white border-b border-gray-100 shadow-lg flex flex-col px-6 py-4 md:hidden">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`py-3 text-[15px] font-medium border-b border-gray-50 ${isActive('/') ? 'text-blue-600' : 'text-gray-600'}`}>Airdrops</Link>
          <Link to="/fundraising" onClick={() => setIsMobileMenuOpen(false)} className={`py-3 text-[15px] font-medium border-b border-gray-50 ${isActive('/fundraising') ? 'text-blue-600' : 'text-gray-600'}`}>Fundraising</Link>
          <Link to="/early-tasks" onClick={() => setIsMobileMenuOpen(false)} className={`py-3 text-[15px] font-medium border-b border-gray-50 ${isActive('/early-tasks') ? 'text-blue-600' : 'text-gray-600'}`}>Early Tasks</Link>
          <Link to="/subscription" onClick={() => setIsMobileMenuOpen(false)} className={`py-3 text-[15px] font-medium border-b border-gray-50 flex items-center gap-2 ${isActive('/subscription') ? 'text-blue-600' : 'text-amber-600'}`}><Flame className="w-4 h-4" /> Points Arena</Link>
          <Link to="/chains" onClick={() => setIsMobileMenuOpen(false)} className={`py-3 text-[15px] font-medium border-b border-gray-50 ${location.pathname.includes('/chains') ? 'text-blue-600' : 'text-gray-600'}`}>Tools (Chains Hub)</Link>
          {authenticated && (
            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-[15px] font-medium text-gray-600">Profile</Link>
          )}
        </div>
      )}
    </header>
  );
}