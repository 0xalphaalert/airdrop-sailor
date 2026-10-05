// src/mobile/components/home/ProjectsCarousel.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function ProjectsCarousel({ 
  projects,
  filterFunding,
  setFilterFunding,
  filterTier,
  setFilterTier,
  filterStatus,
  setFilterStatus
}) {
  const formatFunding = (amount) => {
    if (!amount || amount === '0') return 'TBA';
    const amountStr = amount.toString();
    if (['tba', 'undisclosed', 'none'].includes(amountStr.toLowerCase())) return amountStr;
    return amountStr.startsWith('$') ? amountStr : `$${amountStr}`;
  };

  const getScoreColor = (score) => {
    if (score >= 40) return "border-emerald-500 text-emerald-500";
    if (score >= 20) return "border-blue-500 text-blue-500";
    return "border-slate-300 text-slate-500";
  };

  return (
    <section className="mt-8">
      
      <div className="flex items-center justify-between px-5 mb-3">
        <h2 className="text-[18px] font-black text-slate-900">Airdrop Lists</h2>
      </div>

      {/* NEW: Scrollable Filter Row */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide snap-x">
        <select 
          value={filterTier} 
          onChange={(e) => setFilterTier(e.target.value)} 
          className="bg-white border border-slate-200 text-xs font-bold px-4 py-2 rounded-full outline-none shrink-0 text-slate-700 shadow-sm appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M3%204.5l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-no-repeat bg-[right_10px_center]"
        >
          <option value="All">Tier (All)</option>
          <option value="Tier 1">Tier 1</option>
          <option value="Tier 2">Tier 2</option>
          <option value="Tier 3">Tier 3</option>
        </select>

        <select 
          value={filterFunding} 
          onChange={(e) => setFilterFunding(e.target.value)} 
          className="bg-white border border-slate-200 text-xs font-bold px-4 py-2 rounded-full outline-none shrink-0 text-slate-700 shadow-sm appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M3%204.5l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-no-repeat bg-[right_10px_center]"
        >
          <option value="All">Funding (All)</option>
          <option value="0-10M">0 - 10M</option>
          <option value="10M-20M">10M - 20M</option>
          <option value="20M+">20M+</option>
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          className="bg-white border border-slate-200 text-xs font-bold px-4 py-2 rounded-full outline-none shrink-0 text-slate-700 shadow-sm appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M3%204.5l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-no-repeat bg-[right_10px_center]"
        >
          <option value="All">Phase (All)</option>
          <option value="Waitlist">Waitlist</option>
          <option value="Testnet">Testnet</option>
          <option value="Mainnet">Mainnet</option>
          <option value="Point Farming">Point Farming</option>
          <option value="TGE">TGE</option>
        </select>
      </div>

      {projects?.length === 0 ? (
        <div className="mx-5 mb-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-400">
          No projects match these filters.
        </div>
      ) : (
        <div className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto px-5 pb-4 snap-x snap-mandatory scrollbar-hide">
          {projects?.slice(0, 14).map((project, idx) => (
            <Link
              key={project.id || idx}
              to={`/${project.slug || project.id}/airdropguide`}
              className="flex w-[160px] shrink-0 snap-start flex-col rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              
              <div className="flex items-start justify-between">
                <img
                  src={project.logo_url || 'https://via.placeholder.com/50'}
                  alt={project.name}
                  className="h-10 w-10 rounded-full object-cover bg-black"
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="font-bold text-slate-900 truncate max-w-[90px]">{project.name}</h3>
                  <span className="text-[9px] font-bold uppercase text-slate-400">
                    Tier {project.tier || '2'}
                  </span>
                </div>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-black ${getScoreColor(project._score)}`}>
                  {Math.round(project._score || 50)}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-1.5 py-1 text-[8px] font-black uppercase text-emerald-600">
                  {project._score >= 60 ? 'High Potential' : 'Standard'}
                </span>
                <span className="rounded-lg border border-blue-100 bg-blue-50 px-1.5 py-1 text-[8px] font-black uppercase text-blue-600 truncate max-w-[65px]">
                  {project._effort === 'Easy' ? 'Low Effort' : project._effort || 'Farming'}
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between pt-2">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Funding</span>
                  <span className="mt-0.5 text-xs font-bold text-slate-900">
                    {project.funding ? formatFunding(project.funding) : '$15M'}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Time Req.</span>
                  <span className="mt-0.5 text-xs font-bold text-slate-900">
                    ~{project.total_time_estimate || 27}m
                  </span>
                </div>
              </div>

            </Link>
          ))}
        </div>
      )}
    </section>
  );
}