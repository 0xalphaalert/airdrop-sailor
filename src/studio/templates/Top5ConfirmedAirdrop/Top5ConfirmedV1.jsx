import React from 'react';
import { Calendar, Globe, CheckCircle2, Navigation } from 'lucide-react';

export default function Top5ConfirmedV1({ data }) {
  // Extract up to 5 items from the studio's selection pipeline
  const items = data?.selectedItems?.slice(0, 5) || [];

  // Fill with dummy data if less than 5 projects are selected to maintain the design structure
  const displayItems = [...items];
  while (displayItems.length < 5) {
    displayItems.push({
      raw: {
        name: 'Project',
        logo_url: 'https://via.placeholder.com/150',
        funding: '$0M',
        twitter_followers: 0,
        discord_members: 0,
        airdrop_status: 'TBA',
        created_at: new Date().toISOString()
      }
    });
  }

  // Format total participants (e.g. 1.2M+, 45K+)
  const formatNumber = (num) => {
    if (!num || num === 0) return 'TBA';
    const n = Number(num);
    if (isNaN(n)) return 'TBA';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M+';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K+';
    return n.toLocaleString() + '+';
  };

  // Format the bottom date badge (e.g. June 24, 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // The 5 specific pastel tint colors matching your reference image
  const badgeColors = [
    "bg-fuchsia-50 text-fuchsia-700",
    "bg-amber-50 text-amber-700",
    "bg-cyan-50 text-cyan-700",
    "bg-orange-50 text-orange-700",
    "bg-purple-50 text-purple-700"
  ];

  return (
    <div className="w-[1200px] h-[675px] bg-[#0b33b1] flex flex-col p-10 font-sans overflow-hidden box-border">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center w-full mb-8">
        <div className="border-[3px] border-white rounded-[24px] px-8 py-3.5 flex items-center justify-center bg-[#0b33b1]">
          <h1 className="text-white text-[34px] leading-none font-black tracking-wide">TOP 5 AIRDROP CONFIRMED PROJECTS</h1>
        </div>
        <div className="border-[3px] border-white rounded-[24px] px-6 py-3.5 flex items-center gap-3 bg-[#0b33b1]">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shrink-0">
            {/* Minimal Sailboat Logo */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#0b33b1]" fill="currentColor">
              <path d="M11 2L2 15h9V2zm2 0v13h9L13 2zM3 17q4 3 9 3t9-3v2q-4 3-9 3t-9-3v-2z" />
            </svg>
          </div>
          <span className="text-white text-[24px] leading-none font-bold">@airdropsailor</span>
        </div>
      </div>

      {/* --- CARDS GRID --- */}
      <div className="flex gap-5 flex-1 w-full">
        {displayItems.map((item, idx) => {
          const p = item.raw || item;
          
          // Smart Ticker Extraction
          let ticker = '$TOKEN';
          try {
              const tDetails = typeof p.tokenomics_details === 'string' ? JSON.parse(p.tokenomics_details) : p.tokenomics_details;
              if (tDetails && tDetails.ticker) ticker = `$${tDetails.ticker}`;
              else if (Array.isArray(tDetails) && tDetails[0]?.ticker) ticker = `$${tDetails[0].ticker}`;
              else ticker = `$${(p.name || 'PROJ').substring(0, 4).toUpperCase()}`;
          } catch(e) {
              ticker = `$${(p.name || 'PROJ').substring(0, 4).toUpperCase()}`;
          }

          // Calculate total community participants
          const communitySize = (Number(p.twitter_followers) || 0) + (Number(p.discord_members) || 0);
          
          // Status Logic
          const isConfirmed = p.airdrop_status === 'Confirmed';
          const statusText = isConfirmed ? 'Yes' : p.airdrop_status || 'TBA';
          const statusColor = isConfirmed ? 'text-emerald-500' : 'text-blue-500';

          return (
            <div key={idx} className="flex-1 bg-white rounded-[32px] p-6 flex flex-col shadow-xl">
              
              {/* Card Brand Header */}
              <div className="flex items-center gap-4 mb-5">
                <img src={p.logo_url || p.project_logo} alt={p.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-100 bg-slate-50 shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-[20px] font-black text-slate-900 leading-tight truncate">{p.name || p.project_name}</h2>
                  <p className="text-sm font-bold text-slate-400 mt-0.5">{ticker}</p>
                </div>
              </div>

              {/* Faint Divider */}
              <div className="h-[2px] w-full bg-slate-50 mb-5"></div>

              {/* Core Statistics */}
              <div className="flex flex-col gap-5 flex-1">
                <div>
                  <p className="text-[13px] font-bold text-slate-400 mb-0.5">Airdrop Value</p>
                  <p className="text-[26px] font-black text-slate-900 leading-none">{p.funding || p.funding_amount || 'TBA'}</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-400 mb-0.5">Total Participants</p>
                  <p className="text-[26px] font-black text-slate-900 leading-none">{formatNumber(communitySize)}</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-400 mb-1">Airdrop Confirmed</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`fill-current text-white w-7 h-7 shrink-0 ${isConfirmed ? 'text-emerald-500' : 'text-blue-500'}`} />
                    <p className={`text-[24px] font-black leading-none ${statusColor}`}>{statusText}</p>
                  </div>
                </div>
              </div>

              {/* Date Footer Button */}
              <div className={`mt-4 w-full rounded-[20px] py-3.5 flex items-center justify-center gap-2 ${badgeColors[idx % badgeColors.length]}`}>
                <Calendar className="w-5 h-5 shrink-0" />
                <span className="font-bold text-[15px]">{formatDate(p.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- FOOTER BAR --- */}
      <div className="flex justify-between items-center w-full mt-8 text-white">
        <div className="flex items-center gap-2.5 font-bold text-[20px]">
          <Globe className="w-6 h-6 opacity-80" /> airdropsailor.xyz
        </div>
        
        <div className="flex items-center gap-3 opacity-90">
          <div className="w-7 h-7 rounded-full border-[1.5px] border-white flex items-center justify-center">
             <Navigation className="w-3.5 h-3.5 fill-white transform rotate-45 -ml-0.5 mt-0.5" />
          </div>
          <span className="text-[16px] font-black tracking-[0.2em]">STAY AHEAD. SAIL SMART.</span>
        </div>

        <div className="flex items-center gap-2.5 font-bold text-[20px]">
          <Calendar className="w-6 h-6 opacity-80" /> JUL 27 &ndash; AUG 2, 2026
        </div>
      </div>
      
    </div>
  );
}