import React from 'react';
import { Sailboat, Calendar, Globe, Hexagon, Shield, Layers, User, Cuboid } from 'lucide-react';

export default function Top5FundingV2({ data }) {
  const rawItems = data?.selectedItems || [];
  const investorLogos = data?.investorLogos || {};

  // Helper function to safely extract numbers for the progress bar calculation
  const extractNum = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Fallback data mapping exactly to the provided image design
  const fallbackData = [
    { name: "Polysights", round: "Pre Seed", amount: "$1.5M", category: "Prediction Market", catIcon: Hexagon, investors: ["MA", "https://api.dicebear.com/7.x/shapes/svg?seed=1", "https://api.dicebear.com/7.x/shapes/svg?seed=2"], extraInv: "+8", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Poly&backgroundColor=020617" },
    { name: "Unichain", round: "Seed", amount: "$8.2M", category: "DeFi", catIcon: Shield, investors: ["https://api.dicebear.com/7.x/shapes/svg?seed=3", "https://api.dicebear.com/7.x/shapes/svg?seed=4", "al6z"], extraInv: "+12", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Uni&backgroundColor=db2777" },
    { name: "Blast", round: "Series A", amount: "$15.0M", category: "Layer 2", catIcon: Layers, investors: ["https://api.dicebear.com/7.x/shapes/svg?seed=5", "MA", "#HASHED"], extraInv: "+7", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Blast&backgroundColor=eab308" },
    { name: "Metis", round: "Series A", amount: "$22.0M", category: "Layer 2", catIcon: Layers, investors: ["OKX", "https://api.dicebear.com/7.x/shapes/svg?seed=6", "MA"], extraInv: "+6", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Metis&backgroundColor=0891b2" },
    { name: "zkSync Era", round: "Series B", amount: "$25.0M", category: "Layer 2", catIcon: Layers, investors: ["al6z", "#HASHED", "https://api.dicebear.com/7.x/shapes/svg?seed=7"], extraInv: "+10", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=zkSync&backgroundColor=312e81" },
    { name: "OP Mainnet", round: "Series B", amount: "$30.0M", category: "Layer 2", catIcon: Layers, investors: ["L", "https://api.dicebear.com/7.x/shapes/svg?seed=8", "https://api.dicebear.com/7.x/shapes/svg?seed=9"], extraInv: "+9", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=OP&backgroundColor=dc2626" },
    { name: "Arbitrum", round: "Series B", amount: "$35.0M", category: "Layer 2", catIcon: Layers, investors: ["https://api.dicebear.com/7.x/shapes/svg?seed=10", "al6z", "MA"], extraInv: "+11", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Arb&backgroundColor=1e293b" },
    { name: "Abstract", round: "Series B", amount: "$42.0M", category: "Consumer", catIcon: User, investors: ["al6z", "https://api.dicebear.com/7.x/shapes/svg?seed=11", "https://api.dicebear.com/7.x/shapes/svg?seed=12"], extraInv: "+7", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Abs&backgroundColor=22c55e" },
    { name: "Base", round: "Series C", amount: "$50.0M", category: "Infrastructure", catIcon: Cuboid, investors: ["al6z", "https://api.dicebear.com/7.x/shapes/svg?seed=13", "Greylock"], extraInv: "+13", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Base&backgroundColor=2563eb" },
    { name: "Mantle", round: "Series C", amount: "$80.0M", category: "Layer 2", catIcon: Layers, investors: ["OKX", "https://api.dicebear.com/7.x/shapes/svg?seed=14", "MA"], extraInv: "+15", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Mantle&backgroundColor=020617" },
  ];

  // Map the raw data from CreatorStudio, tapping directly into raw.lead_investor and investorLogos
  const tableData = (rawItems.length > 0 ? rawItems : fallbackData).map((item, idx) => {
    const raw = item.raw || {};
    
    let parsedInvestors = [];
    let extraInv = item.extraInv || null;

    if (rawItems.length > 0) {
      // 1. We are using Real Database Data
      const leadStr = raw.lead_investor || "";
      const splitted = leadStr.split(',').map(s => s.trim()).filter(Boolean);
      
      // Grab first 3 investors and look up their logos
      parsedInvestors = splitted.slice(0, 3).map(invName => ({
        name: invName,
        logo: investorLogos[invName] || null, // Check the dictionary passed from CreatorStudio
        initials: invName.substring(0, 3).toUpperCase()
      }));

      // Calculate the extra pill if there are more than 3 investors
      if (splitted.length > 3) {
        extraInv = `+${splitted.length - 3}`;
      }
    } else {
      // 2. We are using Fallback Preview Data
      parsedInvestors = item.investors.map(inv => {
        if (inv.startsWith('http')) return { name: 'VC', logo: inv, initials: 'VC' };
        return { name: inv, logo: null, initials: inv };
      });
    }

    return {
      name: item.name || raw.project_name || `Project ${idx+1}`,
      round: item.round || raw.round || "Seed",
      amount: item.amount || raw.funding_amount || "$0M",
      category: item.category || raw.category || "DeFi",
      catIcon: item.catIcon || Layers,
      investors: parsedInvestors,
      extraInv: extraInv,
      logo: item.logo || raw.project_logo || `https://api.dicebear.com/7.x/initials/svg?seed=${item.name || idx}`
    };
  });

  // Find max value to dynamically scale the progress bars
  const maxAmount = Math.max(...tableData.map(item => extractNum(item.amount)), 80);

  return (
    // MAIN WRAPPER (Locked to 1200x675 for perfect Browserless image generation)
    <div 
      className="relative w-[1200px] h-[675px] flex flex-col font-sans select-none overflow-hidden"
      style={{ backgroundImage: 'linear-gradient(to bottom right, #001A88, #000B33)' }}
    >
      {/* Background Decor */}
      <div className="absolute right-0 top-10 opacity-5 pointer-events-none">
         <Sailboat className="w-96 h-96 text-white" />
      </div>

      {/* TOP HEADER MENU */}
      <div className="flex justify-between items-center px-10 pt-8 text-white z-10">
        <div className="flex items-center gap-3">
          <Sailboat className="w-6 h-6 fill-white" />
          <span className="text-[15px] font-bold tracking-widest uppercase">AIRDROPSAILOR</span>
        </div>
        
        <div className="flex items-center gap-2 text-[15px] font-bold tracking-wider uppercase">
          <Calendar className="w-5 h-5" />
          JUN 25 – JUL 02, 2026
        </div>
      </div>

      {/* BIG TITLE */}
      <div className="text-center mt-4 mb-4 relative z-10">
        <h1 className="text-[64px] font-black tracking-tighter text-white uppercase leading-none shadow-sm">
          TOP 10 FUNDING <span style={{ color: '#66B3FF' }}>THIS WEEK</span>
        </h1>
      </div>

      {/* MAIN WHITE TABLE BOX */}
      <div className="flex-1 mx-10 mb-14 rounded-[2rem] p-6 relative shadow-2xl flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
        
        {/* TABLE HEADERS */}
        <div className="flex items-center w-full px-2 pb-3 text-[12px] font-black tracking-widest uppercase" style={{ color: '#0044CC' }}>
          <div className="w-[40px] text-center">#</div>
          <div className="w-[180px]">PROJECT</div>
          <div className="w-[120px]">ROUND</div>
          <div className="flex-1 text-center">TOTAL RAISED</div>
          <div className="w-[200px]">CATEGORY</div>
          <div className="w-[220px]">INVESTORS</div>
        </div>

        {/* TABLE ROWS */}
        <div className="flex flex-col flex-1 justify-between">
          {tableData.slice(0, 10).map((item, idx) => {
            const numVal = extractNum(item.amount);
            const barWidth = Math.max((numVal / maxAmount) * 100, 2); // Minimum 2% width
            const CatIcon = item.catIcon;

            return (
              <React.Fragment key={idx}>
                <div className="flex items-center w-full px-2 py-1">
                  
                  {/* Rank */}
                  <div className="w-[40px] flex justify-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold text-white shadow-sm" style={{ backgroundColor: '#1D4ED8' }}>
                      {idx + 1}
                    </div>
                  </div>
                  
                  {/* Project */}
                  <div className="w-[180px] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                      <img src={item.logo} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    </div>
                    <span className="text-[14px] font-bold text-slate-900 truncate pr-2">{item.name}</span>
                  </div>
                  
                  {/* Round */}
                  <div className="w-[120px]">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                      {item.round}
                    </span>
                  </div>
                  
                  {/* Total Raised (Bar + Text) */}
                  <div className="flex-1 flex items-center gap-4 pr-6">
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E0E7FF' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: '#2563EB' }}></div>
                    </div>
                    <span className="w-16 text-right text-[15px] font-black" style={{ color: '#1D4ED8' }}>
                      {item.amount}
                    </span>
                  </div>
                  
                  {/* Category */}
                  <div className="w-[200px] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}>
                      <CatIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 truncate">{item.category}</span>
                  </div>
                  
                  {/* Investors (Now properly rendering logos from CreatorStudio state) */}
                  <div className="w-[220px] flex items-center gap-1.5">
                    {item.investors.map((inv, iIdx) => (
                      <div key={iIdx} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm overflow-hidden border border-slate-100 shrink-0" 
                           style={{ backgroundColor: inv.logo ? '#FFF' : '#0F172A' }}>
                        {inv.logo ? (
                          <img src={inv.logo} alt={inv.name} className="w-full h-full object-cover" crossOrigin="anonymous"/>
                        ) : (
                          inv.initials
                        )}
                      </div>
                    ))}
                    {/* Extra Investors Pill */}
                    {item.extraInv && (
                      <div className="h-7 px-2 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm ml-1" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                        {item.extraInv}
                      </div>
                    )}
                  </div>

                </div>
                
                {/* Dotted Row Separator (Skip on last row) */}
                {idx < 9 && <div className="border-b-[1.5px] border-dashed border-slate-200 w-full opacity-60"></div>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <div className="absolute bottom-5 left-10 right-10 flex justify-between items-center text-white text-[13px] font-bold tracking-widest z-10">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 opacity-80" />
          airdropsailor.xyz
        </div>
        
        <div className="flex items-center gap-2 opacity-60 absolute left-1/2 -translate-x-1/2">
          <Sailboat className="w-4 h-4 fill-current" />
          AIRDROPSAILOR
        </div>

        <div>
          STAY AHEAD. SAIL SMART.
        </div>
      </div>
    </div>
  );
}