import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { 
  LayoutDashboard, Palette, FileText, Twitter, Send, Hash, TrendingUp, Settings, ArrowLeft,
  Menu, X, PenLine
} from 'lucide-react';

export default function AlphaBrainLayout() {
  const { ready, authenticated, user, login } = useAuth();
  const [isMobileOpen, setIsMobileMenuOpen] = useState(false);

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase() || 'dkrout006@gmail.com';
  const rawEmail = typeof user?.email === 'string' ? user.email : user?.email?.address;
  const currentUserEmail = rawEmail?.toLowerCase();

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-bold text-slate-500">
        Verifying Clearance...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <button onClick={login} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500">
          Studio Login
        </button>
      </div>
    );
  }

  if (currentUserEmail !== adminEmail) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500 font-black uppercase tracking-widest text-sm">
        Access Denied
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/studio', icon: <LayoutDashboard size={18} />, exact: true },
    { name: 'Studio', path: '/studio/create', icon: <Palette size={18} /> },
    { name: 'Writing Pad', path: '/studio/writing-pad', icon: <PenLine size={18} /> },
    { name: 'Content', path: '/studio/content', icon: <FileText size={18} /> },
    { name: 'X Engine', path: '/studio/x-engine', icon: <Twitter size={18} /> },
    { name: 'Telegram Engine', path: '/studio/telegram', icon: <Send size={18} /> },
    { name: 'Farcaster Engine', path: '/studio/farcaster', icon: <Hash size={18} /> },
    { name: 'Binance Engine', path: '/studio/binance', icon: <TrendingUp size={18} /> },
    { name: 'Settings', path: '/studio/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {/* --- MOBILE HEADER --- */}
      <header className="fixed top-0 inset-x-0 z-30 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-lg leading-none">⚡</span>
          </div>
          <span className="text-sm font-black tracking-tight text-slate-900">AlphaBrain Studio</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors"
          aria-label="Open studio navigation"
        >
          <Menu size={20} />
        </button>
      </header>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        
        {/* Brand Header / Logo */}
        <div className="h-[72px] flex items-center justify-between px-6 shrink-0 border-b border-slate-100">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2.5 text-slate-900">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-lg leading-none">⚡</span>
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">AlphaBrain</span>
              <span className="text-[11px] font-bold text-blue-600 tracking-widest uppercase">Sailor Studio</span>
            </div>
          </h1>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center lg:hidden"
            aria-label="Close studio navigation"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1 scrollbar-hide">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-2 mt-2">Main</div>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                SA
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900 truncate">Surya Admin</span>
                <span className="text-[10px] text-slate-500 truncate">admin@airdropsailor.xyz</span>
              </div>
            </div>
          </div>
          <a href="/admin" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm">
            <ArrowLeft size={14} /> Back to Admin
          </a>
        </div>
      </aside>

      {/* --- MAIN PAGE CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          <Outlet />
        </main>
      </div>

    </div>
  );
}