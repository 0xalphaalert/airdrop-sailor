// src/mobile/components/project-details/tabs/DiscordAlpha.jsx
import React from 'react';
import { MessageSquare, ChevronRight, Bell, Calendar } from 'lucide-react';

export default function DiscordAlpha({ roles, activities }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* AVAILABLE DISCORD ROLES */}
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[11px] font-black text-slate-900 tracking-widest uppercase">Available Discord Roles</h2>
          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[9px] font-bold">{roles?.length || 0} Roles</span>
        </div>

        <div className="space-y-3">
          {roles && roles.length > 0 ? (
            roles.map((role, idx) => (
              <div key={role.id || idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl shadow-sm">
                <div className="min-w-0 pr-4">
                  <h4 className="text-[13px] font-bold text-slate-900 truncate">{role.role_name}</h4>
                  <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{role.perks || 'Contribution assignment allocation'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide ${
                  role.difficulty_level === 'Easy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {role.difficulty_level || 'Easy'}
                </span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400">No roles listed yet.</p>
            </div>
          )}
        </div>
        <button className="w-full mt-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-sm">View Role Guide</button>
      </div>

      {/* RECENT ANNOUNCEMENTS */}
      <div className="bg-white px-5 py-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[11px] font-black text-slate-900 tracking-widest uppercase">Recent Announcements</h2>
          <button className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
            View All <ChevronRight size={12} />
          </button>
        </div>

        <div className="relative border-l-2 border-slate-100 ml-1.5 space-y-5 pb-2">
          {activities && activities.length > 0 ? (
            activities.map((act, idx) => {
              const type = (act.update_type || 'Announcement').toLowerCase();
              let badgeStyle = 'bg-purple-50 text-purple-600';
              let dotStyle = 'border-purple-500';
              if (type.includes('update')) { badgeStyle = 'bg-blue-50 text-blue-600'; dotStyle = 'border-blue-500'; }
              if (type.includes('task')) { badgeStyle = 'bg-emerald-50 text-emerald-600'; dotStyle = 'border-emerald-500'; }

              const lines = act.content?.split('\n').filter(l => l.trim() !== '') || [];
              const title = lines[0] || 'Discord Update';
              
              const formattedDate = new Date(act.date_posted).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
              });

              return (
                <div key={act.id || idx} className="relative pl-5 active:opacity-70 transition-opacity">
                  <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-white border-[2.5px] ${dotStyle}`}></div>
                  
                  <div className="flex justify-between items-center mb-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${badgeStyle}`}>
                      {act.update_type || 'Announcement'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                      <Calendar size={10} /> {formattedDate}
                    </span>
                  </div>

                  <h4 className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 pr-2">
                    {title}
                  </h4>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 mr-2">
              <p className="text-xs font-bold text-slate-400">No recent alerts found.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}