import React from 'react';
import { Layout, DollarSign, Zap, CheckCircle2 } from 'lucide-react';

export default function SingleTaskV1({ data }) {
  // Extract selected item raw data safely from object props
  const rawData = data?.raw || data?.selectedItems?.[0]?.raw || {};

  // Handle both cases: Direct Task selection OR Project selection with attached tasks
  const isDirectTask = Boolean(rawData?.projects);
  
  const proj = isDirectTask ? rawData.projects : rawData;
  const task = isDirectTask ? rawData : (rawData?.tasks?.[0] || {});

  // Project Details
  const projectName = proj?.name || 'Project Update';
  const projectLogo = proj?.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;

  // Task Details
  const taskName = task?.name || rawData?.name || 'Active Task';
  
  // Format Description (Handles Markdown or raw string)
  let taskDescription = task?.description || task?.tutorial_markdown || rawData?.description || 'Complete the on-chain interactions as required by the protocol to qualify for rewards.';
  // Clean markdown headers or image tags for clean graphic presentation
  taskDescription = taskDescription.replace(/!\[.*?\]\([^\)]+\)/g, '').replace(/###?/g, '').trim();

  // Metrics
  const timeMinutes = task?.time_minutes || rawData?.total_time_estimate || '5';
  const cost = task?.cost || rawData?.total_cost_estimate || '0';
  const recurring = task?.recurring || 'Once';
  
  // Date Formatting
  const endDateRaw = task?.end_date || rawData?.end_date;
  const formattedDate = endDateRaw 
    ? new Date(endDateRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    : 'Ongoing';

  return (
    <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
      
      {/* OUTER HEADER */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
        <span>AirdropSailor</span>
        <span>Task Update</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
      </div>

      {/* MAIN WHITE CARD */}
      <div className="flex-1 w-full max-w-[1000px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30 overflow-hidden">
        
        {/* TOP BOX: Logo & Project Name (Centered) */}
        <div className="flex flex-col items-center justify-center bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-50 pointer-events-none"></div>
           
           <img src={projectLogo} className="w-20 h-20 rounded-2xl bg-slate-50 p-1 border border-slate-100 shadow-sm mb-3 z-10 object-contain" alt="Project Logo" />
           <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase z-10 text-center">
             {projectName} <span className="text-blue-600">UPDATE!</span>
          </h1>
        </div>

        {/* MIDDLE BOX: Time, Cost, Recurring */}
        <div className="grid grid-cols-3 gap-4 mt-4 shrink-0">
          <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center transition-all hover:border-blue-300">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Layout className="w-3 h-3"/> Time Required</span>
            <span className="text-3xl font-black text-slate-900">{timeMinutes} <span className="text-lg text-slate-400 font-bold">Mins</span></span>
          </div>
          <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center transition-all hover:border-blue-300">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><DollarSign className="w-3 h-3"/> Cost</span>
            <span className="text-3xl font-black text-emerald-600">${cost}</span>
          </div>
          <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center transition-all hover:border-blue-300">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Zap className="w-3 h-3"/> Frequency</span>
            <span className="text-3xl font-black text-blue-600">{recurring}</span>
          </div>
        </div>

        {/* BOTTOM BOX: Task Name, Steps, End Date */}
        <div className="mt-4 flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 flex flex-col relative overflow-hidden">
           
           {/* Task Name & Deadline Header */}
           <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 shrink-0">
             <h2 className="text-2xl font-black text-slate-800 tracking-tight truncate max-w-[70%]">{taskName}</h2>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-lg border border-rose-100 shadow-sm">
               <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Deadline:</span>
               <span className="text-sm font-black text-rose-600 tracking-wide">{formattedDate}</span>
             </div>
           </div>

           {/* Task Description Body */}
           <div className="flex-1 overflow-hidden flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/> Task Details & Steps</h3>
              
              <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 pr-4">
                {taskDescription}
              </p>
           </div>
        </div>

      </div>

      {/* OUTER FOOTER */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
        <span>Task Update</span>
        <span className="flex items-center gap-2">
           <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4" />
           airdropsailor.xyz
        </span>
      </div>

    </div>
  );
}