import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { supabase } from './supabaseClient';

import { 
  Search, Bell, ChevronRight, ChevronLeft, Zap, Flame, 
  Activity, TrendingUp, Clock, CheckCircle2, ShieldAlert, 
  Wallet, PieChart, BarChart2, Radio, Droplets, Target 
} from 'lucide-react';

// ============================================================================
// GLOBAL HELPERS: Safe Funding Parsers
// ============================================================================

const formatFunding = (amount) => {
  if (!amount || amount === '0') return 'TBA';
  const amountStr = amount.toString();
  if (['tba', 'undisclosed', 'none'].includes(amountStr.toLowerCase())) return amountStr;
  return amountStr.startsWith('$') ? amountStr : `$${amountStr}`;
};

const parseFundingToMillions = (fundingStr) => {
  if (!fundingStr) return 0;
  const cleanStr = fundingStr.toString().toUpperCase().replace(/[^0-9.KMB]/g, '');
  let val = parseFloat(cleanStr.replace(/[^0-9.]/g, '')) || 0;
  if (cleanStr.includes('B')) val *= 1000;
  else if (cleanStr.includes('K')) val /= 1000;
  return val; 
};

// ============================================================================
// 1. HERO DASHBOARD (Greeting & Top Opportunity)
// ============================================================================
const HeroDashboard = ({ topProject }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 mb-10 bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200/60 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"></div>
      
      <div className="flex-1 z-10 flex flex-col justify-center">
        <h1 className="text-[28px] lg:text-[32px] font-black text-slate-900 tracking-tight mb-2">
          Good evening, Sailor 👋
        </h1>
        <p className="text-sm font-medium text-slate-500 mb-8 max-w-md leading-relaxed">
          Track, farm and earn from the best airdrop opportunities appointed
        </p>
        
        <div className="flex flex-wrap items-center gap-6 lg:gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Target size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Active Projects</p>
              <p className="text-lg font-black text-slate-900 leading-none">14</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pending Tasks</p>
              <p className="text-lg font-black text-slate-900 leading-none">2</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Avg. Farm Cost</p>
              <p className="text-lg font-black text-slate-900 leading-none">$0 – $15</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[480px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 lg:p-7 text-white relative overflow-hidden z-10 shrink-0 shadow-xl shadow-indigo-900/10">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
        
        <div className="flex items-center gap-2 mb-6">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-100 backdrop-blur-sm">
            <Flame size={12} className="text-orange-400" /> Top Opportunity
          </span>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <img src={topProject?.logo_url || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-white" alt="Project Logo" />
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{topProject?.name || 'Loading...'}</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{topProject?.tier || 'Tier 2'}</span>
            </div>
          </div>
          
          <div className="w-14 h-14 rounded-full border-[3px] border-emerald-400/30 flex items-center justify-center bg-emerald-400/10 relative">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 p-0.5" viewBox="0 0 36 36">
              <path className="text-emerald-400" strokeDasharray="100, 100" strokeDashoffset="20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div className="flex flex-col items-center justify-center relative z-10">
              <span className="text-lg font-black text-white leading-none">{topProject?._score || 49}</span>
            </div>
            <span className="absolute -bottom-5 w-[200%] text-center text-[8px] font-black uppercase tracking-widest text-slate-400">Airdrop Score</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm mb-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-slate-400 text-xs">Raised</span>
            <span className="font-bold text-white">{topProject?.funding ? formatFunding(topProject.funding) : 'TBA'}</span>
          </div>
          
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-slate-400 text-xs">Time Required</span>
            <span className="font-bold text-emerald-400">{topProject?.total_time_estimate ? `~${topProject.total_time_estimate} mins` : '~15 mins'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">Tasks</span>
            <span className="font-bold text-white">{topProject?.task_count || 2} available</span>
          </div>
        </div>

        <Link to={`/${topProject?.slug || topProject?.id}/airdropguide`}>
          <button className="w-fit px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-black text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-white/5">
            Start Farming <ChevronRight size={16} />
          </button>
        </Link>
      </div>
    </div>
  );
};

// ============================================================================
// 2. TOP OPPORTUNITIES GRID
// ============================================================================
const TopOpportunitiesGrid = ({ projects }) => {
  const top4 = projects && projects.length > 0 
    ? [...projects].sort((a, b) => (b._score || 0) - (a._score || 0)).slice(0, 4) 
    : [];

  if (top4.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Today's Top Opportunities</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">AI Selected</span>
        </div>
        <button className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm transition-colors">
          View all <ChevronRight size={12} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {top4.map((p, idx) => {
          const score = p._score || 0;
          let scoreColor = score >= 40 ? 'text-emerald-500 border-emerald-500' : 'text-blue-500 border-blue-500';
          if(score < 20) scoreColor = 'text-slate-500 border-slate-300';

          return (
            <div key={p.id || idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={p.logo_url} className="w-10 h-10 rounded-full object-cover border border-slate-100 bg-white" alt="" />
                  <div>
                    <h3 className="font-bold text-[15px] text-slate-900 leading-tight">{p.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.tier || 'Tier 2'}</p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${scoreColor}`}>
                  <span className="text-xs font-black">{score}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded text-emerald-600 border border-emerald-100 bg-white shadow-sm">High Potential</span>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded text-blue-600 border border-blue-100 bg-white shadow-sm">{p._effort === 'Easy' ? 'Low Effort' : 'Point Farming'}</span>
              </div>

              <div className="flex justify-between items-end mb-5">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Funding</span>
                  <span className="font-bold text-sm text-slate-900">{formatFunding(p.funding)}</span>
                </div>
                
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Time Req.</span>
                  <span className="font-bold text-sm text-slate-900">{p.total_time_estimate ? `~${p.total_time_estimate}m` : '~20m'}</span>
                </div>
              </div>

              <Link to={`/${p.slug || p.id}/airdropguide`} className="w-full">
                <button className="w-full py-2.5 text-blue-600 font-bold text-sm bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  Start Now <ChevronRight size={14} />
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 3. MIDDLE WIDGETS (Radar, Whales, Sentiment) - Dynamic Live Data Pipeline
// ============================================================================
const AnalyticsWidgets = ({ projects }) => {
  const [fgi, setFgi] = useState({ value: 68, label: 'Greed' });

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch('https://api.alternative.me/fng/');
        const data = await res.json();
        if (data?.data?.[0]) {
          setFgi({
            value: parseInt(data.data[0].value),
            label: data.data[0].value_classification
          });
        }
      } catch (e) {
        console.error("Failed to fetch live sentiment index:", e);
      }
    };
    fetchSentiment();
  }, []);

  const getProjectIntel = (nameFallback) => {
    const found = projects?.find(p => p.name?.toLowerCase() === nameFallback.toLowerCase());
    return found || { name: nameFallback, logo_url: `https://api.dicebear.com/7.x/initials/svg?seed=${nameFallback}`, slug: '#' };
  };

  const radarList = ['Knidos', 'ArcNova', 'SimpleChain'].map(name => getProjectIntel(name));
  const whaleList = ['Knidos', 'Xeffy', 'StabilizerFi'].map(name => getProjectIntel(name));

  const getSentimentColor = (val) => {
    if (val >= 75) return 'text-emerald-500 border-t-emerald-500 border-r-emerald-500';
    if (val >= 50) return 'text-emerald-400 border-t-emerald-400 border-r-emerald-400';
    if (val >= 40) return 'text-amber-500 border-t-amber-500 border-r-amber-500';
    return 'text-red-500 border-t-red-500 border-r-red-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
      
      {/* Widget 1: AI Radar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-purple-50 rounded-full blur-2xl group-hover:bg-purple-100 transition-colors"></div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              <Radio size={12} /> AI Narrative Radar
            </span>
            <ChevronRight size={16} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-black text-purple-600 tracking-tight leading-tight mb-4 max-w-[160px]">
            AI Agents is Dominating
          </h3>
          <div className="mt-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Hot Projects</span>
            <div className="space-y-2">
              {radarList.map((proj, i) => (
                <Link key={i} to={proj.slug !== '#' ? `/${proj.slug || proj.id}/airdropguide` : '#'} className="flex items-center gap-2 hover:text-purple-600 transition-colors w-fit">
                  <img src={proj.logo_url} className="w-4 h-4 rounded-full object-cover border border-slate-100 bg-white shrink-0" alt="" />
                  <span className="text-xs font-bold text-slate-700 hover:text-inherit">{proj.name}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 border border-purple-200 rounded-full flex items-center justify-center opacity-50 pointer-events-none">
            <div className="w-16 h-16 border border-purple-200 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-purple-400 rounded-full blur-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget 2: Whale Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors"></div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <Droplets size={12} /> Whale Activity
            </span>
            <ChevronRight size={16} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-black text-blue-600 tracking-tight leading-tight mb-4 max-w-[160px]">
            3 whales accumulating
          </h3>
          <div className="mt-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Top Activity</span>
            <div className="space-y-2">
              {whaleList.map((proj, i) => (
                <Link key={i} to={proj.slug !== '#' ? `/${proj.slug || proj.id}/airdropguide` : '#'} className="flex items-center gap-2 hover:text-blue-600 transition-colors w-fit">
                  <img src={proj.logo_url} className="w-4 h-4 rounded-full object-cover border border-slate-100 bg-white shrink-0" alt="" />
                  <span className="text-xs font-bold text-slate-700 hover:text-inherit">{proj.name}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <svg className="absolute right-[-20px] bottom-10 w-32 h-16 opacity-50 text-blue-400 pointer-events-none" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0 40 Q 15 20, 30 40 T 60 40 T 90 20 L 100 0" />
          </svg>
        </div>
      </div>

      {/* Widget 3: Market Sentiment (Live API Driven) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <TrendingUp size={12} /> Market Sentiment
            </span>
            <ChevronRight size={16} className="text-slate-400" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Overall Sentiment</span>
          <h3 className={`text-2xl font-black tracking-tight leading-tight mb-6 ${fgi.value >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {fgi.label}
          </h3>
          <div className="mt-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Fear & Greed Index</span>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-10 overflow-hidden flex items-end justify-center">
                <div className={`absolute top-0 w-16 h-16 rounded-full border-4 border-slate-100 rotate-45 ${getSentimentColor(fgi.value)}`}></div>
                <div className="text-lg font-black text-slate-900 pb-1">{fgi.value}</div>
              </div>
              <span className={`text-xs font-black mt-2 ${fgi.value >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>{fgi.label}</span>
            </div>
          </div>
          
          <svg className="absolute right-0 bottom-10 w-24 h-12 opacity-50 text-emerald-400 pointer-events-none" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="0,50 20,30 40,40 60,10 80,20 100,5" />
          </svg>
        </div>
      </div>

    </div>
  );
};

// ============================================================================
// 4. LATEST ALPHA WIDGET (Dynamic Timeline Feed)
// ============================================================================
const LatestAlpha = ({ events }) => {
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Just now';
    const now = new Date();
    const posted = new Date(dateString);
    const diffMs = now - posted;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 6000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return posted.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getTypeStyles = (type) => {
    const lower = (type || '').toLowerCase();
    if (lower.includes('task') || lower.includes('galxe')) return 'text-emerald-500 bg-emerald-50/50 border-emerald-100/50';
    if (lower.includes('fund') || lower.includes('raise')) return 'text-blue-500 bg-blue-50/50 border-blue-100/50';
    if (lower.includes('whale') || lower.includes('alert')) return 'text-indigo-500 bg-indigo-50/50 border-indigo-100/50';
    if (lower.includes('move') || lower.includes('gas')) return 'text-rose-500 bg-rose-50/50 border-rose-100/50';
    return 'text-purple-500 bg-purple-50/50 border-purple-100/50';
  };

  return (
    <div className="mt-12 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Zap size={20} className="text-amber-500 fill-amber-500" /> Latest Alpha
        </h3>
        <button className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm transition-colors">
          View all <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar -mx-2 px-2 snap-x">
        {events && events.length > 0 ? (
          events.map((ev) => {
            const projectInfo = ev.projects || {};
            const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${projectInfo.name || 'Alpha'}`;

            return (
              <div key={ev.id} className="min-w-[280px] w-[280px] bg-white border border-slate-200 rounded-2xl p-4 shrink-0 snap-start shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getTypeStyles(ev.update_type)}`}>
                      <Radio size={10} className="shrink-0" /> {ev.update_type || 'Announcement'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {getRelativeTime(ev.date_posted)}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 line-clamp-3 leading-snug mb-4">
                    {ev.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-2 min-w-0">
                    <img 
                      src={projectInfo.logo_url || fallbackLogo} 
                      className="w-5 h-5 rounded-full object-cover border border-slate-100 bg-slate-50" 
                      alt="" 
                    />
                    <span className="text-xs font-bold text-slate-500 truncate max-w-[120px]">
                      {projectInfo.name || 'General Intel'}
                    </span>
                  </div>
                  
                  {ev.source_link && (
                    <a 
                      href={ev.source_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider whitespace-nowrap"
                    >
                      Source →
                    </a>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-white/50">
            <p className="text-sm font-bold text-slate-400">No recent alpha logs found</p>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Real-time alerts will generate here dynamically.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function AirdropsPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [investorLogos, setInvestorLogos] = useState({});
  const [alphaEvents, setAlphaEvents] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFunding, setFilterFunding] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => { fetchProjects(); }, []);

  const calculateScore = (p) => {
    const social = p.social_score || 0;
    const fundingVal = parseFundingToMillions(p.funding);
    const fundingScore = Math.min(fundingVal / 20, 1) * 100;
    let tierScore = 30;
    if (p.tier?.includes('1')) tierScore = 100;
    else if (p.tier?.includes('2')) tierScore = 70;
    const taskScore = Math.min((p.task_count || 0) * 10, 100);
    return Math.round(social * 0.4 + fundingScore * 0.3 + tierScore * 0.2 + taskScore * 0.1);
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
      _fundingVal: parseFundingToMillions(p.funding)
    })),
    [projects]
  );

  const fetchProjects = async () => {
    try {
      const CACHE_KEY = 'radar_projects_cache';
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          const cacheItems = parsedCache.data ? parsedCache.data : parsedCache; 
          if (Array.isArray(cacheItems)) {
            setProjects(cacheItems);
            setFilteredProjects(cacheItems);
            setLoading(false); 
          }
        } catch (err) { console.warn("Cache error"); }
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, slug, name, logo_url, funding, lead_investors, tier, status, airdrop_status, total_time_estimate, total_cost_estimate, task_count, social_score, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const fetchedData = data || [];
      const investorNames = [...new Set(fetchedData.flatMap(p => (p.lead_investors || '').split(',').map(i => i.trim())).filter(Boolean))];

      if (investorNames.length > 0) {
        const { data: investors } = await supabase.from('pioneer_profiles').select('name, logo_url, website').in('name', investorNames);
        const logoMap = {};
        investors?.forEach(inv => {
          let cleanDomain = null;
          if (inv.website) {
            try { cleanDomain = new URL(inv.website.startsWith('http') ? inv.website : `https://${inv.website}`).hostname.replace('www.', ''); } catch(e){}
          }
          logoMap[inv.name] = cleanDomain ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128` : inv.logo_url;
        });
        setInvestorLogos(logoMap);
      }
      
      const { data: alphaData, error: alphaError } = await supabase
        .from('discord_activities')
        .select(`
          id,
          update_type,
          content,
          date_posted,
          source_link,
          projects (
            name,
            logo_url,
            slug
          )
        `)
        .order('date_posted', { ascending: false })
        .limit(8);

      if (!alphaError && alphaData) {
        setAlphaEvents(alphaData);
      }
      
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: fetchedData, timestamp: Date.now() }));
      setProjects(fetchedData);
      setFilteredProjects(fetchedData);
      
    } catch (e) { console.error("Fetch Error:", e); } finally { setLoading(false); }
  };
  
  useEffect(() => {
    let result = [...scoredProjects].sort((a, b) => b._score - a._score);
    if (searchTerm) result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterFunding !== 'All') {
      result = result.filter(p => {
        const val = p._fundingVal || 0;
        if (filterFunding === '0-10M') return val >= 0 && val <= 10;
        if (filterFunding === '10M-20M') return val > 10 && val <= 20;
        if (filterFunding === '20M+') return val > 20;
        return true;
      });
    }
    if (filterTier !== 'All') result = result.filter(p => p.tier === filterTier);
    if (filterStatus !== 'All') result = result.filter(p => p.status === filterStatus);

    setFilteredProjects(result);
    setCurrentPage(1); 
  }, [searchTerm, filterFunding, filterTier, filterStatus, scoredProjects]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="w-full h-full pb-20 font-sans text-slate-900 relative">
      <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 pt-0 md:pt-2">
        
        <HeroDashboard topProject={scoredProjects[0]} />
        <TopOpportunitiesGrid projects={scoredProjects} />
        <AnalyticsWidgets projects={scoredProjects} />

        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-5">Projects Tracker</h2>
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <select value={filterFunding} onChange={(e) => setFilterFunding(e.target.value)} className="text-xs font-bold border border-slate-200 rounded-full px-4 py-2 bg-white text-slate-700 outline-none hover:border-blue-300 transition-colors cursor-pointer shadow-sm appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M3%204.5l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-no-repeat bg-[right_12px_center]">
              <option value="All">Funding (All)</option><option value="0-10M">0 - 10M</option><option value="10M-20M">10M - 20M</option><option value="20M+">20M+</option>
            </select>
            <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="text-xs font-bold border border-slate-200 rounded-full px-4 py-2 bg-white text-slate-700 outline-none hover:border-blue-300 transition-colors cursor-pointer shadow-sm appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M3%204.5l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-no-repeat bg-[right_12px_center]">
              <option value="All">Tier (All)</option><option value="Tier 1">Tier 1</option><option value="Tier 2">Tier 2</option><option value="Tier 3">Tier 3</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs font-bold border border-slate-200 rounded-full px-4 py-2 bg-white text-slate-700 outline-none hover:border-blue-300 transition-colors cursor-pointer shadow-sm appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M3%204.5l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-no-repeat bg-[right_12px_center]">
              <option value="All">Phase (All)</option>
              <option value="Waitlist">Waitlist</option>
              <option value="Testnet">Testnet</option>
              <option value="Mainnet">Mainnet</option>
              <option value="Point Farming">Point Farming</option>
              <option value="TGE">TGE</option>
            </select>
            <button className="text-xs font-bold border border-slate-200 rounded-full px-4 py-2 bg-white text-slate-700 hover:border-blue-300 transition-colors shadow-sm flex items-center gap-1.5">
              <BarChart2 size={14} /> More Filters
            </button>
          </div>

          <div className="relative w-full xl:w-72">
            <input type="text" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="text-xs border border-slate-200 pl-9 pr-4 py-2.5 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full font-medium bg-white transition-all shadow-sm" />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto pb-4 pt-2 px-2">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest h-12">
                  <th className="px-6">Project</th>
                  <th className="px-4 text-center">Score</th>
                  <th className="px-4 text-center">Time</th>
                  <th className="px-4 text-center">Cost</th>
                  <th className="px-4 text-center">Status</th>
                  <th className="px-4 text-center">Tasks</th>
                  <th className="px-4 text-center">Phase</th>
                  <th className="px-6 text-center">Investors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="8" className="py-20 text-center text-sm font-bold text-slate-400 animate-pulse">Syncing radar data...</td></tr>
                ) : paginatedProjects.map((p) => {
                  
                  const score = p._score || 0;
                  const isZeroCost = !p.total_cost_estimate || p.total_cost_estimate === '0' || p.total_cost_estimate === '$0';
                  
                  return (
                    <tr key={p.id} className="h-[72px] hover:bg-slate-50/50 transition-colors group">
                      
                      <td className="px-6">
                        <Link to={`/${p.slug || p.id}/airdropguide`} className="flex items-center gap-4 w-fit">
                          <img src={p.logo_url} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm bg-white" alt="" />
                          <div className="flex flex-col">
                            <span className="font-bold text-[14px] text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 w-fit mt-1">{p.tier || 'TBA'}</span>
                          </div>
                        </Link>
                      </td>

                      <td className="px-4 text-center">
                        <div className={`mx-auto w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${score >= 40 ? 'border-emerald-500 text-emerald-600' : 'border-blue-500 text-blue-600'}`}>
                          <span className="text-[11px] font-black">{score}</span>
                        </div>
                      </td>

                      <td className="px-4 text-center">
                        <span className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600">
                          <Clock size={12} className="text-slate-400" /> ~{p.total_time_estimate || 30}m
                        </span>
                      </td>

                      <td className="px-4 text-center">
                        <span className={`text-[13px] font-black ${isZeroCost ? 'text-emerald-500' : 'text-slate-900'}`}>
                          {isZeroCost ? '$0' : (p.total_cost_estimate.startsWith('$') ? p.total_cost_estimate : `$${p.total_cost_estimate}`)}
                        </span>
                      </td>

                      <td className="px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border ${p.airdrop_status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : p.airdrop_status === 'Possible' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {p.airdrop_status === 'Confirmed' ? '✨ CONFIRMED' : p.airdrop_status === 'Possible' ? '⚡ POSSIBLE' : '🕒 UNCONFIRMED'}
                        </span>
                      </td>

                      <td className="px-4 text-center">
                        <span className="text-[13px] font-bold text-slate-700">{p.task_count || 0}</span>
                      </td>

                      <td className="px-4 text-center">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                          {p.status || 'Waitlist'}
                        </span>
                      </td>

                      <td className="px-6 text-center">
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex items-center">
                            {(p.lead_investors || '').split(',').slice(0, 3).map((name, index) => {
                              const logo = investorLogos[name.trim()];
                              return logo ? (
                                <img key={index} src={logo} className="-ml-2 w-6 h-6 rounded-full border-[1.5px] border-white object-cover" />
                              ) : (
                                <div key={index} className="-ml-2 w-6 h-6 rounded-full border-[1.5px] border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">{name.trim().substring(0,2)}</div>
                              );
                            })}
                            {(p.lead_investors || '').split(',').length > 3 && (
                              <div className="-ml-2 w-6 h-6 rounded-full bg-slate-50 border-[1.5px] border-white flex items-center justify-center text-[9px] font-bold text-slate-500">
                                +{(p.lead_investors || '').split(',').length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-slate-900 w-10 text-right">
                            {formatFunding(p.funding)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-2xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Showing <span className="text-slate-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)}</span> of <span className="text-slate-900">{filteredProjects.length}</span>
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                
                <div className="hidden sm:flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
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
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-1"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <LatestAlpha events={alphaEvents} />
        
      </div>
    </div>
  );
}