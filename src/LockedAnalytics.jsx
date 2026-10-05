import React from 'react';
import { Activity } from 'lucide-react';

export default function LockedAnalytics({ hasWallet, onConnectWallet, children }) {
  if (hasWallet) {
    return <div className="animate-in fade-in duration-500">{children}</div>;
  }

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group mt-6">
      
      {/* Blurred Background (The Teaser) */}
      <div className="p-6 opacity-30 blur-[6px] select-none pointer-events-none transition-all duration-500 group-hover:blur-[8px]">
        <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Sybil & Airdrop Score</h3>
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-3 w-1/2">
            <div className="h-3 bg-slate-400 rounded w-full"></div>
            <div className="h-3 bg-slate-400 rounded w-3/4"></div>
          </div>
          <div className="h-16 w-16 rounded-full border-8 border-emerald-400"></div>
        </div>
      </div>

      {/* Foreground CTA */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-100 mb-4 transform transition-transform group-hover:scale-110">
          <Activity className="w-6 h-6 text-blue-600" />
        </div>
        <h4 className="text-lg font-black text-slate-900 tracking-tight mb-2">Unlock On-Chain Analytics</h4>
        <p className="text-sm text-slate-500 mb-6 max-w-[260px] text-center font-medium leading-relaxed">
          Connect your Web3 wallet to calculate your Sybil risk and active farming streaks.
        </p>
        <button 
          onClick={onConnectWallet}
          className="bg-slate-900 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
        >
          Connect Wallet securely
        </button>
      </div>
    </div>
  );
}