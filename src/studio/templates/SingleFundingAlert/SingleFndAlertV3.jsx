import React from 'react';
import { Bell, TrendingUp, Calendar, Coins } from 'lucide-react';

export default function SingleFndAlertV3({ data }) {
  // 1. Safe data extraction 
  const raw = data?.raw || data?.selectedItems?.[0]?.raw || {};
  const investorLogos = data?.investorLogos || {};
  
  const projectName = raw.project_name || raw.name || 'ChainOpera AI';
  const logoUrl = raw.logo_url || raw.project_logo || null;
  
  // Funding metrics
  const totalRaised = raw.funding_amount || raw.funding || '$17.0M';
  const fundingRound = raw.round || raw.funding_round || 'Series A';
  const category = (raw.category || raw.sector || 'AI • INFRASTRUCTURE').toUpperCase();
  
  // Date formatting
  const rawDate = raw.announced_on || raw.last_updated || raw.created_at;
  const announcedDate = rawDate 
    ? new Date(rawDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'July 20, 2026';

  // 2. Investor processing
  let investorsStr = raw.lead_investor || raw.lead_investors || '';
  let investorsArray = investorsStr ? investorsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  // Fallback demo investors for preview
  if (investorsArray.length === 0) {
    investorsArray = ['finality', 'SAMSUNG NEXT', 'animoca BRANDS', 'ABCDE', 'PIVOT', 'Gate Ventures'];
  }

  const displayInvestors = investorsArray.slice(0, 6);
  const hasOthers = investorsArray.length > 6;

  return (
    <div className="relative w-[1200px] h-[675px] bg-[#FDFEFF] font-sans overflow-hidden border border-slate-100 flex flex-col p-12">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-400/20 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-100/40 blur-[100px] pointer-events-none rounded-full"></div>

      {/* 1. TOP HEADER BAR */}
      <div className="flex items-center justify-between w-full relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1556BE] flex items-center justify-center shadow-md">
            <img 
              src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
              alt="AirdropSailor" 
              className="w-6 h-6 object-contain" 
              crossOrigin="anonymous"
            />
          </div>
          <span className="text-[#1556BE] font-black text-2xl tracking-wide">
            AIRDROPSAILOR
          </span>
        </div>

        <div className="bg-blue-50/80 border border-blue-100 text-[#1556BE] font-bold px-6 py-2.5 rounded-full flex items-center gap-2.5 text-xs tracking-widest shadow-sm relative">
          <Bell className="w-4 h-4 fill-[#1556BE] text-[#1556BE]" />
          <span>FUNDING ALERT</span>
          {/* Decorative Sparkles around the badge */}
          <div className="absolute -top-2 -right-3 flex gap-1 transform rotate-12">
            <div className="w-1.5 h-4 bg-blue-400 rounded-full transform rotate-45"></div>
            <div className="w-1.5 h-3 bg-blue-400 rounded-full mt-1"></div>
            <div className="w-4 h-1.5 bg-blue-400 rounded-full mt-2 transform -rotate-45"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10 pt-4">
        
        {/* 2. MIDDLE TOP HERO SECTION */}
        <div className="flex items-center justify-between gap-8 shrink-0">
          
          {/* Left: Project Branding */}
          <div className="flex items-center gap-7 flex-1 min-w-0">
            <div className="w-[160px] h-[160px] rounded-full bg-[#080E18] flex items-center justify-center p-2 shadow-2xl shrink-0 overflow-hidden border-[8px] border-white z-10">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={projectName} 
                  className="w-full h-full object-cover rounded-full" 
                  crossOrigin="anonymous"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-indigo-800 flex items-center justify-center text-white text-5xl font-black">
                  {projectName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 min-w-0">
              <h1 className="text-[52px] font-black text-[#0B1B4D] tracking-tight leading-none truncate">
                {projectName}
              </h1>
              <div>
                <span className="inline-flex items-center px-4 py-1.5 bg-blue-50/80 border border-blue-100 text-[#1556BE] rounded-full font-black text-[11px] tracking-widest uppercase">
                  {category}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Total Raised Card */}
          <div className="w-[440px] bg-gradient-to-br from-blue-50/70 to-indigo-50/30 border border-blue-100/80 rounded-[28px] p-8 flex items-center justify-between shadow-sm shrink-0">
            <div>
              <span className="text-slate-400 font-bold text-xs tracking-widest uppercase block mb-1">
                TOTAL RAISED
              </span>
              <span className="text-[64px] font-black text-[#1556BE] leading-none tracking-tighter">
                {totalRaised}
              </span>
            </div>
            <div className="w-[84px] h-[84px] rounded-full bg-blue-100/60 border border-blue-200/50 flex items-center justify-center shadow-inner shrink-0">
              <Coins className="w-10 h-10 text-[#1556BE]" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* 3. MIDDLE BOTTOM METRIC CARDS */}
        <div className="grid grid-cols-2 gap-6 mt-8 shrink-0">
          {/* Round Card */}
          <div className="bg-[#F8FAFF] border border-slate-100 rounded-3xl p-6 flex items-center gap-5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#1556BE] text-white flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <TrendingUp className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[11px] tracking-widest uppercase block mb-0.5">
                ROUND
              </span>
              <span className="text-2xl font-black text-[#0B1B4D] block truncate">
                {fundingRound}
              </span>
            </div>
          </div>

          {/* Announced On Card */}
          <div className="bg-[#F8FAFF] border border-slate-100 rounded-3xl p-6 flex items-center gap-5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#1556BE] text-white flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <Calendar className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[11px] tracking-widest uppercase block mb-0.5">
                ANNOUNCED ON
              </span>
              <span className="text-2xl font-black text-[#0B1B4D] block truncate">
                {announcedDate}
              </span>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM INVESTORS SECTION */}
        <div className="border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-3xl p-6 mt-6 shrink-0">
          <span className="text-[#1556BE] font-black text-[11px] tracking-widest uppercase block mb-4">
            INVESTORS
          </span>

          <div className="flex items-center gap-3 overflow-hidden">
            {displayInvestors.map((invName, idx) => {
              const logo = investorLogos[invName];
              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200/60 rounded-xl px-5 py-2 flex items-center justify-center h-[52px] min-w-[140px] max-w-[180px] shadow-sm flex-1"
                >
                  {logo ? (
                     <img src={logo} alt={invName} className="max-h-[28px] max-w-[120px] object-contain opacity-90" crossOrigin="anonymous"/>
                  ) : (
                    <span className="text-[#0B1B4D] font-extrabold text-[13px] tracking-tight text-center truncate">
                      {invName}
                    </span>
                  )}
                </div>
              );
            })}

            {hasOthers && (
              <div className="bg-blue-50 text-[#1556BE] font-bold text-xs px-5 rounded-xl flex items-center justify-center h-[52px] shrink-0">
                + others
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}