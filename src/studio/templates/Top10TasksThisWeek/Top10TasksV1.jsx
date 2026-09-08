import React from 'react';

export default function MajorTasksThisWeek({ data }) {
  // FIX: Safely extract 'selectedItems' from the data object passed by CreatorStudio
  const selectedItems = data?.selectedItems || [];

  const fallbackData = [
    { id: 1, raw: { name: 'Mainnet Contract Deployment', description: 'Deploy your first smart contract on the newly launched mainnet to secure early multiplier.', recurring: 'One-Time', status: 'High Priority', end_date: '2026-04-22', projects: { name: 'Monad', tier: 'Tier 1', logo_url: null } } },
    { id: 2, raw: { name: 'Claim Phase 2 Roles', description: 'Verify your wallet and Discord to claim the "Phase 2 Early" role.', recurring: 'One-Time', status: 'Ending Soon', end_date: '2026-04-18', projects: { name: 'dTelecom', tier: 'Tier 2', logo_url: null } } },
    { id: 3, raw: { name: 'Provide Mainnet Liquidity', description: 'Bridge to the new L2 and deposit a minimum of $50 into the official DEX.', recurring: 'Weekly', status: 'Active', end_date: null, projects: { name: 'Ink', tier: 'Tier 2', logo_url: null } } },
    { id: 4, raw: { name: 'Galxe Mega Campaign', description: 'Complete all 5 weekly social quests to unlock the ultimate NFT badge.', recurring: 'Weekly', status: 'Ending Soon', end_date: '2026-04-19', projects: { name: 'Berachain', tier: 'Tier 1', logo_url: null } } },
    { id: 5, raw: { name: 'Node Operator Registration', description: 'Register your IP and stake testnet tokens to run a light node.', recurring: 'One-Time', status: 'Active', end_date: '2026-05-01', projects: { name: 'Plume Network', tier: 'Tier 2', logo_url: null } } },
  ];

  // If there are real selected items, use them (up to 7). Otherwise use fallback.
  const displayData = selectedItems.length > 0 ? selectedItems.slice(0, 7) : fallbackData;

  return (
    <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
      
      {/* OUTER HEADER */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
        <span>AirdropSailor</span>
        <span>Weekly Major Tasks</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
      </div>

      {/* MAIN WHITE CARD */}
      <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30">
        
        {/* HEADER */}
        <div className="flex justify-between items-end border-b border-slate-200/60 pb-3 mb-4 shrink-0">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
            MAJOR AIRDROP <span className="text-blue-600">TASKS</span> THIS WEEK
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-lg border border-amber-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-xs font-black text-amber-700 uppercase tracking-widest">High Priority</span>
          </div>
        </div>

        {/* LIST OF TASKS (Max 7) */}
        <div className="flex-1 flex flex-col gap-2 relative z-10 overflow-hidden">
          {displayData.map((item, index) => {
            const t = item.raw || {};
            const proj = t.projects || {};
            
            const projectName = proj.name || item.sub || t.name || 'Unknown Project';
            const projectLogo = proj.logo_url || item.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;
            const taskName = t.name || item.name || 'Complete major tasks';
            
            const formattedDate = t.end_date 
              ? new Date(t.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'TBA';

            return (
              <div key={item.id || index} className="flex items-center justify-between bg-white rounded-2xl py-2 px-4 border border-slate-200/60 shadow-sm transition-all hover:border-blue-300">
                
                <div className="flex items-center gap-3 w-[30%] border-r border-slate-100 pr-3">
                  <div className="w-5 text-lg font-black text-slate-300 text-center shrink-0">#{index + 1}</div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 p-0.5 border border-slate-100 shrink-0">
                    <img src={projectLogo} className="w-full h-full rounded-lg object-contain" alt="logo" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-900 truncate">{projectName}</h3>
                    {proj.tier && (
                      <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase rounded-md tracking-wider shrink-0 inline-block mt-0.5">
                        {proj.tier}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col w-[40%] px-3 border-r border-slate-100">
                  <span className="text-sm font-bold text-slate-800 truncate">{taskName}</span>
                  <span className="text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                    {t.description || t.tutorial_markdown || 'Complete this on-chain objective.'}
                  </span>
                </div>

                <div className="flex flex-col w-[15%] px-3 border-r border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Frequency</span>
                  <span className="text-xs font-black text-slate-800">{t.recurring || 'Once'}</span>
                </div>

                <div className="flex flex-col w-[15%] items-end justify-center pl-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status / Deadline</span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      t.status === 'Active' || t.status === 'High Priority' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                      t.status === 'Ending Soon' ? 'text-amber-600 bg-amber-50 border-amber-100' : 
                      'text-blue-600 bg-blue-50 border-blue-100'
                    }`}>
                      {t.status || 'Active'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">{formattedDate}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* OUTER FOOTER */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
        <span>Weekly Major Tasks</span>
        <span className="flex items-center gap-2">
           <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 "  />
           airdropsailor.xyz
        </span>
      </div>

    </div>
  );
}