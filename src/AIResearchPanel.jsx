import React from 'react';
import { ShieldCheck, AlertTriangle, Target, Lightbulb, TrendingUp, Users, Wallet, Zap, ShieldAlert } from 'lucide-react';

export default function AIResearchPanel({ rawData }) {
  if (!rawData) return null;

  // Safely parse the JSON string if it hasn't been parsed yet
  let data;
  try {
    data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  } catch (e) {
    console.error("Failed to parse AI research data:", e);
    return <div className="p-4 text-sm text-red-500">Error loading research data.</div>;
  }

  // Destructure for easy access
  const { 
    project_overview, credibility_analysis, social_signal, 
    airdrop_signal, product_signal, opportunity_analysis, 
    risk_analysis, alpha_evaluation, final_verdict 
  } = data;

  // Helper for Confidence Score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      
      
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-black text-slate-900">AI Intelligence Report</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">Auto-Generated</span>
          </div>
          <p className="text-sm font-medium text-slate-500 max-w-2xl">{project_overview?.summary}</p>
        </div>
        
        <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Airdrop Probability</p>
            <p className="text-sm font-bold text-slate-700">{final_verdict?.airdrop_probability}</p>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getScoreColor(final_verdict?.confidence_score)}`}>
            <span className="text-lg font-black">{final_verdict?.confidence_score}</span>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50/50">
        
        
        <div className="lg:col-span-2 space-y-6">
          
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 mb-4">
              <Target className="text-blue-500" size={16}/> Action Plan & Strategy
            </h4>
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 mb-4">
              <p className="text-sm font-bold text-blue-900 leading-relaxed">{final_verdict?.strategy}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time Req.</span>
                <span className="text-xs font-bold text-slate-700">{opportunity_analysis?.time_required}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cost</span>
                <span className="text-xs font-bold text-slate-700">{opportunity_analysis?.cost}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Competition</span>
                <span className="text-xs font-bold text-slate-700">{opportunity_analysis?.competition_level}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Barrier</span>
                <span className="text-xs font-bold text-slate-700">{opportunity_analysis?.entry_barrier}</span>
              </div>
            </div>
          </div>

          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 mb-4">
              <Lightbulb className="text-amber-500" size={16}/> Why This is Alpha
            </h4>
            <ul className="space-y-2.5">
              {alpha_evaluation?.why_this_is_alpha?.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <TrendingUp className="text-emerald-500 shrink-0 mt-0.5" size={14}/>
                  <span className="text-sm text-slate-700 font-medium">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          
        </div>

        
        <div className="space-y-6">
          
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 mb-4">
              <ShieldCheck className="text-emerald-500" size={16}/> Backing & Team
            </h4>
            <div className="mb-4">
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Lead Investors</span>
              <div className="flex flex-wrap gap-1.5">
                {credibility_analysis?.funding?.investors?.map((inv, idx) => (
                  <span key={idx} className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-bold">
                    {inv}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Team Affiliations</span>
              <p className="text-xs text-slate-600 font-medium">{credibility_analysis?.team?.notable_affiliations?.join(', ')}</p>
            </div>
          </div>

          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-red-400">
            <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 mb-3">
              <AlertTriangle className="text-red-500" size={16}/> Risk Analysis
            </h4>
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Red Flags</span>
                <ul className="space-y-1">
                  {risk_analysis?.red_flags?.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                      <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={12}/> {flag}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Security</span>
                <p className="text-xs text-slate-600 font-medium">{risk_analysis?.security_concerns?.[0] || 'No specific data'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
