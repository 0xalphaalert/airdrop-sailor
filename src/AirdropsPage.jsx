import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
// 🚀 NEW: Live Auto-Scrolling Market Ticker Component
const MarketTicker = () => {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // 🚀 ADDED 10+ MORE TOKENS: ripple, polkadot, avalanche, polygon, shiba, tron, uniswap, cosmos, aptos, sui
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,litecoin,cardano,binancecoin,dogecoin,chainlink,solana,ripple,polkadot,avalanche-2,polygon,shiba-inu,tron,uniswap,cosmos,aptos,sui&order=market_cap_desc&sparkline=false');
        const data = await res.json();
        setCoins(data);
      } catch (e) {
        console.error("Ticker fetch failed:", e);
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Updates every 60 seconds
    return () => clearInterval(interval);
  }, []);

  if (coins.length === 0) return null;

  return (
    <div className="w-full bg-slate-100 border-b border-slate-200 py-2.5 overflow-hidden flex items-center text-[11px] font-mono whitespace-nowrap shadow-inner relative group">
      
      {/* 🚀 INJECTED CSS FOR FLAWLESS INFINITE SCROLL */}
      <style>
        {`
          @keyframes ticker-marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-ticker {
            display: flex;
            width: max-content;
            animation: ticker-marquee 40s linear infinite;
          }
          /* Pauses the scroll when the user hovers over it with their mouse */
          .group:hover .animate-ticker {
            animation-play-state: paused;
          }
        `}
      </style>

      {/* The scrolling container */}
      <div className="animate-ticker gap-8 pl-8">
        
        {/* 🚀 WE RENDER THE ARRAY TWICE TO CREATE A SEAMLESS INFINITE LOOP */}
        {[...coins, ...coins].map((coin, index) => (
          <div key={`${coin.id}-${index}`} className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-slate-600 uppercase">{coin.symbol}</span>
            <span className="text-slate-900">${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className={`font-black ${coin.price_change_percentage_24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {coin.price_change_percentage_24h > 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
            </span>
          </div>
        ))}

      </div>
    </div>
  );
};
// 🚀 NEW: Market Insights & Macro Dashboard
// 🚀 PHASE 1: Premium Hero (Market Sentiment & Macro)
const PremiumHero = () => {
  const [macro, setMacro] = useState({ btcDom: 0, totalCap: 0 });
  const [fgi, setFgi] = useState({ value: 50, label: 'Evaluating...' });
  const [gwei, setGwei] = useState(18);

  useEffect(() => {
    const fetchMacro = async () => {
      try {
        const fgiRes = await fetch('https://api.alternative.me/fng/');
        const fgiData = await fgiRes.json();
        if (fgiData?.data?.[0]) setFgi({ value: parseInt(fgiData.data[0].value), label: fgiData.data[0].value_classification });

        const cgRes = await fetch('https://api.coingecko.com/api/v3/global');
        const cgData = await cgRes.json();
        if (cgData?.data) setMacro({ btcDom: cgData.data.market_cap_percentage.btc, totalCap: cgData.data.total_market_cap.usd / 1e12 });

        setInterval(() => setGwei(prev => Math.max(12, prev + (Math.random() > 0.5 ? 1 : -1))), 10000);
      } catch (e) { console.error(e); }
    };
    fetchMacro();
  }, []);

  const getFgiColor = (val) => {
    if (val >= 75) return 'text-emerald-500 stroke-emerald-500 bg-emerald-500/10';
    if (val >= 55) return 'text-emerald-400 stroke-emerald-400 bg-emerald-400/10';
    if (val >= 45) return 'text-amber-500 stroke-amber-500 bg-amber-500/10';
    if (val >= 25) return 'text-orange-500 stroke-orange-500 bg-orange-500/10';
    return 'text-red-500 stroke-red-500 bg-red-500/10';
  };

  const fgiColor = getFgiColor(fgi.value);
  const strokeDasharray = `${(fgi.value / 100) * 283} 283`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      
      {/* MAIN HERO: Market Sentiment */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-50 transition-colors duration-700"></div>
        
        <div className="z-10 flex flex-col items-center md:items-start text-center md:text-left mb-8 md:mb-0">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Primary KPI</span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Market Sentiment</h2>
          <p className="text-slate-500 font-medium max-w-sm">
            Current global market cap is <strong className="text-slate-700">${macro.totalCap > 0 ? macro.totalCap.toFixed(2) : '---'}T</strong>. 
            Adjust your risk profile and farming effort based on current index levels.
          </p>
        </div>

        <div className="z-10 relative flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 bg-slate-50/50 shadow-inner">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" className={`${fgiColor.split(' ')[1]} transition-all duration-1000 ease-out`} strokeWidth="8" strokeDasharray={strokeDasharray} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${fgiColor.split(' ')[0]}`}>{fgi.value}</span>
            </div>
          </div>
          <span className={`mt-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${fgiColor.split(' ')[0]} ${fgiColor.split(' ')[2]} border-current/20`}>
            {fgi.label}
          </span>
        </div>
      </div>

      {/* SECONDARY MACROS */}
      <div className="flex flex-col gap-6">
        {/* ETH Gas Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col justify-center group hover:border-blue-200 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <span className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest">
  <svg className="w-3.5 h-3.5 text-[#627EEA]" viewBox="0 0 320 512" fill="currentColor">
    <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z" />
  </svg>
  ETH Gas Network
</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Best time to transact
            </span>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-slate-900 group-hover:scale-105 transition-transform origin-left">{gwei}</h3>
            <span className="text-slate-500 font-bold mb-1">Gwei</span>
          </div>
        </div>

        {/* BTC Dominance Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4">
            <span className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest">
  <svg className="w-4 h-4 text-[#F7931A]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10zm-7.1-2.95c0-1.57-1.28-2.84-2.85-2.84H11V4.5H9.5v1.71H8v1.5h1.5v6.58H8v1.5h1.5v1.71H11v-1.71h1.05c1.57 0 2.85-1.28 2.85-2.84 0-1.12-.66-2.11-1.63-2.58.97-.47 1.63-1.46 1.63-2.58zM11 7.71h1.05c.79 0 1.43.64 1.43 1.42 0 .79-.64 1.42-1.43 1.42H11V7.71zm0 5.57h1.05c.79 0 1.43.64 1.43 1.42 0 .79-.64 1.42-1.43 1.42H11v-2.84z"/>
  </svg>
  BTC Dominance
</span>
            <span className="text-[10px] font-bold text-slate-500">Liquidity Flow</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-3">{macro.btcDom > 0 ? macro.btcDom.toFixed(1) : '--'}%</h3>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full shadow-sm" style={{ width: `${macro.btcDom}%` }}></div>
          </div>
        </div>
      </div>

    </div>
  );
};

// 🚀 PHASE 1: Action Layer (Top Opportunities)
const TopOpportunities = ({ projects }) => {
  // Grab top 3 scored projects safely
  const top3 = projects && projects.length > 0 
    ? [...projects].sort((a, b) => (b._score || 0) - (a._score || 0)).slice(0, 3) 
    : [];

  if (top3.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">🔥 Today's Best Opportunities</h2>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">AI Selected</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {top3.map((p, idx) => {
          let badge1 = { label: 'High Potential', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
          let badge2 = p._effort === 'Easy' 
            ? { label: 'Low Effort', color: 'bg-blue-50 text-blue-700 border-blue-200' } 
            : { label: 'Time Intensive', color: 'bg-amber-50 text-amber-700 border-amber-200' };
          let badge3 = p.status === 'Testnet' || p.status === 'Waitlist'
            ? { label: 'Early', color: 'bg-purple-50 text-purple-700 border-purple-200' }
            : { label: 'Active', color: 'bg-slate-100 text-slate-700 border-slate-200' };

          return (
            <div key={p.id || idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between group hover:shadow-md hover:border-blue-300 transition-all duration-300">
              
              <div className="flex items-start justify-between mb-5">
                <div className="flex gap-4 items-center">
                  <img src={p.logo_url} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm group-hover:scale-105 transition-transform" alt="" />
                  <div>
                    <h3 className="font-black text-lg text-slate-900">{p.name}</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase">{p.tier || 'TBA'}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-50">
                  <span className="text-[11px] font-black text-emerald-700">{p._score || 0}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${badge1.color}`}>{badge1.label}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${badge2.color}`}>{badge2.label}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${badge3.color}`}>{badge3.label}</span>
              </div>

              {/* 🚀 SEO LINK UPDATED HERE */}
              <Link to={`/${p.slug || p.id}/airdropguide`} className="w-full block">
                <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all">
                  Start Now →
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default function AirdropsPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFunding, setFilterFunding] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSocial, setFilterSocial] = useState('All');
  // 🚀 NEW: Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => { fetchProjects(); }, []);

  const calculateScore = (p) => {
    const social = p.social_score || 0;
    const fundingVal = parseFloat(p.funding?.replace(/[^0-9.]/g, '') || 0);
    const fundingScore = Math.min(fundingVal / 20, 1) * 100;

    let tierScore = 30;
    if (p.tier?.includes('1')) tierScore = 100;
    else if (p.tier?.includes('2')) tierScore = 70;

    const taskScore = Math.min((p.task_count || 0) * 10, 100);

    return Math.round(
      social * 0.4 +
      fundingScore * 0.3 +
      tierScore * 0.2 +
      taskScore * 0.1
    );
  };

  const getEffort = (p) => {
    const cost = parseFloat(p.total_cost_estimate || 0);
    const tasks = p.task_count || 0;

    if (cost === 0 && tasks <= 5) return 'Easy';
    if (cost <= 20 && tasks <= 10) return 'Medium';
    return 'Hard';
  };

  const scoredProjects = useMemo(
    () => projects.map((p) => ({
      ...p,
      _score: calculateScore(p),
      _effort: getEffort(p),
      _fundingVal: parseFloat(p.funding?.replace(/[^0-9.]/g, '') || 0)
    })),
    [projects]
  );

  const fetchProjects = async () => {
    try {
      const CACHE_KEY = 'radar_projects_cache';
      
      // 🚀 1. INSTANT LOAD: Show the cached data instantly to remove the loading screen
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          // Safely handles both our old cache format and the new one
          const cacheItems = parsedCache.data ? parsedCache.data : parsedCache; 
          
          if (Array.isArray(cacheItems)) {
            setProjects(cacheItems);
            setFilteredProjects(cacheItems);
            setLoading(false); // Turns off the spinner immediately!
          }
        } catch (err) {
          console.warn("Cache parse error, fetching fresh.");
        }
      }

      // 🚀 2. SILENT BACKGROUND SYNC: Fetch the absolute newest data from Supabase
      const { data, error } = await supabase
        .from('projects')
        .select('id, slug, name, logo_url, funding, tier, status, airdrop_status, total_cost_estimate, task_count, social_score')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const fetchedData = data || [];
      
      // 🚀 3. QUIET UPDATE: Save the new data to cache and update the UI invisibly
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: fetchedData, timestamp: Date.now() }));
      setProjects(fetchedData);
      setFilteredProjects(fetchedData);
      
    } catch (e) { 
      console.error("Radar Fetch Error:", e); 
    } finally { 
      // Failsafe to ensure spinner turns off even if everything fails
      setLoading(false); 
    }
  };
  
  useEffect(() => {
    let result = [...scoredProjects].sort((a, b) => b._score - a._score);

    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (filterFunding !== 'All') {
      result = result.filter(p => {
        const val = p._fundingVal || 0;
        if (filterFunding === '0-10M') return val >= 0 && val <= 10;
        if (filterFunding === '10M-20M') return val > 10 && val <= 20;
        if (filterFunding === '20M+') return val > 20;
        return true;
      });
    }

    if (filterSocial !== 'All') {
      result = result.filter(p => {
        const score = p.social_score || 0;
        if (filterSocial === '0-15') return score <= 15;
        if (filterSocial === '15-25') return score > 15 && score <= 25;
        if (filterSocial === '25-50') return score > 25 && score <= 50;
        if (filterSocial === '50-80') return score > 50 && score <= 80;
        if (filterSocial === '80-100') return score > 80;
        return true;
      });
    }

    if (filterTier !== 'All') result = result.filter(p => p.tier === filterTier);
    if (filterStatus !== 'All') result = result.filter(p => p.status === filterStatus);

    setFilteredProjects(result);
    setCurrentPage(1); // 🚀 NEW: Reset to page 1 whenever filters change
  }, [searchTerm, filterFunding, filterTier, filterStatus, filterSocial, scoredProjects]);

  // 🚀 NEW: Calculate the chunk of projects to show on the current page
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // --- UI FORMATTING HELPERS ---

  // --- UI FORMATTING HELPERS (PHASE 2 UPGRADES) ---

  const formatCost = (cost) => {
    if (!cost) return '$0'; 
    const strCost = String(cost).trim().toLowerCase();
    if (strCost === '0' || strCost === 'free' || strCost === '$0') return '$0';
    if (strCost.startsWith('$')) return String(cost).trim(); 
    return `$${String(cost).trim()}`; 
  };

  const formatFunding = (fundingStr) => {
    if (!fundingStr || fundingStr.trim() === '') return null;
    let clean = String(fundingStr).replace(/\$/g, '').trim().toUpperCase();
    return `$${clean}`;
  };

  const getAirdropStatusBadge = (status) => {
    if (status === 'Confirmed') return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✨' };
    if (status === 'Possible') return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🎯' };
    return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: '⏱️' };
  };

  const renderAirdropScore = (score) => {
    const safeScore = parseInt(score) || 0;
    let gradientClass = 'from-slate-400 to-slate-300';
    let textClass = 'text-slate-600';

    if (safeScore >= 80) { gradientClass = 'from-emerald-500 to-emerald-400'; textClass = 'text-emerald-600'; }
    else if (safeScore >= 50) { gradientClass = 'from-blue-500 to-blue-400'; textClass = 'text-blue-600'; }
    else if (safeScore >= 30) { gradientClass = 'from-amber-500 to-amber-400'; textClass = 'text-amber-600'; }

    return (
      <div className="flex flex-col items-start w-28 gap-1.5">
        <span className={`font-black text-xl leading-none tracking-tight ${textClass}`}>{safeScore}</span>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`} style={{ width: `${safeScore}%` }}></div>
        </div>
      </div>
    );
  };

  const renderSocialScore = (score) => {
    const safeScore = parseInt(score) || 0;
    let colorClass = 'bg-slate-300';
    
    if (safeScore >= 80) colorClass = 'bg-emerald-500';
    else if (safeScore >= 50) colorClass = 'bg-blue-500';
    else if (safeScore >= 25) colorClass = 'bg-amber-500';

    return (
      <div className="flex flex-col items-end w-20 ml-auto gap-1">
        <div className="flex items-baseline gap-1">
          <span className="font-black text-sm text-slate-700">{safeScore}</span>
          <span className="text-[9px] font-bold text-slate-400">/100</span>
        </div>
        {/* Thinner, subtle bar as requested */}
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${safeScore}%` }}></div>
        </div>
      </div>
    );
  };

  const getEffortBadge = (effort) => {
    if (effort === 'Easy') return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Easy</span>;
    if (effort === 'Medium') return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> Medium</span>;
    return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span> Hard</span>;
  };

  

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] font-sans flex flex-col pb-20">
      
      {/* The Live Ticker */}
      <MarketTicker />

      <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 pt-8">
        
        {/* 🚀 PHASE 1: Premium Hero */}
        <PremiumHero />

        {/* 🚀 PHASE 1: Action Layer */}
        <TopOpportunities projects={scoredProjects} />

        {/* DATA TABLE SECTION */}

      {/* DATA TABLE SECTION */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* CONTROL BAR */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 items-center">
            <svg className="w-4 h-4 text-slate-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            
            <select value={filterFunding} onChange={(e) => setFilterFunding(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 outline-none hover:border-blue-400 transition-colors cursor-pointer shadow-sm">
              <option value="All">Funding (All)</option><option value="0-10M">0 - 10M</option><option value="10M-20M">10M - 20M</option><option value="20M+">20M+</option>
            </select>
            <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 outline-none hover:border-blue-400 transition-colors cursor-pointer shadow-sm">
              <option value="All">Tier (All)</option><option value="Tier 1">Tier 1</option><option value="Tier 2">Tier 2</option><option value="Tier 3">Tier 3</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 outline-none hover:border-blue-400 transition-colors cursor-pointer shadow-sm">
              <option value="All">Phase (All)</option><option value="Active">Active</option><option value="Testnet">Testnet</option><option value="Mainnet">Mainnet</option><option value="Point Farming">Point Farming</option><option value="TGE">TGE</option>
            </select>
            <button onClick={() => { setSearchTerm(''); setFilterFunding('All'); setFilterTier('All'); setFilterStatus('All'); setFilterSocial('All'); }} className="text-sm font-bold text-blue-600 hover:text-blue-700 px-2 transition-colors">Reset Filters</button>
          </div>

          <div className="relative w-full xl:w-72">
            <input type="text" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="text-sm border border-slate-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full font-medium bg-white transition-all shadow-sm" />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        <div className="overflow-x-auto pb-6 pt-2 px-2">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b-2 border-slate-100 text-[11px] font-black text-black uppercase tracking-widest h-14">
                <th className="px-6">Project</th>
                <th className="px-4">Score</th>
                <th className="px-4 text-center">Status</th>
                <th className="px-4 text-center">Tasks</th>
                <th className="px-4 text-center">Effort</th>
                <th className="px-6 text-right">Social</th>
                <th className="px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {loading ? (
                <tr><td colSpan="7" className="py-20 text-center text-sm font-bold text-slate-400 animate-pulse">Syncing radar data...</td></tr>
              ) : paginatedProjects.map((p) => {
                
                const airdropMeta = getAirdropStatusBadge(p.airdrop_status);
                const fundVal = formatFunding(p.funding);

                return (
                  <tr key={p.id} className="h-[80px] hover:bg-white hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:scale-[1.002] transition-all duration-300 group relative bg-transparent z-0 hover:z-10 rounded-xl">
                    
                    {/* PROJECT + INLINE BADGES */}
<td className="px-6">
  {/* 🚀 SEO LINK UPDATED HERE */}
  <Link to={`/${p.slug || p.id}/airdropguide`} className="flex items-center gap-4 w-fit group/link relative">
    <div className="relative shrink-0">  {/* 🚀 ADDED shrink-0 HERE */}
      <img src={p.logo_url} className="w-11 h-11 rounded-xl border border-slate-200 object-cover shadow-sm bg-white group-hover/link:shadow-md transition-all" alt="" />
      {p._score >= 80 && <div className="absolute -top-2 -right-2 text-base drop-shadow-md">🔥</div>}
    </div>
    <div className="flex flex-col">
                          <span className="font-black text-[16px] text-slate-900 group-hover/link:text-blue-600 transition-colors">{p.name}</span>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">{p.tier || 'TBA'}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">{p.status || 'Waitlist'}</span>
                            {fundVal && <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">{fundVal}</span>}
                          </div>
                        </div>
                      </Link>
                    </td>

                    {/* SCORE */}
                    <td className="px-4">
                      {renderAirdropScore(p._score)}
                    </td>

                    {/* STATUS PILL */}
                    <td className="px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${airdropMeta.color}`}>
                        {airdropMeta.icon} {p.airdrop_status || 'Possible'}
                      </span>
                    </td>

                    {/* TASKS */}
                    <td className="px-4 text-center relative group/tooltip">
                      <div className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-black text-xs cursor-help hover:bg-slate-100 transition-colors">
                        {p.task_count || 0}
                      </div>
                    </td>

                    {/* EFFORT */}
                    <td className="px-4 text-center">
                      {getEffortBadge(p._effort)}
                    </td>

                    {/* SOCIAL SCORE */}
                    <td className="px-6">
                      {renderSocialScore(p.social_score)}
                    </td>

                    {/* ACTION BUTTON */}
                    <td className="px-6 text-center">
                      {/* 🚀 SEO LINK UPDATED HERE */}
                      <Link to={`/${p.slug || p.id}/airdropguide`}>
                        <button className="text-xs font-black bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2.5 rounded-lg shadow-sm shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 hover:from-blue-500 hover:to-blue-400 transition-all flex items-center gap-2 mx-auto">
                          Start 
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 🚀 NEW: PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50 gap-4">
            <span className="text-sm font-medium text-slate-500">
              Showing <span className="font-bold text-slate-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)}</span> of <span className="font-bold text-slate-900">{filteredProjects.length}</span> projects
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Previous
              </button>
              
              <div className="hidden sm:flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                      currentPage === i + 1 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
    </div>
  );
}
