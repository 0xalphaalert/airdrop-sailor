// src/mobile/components/project-details/tabs/FundingTab.jsx
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Star, TrendingUp, Activity, ListChecks, ShieldAlert } from 'lucide-react';
import { supabase } from '../../../../supabaseClient'; 

export default function FundingTab({ project }) {
  const [investorLogos, setInvestorLogos] = useState({});
  const [investorProfiles, setInvestorProfiles] = useState({});

  useEffect(() => {
    const fetchInvestorProfiles = async () => {
      if (!project?.lead_investors) return;
      
      const rawNames = project.lead_investors.split(',').map(n => n.trim()).filter(Boolean);
      const cleanNames = rawNames.map(n => n.replace(/\s*\(Lead\)\s*/i, ''));
      if (cleanNames.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('pioneer_profiles')
          .select('name, handle, logo_url, tier, score, pioneer_type, investment_focus')
          .in('name', cleanNames);
          
        if (data && !error) {
          const logoMap = {};
          const profileMap = {};
          data.forEach(profile => {
            logoMap[profile.name] = profile.logo_url;
            profileMap[profile.name] = profile;
          });
          setInvestorLogos(logoMap);
          setInvestorProfiles(profileMap);
        }
      } catch (error) {
        console.error("Error fetching investor profiles:", error);
      }
    };

    fetchInvestorProfiles();
  }, [project?.lead_investors]);

  let founders = [];
  try { 
    const parsed = typeof project?.founders_details === 'string' ? JSON.parse(project.founders_details || '[]') : (project?.founders_details || []); 
    founders = Array.isArray(parsed) ? parsed : [];
  } catch (e) {}

  const fundingVal = project?.funding && project.funding !== '0' ? project.funding : 'Undisclosed';
  const formatFunding = (amt) => amt.startsWith('$') || amt === 'Undisclosed' ? amt : `$${amt}`;
  const stage = project?.tier || 'Tier 3';
  const fundingScore = project?.score_funding || 0;

  const getFundingRating = (s) => {
    if (s >= 80) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-100', bar: 'bg-emerald-500' };
    if (s >= 60) return { label: 'Good', color: 'text-emerald-600 bg-emerald-50', bar: 'bg-emerald-400' };
    if (s >= 40) return { label: 'Moderate', color: 'text-amber-600 bg-amber-50', bar: 'bg-amber-500' };
    if (s >= 20) return { label: 'Weak', color: 'text-orange-600 bg-orange-50', bar: 'bg-orange-500' };
    return { label: 'Very Weak', color: 'text-rose-700 bg-rose-100', bar: 'bg-rose-500' };
  };
  const fundingRating = getFundingRating(fundingScore);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* SECTION 1: COMBINED FUNDING & INVESTORS */}
      <div className="bg-white px-5 py-6 mb-2">
        <h2 className="text-[16px] font-black text-[#0F172A] tracking-tight mb-1">Funding & Investors</h2>
        <p className="text-[11px] text-slate-500 font-medium mb-6">Funding details and key investors backing this project.</p>
        
        {/* Funding Overview */}
        <div className="mb-8">
          <h3 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> FUNDING OVERVIEW
          </h3>
          <div className="text-[28px] font-black text-slate-900 tracking-tight leading-none mb-1">
            {formatFunding(fundingVal)}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Total Capital Raised</div>
          
          {/* Funding Score section */}
          <div className="mt-5 mb-5 p-4 bg-slate-50 border border-slate-100 rounded-[14px]">
             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Funding Score</h4>
             <div className="flex items-end justify-between mb-2">
               <div className="flex items-baseline gap-1">
                 <span className="text-xl font-black text-[#0F172A] leading-none">{fundingScore}</span>
                 <span className="text-[10px] font-bold text-slate-400">/ 100</span>
               </div>
               <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${fundingRating.color}`}>
                 {fundingRating.label}
               </span>
             </div>
             <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
               <div className={`h-full rounded-full ${fundingRating.bar}`} style={{ width: `${fundingScore}%` }}></div>
             </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 pt-4">
            <span className="text-[11px] font-bold text-slate-500">Funding Stage</span>
            <span className="text-[12px] font-black text-slate-900">{stage}</span>
          </div>
        </div>

        {/* Lead Investors Grid */}
        <div>
          <div className="flex justify-between items-center mb-4 border-t border-slate-100 pt-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3 h-3 text-blue-500" /> LEAD INVESTORS & BACKERS
            </h3>
          </div>

          {(() => {
             const allInvestors = project?.lead_investors && project.lead_investors.trim() !== '' 
               ? project.lead_investors.split(',').map(i => i.trim()).filter(Boolean) 
               : [];
             const showAll = allInvestors.length <= 6;
             const visibleInvestors = showAll ? allInvestors : allInvestors.slice(0, 5);
             const hiddenCount = showAll ? 0 : allInvestors.length - 5;

             if (allInvestors.length === 0) {
               return (
                <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-[16px] p-6 flex flex-col items-center justify-center text-center">
                  <p className="text-xs font-bold text-slate-700">No public investors listed.</p>
                </div>
               );
             }

             return (
               <div className="grid grid-cols-2 gap-3">
                 {visibleInvestors.map((inv, idx) => {
                   const rawName = inv;
                   const isLead = /\(Lead\)/i.test(rawName);
                   const cleanName = rawName.replace(/\s*\(Lead\)\s*/i, '');
                   
                   const profile = investorProfiles[cleanName];
                   const logo = investorLogos[cleanName];
                   const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=f8fafc&textColor=0f172a&bold=true`;
                   const finalLogo = logo || fallbackLogo;

                   return (
                     <div key={idx} className="bg-white border border-[#E5EAF2] rounded-[14px] p-3 flex items-center gap-2.5 shadow-sm min-w-0">
                        <div className="relative shrink-0">
                          <img src={finalLogo} alt={cleanName} onError={(e)=>{e.target.src=fallbackLogo}} className="w-9 h-9 rounded-full object-cover bg-slate-50 border border-slate-100" />
                          {isLead && (
                            <div className="absolute -bottom-1 -right-1 bg-[#2563EB] text-white text-[7px] font-black uppercase px-1 py-0.5 rounded border border-white">
                              Lead
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <h4 className="font-black text-slate-900 text-[11px] truncate">{cleanName}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            {profile?.tier && (
                              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate">
                                {profile.tier}
                              </span>
                            )}
                            {profile?.score && (
                              <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {profile.score}/100
                              </span>
                            )}
                          </div>
                        </div>
                     </div>
                   );
                 })}

                 {/* +N MORE BADGE */}
                 {hiddenCount > 0 && (
                   <div className="bg-slate-50 border border-slate-200 border-dashed rounded-[14px] p-3 flex flex-col items-center justify-center shadow-sm">
                     <span className="text-[13px] font-black text-slate-600">+{hiddenCount}</span>
                     <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">More</span>
                   </div>
                 )}
               </div>
             );
           })()}
        </div>
      </div>

      {/* SECTION 2: CORE TEAM */}
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
              const avatarUrl = founder.twitter_handle ? `https://unavatar.io/twitter/${founder.twitter_handle.replace('@','')}` : fallbackAvatar;

              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <img src={avatarUrl} alt={cleanName} onError={(e) => { e.target.src = fallbackAvatar; }} className="w-10 h-10 rounded-full object-cover bg-white shrink-0 border border-slate-200" />
                  <div className="min-w-0 flex-grow">
                    <h4 className="text-[13px] font-bold text-slate-900 leading-tight truncate">{cleanName}</h4>
                    <p className="text-[9px] font-black text-blue-600 tracking-widest uppercase mt-0.5 truncate">{founder.role || 'Core Contributor'}</p>
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
      </div>

    </div>
  );
}