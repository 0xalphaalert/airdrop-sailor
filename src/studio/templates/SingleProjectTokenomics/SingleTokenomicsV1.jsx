import React from 'react';
import { Users, Landmark, Gift, Star, Layout, Database, PieChart, Coins, Info } from 'lucide-react';

export default function Tokenomics({ data }) {
  const selectedItems = data || [];

  const fallbackProject = { name: 'Xeffy', logo_url: null };
  const p = selectedItems[0]?.raw || fallbackProject;
  
  let tData = {};
  try {
    tData = typeof p.tokenomics_details === 'string' ? JSON.parse(p.tokenomics_details) : (p.tokenomics_details || {});
  } catch(e) {}

  const tokenName = p.name || 'Xeffy';
  const ticker = tData.ticker || 'XEF';
  const totalSupply = parseInt(tData.total_supply) || 6000000000;
  const blockchain = tData.network || 'Ethereum';

  const rawAllocations = [
    { label: 'Community & Airdrop', pct: parseFloat(tData.community_allocation_percentage) || 23, color: '#3B28E3' },
    { label: 'Investors & Backers', pct: parseFloat(tData.investor_allocation_percentage) || 50, color: '#3B82F6' },
    { label: 'Ecosystem & Treasury', pct: parseFloat(tData.ecosystem_allocation_percentage) || 20, color: '#14B8A6' },
    { label: 'Core Team', pct: parseFloat(tData.team_allocation_percentage) || 7, color: '#F59E0B' }
  ].filter(a => a.pct > 0);
  
  const chartData = rawAllocations.map(a => ({
     ...a,
     amount: (totalSupply * a.pct) / 100
  }));

  const radius = 15.91549430918954;
  const circumference = 100;
  let currentOffset = 100;

  const vestingData = [
    { icon: <Users className="w-4 h-4"/>, bg: 'bg-blue-100 text-blue-600', label: 'Community & Airdrop', cliff: 'No Cliff', duration: 'TBA', type: 'Full Unlock' },
    { icon: <Landmark className="w-4 h-4"/>, bg: 'bg-teal-100 text-teal-600', label: 'Investors & Backers', cliff: '6 Months', duration: '24 Months', type: 'Linear' },
    { icon: <Gift className="w-4 h-4"/>, bg: 'bg-purple-100 text-purple-600', label: 'Ecosystem & Treasury', cliff: 'No Cliff', duration: '48 Months', type: 'Linear' },
    { icon: <Star className="w-4 h-4"/>, bg: 'bg-orange-100 text-orange-600', label: 'Core Team', cliff: '12 Months', duration: '36 Months', type: 'Linear' }
  ];

  return (
    <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2 z-10">
        <span>AirdropSailor</span>
        <span>Tokenomics</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
      </div>

      {/* Main White Card */}
      <div className="flex-1 w-full max-w-[1150px] mx-auto bg-white rounded-[2rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30 overflow-hidden z-10">
        
        {/* TOP SECTION: BANNER & METRICS */}
        <div className="flex gap-4 mb-6 shrink-0 h-[120px]">
          {/* Title Banner */}
          <div className="w-[40%] bg-[#3B28E3] rounded-[1.5rem] p-5 flex items-center gap-4 text-white shadow-sm overflow-hidden relative">
            <div className="absolute -right-4 -bottom-10 opacity-10">
              <Coins className="w-48 h-48" />
            </div>
            <div className="w-16 h-16 rounded-2xl border-2 border-white/20 bg-white/10 flex items-center justify-center shrink-0 z-10 backdrop-blur-sm">
              <img src={p.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenName}`} className="w-full h-full object-cover rounded-xl" alt="Logo" />
            </div>
            <div className="z-10">
              <h2 className="text-[28px] font-black tracking-tight leading-none mb-1.5">Tokenomics</h2>
              <p className="text-[11px] font-medium text-white/80 leading-snug">Detailed breakdown of the token supply and its distribution.</p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="flex-1 grid grid-cols-4 gap-4">
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Token Name</span>
                <span className="text-[16px] font-black text-slate-900 leading-none block truncate uppercase">{tokenName}</span>
              </div>
            </div>
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Layout className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Ticker</span>
                <span className="text-[16px] font-black text-slate-900 leading-none block truncate uppercase">{ticker}</span>
              </div>
            </div>
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Total Supply</span>
                <span className="text-[16px] font-black text-slate-900 leading-none block truncate" title={totalSupply.toLocaleString()}>{totalSupply >= 1e9 ? (totalSupply/1e9).toFixed(2)+'B' : totalSupply.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <PieChart className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Blockchain</span>
                <span className="text-[16px] font-black text-slate-900 leading-none block truncate">{blockchain}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: CHART & TABLE */}
        <div className="flex gap-6 flex-1 min-h-0">
          
          {/* Left: Token Distribution */}
          <div className="w-[45%] bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-black text-slate-900 mb-6 tracking-tight">Token Distribution</h3>
            <div className="flex items-center justify-between flex-1">
              
              {/* Donut Chart */}
              <div className="relative w-[180px] h-[180px] shrink-0">
                <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 drop-shadow-md">
                  <circle cx="21" cy="21" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="10"></circle>
                  {chartData.map((d, i) => {
                    const strokeDasharray = `${d.pct} ${circumference - d.pct}`;
                    const strokeDashoffset = currentOffset;
                    currentOffset -= d.pct;
                    return (
                      <circle key={i} cx="21" cy="21" r={radius} fill="transparent" stroke={d.color} strokeWidth="12" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out"></circle>
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 mb-0.5">Total Supply</span>
                  <span className="text-sm font-black text-slate-900">{totalSupply >= 1e9 ? (totalSupply/1e9).toFixed(2)+'B' : totalSupply.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{ticker}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 pl-8 space-y-3">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-slate-700 truncate leading-tight">{d.label}</span>
                        <span className="text-[9px] font-medium text-slate-400 leading-tight">{d.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-slate-900">{d.pct}%</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Right: Vesting Schedule */}
          <div className="w-[55%] bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-black text-slate-900 mb-4 tracking-tight">Vesting Schedule</h3>
            
            <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 shrink-0">
              <div className="col-span-5">Allocation</div>
              <div className="col-span-3 text-center">Cliff</div>
              <div className="col-span-4 text-right">Vesting Duration</div>
            </div>

            <div className="flex-1 flex flex-col justify-evenly">
              {vestingData.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 items-center px-2 py-1.5 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100/50 last:border-0">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${row.bg}`}>
                      {row.icon}
                    </div>
                    <span className="text-[13px] font-bold text-slate-800">{row.label}</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="text-[12px] font-medium text-slate-600">{row.cliff}</span>
                  </div>
                  <div className="col-span-4 text-right flex flex-col items-end">
                    <span className="text-[13px] font-bold text-slate-900">{row.duration}</span>
                    <span className="text-[9px] font-medium text-slate-400">{row.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="mt-4 bg-[#F0F4FF] border border-blue-100 rounded-xl p-4 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[12px] font-black text-slate-900 mb-0.5">Vesting & Allocation Notes</h4>
            <p className="text-[11px] font-medium text-slate-500 line-clamp-2 pr-4">
              {tData.vesting_notes || 'The token allocation and vesting schedule are subject to change. Please refer to the official documentation for the most up-to-date information.'}
            </p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2 z-10">
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
        <span>Tokenomics</span>
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