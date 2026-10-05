import React from 'react';
import { Anchor, Shield } from "lucide-react";

// --- 1. CLOUD ASSET PATHS ---
// We are ONLY using your brand logo here. No decorative 3D PNGs.
const BASE_URL = "https://ptobheftxcjiqobxgeal.supabase.co/storage/v1/object/public/Illustrations";
const logoIconImg = `${BASE_URL}/logo-icon.png`; 

function Sparkle({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0c.9 6.6 5.4 11.1 12 12-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.6 11.1 11.1 6.6 12 0z" />
    </svg>
  );
}

export default function Top5TestnetV2({ data }) {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  // --- 2. MULTI-ITEM EXTRACTION & FALLBACKS ---
  const selectedItems = data?.selectedItems || [];
  
  // Exact fallbacks matching your Top 5 Testnet mockup
  const fallbackItems = [
    { name: "Monad Testnet", tier: "Tier 1", logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=Monad` },
    { name: "Jupiter Testnet", tier: "Tier 1", logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=Jupiter` },
    { name: "ZetaChain Testnet", tier: "Tier 1", logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=ZetaChain` },
    { name: "Aptos Testnet", tier: "Tier 2", logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=Aptos` },
    { name: "Berachain Testnet", tier: "Tier 2", logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=Berachain` }
  ];

  // Map exactly 5 items (real data or fallbacks)
  const displayItems = Array(5).fill(null).map((_, i) => {
    const rawData = selectedItems[i]?.raw || fallbackItems[i];
    return {
      name: rawData.name || rawData.project_name || `Project ${i + 1}`,
      tier: rawData.tier || rawData.projects?.tier || fallbackItems[i].tier,
      logoUrl: rawData.logo_url || rawData.project_logo || rawData.projects?.logo_url || fallbackItems[i].logo_url
    };
  });

  return (
    // --- 3. STRICT PIXEL-PERFECT WRAPPER (1200x675) ---
    <div className="w-[1200px] h-[675px] flex flex-col justify-between bg-[#1142FE] p-5 font-sans relative overflow-hidden box-border">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 text-white/90 shrink-0 h-[30px] z-20">
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">AIRDROPSAILOR</span>
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">TOP 5 TESTNET PROJECTS</span>
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">{currentDate}</span>
      </header>

      {/* Massive White Canvas Card - Strict Height */}
      <main className="w-full h-[560px] bg-[#F8FAFC] rounded-[2.5rem] shadow-2xl relative border-4 border-white/10 overflow-hidden">
        
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

        {/* Floating Sparkles (Rebalanced since we removed the PNGs) */}
        <Sparkle className="absolute left-[20%] top-[20%] h-6 w-6 text-blue-300/60 z-10" />
        <Sparkle className="absolute left-[32%] top-[10%] h-4 w-4 text-blue-300/40 z-10" />
        <Sparkle className="absolute right-[22%] top-[16%] h-8 w-8 text-blue-300/80 z-10" />
        <Sparkle className="absolute right-[12%] top-[28%] h-5 w-5 text-blue-300/50 z-10" />
        <Sparkle className="absolute left-[28%] bottom-[35%] h-5 w-5 text-blue-300/50 z-10" />

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

        {/* Center Hero & Titles (Adjusted positioning since the top coin is gone) */}
        <div className="absolute top-[15%] left-0 w-full flex flex-col items-center justify-center z-20">
          <h1 className="text-[90px] leading-none font-black tracking-tight text-[#0B1529] uppercase drop-shadow-sm">
            TOP 5
          </h1>
          
          <div className="mt-4 bg-[#3B5CF8] text-white px-12 py-4 rounded-[1.25rem] shadow-[0_12px_30px_rgba(59,92,248,0.35)] text-center">
            <span className="text-[38px] leading-none font-black tracking-tight uppercase block">
              TESTNET PROJECTS
            </span>
          </div>
        </div>

        {/* The 5 Project Cards (Strictly locked to the bottom) */}
        <div className="absolute bottom-8 left-0 w-full px-8 grid grid-cols-5 gap-4 z-20">
          {displayItems.map((item, idx) => (
            <div
              key={idx}
              className="h-[230px] flex flex-col items-center bg-white rounded-3xl px-3 pt-8 pb-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-slate-100 relative"
            >
              {/* Number Badge */}
              <div className="absolute top-4 left-4 bg-[#3B5CF8] text-white text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-lg shadow-sm">
                {String(idx + 1).padStart(2, '0')}
              </div>

              {/* Project Logo */}
              <div className="w-[80px] h-[80px] rounded-full border-2 border-slate-50 bg-white shadow-sm flex items-center justify-center overflow-hidden mt-1 mb-4 shrink-0 p-1">
                <img
                  src={item.logoUrl}
                  alt={item.name}
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>

              {/* Project Name */}
              <span className="text-[16px] font-black text-[#0B1529] text-center leading-tight line-clamp-2 w-full px-1">
                {item.name}
              </span>

              {/* Tier Badge */}
              <div className="mt-auto bg-blue-50 text-[#3B5CF8] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <Shield size={12} strokeWidth={3} className="shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {item.tier}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="flex items-center justify-between px-6 text-white/90 shrink-0 h-[30px] z-20">
        <span className="text-[11px] font-black tracking-[0.3em] uppercase">TESTNET PROJECTS</span>
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