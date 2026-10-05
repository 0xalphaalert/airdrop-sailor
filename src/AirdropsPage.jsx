import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { supabase } from './supabaseClient';
import AirdropsPageMobile from './mobile/pages/AirdropsPageMobile';
import useIsMobile from "./hooks/useIsMobile";
import SEO from './components/SEO';

import { 
  Search, Bell, ChevronRight, ChevronLeft, ChevronDown, Zap, Flame, 
  Activity, TrendingUp, Clock, CheckCircle2, ShieldAlert, 
  Wallet, PieChart, BarChart2, Radio, Droplets, Target,
  LayoutGrid, Layers, Coins, Cpu, Image as ImageIcon,
  Gamepad2, Users, Server, FlaskConical, Filter,
  ArrowUpRight, ArrowDownRight, Database, Sparkles, List
} from 'lucide-react';

// ============================================================================
// GLOBAL HELPERS
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
// 1. HERO BANNER
// ============================================================================
const HeroBanner = ({ onExploreClick }) => {
  return (
    <div className="relative w-full h-[320px] rounded-[32px] mb-6 overflow-hidden flex items-center bg-[#07132a] shadow-sm border border-slate-200/50">
      
      <div 
        className="absolute inset-0 bg-cover bg-right md:bg-[right_center] z-0"
        style={{ 
          backgroundImage: `url('/Astronaut Chasing Crypto Airdrops at Sea_2.png')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#07132a] via-[#07132a]/90 md:via-[#07132a]/50 to-transparent"></div>
      </div>

      <div className="relative z-10 px-6 md:px-10 w-full flex justify-between items-start">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-[44px] font-black text-white tracking-tight leading-[1.1] mb-5">
            Discover The Best <br/> <span className="text-blue-400">Airdrop</span> Opportunities
          </h1>
          <p className="text-slate-200 font-medium text-lg mb-8 max-w-md">
            Track, farm and earn from the best airdrops, testnets and early projects.
          </p>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onExploreClick} 
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 cursor-pointer"
            >
              Explore Airdrops <ChevronRight size={18} />
            </button>
            <Link to="/tracker" className="px-6 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer">
              <CheckCircle2 size={18} /> View Daily Tasks
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 px-4 py-3 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Airdrop Alpha</p>
            <p className="text-xs font-medium text-slate-300">Latest opportunities updated every hour</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. DASHBOARD STATS ROW
// ============================================================================
const DashboardStatsRow = ({ stats }) => {
  const farmTrend = stats.farmCostTrend || 0;
  const isFarmCostDown = farmTrend < 0;
  // Strip the negative sign since we use an arrow icon to indicate direction
  const formattedFarmTrend = `${Math.abs(farmTrend).toFixed(1)}% from last week`;

  const statCards = [
    { 
      title: 'Total Projects', 
      subtitle: 'All tracked projects',
      value: stats.totalProjects || 12, 
      trendText: `${stats.newProjectsThisWeek || 0} this week`, 
      trendIcon: <ArrowUpRight size={12} strokeWidth={3} />,
      trendClass: 'text-emerald-500', 
      icon: <Target size={18} className="text-white" strokeWidth={2.5} />, 
      iconBg: 'bg-[#3b82f6] shadow-md shadow-blue-500/20',
      hex: '#3b82f6',
      bgGraphic: <Layers size={85} className="text-blue-500" strokeWidth={1} />,
      wavePathLine: "M 0 15 C 20 15 35 5 55 12 C 75 18 85 5 100 8",
      wavePathFill: "M 0 15 C 20 15 35 5 55 12 C 75 18 85 5 100 8 L 100 30 L 0 30 Z",
      dot: { x: 100, y: 8 }
    },
    { 
      title: 'Active Tasks', 
      subtitle: 'Tasks in progress',
      value: stats.totalTasks || 16, 
      trendText: `${stats.newTasksThisWeek || 0} this week`, 
      trendIcon: <ArrowUpRight size={12} strokeWidth={3} />,
      trendClass: 'text-emerald-500', 
      icon: <CheckCircle2 size={18} className="text-white" strokeWidth={2.5} />, 
      iconBg: 'bg-[#f97316] shadow-md shadow-orange-400/20',
      hex: '#f97316',
      bgGraphic: <List size={85} className="text-orange-400" strokeWidth={1} />,
      wavePathLine: "M 0 20 C 20 12 40 22 60 12 C 75 5 85 12 100 8",
      wavePathFill: "M 0 20 C 20 12 40 22 60 12 C 75 5 85 12 100 8 L 100 30 L 0 30 Z",
      dot: { x: 100, y: 8 }
    },
    { 
      title: 'Avg. Farm Cost', 
      subtitle: 'Per project (USD)',
      value: `$${(stats.avgFarmCost || 0.13).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      trendText: formattedFarmTrend, 
      trendIcon: isFarmCostDown ? <ArrowDownRight size={12} strokeWidth={3} /> : <ArrowUpRight size={12} strokeWidth={3} />,
      trendClass: isFarmCostDown ? 'text-rose-500' : 'text-emerald-500', 
      icon: <Clock size={18} className="text-white" strokeWidth={2.5} />, 
      iconBg: 'bg-[#10b981] shadow-md shadow-emerald-400/20',
      hex: '#10b981',
      bgGraphic: <Database size={85} className="text-emerald-400" strokeWidth={1} />,
      wavePathLine: "M 0 18 C 20 25 40 8 65 18 C 80 22 90 8 100 12",
      wavePathFill: "M 0 18 C 20 25 40 8 65 18 C 80 22 90 8 100 12 L 100 30 L 0 30 Z",
      dot: { x: 100, y: 12 }
    },
    { 
      title: 'Total Funding', 
      subtitle: 'Tracked projects',
      value: stats.totalFundingFormatted || '$23.4B', 
      trendText: `${stats.newRoundsThisWeek || 11} new rounds`, 
      trendIcon: <ArrowUpRight size={12} strokeWidth={3} />,
      trendClass: 'text-emerald-500', 
      icon: <Wallet size={18} className="text-white" strokeWidth={2.5} />, 
      iconBg: 'bg-[#3b82f6] shadow-md shadow-blue-500/20',
      hex: '#3b82f6',
      bgGraphic: <BarChart2 size={85} className="text-blue-500" strokeWidth={1} />,
      wavePathLine: "M 0 22 C 20 10 40 25 65 12 C 80 5 90 15 100 8",
      wavePathFill: "M 0 22 C 20 10 40 25 65 12 C 80 5 90 15 100 8 L 100 30 L 0 30 Z",
      dot: { x: 100, y: 8 }
    },
    { 
      title: 'Potential Rewards', 
      subtitle: 'From active projects',
      value: '$1.2M+', 
      trendText: 'High potential', 
      trendIcon: <Sparkles size={12} strokeWidth={3} />,
      trendClass: 'text-purple-500', 
      icon: <Flame size={18} className="text-white" strokeWidth={2.5} />, 
      iconBg: 'bg-[#a855f7] shadow-md shadow-purple-500/20',
      hex: '#a855f7',
      bgGraphic: <Sparkles size={85} className="text-purple-500" strokeWidth={1} />,
      wavePathLine: "M 0 25 C 25 25 40 5 65 15 C 80 22 90 5 100 5",
      wavePathFill: "M 0 25 C 25 25 40 5 65 15 C 80 22 90 5 100 5 L 100 30 L 0 30 Z",
      dot: { x: 100, y: 5 }
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {statCards.map((stat, idx) => (
        <div 
          key={idx} 
          className="bg-white rounded-[20px] p-4 relative overflow-hidden border border-[#E8EDF5] shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-[148px]"
        >
          {/* Faded Background Graphic (Simulating 3D assets) */}
          <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none rotate-[-10deg]">
            {stat.bgGraphic}
          </div>

          {/* Top Row: Icon & Text */}
          <div className="relative z-10 flex items-center gap-3 mb-auto">
            <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${stat.iconBg}`}>
              {stat.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] leading-tight mb-0.5">{stat.title}</h3>
              <p className="text-[10px] font-medium text-slate-400 leading-tight">{stat.subtitle}</p>
            </div>
          </div>
          
          {/* Bottom Row: Value & Trend */}
          <div className="relative z-10 mb-2">
            {/* Reduced size to text-2xl and weight to font-extrabold */}
            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight leading-none mb-1.5">
              {stat.value}
            </h2>
            <div className={`flex items-center gap-1 text-[11px] font-bold tracking-wide ${stat.trendClass}`}>
              {stat.trendIcon} <span>{stat.trendText}</span>
            </div>
          </div>

          {/* Clean SVG Bottom Wavy Chart */}
          <div className="absolute bottom-0 left-0 w-full h-[36px] pointer-events-none">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id={`grad-${idx}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={stat.hex} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={stat.hex} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={stat.wavePathFill} fill={`url(#grad-${idx})`} />
              <path 
                d={stat.wavePathLine} 
                fill="none" 
                stroke={stat.hex} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <circle cx={stat.dot.x} cy={stat.dot.y} r="2.5" fill={stat.hex} stroke="white" strokeWidth="1" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// 3. TOP OPPORTUNITIES GRID
// ============================================================================
const TopOpportunitiesGrid = ({ projects }) => {
  const top4 = projects && projects.length > 0 
    ? [...projects].sort((a, b) => (b._score || 0) - (a._score || 0)).slice(0, 4) 
    : [];

  if (top4.length === 0) return null;

  const getScoreStyles = (score) => {
    if (score >= 80) return 'text-blue-600 border-blue-600';
    if (score >= 50) return 'text-blue-600 border-blue-600';
    return 'text-slate-400 border-slate-200';
  };

  // Helper to color-code the Airdrop Status dynamically
  const getAirdropColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed') return 'text-emerald-600';
    if (s === 'possible') return 'text-amber-500';
    if (s === 'unlikely') return 'text-slate-400';
    return 'text-blue-600'; // Default for Unconfirmed
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Flame size={18} className="text-orange-500 fill-orange-500" /> Today's Top Opportunities
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Handpicked high potential airdrops and tasks for you.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {top4.map((p, idx) => {
          const score = p._score || 0;
          const airdropColor = getAirdropColor(p.airdrop_status);
          
          return (
            <div key={p.id || idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-blue-300 transition-all hover:shadow-md overflow-hidden relative">
              
              {/* TOP HALF: Compact Banner & Overlay */}
              <div className="relative h-24 w-full bg-slate-900">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${p.banner_url || p.logo_url}')`, opacity: 0.6 }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] to-transparent opacity-90"></div>
                
                {/* Compact Banner Text */}
                <div className="absolute bottom-3 left-4">
                  <h3 className="text-white font-black text-sm tracking-tight leading-none mb-1 shadow-sm uppercase">{p.name}</h3>
                  <p className="text-slate-300 text-[8px] font-bold uppercase tracking-widest leading-snug max-w-[140px] truncate">
                    DECENTRALIZED PROTOCOL
                  </p>
                </div>
              </div>

              {/* OVERLAPPING ELEMENTS */}
              <div className="px-4 pt-2 pb-4 flex flex-col flex-1 relative">
                
                {/* Score Badge (Overlapping the banner) */}
                <div className="absolute -top-7 right-4 z-10">
                  <div className="bg-white p-1 rounded-full shadow-sm">
                    <div className={`w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center ${getScoreStyles(score)}`}>
                      <span className="text-sm font-black tabular">{score}</span>
                    </div>
                  </div>
                </div>

                {/* Hot Tag (Overlapping the banner slightly) */}
                <div className="absolute -top-3 left-4">
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-orange-600 bg-white px-2 py-1 rounded-full shadow-sm">
                    <Flame size={10} className="fill-orange-500" /> HOT
                  </span>
                </div>

                {/* Logo & Category Tags */}
                <div className="flex items-center gap-3 mt-4 mb-4">
                  <img src={p.logo_url} className="w-10 h-10 rounded-xl object-cover border border-slate-100 bg-white shadow-sm shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-slate-900 leading-tight mb-1 truncate">{p.name}</h3>
                    <div className="flex gap-1.5 flex-wrap">
                      {/* Truncate width removed so "POINT FARMING" fits perfectly */}
                      <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider truncate">
                        {p.status || 'TBA'}
                      </span>
                      {/* CRYPTO tag removed completely */}
                    </div>
                  </div>
                </div>

                {/* Stats Row - Flex Justify Between puts Tier on the far right */}
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-4">
                  <div className="flex items-center">
                    <Database size={12} className="text-slate-400 mr-1" />
                    <span>Raised <span className="font-bold text-slate-900">{formatFunding(p.funding)}</span></span>
                  </div>
                  <div className="flex items-center">
                    <Sparkles size={12} className="text-slate-400 mr-1" />
                    <span>{p.tier || 'Tier 3'}</span>
                  </div>
                </div>

                {/* Airdrop Status & Time Box */}
                <div className="flex justify-between items-center mb-4 bg-slate-50/80 rounded-xl p-3 border border-slate-100 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Zap size={12} className="fill-blue-600" />
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5 leading-none">Airdrop</span>
                      {/* Pulling from airdrop_status and allowing full text width */}
                      <span className={`font-black text-[11px] uppercase tracking-wider leading-none block ${airdropColor}`}>
                        {p.airdrop_status || 'Unconfirmed'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-px h-6 bg-slate-200 mx-1 shrink-0"></div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 shrink-0">
                      <Clock size={12} />
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5 leading-none">Time<br/>Required</span>
                      <span className="font-black text-xs text-slate-900 leading-none">{p.total_time_estimate ? `~${p.total_time_estimate}m` : 'TBA'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Link to={`/${p.slug || p.id}/airdropguide`} className="w-full">
                  <button className="w-full py-2.5 text-white font-black text-xs uppercase tracking-wider bg-[#2563eb] hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    View Tasks <ChevronRight size={14} strokeWidth={3} />
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 4. MIDDLE WIDGETS (Track Progress, TGE, Testnets)
// ============================================================================
const MiddleWidgets = () => {
  const { user } = useAuth();
  
  // Widget 1 State (Track Progress)
  const [userProgress, setUserProgress] = useState({
    completed: 0,
    pending: 0,
    overdue: 0,
    total: 0,
    engagementScore: "0.00",
    maxCount: 10,
    weeklyData: Array(7).fill({ d: '', h: '0%', count: 0 })
  });

  // Widget 2 State (TGE & Claim)
  const [tgeData, setTgeData] = useState([]);
  const [isTgeLoading, setIsTgeLoading] = useState(true);
  const [currentTgeIndex, setCurrentTgeIndex] = useState(0);

  // Widget 3 State (Active Testnets)
  const [testnetsData, setTestnetsData] = useState([]);
  const [isTestnetsLoading, setIsTestnetsLoading] = useState(true);
  const [currentTestnetIndex, setCurrentTestnetIndex] = useState(0);

  // Fetch Live Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      try {
        // --- 1. Fetch Profile Engagement Score ---
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('profile_engagement_score')
          .eq('auth_id', user.id)
          .single();

        // --- 2. Fetch User Tasks Tracking ---
        const { data: tasks } = await supabase
          .from('tracker_user_tasks')
          .select('status, next_due_time, last_completed_at, completion_count')
          .eq('auth_id', user.id);

        let completed = 0;
        let pending = 0;
        let overdue = 0;
        const now = new Date();

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            dateStr: d.toISOString().split('T')[0],
            display: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count: 0
          };
        });

        if (tasks && tasks.length > 0) {
          tasks.forEach(t => {
            if (t.status === 'completed') {
              completed++;
            } else if (t.status === 'pending') {
              if (t.next_due_time && new Date(t.next_due_time) < now) {
                overdue++;
              } else {
                pending++;
              }
            } else {
               pending++;
            }

            if (t.last_completed_at) {
              const compDate = t.last_completed_at.split('T')[0];
              const dayMatch = last7Days.find(d => d.dateStr === compDate);
              if (dayMatch) {
                dayMatch.count += 1;
              }
            }
          });
        }

        const maxCount = Math.max(...last7Days.map(d => d.count), 10);
        const weeklyData = last7Days.map(d => ({
          d: d.display,
          h: `${(d.count / maxCount) * 100}%`,
          count: d.count
        }));

        setUserProgress({
          completed,
          pending,
          overdue,
          total: completed + pending + overdue,
          engagementScore: profile?.profile_engagement_score ? parseFloat(profile.profile_engagement_score).toFixed(0) + '%' : "0%",
          weeklyData,
          maxCount
        });

        // --- 3. Fetch TGE & Claim Opportunities ---
        const { data: tgeTasks, error: tgeError } = await supabase
          .from('tasks')
          .select(`
            id, 
            name, 
            link, 
            status, 
            end_date, 
            project_id, 
            projects!inner(id, name, logo_url, banner_url, slug)
          `)
          .eq('task_category', 'TGE & Claim')
          .order('created_at', { ascending: false });

        if (!tgeError && tgeTasks) {
          setTgeData(tgeTasks);
        }

        // --- 4. Fetch Active Testnets ---
        const { data: testnetProjects, error: testnetError } = await supabase
          .from('projects')
          .select('id, name, logo_url, banner_url, slug, task_count, status')
          .eq('status', 'Incentivized Testnet')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (!testnetError && testnetProjects) {
          setTestnetsData(testnetProjects);
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setIsTgeLoading(false);
        setIsTestnetsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  // TGE Carousel Timer
  useEffect(() => {
    if (tgeData.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTgeIndex(prev => (prev + 1) % tgeData.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [tgeData.length]);

  // Testnets Carousel Timer
  useEffect(() => {
    if (testnetsData.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTestnetIndex(prev => (prev + 1) % testnetsData.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [testnetsData.length]);

  // Carousel Controls
  const nextTge = (e) => { e.preventDefault(); setCurrentTgeIndex(prev => (prev + 1) % tgeData.length); };
  const prevTge = (e) => { e.preventDefault(); setCurrentTgeIndex(prev => (prev - 1 + tgeData.length) % tgeData.length); };

  const nextTestnet = (e) => { e.preventDefault(); setCurrentTestnetIndex(prev => (prev + 1) % testnetsData.length); };
  const prevTestnet = (e) => { e.preventDefault(); setCurrentTestnetIndex(prev => (prev - 1 + testnetsData.length) % testnetsData.length); };

  // Pre-calculate SVG Donut Math
  const total = userProgress.total || 1; 
  const compPct = userProgress.total === 0 ? 0 : Math.round((userProgress.completed / total) * 100);
  const pendPct = userProgress.total === 0 ? 0 : Math.round((userProgress.pending / total) * 100);
  const overPct = userProgress.total === 0 ? 0 : Math.round((userProgress.overdue / total) * 100);

  const activeTge = tgeData[currentTgeIndex] || tgeData[0];
  const activeTestnet = testnetsData[currentTestnetIndex] || testnetsData[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      
      {/* ==================== WIDGET 1: TRACK YOUR PROGRESS ==================== */}
      <div className="bg-white rounded-[24px] p-6 border border-[#E8EDF5] shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col justify-between h-full">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-[14px] bg-[#eff6ff] flex items-center justify-center shrink-0">
              <Target size={30} className="text-[#3b82f6]" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#0F172A] leading-tight mb-0.5">Track Your Progress</h3>
              <p className="text-[11px] font-medium text-slate-500">Stay consistent and maximize rewards.</p>
            </div>
          </div>
          
        </div>

        {/* Donut Chart & Legend */}
        <div className="flex items-center gap-8 mb-8">
          <div className="relative w-[130px] h-[130px] flex items-center justify-center shrink-0">
            {/* Thick SVG Donut Chart */}
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 relative z-10">
              {/* Background Grey Ring */}
              <path className="text-slate-100" strokeWidth="5.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              
              {/* Green (Completed) */}
              {compPct > 0 && <path className="text-[#10b981]" pathLength="100" strokeDasharray={`${compPct}, 100`} strokeDashoffset="0" strokeWidth="4.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />}
              
              {/* Blue (Pending) */}
              {pendPct > 0 && <path className="text-[#3b82f6]" pathLength="100" strokeDasharray={`${pendPct}, 100`} strokeDashoffset={`-${compPct}`} strokeWidth="4.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />}
              
              {/* Orange (Overdue) */}
              {overPct > 0 && <path className="text-[#f97316]" pathLength="100" strokeDasharray={`${overPct}, 100`} strokeDashoffset={`-${compPct + pendPct}`} strokeWidth="4.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />}
            </svg>
            
            {/* Perfectly Centered Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
              <span className="text-[28px] font-extrabold text-[#0F172A] leading-none mb-1">{userProgress.engagementScore}</span>
              
          
            </div>
          </div>

          <div className="flex flex-col w-full flex-1 gap-3.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div><span className="text-[12px] font-semibold text-slate-500">Completed</span></div>
              <span className="text-[12px] font-black text-[#0F172A]">{userProgress.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></div><span className="text-[12px] font-semibold text-slate-500">Pending</span></div>
              <span className="text-[12px] font-black text-[#0F172A]">{userProgress.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div><span className="text-[12px] font-semibold text-slate-500">Overdue</span></div>
              <span className="text-[12px] font-black text-[#0F172A]">{userProgress.overdue}</span>
            </div>
            <div className="flex justify-between items-center pt-3.5 border-t border-slate-100">
              <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full border-[2.5px] border-slate-200 bg-transparent"></div><span className="text-[12px] font-semibold text-slate-500">Total Tasks</span></div>
              <span className="text-[12px] font-black text-[#0F172A]">{userProgress.total}</span>
            </div>
          </div>
        </div>

        {/* Clean Activity Bar Chart */}
        <div className="flex items-end justify-between h-[120px] relative w-full">
          <div className="absolute left-0 top-0 bottom-4 flex flex-col justify-between text-[10px] font-medium text-slate-400">
            <span>{userProgress.maxCount}</span>
            <span>{Math.round(userProgress.maxCount / 2)}</span>
            <span>0</span>
          </div>
          <div className="flex items-end justify-between w-full h-full pl-8 relative z-10 pb-[18px]">
            {userProgress.weeklyData.map((bar, i) => (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded pointer-events-none">
                  {bar.count}
                </div>
                <div className="w-full max-w-[18px] bg-gradient-to-b from-[#3b82f6] to-[#93c5fd] rounded-t-[4px] rounded-b-[2px] group-hover:opacity-80 transition-opacity min-h-[4px]" style={{ height: bar.h }}></div>
                <span className="absolute -bottom-[18px] text-[10px] font-medium text-slate-400 whitespace-nowrap">{bar.d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== WIDGET 2: TGE & CLAIM OPPORTUNITIES ==================== */}
      <div className="bg-white rounded-[20px] p-5 border border-[#E8EDF5] shadow-[0_6px_24px_rgba(15,23,42,0.04)] flex flex-col h-full">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Flame size={30} className="text-orange-500 fill-orange-500" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight mb-0.5">TGE & Claim Opportunities</h3>
              <p className="text-[10px] font-medium text-slate-500">Live token events</p>
            </div>
          </div>
          
        </div>

        {isTgeLoading ? (
          // Skeleton Loading State
          <div className="animate-pulse flex flex-col flex-1">
            <div className="w-full h-[105px] bg-slate-100 rounded-[14px] mb-4"></div>
            <div className="flex flex-col gap-2">
              <div className="h-[52px] bg-slate-50 rounded-xl"></div>
              <div className="h-[52px] bg-slate-50 rounded-xl"></div>
            </div>
          </div>
        ) : tgeData.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center flex-1 text-center px-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <Flame size={20} className="text-slate-300" />
            </div>
            <h4 className="text-[13px] font-bold text-slate-700 mb-1">No active events</h4>
            <p className="text-[10px] text-slate-500">New TGE and claim events will appear here automatically.</p>
          </div>
        ) : (
          <>
            {/* Dynamic Feature Banner */}
            <div className="relative w-full h-[105px] rounded-[14px] mb-4 overflow-hidden group bg-slate-900 border border-slate-200 shrink-0">
              {/* Dynamic Project Banner */}
          <div 
            className="absolute inset-0 bg-cover bg-right opacity-80 group-hover:scale-105 transition-transform duration-700"
            style={{ backgroundImage: `url('${activeTge.projects?.banner_url || activeTge.projects?.logo_url}')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/10"></div>
              
              {/* Controls */}
              {tgeData.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full px-2 flex justify-between items-center z-20 pointer-events-none">
                  <button onClick={prevTge} className="pointer-events-auto w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-colors"><ChevronLeft size={12}/></button>
                  <button onClick={nextTge} className="pointer-events-auto w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-colors"><ChevronRight size={12}/></button>
                </div>
              )}

              <div className="absolute top-3 left-4 flex items-center gap-1.5 z-10">
                <img src={activeTge.projects?.logo_url} className="w-4 h-4 object-contain rounded-full bg-white/10" alt=""/>
                <span className="text-white font-bold text-xs tracking-tight truncate max-w-[120px]">{activeTge.projects?.name}</span>
              </div>
              <div className="absolute bottom-3 left-4 z-10 pr-6">
                {/* Status derived from Task Name */}
                <h4 className="text-orange-400 font-black text-[13px] mb-1.5 leading-none truncate">{activeTge.name}</h4>
                {activeTge.link ? (
                  <a href={activeTge.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-orange-500 text-white px-2.5 py-1 rounded-[6px] text-[9px] font-bold hover:bg-orange-600 transition-colors shadow-sm">
                    View details →
                  </a>
                ) : (
                  <span className="inline-block bg-slate-700 text-slate-300 px-2.5 py-1 rounded-[6px] text-[9px] font-bold cursor-not-allowed">
                    No link
                  </span>
                )}
              </div>
              
              {/* Pagination Dots */}
              {tgeData.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {tgeData.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all ${i === currentTgeIndex ? 'w-3 bg-orange-500' : 'w-1 bg-white/40'}`}></div>
                  ))}
                </div>
              )}
            </div>

            {/* Compact List (Slices to 3 to keep layout tight) */}
            <div className="flex flex-col flex-1 gap-0.5">
              {tgeData.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between h-[52px] px-2 -mx-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.projects?.logo_url} className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white shadow-sm p-0.5 shrink-0" alt={item.projects?.name} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="text-[12px] font-bold text-slate-900 leading-none truncate">{item.projects?.name}</h4>
                      </div>
                      <p className="text-[9px] text-orange-600 font-bold leading-none truncate">{item.name}</p>
                    </div>
                  </div>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="h-[28px] px-2.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center justify-center shrink-0 bg-[#fff7ed] text-[#ea580c] border-[#ffedd5] hover:bg-orange-100">
                      View
                    </a>
                  ) : (
                    <span className="h-[28px] px-2.5 rounded-lg text-[10px] font-bold border flex items-center justify-center shrink-0 bg-slate-50 text-slate-400 border-slate-100">
                      N/A
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ==================== WIDGET 3: ACTIVE TESTNETS ==================== */}
      <div className="bg-white rounded-[20px] p-5 border border-[#E8EDF5] shadow-[0_6px_24px_rgba(15,23,42,0.04)] flex flex-col h-full">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <FlaskConical size={30} className="text-purple-600" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight mb-0.5">Active Testnets</h3>
              <p className="text-[10px] font-medium text-slate-500">Projects with testnets live right now.</p>
            </div>
          </div>
          
        </div>

        {isTestnetsLoading ? (
          // Skeleton Loading State
          <div className="animate-pulse flex flex-col flex-1">
            <div className="w-full h-[105px] bg-slate-100 rounded-[14px] mb-4"></div>
            <div className="flex flex-col gap-2">
              <div className="h-[52px] bg-slate-50 rounded-xl"></div>
              <div className="h-[52px] bg-slate-50 rounded-xl"></div>
            </div>
          </div>
        ) : testnetsData.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center flex-1 text-center px-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <FlaskConical size={20} className="text-slate-300" />
            </div>
            <h4 className="text-[13px] font-bold text-slate-700 mb-1">No active testnets</h4>
            <p className="text-[10px] text-slate-500">New incentivized testnets will appear here automatically.</p>
          </div>
        ) : (
          <>
            {/* Dynamic Feature Banner */}
            <div className="relative w-full h-[105px] rounded-[14px] mb-4 overflow-hidden group bg-slate-900 border border-slate-200 shrink-0">
              {/* Dynamic Project Banner */}
          <div 
            className="absolute inset-0 bg-cover bg-right opacity-80 group-hover:scale-105 transition-transform duration-700"
            style={{ backgroundImage: `url('${activeTestnet.banner_url || activeTestnet.logo_url}')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/10"></div>
              
              {/* Controls */}
              {testnetsData.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full px-2 flex justify-between items-center z-20 pointer-events-none">
                  <button onClick={prevTestnet} className="pointer-events-auto w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"><ChevronLeft size={12}/></button>
                  <button onClick={nextTestnet} className="pointer-events-auto w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"><ChevronRight size={12}/></button>
                </div>
              )}

              <div className="absolute top-3 left-4 flex items-center gap-1.5 z-10">
                <img src={activeTestnet.logo_url} className="w-5 h-5 object-contain rounded-[6px] bg-white p-0.5" alt=""/>
                <span className="text-white font-bold text-xs tracking-tight truncate max-w-[100px]">{activeTestnet.name}</span>
                <span className="ml-1 bg-white/20 backdrop-blur-sm border border-white/20 text-white px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest truncate">
                  Incentivized Testnet
                </span>
              </div>
              <div className="absolute bottom-3 left-4 z-10 pr-6">
                <h4 className="text-white font-black text-[13px] mb-1.5 leading-none truncate">Start Earning Rewards</h4>
                <Link to={`/${activeTestnet.slug || activeTestnet.id}/airdropguide`} className="inline-block bg-[#9333ea] text-white px-2.5 py-1 rounded-[6px] text-[9px] font-bold hover:bg-[#a855f7] transition-colors shadow-sm">
                  Start Testnet →
                </Link>
              </div>

              {/* Pagination Dots */}
              {testnetsData.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {testnetsData.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all ${i === currentTestnetIndex ? 'w-3 bg-purple-400' : 'w-1 bg-white/40'}`}></div>
                  ))}
                </div>
              )}
            </div>

            {/* Compact List (Slices to 3) */}
            <div className="flex flex-col flex-1 gap-0.5">
              {testnetsData.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between h-[52px] px-2 -mx-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.logo_url} className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white shadow-sm p-0.5 shrink-0" alt={item.name} />
                    <div className="min-w-0">
                      <h4 className="text-[12px] font-bold text-slate-900 mb-0.5 leading-none truncate">{item.name}</h4>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                        <span className="text-[9px] text-emerald-600 font-bold leading-none truncate">Incentivized Testnet</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 pl-2">
                    <span className="text-[10px] font-medium text-slate-400">
                      {item.task_count != null ? `${item.task_count} Tasks` : 'TBA'}
                    </span>
                    <Link to={`/${item.slug || item.id}/airdropguide`} className="h-[28px] px-2.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold hover:bg-purple-100 transition-colors flex items-center justify-center shrink-0">
                      Start Now →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
    </div>
  );
};


// ============================================================================
// 5. ADVERTISEMENT SPACE (Replaces Category Navigation)
// ============================================================================
const CategoryNavigation = () => {
  return (
    <div className="mb-8 flex justify-center w-full overflow-hidden px-2">
      {/* 728x90 Ad Space Placeholder */}
      <a 
        href="#" 
        className="w-full max-w-[728px] h-[90px] bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-100 transition-colors"
      >
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Advertisement</span>
        <span className="text-[11px] font-medium text-slate-500">728 x 90 Display Area</span>
      </a>
    </div>
  );
};

// ============================================================================
// 6. LATEST ALPHA WIDGET
// ============================================================================
const LatestAlpha = ({ events }) => {
  // Slider state and refs
  const scrollRef = React.useRef(null);
  const [isPaused, setIsPaused] = React.useState(false);

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Just now';
    const now = new Date();
    const posted = new Date(dateString);
    const diffMs = now - posted;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return posted.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getTypeStyles = (type) => {
    const lower = (type || '').toLowerCase();
    if (lower.includes('guide')) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (lower.includes('analysis')) return 'text-purple-600 bg-purple-50 border-purple-100';
    if (lower.includes('funding')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    return 'text-orange-600 bg-orange-50 border-orange-100';
  };

  // Helper to extract the tweet media URL safely from raw_data
  const getMediaUrl = (rawData) => {
    if (!rawData) return null;
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      return parsed.media_url || (parsed.media && parsed.media[0]) || null;
    } catch {
      return null;
    }
  };

  // Auto-Slider Logic
  React.useEffect(() => {
    // Don't set interval if paused or not enough items to scroll
    if (isPaused || !events || events.length <= 1) return;

    const intervalId = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // card width (260px) + gap (16px) = 276px per slide
        const scrollStep = 276; 

        // If we've reached the end, smoothly scroll back to the beginning
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Otherwise, scroll forward by one card
          scrollRef.current.scrollBy({ left: scrollStep, behavior: 'smooth' });
        }
      }
    }, 1500); // Slides every 3.5 seconds

    return () => clearInterval(intervalId);
  }, [isPaused, events]);

  return (
    <div className="mt-10 mb-8">
      {/* Header matching reference design */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Radio size={16} />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Latest Alpha & Updates</h2>
        </div>
        
      </div>

      {/* Horizontal Carousel with Auto-Slide Handlers */}
      <div 
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar -mx-2 px-2 snap-x"
        style={{ scrollBehavior: 'smooth' }}
      >
        {events && events.length > 0 ? (
          events.map((ev) => {
            const projectInfo = ev.projects || {};
            const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${projectInfo.name || 'Alpha'}`;
            const mediaUrl = getMediaUrl(ev.raw_data);
            
            // Prefer ai_summary over raw content for the card description
            const summaryText = ev.ai_summary || ev.content || 'No summary available';

            return (
              <div 
                key={ev.id} 
                className="min-w-[260px] w-[260px] bg-white border border-slate-200 rounded-[18px] shadow-[0_4px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 shrink-0 snap-start flex flex-col overflow-hidden cursor-default"
              >
                {/* 1. Large Top Media Image */}
                <div className="w-full h-[120px] bg-slate-50 relative shrink-0">
                  {mediaUrl ? (
                    <img 
                      src={mediaUrl} 
                      alt="Tweet Media" 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <ImageIcon size={20} className="mb-1.5 opacity-50" />
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">No Media</span>
                    </div>
                  )}
                  {/* Subtle gradient overlay at bottom of image to blend with content */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                </div>

                {/* Content Container */}
                <div className="px-4 pt-3 pb-3 flex flex-col flex-1">
                  
                  {/* 2. Project Identity Row + X Button */}
                  <div className="flex items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <img 
                        src={projectInfo.logo_url || fallbackLogo} 
                        className="w-[28px] h-[28px] rounded-[8px] object-contain bg-white border border-slate-100 shrink-0" 
                        alt={projectInfo.name || 'Project'} 
                      />
                      <h3 className="text-[14px] font-black text-slate-900 truncate">
                        {projectInfo.name || 'Unknown Project'}
                      </h3>
                    </div>
                    {ev.x_url && (
                      <a 
                        href={ev.x_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-[32px] h-[32px] flex items-center justify-center bg-white border border-slate-200 rounded-[10px] text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors shrink-0 shadow-sm"
                        aria-label="View on X"
                      >
                        <ArrowUpRight size={14} strokeWidth={2.5} />
                      </a>
                    )}
                  </div>

                  {/* 3. AI Summary */}
                  <p className="text-[11px] font-medium text-slate-700 leading-[1.5] line-clamp-3 mb-3 flex-1">
                    {summaryText}
                  </p>

                  {/* 4. Footer (Type + Time) */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto">
                    <span className={`px-2.5 py-1 rounded-[6px] text-[8px] font-black uppercase tracking-[0.1em] border ${getTypeStyles(ev.update_type)}`}>
                      {ev.update_type || 'ANNOUNCEMENT'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500">
                      {getRelativeTime(ev.date_posted)}
                    </span>
                  </div>
                  
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full py-10 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[18px] bg-white/50">
            <Radio size={20} className="text-slate-300 mb-2" />
            <p className="text-[12px] font-bold text-slate-500">No recent alpha updates found</p>
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
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Reference for smooth scrolling to the table
  const latestAirdropsRef = React.useRef(null);

  const handleExploreClick = () => {
    if (latestAirdropsRef.current) {
      // Offset by roughly the height of a sticky nav if you have one, or just smooth scroll to the top of the table section
      const yOffset = -20; 
      const y = latestAirdropsRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [investorLogos, setInvestorLogos] = useState({});
  const [alphaEvents, setAlphaEvents] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    newProjectsThisWeek: 0,
    totalTasks: 0,
    newTasksThisWeek: 0,
    pendingTasks: 0,
    avgFarmCost: 0,
    farmCostTrend: 0,
    totalFundingFormatted: '$0M',
    newRoundsThisWeek: 0,
    sailBalance: 0,
    avgTimeRequired: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFunding, setFilterFunding] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('total');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('All');
  const ITEMS_PER_PAGE = 15;

  const tableTabs = ['All', 'Testnet', 'Mainnet', 'Incentivized', 'Whitelist', 'Staking', 'NFT'];

  useEffect(() => {
    if (!user?.id) return;
    fetchProjects();
    fetchDashboardStats();
  }, [user?.id]); 

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
      _score: p.score_total || 0,
      _effort: getEffort(p),
      _fundingVal: parseFundingToMillions(p.funding)
    })),
    [projects]
  );

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        // Added banner_url here!
        .select('id, slug, name, logo_url, banner_url, funding, lead_investors, tier, status, airdrop_status, total_time_estimate, total_cost_estimate, task_count, social_score, created_at, score_total, score_airdrop, score_social, score_funding, score_fundamental')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const fetchedData = data || [];

      const totalMins = fetchedData.reduce((sum, p) => sum + (Number(p.total_time_estimate) || 0), 0);
      const avgTime = fetchedData.length > 0 ? Math.round(totalMins / fetchedData.length) : 0;

      setDashboardStats(prev => ({ ...prev, avgTimeRequired: avgTime }));

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
      
      const { data: alphaData } = await supabase
        .from('project_research')
        .select('id, x_url, content, ai_summary, date_posted, raw_data, projects (name, logo_url, banner_url, slug)')
        .order('date_posted', { ascending: false })
        .limit(8);

      if (alphaData) setAlphaEvents(alphaData);
      
      setProjects(fetchedData);
      setFilteredProjects(fetchedData);
    } catch (e) { console.error("Fetch Error:", e); } finally { setLoading(false); }
  };

  const fetchDashboardStats = async () => {
    try {
      const now = new Date();
      
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(now.getDate() - 14);

      const [
        projectCount, 
        newProjectsCount, 
        pendingCount, 
        taskCount, 
        newTasksCount, 
        taskCostsData,
        fundingData
      ] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("tasks").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("tasks").select("cost, created_at"),
        supabase.from("funding_opportunities").select("funding_amount, last_updated")
      ]);

      // --- 1. Task Cost Calculations ---
      const tasksList = taskCostsData.data || [];
      let totalCostAll = 0, costThisWeek = 0, countThisWeek = 0, costLastWeek = 0, countLastWeek = 0;

      tasksList.forEach(task => {
        const cost = Number(task.cost) || 0;
        const createdDate = new Date(task.created_at);
        
        totalCostAll += cost;
        if (createdDate >= sevenDaysAgo) {
          costThisWeek += cost;
          countThisWeek++;
        } else if (createdDate >= fourteenDaysAgo) {
          costLastWeek += cost;
          countLastWeek++;
        }
      });

      const avgFarmCost = tasksList.length > 0 ? (totalCostAll / tasksList.length) : 0;
      const avgThisWeek = countThisWeek > 0 ? (costThisWeek / countThisWeek) : 0;
      const avgLastWeek = countLastWeek > 0 ? (costLastWeek / countLastWeek) : 0;

      let farmCostTrend = 0;
      if (avgLastWeek > 0) {
        farmCostTrend = ((avgThisWeek - avgLastWeek) / avgLastWeek) * 100;
      } else if (avgThisWeek > 0) {
        farmCostTrend = 100; 
      }

      // --- 2. Funding Calculations ---
      const fundingList = fundingData.data || [];
      let totalFundingMillions = 0;
      let newRoundsThisWeek = 0;

      fundingList.forEach(round => {
        if (new Date(round.last_updated) >= sevenDaysAgo) {
          newRoundsThisWeek++;
        }
        
        const millions = parseFundingToMillions(round.funding_amount);
        totalFundingMillions += millions;
      });

      let formattedTotalFunding = '$0';
      if (totalFundingMillions >= 1000000) {
        formattedTotalFunding = `$${(totalFundingMillions / 1000000).toFixed(1)}T`;
      } else if (totalFundingMillions >= 1000) {
        formattedTotalFunding = `$${(totalFundingMillions / 1000).toFixed(1)}B`;
      } else if (totalFundingMillions > 0) {
        formattedTotalFunding = `$${totalFundingMillions.toFixed(1)}M`;
      }

      setDashboardStats(prev => ({
        ...prev,
        totalProjects: projectCount.count || 0,
        newProjectsThisWeek: newProjectsCount.count || 0,
        totalTasks: taskCount.count || 0,
        newTasksThisWeek: newTasksCount.count || 0,
        pendingTasks: pendingCount.count || 0,
        avgFarmCost,
        farmCostTrend,
        totalFundingFormatted: formattedTotalFunding,
        newRoundsThisWeek
      }));
    } catch (err) { console.error("Stats Error:", err); }
  };
  
  useEffect(() => {
    let result = [...scoredProjects];
    
    if (searchTerm) result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (activeTab !== 'All') result = result.filter(p => p.status === activeTab || p.status?.includes(activeTab));
    if (filterStatus !== 'All') result = result.filter(p => p.status === filterStatus);

    result.sort((a, b) => {
      if (sortBy === 'social') return (b.score_social || 0) - (a.score_social || 0);
      if (sortBy === 'funding') return (b.score_funding || 0) - (a.score_funding || 0);
      return (b._score || 0) - (a._score || 0);
    });

    setFilteredProjects(result);
    setCurrentPage(1); 
  }, [searchTerm, activeTab, filterFunding, filterTier, filterStatus, sortBy, scoredProjects]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (isMobile) {
    return (
      <>
        <SEO title="Airdrop Dashboard" description="Track best airdrop opportunities." />
        <AirdropsPageMobile
          loading={loading}
          projects={filteredProjects}
          dashboardStats={dashboardStats}
          alphaEvents={alphaEvents}
          investorLogos={investorLogos}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          paginatedProjects={paginatedProjects}
        />
      </>
    );
  }

  return (
    <div className="w-full h-full pb-20 font-sans text-slate-900 relative">
      <SEO title="Airdrop Dashboard & Radar" description="Track, farm and earn from the best airdrop opportunities." />

      <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 pt-0 md:pt-4">
        
        <HeroBanner onExploreClick={handleExploreClick} />
        <DashboardStatsRow stats={dashboardStats} />
        <TopOpportunitiesGrid projects={scoredProjects} />
        
        {/* New 3-Column Snap Area Included Here */}
        <MiddleWidgets />

        <CategoryNavigation />

        {/* ==================== SECTION HEADER ==================== */}
        <div ref={latestAirdropsRef} className="flex items-center justify-between mb-5 scroll-mt-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Flame size={18} className="text-orange-500 fill-orange-500" /> Latest Airdrops
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Discover new and trending airdrop opportunities.</p>
          </div>
        </div>
        
        {/* ==================== CONTROLS (TABS, SEARCH, FILTER) ==================== */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          {/* TABS */}
          <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
            {tableTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-[36px] px-4 rounded-[11px] text-[11px] font-bold whitespace-nowrap transition-all border ${
                  activeTab === tab 
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm shadow-blue-500/20' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* SEARCH & FILTER */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-[320px] xl:w-[360px]">
              <input 
                type="text" 
                placeholder="Search projects, tokens, or keywords..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="h-[40px] pl-10 pr-4 w-full rounded-[12px] text-[12px] font-medium text-slate-900 border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-[0_2px_10px_rgba(15,23,42,0.02)]" 
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button className="h-[40px] px-4 bg-white border border-slate-200 rounded-[12px] text-[12px] font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-[0_2px_10px_rgba(15,23,42,0.02)] w-full sm:w-auto shrink-0">
              <Filter size={14} className="text-slate-500"/> Filter <ChevronDown size={14} className="text-slate-400"/>
            </button>
          </div>
        </div>

        {/* ==================== MAIN TABLE CARD ==================== */}
        <div className="bg-white border border-[#E8EDF5] rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.04)] overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] h-10">
                  <th className="px-4 text-center w-12">#</th>
                  <th className="px-4 text-slate-500">Project</th>
                  <th className="px-4 text-center">Score</th>
                  <th className="px-4 text-center">Funding</th>
                  <th className="px-4 text-center">Time</th>
                  <th className="px-4 text-center">Tasks</th>
                  <th className="px-4 text-center">Phase</th>
                  <th className="px-4 text-center">Investors</th>
                  <th className="px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Skeleton Loading Rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="h-[70px] border-b border-slate-50">
                      <td className="px-4 text-center"><div className="w-5 h-5 bg-slate-100 rounded-md mx-auto animate-pulse"></div></td>
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-[38px] h-[38px] rounded-[12px] bg-slate-100 animate-pulse shrink-0"></div>
                          <div className="flex flex-col gap-1.5 w-full">
                            <div className="h-3.5 bg-slate-100 rounded w-24 animate-pulse"></div>
                            <div className="h-2 bg-slate-50 rounded w-16 animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-center"><div className="w-[32px] h-[32px] bg-slate-100 rounded-full mx-auto animate-pulse"></div></td>
                      <td className="px-4 text-center"><div className="h-3.5 bg-slate-100 rounded w-10 mx-auto animate-pulse"></div></td>
                      <td className="px-4 text-center"><div className="h-2.5 bg-slate-100 rounded w-8 mx-auto animate-pulse"></div></td>
                      <td className="px-4 text-center"><div className="h-2.5 bg-slate-100 rounded w-5 mx-auto animate-pulse"></div></td>
                      <td className="px-4 text-center"><div className="h-4 bg-slate-100 rounded-lg w-14 mx-auto animate-pulse"></div></td>
                      <td className="px-4 text-center"><div className="flex items-center justify-center -space-x-1.5"><div className="w-6 h-6 bg-slate-100 rounded-full animate-pulse border-2 border-white"></div><div className="w-6 h-6 bg-slate-100 rounded-full animate-pulse border-2 border-white"></div></div></td>
                      <td className="px-5 text-right"><div className="h-8 w-20 bg-slate-100 rounded-[8px] ml-auto animate-pulse"></div></td>
                    </tr>
                  ))
                ) : paginatedProjects.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan="9" className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                          <Search size={18} className="text-slate-400" />
                        </div>
                        <h3 className="text-[13px] font-bold text-slate-900 mb-1">No airdrops found</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Try changing your search or filter criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((p, idx) => {
                    const score = p._score || 0;
                    const rowNumber = ((currentPage - 1) * ITEMS_PER_PAGE) + idx + 1;
                    
                    return (
                      <tr key={p.id} className="h-[70px] border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors duration-200 group">
                        
                        {/* 1. Row Index */}
                        <td className="px-4 text-center">
                          <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-[9px] font-bold text-slate-400">
                            {rowNumber}
                          </div>
                        </td>

                        {/* 2. Project Name & Logo */}
                        <td className="px-4">
                          <Link to={`/${p.slug || p.id}/airdropguide`} className="flex items-center gap-3 w-fit">
                            <img src={p.logo_url} className="w-[38px] h-[38px] rounded-[12px] object-cover border border-[#E8EDF5] shadow-[0_2px_8px_rgba(15,23,42,0.04)] bg-white shrink-0" alt={p.name} />
                            <div className="flex flex-col justify-center">
                              <span className="font-extrabold text-[13px] text-[#0F172A] group-hover:text-[#2563EB] transition-colors leading-tight mb-0.5">{p.name}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{p.status || 'TBA'}</span>
                            </div>
                          </Link>
                        </td>

                        {/* 3. Circular Score */}
                        <td className="px-4 text-center">
                          <div className={`mx-auto w-[32px] h-[32px] rounded-full border-[2px] flex items-center justify-center bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] ${score >= 40 ? 'border-emerald-400 text-emerald-600' : 'border-blue-400 text-blue-600'}`}>
                            <span className="text-[11px] font-extrabold tabular-nums tracking-tight">{score}</span>
                          </div>
                        </td>

                        {/* 4. Funding */}
                        <td className="px-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[12px] font-extrabold text-[#0F172A] leading-none mb-1">{formatFunding(p.funding)}</span>
                            {p.tier && <span className="text-[8px] font-medium text-slate-400 leading-none">{p.tier}</span>}
                          </div>
                        </td>

                        {/* 5. Time Estimate */}
                        <td className="px-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-500">
                            <Clock size={10} strokeWidth={2.5} className="text-slate-400" />
                            <span className="text-[10px] font-bold">{p.total_time_estimate ? `~${p.total_time_estimate}m` : 'TBA'}</span>
                          </div>
                        </td>

                        {/* 6. Task Count */}
                        <td className="px-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-[#0F172A]">
                            <List size={10} strokeWidth={2.5} className="text-slate-400" />
                            <span className="text-[11px] font-extrabold tabular-nums">{p.task_count || 12}</span>
                          </div>
                        </td>

                        {/* 7. Phase Pill */}
                        <td className="px-4 text-center">
                          <div className="mx-auto w-fit bg-[#eff6ff] text-[#2563EB] px-2 py-1 rounded-[6px] border border-blue-100/50">
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">{p.status || 'TESTNET'}</span>
                          </div>
                        </td>

                        {/* 8. Investors Stack */}
                        <td className="px-4 text-center">
                          <div className="flex items-center justify-center">
                            {(p.lead_investors || '').split(',').slice(0, 4).map((name, index) => {
                              const logo = investorLogos[name.trim()];
                              return logo ? (
                                <img key={index} src={logo} className="-ml-1.5 w-[24px] h-[24px] rounded-full border-[1.5px] border-white object-cover shadow-[0_2px_4px_rgba(0,0,0,0.05)]" alt={name.trim()} title={name.trim()} />
                              ) : (
                                <div key={index} className="-ml-1.5 w-[24px] h-[24px] rounded-full border-[1.5px] border-white bg-slate-100 flex items-center justify-center text-[7px] font-bold text-slate-400 shadow-[0_2px_4px_rgba(0,0,0,0.05)] z-10" title={name.trim()}>
                                  {name.trim().substring(0,2)}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        
                        {/* 9. Actions */}
                        <td className="px-5 text-right">
                           <Link to={`/${p.slug || p.id}/airdropguide`}>
                            <button className="h-[34px] px-3.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[8px] text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] transition-all ml-auto">
                              View Tasks <ChevronRight size={12} strokeWidth={3}/>
                            </button>
                           </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredProjects.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest tabular-nums">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of {filteredProjects.length}
              </span>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  className="h-[28px] px-2.5 border border-[#E8EDF5] rounded-[8px] text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <ChevronLeft size={12} strokeWidth={2.5} /> Prev
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage >= totalPages} 
                  className="h-[28px] px-2.5 border border-[#E8EDF5] rounded-[8px] text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  Next <ChevronRight size={12} strokeWidth={2.5} />
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