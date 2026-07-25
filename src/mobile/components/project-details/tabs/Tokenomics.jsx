// src/mobile/components/project-details/tabs/Tokenomics.jsx
import React from 'react';
import { Coins, TrendingUp, Activity, ListChecks, ShieldAlert } from 'lucide-react';

export default function Tokenomics({ project }) {
  let tokenData = {};
  try {
    tokenData = typeof project?.tokenomics_details === 'string' 
      ? JSON.parse(project.tokenomics_details || '{}') 
      : (project?.tokenomics_details || {});
  } catch (e) { console.error("Tokenomics Parse Error", e); }

  const hasData = tokenData && Object.keys(tokenData).length > 0 && tokenData.ticker && tokenData.ticker !== 'TOKEN';

  const totalRaw = parseInt(tokenData.total_supply) || 0;
  const ticker = tokenData.ticker || 'TBA';
  const tokenName = project?.name || 'TBA';
  const tgeDate = tokenData.tge_date || 'Unconfirmed';
  
  const cp = parseFloat(tokenData.community_allocation_percentage) || 0;
  const ip = parseFloat(tokenData.investor_allocation_percentage) || 0;
  const tp = parseFloat(tokenData.team_allocation_percentage) || 0;
  const ep = parseFloat(tokenData.ecosystem_allocation_percentage) || 0;

  const calcAbs = (pct) => totalRaw > 0 ? ((totalRaw * pct) / 100).toLocaleString() : 'TBA';

  const formatTotal = (num) => {
    if (!num || num === 0) return 'TBA';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toLocaleString();
  };

  if (!hasData) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 px-5 pt-4">
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <Coins className="w-6 h-6 text-slate-300" />
          </div>
          <h2 className="text-lg font-black text-slate-800 mb-2">Tokenomics TBA</h2>
          <p className="text-xs font-medium text-slate-500">The token architecture for {project?.name || 'this project'} has not been publicly released yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* TOKEN DISTRIBUTION (CHART & LEGEND) */}
      <div className="bg-white px-5 py-6 mb-2">
        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-6">Token Distribution</h3>
        
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-48 shrink-0">
            <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 drop-shadow-sm">
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="8"></circle>
              {cp > 0 && <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" strokeWidth="8" strokeDasharray={`${cp} ${100 - cp}`} strokeDashoffset={0}></circle>}
              {ip > 0 && <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="8" strokeDasharray={`${ip} ${100 - ip}`} strokeDashoffset={100 - cp}></circle>}
              {tp > 0 && <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" strokeWidth="8" strokeDasharray={`${tp} ${100 - tp}`} strokeDashoffset={100 - (cp + ip)}></circle>}
              {ep > 0 && <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#a855f7" strokeWidth="8" strokeDasharray={`${ep} ${100 - ep}`} strokeDashoffset={100 - (cp + ip + tp)}></circle>}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold text-slate-400 mb-0.5">Total Supply</span>
              <span className="text-xl font-black text-slate-900 leading-tight tracking-tight">{formatTotal(totalRaw)}</span>
              <span className="text-[10px] font-bold text-slate-500 mt-0.5">{ticker}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-b border-slate-50 pb-2">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Community</div>
            <div className="flex gap-4"><span className="text-slate-900 w-8 text-right">{cp}%</span><span className="text-slate-400 w-16 text-right">{calcAbs(cp)}</span></div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-b border-slate-50 pb-2">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Investors</div>
            <div className="flex gap-4"><span className="text-slate-900 w-8 text-right">{ip}%</span><span className="text-slate-400 w-16 text-right">{calcAbs(ip)}</span></div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-b border-slate-50 pb-2">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Core Team</div>
            <div className="flex gap-4"><span className="text-slate-900 w-8 text-right">{tp}%</span><span className="text-slate-400 w-16 text-right">{calcAbs(tp)}</span></div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Ecosystem</div>
            <div className="flex gap-4"><span className="text-slate-900 w-8 text-right">{ep}%</span><span className="text-slate-400 w-16 text-right">{calcAbs(ep)}</span></div>
          </div>
        </div>
      </div>

      {/* METADATA GRID */}
      <div className="bg-white px-5 py-6 mb-2">
        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4">Token Details</h3>
        <div className="grid grid-cols-2 gap-y-5 gap-x-4">
          <div>
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Token Name</span>
            <span className="text-xs font-bold text-slate-900">{tokenName}</span>
          </div>
          <div>
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Token Symbol</span>
            <span className="text-xs font-black text-slate-900">{ticker}</span>
          </div>
          <div>
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Supply</span>
            <span className="text-xs font-black text-slate-900">{totalRaw > 0 ? totalRaw.toLocaleString() : 'TBA'}</span>
          </div>
          <div>
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TGE Date</span>
            <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded">{tgeDate}</span>
          </div>
        </div>
      </div>

      {/* VESTING SCHEDULE */}
      <div className="bg-white px-5 py-6 mb-2">
        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4">Vesting Schedule</h3>
        <div className="space-y-3">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Community & Airdrop
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-500">
              <div><span className="block text-[8px] font-bold text-slate-400 uppercase">Cliff</span>No Cliff</div>
              <div><span className="block text-[8px] font-bold text-slate-400 uppercase">Vesting</span>Full Unlock</div>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Investors & Backers
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-500">
              <div><span className="block text-[8px] font-bold text-slate-400 uppercase">Cliff</span>6 months</div>
              <div><span className="block text-[8px] font-bold text-slate-400 uppercase">Vesting</span>24 months Linear</div>
            </div>
          </div>
        </div>
        {tokenData.vesting_notes && (
          <p className="text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-100">{tokenData.vesting_notes}</p>
        )}
      </div>

      {/* ALLOCATION INSIGHTS */}
      <div className="bg-white px-5 py-6">
        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4">Allocation Insights</h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            </div>
            <span className="text-[11px] font-medium text-slate-600 pt-0.5">Community allocation is fair and aligned with long term network growth.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Activity className="w-3 h-3 text-blue-500" />
            </div>
            <span className="text-[11px] font-medium text-slate-600 pt-0.5">Investor share is relatively high. Monitor unlock schedule closely.</span>
          </li>
        </ul>
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-start gap-1.5 text-slate-400">
          <ShieldAlert className="w-3 h-3 shrink-0" />
          <span className="text-[8px] font-medium leading-relaxed">Data is for informational purposes only. Not financial advice.</span>
        </div>
      </div>

    </div>
  );
}