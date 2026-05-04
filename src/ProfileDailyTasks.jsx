import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from './supabaseClient';
import ReactMarkdown from 'react-markdown';
import { 
  Search, CheckCircle2, Clock, 
  Target, Zap, ExternalLink, Check, ShieldAlert, X 
} from 'lucide-react';

export default function ProfileDailyTasks() {
  const { user } = usePrivy();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('All');
  const [filterProject, setFilterProject] = useState('All');

  useEffect(() => {
    if (user) fetchActionList();
  }, [user]);

  const fetchActionList = async () => {
    setLoading(true);
    const privyId = user.id;

    try {
      const { data: subs } = await supabase.from('user_subscriptions').select('project_id').eq('auth_id', privyId);
      let enrichedTasks = [];

      if (subs && subs.length > 0) {
        const projectIds = subs.map(s => s.project_id);

        const [
          { data: projectsData },
          { data: allTasks },
          { data: progress }
        ] = await Promise.all([
          supabase.from('projects').select('id, name, logo_url, tier').in('id', projectIds),
          // 🚀 FIX 1: Fetch tasks with ANY active-like status and remove strict frequency filters
          supabase.from('tasks')
            .select('*')
            .in('project_id', projectIds)
            .in('status', ['Active', 'Ending Soon', 'High Priority']),
          supabase.from('user_task_progress').select('*').eq('auth_id', privyId)
        ]);

        if (allTasks && projectsData) {
          const today = new Date();
          const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          const sevenDaysAgo = today.getTime() - (7 * 24 * 60 * 60 * 1000);

          enrichedTasks = allTasks.map(task => {
            const taskProgress = progress?.find(p => p.task_id === task.id);
            let isCompletedForTimeframe = false;
            
            // 🚀 FIX 2: Normalize database weirdness. If it isn't explicitly Daily or Weekly, force it to 'One-Time'
            const cleanRecurring = (task.recurring === 'Daily' || task.recurring === 'Weekly') 
              ? task.recurring 
              : 'One-Time';
            
            // SMART TIMEFRAME LOGIC
            if (taskProgress && taskProgress.completed_at) {
              const completedTime = new Date(taskProgress.completed_at).getTime();
              if (cleanRecurring === 'Daily') {
                isCompletedForTimeframe = completedTime >= startOfToday;
              } else if (cleanRecurring === 'Weekly') {
                isCompletedForTimeframe = completedTime >= sevenDaysAgo;
              } else {
                // One-Time tasks are permanently marked as done once completed
                isCompletedForTimeframe = true; 
              }
            }

            const parentProject = projectsData.find(p => p.id === task.project_id);
            
            return {
              ...task,
              recurring: cleanRecurring, // 🚀 Overwrite the raw DB value with our clean one
              isCompleted: isCompletedForTimeframe,
              project_name: parentProject?.name || 'Unknown',
              project_logo: parentProject?.logo_url || '',
              project_tier: parentProject?.tier || 'TBA'
            };
          });

          // 🚀 FIX 3: Cleanly filter out completed One-Time tasks using our normalized name
          enrichedTasks = enrichedTasks.filter(t => {
            return !(t.recurring === 'One-Time' && t.isCompleted);
          });

          // Sort: Pending top, Completed bottom
          enrichedTasks.sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1));
        }
      }

      setTasks(enrichedTasks);
    } catch (error) {
      console.error("Action List Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentlyCompleted) => {
    const privyId = user.id;
    
    // --- CHECK FOR DAILY BONUS TRIGGER ---
    const clickedTask = tasks.find(t => t.id === taskId);
    // If they are checking a task (not unchecking) and it's a Daily task
    if (clickedTask && clickedTask.recurring === 'Daily' && !currentlyCompleted) {
      // Count how many daily tasks are CURRENTLY incomplete
      const pendingDailyTasks = tasks.filter(t => t.recurring === 'Daily' && !t.isCompleted);
      
      // If there is exactly 1 incomplete daily task left, and they just clicked it...
      if (pendingDailyTasks.length === 1) {
        claimDailyTaskBonus(); // Fire the Edge Function!
      }
    }

    try {
      // Optimistic UI update for instant feedback
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !currentlyCompleted } : t));

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
      fetchActionList(); // Revert on fail
    }
  };

  // --- NEW: Claim Bonus API Call ---
  const claimDailyTaskBonus = async () => {
    try {
      const response = await fetch('https://ptobheftxcjiqobxgeal.supabase.co/functions/v1/daily-tasks-bonus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0b2JoZWZ0eGNqaXFvYnhnZWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjU0NzYsImV4cCI6MjA4NDE0MTQ3Nn0.kgs53pdaRHM2G_xsIrw0PbGex-Z-7DuKGfdxBRMRVU8` 
        },
        body: JSON.stringify({ auth_id: user.id })
      });

      const result = await response.json();

      if (result.success) {
        // Alert the user they got the points!
        alert(`🎉 ${result.message}`);
      } else {
        // Silently fail if they already claimed it today
        console.log("Daily bonus check:", result.message);
      }
    } catch (error) {
      console.error("Failed to claim daily bonus", error);
    }
  };

  

  // Helper to format dates cleanly
  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // --- THE 4 TOP METRICS ---
  const dailyTasks = tasks.filter(t => t.recurring === 'Daily');
  const weeklyTasks = tasks.filter(t => t.recurring === 'Weekly');
  
  const totalDaily = dailyTasks.length;
  const completedDaily = dailyTasks.filter(t => t.isCompleted).length;
  const dailyPercent = totalDaily > 0 ? Math.round((completedDaily / totalDaily) * 100) : 0;

  const totalWeekly = weeklyTasks.length;
  const completedWeekly = weeklyTasks.filter(t => t.isCompleted).length;
  const weeklyPercent = totalWeekly > 0 ? Math.round((completedWeekly / totalWeekly) * 100) : 0;

  const tier1Tasks = tasks.filter(t => t.project_tier?.includes('1'));
  const tier1Pending = tier1Tasks.filter(t => !t.isCompleted).length;

  // --- FILTERING LOGIC ---
  const uniqueProjects = [...new Set(tasks.map(t => t.project_name))];

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'All' ? true : t.project_tier?.includes(filterTier);
    const matchesProject = filterProject === 'All' ? true : t.project_name === filterProject;
    return matchesSearch && matchesTier && matchesProject;
  });

  const pendingCount = filteredTasks.filter(t => !t.isCompleted).length;

  if (loading) return <div className="p-10 text-slate-400 font-medium animate-pulse">Loading Action List...</div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Action Radar</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Farm your recurring interactions and complete pending one-time tasks.</p>
        </div>
        <span className="text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
          {pendingCount} Pending Actions
        </span>
      </div>

      {/* THE 4 ROUNDED METRIC BOXES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Box 1: Total Daily */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Daily</p>
            <h4 className="text-2xl font-black text-slate-900 leading-none">{totalDaily}</h4>
          </div>
        </div>

        {/* Box 2: Daily Completion % */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="w-full">
            <div className="flex justify-between items-end mb-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Progress</p>
              <h4 className="text-lg font-black text-slate-900 leading-none">{dailyPercent}%</h4>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className={`h-full rounded-full transition-all duration-1000 ${dailyPercent === 100 ? 'bg-emerald-500' : 'bg-emerald-400'}`} style={{ width: `${dailyPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Box 3: Weekly Completion % */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 border border-purple-100">
            <Clock className="w-6 h-6" />
          </div>
          <div className="w-full">
            <div className="flex justify-between items-end mb-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Progress</p>
              <h4 className="text-lg font-black text-slate-900 leading-none">{weeklyPercent}%</h4>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className={`h-full rounded-full transition-all duration-1000 ${weeklyPercent === 100 ? 'bg-purple-500' : 'bg-purple-400'}`} style={{ width: `${weeklyPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Box 4: Tier 1 Left */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-amber-200 transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <ShieldAlert className="w-24 h-24 text-amber-500" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100 relative z-10">
            <Zap className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tier 1 Tasks Left</p>
            <h4 className="text-2xl font-black text-amber-600 leading-none">{tier1Pending}</h4>
          </div>
        </div>

      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-grow sm:flex-grow-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search actions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full sm:w-60 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all"
          />
        </div>

        {/* Tier */}
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-blue-500">
          <option value="All">All Tiers</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>

        {/* Project */}
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 max-w-[150px] truncate">
          <option value="All">All Projects</option>
          {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredTasks.length === 0 ? (
           <div className="p-16 text-center">
             <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
               <CheckCircle2 className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-1">No Actions Found</h3>
             <p className="text-sm font-medium text-slate-500">Adjust your filters or track more projects.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest h-14">
                  <th className="px-6 w-16 text-center">Done</th>
                  <th className="px-6">Project</th>
                  <th className="px-6">Task Name</th>
                  <th className="px-4 text-center">Schedule</th>
                  <th className="px-4 text-center">Cost/Gas</th>
                  <th className="px-6 text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <tr 
                      className={`h-16 transition-colors cursor-pointer hover:bg-slate-50/80 ${task.isCompleted ? 'opacity-60 bg-slate-50/50' : ''}`}
                      onClick={() => setSelectedTask(task)}
                    >
                      {/* Checkbox */}
                      <td className="px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleToggleTask(task.id, task.isCompleted)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all mx-auto shadow-sm ${
                            task.isCompleted 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-white border-slate-300 hover:border-blue-500'
                          }`}
                        >
                          {task.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                      </td>
                      
                      {/* Project Info */}
                      <td className="px-6">
                        <div className="flex items-center gap-3">
                          <img src={task.project_logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${task.project_name}`} className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-sm bg-white" alt="" />
                          <div>
                             <span className={`block font-bold text-sm ${task.isCompleted ? 'text-slate-500' : 'text-slate-900'}`}>{task.project_name}</span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{task.project_tier || 'TBA'}</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Task Name */}
                      <td className="px-6 max-w-[200px] truncate">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-700'}`} title={task.name}>{task.name}</span>
                          {!task.isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0"></span>}
                        </div>
                      </td>

                      {/* Schedule Badge */}
                      <td className="px-4 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                          task.recurring === 'Weekly' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                          (task.recurring === 'One-Time' || task.recurring === 'Once') ? 'bg-slate-100 text-slate-600 border-slate-300' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {task.recurring}
                        </span>
                      </td>
                      
                      {/* Cost */}
                      <td className="px-4 text-center">
                        <span className="text-sm font-medium text-slate-500">{task.cost > 0 ? `$${task.cost}` : 'Free'}</span>
                      </td>
                      
                      {/* Action & Expand */}
                      <td className="px-6 text-right flex justify-end items-center gap-4 h-16">
                        {task.link && !task.isCompleted && (
                          <a href={task.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl text-xs font-bold transition-all shadow-sm">
                            Go to App
                          </a>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
  View
</span>
                      </td>
                    </tr>

                
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* ========================================= */}
      {/* 🚀 NEW: PREMIUM MODAL POPUP               */}
      {/* ========================================= */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Blurred Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer" 
            onClick={() => setSelectedTask(null)}
          ></div>
          
          {/* Modal Container */}
          <div className="relative w-full max-w-4xl bg-[#F8FAFC] rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-white px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedTask.project_logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${selectedTask.project_name}`} 
                  className="w-14 h-14 rounded-2xl border border-slate-100 shadow-sm object-cover" 
                  alt="" 
                />
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedTask.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-slate-500">{selectedTask.project_name}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {selectedTask.project_tier || 'TBA'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTask(null)} 
                className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-full flex items-center justify-center transition-colors border border-slate-200 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 md:p-8 overflow-y-auto flex flex-col md:flex-row gap-8">
              
              {/* Left Column: Markdown Article */}
              <div className="flex-1 w-full">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Step-by-Step Guide
                </p>
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="prose prose-sm md:prose-base prose-slate max-w-none 
                    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 
                    prose-p:text-slate-600 prose-p:font-medium 
                    prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                    prose-li:font-medium prose-li:text-slate-600"
                  >
                    <ReactMarkdown
                      components={{
                        a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 marker:text-blue-500 marker:font-bold" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 marker:text-slate-400" {...props} />
                      }}
                    >
                      {selectedTask.tutorial_markdown || selectedTask.description || "No specific instructions mapped. Click the launch button to proceed directly."}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Right Column: Meta Data */}
              <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</span>
                    <span className="text-sm font-bold text-slate-900">{formatDate(selectedTask.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Date</span>
                    <span className="text-sm font-bold text-slate-900">{formatDate(selectedTask.end_date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost</span>
                    <span className="text-sm font-bold text-slate-900">{selectedTask.cost > 0 ? `$${selectedTask.cost}` : 'Free'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                      selectedTask.recurring === 'Weekly' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                      (selectedTask.recurring === 'One-Time' || selectedTask.recurring === 'Once') ? 'bg-slate-100 text-slate-600 border-slate-300' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {selectedTask.recurring}
                    </span>
                  </div>
                </div>

                {/* Launch Action Button */}
                {selectedTask.link && (
                  <a 
                    href={selectedTask.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-black text-sm shadow-md shadow-blue-500/20 hover:-translate-y-0.5 transition-all"
                  >
                    Launch App <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}