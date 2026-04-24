import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, LayoutGrid, List, Plus, 
  Flame, ArrowUpRight, X, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function ProfileAirdrops() {
  const { user } = usePrivy();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [myProjects, setMyProjects] = useState([]);
  const [recommended, setRecommended] = useState([]);
  
  // User Limits & Points
  const [projectLimit, setProjectLimit] = useState(5);
  const [userPoints, setUserPoints] = useState(0);

  // View & Filter States
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('All');
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'funding'

  // 🚀 NEW: Custom Toast and Modal States
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, title: '', message: '', onConfirm: null, type: 'danger', confirmText: '' 
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    if (user) fetchAirdropsData();
  }, [user]);

  // Helper to calculate score for ANY project
  const getProjectScore = (p, taskCount = 0) => {
    if (!p) return 0;
    const social = p.social_score || 0;
    const fundingVal = parseFloat(p.funding?.replace(/[^0-9.]/g, '') || 0);
    const fundingScore = Math.min(fundingVal / 20, 1) * 100;
    let tierScore = 30;
    if (p.tier?.includes('1')) tierScore = 100;
    else if (p.tier?.includes('2')) tierScore = 70;
    const finalTaskCount = taskCount || p.task_count || 0;
    const taskScore = Math.min(finalTaskCount * 10, 100);
    return Math.round(social * 0.4 + fundingScore * 0.3 + tierScore * 0.2 + taskScore * 0.1);
  };

  const fetchAirdropsData = async () => {
    setLoading(true);
    const privyId = user.id;

    try {
      // 1. Fetch User Profile Limits & Points
      const { data: profile } = await supabase.from('user_profiles').select('project_limit').eq('auth_id', privyId).maybeSingle();
      if (profile) setProjectLimit(profile.project_limit || 5);
      
      const { data: pointsData } = await supabase.from('user_points').select('total_points').eq('auth_id', privyId).maybeSingle();
      if (pointsData) setUserPoints(pointsData.total_points || 0);

      // 2. Get Subscribed Projects
      const { data: subs } = await supabase.from('user_subscriptions').select('project_id').eq('auth_id', privyId);
      const subbedIds = subs ? subs.map(s => s.project_id) : [];

      // 3. Fetch All Projects & Tasks
      const { data: allProjects } = await supabase.from('projects').select('*');
      const { data: allTasks } = await supabase.from('tasks').select('*');
      const { data: progress } = await supabase.from('user_task_progress').select('*').eq('auth_id', privyId);

      let enrichedMyProjects = [];
      let otherProjects = [];

      if (allProjects) {
        allProjects.forEach(proj => {
          const projTasks = allTasks?.filter(t => t.project_id === proj.id) || [];
          const completedProjTasks = projTasks.filter(t => progress?.some(p => p.task_id === t.id));
          
          const enrichedProj = {
            ...proj,
            totalTasks: projTasks.length,
            completedTasks: completedProjTasks.length,
            progressPercent: projTasks.length > 0 ? Math.round((completedProjTasks.length / projTasks.length) * 100) : 0,
            calculatedScore: getProjectScore(proj, projTasks.length),
            hasNewTasks: completedProjTasks.length < projTasks.length // 🚀 Messenger Notification Logic
          };

          if (subbedIds.includes(proj.id)) {
            enrichedMyProjects.push(enrichedProj);
          } else {
            otherProjects.push(enrichedProj);
          }
        });
      }

      // 4. Sort and Set Top 4 Recommended Alpha
      otherProjects.sort((a, b) => b.calculatedScore - a.calculatedScore);
      setRecommended(otherProjects.slice(0, 4));
      setMyProjects(enrichedMyProjects);

    } catch (error) {
      console.error("Airdrops Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 UPDATED: Replaced window.confirm with Custom Modal
  const handleUnsubscribe = (projectId, projectName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Drop Project',
      message: `Are you sure you want to stop tracking ${projectName}? It will be removed from your radar.`,
      confirmText: 'Drop Project',
      type: 'danger',
      onConfirm: async () => {
        try {
          await supabase.from('user_subscriptions').delete().match({ auth_id: user.id, project_id: projectId });
          fetchAirdropsData();
          showToast(`${projectName} removed from radar.`, 'success');
        } catch (error) { 
          console.error("Error removing project:", error); 
          showToast('Failed to drop project.', 'error');
        }
        closeConfirm();
      }
    });
  };

  // 🚀 UPDATED: Replaced alerts & window.confirm with Custom UI
  const handleAddProject = async (projectId, projectName) => {
    if (myProjects.length >= projectLimit) {
      setConfirmDialog({
        isOpen: true,
        title: 'Slot Limit Reached',
        message: `You are tracking ${myProjects.length}/${projectLimit} projects. Head to the Points Arena to upgrade your capacity or redeem points!`,
        confirmText: 'Go to Points Arena',
        type: 'upgrade',
        onConfirm: () => {
          closeConfirm();
          navigate('/subscription');
        }
      });
      return;
    }
    
    try {
      await supabase.from('user_subscriptions').insert([{ auth_id: user.id, project_id: projectId }]);
      showToast(`Successfully tracked ${projectName}!`, 'success');
      fetchAirdropsData();
    } catch (error) { 
      console.error("Error adding project:", error); 
      showToast('Failed to track project.', 'error');
    }
  };

  // --- FILTERING & SORTING LOGIC ---
  const filteredProjects = myProjects
    .filter(p => (filterTier === 'All' ? true : p.tier?.includes(filterTier)))
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'score') return b.calculatedScore - a.calculatedScore;
      if (sortBy === 'funding') {
        const valA = parseFloat(a.funding?.replace(/[^0-9.]/g, '') || 0);
        const valB = parseFloat(b.funding?.replace(/[^0-9.]/g, '') || 0);
        return valB - valA;
      }
      return 0;
    });

  if (loading) return <div className="p-10 text-slate-400 font-medium animate-pulse">Loading Radar...</div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 relative">
      
      {/* ========================================== */}
      {/* 🚀 NEW: CUSTOM FLOATING TOAST NOTIFICATION */}
      {/* ========================================== */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[100] transition-all transform duration-300 ease-out translate-y-0 opacity-100">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🚀 NEW: CUSTOM CONFIRMATION MODAL          */}
      {/* ========================================== */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeConfirm}></div>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 max-w-sm w-full relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 ${
              confirmDialog.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{confirmDialog.title}</h3>
            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button onClick={closeConfirm} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm} 
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-colors text-sm shadow-sm ${
                  confirmDialog.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & CONTROLS */}
      <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-6 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Radar</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Tracking <strong className="text-slate-800">{myProjects.length} / {projectLimit}</strong> slots.
          </p>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Search Bar */}
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search airdrops..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-48 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all"
            />
          </div>

          {/* Tier Filter */}
          <select 
            value={filterTier} 
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Tiers</option>
            <option value="1">Tier 1</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
          </select>

          {/* Sort By */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-blue-500"
          >
            <option value="score">Top Scores</option>
            <option value="funding">Highest Funding</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 ml-auto xl:ml-0">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MY PROJECTS (TABLE OR GRID) */}
      {/* ========================================================= */}
      {filteredProjects.length === 0 && myProjects.length > 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium">No projects match your filters.</p>
        </div>
      ) : myProjects.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Radar Empty</h3>
          <p className="text-sm text-slate-500 mb-6">You aren't tracking any airdrops yet.</p>
          <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
            Explore Airdrops
          </Link>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest h-14">
                  <th className="px-6 text-left">Project</th>
                  <th className="px-4 text-left">Category</th>
                  <th className="px-4 text-left">Funding</th>
                  <th className="px-4 text-left">Tier</th>
                  <th className="px-4 text-left">Progress</th>
                  <th className="px-4 text-center">Score</th>
                  <th className="px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((proj) => (
                  <tr key={proj.id} className="h-16 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6">
                      <Link to={`/${proj.slug || proj.id}/airdropguide`} className="flex items-center gap-3 w-fit group">
                        <div className="relative">
                          <img src={proj.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${proj.name}`} className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm bg-white shrink-0" alt="" />
                          {/* 🚀 Messenger Notification Badge */}
                          {proj.hasNewTasks && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full animate-pulse shadow-sm"></div>}
                        </div>
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{proj.name}</span>
                      </Link>
                    </td>
                    <td className="px-4"><span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{proj.category || 'General'}</span></td>
                    <td className="px-4"><span className="text-sm font-bold text-slate-700">{proj.funding || 'TBA'}</span></td>
                    <td className="px-4"><span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-widest">{proj.tier || 'TBA'}</span></td>
                    <td className="px-4">
                      <div className="flex flex-col gap-1.5 w-32">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{proj.completedTasks} / {proj.totalTasks} Tasks</span>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${proj.progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${proj.progressPercent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black border ${proj.calculatedScore >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                        {proj.calculatedScore}
                      </span>
                    </td>
                    <td className="px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/${proj.slug || proj.id}/airdropguide`} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 rounded-xl text-xs font-bold transition-all shadow-sm">View</Link>
                        <button onClick={() => handleUnsubscribe(proj.id, proj.name)} className="px-4 py-2 bg-slate-50 border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 rounded-xl text-xs font-bold transition-all">Drop</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map(proj => (
            <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col relative group">
               {/* 🚀 Messenger Notification Badge */}
               {proj.hasNewTasks && <div className="absolute top-4 right-4 w-3 h-3 bg-rose-500 border-2 border-white rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"></div>}
               
               <div className="flex items-center gap-4 mb-5">
                 <img src={proj.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${proj.name}`} className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-100 shadow-sm shrink-0" alt="" />
                 <div>
                   <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors truncate">{proj.name}</h4>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{proj.tier || 'TBA'} • {proj.funding || 'TBA'}</p>
                 </div>
               </div>
               
               <div className="mb-5">
                 <div className="flex justify-between items-center mb-1.5">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress ({proj.completedTasks}/{proj.totalTasks})</span>
                   <span className="text-[10px] font-black text-slate-700">{proj.progressPercent}%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full rounded-full transition-all duration-500 ${proj.progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${proj.progressPercent}%` }} />
                 </div>
               </div>
               
               <div className="mt-auto flex gap-2">
                 <Link to={`/${proj.slug || proj.id}/airdropguide`} className="flex-1 text-center py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all">Open Dashboard</Link>
                 <button onClick={() => handleUnsubscribe(proj.id, proj.name)} className="px-3 py-2.5 bg-slate-50 border border-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all"><X className="w-4 h-4 mx-auto" /></button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* ALPHA DISCOVERY (HIGH SCORE RECOMMENDATIONS) */}
      {/* ========================================================= */}
      {recommended.length > 0 && (
        <div className="mt-16 pt-10 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Alpha Discovery</h2>
              <span className="ml-2 px-2.5 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-md border border-amber-200">Top Scores</span>
            </div>
             <Link to="/subscription" className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
               Unlock more slots <ArrowUpRight className="w-3.5 h-3.5" />
             </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommended.map(proj => (
              <div key={proj.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-5 relative z-10">
                  <img src={proj.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${proj.name}`} className="w-12 h-12 rounded-xl border border-slate-700 object-cover shadow-sm shrink-0" alt="" />
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md uppercase tracking-widest">Score: {proj.calculatedScore}</span>
                </div>
                
                <h4 className="font-bold text-white text-lg mb-1.5 relative z-10 truncate">{proj.name}</h4>
                <p className="text-xs font-medium text-slate-400 mb-6 relative z-10 line-clamp-1">{proj.category || 'DeFi'} • {proj.funding || 'TBA'}</p>
                
                <button 
                  onClick={() => handleAddProject(proj.id, proj.name)}
                  className="w-full py-3 bg-white/10 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative z-10 border border-white/5 hover:border-transparent"
                >
                  <Plus className="w-4 h-4" /> Track Project
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}