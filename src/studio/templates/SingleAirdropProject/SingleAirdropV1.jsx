import React from 'react';

export default function SingleAirdropV1({ data }) {
  // 1. Correctly extract the raw payload passed from CreatorStudio
  const raw = data?.raw || {};

  // 2. Define standard fallbacks if data is missing
  const fallbackProject = {
    name: 'dTelecom',
    description: "DePIN infra for real-time voice, video & AI communication. Disrupting $3.5T telecom market @Solana.",
    funding: '$1.2M',
    lead_investors: 'Kraken',
    tier: 'Tier 1',
    social_score: '854',
    twitter_followers: '125K',
    status: 'Incentivized Testnet',
    tasks: [
      { name: 'Bridge Assets & Provide Liquidity', description: 'Interact with the official bridge and deposit funds into the primary DEX.' },
      { name: 'Interact with Ecosystem dApps', description: 'Generate contract interactions across lending protocols and NFT marketplaces.' }
    ]
  };

  const projectName = raw.name || fallbackProject.name;
  const projectLogo = raw.logo_url && raw.logo_url !== 'N/A' 
    ? raw.logo_url 
    : `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;
  
  // 3. Extract data directly from the projects table columns
  const description = raw.description || fallbackProject.description;
  const funding = raw.funding || fallbackProject.funding;
  const leadInvestor = raw.lead_investors ? raw.lead_investors.split(',')[0] : fallbackProject.lead_investors;
  const tier = raw.tier || fallbackProject.tier;
  const socialScore = raw.social_score != null ? raw.social_score : fallbackProject.social_score;
  const followers = raw.twitter_followers != null ? raw.twitter_followers : fallbackProject.twitter_followers;
  const status = raw.status || fallbackProject.status;

  // 4. Extract tasks directly from the relational query
  const rawTasks = raw.tasks && raw.tasks.length > 0 ? raw.tasks : fallbackProject.tasks;
  const displayTasks = rawTasks.slice(0, 2);

  return (
    <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
      
      {/* OUTER HEADER */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
        <span>AirdropSailor</span>
        <span>Project Alpha</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
      </div>

      {/* MAIN WHITE CARD */}
      <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-5 my-4 overflow-hidden border border-blue-500/30">
        
        {/* BOX 1: PROJECT HEADER & DESCRIPTION */}
        <div className="w-full bg-white rounded-[2rem] p-6 flex items-center justify-between border border-slate-200/60 shadow-sm shrink-0">
          <div className="flex items-center gap-6 w-[45%] border-r border-slate-100 pr-6">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 p-1 shadow-inner border border-slate-100 shrink-0">
              <img src={projectLogo} className="w-full h-full rounded-xl object-contain" alt="Logo" crossOrigin="anonymous" />
            </div>
            <div className="min-w-0">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                {projectName}
              </h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                Verified Alpha
              </div>
            </div>
          </div>

          <div className="w-[55%] pl-6">
            <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>
        </div>

        {/* BOX 2: 5-METRIC ALPHA SNAPSHOT */}
        <div className="grid grid-cols-5 gap-3 mt-4 shrink-0">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Funding Raised</span>
            <span className="text-xl font-black text-slate-900 truncate">{funding}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Backer</span>
            <span className="text-xl font-black text-slate-900 truncate">{leadInvestor}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-emerald-50 opacity-50"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Tier</span>
            <span className="text-xl font-black text-emerald-600 truncate">{tier}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.059z"/></svg>
              Social Score
            </span>
            <span className="text-xl font-black text-slate-900 truncate">{socialScore}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Followers</span>
            <span className="text-xl font-black text-slate-900 truncate">{followers}</span>
          </div>
        </div>

        {/* BOX 3: AIRDROP GUIDE & TASKS */}
        <div className="mt-4 flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 flex flex-col relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50 rounded-bl-full opacity-50 pointer-events-none"></div>

          <div className="flex justify-between items-center mb-4 relative z-10 border-b border-slate-100 pb-3 shrink-0">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              Airdrop Guide
            </h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Phase:</span>
              <span className="text-sm font-black text-emerald-400 uppercase tracking-wider">{status}</span>
            </div>
          </div>

          {/* TASKS LIST */}
          <div className="flex flex-col gap-2.5 relative z-10 overflow-hidden">
            {displayTasks.map((task, index) => (
              <div key={index} className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3.5 shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Pulls from the tasks table: 'name' and falls back if description is null */}
                  <h4 className="text-base font-bold text-slate-900 truncate">{task.name}</h4>
                  <p className="text-sm font-medium text-slate-500 mt-0.5 line-clamp-1">
                    {task.description || 'Complete this objective to earn points on the platform.'}
                  </p>
                </div>
              </div>
            ))}
            
            {displayTasks.length === 1 && (
              <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 border-dashed rounded-xl p-3.5 opacity-60 shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-black text-lg shrink-0">2</div>
                <div>
                  <h4 className="text-base font-bold text-slate-600">Await Future Objectives</h4>
                  <p className="text-sm font-medium text-slate-400 mt-0.5 line-clamp-1">Stay active on the network. More tasks will be announced soon.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* OUTER FOOTER */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
        <span>Project Alpha</span>
        <span className="flex items-center gap-2">
           <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 " crossOrigin="anonymous" />
           airdropsailor.xyz
        </span>
      </div>

    </div>
  );
}