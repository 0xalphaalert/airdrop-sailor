import React from 'react';
import { Users, ClipboardList, Star, Gift, MoreHorizontal } from 'lucide-react';

export default function SingleDiscordV1({ data }) {
  // Safely extract real selected items from Creator Studio prop
  const selectedItems = data?.selectedItems || (Array.isArray(data) ? data : []);

  const fallbackProject = {
    name: 'Xeffy',
    logo_url: null,
    discord_roles: [
      { role_name: 'X Role', requirements: 'Users recognized for core contributions to Xeffy', perks: 'Recognition by core team members', difficulty_level: 'Hard', created_at: '2026-06-20T09:44:00Z' },
      { role_name: 'Xef Role', requirements: 'Users recognized for their first-level contributions', perks: 'Contribution can make more allocation', difficulty_level: 'Easy', created_at: '2026-06-20T09:44:00Z' },
      { role_name: 'Xeffy Role', requirements: 'Entry-level users who have just joined', perks: 'Not Much', difficulty_level: 'Easy', created_at: '2026-06-20T09:44:00Z' },
      { role_name: 'Active Member', requirements: 'Reach level 10 in the general chat', perks: 'Access to alpha channels', difficulty_level: 'Medium', created_at: '2026-06-20T09:44:00Z' }
    ]
  };

  // Determine if using real data or fallback
  const p = selectedItems.length > 0 ? (selectedItems[0]?.raw || selectedItems[0]) : fallbackProject;
  
  const projectName = p.name || 'Unknown Project';
  const projectLogo = p.logo_url || p.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;
  
  // Extract roles and limit to 4
  const rawRoles = p.discord_roles && p.discord_roles.length > 0 ? p.discord_roles : fallbackProject.discord_roles;
  const displayRoles = rawRoles.slice(0, 4); 

  return (
    <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2 z-10">
        <span>AirdropSailor</span>
        <span>Discord Roles</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
      </div>

      {/* Main White Card */}
      <div className="flex-1 w-full max-w-[1100px] mx-auto bg-white rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30 overflow-hidden z-10">
        
        {/* Top Blue Banner */}
        <div className="w-full h-[140px] bg-gradient-to-r from-[#4438F5] to-[#2B1BDB] rounded-[2rem] p-6 flex items-center justify-between relative overflow-hidden shrink-0">
           <div className="absolute right-1/4 top-1/2 -translate-y-1/2 opacity-[0.05]">
             <svg width="300" height="300" viewBox="0 0 127.14 96.36" fill="white"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.74,67.74,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-80.21ZM42.61,65.22c-5.32,0-9.64-4.86-9.64-10.82s4.22-10.82,9.64-10.82c5.45,0,9.75,4.92,9.64,10.82C52.25,60.36,48.06,65.22,42.61,65.22Zm41.9,0c-5.32,0-9.64-4.86-9.64-10.82s4.22-10.82,9.64-10.82c5.45,0,9.75,4.92,9.64,10.82C84.51,60.36,80.32,65.22,84.51,65.22Z"/></svg>
           </div>

           <div className="flex items-center gap-5 z-10">
             <div className="w-[84px] h-[84px] bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-sm shrink-0">
               <img src={projectLogo} alt={projectName} className="w-full h-full object-contain rounded-xl" />
             </div>
             <div className="text-white">
               <h2 className="text-[32px] font-black tracking-tight leading-none mb-2">{projectName} Roles</h2>
               <p className="text-[13px] font-medium text-white/80 max-w-sm leading-snug">Explore and earn roles in the {projectName} Discord server by contributing and engaging with the community.</p>
             </div>
           </div>

           <div className="z-10 bg-white/10 border border-white/20 rounded-2xl p-4 w-[160px] flex flex-col items-center justify-center">
             <div className="flex items-center gap-2 text-white mb-1">
               <Users className="w-5 h-5" />
               <span className="text-3xl font-black">{rawRoles.length}</span>
             </div>
             <span className="text-xs font-bold text-white/80">Available Roles</span>
           </div>
        </div>

        {/* Table Headers */}
        <div className="grid grid-cols-12 gap-4 mt-6 pb-3 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 shrink-0">
          <div className="col-span-3">Role Name</div>
          <div className="col-span-3">Requirements</div>
          <div className="col-span-3">Perks</div>
          <div className="col-span-1 text-center">Difficulty</div>
          <div className="col-span-2 text-right pr-6">Added On</div>
        </div>

        {/* Table Rows */}
        <div className="flex-1 flex flex-col relative z-10 overflow-hidden px-4">
          {displayRoles.map((role, idx) => {
            
            const badgeStyles = [
              { name: 'Premium', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: <Star className="w-3 h-3"/> },
              { name: 'Standard', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: <Star className="w-3 h-3"/> },
              { name: 'Basic', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <Star className="w-3 h-3"/> },
              { name: 'Active', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Star className="w-3 h-3"/> }
            ];
            const badge = badgeStyles[idx % badgeStyles.length];

            const diffLevel = role.difficulty_level || 'Easy';
            const isHard = diffLevel.toLowerCase() === 'hard';
            const diffColor = isHard ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100';

            const d = new Date(role.created_at || new Date());
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

            return (
              <div key={idx} className="grid grid-cols-12 gap-4 py-4 border-b border-slate-50 items-center shrink-0">
                {/* Role Name */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#F4F4FF] flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-blue-600 fill-current" viewBox="0 0 127.14 96.36">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.74,67.74,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-80.21ZM42.61,65.22c-5.32,0-9.64-4.86-9.64-10.82s4.22-10.82,9.64-10.82c5.45,0,9.75,4.92,9.64,10.82C52.25,60.36,48.06,65.22,42.61,65.22Zm41.9,0c-5.32,0-9.64-4.86-9.64-10.82s4.22-10.82,9.64-10.82c5.45,0,9.75,4.92,9.64,10.82C84.51,60.36,80.32,65.22,84.51,65.22Z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-black text-slate-900 truncate mb-1.5">{role.role_name}</h4>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase border ${badge.color}`}>
                      {badge.icon} {badge.name}
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="col-span-3 flex items-start gap-3 pl-2">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 text-purple-500">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <p className="text-[13px] font-medium text-slate-600 leading-snug line-clamp-3">{role.requirements}</p>
                </div>

                {/* Perks */}
                <div className="col-span-3 flex items-start gap-3 pl-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-500">
                    {idx % 2 === 0 ? <Star className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                  </div>
                  <p className="text-[13px] font-medium text-slate-600 leading-snug line-clamp-3">{role.perks}</p>
                </div>

                {/* Difficulty */}
                <div className="col-span-1 flex justify-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${diffColor}`}>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18h4v4H4zm6-6h4v10h-4zm6-6h4v16h-4z"/></svg>
                    {diffLevel}
                  </span>
                </div>

                {/* Added On & Action */}
                <div className="col-span-2 flex items-center justify-between pl-4 pr-1">
                  <div>
                    <div className="text-[12px] font-bold text-slate-900 mb-0.5">{dateStr}</div>
                    <div className="text-[10px] font-bold text-slate-400">{timeStr}</div>
                  </div>
                  <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2 z-10">
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
        <span>Discord Roles</span>
        <span className="flex items-center gap-2">
           <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
             <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-3 h-3 object-contain" crossOrigin="anonymous" />
           </div>
           AIRDROPSAILOR
        </span>
      </div>

    </div>
  );
}