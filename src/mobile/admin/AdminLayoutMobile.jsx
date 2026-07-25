import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  Menu, X, Brain, Database, FileText, 
  Gift, ClipboardCheck, Paintbrush, LogOut, Image 
} from 'lucide-react';

export default function AdminLayoutMobile() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  // Close the drawer automatically when a navigation link is clicked
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Lock background scrolling when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isDrawerOpen]);

  // Updated to strictly show only your 7 requested pages
  const navItems = [
    { name: 'Command Center', path: '/admin', icon: <Brain size={18} /> },
    { name: 'Manage Core DB', path: '/admin/manage', icon: <Database size={18} /> },
    { name: 'Content Manager', path: '/admin/content', icon: <FileText size={18} /> },
    { name: 'AI Intelligence', path: '/admin/early', icon: <Brain size={18} /> },
    { name: 'Token Giveaways', path: '/admin/giveaways', icon: <Gift size={18} /> },
    { name: 'Pioneer Studio', path: '/admin/pioneers', icon: <Image size={18} /> },
    { name: 'Pending Reviews', path: '/admin/pendingreviews', icon: <ClipboardCheck size={18} /> },
    { name: 'Alpha Studio', path: '/admin/studio', icon: <Paintbrush size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      
      {/* --- STICKY MOBILE HEADER --- */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open Menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            SAILOR<span className="text-blue-600">OS</span>
          </h1>
        </div>
        
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 font-bold text-sm">
          A
        </div>
      </header>

      {/* --- BACKDROP OVERLAY --- */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* --- SLIDE-OUT DRAWER --- */}
      <nav 
        className={`fixed inset-y-0 left-0 w-[280px] bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
            Operations
          </h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all text-sm
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 shrink-0">
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
            <LogOut size={16} />
            Exit Admin
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT OUTLET --- */}
      <main className="flex-1 flex flex-col relative w-full overflow-x-hidden bg-slate-50/50">
        <Outlet />
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}