import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import LockedAnalytics from './LockedAnalytics';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell
} from 'recharts';

export default function ProfileOnchain() {
  const { user, linkWallet } = usePrivy();
  const [loading, setLoading] = useState(true);
  
  // Analytics State
  const [walletData, setWalletData] = useState({
    sybilScore: 0,
    sybilRisk: 'Scanning',
    txMonth: 0,
    walletAge: 0,
    ethBalance: '0.00',
    uniqueContracts: 0,
    totalVolume: '0'
  });

  // Chart State
  const [timelineData, setTimelineData] = useState([]);
  const [topProjectsData, setTopProjectsData] = useState([]);

  useEffect(() => {
    if (user) {
      fetchOnchainData();
    }
  }, [user]);

  const fetchOnchainData = async () => {
    setLoading(true);
    try {
      const wallet = user?.wallet?.address;
      
      if (wallet) {
        // 🚀 Ping your Smart Auto-Sync Edge Function
        // ⚠️ CRITICAL: REPLACE THE URL AND BEARER TOKEN BELOW WITH YOUR ACTUAL PROJECT B DETAILS ⚠️
        const response = await fetch('https://pddykfluvauwsfleqsfk.supabase.co/functions/v1/sync-onchain-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZHlrZmx1dmF1d3NmbGVxc2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzU3ODgsImV4cCI6MjA4OTMxMTc4OH0.F8A-EWHhxueh5jYNBA7lYy241S0f55tmfEwVlUArcF8` 
          },
          body: JSON.stringify({ wallet_address: wallet })
        });

        if (!response.ok) {
           console.warn("Edge function not reachable. Did you replace the placeholders?");
        } else {
           const result = await response.json();

           if (result.success && result.data) {
             const analytics = result.data;
             setWalletData({
               sybilScore: analytics.sailor_score || 0,
               sybilRisk: analytics.sybil_risk_level || 'Safe',
               txMonth: analytics.active_months_count || 0, 
               walletAge: analytics.wallet_age_days || 0,
               ethBalance: analytics.mainnet_eth_balance || '0.00',
               uniqueContracts: analytics.unique_contracts_touched || 0,
               totalVolume: analytics.total_volume_usd || '0'
             });
           }
        }
      }

      // Mock chart data generation (Until we wire up real RPC timeline data)
      setTimelineData([
        { date: 'Apr 1', txs: 2 }, { date: 'Apr 3', txs: 5 }, { date: 'Apr 5', txs: 1 },
        { date: 'Apr 7', txs: 8 }, { date: 'Apr 9', txs: 4 }, { date: 'Apr 11', txs: 12 },
        { date: 'Apr 13', txs: 7 }
      ]); 
      setTopProjectsData([
        { name: 'Monad', txs: 45 }, { name: 'Base', txs: 32 }, { name: 'Linea', txs: 28 },
        { name: 'Scroll', txs: 19 }, { name: 'Zora', txs: 14 }
      ]);

    } catch (error) {
      console.error("Onchain Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Custom Tooltips for Recharts
  const AreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs font-bold border border-slate-700">
          <p className="mb-1 text-slate-400">{label}</p>
          <p className="text-blue-400">{`${payload[0].value} Transactions`}</p>
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs font-bold border border-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <p>{payload[0].payload.name}: <span className="text-blue-400">{payload[0].value} Txs</span></p>
        </div>
      );
    }
    return null;
  };

  // A beautiful descending gradient of pure UI blues
  const BAR_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  if (loading) {
    return <div className="p-10 text-slate-400 font-medium animate-pulse">Loading Blockchain Data...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      
      {/* Header with Auto-Sync Pulse */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">On-Chain Analysis</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Deep dive into your wallet's smart contract footprint.</p>
        </div>
        
        {/* Automated Status Badge instead of a button */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Auto-Sync Active
          </span>
        </div>
      </div>

      <LockedAnalytics hasWallet={!!user?.wallet} onConnectWallet={linkWallet}>
        
        {/* 1. SYBIL INFORMATION (Top Banner - Blue Gradient) */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between relative overflow-hidden mb-6 border border-blue-500">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 mb-6 md:mb-0">
            <h3 className="text-sm font-black uppercase tracking-widest text-blue-100 mb-1">Web3 Identity Score</h3>
            <h2 className="text-2xl font-bold text-white mb-2">Sybil Risk Analysis</h2>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider shadow-sm ${
                walletData.sybilRisk === 'Safe' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30' : 
                walletData.sybilRisk === 'Medium' ? 'bg-amber-500/20 text-amber-100 border-amber-400/30' : 
                'bg-rose-500/20 text-rose-100 border-rose-400/30'
              }`}>
                Risk Level: {walletData.sybilRisk}
              </span>
            </div>
          </div>
          
          <div className="relative z-10 text-right">
            <p className={`text-6xl font-black leading-none tracking-tighter drop-shadow-md ${
              walletData.sybilScore >= 80 ? 'text-emerald-400' : 
              walletData.sybilScore >= 40 ? 'text-white' : 'text-amber-400'
            }`}>
              {walletData.sybilScore}
            </p>
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mt-2">/ 100 Trust Score</p>
          </div>
        </div>

        {/* 2. THE 5 MICRO-STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
             <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Month Txs</p>
               <h4 className="text-2xl font-black text-slate-900">{walletData.txMonth}</h4>
             </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
             <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Wallet Age</p>
               <h4 className="text-2xl font-black text-slate-900">{walletData.walletAge} <span className="text-sm text-slate-400">Days</span></h4>
             </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
             <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mb-3 font-black text-xs">
               ETH
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mainnet Bal</p>
               <h4 className="text-2xl font-black text-slate-900">{walletData.ethBalance}</h4>
             </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
             <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unique Contracts</p>
               <h4 className="text-2xl font-black text-slate-900">{walletData.uniqueContracts}</h4>
             </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
             <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
               <h4 className="text-2xl font-black text-slate-900">${walletData.totalVolume}</h4>
             </div>
          </div>
        </div>

        {/* 3. PROJECT WISE CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Top 5 Projects (Horizontal Bar) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Top Protocol Interactions</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Protocols where you have generated the most transactions.</p>
            </div>
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProjectsData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} width={80} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} content={<BarTooltip />} />
                  <Bar dataKey="txs" radius={[0, 6, 6, 0]} barSize={24}>
                    {topProjectsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Transaction Timeline (Area Graph) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">On-Chain Activity Timeline</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Your transaction volume over the last 14 days.</p>
            </div>
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTxs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip content={<AreaTooltip />} />
                  <Area type="monotone" dataKey="txs" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTxs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </LockedAnalytics>
    </div>
  );
}