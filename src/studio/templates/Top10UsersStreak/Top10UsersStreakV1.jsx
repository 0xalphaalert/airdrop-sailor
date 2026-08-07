import React from 'react';

export default function Top10UsersStreakV1({ data }) {
  const selectedItems = data || [];

  const fallbackData = [
    { id: 1, raw: { displayName: 'hub***@gmail.com', subscription_tier: 'Pro', userPoints: 450, streak: 12, tasksCompleted: 34, compositeScore: 888 } },
    { id: 2, raw: { displayName: '0x71C...9B23', subscription_tier: 'Free', userPoints: 320, streak: 8, tasksCompleted: 21, compositeScore: 505 } },
    { id: 3, raw: { displayName: 'ale***@proton.me', subscription_tier: 'Free', userPoints: 210, streak: 5, tasksCompleted: 15, compositeScore: 335 } },
    { id: 4, raw: { displayName: '0x44F...1A90', subscription_tier: 'Pro', userPoints: 150, streak: 2, tasksCompleted: 8, compositeScore: 252 } },
    { id: 5, raw: { displayName: 'sar***@gmail.com', subscription_tier: 'Free', userPoints: 180, streak: 1, tasksCompleted: 4, compositeScore: 210 } },
  ];

  const displayData = selectedItems.length > 0 ? selectedItems.slice(0, 5) : fallbackData;

  return (
    <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
      
      {/* OUTER HEADER */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
        <span>AirdropSailor</span>
        <span>Community Leaderboard</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
      </div>

      {/* MAIN WHITE CARD */}
      <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30 relative overflow-hidden">
        
        <img 
           src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
           alt="Watermark" 
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.03] pointer-events-none grayscale" 
        />

        {/* HEADER */}
        <div className="flex justify-between items-end border-b border-slate-200/60 pb-4 mb-5 shrink-0 relative z-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
              TOP 5 <span className="text-blue-600">ACTIVE SAILORS</span>
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-1">Ranked by Composite Activity Score (Points + Streaks + Execution)</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Live Standings</span>
          </div>
        </div>

        {/* LEADERBOARD ROWS (Max 5) */}
        <div className="flex-1 flex flex-col gap-3.5 relative z-10 overflow-hidden">
          {displayData.map((item, index) => {
            const u = item.raw || {};
            const name = u.displayName || item.name || 'Anonymous Sailor';
            const avatar = item.logo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.auth_id || name}`;
            
            const isFirst = index === 0;
            const rankColor = isFirst ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-slate-300';
            const rankBg = isFirst ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-white' : 'border-slate-200/60 bg-white hover:border-blue-300';

            return (
              <div key={item.id || index} className={`flex items-center justify-between rounded-[1.25rem] p-4 border shadow-sm transition-all ${rankBg}`}>
                
                <div className="flex items-center gap-4 w-[40%] border-r border-slate-100 pr-4">
                  <div className={`w-6 text-2xl font-black text-center shrink-0 ${rankColor}`}>#{index + 1}</div>
                  <div className="w-12 h-12 rounded-full bg-slate-50 p-0.5 border border-slate-100 shrink-0 overflow-hidden">
                    <img src={avatar} className="w-full h-full object-cover rounded-full" alt="avatar" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-lg font-black text-slate-900 truncate">{name}</h3>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md tracking-wider inline-block ${u.subscription_tier !== 'Free' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {u.subscription_tier || 'Free'} Tier
                    </span>
                  </div>
                </div>

                <div className="flex flex-col w-[20%] px-4 border-r border-slate-100 items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Points</span>
                  <span className="text-xl font-black text-slate-800">{u.userPoints || 0}</span>
                </div>

                <div className="flex flex-col w-[20%] px-4 border-r border-slate-100 items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Current Streak</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">🔥</span>
                    <span className="text-xl font-black text-orange-500">{u.streak || 0}</span>
                  </div>
                </div>

                <div className="flex flex-col w-[20%] items-center justify-center pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tasks Done</span>
                  <span className="text-xl font-black text-emerald-600">{u.tasksCompleted || 0}</span>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* OUTER FOOTER */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
        <span>Sailor Community</span>
        <span className="flex items-center gap-2">
           <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 "  />
           airdropsailor.xyz
        </span>
      </div>

    </div>
  );
}