import React, { useState, useMemo } from 'react';
import { ChevronRight, Search, FolderKanban } from 'lucide-react';
import TrackerLayoutMobile from '../components/TrackerLayoutMobile';
import { useTracker } from '../context/TrackerContext';
import { TaskBottomSheetMobile } from '../components/TaskBottomSheetMobile';

// Helper functions
const isComplete = (task) => task.status === 'completed';
const isOverdue = (task) => !isComplete(task) && task.nextDue && new Date(task.nextDue) < new Date();
const statusFor = (task) => isComplete(task) ? 'completed' : isOverdue(task) ? 'overdue' : 'pending';

const statusStyles = { 
  overdue: 'bg-rose-50 text-rose-600', 
  pending: 'bg-amber-50 text-amber-600', 
  completed: 'bg-emerald-50 text-emerald-600' 
};

export default function TrackerTasksMobile() {
  const { tasks, loading } = useTracker();
  const [query, setQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const visibleTasks = useMemo(() => { 
    const needle = query.trim().toLowerCase(); 
    return tasks.filter((task) => 
      !needle || `${task.name} ${task.project} ${task.notes}`.toLowerCase().includes(needle)
    ); 
  }, [query, tasks]);

  return (
    <TrackerLayoutMobile>
      <div className="px-4 pt-2 pb-8 relative">
        
        {/* 
          FIXED: 
          1. Changed `top-16` to `top-14` (56px) to dock perfectly under the global header.
          2. Changed background to solid `bg-slate-50` so scrolling cards cannot bleed through transparency.
          3. Added shadow pointing upwards to perfectly seal any sub-pixel gaps.
        */}
        <div className="sticky top-14 z-30 -mx-4 mb-4 border-b border-slate-200 bg-slate-50 px-4 pb-4 pt-2 shadow-[0_-10px_0_0_#f8fafc]">
          <h1 className="mb-3 text-2xl font-bold text-slate-900">Task Library</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input 
              value={query} 
              onChange={(event) => setQuery(event.target.value)} 
              placeholder="Search tasks or projects..." 
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-violet-500 shadow-sm" 
            />
          </div>
        </div>

        {/* TASK LIST */}
        <div className="space-y-3 relative z-10">
          {loading ? (
            <p className="py-12 text-center text-sm font-medium text-slate-400">Loading tasks…</p>
          ) : visibleTasks.length > 0 ? (
            visibleTasks.map((task) => { 
              const status = statusFor(task); 
              return (
                <button 
                  type="button" 
                  key={task.id} 
                  onClick={() => setSelectedTask(task)} 
                  className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[0.98] transition-transform hover:border-violet-300"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-violet-50 border border-slate-100 flex items-center justify-center font-bold text-violet-600">
                    {task.projectLogo ? (
                      <img src={task.projectLogo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <FolderKanban className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-bold uppercase tracking-wider text-violet-600 mb-1">
                      {task.project}
                    </p>
                    <h2 className="truncate text-[15px] font-bold text-slate-900 leading-tight">
                      {task.name}
                    </h2>
                    <span className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyles[status]}`}>
                      {status}
                    </span>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                </button>
              ); 
            })
          ) : (
            <p className="py-12 text-center text-sm font-medium text-slate-400">
              No tasks match your search.
            </p>
          )}
        </div>
      </div>

      <TaskBottomSheetMobile 
        isOpen={!!selectedTask} 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </TrackerLayoutMobile>
  );
}