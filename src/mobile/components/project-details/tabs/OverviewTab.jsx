// src/mobile/components/project-details/tabs/OverviewTab.jsx
import React from 'react';
import { 
  Layout, ShieldCheck, BrainCircuit, ExternalLink, Twitter, ChevronRight,
  BarChart2, ListChecks, Clock, Target, Users, DollarSign, Zap, TrendingUp 
} from 'lucide-react';

export default function OverviewTab({ project }) {
  let aiData = {};
  
  try { aiData = typeof project?.ai_research_data === 'string' ? JSON.parse(project.ai_research_data || '{}') : (project?.ai_research_data || {}); } catch(e) {}

  // SCORING LOGIC
  const totalScore = parseInt(project?.score_total) || 0;
  const socialScore = parseInt(project?.score_social) || 0;
  const fundingScore = parseInt(project?.score_funding) || 0;
  const airdropScore = parseInt(project?.score_airdrop) || 0;
  const fundamentalScore = parseInt(project?.score_fundamental) || 0;

  const scoreThemes = {
    social: { iconBg: 'bg-blue-50', iconColor: 'text-blue-500', barColor: 'bg-blue-500', barBg: 'bg-slate-100' },
    funding: { iconBg: 'bg-rose-50', iconColor: 'text-rose-500', barColor: 'bg-rose-500', barBg: 'bg-slate-100' },
    airdrop: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', barColor: 'bg-emerald-500', barBg: 'bg-slate-100' },
    fundamental: { iconBg: 'bg-amber-50', iconColor: 'text-amber-500', barColor: 'bg-amber-500', barBg: 'bg-slate-100' }
  };

  const getRatingLabel = (score) => {
    const s = parseInt(score) || 0;
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Moderate';
    if (s >= 20) return 'Weak';
    return 'Very Weak';
  };

  const getTableStatus = (score) => {
    const s = parseInt(score) || 0;
    if (s === 0) return { label: 'No Public Data', dot: 'bg-slate-300' };
    if (s >= 80) return { label: 'Exceptional', dot: 'bg-emerald-500' };
    if (s >= 60) return { label: 'Positive Signals', dot: 'bg-emerald-500' };
    if (s >= 40) return { label: 'Average', dot: 'bg-amber-500' };
    if (s >= 20) return { label: 'Needs Growth', dot: 'bg-orange-500' };
    return { label: 'Very Weak', dot: 'bg-rose-500' };
  };

  const ratingColors = {
    'Excellent': 'text-emerald-700 bg-emerald-100',
    'Good': 'text-emerald-600 bg-emerald-50',
    'Moderate': 'text-amber-600 bg-amber-50',
    'Weak': 'text-orange-600 bg-orange-50',
    'Very Weak': 'text-rose-700 bg-rose-100'
  };

  const ScoreCard = ({ title, subtitle, score, icon: Icon, themeName }) => {
    const theme = scoreThemes[themeName];
    const rating = getRatingLabel(score);
    return (
      <div className="bg-white border border-[#E7ECF4] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.02)] flex flex-col h-full">
        <div className="flex items-start gap-2.5 mb-5">
           <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${theme.iconBg}${theme.iconColor}`}>
             <Icon className="w-4 h-4" />
           </div>
           <div>
             <h3 className="text-[12px] font-black text-slate-900 leading-tight">{title}</h3>
           </div>
        </div>
        <div className="mt-auto">
           <div className="flex items-end justify-between mb-2">
             <div className="flex items-baseline gap-1">
               <span className={`text-xl font-black ${theme.iconColor}`}>{score}</span>
               <span className="text-[10px] font-bold text-slate-400">/ 100</span>
             </div>
           </div>
           <div className={`w-full h-1.5 rounded-full overflow-hidden mb-2 ${theme.barBg}`}>
             <div className={`h-full rounded-full ${theme.barColor}`} style={{ width: `${score}%` }}></div>
           </div>
           <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wide ${ratingColors[rating]}`}>
             {rating}
           </span>
        </div>
      </div>
    );
  };

  const BreakdownRow = ({ theme, icon: Icon, title, subtitle, score, metrics }) => {
    const themeStyles = scoreThemes[theme];
    const rating = getRatingLabel(score);
    const status = getTableStatus(score);
    return (
      <tr className="border-b border-[#EEF2F7] h-[65px]">
        <td className="px-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${themeStyles.iconBg}${themeStyles.iconColor}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 leading-tight text-[11px]">{title}</span>
              <span className="text-[9px] text-slate-500 font-medium">{subtitle}</span>
            </div>
          </div>
        </td>
        <td className="px-3">
          <span className={`font-bold text-[11px] ${themeStyles.iconColor}`}>{score} <span className="text-slate-400 font-medium text-[9px]">/ 100</span></span>
        </td>
        <td className="px-3">
          <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wide ${ratingColors[rating]}`}>{rating}</span>
        </td>
        <td className="px-3 text-[10px] font-bold text-slate-500">25%</td>
        <td className="px-3 py-2">
          <ul className="text-[9px] font-medium text-slate-500 space-y-0.5 whitespace-nowrap">
            {metrics.map((m, i) => (
              <li key={i}><span className="text-slate-400">•</span> {m.label}: <span className="text-slate-700 font-bold">{m.value}</span></li>
            ))}
          </ul>
        </td>
        <td className="px-3">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></div>
            <span className="text-[10px] font-bold text-slate-700">{status.label}</span>
          </div>
        </td>
      </tr>
    );
  };

  const formatFunding = (amt) => {
    if (!amt) return 'TBA';
    const amountStr = amt.toString();
    return amountStr.startsWith('$') ? amountStr : `$${amountStr}`;
  };

  const formatFollowers = (num) => {
    if (num == null) return 'TBA';
    const n = Number(num);
    if (isNaN(n)) return num; 
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* SECTION 1: THE THESIS */}
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[11px] font-black text-slate-900 tracking-widest flex items-center gap-1.5 uppercase">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div> The Thesis
          </h2>
          <div className="flex gap-1.5">
             <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold tracking-wide">{project?.tier || 'Tier 3'}</span>
             <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-bold tracking-wide">{project?.status || 'Point Farming'}</span>
          </div>
        </div>
        
        <p className="text-slate-700 font-medium text-[13px] leading-relaxed mb-5">
          {aiData.bio || project?.description || 'Institutional-Grade multi-strategy yield & infrastructure in one portal.'}
        </p>
        
        <div className="flex flex-wrap gap-2">
           <span className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600"><Layout className="w-3 h-3 text-emerald-500" /> Multi-Strategy Yield</span>
           <span className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Institutional Grade</span>
           <span className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600"><BrainCircuit className="w-3 h-3 text-blue-500" /> Unified Infrastructure</span>
        </div>
      </div>

      {/* SECTION 2: PROJECT INTELLIGENCE SCORE */}
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Scoring Analysis</span>
        </div>
        <h2 className="text-[20px] font-black text-[#0F172A] tracking-tight leading-tight mb-6">Project Intelligence Score</h2>

        {/* Donut & Meta */}
        <div className="flex items-center gap-6 mb-8">
           <div className="flex flex-col items-center">
             <div className="relative w-[100px] h-[100px] flex items-center justify-center shrink-0">
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                 <circle cx="80" cy="80" r="66" fill="none" stroke="#E8EEF7" strokeWidth="14" />
                 <circle 
                   cx="80" cy="80" r="66" fill="none" stroke="#2563EB" 
                   strokeWidth="14" strokeDasharray={2 * Math.PI * 66} strokeDashoffset={(2 * Math.PI * 66) * (1 - totalScore / 100)} 
                   strokeLinecap="round" className="transition-all duration-1000 ease-out" 
                 />
               </svg>
               <div className="absolute flex flex-col items-center justify-center mt-1">
                 <span className="text-[26px] font-black text-slate-900 leading-none tracking-tight">{totalScore}</span>
                 <span className="text-[11px] font-bold text-slate-400 leading-none mt-1">/ 100</span>
               </div>
             </div>
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-3 mb-1.5">Overall Score</span>
             <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200/50 rounded-full text-[9px] font-bold">
               <TrendingUp className="w-2.5 h-2.5" /> {project?.tier || 'Composite Score'}
             </span>
           </div>

           <div className="flex-1 w-full space-y-3">
             <div className="flex justify-between items-center border-b border-slate-100 pb-2">
               <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><BarChart2 className="w-3 h-3 text-slate-400"/> Category</span>
               <span className="text-[10px] font-black text-slate-900 truncate max-w-[80px] text-right">{project?.category || 'General'}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-100 pb-2">
               <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><ListChecks className="w-3 h-3 text-slate-400"/> Tasks</span>
               <span className="text-[10px] font-black text-slate-900">{project?.task_count || 0}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-100 pb-2">
               <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><Clock className="w-3 h-3 text-slate-400"/> Time</span>
               <span className="text-[10px] font-black text-slate-900">{project?.total_time_estimate || 0} min</span>
             </div>
           </div>
        </div>

        {/* 2x2 Score Grid */}
        <div className="grid grid-cols-2 gap-3">
          <ScoreCard title="Social" subtitle="Community" score={socialScore} icon={Users} themeName="social" />
          <ScoreCard title="Funding" subtitle="Capital" score={fundingScore} icon={DollarSign} themeName="funding" />
          <ScoreCard title="Airdrop" subtitle="Incentives" score={airdropScore} icon={Zap} themeName="airdrop" />
          <ScoreCard title="Fundamentals" subtitle="Quality" score={fundamentalScore} icon={ShieldCheck} themeName="fundamental" />
        </div>
      </div>

      {/* SECTION 3: DETAILED SCORING BREAKDOWN */}
      <div className="bg-white py-6 mb-2">
        <div className="px-5 mb-4">
          <h2 className="text-[15px] font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Detailed Breakdown
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Exact scores and key metrics used for analysis</p>
        </div>

        <div className="overflow-x-auto px-5 custom-scrollbar pb-2">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/80 border-y border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-3 py-2 rounded-l-lg">Dimension</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Rating</th>
                <th className="px-3 py-2">Weight</th>
                <th className="px-3 py-2">Key Metrics</th>
                <th className="px-3 py-2 rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              <BreakdownRow theme="social" icon={Users} title="Social" subtitle="Community" score={socialScore} metrics={[{ label: 'X Followers', value: formatFollowers(project?.twitter_followers) }]} />
              <BreakdownRow theme="funding" icon={DollarSign} title="Funding" subtitle="Backing" score={fundingScore} metrics={[{ label: 'Total Raised', value: formatFunding(project?.funding) }]} />
              <BreakdownRow theme="airdrop" icon={Zap} title="Airdrop" subtitle="Potential" score={airdropScore} metrics={[{ label: 'Status', value: project?.airdrop_status || '—' }]} />
              <BreakdownRow theme="fundamental" icon={ShieldCheck} title="Fundamentals" subtitle="Quality" score={fundamentalScore} metrics={[{ label: 'Ecosystem', value: project?.tier || '—' }]} />
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: ABOUT */}
      <div className="bg-white px-5 py-6">
        <h2 className="text-[11px] font-black text-slate-900 tracking-widest uppercase mb-3">About {project?.name}</h2>
        <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
          {project?.description || 'This project is building infrastructure for the next generation of decentralized applications, aiming to deliver unmatched security and scalability.'}
        </p>
      </div>
    </div>
  );
}