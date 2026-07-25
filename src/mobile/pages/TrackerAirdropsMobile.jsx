import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, Plus } from 'lucide-react';
import { useAuth } from '../../useAuth';
import { supabase } from '../../supabaseClient';
import TrackerLayoutMobile from '../components/TrackerLayoutMobile';

const fundingToMillions = (funding) => { 
  const match = String(funding || '').replace(/,/g, '').match(/([\d.]+)\s*([kmb])?/i); 
  if (!match) return 0; 
  const value = Number(match[1]); 
  return match[2]?.toLowerCase() === 'b' ? value * 1000 : match[2]?.toLowerCase() === 'k' ? value / 1000 : value; 
};

const FUNDING_OPTIONS = [
  { label: 'Any funding', value: 0 }, 
  { label: '$10M+', value: 10 }, 
  { label: '$50M+', value: 50 }, 
  { label: '$100M+', value: 100 }, 
  { label: '$250M+', value: 250 }
];

export default function TrackerAirdropsMobile() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [trackedIds, setTrackedIds] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ tier: 'all', funding: 0 });
  
  // NEW: State for our Tabbed UI
  const [activeTab, setActiveTab] = useState('tracked'); 

  const fetchProjects = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [projectsResult, trackedResult, tasksResult] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('tracker_user_projects').select('project_id').eq('auth_id', user.id),
      supabase.from('tracker_user_tasks').select('project_id, status').eq('auth_id', user.id),
    ]);
    const stats = {};
    (tasksResult.data || []).forEach((task) => { 
      stats[task.project_id] ||= { total: 0, completed: 0 }; 
      stats[task.project_id].total += 1; 
      if (task.status === 'completed') stats[task.project_id].completed += 1; 
    });
    setProjects(projectsResult.data || []); 
    setTrackedIds((trackedResult.data || []).map((item) => item.project_id)); 
    setTaskStats(stats); 
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  
  const tiers = useMemo(() => [...new Set(projects.map((project) => project.tier).filter(Boolean))].sort(), [projects]);
  const filtered = useMemo(() => projects.filter((project) => (filters.tier === 'all' || project.tier === filters.tier) && fundingToMillions(project.funding) >= filters.funding), [filters, projects]);
  
  const tracked = filtered.filter((project) => trackedIds.includes(project.id));
  const available = filtered.filter((project) => !trackedIds.includes(project.id));

  const track = async (project) => { 
    if (!user || processing) return; 
    setProcessing(true); 
    try { 
      const { error } = await supabase.rpc('track_project_and_sync', { p_auth_id: user.id, p_project_id: project.id, p_local_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }); 
      if (error) throw error; 
      await fetchProjects(); 
    } catch (error) { 
      console.error('Unable to track project:', error); 
    } finally { 
      setProcessing(false); 
    } 
  };
  
  const untrack = async (project) => { 
    if (!user || processing || !window.confirm(`Untrack ${project.name}?`)) return; 
    setProcessing(true); 
    try { 
      const { error } = await supabase.from('tracker_user_projects').delete().match({ auth_id: user.id, project_id: project.id }); 
      if (error) throw error; 
      await fetchProjects(); 
    } catch (error) { 
      console.error('Unable to untrack project:', error); 
    } finally { 
      setProcessing(false); 
    } 
  };

  return (
    <TrackerLayoutMobile>
      <div className="space-y-5 px-4 pt-2 pb-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Airdrops</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Discover and track opportunities.</p>
          </div>
          <button 
            type="button" 
            onClick={() => setFilterOpen((open) => !open)} 
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${filterOpen ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>

        {/* FILTERS DROPDOWN */}
        {filterOpen && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-in slide-in-from-top-2">
            <label className="text-xs font-bold text-slate-600">Tier
              <select value={filters.tier} onChange={(event) => setFilters((current) => ({ ...current, tier: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-violet-400">
                <option value="all">All tiers</option>
                {tiers.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-xs font-bold text-slate-600">Funding
              <select value={filters.funding} onChange={(event) => setFilters((current) => ({ ...current, funding: Number(event.target.value) }))} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-violet-400">
                {FUNDING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
        )}

        {/* TABS (Segmented Control) */}
        <div className="flex p-1 bg-slate-200/60 rounded-xl">
          <button
            onClick={() => setActiveTab('tracked')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'tracked' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Tracked ({tracked.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'available' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Available ({available.length})
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="pt-2">
          {activeTab === 'tracked' ? (
            <ProjectSection 
              empty="No projects tracked yet." 
              projects={tracked} 
              taskStats={taskStats} 
              loading={loading} 
              actionLabel="Untrack" 
              onAction={untrack} 
              processing={processing} 
            />
          ) : (
            <ProjectSection 
              empty="No projects match these filters." 
              projects={available} 
              taskStats={taskStats} 
              loading={loading} 
              actionLabel="Add to Tracker" 
              onAction={track} 
              processing={processing} 
            />
          )}
        </div>

      </div>
    </TrackerLayoutMobile>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function ProjectSection({ empty, projects, taskStats, loading, actionLabel, onAction, processing }) { 
  return (
    <div className="space-y-4">
      {loading ? (
        <p className="py-12 text-center text-sm font-medium text-slate-400">Loading projects…</p>
      ) : projects.length > 0 ? (
        projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            stats={taskStats[project.id]} 
            actionLabel={actionLabel} 
            onAction={() => onAction(project)} 
            processing={processing} 
          />
        ))
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 py-12 text-center flex flex-col items-center">
           <p className="text-sm font-bold text-slate-500">{empty}</p>
        </div>
      )}
    </div>
  ); 
}

function ProjectCard({ project, stats = { total: 0, completed: 0 }, actionLabel, onAction, processing }) { 
  const progress = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0; 
  
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col items-start gap-4">
        
        {/* Header: Logo, Title, Score */}
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={project.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${project.name}`} alt="" className="h-12 w-12 rounded-full border border-slate-100 bg-slate-50 object-cover shrink-0" />
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-900 leading-tight">{project.name}</h3>
              <span className="mt-1.5 inline-flex rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600">
                {project.tier || 'Active'}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <ScoreRing score={project.social_score} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-5 flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="bg-slate-50 px-2 py-1 rounded-md text-slate-600">{project.funding || 'Funding TBA'}</span>
        <span>{stats.completed} / {stats.total} tasks</span>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      
      {/* Action Button */}
      <button 
        type="button" 
        disabled={processing} 
        onClick={onAction} 
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold active:scale-[0.98] transition-all ${
          actionLabel === 'Untrack' 
            ? 'border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100' 
            : 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {actionLabel === 'Add to Tracker' && <Plus className="h-4 w-4" />}
        {actionLabel}
      </button>
    </article>
  ); 
}

function ScoreRing({ score }) { 
  const value = Math.min(Math.max(Number(score) || 0, 0), 100); 
  const circumference = 2 * Math.PI * 16; 
  return (
    <div className="relative h-11 w-11 flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-11 w-11 -rotate-90">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#f1f5f9" strokeWidth="4" />
        <circle cx="20" cy="20" r="16" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - value / 100 * circumference} className="transition-all duration-700 ease-out" />
      </svg>
      <span className="relative z-10 flex items-center justify-center text-[11px] font-black text-slate-900">{value}</span>
    </div>
  ); 
}