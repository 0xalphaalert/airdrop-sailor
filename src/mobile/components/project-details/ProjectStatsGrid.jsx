// src/mobile/components/project-details/ProjectStatsGrid.jsx
import React from 'react';

export default function ProjectStatsGrid({ project, tasksCount }) {
  const formatFollowers = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  };

  const formatFunding = (amount) => {
    if (!amount || amount === '0') return '$NA';
    return amount.startsWith('$') ? amount : `$${amount}`;
  };

  return (
    <div className="border-t border-slate-100 px-5 py-5">
      <div className="grid grid-cols-4 gap-y-6">
        
        {/* Row 1 */}
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Raised</span>
          <span className="mt-1 text-xs font-black text-slate-900">{formatFunding(project?.funding)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">X Followers</span>
          <span className="mt-1 text-xs font-black text-slate-900">{formatFollowers(project?.twitter_followers)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Category</span>
          <span className="mt-1 text-xs font-black text-slate-900 truncate pr-2">{project?.category || 'General'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Time To Complete</span>
          <span className="mt-1 text-xs font-black text-slate-900">~{project?.total_time_estimate || 21} min</span>
        </div>

        {/* Row 2 */}
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Funds & Backers</span>
          <div className="mt-1 flex gap-1">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">NA</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">NA</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Discord Users</span>
          <span className="mt-1 text-xs font-black text-slate-900">{formatFollowers(project?.discord_members)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Task Count</span>
          <span className="mt-1 text-xs font-black text-slate-900">{tasksCount || 3}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Status</span>
          <span className="mt-1 flex items-center gap-1 text-xs font-black text-slate-900">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div> {project?.status || 'Testnet'}
          </span>
        </div>

      </div>
    </div>
  );
}