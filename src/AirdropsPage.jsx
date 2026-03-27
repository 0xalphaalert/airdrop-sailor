import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

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

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      // 1. Check Session Cache for Instant Load Speed
      const cachedData = sessionStorage.getItem('radar_projects_cache');
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setProjects(parsedData);
        setFilteredProjects(parsedData);
        setLoading(false);
        return; 
      }

      // 2. Ultra-Lean Database Query (Max Speed)
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, logo_url, funding, tier, status, airdrop_status, total_cost_estimate, task_count, social_score')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const fetchedData = data || [];
      sessionStorage.setItem('radar_projects_cache', JSON.stringify(fetchedData));
      
      setProjects(fetchedData);
      setFilteredProjects(fetchedData);
    } catch (e) { 
      console.error("Radar Fetch Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    let result = projects;

    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (filterFunding !== 'All') {
      result = result.filter(p => {
        const val = parseFloat(p.funding?.replace(/[^0-9.]/g, '') || 0);
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
  }, [searchTerm, filterFunding, filterTier, filterStatus, filterSocial, projects]);

  // --- UI FORMATTING HELPERS ---

  const getTierColor = (tier) => {
    if (tier?.includes('1')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (tier?.includes('2')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getStatusColor = (status) => {
    if (status === 'TGE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Testnet') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Mainnet') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (status === 'Point Farming') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-600 border-slate-200'; 
  };

  const getAirdropStatusColor = (status) => {
    if (status === 'Confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Possible') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200'; 
  };

  const formatCost = (cost) => {
    if (!cost) return '$0'; 
    const strCost = String(cost).trim().toLowerCase();
    if (strCost === '0' || strCost === 'free' || strCost === '$0') return '$0';
    if (strCost.startsWith('$')) return String(cost).trim(); 
    return `$${String(cost).trim()}`; 
  };

  // 🚀 THE FUNDING FIX: Safely strips double $ and normalizes text
  const formatFunding = (fundingStr) => {
    if (!fundingStr || fundingStr.trim() === '') return <span className="text-slate-400">—</span>;
    let clean = String(fundingStr).replace(/\$/g, '').trim().toUpperCase();
    return `$${clean}`;
  };

  // 🚀 THE SOCIAL SCORE VISUALIZER
  const renderSocialScore = (score) => {
    const safeScore = parseInt(score) || 0;
    let colorClass = 'bg-slate-200';
    let textClass = 'text-slate-600';
    
    if (safeScore >= 80) { colorClass = 'bg-emerald-500'; textClass = 'text-emerald-600'; }
    else if (safeScore >= 50) { colorClass = 'bg-blue-500'; textClass = 'text-blue-600'; }
    else if (safeScore >= 25) { colorClass = 'bg-amber-500'; textClass = 'text-amber-600'; }

    return (
      <div className="flex flex-col items-end w-24 ml-auto gap-1">
        <div className="flex items-center justify-end gap-1.5">
          <span className={`font-bold text-sm ${textClass}`}>{safeScore}</span>
          <span className="text-[10px] text-slate-400 font-bold">/ 100</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${safeScore}%` }}></div>
        </div>
      </div>
    );
  };

  // Top Metrics Math
  const tier1Count = projects?.filter(p => p.tier?.toLowerCase().includes('tier 1')).length || 0;
  const freeCount = projects?.filter(p => formatCost(p.total_cost_estimate) === '$0').length || 0;
  const testnetCount = projects?.filter(p => p.status?.toLowerCase().includes('testnet')).length || 0;
  const strongSocialCount = projects?.filter(p => p.social_score >= 50).length || 0;

  return (
    <div className="w-full mx-auto px-4 lg:px-10 py-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Airdrops Radar</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Discover and track verified protocol opportunities.</p>
        </div>
      </div>

      {/* METRICS BAND */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tier 1 Airdrops', count: tier1Count, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Free to Join', count: freeCount, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Testnet Phase', count: testnetCount, icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Strong Socials', count: strongSocialCount, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'text-blue-600', bg: 'bg-blue-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 leading-none">{stat.count}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} /></svg>
            </div>
          </div>
        ))}
      </div>

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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider h-12">
                <th className="px-6 w-12 text-center">#</th>
                <th className="px-4">Project</th>
                <th className="px-4">Funding</th>
                <th className="px-4">Tier</th>
                <th className="px-4">Phase</th>
                <th className="px-4 text-center">Airdrop</th>
                <th className="px-4">Est. Cost</th>
                <th className="px-4 text-center">Tasks</th>
                <th className="px-6 text-right">Social Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="9" className="py-16 text-center text-sm font-medium text-slate-400">Syncing radar data...</td></tr>
              ) : filteredProjects.map((p, index) => (
                <tr key={p.id} className="h-[64px] hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 text-xs text-slate-400 font-bold text-center">{index + 1}</td>

                  {/* PROJECT */}
                  <td className="px-4">
                    <Link to={`/project/${p.id}`} className="flex items-center gap-3 w-fit">
                      <img src={p.logo_url} className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-sm bg-white" alt="" />
                      <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</span>
                    </Link>
                  </td>

                  {/* FUNDING (Fixed to strip double $$) */}
                  <td className="px-4 text-sm font-bold text-slate-700">
                    {formatFunding(p.funding)}
                  </td>

                  {/* TIER */}
                  <td className="px-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getTierColor(p.tier)}`}>
                      {p.tier || 'TBA'}
                    </span>
                  </td>

                  {/* PHASE */}
                  <td className="px-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getStatusColor(p.status)}`}>
                      {p.status || 'Waitlist'}
                    </span>
                  </td>

                  {/* AIRDROP STATUS */}
                  <td className="px-4 text-center">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider ${getAirdropStatusColor(p.airdrop_status)}`}>
                      {p.airdrop_status || 'Possible'}
                    </span>
                  </td>

                  {/* COST */}
                  <td className="px-4 text-sm font-bold text-slate-700">{formatCost(p.total_cost_estimate)}</td>

                  {/* TASKS */}
                  <td className="px-4 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold text-[11px] border border-slate-200">
                      {p.task_count || 0}
                    </span>
                  </td>

                  {/* SOCIAL SCORE (Upgraded Bar UI) */}
                  <td className="px-6">
                    {renderSocialScore(p.social_score)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}