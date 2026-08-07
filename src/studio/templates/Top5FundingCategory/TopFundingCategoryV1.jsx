import React from 'react';
import { Layout } from 'lucide-react';

export default function TopFundingCategory({ data }) {
  const selectedItems = data || [];

  const fallbackData = [
    { id: 1, name: 'L1 / L2 Infra', amount: '$450M', deals: 14, seed: 'Infra' },
    { id: 2, name: 'DeFi & RWA', amount: '$320M', deals: 11, seed: 'DeFi' },
    { id: 3, name: 'AI Agents', amount: '$210M', deals: 8, seed: 'AI' },
    { id: 4, name: 'DePIN', amount: '$180M', deals: 5, seed: 'DePIN' },
    { id: 5, name: 'Web3 Gaming', amount: '$95M', deals: 7, seed: 'Gaming' },
    { id: 6, name: 'SocialFi', amount: '$60M', deals: 4, seed: 'Social' },
  ];

  const displayData = selectedItems.length > 0 
    ? selectedItems.map(item => ({
        id: item.id,
        name: item.name,
        amount: item.sub || item.raw?.amount || '0',
        deals: item.raw?.deals || 1,
        seed: item.raw?.seed || item.name
      })).slice(0, 10) 
    : fallbackData;

  const parseAmount = (val) => {
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const maxAmount = Math.max(...displayData.map(item => parseAmount(item.amount)));

  return (
    <div className="w-[1200px] h-[675px] bg-gradient-to-b from-[#F2F7FD] to-[#FFFFFF] flex flex-col relative p-10 font-sans overflow-hidden">
      
      {/* HEADER AREA */}
      <div className="flex justify-between items-start z-10 w-full mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3 uppercase">
            TOP SECTORS BY <span className="text-blue-600">CAPITAL INFLOW</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-2 flex flex-col gap-1">
            <span>Data Source: airdropsailor.xyz</span>
            <span className="text-[10px] text-slate-400">Sector allocations reflect aggregate institutional funding.</span>
          </p>
        </div>
        <div className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
        </div>
      </div>

      {/* CHART AREA */}
      <div className="flex-1 relative w-full flex items-end justify-center gap-4 z-10 px-12 pb-24 mt-4"> 
        
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap origin-center">
          Capital Raised (USD)
        </div>

        <div className="absolute inset-x-10 inset-y-0 flex flex-col justify-between pointer-events-none z-0 pb-24">
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className="w-full h-px border-b border-dashed border-slate-300/60"></div>
           ))}
        </div>

        {displayData.map((item) => {
          const amountRaw = parseAmount(item.amount);
          const heightPercent = maxAmount > 0 ? Math.max((amountRaw / maxAmount) * 100, 15) : 15;

          return (
            <div key={item.id} className="relative flex flex-col items-center justify-end h-full w-[75px] z-10 group">
              <div className="text-emerald-500 font-black text-lg mb-3 drop-shadow-sm tracking-tight whitespace-nowrap">
                {item.amount}
              </div>

              <div 
                className="w-[50px] bg-gradient-to-b from-emerald-400 to-emerald-50/10 rounded-t-sm transition-all duration-700"
                style={{ height: `${heightPercent}%` }}
              ></div>

              <div className="absolute top-full pt-4 flex flex-col items-center w-full">
                <div className="w-9 h-9 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center mb-2 overflow-hidden p-1">
                  <img 
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.seed}`} 
                    className="w-full h-full object-cover rounded-full" 
                    alt="icon" 
                  />
                </div>
                
                <span className="text-slate-800 font-bold text-[11px] text-center leading-tight whitespace-nowrap">
                  {item.name}
                </span>
                
                <span className="text-slate-400 font-bold text-[9px] uppercase mt-0.5 tracking-wider whitespace-nowrap">
                  [{item.deals} Deals]
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-6 left-10 right-10 flex justify-between items-end z-10 border-t border-slate-300/40 pt-4">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
          <Layout className="w-5 h-5" /> 
          airdropsailor.xyz/funding
        </div>
        <div className="flex items-center gap-2 text-slate-800 font-black text-2xl tracking-tight">
          AirdropSailor
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md p-1.5">
             <img 
               src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
               alt="Sailor Logo" 
               className="w-full h-full object-contain" 
             />
          </div>
        </div>
      </div>

    </div>
  );
}