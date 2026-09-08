// src/mobile/components/home/TopOpportunityCard.jsx
import React from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopOpportunityCard({ project }) {
  const formatFunding = (amount) => {
    if (!amount || amount === '0') return '$0 M';
    const amountStr = amount.toString();
    if (['tba', 'undisclosed', 'none'].includes(amountStr.toLowerCase())) return amountStr;
    return amountStr.startsWith('$') ? amountStr : `$${amountStr}`;
  };

  return (
    <section className="px-5 mt-6">
      <div className="relative w-full overflow-hidden rounded-[32px] bg-[#1a1c2d] p-6 shadow-xl">
        
        {/* Header Label */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300">
          <Flame size={12} className="text-orange-500 fill-orange-500" /> 
          Top Opportunity
        </div>

        {/* Project Info & Score */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={project?.logo_url || 'https://via.placeholder.com/50'}
              alt={project?.name}
              className="h-12 w-12 rounded-xl bg-orange-500 object-cover"
            />
            <div className="flex flex-col items-start gap-1">
              <h2 className="text-2xl font-black text-white">
                {project?.name}
              </h2>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 backdrop-blur-md">
                Tier {project?.tier || '3'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1a1c2d] ring-2 ring-emerald-500">
              <span className="text-xl font-black text-white">
                {Math.round(project?._score || 7)}
              </span>
            </div>
            <span className="mt-2 text-[8px] font-bold uppercase tracking-widest text-slate-400">
              Airdrop Score
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-400">Raised</span>
            <span className="text-sm font-bold text-white mt-0.5">
              {project?.funding ? formatFunding(project.funding) : '$0 M'}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium text-slate-400">Time Required</span>
            <span className="text-sm font-bold text-emerald-400 mt-0.5">
              ~{project?.total_time_estimate || 10} mins
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium text-slate-400">Tasks</span>
            <span className="text-sm font-bold text-white mt-0.5">
              {project?.task_count || 1} available
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Link to={`/${project?.slug || project?.id}/airdropguide`} className="mt-6 block">
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-slate-900 transition-transform active:scale-95">
            Start Farming <ArrowRight size={18} />
          </button>
        </Link>

      </div>
    </section>
  );
}