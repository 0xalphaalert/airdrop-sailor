import React from 'react';
import { Anchor, Rocket } from "lucide-react";

// --- 1. CLOUD ASSET PATHS (MANDATORY FOR SCREENSHOT ENGINE) ---
// Pointing exactly to your Supabase "Illustrations" bucket
const BASE_URL = "https://ptobheftxcjiqobxgeal.supabase.co/storage/v1/object/public/Illustrations";

const logoIconImg = `${BASE_URL}/logo-icon.png`; 
const fundingIcon = `${BASE_URL}/icon-funding.png`;
const scoreIcon = `${BASE_URL}/icon-score.png`;
const tierIcon = `${BASE_URL}/icon-tier.png`;
const bookmarkIcon = `${BASE_URL}/icon-bookmark.png`;

function Sparkle({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0c.9 6.6 5.4 11.1 12 12-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.6 11.1 11.1 6.6 12 0z" />
    </svg>
  );
}

export default function SingleAirdropV3({ data }) {
  // --- 2. DATA EXTRACTION & FALLBACKS ---
  const raw = data?.raw || data?.selectedItems?.[0]?.raw || {};
  
  let aiData = {};
  try {
    aiData = typeof raw.ai_research_data === 'string' ? JSON.parse(raw.ai_research_data) : (raw.ai_research_data || {});
  } catch (e) {
    aiData = {};
  }

  const projectName = raw.name || raw.project_name || 'Project';
  const funding = raw.funding || raw.funding_amount || '$1.2 M';
  const airdropScore = aiData.airdrop_score || '20/100';
  const tier = raw.tier || 'Tier 1';
  const status = raw.status || raw.round || 'IT'; 
  const logoUrl = raw.logo_url || raw.project_logo || logoIconImg; 

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  const STATS = [
    { icon: fundingIcon, label: "Total Funding", value: funding },
    { icon: scoreIcon, label: "Airdrop Score", value: airdropScore },
    { icon: tierIcon, label: "Airdrop Tier", value: tier },
    { icon: bookmarkIcon, label: "Bookmark", value: status },
  ];

  return (
    // --- 3. STRICT PIXEL-PERFECT WRAPPER (1200x675) ---
    <div className="w-[1200px] h-[675px] flex flex-col justify-between bg-[#1142FE] p-5 font-sans relative overflow-hidden box-border">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 text-white/90 shrink-0 mb-3">
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">AIRDROPSAILOR</span>
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">AIRDROP GUIDE</span>
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">{currentDate}</span>
      </header>

      {/* Massive White Canvas Card - Recalculated padding so it doesn't overflow */}
      <main className="flex-1 bg-[#F8FAFC] rounded-[2.5rem] shadow-2xl relative flex flex-col items-center pt-8 pb-6 px-10 z-10 border-4 border-white/10 overflow-hidden">
        
        {/* Dotted Grid Pattern (Left Side) */}
        <div 
          className="absolute left-10 top-1/3 opacity-20" 
          style={{ 
            backgroundImage: 'radial-gradient(#64748B 2px, transparent 2px)', 
            backgroundSize: '16px 16px', 
            width: '80px', 
            height: '140px' 
          }}
        ></div>

        {/* Floating Sparkles */}
        <Sparkle className="absolute left-[24%] top-[25%] h-6 w-6 text-blue-300/60" />
        <Sparkle className="absolute right-[22%] top-[18%] h-8 w-8 text-blue-300/80" />
        <Sparkle className="absolute right-[16%] top-[38%] h-4 w-4 text-blue-300/50" />
        <Sparkle className="absolute left-[30%] bottom-[32%] h-4 w-4 text-blue-300/50" />

        {/* Top Left Brand Avatar */}
        <div className="absolute top-6 left-6 flex items-center justify-center">
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

        {/* Center Hero - Heights locked to fit */}
        <div className="flex flex-col items-center z-10">
          <div className="w-[110px] h-[110px] rounded-full bg-[#111111] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.15)] border-4 border-white flex items-center justify-center overflow-hidden">
            <img
              src={logoUrl}
              alt={projectName}
              crossOrigin="anonymous"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>
          
          <h1 className="mt-3 text-[70px] leading-none font-black tracking-tight text-[#0B1529] uppercase">
            {projectName}
          </h1>
          
          <div className="mt-3 bg-[#3B5CF8] text-white px-8 py-2.5 rounded-[1rem] shadow-[0_12px_30px_rgba(59,92,248,0.35)]">
            <span className="text-[36px] leading-none font-black tracking-tight uppercase">
              AIRDROP GUIDE
            </span>
          </div>
        </div>

        {/* 4 Stat Boxes - Heights locked to prevent flexbox blowing up */}
        <div className="mt-auto grid grid-cols-4 gap-5 w-full max-w-[1000px] z-10">
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center bg-white rounded-3xl px-3 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50"
            >
              <img
                src={stat.icon}
                alt={stat.label}
                crossOrigin="anonymous"
                className="h-16 w-auto object-contain drop-shadow-sm"
              />
              <span className="mt-4 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                {stat.label}
              </span>
              <span className="mt-1 text-[28px] font-black uppercase text-[#3B5CF8] tracking-tight truncate w-full text-center">
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Tagline */}
        <div className="mt-5 flex justify-center z-10">
          <div className="flex items-center gap-2.5 rounded-full border-2 border-[#E2E8F0] bg-white/50 px-6 py-2 backdrop-blur-sm">
            <Rocket size={16} className="text-[#3B5CF8]" />
            <span className="text-[#3B5CF8] text-[13px] font-black tracking-[0.25em] uppercase">
              EARLY • SIMPLE • REWARDING
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="flex items-center justify-between px-6 text-white/90 z-10 shrink-0 mt-3">
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">TASK UPDATE</span>
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