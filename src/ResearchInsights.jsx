import React from 'react';

const ResearchInsights = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-center text-slate-500 text-sm">
          No structured research available
        </div>
      </div>
    );
  }

  const getBadgeColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
      case 'strong':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'medium':
      case 'moderate':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'low':
      case 'weak':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getProbabilityBadge = (probability) => {
    const prob = probability?.toLowerCase();
    if (prob === 'high' || prob === 'very high') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (prob === 'medium' || prob === 'moderate') {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (prob === 'low') {
      return 'bg-slate-100 text-slate-800 border-slate-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-6">
      
      {/* 🧠 Overview */}
      {data.project_overview && (
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            🧠 Project Overview
          </h3>
          <div className="space-y-3">
            {data.project_overview.summary && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Summary</h4>
                <p className="text-sm text-slate-600">{data.project_overview.summary}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {data.project_overview.stage && (
                <span className={`text-xs font-bold px-2 py-1 rounded border ${getBadgeColor(data.project_overview.stage)}`}>
                  {data.project_overview.stage}
                </span>
              )}
              {data.project_overview.category && (
                <span className="text-xs font-bold px-2 py-1 rounded bg-purple-50 text-purple-700 border-purple-200">
                  {data.project_overview.category}
                </span>
              )}
              {data.project_overview.sector && (
                <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-700 border-indigo-200">
                  {data.project_overview.sector}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 💰 Credibility */}
      {data.credibility_analysis && (
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            💰 Credibility Analysis
          </h3>
          <div className="space-y-3">
            {data.credibility_analysis.funding && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Funding</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-slate-900">{data.credibility_analysis.funding.amount}</span>
                  {data.credibility_analysis.funding.tier && (
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${getBadgeColor(data.credibility_analysis.funding.tier)}`}>
                      {data.credibility_analysis.funding.tier}
                    </span>
                  )}
                </div>
                {data.credibility_analysis.funding.investor_quality && (
                  <p className="text-sm text-slate-600">{data.credibility_analysis.funding.investor_quality}</p>
                )}
              </div>
            )}
            {data.credibility_analysis.backing_signals && data.credibility_analysis.backing_signals.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Backing Signals</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {data.credibility_analysis.backing_signals.map((signal, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌐 Social Signals */}
      {data.social_signal && (
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            🌐 Social Signals
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {data.social_signal.twitter && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1">Twitter</h4>
                  <div className="space-y-1">
                    {data.social_signal.twitter.followers > 0 && (
                      <p className="text-sm text-slate-600">{data.social_signal.twitter.followers.toLocaleString()} followers</p>
                    )}
                    {data.social_signal.twitter.growth && (
                      <p className="text-sm text-slate-600">Growth: {data.social_signal.twitter.growth}</p>
                    )}
                    {data.social_signal.twitter.engagement && (
                      <p className="text-sm text-slate-600">Engagement: {data.social_signal.twitter.engagement}</p>
                    )}
                  </div>
                </div>
              )}
              {data.social_signal.discord && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1">Discord</h4>
                  <div className="space-y-1">
                    {data.social_signal.discord.members > 0 && (
                      <p className="text-sm text-slate-600">{data.social_signal.discord.members.toLocaleString()} members</p>
                    )}
                    {data.social_signal.discord.activity && (
                      <p className="text-sm text-slate-600">Activity: {data.social_signal.discord.activity}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {data.social_signal.hype_level && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Hype Level</h4>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${getBadgeColor(data.social_signal.hype_level)}`}>
                  {data.social_signal.hype_level}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎯 Airdrop Signals */}
      {data.airdrop_signal && (
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            🎯 Airdrop Signals
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700">Status:</span>
              <span className={`text-xs font-bold px-2 py-1 rounded border ${
                data.airdrop_signal.airdrop_announced 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {data.airdrop_signal.airdrop_announced ? 'Announced' : 'Speculative'}
              </span>
            </div>
            {data.airdrop_signal.type && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Type</h4>
                <p className="text-sm text-slate-600">{data.airdrop_signal.type}</p>
              </div>
            )}
            {data.airdrop_signal.token_status && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Token Status</h4>
                <p className="text-sm text-slate-600">{data.airdrop_signal.token_status}</p>
              </div>
            )}
            {data.airdrop_signal.evidence && data.airdrop_signal.evidence.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Evidence</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {data.airdrop_signal.evidence.map((evidence, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {evidence}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ⚙️ Product Signals */}
      {data.product_signal && (
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            ⚙️ Product Signals
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">Points System:</span>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${
                  data.product_signal.has_points_system 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {data.product_signal.has_points_system ? 'Available' : 'None'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">Leaderboard:</span>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${
                  data.product_signal.has_leaderboard 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {data.product_signal.has_leaderboard ? 'Available' : 'None'}
                </span>
              </div>
            </div>
            {data.product_signal.user_tracking && data.product_signal.user_tracking.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">User Tracking</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {data.product_signal.user_tracking.map((tracking, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      {tracking}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.product_signal.onchain_dependency && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Onchain Dependency</h4>
                <p className="text-sm text-slate-600">{data.product_signal.onchain_dependency}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🚀 Opportunity */}
      {data.opportunity_analysis && (
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            🚀 Opportunity Analysis
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {data.opportunity_analysis.early_access !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">Early Access:</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${
                    data.opportunity_analysis.early_access 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {data.opportunity_analysis.early_access ? 'Available' : 'Closed'}
                  </span>
                </div>
              )}
              {data.opportunity_analysis.competition_level && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">Competition:</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${getBadgeColor(data.opportunity_analysis.competition_level)}`}>
                    {data.opportunity_analysis.competition_level}
                  </span>
                </div>
              )}
            </div>
            {data.opportunity_analysis.cost && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Cost</h4>
                <p className="text-sm text-slate-600">{data.opportunity_analysis.cost}</p>
              </div>
            )}
            {data.opportunity_analysis.time_required && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Time Required</h4>
                <p className="text-sm text-slate-600">{data.opportunity_analysis.time_required}</p>
              </div>
            )}
            {data.opportunity_analysis.effort_type && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Effort Type</h4>
                <p className="text-sm text-slate-600">{data.opportunity_analysis.effort_type}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ⚠️ Risks */}
      {data.risk_analysis && (
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            ⚠️ Risk Analysis
          </h3>
          <div className="space-y-3">
            {data.risk_analysis.red_flags && data.risk_analysis.red_flags.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Red Flags</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {data.risk_analysis.red_flags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">⚠</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.risk_analysis.downside && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Downside</h4>
                <p className="text-sm text-slate-600">{data.risk_analysis.downside}</p>
              </div>
            )}
            {data.risk_analysis.security_concerns && data.risk_analysis.security_concerns.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Security Concerns</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {data.risk_analysis.security_concerns.map((concern, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">🔒</span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔥 Final Verdict */}
      {data.final_verdict && (
        <div className="border-2 border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white">
          <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            🔥 Final Verdict
          </h3>
          <div className="space-y-3">
            {data.final_verdict.airdrop_probability && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">Airdrop Probability:</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full border ${getProbabilityBadge(data.final_verdict.airdrop_probability)}`}>
                  {data.final_verdict.airdrop_probability}
                </span>
              </div>
            )}
            {data.final_verdict.confidence_score > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700">Confidence Score:</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" 
                      style={{ width: `${Math.min(data.final_verdict.confidence_score, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{data.final_verdict.confidence_score}%</span>
                </div>
              </div>
            )}
            {data.final_verdict.recommended_action && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Recommended Action</h4>
                <p className="text-sm text-slate-600 font-medium">{data.final_verdict.recommended_action}</p>
              </div>
            )}
            {data.final_verdict.strategy && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Strategy</h4>
                <p className="text-sm text-slate-600">{data.final_verdict.strategy}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ResearchInsights;
