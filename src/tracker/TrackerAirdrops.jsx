import React, { useState, useEffect, useRef } from "react";
import { useAuth } from '../useAuth'; 
import { supabase } from '../supabaseClient'; 
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  Search, Filter, Plus, MoreVertical, ChevronDown,
  ChevronRight, CalendarCheck, Zap,
  Briefcase
} from "lucide-react";

const FUNDING_OPTIONS = [
  { label: 'Any funding', value: 0 },
  { label: '$10M+', value: 10 },
  { label: '$50M+', value: 50 },
  { label: '$100M+', value: 100 },
  { label: '$250M+', value: 250 },
  { label: '$500M+', value: 500 },
  { label: '$1B+', value: 1000 },
];

function fundingToMillions(funding) {
  if (typeof funding === 'number') return funding;
  const match = String(funding || '').replace(/,/g, '').match(/([\d.]+)\s*([kmb])?/i);
  if (!match) return 0;

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === 'b') return amount * 1000;
  if (unit === 'k') return amount / 1000;
  return amount;
}

export default function TrackerAirdrops() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    statuses: [],
    tiers: [],
    fundingMin: 0,
    scoreRange: [0, 100],
  });
  const filterMenuRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Data States
  const [allProjects, setAllProjects] = useState([]);
  const [trackedProjectIds, setTrackedProjectIds] = useState([]);
  const [userTasksStats, setUserTasksStats] = useState({});

  // SAAS Limits
  const [activeLimit, setActiveLimit] = useState(5);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  useEffect(() => {
    const closeFilters = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFiltersOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsFiltersOpen(false);
    };

    document.addEventListener('mousedown', closeFilters);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeFilters);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_expires_at, project_limit')
        .eq('auth_id', user.id)
        .maybeSingle();

      let currentLimit = 5; 
      const now = new Date();
      const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
      
      if ((profile?.subscription_tier === 'Voyager Pass' || profile?.subscription_tier === 'Sailor Pass') && (!expiresAt || expiresAt > now)) {
          currentLimit = profile?.project_limit || 999;
      }
      setActiveLimit(currentLimit);

      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: tracked } = await supabase
        .from('tracker_user_projects')
        .select('project_id')
        .eq('auth_id', user.id);

      const trackedIds = tracked ? tracked.map(t => t.project_id) : [];
      
      const { data: userTasks } = await supabase
        .from('tracker_user_tasks')
        .select('project_id, status')
        .eq('auth_id', user.id);

      const stats = {};
      if (userTasks) {
        userTasks.forEach(task => {
          if (!stats[task.project_id]) stats[task.project_id] = { total: 0, completed: 0 };
          stats[task.project_id].total += 1;
          if (task.status === 'completed') stats[task.project_id].completed += 1;
        });
      }

      setAllProjects(projects || []);
      setTrackedProjectIds(trackedIds);
      setUserTasksStats(stats);

    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackProject = async (project) => {
    if (trackedProjectIds.length >= activeLimit) {
      alert(`Limit Reached! You can only track ${activeLimit} projects on your current tier. Please upgrade to the Voyager Pass for unlimited tracking.`);
      return;
    }

    setIsProcessing(true);
    try {
      setTrackedProjectIds(prev => [project.id, ...prev]);

      const { error } = await supabase.rpc('track_project_and_sync', {
        p_auth_id: user.id,
        p_project_id: project.id,
        p_local_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      if (error) throw error;
      await fetchDashboardData(); 

    } catch (error) {
      console.error("Auto-sync tracking error:", error);
      alert("Failed to track project. Please try again.");
      setTrackedProjectIds(prev => prev.filter(id => id !== project.id));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUntrackProject = async (project) => {
    if (!window.confirm(`Are you sure you want to untrack ${project.name}? This will remove all associated tasks from your tracker.`)) {
      return;
    }
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('tracker_user_projects')
        .delete()
        .match({ auth_id: user.id, project_id: project.id });

      if (error) throw error;
      
      setTrackedProjectIds(prev => prev.filter(id => id !== project.id));
      await fetchDashboardData();
      
    } catch (error) {
      console.error("Untrack error:", error);
      alert("Failed to untrack project.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- DATA FILTERING ---
  const statusOptions = [...new Set(allProjects.map(project => project.status || 'Not Started'))].sort();
  const tierOptions = [...new Set(allProjects.map(project => project.tier).filter(Boolean))].sort();
  const hasActiveFilters = filters.statuses.length > 0 || filters.tiers.length > 0 || filters.fundingMin > 0 || filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100;

  const searchedProjects = allProjects.filter(project => {
    const score = Number(project.score_total) || 0;
    const status = project.status || 'Not Started';

    return project.name.toLowerCase().includes(searchTerm.toLowerCase())
      && (filters.statuses.length === 0 || filters.statuses.includes(status))
      && (filters.tiers.length === 0 || filters.tiers.includes(project.tier))
      && fundingToMillions(project.funding) >= filters.fundingMin
      && score >= filters.scoreRange[0]
      && score <= filters.scoreRange[1];
  });
  
  const trackedProjectsList = searchedProjects.filter(p => trackedProjectIds.includes(p.id));
  const tier1Available = searchedProjects.filter(p => !trackedProjectIds.includes(p.id) && p.tier === 'Tier 1');
  const newAvailable = searchedProjects.filter(p => !trackedProjectIds.includes(p.id) && p.tier !== 'Tier 1');

  return (
    <div className="max-w-[1600px] mx-auto w-full px-6 lg:px-8 py-8 space-y-10 font-sans pb-20">
      
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Airdrop Tracker</h1>
          <p className="text-[13px] font-medium text-slate-500 mt-1">
            Track projects, complete tasks and earn more rewards.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-sm transition-all"
            />
          </div>
          <div className="relative" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => setIsFiltersOpen(open => !open)}
              aria-expanded={isFiltersOpen}
              aria-haspopup="dialog"
              className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Filter className="w-4 h-4" /> Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-label="Filters active" />}
              <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFiltersOpen && (
              <div
                role="dialog"
                aria-label="Filter projects"
                className="absolute right-0 mt-2 z-50 w-[min(24rem,calc(100vw-3rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Filter projects</h2>
                  <button
                    type="button"
                    onClick={() => setFilters({ statuses: [], tiers: [], fundingMin: 0, scoreRange: [0, 100] })}
                    disabled={!hasActiveFilters}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                  >
                    Clear all
                  </button>
                </div>

                <FilterCheckboxGroup
                  label="Current Phase"
                  options={statusOptions}
                  selected={filters.statuses}
                  onChange={(statuses) => setFilters(current => ({ ...current, statuses }))}
                />
                <FilterCheckboxGroup
                  label="Tier"
                  options={tierOptions}
                  selected={filters.tiers}
                  onChange={(tiers) => setFilters(current => ({ ...current, tiers }))}
                />

                <div className="pt-4 border-t border-slate-100">
                  <label htmlFor="funding-filter" className="block text-[13px] font-bold text-slate-900 mb-2">Funding</label>
                  <select
                    id="funding-filter"
                    value={filters.fundingMin}
                    onChange={(event) => setFilters(current => ({ ...current, fundingMin: Number(event.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    {FUNDING_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="score-min-filter" className="text-[13px] font-bold text-slate-900">Airdrop Score</label>
                    <span className="text-xs font-semibold text-slate-500">{filters.scoreRange[0]} – {filters.scoreRange[1]}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      id="score-min-filter"
                      type="range"
                      min="0"
                      max="100"
                      value={filters.scoreRange[0]}
                      aria-label="Minimum airdrop score"
                      onChange={(event) => setFilters(current => ({ ...current, scoreRange: [Math.min(Number(event.target.value), current.scoreRange[1]), current.scoreRange[1]] }))}
                      className="w-full accent-blue-600"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.scoreRange[1]}
                      aria-label="Maximum airdrop score"
                      onChange={(event) => setFilters(current => ({ ...current, scoreRange: [current.scoreRange[0], Math.max(Number(event.target.value), current.scoreRange[0])] }))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1"><span>Min</span><span>Max</span></div>
                </div>

                <button type="button" onClick={() => setIsFiltersOpen(false)} className="mt-4 w-full rounded-lg bg-slate-900 py-2.5 text-[13px] font-semibold text-white hover:bg-slate-800 transition-colors">
                  Show {searchedProjects.length} project{searchedProjects.length === 1 ? '' : 's'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 1. PERSONAL WORKSPACE ─── */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            1. Personal Workspace
          </h2>
        </div>
        <div className="bg-gradient-to-r from-white to-slate-50/50 border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
               <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">My Routines & Notes</h3>
              <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                Manage your independent habits, gas funds, and custom task notes in one place.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/tracker/tasks')} 
            className="shrink-0 w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Open Workspace <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ─── 2. TRACKED PROJECTS ─── */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            2. Tracked Projects <span className="text-slate-400 font-medium ml-1 text-[13px]">({trackedProjectsList.length} / {activeLimit === 999 ? '∞' : activeLimit})</span>
          </h2>
        </div>
        
        {!loading && trackedProjectsList.length === 0 ? (
          <div className="w-full border-2 border-dashed border-slate-200 rounded-2xl py-12 flex flex-col items-center justify-center text-slate-500">
            <CalendarCheck className="w-8 h-8 mb-2 text-slate-300" />
            <p className="font-medium">No projects tracked yet</p>
            <p className="text-xs">Add a project below to start farming.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {trackedProjectsList.map(project => (
              <TrackedCard 
                key={project.id} 
                project={project} 
                stats={userTasksStats[project.id] || { total: project.task_count || 0, completed: 0 }} 
                onUntrack={() => handleUntrackProject(project)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── 3. TIER 1 PROJECTS AVAILABLE ─── */}
      {tier1Available.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">3. Tier 1 Projects Available</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {tier1Available.map(project => (
              <AvailableCard 
                key={project.id} 
                project={project} 
                onTrack={() => handleTrackProject(project)} 
                isProcessing={isProcessing}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── 4. NEW ADDED PROJECTS ─── */}
      {newAvailable.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">4. New Added Projects</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {newAvailable.map(project => (
              <AvailableCard 
                key={project.id} 
                project={project} 
                onTrack={() => handleTrackProject(project)} 
                isProcessing={isProcessing}
                isNew={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── AUTO-ASSIGNMENT BANNER ─── */}
      <div className="mt-12 bg-gradient-to-r from-[#f5f3ff] to-[#f0f9ff] border border-indigo-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-indigo-50">
            <Zap className="w-6 h-6 text-indigo-500 fill-indigo-100" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Auto Task Assignment</h3>
            <p className="text-[13px] text-slate-600 font-medium mt-0.5">
              When you add a project to tracker, all available tasks are automatically assigned with our smart recurring format.
            </p>
          </div>
        </div>
        
        <button className="shrink-0 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm relative z-10">
          Learn More
        </button>
      </div>

    </div>
  );
}

function FilterCheckboxGroup({ label, options, selected, onChange }) {
  const toggleOption = (option) => {
    onChange(selected.includes(option)
      ? selected.filter(value => value !== option)
      : [...selected, option]);
  };

  return (
    <fieldset className="pt-4">
      <legend className="text-[13px] font-bold text-slate-900 mb-2">{label}</legend>
      <div className="max-h-28 space-y-1 overflow-y-auto pr-1">
        {options.map(option => (
          <label key={option} className="flex items-center gap-2.5 rounded-md px-1 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggleOption(option)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            {option}
          </label>
        ))}
        {options.length === 0 && <p className="px-1 py-1.5 text-xs font-medium text-slate-400">No options available</p>}
      </div>
    </fieldset>
  );
}

// ============================================================================
// COMPACT UI CARD COMPONENTS (6 per row)
// ============================================================================

function TrackedCard({ project, stats, onUntrack }) {
  const [showMenu, setShowMenu] = useState(false);
  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col h-full z-0">
      
      {/* Custom Dropdown Menu for Untrack */}
      <div className="absolute top-3 right-3 z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-30">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onUntrack(); }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Untrack Project
              </button>
            </div>
          </>
        )}
      </div>

      {/* Card Header (Logo + Title) */}
      <div className="flex flex-col items-start mb-5 relative z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-2 w-full pr-6">
          <img 
            src={project.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${project.name}`} 
            alt={project.name} 
            className="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-100 shrink-0 pointer-events-auto"
          />
          <h3 className="text-sm font-bold text-slate-900 truncate">{project.name}</h3>
        </div>
        <span className="inline-block text-[10px] font-medium text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded pointer-events-auto">
          {project.tier || "Active"}
        </span>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-3 gap-2 pb-4 mb-4 border-b border-slate-100 items-end">
        <div>
          <div className="text-[13px] font-bold text-slate-900 truncate">{project.funding || "TBA"}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Funding</div>
        </div>
        
        {/* SCORE RING */}
        <div className="text-center border-l border-r border-slate-100 px-1 flex flex-col items-center justify-end">
          <ScoreRing score={project.score_total} />
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Score</div>
        </div>

        <div className="text-right">
          <div className={`text-[13px] font-bold ${getCostColor(project.total_cost_estimate)} truncate`}>
            {project.total_cost_estimate || "Low"}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Cost</div>
        </div>
      </div>

      {/* Progress Footer */}
      <div className="mt-auto">
        <div className="flex items-center gap-2 mb-2.5 truncate">
          <span className="text-[12px] font-medium text-slate-500 truncate">{project.status || "Not Started"}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
          <span className="text-[12px] font-semibold text-blue-600 truncate">{project.airdrop_status || "Possible"}</span>
        </div>
        
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1.5">
          <span>{stats.completed} / {stats.total} tasks</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

function AvailableCard({ project, onTrack, isProcessing, isNew }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition-colors flex flex-col h-full relative group z-0">
      
      <button className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100 z-10">
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Card Header (Logo + Title) */}
      <div className="flex flex-col items-start mb-5 relative z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-2 w-full pr-6">
          <img 
            src={project.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${project.name}`} 
            alt={project.name} 
            className="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-100 shrink-0 pointer-events-auto"
          />
          <h3 className="text-sm font-bold text-slate-900 truncate">{project.name}</h3>
        </div>
        {isNew ? (
          <span className="inline-block text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded pointer-events-auto">
            New
          </span>
        ) : (
          <span className="inline-block text-[10px] font-medium text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded pointer-events-auto">
            {project.tier || "Active"}
          </span>
        )}
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5 items-end">
        <div>
          <div className="text-[13px] font-bold text-slate-900 truncate">{project.funding || "TBA"}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Funding</div>
        </div>
        
        {/* SCORE RING */}
        <div className="text-center border-l border-r border-slate-100 px-1 flex flex-col items-center justify-end">
          <ScoreRing score={project.score_total} />
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Score</div>
        </div>

        <div className="text-right">
          <div className={`text-[13px] font-bold ${getCostColor(project.total_cost_estimate)} truncate`}>
            {project.total_cost_estimate || "Low"}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Cost</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 truncate">
        <span className="text-[12px] font-medium text-slate-500 truncate">{project.status || "Not Started"}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
        <span className="text-[12px] font-semibold text-blue-600 truncate">{project.airdrop_status || "Possible"}</span>
      </div>

      <button 
        onClick={onTrack}
        disabled={isProcessing}
        className="mt-auto w-full py-2 rounded-lg border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" /> Add to Tracker
      </button>
    </div>
  );
}

function getCostColor(costStr) {
  if (!costStr) return "text-emerald-500";
  const cost = costStr.toLowerCase();
  if (cost.includes('high')) return "text-rose-500";
  if (cost.includes('medium')) return "text-amber-500";
  return "text-emerald-500";
}

// Compact circular progress ring matched to the fonts
function ScoreRing({ score }) {
  const safeScore = Math.min(Math.max(score || 0, 0), 100);
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  const isHigh = safeScore >= 80;
  const isMedium = safeScore >= 50 && safeScore < 80;
  
  const strokeColor = isHigh ? '#10b981' : isMedium ? '#f59e0b' : '#ef4444'; 
  const trackColor = isHigh ? '#d1fae5' : isMedium ? '#fef3c7' : '#fee2e2';

  return (
    <div className="relative w-8 h-8 flex items-center justify-center mx-auto mb-0.5">
      <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 32 32">
        <circle
          cx="16" cy="16" r={radius}
          stroke={trackColor}
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="16" cy="16" r={radius}
          stroke={strokeColor}
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-900">
        {safeScore}
      </span>
    </div>
  );
}
