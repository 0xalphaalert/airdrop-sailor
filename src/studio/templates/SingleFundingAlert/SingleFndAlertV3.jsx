import React from 'react';
import { Anchor, Flag, Info } from "lucide-react";

// --- 1. CLOUD ASSET PATHS ---
// Pointing exactly to your Supabase "Illustrations" bucket
const BASE_URL = "https://ptobheftxcjiqobxgeal.supabase.co/storage/v1/object/public/Illustrations";

const logoIconImg = `${BASE_URL}/logo-icon.png`; 
const moneyBagImg = `${BASE_URL}/money-bag.png`;

function Sparkle({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0c.9 6.6 5.4 11.1 12 12-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.6 11.1 11.1 6.6 12 0z" />
    </svg>
  );
}

export default function SingleFndAlertV3({ data }) {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  // --- 2. DATA EXTRACTION ---
  const raw = data?.raw || data?.selectedItems?.[0]?.raw || {};
  const investorLogos = data?.investorLogos || {};
  
  const projectName = raw.project_name || raw.name || 'Project';
  const logoUrl = raw.logo_url || raw.project_logo || null;
  const totalRaised = raw.funding_amount || raw.funding || '$1.2M';
  const fundingRound = raw.round || raw.funding_round || 'Seed Round';
  
  // Clean up description to a one-liner
  let desc = raw.description || `${projectName} is building the next generation decentralized infrastructure.`;
  if (desc.length > 120) desc = desc.substring(0, 117) + '...';

  // Investor processing
  let investorsStr = raw.lead_investor || raw.lead_investors || 'Ribbit Capital, Robot Ventures, MH Ventures, Symbolic Capital, Georgia Ventures';
  let investorsArray = investorsStr.split(',').map(s => s.trim()).filter(Boolean);
  
  const leadInvestor = investorsArray.length > 0 ? investorsArray[0] : 'TBA';
  const otherInvestors = investorsArray.slice(1, 5); // Take up to 4 other investors

  return (
    // --- 3. STRICT PIXEL-PERFECT WRAPPER (1200x675) ---
    <div className="w-[1200px] h-[675px] flex flex-col justify-between bg-[#1142FE] p-5 font-sans relative overflow-hidden box-border">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 text-white/90 shrink-0 h-[30px] z-20">
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">AIRDROPSAILOR</span>
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">FUNDING ALERT</span>
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">{currentDate}</span>
      </header>

      {/* Massive White Canvas Card */}
      <main className="w-full h-[560px] bg-[#F8FAFC] rounded-[2.5rem] shadow-2xl relative flex flex-col pt-8 pb-6 px-10 border-4 border-white/10 overflow-hidden">
        
        {/* Soft Background Gradient Blob */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl opacity-80 z-0 pointer-events-none"></div>

        {/* Dotted Grid Pattern (Left Side) */}
        <div 
          className="absolute left-8 top-[30%] opacity-20 z-0 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#64748B 2px, transparent 2px)', 
            backgroundSize: '16px 16px', 
            width: '80px', 
            height: '140px' 
          }}
        ></div>

        {/* Floating Sparkles */}
        <Sparkle className="absolute left-[24%] top-[25%] h-5 w-5 text-blue-300/60 z-10" />
        <Sparkle className="absolute right-[35%] top-[14%] h-7 w-7 text-blue-300/80 z-10" />
        <Sparkle className="absolute right-[12%] top-[45%] h-4 w-4 text-blue-300/50 z-10" />
        <Sparkle className="absolute left-[18%] bottom-[40%] h-4 w-4 text-blue-300/50 z-10" />

        {/* Top Left Brand Avatar */}
        <div className="absolute top-6 left-6 flex items-center justify-center z-20">
          <div className="w-[72px] h-[72px] rounded-full bg-[#0B1F5E] p-[2px] shadow-lg border-2 border-slate-900 overflow-hidden relative">
            <img
              src={logoIconImg}
              alt="AirdropSailor"
              crossOrigin="anonymous"
              className="w-full h-full object-cover rounded-full"
            />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#1142FE] rounded-full border-2 border-white flex items-center justify-center shadow-sm">
              <Anchor size={12} className="text-white" />
            </div>
          </div>
        </div>

        {/* Right Side 3D Asset (Money Bag) */}
        <img 
          src={moneyBagImg} 
          alt="Funding" 
          crossOrigin="anonymous" 
          onError={(e) => e.target.style.display = 'none'}
          className="absolute right-[6%] top-[12%] w-[220px] object-contain drop-shadow-2xl z-10" 
        />

        {/* Center Hero: Project & Amount */}
        <div className="flex flex-col items-center z-20 w-full mt-2">
          {/* Project Logo */}
          <div className="w-[90px] h-[90px] rounded-full bg-[#111111] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border-4 border-white flex items-center justify-center overflow-hidden z-10">
            {logoUrl ? (
              <img src={logoUrl} alt={projectName} crossOrigin="anonymous" className="w-full h-full object-contain rounded-full" />
            ) : (
              <span className="text-white font-black text-3xl">{projectName.charAt(0)}</span>
            )}
          </div>
          
          <div className="bg-blue-100 text-[#3B5CF8] px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mt-3 mb-1">
            PROJECT
          </div>
          
          <h1 className="text-[55px] leading-none font-black tracking-tight text-[#0B1529] uppercase">
            {projectName}
          </h1>

          <div className="bg-blue-100 text-[#3B5CF8] px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mt-4 mb-1">
            RAISED
          </div>

          <h2 className="text-[120px] leading-none font-black tracking-tighter text-[#3B5CF8] uppercase drop-shadow-sm -mt-2">
            {totalRaised}
          </h2>
        </div>

        {/* Bottom Data Section */}
        <div className="mt-auto w-full flex flex-col gap-4 z-20">
          
          {/* Stats Row */}
          <div className="flex items-end justify-between w-full px-4 gap-6">
            
            {/* Round */}
            <div className="flex flex-col items-center flex-1">
              <span className="bg-blue-100 text-[#3B5CF8] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-2">ROUND</span>
              <div className="bg-white w-full rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-center gap-3">
                <div className="text-[#3B5CF8]"><Flag size={20} strokeWidth={2.5} /></div>
                <span className="text-[19px] font-black text-[#3B5CF8]">{fundingRound}</span>
              </div>
            </div>

            {/* Lead Investor */}
            <div className="flex flex-col items-center flex-1">
              <span className="bg-blue-100 text-[#3B5CF8] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-2">LEAD INVESTOR</span>
              <div className="bg-white w-full rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-center gap-3">
                {investorLogos[leadInvestor] ? (
                  <img src={investorLogos[leadInvestor]} alt={leadInvestor} className="h-6 w-auto max-w-[80px] object-contain" crossOrigin="anonymous" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black">{leadInvestor.charAt(0)}</div>
                )}
                <span className="text-[17px] font-black text-[#0B1529] leading-tight max-w-[120px] truncate">{leadInvestor}</span>
              </div>
            </div>

            {/* Other Investors */}
            <div className="flex flex-col items-center flex-[1.5]">
              <span className="bg-blue-100 text-[#3B5CF8] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-2">OTHER INVESTORS</span>
              <div className="w-full flex items-center justify-center gap-2">
                {otherInvestors.length > 0 ? otherInvestors.map((inv, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-2 min-w-[110px] max-w-[130px]">
                    {investorLogos[inv] ? (
                      <img src={investorLogos[inv]} alt={inv} className="h-5 w-auto max-w-[40px] object-contain shrink-0" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-[9px] font-black shrink-0">{inv.charAt(0)}</div>
                    )}
                    <span className="text-[11px] font-black text-[#0B1529] leading-tight truncate">{inv}</span>
                  </div>
                )) : (
                  <div className="bg-white w-full rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-center">
                    <span className="text-[13px] font-black text-slate-400">Undisclosed</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Description Box */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mx-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#3B5CF8] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Info size={16} strokeWidth={2.5} />
            </div>
            <p className="text-[15px] font-medium text-slate-700 truncate">
              {desc}
            </p>
          </div>

        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="flex items-center justify-between px-6 text-white/90 shrink-0 h-[30px] z-20">
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">FUNDING ALERT</span>
        <span className="flex items-center gap-2 text-[11px] font-black tracking-[0.3em] uppercase">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/60">
            <Anchor size={10} strokeWidth={2.5} />
          </span>
          AIRDROPSAILOR.XYZ
        </span>
      </footer>

    </div>
  );
}