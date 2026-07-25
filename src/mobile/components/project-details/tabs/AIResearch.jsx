// src/mobile/components/project-details/tabs/AIResearch.jsx
import React from 'react';
import { BrainCircuit, Gavel, LayoutTemplate, ShieldCheck, Rocket, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AIResearch({ project }) {
  let aiData = null;
  try {
    aiData = typeof project?.ai_research_data === 'string' ? JSON.parse(project.ai_research_data) : project.ai_research_data;
  } catch (e) { }
  
  if (!aiData) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 px-5 pt-4">
        <div className="text-xs text-slate-500 font-bold p-8 text-center border border-dashed rounded-xl border-slate-300 bg-white">
          Analysis data unavailable.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 px-4 pt-4 space-y-4">
      
      {/* FINAL VERDICT CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
          <Gavel className="w-3.5 h-3.5" /> Final Verdict
        </h3>
        
        <div className="mb-4">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recommended Action</div>
          <div className="text-sm font-black text-slate-900 mb-3">{aiData.final_verdict?.recommended_action || 'N/A'}</div>
          
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Execution Strategy</div>
          <div className="text-xs text-slate-600 font-medium leading-relaxed">{aiData.final_verdict?.strategy || 'N/A'}</div>
        </div>
        
        <div className="flex gap-4 pt-4 border-t border-slate-50">
          <div className="flex-1">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Confidence</span>
              <span className="text-sm font-black text-indigo-600 leading-none">{aiData.final_verdict?.confidence_score || 0}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${aiData.final_verdict?.confidence_score || 0}%` }}></div>
            </div>
          </div>
          <div className="flex-1 pl-4 border-l border-slate-100">
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Probability</div>
            <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded text-[9px] font-bold">
              {aiData.final_verdict?.airdrop_probability || 'Medium'}
            </span>
          </div>
        </div>
      </div>

      {/* PROJECT OVERVIEW CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
          <LayoutTemplate className="w-3.5 h-3.5" /> Project Overview
        </h3>
        <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
          {aiData.project_overview?.summary || 'No summary provided.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {aiData.project_overview?.category && <span className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded text-[9px] font-bold">{aiData.project_overview.category}</span>}
          {aiData.project_overview?.stage && <span className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded text-[9px] font-bold">{aiData.project_overview.stage}</span>}
        </div>
      </div>

      {/* CREDIBILITY ANALYSIS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" /> Credibility Analysis
        </h3>
        <div className="space-y-3">
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Funding & Backers</span>
            <span className="text-xs font-semibold text-slate-800">{aiData.credibility_analysis?.funding?.amount || 'Undisclosed'}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Backing Signals</span>
            <ul className="space-y-1.5">
              {aiData.credibility_analysis?.backing_signals?.map((sig, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {sig}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* OPPORTUNITY ANALYSIS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
          <Rocket className="w-3.5 h-3.5" /> Opportunity Analysis
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Cost</span>
            <span className="text-xs font-bold text-slate-800">{aiData.opportunity_analysis?.cost || 'N/A'}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time Required</span>
            <span className="text-xs font-bold text-slate-800">{aiData.opportunity_analysis?.time_required || 'N/A'}</span>
          </div>
        </div>
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Competition Level</span>
          <span className="text-xs font-medium text-slate-600">{aiData.opportunity_analysis?.competition_level || 'N/A'}</span>
        </div>
      </div>

      {/* RISK ANALYSIS CARD (Red themed) */}
      <div className="bg-rose-50/50 rounded-2xl border border-rose-100 shadow-sm p-5">
        <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
          <AlertTriangle className="w-3.5 h-3.5" /> Risk Analysis
        </h3>
        <div className="space-y-3">
          <div>
            <span className="block text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1.5">Red Flags</span>
            <ul className="space-y-1.5">
              {aiData.risk_analysis?.red_flags?.length > 0 ? (
                aiData.risk_analysis.red_flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-rose-700 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" /> {flag}
                  </li>
                ))
              ) : (
                <li className="text-[11px] text-rose-700 font-medium">None detected.</li>
              )}
            </ul>
          </div>
          <div>
            <span className="block text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Downside</span>
            <p className="text-[11px] text-rose-700/80 font-medium leading-relaxed">{aiData.risk_analysis?.downside || 'N/A'}</p>
          </div>
        </div>
      </div>

    </div>
  );
}