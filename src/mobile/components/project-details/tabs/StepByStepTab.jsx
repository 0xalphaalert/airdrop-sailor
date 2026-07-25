// src/mobile/components/project-details/tabs/StepByStepTab.jsx
import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';

export default function StepByStepTab({ project, tasks }) {
  
  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    return `${diffDays} days left`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[12px] font-black text-slate-900 tracking-widest uppercase">Action Plan</h2>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-bold tracking-wide">
            {tasks?.length || 0} Steps
          </span>
        </div>

        <div className="space-y-4">
          {tasks && tasks.length > 0 ? (
            tasks.map((task, idx) => {
              const daysLeft = getDaysLeft(task.end_date) || '120 days left';
              
              return (
                <div key={task.id || idx} className="flex items-center gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0 group active:opacity-70 transition-opacity">
                  
                  {/* Timeline Line (Visual only) */}
                  <div className="flex flex-col items-center self-stretch pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-1"></div>
                    <div className="w-px h-full bg-slate-100 min-h-[40px]"></div>
                  </div>

                  <div className="flex-grow">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Step {idx + 1}</span>
                    <div className="flex justify-between items-start mt-0.5">
                      <div className="pr-4">
                        <h3 className="text-[14px] font-bold text-slate-900 leading-tight mb-1">{task.name}</h3>
                        <p className="text-[11px] font-medium text-slate-500 line-clamp-1 mb-2">
                          {task.description || 'Complete the required actions to be eligible for potential rewards.'}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black tracking-wide uppercase">Easy</span>
                          <span className="text-[10px] font-bold text-slate-600">{daysLeft}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                    </div>
                  </div>
                  
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400">No tasks mapped yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ESTIMATED TIME BOX */}
      <div className="bg-white px-5 py-6">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estimated Time To Complete</span>
            <span className="text-lg font-black text-slate-900">~{project?.total_time_estimate || 21} mins</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm">
            <Clock size={18} strokeWidth={2.5} />
          </div>
        </div>
      </div>

    </div>
  );
}