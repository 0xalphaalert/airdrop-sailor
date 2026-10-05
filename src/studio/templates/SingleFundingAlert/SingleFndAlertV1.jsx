import React from 'react';
import { DollarSign, Layout, PieChart, Zap, Users } from 'lucide-react';

export default function SingleFundingAlert({ data }) {
  // Use provided data or fallback to defaults
  const project = data?.raw || {
    project_name: 'Real Finance',
    project_logo: null,
    round: 'Seed',
    funding_amount: '$29M',
    category: 'RWA',
    lead_investor: 'Nimbus Capital',
    sector: 'The first fully decentralised and permissionless L1 Blockchain that offers native tokenisation of Real-World Assets (RWA).'
  };

  const investorLogos = data?.investorLogos || {};

  return (
    <div className="w-[1200px] h-[675px] bg-[#2A52EA] flex flex-col items-center justify-center relative p-8 font-sans overflow-hidden">
      
      {/* OUTER HEADER */}
      <div className="absolute top-6 left-10 right-10 flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs z-0">
        <span>AirdropSailor</span>
        <span>Funding Alert</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
      </div>

      {/* MAIN WHITE CARD */}
      <div className="w-full max-w-[1100px] h-full max-h-[580px] bg-white rounded-[2.5rem] shadow-2xl flex flex-col p-5 relative z-10">
        
        {/* 1. TOP BANNER */}
        <div className="w-full h-[150px] bg-gradient-to-r from-[#3B28E3] to-[#4834FA] rounded-[2rem] p-6 flex items-center justify-between relative overflow-hidden shrink-0">
          {/* Background Watermark Letter */}
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-[12rem] font-black text-white/5 select-none leading-none">
            {project.project_name ? project.project_name.charAt(0).toUpperCase() : 'S'}
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <img 
              src={project.project_logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${project.project_name || 'Sovra'}`} 
              className="w-24 h-24 rounded-2xl bg-[#FFCC00] p-1.5 shadow-lg object-cover border-[3px] border-white/20" 
              alt="Logo" 
            />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[40px] font-black text-white tracking-tight">
                  {project.project_name || 'Sovra'}
                </h1>
              </div>
              <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border border-white/20 shadow-sm backdrop-blur-sm inline-block mt-1">
                {project.round || 'Pre-Seed'} Round
              </span>
            </div>
          </div>

          <div className="relative z-10 w-[420px] text-blue-50 font-medium text-[13px] leading-relaxed border-l border-white/20 pl-6">
            {project.sector || 'A self-custodial digital dollar platform enabling global users to securely hold, earn, and spend USDC without intermediaries'}
          </div>
        </div>

        {/* 2. METRICS GRID (2x2) */}
        <div className="grid grid-cols-2 gap-4 mt-5 shrink-0 px-2">
          
          {/* Metric 1: Total Raised */}
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-slate-500 font-bold text-[15px]">Total Raised</span>
            </div>
            <span className="text-[34px] font-black text-slate-900 tracking-tighter">
              {project.funding_amount || '$2M'}
            </span>
          </div>

          {/* Metric 2: Category */}
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Layout className="w-4 h-4" />
              </div>
              <span className="text-slate-500 font-bold text-[15px]">Category</span>
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              {project.category || 'RWA'}
            </span>
          </div>

          {/* Metric 3: Funding Round */}
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                <PieChart className="w-5 h-5" />
              </div>
              <span className="text-slate-500 font-bold text-[15px]">Funding Round</span>
            </div>
            <span className="text-2xl font-black text-slate-900 truncate pl-4">
              {project.round || 'Pre-Seed'}
            </span>
          </div>

          {/* Metric 4: Airdrop Status */}
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-slate-500 font-bold text-[15px]">Airdrop Status</span>
            </div>
            <span className="text-[22px] font-black text-amber-500">
              Unconfirmed
            </span>
          </div>

        </div>

        {/* 3. BIG LEAD INVESTORS AREA */}
        <div className="mt-6 px-2 flex-1 flex flex-col pb-2">
          <h3 className="text-[17px] font-black text-slate-900 mb-4 tracking-tight flex items-center gap-2">
            <Users className="text-blue-600 w-5 h-5" /> Lead Investors
          </h3>

          <div className="flex gap-4 flex-wrap h-full pb-2">
            {project.lead_investor ? (
              project.lead_investor.split(',').slice(0, 5).map((name, idx) => {
                const cleanName = name.trim();
                if (!cleanName) return null;
                
                const logo = investorLogos?.[cleanName];
                const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=ffffff&textColor=0f172a&bold=true`;
                const finalLogo = logo || fallbackLogo;

                return (
                  <div key={idx} className="flex-1 min-w-[160px] bg-[#F8FAFC] border border-slate-100 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center gap-4 p-4 hover:border-blue-300 transition-colors">
                    <img 
                      src={finalLogo} 
                      alt={cleanName} 
                      onError={(e) => { e.target.onerror = null; e.target.src = fallbackLogo; }}
                      className="w-14 h-14 rounded-full object-cover shrink-0 border border-slate-100 bg-slate-50" 
                    />
                    <span className="text-[13px] font-black text-slate-800 tracking-tight text-center w-full truncate">{cleanName}</span>
                  </div>
                );
              })
            ) : (
              // Fallback dummy boxes
              ['HashKey Capital', 'OKX Ventures', 'Arcanum Capital', 'CMS Holdings', 'LD Capital'].map((name, idx) => (
                 <div key={idx} className="flex-1 min-w-[160px] bg-[#F8FAFC] border border-slate-100 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center gap-4 p-4">
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=ffffff&textColor=0f172a&bold=true`} 
                      alt={name} 
                      className="w-14 h-14 rounded-xl object-contain shrink-0 border border-slate-100 bg-slate-50" 
                    />
                    <span className="text-[13px] font-black text-slate-800 tracking-tight text-center w-full truncate">{name}</span>
                  </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* OUTER FOOTER */}
      <div className="absolute bottom-6 left-10 right-10 flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs z-0">
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
        <span>Funding Alert</span>
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