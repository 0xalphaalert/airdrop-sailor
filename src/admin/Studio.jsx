import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Menu } from 'lucide-react';
import StudioTab from './StudioTab'; 
import XEngine from './XEngine';
import TelegramEngine from './TelegramEngine';

export default function Studio() {
  const { ready, authenticated, user } = usePrivy();
  const [activeTab, setActiveTab] = useState('studio'); // 'studio', 'x-engine', or 'tg-engine'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 🚀 NEW STATE

  // --- AUTHENTICATION GUARD ---
  const adminWallet = import.meta.env.VITE_ADMIN_WALLET?.toLowerCase();
  const userWallet = user?.wallet?.address?.toLowerCase();

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">
        Verifying admin access...
      </div>
    );
  }

  if (!authenticated || userWallet !== adminWallet) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-900 font-sans overflow-hidden">
      
      {/* --- THE SIDEBAR --- */}
      <div className={`bg-slate-950 text-slate-300 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64 border-r border-slate-800' : 'w-0 overflow-hidden opacity-0'}`}>
        <div className="p-6">
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-500">⚡</span> AlphaBrain
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Command Center</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('studio')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'studio' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            🎨 The Studio
          </button>
          
          <button 
            onClick={() => setActiveTab('x-engine')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'x-engine' ? 'bg-slate-800 text-white border border-slate-700 shadow-lg' : 'hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <span className="text-white font-black text-lg leading-none">𝕏</span> X Engine
          </button>

          <button 
            onClick={() => setActiveTab('tg-engine')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'tg-engine' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg' : 'hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            ✈️ Telegram Engine
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <a 
            href="/admin" 
            className="w-full block text-center py-2 bg-slate-800 text-gray-300 text-[11px] font-black uppercase rounded-lg hover:bg-slate-700 transition-colors"
          >
            ← Back to Admin
          </a>
        </div>
      </div>

      {/* --- THE MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {/* 🚀 MASTER TOGGLE BUTTON */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-[60] bg-slate-900 text-white p-2 rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        
        {activeTab === 'studio' && <StudioTab onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'x-engine' && <XEngine />}
        {activeTab === 'tg-engine' && <TelegramEngine />}
      </div>
      
    </div>
  );
}
