// src/mobile/components/navigation/BottomNavigation.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Activity, Plus, LineChart, User, 
  Zap, Crown, Shield, Store, X, Download 
} from 'lucide-react';

export default function BottomNavigation() {
  const location = useLocation();
  const path = location.pathname;
  
  // State for the + Button Menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // --- PWA INSTALL STATE ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Listen for the PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstallable(false); // Hide the button once installed
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsMenuOpen(false); // Close the menu
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [path]);

  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: 200%;
          animation: marquee 20s linear infinite;
        }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>

      {/* FULL SCREEN BACKDROP FOR POPUP MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[45] animate-in fade-in duration-200" />
      )}

      {/* + BUTTON POPUP MENU */}
      <div 
        ref={menuRef}
        className={`fixed bottom-[100px] left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-[46] transition-all duration-300 origin-bottom ${
          isMenuOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <div className="grid grid-cols-2 gap-2">
  
  <Link to="/xp-levels" className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl transition-colors active:scale-95 text-slate-700 hover:text-blue-600">
    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
      <Zap size={20} className="fill-blue-100" />
    </div>
    <span className="text-[11px] font-black tracking-tight">Earn Sail</span>
  </Link>

  <Link to="/subscription" className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-amber-50 rounded-2xl transition-colors active:scale-95 text-slate-700 hover:text-amber-600">
    <div className="w-10 h-10 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center">
      <Crown size={20} className="fill-amber-100" />
    </div>
    <span className="text-[11px] font-black tracking-tight">Subscription</span>
  </Link>

  {/* ❌ Roles Link removed completely from here */}

  <Link to="/marketplace" className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-colors active:scale-95 text-slate-700 hover:text-indigo-600">
    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
      <Store size={20} className="fill-indigo-100" />
    </div>
    <span className="text-[11px] font-black tracking-tight">Marketplace</span>
  </Link>

</div>
        {/* 🚀 CONDITIONAL INSTALL PWA BUTTON */}
        {isInstallable && (
          <button 
            onClick={handleInstallClick}
            className="w-full mt-2 flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl transition-transform active:scale-95 shadow-md"
          >
            <Download size={20} />
            <span className="text-[13px] font-black tracking-wide uppercase">Install App</span>
          </button>
        )}

      </div>

      {/* BOTTOM NAVIGATION CONTAINER */}
      <div className="fixed bottom-0 left-0 w-full z-50">
        
        {/* 1. THE LIVE TICKER STRIP */}
        <div className="w-full bg-slate-900 border-t border-slate-800 overflow-hidden py-1.5 shadow-lg relative">
          <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>
          
          <div className="animate-marquee whitespace-nowrap flex items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
            <div className="flex gap-8 w-1/2 justify-around">
              <span className="flex items-center gap-1.5"><Activity size={10} className="text-emerald-400"/> Network: <span className="text-white">Stable</span></span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Gas: <span className="text-white">12 Gwei</span></span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div> Active Drops: <span className="text-white">142</span></span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> Top Alpha: <span className="text-white">Rolly</span></span>
            </div>
            <div className="flex gap-8 w-1/2 justify-around">
              <span className="flex items-center gap-1.5"><Activity size={10} className="text-emerald-400"/> Network: <span className="text-white">Stable</span></span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Gas: <span className="text-white">12 Gwei</span></span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div> Active Drops: <span className="text-white">142</span></span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> Top Alpha: <span className="text-white">Rolly</span></span>
            </div>
          </div>
        </div>

        {/* 2. MAIN BOTTOM NAVIGATION BAR */}
        <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.08)] pb-safe pt-2 px-6 flex items-center justify-between relative rounded-t-3xl">
          
          {/* Home */}
          <Link to="/" className={`flex flex-col items-center gap-1 w-12 ${path === '/' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 transition-colors'}`}>
            <Home size={22} strokeWidth={path === '/' ? 2.5 : 2} className={path === '/' ? 'fill-blue-50' : ''} />
            <span className={`text-[9px] font-black tracking-wide ${path === '/' ? 'text-blue-600' : ''}`}>Home</span>
          </Link>

          {/* Fundraising */}
          <Link to="/fundraising" className={`flex flex-col items-center gap-1 w-12 relative ${path.includes('/fundraising') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 transition-colors'}`}>
            <Activity size={22} strokeWidth={path.includes('/fundraising') ? 2.5 : 2} className={path.includes('/fundraising') ? 'fill-blue-50' : ''} />
            <span className={`text-[9px] font-black tracking-wide ${path.includes('/fundraising') ? 'text-blue-600' : ''}`}>Funding</span>
          </Link>

          {/* Center Floating Action Button (FAB) -> Opens Menu */}
          <div className="relative -top-7 flex justify-center w-16">
             <div className="absolute inset-0 bg-blue-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
             <button 
               onClick={() => setIsMenuOpen(!isMenuOpen)}
               className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-900/20 border-4 border-white/95 active:scale-95 transition-transform z-20"
             >
               {isMenuOpen ? <X size={28} strokeWidth={3} /> : <Plus size={28} strokeWidth={3} />}
             </button>
          </div>

          {/* Tracker */}
          <Link to="/tracker/overview" className={`flex flex-col items-center gap-1 w-12 ${path.includes('/tracker') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 transition-colors'}`}>
            <LineChart size={22} strokeWidth={path.includes('/tracker') ? 2.5 : 2} className={path.includes('/tracker') ? 'fill-blue-50' : ''} />
            <span className={`text-[9px] font-black tracking-wide ${path.includes('/tracker') ? 'text-blue-600' : ''}`}>Tracker</span>
          </Link>

          {/* Profile */}
          <Link to="/profile" className={`flex flex-col items-center gap-1 w-12 ${path === '/profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 transition-colors'}`}>
            <User size={22} strokeWidth={path === '/profile' ? 2.5 : 2} className={path === '/profile' ? 'fill-blue-50' : ''} />
            <span className={`text-[9px] font-black tracking-wide ${path === '/profile' ? 'text-blue-600' : ''}`}>Profile</span>
          </Link>

        </div>
      </div>
    </>
  );
}
