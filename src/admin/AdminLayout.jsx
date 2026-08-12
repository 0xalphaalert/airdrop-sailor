import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { supabase } from '../supabaseClient';
import { Menu, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import SEO from '../components/SEO';

export default function AdminLayout() {
  const { ready, authenticated, user, login } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // 🚀 BOUNCER / ADMIN CHECK (Upgraded for Supabase)
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase() || 'dkrout006@gmail.com'; 
  const rawEmail = typeof user?.email === 'string' ? user.email : user?.email?.address;
  const currentUserEmail = rawEmail?.toLowerCase();

  // Fetch pending submissions count
  useEffect(() => {
    const fetchPendingCount = async () => {
      const { data, error } = await supabase
        .from('manual_xp_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!error && data !== null) {
        setPendingCount(data);
      }
    };

    fetchPendingCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 Cleaned Navigation Map (Removed unused menu options)
  const navItems = [
    { id: 'overview', path: '/admin', label: 'Command Center', icon: '🧠' },
    { id: 'manageas', path: '/admin/manage', label: 'Manage Core DB', icon: '⚙️' },
    { id: 'content', path: '/admin/content', label: 'Content Manager', icon: '📝' },
    { id: 'earlylist', path: '/admin/early', label: 'VC Profiles', icon: '📡' },
    { id: 'telegramintel', path: '/admin/telegram-intel', label: 'Telegram Intel', icon: '💬', badge: true },
    { id: 'datagaps', path: '/admin/data-gaps', label: 'Data Gaps', icon: '🚨' },
    { id: 'research', path: '/admin/research', label: 'Research Hub', icon: '🔬' },
    { id: 'pendingreviews', path: '/admin/pendingreviews', label: 'Pending Reviews', icon: '📋', badge: true },
  ];


  // Auth States
  if (!ready) return <div className="min-h-screen bg-gray-950 flex items-center justify-center font-bold text-gray-500">Verifying Clearance...</div>;
  if (ready && !authenticated) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <button onClick={login} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500">Admin Login</button>
    </div>
  );
  
  // 🚀 The newly secured email check
  if (ready && authenticated && currentUserEmail !== adminEmail) return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white font-black uppercase tracking-widest text-red-500">
          Access Denied
      </div>
  );

  return (
    <div className="w-full bg-[#0A0D14] min-h-screen flex font-sans text-white overflow-hidden">
      
      <SEO 
        title="Admin Dashboard" 
        description="AirdropSailor Admin Command Center." 
        noindex={true} 
      />
      
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
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl font-bold text-[13px] transition-all relative ${
                // Exact match for overview, startsWith for sub-routes
                (item.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.path))
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && <span className="flex-1">{item.label}</span>}
              {!isCollapsed && item.badge && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
              {isCollapsed && item.badge && pendingCount > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
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
      <main className={`flex-1 overflow-y-auto relative z-10 p-6 md:p-10 custom-scrollbar ${location.pathname === '/admin/research' ? 'bg-white' : ''}`}>
        {/* THIS IS WHERE REACT ROUTER INJECTS THE SUB-PAGES */}
        <Outlet /> 
      </main>
      
    </div>
  );
}