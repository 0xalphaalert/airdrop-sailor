import React from 'react';
import { Sailboat, Calendar, Globe, Info } from 'lucide-react';

export default function TopInvestorsV1({ data }) {
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

  // Fallback data mapping exactly to the provided Top Investors image design
  const fallbackData = [
    { name: "a16z Crypto", amount: "$312.5M", tier: "Tier 1", logo: "https://api.dicebear.com/7.x/initials/svg?seed=a16z&backgroundColor=020617", projects: [{name: "EigenLayer", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Eigen"}, {name: "Aztec", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Aztec"}, {name: "LayerZero", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=LZ"}], extraCount: "+27" },
    { name: "Paradigm", amount: "$276.4M", tier: "Tier 1", logo: "https://api.dicebear.com/7.x/initials/svg?seed=PD&backgroundColor=020617", projects: [{name: "Uniswap", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Uni"}, {name: "Sei Network", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Sei"}, {name: "Flashbots", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Flash"}], extraCount: "+19" },
    { name: "Sequoia Capital", amount: "$198.7M", tier: "Tier 1", logo: "https://api.dicebear.com/7.x/initials/svg?seed=SQ&backgroundColor=020617", projects: [{name: "Mysten Labs", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Mysten"}, {name: "Farcaster", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Far"}, {name: "Conduit", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Con"}], extraCount: "+16" },
    { name: "Binance Labs", amount: "$165.3M", tier: "Tier 2", logo: "https://api.dicebear.com/7.x/initials/svg?seed=BL&backgroundColor=eab308", projects: [{name: "Scroll", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Scroll"}, {name: "Polygon zkEVM", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Poly"}, {name: "CyberConnect", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Cyber"}], extraCount: "+22" },
    { name: "Coinbase Ventures", amount: "$142.8M", tier: "Tier 2", logo: "https://api.dicebear.com/7.x/initials/svg?seed=CB&backgroundColor=2563eb", projects: [{name: "Base", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Base"}, {name: "Clanker", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Clanker"}, {name: "Drift", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Drift"}], extraCount: "+18" },
    { name: "Pantera Capital", amount: "$128.6M", tier: "Tier 2", logo: "https://api.dicebear.com/7.x/initials/svg?seed=PC&backgroundColor=020617", projects: [{name: "Solana Labs", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Sol"}, {name: "1inch", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=1inch"}, {name: "Aurora", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Aur"}], extraCount: "+14" },
    { name: "DFG", amount: "$96.4M", tier: "Tier 3", logo: "https://api.dicebear.com/7.x/initials/svg?seed=DFG&backgroundColor=0f172a", projects: [{name: "DODO", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=DODO"}, {name: "dYdX", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=dYdX"}, {name: "Radix", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Radix"}], extraCount: "+12" },
    { name: "Electric Capital", amount: "$88.7M", tier: "Tier 3", logo: "https://api.dicebear.com/7.x/initials/svg?seed=EC&backgroundColor=020617", projects: [{name: "Aptos", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Aptos"}, {name: "Sui", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Sui"}, {name: "Fuel", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Fuel"}], extraCount: "+13" },
    { name: "Galaxy Digital", amount: "$75.2M", tier: "Tier 3", logo: "https://api.dicebear.com/7.x/initials/svg?seed=GD&backgroundColor=000000", projects: [{name: "Helium", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Helium"}, {name: "Arweave", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Arw"}, {name: "Render", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Render"}], extraCount: "+10" },
    { name: "HashKey Capital", amount: "$63.9M", tier: "Tier 3", logo: "https://api.dicebear.com/7.x/initials/svg?seed=HK&backgroundColor=ffffff&textColor=000000", projects: [{name: "Conflux", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Conflux"}, {name: "Ontology", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Ont"}, {name: "Mantle", logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Mantle"}], extraCount: "+9" },
  ];

  // Map the raw data to ensure it never crashes
  const tableData = (rawItems.length > 0 ? rawItems : fallbackData).map((item, idx) => {
    const raw = item.raw || {};
    
    return {
      name: item.name || raw.investor_name || raw.project_name || `Investor ${idx+1}`,
      amount: item.amount || raw.total_invested || "$0M",
      tier: item.tier || raw.tier || "Tier 3",
      // Protect array mapping for projects
      projects: Array.isArray(item.projects) ? item.projects : [],
      extraCount: item.extraCount || null,
      logo: item.logo || investorLogos[item.name] || raw.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${item.name || idx}`
    };
  });

  // Find max value to dynamically scale the progress bars
  const maxAmount = Math.max(...tableData.map(item => extractNum(item.amount)), 350);

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
        
        <div className="flex items-center gap-2 text-[15px] font-bold tracking-wider uppercase absolute left-1/2 -translate-x-1/2">
          WEEKLY INVESTOR OVERVIEW
        </div>

        <div className="flex items-center gap-2 text-[15px] font-bold tracking-wider uppercase">
          <Calendar className="w-5 h-5" />
          JUN 25 – JUL 02, 2026
        </div>
      </div>

      {/* BIG TITLE */}
      <div className="text-center mt-4 mb-4 relative z-10">
        <h1 className="text-[64px] font-black tracking-tighter text-white uppercase leading-none shadow-sm">
          TOP INVESTORS <span style={{ color: '#66B3FF' }}>THIS WEEK</span>
        </h1>
      </div>

      {/* MAIN WHITE TABLE BOX */}
      <div className="flex-1 mx-10 mb-14 rounded-[2rem] p-6 relative shadow-2xl flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
        
        {/* TABLE HEADERS */}
        <div className="flex items-center w-full px-2 pb-3 text-[12px] font-black tracking-widest uppercase" style={{ color: '#0044CC' }}>
          <div className="w-[40px] text-center">#</div>
          <div className="w-[200px]">INVESTOR</div>
          <div className="flex-1 flex items-center gap-1.5">TOTAL AMOUNT INVESTED <Info size={13} className="opacity-70" /></div>
          <div className="w-[80px] text-center">TIER</div>
          <div className="w-[360px] pl-4">TOP PORTFOLIO PROJECTS</div>
        </div>

        {/* TABLE ROWS */}
        <div className="flex flex-col flex-1 justify-between">
          {tableData.slice(0, 10).map((item, idx) => {
            const numVal = extractNum(item.amount);
            const barWidth = Math.max((numVal / maxAmount) * 100, 2); // Minimum 2% width

            return (
              <React.Fragment key={idx}>
                <div className="flex items-center w-full px-2 py-1">
                  
                  {/* Rank */}
                  <div className="w-[40px] flex justify-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold text-white shadow-sm" style={{ backgroundColor: '#1D4ED8' }}>
                      {idx + 1}
                    </div>
                  </div>
                  
                  {/* Investor */}
                  <div className="w-[200px] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                      <img src={item.logo} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    </div>
                    <span className="text-[14px] font-bold text-slate-900 truncate pr-2">{item.name}</span>
                  </div>
                  
                  {/* Total Invested (Bar + Text) */}
                  <div className="flex-1 flex items-center gap-4 pr-6">
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E0E7FF' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: '#2563EB' }}></div>
                    </div>
                    <span className="w-[70px] text-right text-[15px] font-black" style={{ color: '#1D4ED8' }}>
                      {item.amount}
                    </span>
                  </div>
                  
                  {/* Tier */}
                  <div className="w-[80px] flex justify-center">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                      {item.tier}
                    </span>
                  </div>
                  
                  {/* Portfolio Projects */}
                  <div className="w-[360px] pl-4 flex items-center gap-3">
                    {item.projects.slice(0, 3).map((proj, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-1.5 min-w-0 max-w-[90px]">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 bg-white">
                          <img src={proj.logo} alt={proj.name} className="w-full h-full object-cover" crossOrigin="anonymous"/>
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 truncate">{proj.name}</span>
                      </div>
                    ))}
                    
                    {/* Extra Projects Pill */}
                    {item.extraCount && (
                      <div className="h-6 px-2.5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0 ml-auto" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                        {item.extraCount}
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