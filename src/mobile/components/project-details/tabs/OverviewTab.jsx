// src/mobile/components/project-details/tabs/OverviewTab.jsx
import React from 'react';
import { Layout, ShieldCheck, BrainCircuit, ExternalLink, Twitter, ChevronRight } from 'lucide-react';

export default function OverviewTab({ project }) {
  let aiData = {};
  let compData = { competitors: [] };
  
  try { aiData = typeof project?.ai_research_data === 'string' ? JSON.parse(project.ai_research_data || '{}') : (project?.ai_research_data || {}); } catch(e) {}
  try { compData = typeof project?.competitor_analysis === 'string' ? JSON.parse(project.competitor_analysis || '{"competitors":[]}') : (project?.competitor_analysis || {competitors:[]}); } catch(e) {}

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* SECTION 1: THE THESIS */}
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[11px] font-black text-slate-900 tracking-widest flex items-center gap-1.5 uppercase">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div> The Thesis
          </h2>
          <div className="flex gap-1.5">
             <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold tracking-wide">{project?.tier || 'Tier 3'}</span>
             <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-bold tracking-wide">{project?.status || 'Point Farming'}</span>
          </div>
        </div>
        
        <p className="text-slate-700 font-medium text-[13px] leading-relaxed mb-5">
          {aiData.bio || project?.description || 'Institutional-Grade multi-strategy yield & infrastructure in one portal.'}
        </p>
        
        <div className="flex flex-wrap gap-2">
           <span className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600"><Layout className="w-3 h-3 text-emerald-500" /> Multi-Strategy Yield</span>
           <span className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Institutional Grade</span>
           <span className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600"><BrainCircuit className="w-3 h-3 text-blue-500" /> Unified Infrastructure</span>
        </div>
      </div>

      {/* SECTION 2: TOP COMPETITORS */}
      <div className="bg-white py-6 mb-2">
        <div className="flex justify-between items-center px-5 mb-5">
          <h2 className="text-[11px] font-black text-slate-900 tracking-widest flex items-center gap-1.5 uppercase">
            <UsersIcon /> Top Competitors
          </h2>
          <button className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
            View All <ChevronRight size={12} />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto px-5 pb-4 snap-x custom-scrollbar">
          {compData.competitors && compData.competitors.length > 0 ? (
            compData.competitors.map((comp, idx) => {
               const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${comp.name}&backgroundColor=f8fafc&textColor=0f172a`;
               let validXUrl = comp.x_url && comp.x_url.trim() !== '' ? comp.x_url.trim() : null;
               
               return (
                 <div key={idx} className="min-w-[240px] w-[240px] bg-white border border-slate-100 rounded-2xl shrink-0 snap-start relative flex flex-col shadow-sm">
                    {/* Blue Number Badge */}
                    <div className="absolute top-0 left-0 w-6 h-6 bg-blue-600 text-white flex items-center justify-center text-[10px] font-black rounded-tl-2xl rounded-br-xl z-10">{idx + 1}</div>
                    
                    <div className="p-4 flex-grow">
                      <div className="flex items-center gap-3 mb-4 pl-3">
                        <img src={comp.logo_url || fallbackLogo} alt={comp.name} className="w-10 h-10 rounded-full object-cover border border-slate-100 bg-black shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-black text-slate-900 text-sm flex items-center gap-1 truncate">
                            {comp.name} {validXUrl && <ExternalLink className="w-3 h-3 text-slate-300" />}
                          </h3>
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate">{comp.past_airdrops?.length > 0 ? comp.past_airdrops[0] : 'No historical data.'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Avg Payout</p><p className="font-black text-slate-900 text-xs">${comp.average_airdrop_usd || '0'}</p></div>
                        <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Network</p><p className="font-black text-slate-900 text-xs flex items-center gap-1"><Twitter className="w-3 h-3 text-slate-300" /> {comp.followers || '10K+'}</p></div>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Airdrop Potential</span>
                         <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-bold tracking-wide">Medium</span>
                      </div>
                    </div>
                 </div>
               );
            })
          ) : (
            <div className="w-full py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400">No competitors mapped yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: ABOUT */}
      <div className="bg-white px-5 py-6">
        <h2 className="text-[11px] font-black text-slate-900 tracking-widest uppercase mb-3">About {project?.name}</h2>
        <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
          {project?.description || 'This project is building infrastructure for the next generation of decentralized applications, aiming to deliver unmatched security and scalability.'}
        </p>
      </div>
    </div>
  );
}

const UsersIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);