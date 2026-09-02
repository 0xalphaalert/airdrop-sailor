import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { 
  Rocket,
CircleDollarSign,
Target,
Crown,
Gift,
Trophy,
ShieldAlert,
LineChart,
User,
Settings,
Award,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Star
} from 'lucide-react';

// Group 1: Main (No section header)
const mainNavItems = [
  { to: '/', label: 'Airdrops', icon: Rocket, exact: true },
  { to: '/fundraising', label: 'Fundraising', icon: CircleDollarSign },
  
];

// Group 2: Reward & Subscription
const rewardNavItems = [
  { to: '/subscription', label: 'Sailor Pass', icon: Crown },
  { to: '/xp-levels', label: 'Earn Sail', icon: Trophy },
  { to: '/marketplace', label: 'Marketplace', icon: Gift },
  // ❌ Removed Roles item completely
];

// Group 3: Tools
// Group 3: Tools
const toolsNavItems = [
  { to: '/profile/sybil', label: 'Sybil Scanner', icon: ShieldAlert },
  { to: '/tracker', label: 'Tracker', icon: LineChart },
];

// Group 4: Account
const accountNavItems = [
  { to: '/profile', label: 'Profile', icon: User },
];
export default function Sidebar() {
  const { ready, authenticated, user, login } = useAuth();
  const location = useLocation();
  
  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  // Generate avatar color from wallet address (Used for Mobile View)
  const generateAvatar = (address) => {
    if (!address) return 'hsl(148, 60%, 55%)'; 
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  const walletAddress = user?.wallet?.address;

  // Navigation link component
  const NavItem = ({ to, label, icon: Icon, exact = false }) => {
    const isActive = exact 
      ? location.pathname === to 
      : location.pathname === to || location.pathname.startsWith(`${to}/`);
    
    return (
      <NavLink
        to={to}
        className={({ isActive: active }) => `
          relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
          ${isCollapsed ? 'justify-center' : ''}
          ${isActive 
            ? 'bg-blue-50 text-blue-600' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }
        `}
      >
        <div 
          className={`
            absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full transition-all duration-200
            ${isActive ? 'bg-blue-500 opacity-100' : 'bg-blue-500 opacity-0'}
          `}
        />
        <Icon className={`
          w-5 h-5 shrink-0 transition-all duration-200
          ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}
        `} />
        {!isCollapsed && (
          <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
            {label}
          </span>
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            {label}
          </div>
        )}
      </NavLink>
    );
  };

  const SectionHeader = ({ title }) => {
    if (isCollapsed) return null;
    return (
      <p className="px-3 mt-4 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </p>
    );
  };

  const SailorPassCard = () => {
    if (isCollapsed) {
      return (
        <Link 
          to="/subscription"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-200 group"
        >
          <Star className="w-5 h-5 text-white" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            Upgrade to Sailor Pass
          </div>
        </Link>
      );
    }
    return (
      <Link 
        to="/subscription"
        className="block p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-200 transition-all duration-200 group"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 mb-0.5">Get Sailor Pass</h4>
            <p className="text-[11px] text-slate-500 leading-tight mb-2">
              Unlimited tracking for 49 INR/mo
            </p>
            <button className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
              Upgrade
            </button>
          </div>
        </div>
      </Link>
    );
  };

  const MobileTopBar = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={toggleMobile} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="font-bold text-slate-900">AirdropSailor</span>
        </Link>
      </div>
      {ready && authenticated ? (
        <div className="w-8 h-8 rounded-full" style={{ background: generateAvatar(walletAddress), border: '2px solid rgba(37, 99, 255, 0.2)' }} />
      ) : (
        <button onClick={login} className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors">Sign In</button>
      )}
    </div>
  );

  return (
    <>
      <MobileTopBar />
      {isMobileOpen && <div className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setIsMobileOpen(false)} />}
      
      <aside 
        className={`fixed lg:sticky top-0 lg:top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out
          ${isMobile ? (isMobileOpen ? 'translate-x-0' : '-translate-x-full') : ''}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className={`h-16 flex items-center border-b border-slate-100 px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/" className={`flex items-center gap-3 transition-all duration-200 ${isCollapsed ? 'scale-90' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            {!isCollapsed && <span className="font-bold text-slate-900 text-lg tracking-tight">AirdropSailor</span>}
          </Link>
          {!isMobile && (
            <button onClick={toggleCollapse} className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {!isMobile && isCollapsed && (
          <button onClick={toggleCollapse} className="absolute top-5 -right-3 p-1.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 shadow-sm transition-all duration-200 z-10">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {mainNavItems.map((item) => <NavItem key={item.to} {...item} />)}
          </div>
          <SectionHeader title="Reward & Subscription" />
          <div className="space-y-0.5">
            {rewardNavItems.map((item) => <NavItem key={item.to} {...item} />)}
          </div>
          <SectionHeader title="Tools" />
<div className="space-y-0.5">
  {toolsNavItems.map((item) => (
    <NavItem key={item.to} {...item} />
  ))}
</div>

<SectionHeader title="Account" />
<div className="space-y-0.5">
  {accountNavItems.map((item) => (
    <NavItem key={item.to} {...item} />
  ))}
</div>
        </nav>

        <div className="border-t border-slate-100 p-4 space-y-3">
          <div className={isCollapsed ? 'flex justify-center' : ''}>
            <SailorPassCard />
          </div>

          {/* Keeps Sign In button for users who are logged out */}
          {!authenticated && (
            <button onClick={login} className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-all duration-200 shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 ${isCollapsed ? 'px-2' : ''}`}>
              <span className={isCollapsed ? 'hidden' : 'block'}>Sign In</span>
              <Crown className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
