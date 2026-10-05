import React from 'react';

export default function Top5TestnetV1 ({ data }) {
  // 1. Safely extract selected items from the CreatorStudio prop structure
  const selectedItems = data?.selectedItems || (Array.isArray(data) ? data : []);

  const fallbackData = [
    { id: 1, raw: { name: 'Nemesisdottrade', logo_url: 'https://unavatar.io/twitter/Nemesisdottrade', description: 'The first permissionless margin trading protocol.', tier: 'Tier 1', funding: '$20M', social_score: 20, total_time_estimate: '10', total_cost_estimate: '0' } },
    { id: 2, raw: { name: 'dTelecom', logo_url: null, description: 'DePIN infra for real-time voice, video & AI communication.', tier: 'Tier 2', funding: '$1.2M', social_score: 854, total_time_estimate: '15', total_cost_estimate: '0' } },
    { id: 3, raw: { name: 'Berachain', logo_url: null, description: 'EVM-equivalent L1 built on Proof of Liquidity.', tier: 'Tier 1', funding: '$100M', social_score: 95, total_time_estimate: '30', total_cost_estimate: '0' } },
    { id: 4, raw: { name: 'Plume Network', logo_url: null, description: 'Modular L2 for RWA onboarding and compliance.', tier: 'Tier 2', funding: '$10M', social_score: 45, total_time_estimate: '5', total_cost_estimate: '0' } },
    { id: 5, raw: { name: 'Monad', logo_url: null, description: 'Ultra-high performance EVM L1 blockchain.', tier: 'Tier 1', funding: '$225M', social_score: 99, total_time_estimate: '20', total_cost_estimate: '0' } },
  ];

  const displayData = selectedItems.length > 0 ? selectedItems.slice(0, 5) : fallbackData;

  return (
    <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
      
      {/* OUTER HEADER */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
        <span>AirdropSailor</span>
        <span>Weekly Testnet Radar</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
      </div>

      {/* MAIN WHITE CARD */}
      <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30">
        
        {/* HEADER: Top 5 Testnets */}
        <div className="flex justify-between items-end border-b border-slate-200/60 pb-4 mb-5 shrink-0">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase">
            TOP 5 <span className="text-blue-600">TESTNETS</span> TO JOIN THIS WEEK
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg border border-blue-200">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Actionable</span>
          </div>
        </div>

        {/* LIST OF 5 PROJECTS */}
        <div className="flex-1 flex flex-col gap-3.5 relative z-10 overflow-hidden">
          {displayData.map((item, index) => {
            const p = item.raw || item;
            const name = p.name || item.name || 'Unknown Project';
            const logo = p.logo_url && p.logo_url !== 'N/A' 
              ? p.logo_url 
              : (item.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`);
            
            return (
              <div key={item.id || index} className="flex items-center justify-between bg-white rounded-[1.25rem] p-4 border border-slate-200/60 shadow-sm transition-all hover:border-blue-300">
                
                {/* Column 1: Rank, Logo, Name, Tier, Desc */}
                <div className="flex items-center gap-4 w-[45%] border-r border-slate-100 pr-4">
                  <div className="w-6 text-2xl font-black text-slate-300 text-center shrink-0">#{index + 1}</div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 p-0.5 border border-slate-100 shrink-0 overflow-hidden">
                    <img src={logo} className="w-full h-full rounded-lg object-cover" alt="logo" crossOrigin="anonymous" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-lg font-black text-slate-900 truncate">{name}</h3>
                      {p.tier && (
                        <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-md tracking-wider shrink-0">
                          {p.tier}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 truncate">
                      {p.description || 'Complete testnet tasks to earn future allocations.'}
                    </p>
                  </div>
                </div>

                {/* Column 2: Funding */}
                <div className="flex flex-col w-[15%] px-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Funding</span>
                  <span className="text-lg font-black text-slate-800">{p.funding || 'Unconfirmed'}</span>
                </div>

                {/* Column 3: Social Score */}
                <div className="flex flex-col w-[15%] px-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.059z"/></svg>
                    Social
                  </span>
                  <span className="text-lg font-black text-slate-800">{p.social_score != null ? p.social_score : 'N/A'}</span>
                </div>

                {/* Column 4: Cost & Time Estimate */}
                <div className="flex flex-col w-[25%] items-end justify-center pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost / Time Req.</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase">
                      ${p.total_cost_estimate || '0'}
                    </span>
                    <span className="text-slate-300 font-black">|</span>
                    <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 uppercase">
                      {p.total_time_estimate || '10'} Mins
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* OUTER FOOTER */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
        <span>Weekly Radar</span>
        <span className="flex items-center gap-2">
           <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 " crossOrigin="anonymous" />
           airdropsailor.xyz
        </span>
      </div>

    </div>
  );
}