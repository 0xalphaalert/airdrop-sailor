// src/mobile/components/project-details/tabs/FundingTab.jsx
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Star } from 'lucide-react';
import { supabase } from '../../../../supabaseClient'; // <-- Adjust this path to your supabase client file

export default function FundingTab({ project }) {
  const [investorLogos, setInvestorLogos] = useState({});

  // 1. Fetch Investor Logos from pioneer_profiles
  useEffect(() => {
    const fetchInvestorLogos = async () => {
      if (!project?.lead_investors) return;
      
      const names = project.lead_investors.split(',').map(n => n.trim()).filter(Boolean);
      if (names.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('pioneer_profiles')
          .select('name, handle, logo_url')
          .in('name', names);
          
        if (data && !error) {
          const logoMap = {};
          data.forEach(profile => {
            logoMap[profile.name] = profile.logo_url;
            // Also map the handle just in case admins typed the handle instead of the exact name
            if (profile.handle) {
              logoMap[profile.handle] = profile.logo_url;
            }
          });
          setInvestorLogos(logoMap);
        }
      } catch (error) {
        console.error("Error fetching investor logos:", error);
      }
    };

    fetchInvestorLogos();
  }, [project?.lead_investors]);

  // Safely parse AI Research Data
  let aiData = {};
  try { aiData = typeof project?.ai_research_data === 'string' ? JSON.parse(project.ai_research_data || '{}') : (project?.ai_research_data || {}); } catch(e) {}
  
  // Safely parse Founders Data
  let founders = [];
  try { 
    const parsed = typeof project?.founders_details === 'string' ? JSON.parse(project.founders_details || '[]') : (project?.founders_details || []); 
    founders = Array.isArray(parsed) ? parsed : [];
  } catch (e) {}

  const fundingVal = project?.funding || '$0.00';
  const stage = project?.tier || 'Tier 3';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* SECTION 1: FUNDING OVERVIEW CARD */}
      <div className="bg-white px-5 py-6 mb-2">
        <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Funding Overview
        </h3>
        <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">{fundingVal}</div>
        
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-50">
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Funding Stage</span>
            <span className="mt-1 inline-block text-xs font-black text-slate-900">{stage}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</span>
            <span className="mt-1 inline-block text-xs font-bold text-slate-900">Jul 5, 2026</span>
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div className="mt-5 rounded-xl bg-slate-50 p-4 border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Funding Confidence</span>
            <span className="text-xs font-black text-emerald-600">Medium <span className="text-slate-400 font-medium">65/100</span></span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '65%' }}></div>
          </div>
          <span className="block text-[8px] font-medium text-slate-400 mt-1.5">Based on tier, funding amount, and project activity</span>
        </div>
      </div>

      {/* SECTION 2: LEAD INVESTORS */}
      <div className="bg-white py-6 mb-2">
        <h2 className="text-[11px] font-black text-slate-900 tracking-widest uppercase px-5 mb-4">Lead Investors & Backers</h2>
        
        <div className="flex gap-3 overflow-x-auto px-5 scrollbar-hide">
          {project?.lead_investors && project.lead_investors.trim() !== '' ? (
            project.lead_investors.split(',').map((inv, idx) => {
              const name = inv.trim();
              const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f8fafc&textColor=0f172a&bold=true`;
              const logoToUse = investorLogos[name] || fallbackLogo; // Use real logo if fetched, else fallback

              return (
                <div key={idx} className="min-w-[90px] w-[90px] h-[90px] bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center p-2 shrink-0">
                  <img 
                    src={logoToUse} 
                    alt={name} 
                    onError={(e) => { e.target.src = fallbackLogo; }} // Safety fallback if image link breaks
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm mb-1.5 object-cover" 
                  />
                  <span className="text-[9px] font-bold text-slate-700 text-center truncate w-full px-1">{name}</span>
                </div>
              );
            })
          ) : (
            <div className="w-full py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 mx-5">
              <p className="text-xs font-bold text-slate-400">No public investors listed yet.</p>
            </div>
          )}
        </div>
        <div className="px-5 mt-4">
          <button className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-100 transition-colors">View All Investors</button>
        </div>
      </div>

      {/* SECTION 3: CORE TEAM */}
      <div className="bg-white px-5 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[11px] font-black text-slate-900 tracking-widest uppercase">Core Team</h2>
          <span className="text-[10px] font-bold text-slate-500">{founders.length} Members</span>
        </div>

        {founders.length > 0 ? (
          <div className="space-y-3">
            {founders.map((founder, idx) => {
              const cleanName = founder.name || 'Team Member';
              const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=eff6ff&textColor=1e40af&bold=true`;
              
              // Map the actual twitter avatar if a handle exists
              const avatarUrl = founder.twitter_handle 
                ? `https://unavatar.io/twitter/${founder.twitter_handle}` 
                : fallbackAvatar;

              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <img 
                    src={avatarUrl} 
                    alt={cleanName} 
                    onError={(e) => { e.target.src = fallbackAvatar; }} // Safety fallback
                    className="w-10 h-10 rounded-full object-cover bg-white shrink-0 border border-slate-200" 
                  />
                  <div className="min-w-0 flex-grow">
                    <h4 className="text-[13px] font-bold text-slate-900 leading-tight truncate">{cleanName}</h4>
                    <p className="text-[9px] font-black text-blue-600 tracking-widest uppercase mt-0.5 truncate">{founder.role || 'Core Contributor'}</p>
                  </div>
                  
                  {/* Active Social Links */}
                  <div className="flex gap-1.5 shrink-0">
                    {founder.twitter_handle ? (
                      <a href={`https://x.com/${founder.twitter_handle}`} target="_blank" rel="noreferrer" className="w-6 h-6 rounded bg-white border border-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm hover:bg-blue-50 transition-colors">
                        X
                      </a>
                    ) : (
                      <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        X
                      </div>
                    )}
                    
                    {founder.linkedin_url ? (
                      <a href={founder.linkedin_url} target="_blank" rel="noreferrer" className="w-6 h-6 rounded bg-white border border-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm hover:bg-blue-50 transition-colors">
                        In
                      </a>
                    ) : (
                      <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        In
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-xs font-bold text-slate-400">No core team data listed.</p>
          </div>
        )}
        <button className="w-full mt-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-100 transition-colors">View All Team Members</button>
      </div>

    </div>
  );
}