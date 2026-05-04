import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Flame, Target, Users, Zap, 
  TrendingUp, Trophy, Info, Clock, CheckCircle2 
} from 'lucide-react';

export default function EarlyAirdropsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEarlyProjects();
  }, []);

  const fetchEarlyProjects = async () => {
    try {
      setLoading(true);
      // STRICT EARLY LOGIC: Only projects with 1, 0, or null tasks
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or('task_count.lte.1,task_count.is.null')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching early projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- SCORING LOGIC (Mirrored from Main Page) ---
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

  const filteredProjects = useMemo(() => {
    let result = [...scoredProjects].sort((a, b) => b._score - a._score);
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return result;
  }, [scoredProjects, searchTerm]);

  // --- TOP BOX CALCULATIONS ---
  const topScoredProject = [...scoredProjects].sort((a, b) => b._score - a._score)[0];
  const trendingProject = [...scoredProjects].sort((a, b) => (b.social_score || 0) - (a.social_score || 0))[0];

  // --- UI FORMATTING HELPERS ---
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
      <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 pt-8">
        
        {/* HERO TITLE (Scaled down to match AirdropsPage) */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              Early Airdrops Radar
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Discover extremely early-stage testnets, waitlists, and alphas.
            </p>
          </div>
        </div>

        {/* --- 4 HERO BOXES (Scaled down to match UserControlPanel from AirdropsPage) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          
          {/* Box 1: Top Scored */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              🏆 Top Scored
            </h3>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 min-w-0">
                <img src={topScoredProject?.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${topScoredProject?.name}`} className="w-6 h-6 rounded-md border border-slate-100 object-cover shrink-0" alt="" />
                <span className="text-xs font-bold text-slate-900 truncate">{topScoredProject?.name || '---'}</span>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 shrink-0 ml-2 uppercase tracking-widest">
                {topScoredProject?._score || 0} Score
              </span>
            </div>
          </div>

          {/* Box 2: Trending Now */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              🔥 Trending Now
            </h3>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 min-w-0">
                <img src={trendingProject?.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${trendingProject?.name}`} className="w-6 h-6 rounded-md border border-slate-100 object-cover shrink-0" alt="" />
                <span className="text-xs font-bold text-slate-900 truncate">{trendingProject?.name || '---'}</span>
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 shrink-0 ml-2 uppercase tracking-widest">
                {trendingProject?.social_score || 0} Social
              </span>
            </div>
          </div>

          {/* Box 3: Radar Stats */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              📊 Radar Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Early Projects Tracked:</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-xs font-bold text-slate-900">{scoredProjects.length}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Scouting Status:</span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>

          {/* Box 4: Education */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="text-sm font-black text-blue-900 mb-2 flex items-center gap-2">
              🌱 Why Farm Early?
            </h3>
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
              Interacting during Testnet & Waitlist phases costs $0 but secures the highest allocation multipliers.
            </p>
          </div>

        </div>

        {/* --- MAIN DATA TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
          
          {/* CONTROL BAR (Search Only) */}
          <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-bold text-slate-600">Filter Projects</span>
            </div>
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Search early projects..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="text-sm border border-slate-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full font-medium bg-white transition-all shadow-sm" 
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto pb-6 pt-2 px-2">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b-2 border-slate-100 text-[11px] font-black text-black uppercase tracking-widest h-14">
                  <th className="px-6">Project</th>
                  <th className="px-4">Score</th>
                  <th className="px-4 text-center">ROI</th>
                  <th className="px-4 text-center">Time</th>
                  <th className="px-4 text-center">Cost</th>
                  <th className="px-4 text-center">Status</th>
                  <th className="px-4 text-center">Tasks</th>
                  <th className="px-4 text-center">Effort</th>
                  <th className="px-6 text-right">Social</th>
                  <th className="px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {loading ? (
                  <tr><td colSpan="10" className="py-20 text-center text-sm font-bold text-slate-400 animate-pulse">Syncing early radar data...</td></tr>
                ) : filteredProjects.length === 0 ? (
                  <tr><td colSpan="10" className="py-20 text-center text-sm font-bold text-slate-400">No early projects match your criteria.</td></tr>
                ) : (
                  filteredProjects.map((p) => {
                    const airdropMeta = getAirdropStatusBadge(p.airdrop_status);
                    const fundVal = formatFunding(p.funding);

                    return (
                      <tr key={p.id} className="h-[80px] hover:bg-white hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:scale-[1.002] transition-all duration-300 group relative bg-transparent z-0 hover:z-10 rounded-xl">
                        
                        {/* PROJECT */}
                        <td className="px-6">
                          <Link to={`/${p.slug || p.id}/airdropguide`} className="flex items-center gap-4 w-fit group/link relative">
                            <div className="relative shrink-0">
                              <img src={p.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${p.name}`} className="w-11 h-11 rounded-xl border border-slate-200 object-cover shadow-sm bg-white group-hover/link:shadow-md transition-all" alt="" />
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
                        <td className="px-4">{renderAirdropScore(p._score)}</td>

                        {/* ROI */}
                        <td className="px-4 text-center">
                          <span className={`text-xs font-bold ${(p._score || 0) >= 80 ? 'text-emerald-600' : (p._score || 0) >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                            {(p._score || 0) >= 80 ? 'High' : (p._score || 0) >= 50 ? 'Medium' : 'Low'}
                          </span>
                        </td>

                        {/* TIME */}
                        <td className="px-4 text-center">
                          <span className="text-xs text-slate-600">{p.total_time_estimate || '~30m'}</span>
                        </td>

                        {/* COST */}
                        <td className="px-4 text-center">
                          <span className="text-xs text-slate-600">{p.total_cost_estimate || 'Free'}</span>
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
                        <td className="px-4 text-center">{getEffortBadge(p._effort)}</td>

                        {/* SOCIAL SCORE */}
                        <td className="px-6">{renderSocialScore(p.social_score)}</td>

                        {/* ACTION BUTTON */}
                        <td className="px-6 text-center">
                          <Link to={`/${p.slug || p.id}/airdropguide`}>
                            <button className="text-xs font-black bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2.5 rounded-lg shadow-sm shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 hover:from-blue-500 hover:to-blue-400 transition-all flex items-center gap-2 mx-auto">
                              Start 
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
        </div>
      </div>
    </div>
  );
}