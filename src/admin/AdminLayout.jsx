import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Menu, PanelLeftOpen, PanelLeftClose } from 'lucide-react';

export default function AdminLayout() {
  const { ready, authenticated, user, login } = usePrivy();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- BOUNCER / ADMIN CHECK ---
  const adminWallet = import.meta.env.VITE_ADMIN_WALLET?.toLowerCase();
  const userWallet = user?.wallet?.address?.toLowerCase();

  // Navigation Map
  const navItems = [
    { id: 'overview', path: '/admin', label: 'Command Center', icon: '🧠' },
    { id: 'manageas', path: '/admin/manage', label: 'Manage Core DB', icon: '⚙️' },
    { id: 'earlylist', path: '/admin/early', label: 'AI Intelligence', icon: '📡' },
    { id: 'projects', path: '/admin/projects', label: 'Project Research', icon: '🔍' },
    { id: 'exchange', path: '/admin/exchange', label: 'Exchange Offers', icon: '💱' },
    { id: 'giveaways', path: '/admin/giveaways', label: 'Token Giveaways', icon: '🎁' },
    { id: 'earlyquests', path: '/admin/earlyquests', label: 'Early Quests', icon: '🎯' },
    { id: 'dailytasks', path: '/admin/dailytasks', label: 'Daily Tasks', icon: '✅' },
    { id: 'studio', path: '/admin/studio', label: 'Alpha Studio', icon: '🎨' },
  ];

  // Auth States
  if (!ready) return <div className="min-h-screen bg-gray-950 flex items-center justify-center font-bold text-gray-500">Verifying Clearance...</div>;
  if (ready && !authenticated) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <button onClick={login} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500">Admin Login</button>
    </div>
  );
  if (ready && authenticated && userWallet !== adminWallet) return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white font-black uppercase tracking-widest text-red-500">
          Access Denied
      </div>
  );

  return (
    <div className="w-full bg-[#0A0D14] min-h-screen flex font-sans text-white overflow-hidden">
      
      {/* COLLAPSIBLE SIDEBAR */}
      <aside className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 min-h-screen relative z-20 transition-all duration-300`}>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
           {!isCollapsed && <h1 className="text-xl font-black tracking-tighter text-white">SAILOR<span className="text-blue-500">OS</span></h1>}
           <button
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
           >
             {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
           </button>
        </div>
        
        <nav className="flex flex-col gap-1 flex-1 p-4 mt-2 overflow-y-auto">
          {!isCollapsed && <p className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Operations</p>}
          {navItems.map(item => (
            <Link 
              key={item.id} 
              to={item.path}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl font-bold text-[13px] transition-all ${
                // Exact match for overview, startsWith for sub-routes
                (item.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.path))
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        
        <div className="p-6 border-t border-gray-800">
            {!isCollapsed ? (
              <Link to="/" className="w-full block text-center py-2 bg-gray-800 text-gray-300 text-[11px] font-black uppercase rounded-lg hover:bg-gray-700">Exit Admin</Link>
            ) : (
              <Link 
                to="/" 
                className="w-full flex justify-center py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                title="Exit Admin"
              >
                🚪
              </Link>
            )}
        </div>
      </aside>

      {/* DYNAMIC MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative z-10 p-6 md:p-10 custom-scrollbar">
        {/* THIS IS WHERE REACT ROUTER INJECTS THE SUB-PAGES */}
        <Outlet /> 
      </main>
      
    </div>
  );
}