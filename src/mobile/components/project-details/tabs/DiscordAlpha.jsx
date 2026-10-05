// src/mobile/components/project-details/tabs/DiscordAlpha.jsx
import React, { useRef, useEffect } from 'react';
import { MessageSquare, ChevronRight, Bell, Calendar, ShieldCheck, Search, Target, Star, ExternalLink } from 'lucide-react';

export default function DiscordAlpha({ roles, activities }) {
  const scrollRef = useRef(null);

  // Auto-scroll logic for announcements
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const id = setInterval(() => {
      if (el.dataset.paused === 'true') return;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;

      if (el.scrollTop >= maxScroll - 5) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ top: 80, behavior: 'smooth' });
      }
    }, 1500);

    return () => clearInterval(id);
  }, []);

  const getContentPreview = (content, maxWords = 15) => {
    if (!content) return '';
    let cleaned = content.replace(/<@&?\d+>/g, '');
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
    cleaned = cleaned.replace(/[*_~`]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    const words = cleaned.split(' ');
    if (words.length > maxWords) return words.slice(0, maxWords).join(' ') + '...';
    return cleaned;
  };

  const getHeadline = (act) => {
    if (act.summary && act.summary.trim()) return act.summary.trim();
    if (!act.content) return 'Discord Update';
    const lines = act.content.split('\n').filter(l => l.trim() !== '');
    let firstLine = lines[0].replace(/<@&?\d+>/g, '').trim();
    return firstLine || 'Discord Update';
  };

  const topActivities = activities ? activities.slice(0, 5) : [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* AVAILABLE DISCORD ROLES */}
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[14px] font-black text-[#0F172A] tracking-tight">Available Roles</h2>
          <span className="px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-600 rounded text-[9px] font-bold">{roles?.length || 0} Roles</span>
        </div>

        <div className="space-y-3">
          {roles && roles.length > 0 ? (
            roles.map((role, idx) => {
              const styles = [
                { icon: <ShieldCheck size={14}/>, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', badge: 'ESSENTIAL', badgeColor: 'bg-indigo-100 text-indigo-700' },
                { icon: <MessageSquare size={14}/>, color: 'text-purple-600 bg-purple-50 border-purple-100', badge: 'COMMUNITY', badgeColor: 'bg-purple-100 text-purple-700' },
                { icon: <Search size={14}/>, color: 'text-amber-600 bg-amber-50 border-amber-100', badge: 'HUNTER', badgeColor: 'bg-amber-100 text-amber-700' },
                { icon: <Target size={14}/>, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100', badge: 'CREATOR', badgeColor: 'bg-fuchsia-100 text-fuchsia-700' }
              ];
              const style = styles[idx % styles.length];
              const diffColor = role.difficulty_level === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                role.difficulty_level === 'Hard' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                'bg-amber-50 text-amber-600 border-amber-200';
              const diffDot = role.difficulty_level === 'Easy' ? 'bg-emerald-500' : role.difficulty_level === 'Hard' ? 'bg-rose-500' : 'bg-amber-500';

              return (
                <div key={role.id || idx} className="bg-white border border-[#E5EAF2] rounded-[14px] p-3 flex items-center justify-between gap-3 shadow-sm min-w-0">
                   <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${style.color}`}>
                         {style.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                         <h4 className="text-[12px] font-black text-slate-900 truncate leading-tight">{role.role_name}</h4>
                         <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 w-fit ${style.badgeColor}`}>
                           {style.badge}
                         </span>
                      </div>
                   </div>
                   <div className="flex items-center shrink-0">
                      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black border ${diffColor}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${diffDot}`}></div>
                        {role.difficulty_level || 'Easy'}
                      </span>
                   </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400">No roles listed yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* RECENT ANNOUNCEMENTS */}
      <div className="bg-white px-5 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[14px] font-black text-[#0F172A] tracking-tight">Recent Announcements</h2>
          <button className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
            View All <ChevronRight size={12} />
          </button>
        </div>

        <div 
          ref={scrollRef}
          className="relative border-l-2 border-slate-100 ml-2 space-y-6 pb-2 h-[260px] overflow-y-auto custom-scrollbar pr-2 snap-y"
          onTouchStart={(e) => e.currentTarget.dataset.paused = 'true'}
          onTouchEnd={(e) => e.currentTarget.dataset.paused = 'false'}
        >
          {topActivities && topActivities.length > 0 ? (
            topActivities.map((act, idx) => {
              const type = (act.update_type || 'Announcement').toUpperCase();
              let badgeColor = 'bg-purple-100 text-purple-700';
              let dotColor = 'border-purple-500';
              if (type.includes('UPDATE')) { badgeColor = 'bg-blue-100 text-blue-700'; dotColor = 'border-blue-500'; }
              if (type.includes('TASK')) { badgeColor = 'bg-emerald-100 text-emerald-700'; dotColor = 'border-emerald-500'; }

              const title = getHeadline(act);
              const preview = getContentPreview(act.content);
              const formattedDate = new Date(act.date_posted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <div key={act.id || idx} className="relative pl-5 snap-start pb-2">
                  <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-white border-[2.5px] shadow-sm ${dotColor}`}></div>
                  
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black tracking-widest ${badgeColor}`}>
                      {type}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {formattedDate}
                    </span>
                  </div>

                  <h4 className="text-[13px] font-black text-slate-900 leading-snug line-clamp-2 pr-2 mb-1">
                    {title}
                  </h4>
                  
                  {preview && (
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed pr-2 mb-2">
                      {preview}
                    </p>
                  )}
                  
                  {act.source_link && (
                    <a href={act.source_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2563EB] hover:text-blue-800">
                      View Original <ExternalLink size={10} className="mb-[1px]"/>
                    </a>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 mr-2">
              <p className="text-xs font-bold text-slate-400">No recent alerts found.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}