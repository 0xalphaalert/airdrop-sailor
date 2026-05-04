import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from './supabaseClient';
import { 
  Search, LayoutGrid, List, CheckCircle2, 
  Clock, Target, TrendingUp, ExternalLink, Check
} from 'lucide-react';

export default function ProfileTasks() {
  const { user } = usePrivy();
  const [loading, setLoading] = useState(true);
  const [myTasks, setMyTasks] = useState([]);

  // View & Filter States
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('All');
  const [filterProject, setFilterProject] = useState('All');

  useEffect(() => {
    if (user) {
      fetchTasksData();
    }
  }, [user]);

  const fetchTasksData = async () => {
    setLoading(true);
    const privyId = user.id;

    try {
      // 1. Find which projects the user is tracking
      const { data: subs } = await supabase.from('user_subscriptions').select('project_id').eq('auth_id', privyId);
      
      let enrichedTasks = [];

      if (subs && subs.length > 0) {
        const projectIds = subs.map(s => s.project_id);

        // 2. Fetch Projects, Tasks, and User Progress simultaneously
        const [
          { data: projectsData },
          { data: allTasks },
          { data: progress }
        ] = await Promise.all([
          supabase.from('projects').select('id, name, logo_url, tier').in('id', projectIds),
          supabase.from('tasks').select('*').in('project_id', projectIds),
          supabase.from('user_task_progress').select('*').eq('auth_id', privyId)
        ]);

        if (allTasks && projectsData) {
          enrichedTasks = allTasks.map(task => {
            const taskProgress = progress?.find(p => p.task_id === task.id);
            const isDoneEver = !!taskProgress;
            
            // 🚀 FIX: Master Archive NEVER marks Daily/Weekly tasks as completed
            const cleanRecurring = (task.recurring === 'Daily' || task.recurring === 'Weekly') 
              ? task.recurring 
              : 'One-Time';
            
            // If it's a recurring task, force it to be false so it never crosses out.
            // If it's a One-Time task, check if it was ever done.
            const isCompletedForUI = cleanRecurring === 'One-Time' ? isDoneEver : false;
            const parentProject = projectsData.find(p => p.id === task.project_id);
            
            return {
              ...task,
              isCompleted: isCompletedForUI,
              project_name: parentProject?.name || 'Unknown',
              project_logo: parentProject?.logo_url || '',
              project_tier: parentProject?.tier || 'TBA' // Fetched for filtering
            };
          });

          // 3. Sort logic: Put active, uncompleted tasks at the top
          enrichedTasks.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
            if (a.status !== b.status) return a.status === 'Active' ? -1 : 1;
            return 0;
          });
        }
      }

      setMyTasks(enrichedTasks);
    } catch (error) {
      console.error("All Tasks Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentlyCompleted) => {
    const privyId = user.id;
    try {
      // Optimistic UI update
      setMyTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, isCompleted: !currentlyCompleted } : t));

      if (currentlyCompleted) {
        await supabase.from('user_task_progress').delete().match({ auth_id: privyId, task_id: taskId });
      } else {
        await supabase.from('user_task_progress').upsert({ 
          auth_id: privyId, 
          task_id: taskId,
          completed_at: new Date().toISOString()
        }, { onConflict: 'auth_id,task_id' });
      }
    } catch (error) {
      console.error("Error toggling task:", error);
      fetchTasksData(); // Revert on failure
    }
  };

  // Helper: Calculate days remaining
  const getDaysLeft = (endDate) => {
    if (!endDate) return '-';
    const end = new Date(endDate);
    const today = new Date();
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends Today';
    return `${diffDays}d left`;
  };

  // --- STATS CALCULATIONS ---
  const totalTasks = myTasks.length;
  const totalCompleted = myTasks.filter(t => t.isCompleted).length;
  const totalRecurring = myTasks.filter(t => t.recurring && t.recurring !== 'One-time' && t.recurring !== 'One-Time').length;
  const completionPercentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  // --- FILTERING LOGIC ---
  const uniqueProjects = [...new Set(myTasks.map(t => t.project_name))];

  const filteredTasks = myTasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'All' ? true : t.project_tier?.includes(filterTier);
    const matchesProject = filterProject === 'All' ? true : t.project_name === filterProject;
    
    return matchesSearch && matchesTier && matchesProject;
  });

  if (loading) {
    return <div className="p-10 text-slate-400 font-medium animate-pulse">Loading Master Archive...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* 1. PAGE HEADER */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Master Task Archive</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">View, filter, and manage every available task across your portfolio.</p>
      </div>

      {/* 2. TOP METRIC CARDS (The 4 Rounded Things) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Tasks</p>
            <h4 className="text-2xl font-black text-slate-900 leading-none">{totalTasks}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Recurring</p>
            <h4 className="text-2xl font-black text-slate-900 leading-none">{totalRecurring}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Completed</p>
            <h4 className="text-2xl font-black text-slate-900 leading-none">{totalCompleted}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="w-full">
            <div className="flex justify-between items-end mb-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
              <h4 className="text-lg font-black text-slate-900 leading-none">{completionPercentage}%</h4>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className={`h-full rounded-full transition-all duration-1000 ${completionPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${completionPercentage}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTERS & CONTROLS */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Search Bar */}
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-60 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all"
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

          {/* Project Filter */}
          <select 
            value={filterProject} 
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 max-w-[150px] truncate"
          >
            <option value="All">All Projects</option>
            {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 ml-auto xl:ml-0 shrink-0">
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Tasks Found</h3>
          <p className="text-sm font-medium text-slate-500">Try adjusting your filters or subscribing to more projects.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest h-14">
                  <th className="px-6">Project</th>
                  <th className="px-4">Task Name</th>
                  <th className="px-4 text-center">Schedule</th>
                  <th className="px-4 text-center">Remaining</th>
                  <th className="px-4 text-center">Status</th>
                  <th className="px-4 text-center">Guide</th>
                  <th className="px-6 text-right">Done</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className={`h-16 transition-colors ${task.isCompleted ? 'bg-slate-50/50' : 'hover:bg-slate-50/80'}`}>
                    
                    <td className="px-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={task.project_logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${task.project_name}`} 
                          className={`w-8 h-8 rounded-full border border-slate-200 object-cover bg-white shadow-sm transition-all ${task.isCompleted ? 'opacity-50 grayscale' : ''}`} 
                          alt="" 
                        />
                        <div>
                          <span className={`block font-bold text-sm ${task.isCompleted ? 'text-slate-400' : 'text-slate-900'}`}>{task.project_name}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{task.project_tier || 'TBA'}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 max-w-[200px] truncate">
                      <span className={`font-medium text-sm ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`} title={task.name}>
                        {task.name}
                      </span>
                    </td>
                    
                    <td className="px-4 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${task.isCompleted ? 'bg-slate-100 text-slate-400 border-slate-200' : task.recurring !== 'One-time' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                        {task.recurring || 'One-Time'}
                      </span>
                    </td>
                    
                    <td className="px-4 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${getDaysLeft(task.end_date) === 'Ended' ? 'text-rose-500' : 'text-slate-500'}`}>
                        {getDaysLeft(task.end_date)}
                      </span>
                    </td>
                    
                    <td className="px-4 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${task.status === 'Ended' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        {task.status || 'Active'}
                      </span>
                    </td>
                    
                    <td className="px-4 text-center">
                      {task.link ? (
                        <a href={task.link} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors inline-flex justify-center w-full bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm hover:shadow">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : '-'}
                    </td>
                    
                    <td className="px-6 text-right">
                       <button 
                          onClick={() => handleToggleTask(task.id, task.isCompleted)}
                          disabled={task.status === 'Ended' && !task.isCompleted}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ml-auto ${
                            task.isCompleted 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20' 
                              : task.status === 'Ended' 
                                ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-50' 
                                : 'bg-white border-slate-300 hover:border-blue-400 shadow-sm'
                          }`}
                       >
                         {task.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTasks.map(task => (
            <div key={task.id} className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col relative group ${task.isCompleted ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'}`}>
               
               <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                   <img src={task.project_logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${task.project_name}`} className={`w-10 h-10 rounded-full object-cover ring-1 ring-slate-100 shadow-sm ${task.isCompleted ? 'grayscale opacity-60' : ''}`} alt="" />
                   <div>
                     <h4 className={`text-sm font-bold truncate ${task.isCompleted ? 'text-slate-500' : 'text-slate-900'}`}>{task.project_name}</h4>
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{task.project_tier || 'TBA'} • {task.recurring || 'One-time'}</p>
                   </div>
                 </div>
                 <button 
                    onClick={() => handleToggleTask(task.id, task.isCompleted)}
                    disabled={task.status === 'Ended' && !task.isCompleted}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                      task.isCompleted 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                        : task.status === 'Ended' 
                          ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-50' 
                          : 'bg-white border-slate-300 hover:border-blue-400 shadow-sm group-hover:border-blue-400'
                    }`}
                 >
                   {task.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                 </button>
               </div>
               
               <h3 className={`font-semibold text-sm mb-4 line-clamp-2 ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                 {task.name}
               </h3>
               
               <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                 <span className={`text-[10px] font-black uppercase tracking-widest ${getDaysLeft(task.end_date) === 'Ended' ? 'text-rose-500' : 'text-slate-500'}`}>
                   {getDaysLeft(task.end_date)}
                 </span>
                 {task.link && (
                    <a href={task.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-sm">
                      Guide <ExternalLink className="w-3 h-3" />
                    </a>
                 )}
               </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}