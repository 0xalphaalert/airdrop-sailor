import React from 'react';
import { Sailboat, Calendar, Globe } from 'lucide-react';

export default function Top5FundingV1({ data }) {
  const rawItems = data?.selectedItems || [];

  // Helper function to extract a clean number from messy strings like "$29.5M"
  const extractNum = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Fallback data if no items are passed in
  const fallbackData = [
    { name: "Robinhood Chain", value: 9, logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Robinhood&backgroundColor=a3e635" },
    { name: "Arbitrum", value: 26, logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Arbitrum&backgroundColor=1e293b" },
    { name: "Base", value: 33, logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Base&backgroundColor=2563eb" },
    { name: "zkSync Era", value: 49, logo: "https://api.dicebear.com/7.x/shapes/svg?seed=zkSync&backgroundColor=312e81" },
    { name: "Metis", value: 57, logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Metis&backgroundColor=0891b2" },
  ];

  const baseData = rawItems.length > 0 ? rawItems : fallbackData;

  // Process data safely, checking multiple common property names
  const chartData = baseData.slice(0, 10).map((item, idx) => {
    // Check multiple potential fields your data might be using
    const rawVal = item.value ?? item.funding_amount ?? item.amount ?? item.raised ?? item.days;
    let numVal = extractNum(rawVal);
    
    // Safe fallback so the chart still visually renders if the number is completely missing
    if (numVal === 0) numVal = 100 - (idx * 5); 

    return {
      name: item.project_name || item.name || `Project ${idx+1}`,
      logo: item.project_logo || item.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${item.name || idx}`,
      value: numVal,
      display: rawVal !== undefined ? rawVal : numVal
    };
  });

  // Dynamically calculate the perfect Y-Axis scale based on your actual highest value
  const maxVal = Math.max(...chartData.map(d => d.value), 10);
  const adjustedMax = Math.ceil((maxVal * 1.15) / 4) * 4; // Add 15% visual headroom and make it divisible by 4
  const step = adjustedMax / 4;
  const Y_STEPS = [adjustedMax, step * 3, step * 2, step * 1, 0];

  return (
    // MAIN WRAPPER (Locked to 1200x675 for perfect Browserless image generation)
    <div 
      className="relative w-[1200px] h-[675px] flex flex-col font-sans select-none overflow-hidden"
      style={{ backgroundImage: 'linear-gradient(to bottom right, #0028A8, #001155)' }}
    >
      {/* Subtle Background Watermark Graphic */}
      <div className="absolute right-0 top-10 opacity-5 pointer-events-none">
         <Sailboat className="w-96 h-96 text-white" />
      </div>

      {/* TOP HEADER MENU */}
      <div className="flex justify-between items-center px-10 pt-8 text-white">
        <div className="flex items-center gap-3">
          <Sailboat className="w-6 h-6 fill-white" />
          <span className="text-[15px] font-bold tracking-widest">AIRDROPSAILOR</span>
        </div>
        
        <div className="text-[15px] font-bold tracking-widest text-center absolute left-1/2 -translate-x-1/2">
          WEEKLY FUNDING OVERVIEW
        </div>

        <div className="flex items-center gap-2 text-[15px] font-bold tracking-wider">
          <Calendar className="w-5 h-5" />
          JUN 25 – JUL 02, 2026
        </div>
      </div>

      {/* BIG TITLE */}
      <div className="text-center mt-7 mb-7 relative z-10">
        <h1 className="text-[72px] font-black tracking-tighter text-white uppercase leading-none shadow-sm">
          TOP 10 FUNDING <span style={{ color: '#66B3FF' }}>THIS WEEK</span>
        </h1>
      </div>

      {/* MAIN WHITE CHART BOX */}
      <div className="flex-1 mx-10 mb-14 rounded-[2rem] p-8 pb-4 relative shadow-2xl flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
        
        {/* Chart Title */}
        <div className="flex items-center gap-3 font-extrabold text-[17px] tracking-wide mb-6" style={{ color: '#0044CC' }}>
          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: '#0044CC' }}></div>
          DAYS FROM MAINNET LAUNCH TO $1B DEX VOLUME
        </div>

        {/* CHART AREA */}
        <div className="relative w-full flex-1">
          
          {/* Y-Axis Label */}
          <span className="absolute -top-4 left-0 text-[11px] font-black tracking-widest" style={{ color: '#0044CC' }}>
            DAYS
          </span>

          {/* Grid Lines & Y-Axis Values */}
          <div className="absolute top-2 left-0 right-0 bottom-[75px] flex flex-col justify-between pointer-events-none">
            {Y_STEPS.map((val, i) => (
              <div key={i} className="flex items-center w-full relative">
                {/* formatting long numbers neatly */}
                <span className="w-10 text-left font-bold text-[14px]" style={{ color: '#0044CC' }}>
                  {val >= 1000 ? (val/1000).toFixed(1) + 'k' : Number(val.toFixed(1))}
                </span>
                <div className="flex-1 border-b-[1.5px] border-dashed" style={{ borderColor: '#D0E0FF' }}></div>
              </div>
            ))}
          </div>

          {/* Render Bars & X-Axis */}
          <div className="absolute top-2 left-16 right-6 bottom-[75px] flex items-end justify-between z-10">
            {chartData.map((item, idx) => {
              // Calculate height percentage, giving it a minimum of 2% so it never completely vanishes
              const heightPercent = Math.max((item.value / adjustedMax) * 100, 2);

              return (
                <div key={idx} className="flex flex-col items-center justify-end w-[4.5rem] h-full relative group">
                  
                  {/* STACKED CONTENT: Pill immediately follows the bar using Flexbox */}
                  <div className="flex flex-col items-center justify-end w-full h-full relative z-20">
                    
                    {/* Floating Value Pill (Uses margin-bottom to sit cleanly on the bar instead of absolute positioning) */}
                    <div 
                      className="bg-white shadow-[0_4px_15px_rgba(0,10,50,0.12)] px-3 py-1.5 rounded-xl font-black text-[16px] mb-2 transition-transform group-hover:-translate-y-1 whitespace-nowrap" 
                      style={{ color: '#0044CC' }}
                    >
                      {item.display}
                    </div>

                    {/* The Bar */}
                    <div
                      className="w-12 rounded-t-[6px] shadow-sm transition-all"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundImage: 'linear-gradient(to top, #2563EB, #60A5FA)'
                      }}
                    ></div>
                  </div>
                  
                  {/* X-Axis Rendered directly underneath the bar */}
                  <div className="absolute -bottom-[70px] flex flex-col items-center text-center gap-1.5 w-[84px]">
                    <div className="w-[34px] h-[34px] rounded-full p-1 bg-white shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={item.logo} alt={item.name} className="w-full h-full object-cover rounded-full" crossOrigin="anonymous" />
                    </div>
                    <span className="text-[10px] leading-[1.2] font-bold h-8 overflow-hidden line-clamp-2" style={{ color: '#001A55' }}>
                      {item.name.replace(' ', '\n')}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
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