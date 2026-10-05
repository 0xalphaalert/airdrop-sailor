import React, { useState, useEffect } from 'react';
import { Search, Gift, Target, ExternalLink, Zap, ShieldAlert, Award, Clock } from 'lucide-react';
import { scraperDb } from '../scraperClient'; // Fetching from 2nd DB

export default function TokenGiveaways() {
  const [activePlatform, setActivePlatform] = useState('all');
  const [giveaways, setGiveaways] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const fetchGiveaways = async () => {
    setIsLoading(true);
    try {
      // Fetch from all 3 tables concurrently
      // For Galxe, we specifically filter for the keyword 'giveaway' (or similar matches) as you requested
      const [galxeRes, taskonRes, zealyRes] = await Promise.all([
        scraperDb.from('keyword_galxe_quests')
                 .select('*')
                 .ilike('matched_keyword', '%giveaway%')
                 .order('created_at', { ascending: false })
                 .limit(150),
        scraperDb.from('keyword_taskon_quests')
                 .select('*')
                 .order('created_at', { ascending: false })
                 .limit(150),
        scraperDb.from('keyword_zealy_quests')
                 .select('*')
                 .order('created_at', { ascending: false })
                 .limit(150)
      ]);

      const normalizedData = [];

      // 1. Process Galxe Giveaways
      if (galxeRes.data) {
        galxeRes.data.forEach(g => {
          normalizedData.push({
            id: `galxe-${g.id}`,
            platform: 'Galxe',
            project_name: g.project_name || g.matched_keyword,
            title: g.title,
            description: g.description,
            score: Number(g.ai_score || 0),
            end_date: g.end_date,
            link: g.campaign_id ? `https://app.galxe.com/quest/${g.campaign_id}` : '',
            reward: 'Reward Pool' // Galxe usually implies pool for giveaways
          });
        });
      }

      // 2. Process TaskOn Giveaways
      if (taskonRes.data) {
        taskonRes.data.forEach(t => {
          normalizedData.push({
            id: `taskon-${t.id}`,
            platform: 'TaskOn',
            project_name: t.project_name || t.matched_keyword,
            title: t.title,
            description: t.description,
            score: Number(t.ai_score || 0),
            end_date: t.end_time, // Note: TaskOn uses end_time in your schema
            link: t.campaign_id ? `https://taskon.xyz/campaign/detail/${t.campaign_id}` : '',
            reward: 'Campaign Prize'
          });
        });
      }

      // 3. Process Zealy Quests
      if (zealyRes.data) {
        zealyRes.data.forEach(z => {
          normalizedData.push({
            id: `zealy-${z.id}`,
            platform: 'Zealy',
            project_name: z.community_name || z.matched_keyword,
            title: z.title,
            description: z.description,
            score: Number(z.ai_score || 0),
            end_date: null, // Zealy schema doesn't have an explicit end date usually
            link: z.community_name && z.quest_id ? `https://zealy.io/cw/${z.community_name}/questboard/${z.quest_id}` : `https://zealy.io/cw/${z.community_name}`,
            reward: z.reward_type || 'XP / Tokens'
          });
        });
      }

      // Sort everything globally by highest AI Score first
      normalizedData.sort((a, b) => b.score - a.score);
      setGiveaways(normalizedData);

    } catch (error) {
      console.error("Error fetching giveaways:", error);
      alert("Failed to sync giveaway intelligence.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGiveaways = giveaways.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = activePlatform === 'all' || item.platform.toLowerCase() === activePlatform.toLowerCase();
    return matchesSearch && matchesPlatform;
  });

  const getPlatformStyling = (platform) => {
    if (platform === 'Galxe') return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' };
    if (platform === 'TaskOn') return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' };
    if (platform === 'Zealy') return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
    return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' };
  };

  // Metrics
  const galxeCount = giveaways.filter(g => g.platform === 'Galxe').length;
  const taskonCount = giveaways.filter(g => g.platform === 'TaskOn').length;
  const zealyCount = giveaways.filter(g => g.platform === 'Zealy').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER & METRICS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Token Giveaways</h1>
          <p className="text-sm text-slate-500 mt-1">Aggregated raffle & bounty data from Galxe, TaskOn, and Zealy.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-center min-w-[90px]">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Galxe</p>
            <p className="text-lg font-black text-slate-800">{galxeCount}</p>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-center min-w-[90px]">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">TaskOn</p>
            <p className="text-lg font-black text-slate-800">{taskonCount}</p>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-center min-w-[90px]">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Zealy</p>
            <p className="text-lg font-black text-slate-800">{zealyCount}</p>
          </div>
        </div>
      </div>

      {/* CONTROLS (TABS & SEARCH) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-1 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActivePlatform('all')} className={`flex shrink-0 items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activePlatform === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Gift size={16} /> All Platforms
          </button>
          <button onClick={() => setActivePlatform('galxe')} className={`flex shrink-0 items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activePlatform === 'galxe' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            Galxe
          </button>
          <button onClick={() => setActivePlatform('taskon')} className={`flex shrink-0 items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activePlatform === 'taskon' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            TaskOn
          </button>
          <button onClick={() => setActivePlatform('zealy')} className={`flex shrink-0 items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activePlatform === 'zealy' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            Zealy
          </button>
        </div>
        <div className="relative w-full sm:w-72 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search campaigns or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Zap className="animate-pulse mb-3 text-purple-500" size={32} />
            <p className="font-bold">Syncing Giveaway Data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4">Platform</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Campaign Title</th>
                  <th className="px-6 py-4">Reward Info</th>
                  <th className="px-6 py-4">AI Score</th>
                  <th className="px-6 py-4">Status / End Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGiveaways.length === 0 ? (
                  <tr><td colSpan="7" className="p-10 text-center text-slate-500 font-bold">No giveaways found for this filter.</td></tr>
                ) : (
                  filteredGiveaways.map(item => {
                    const styling = getPlatformStyling(item.platform);
                    const isEndingSoon = item.end_date && new Date(item.end_date) < new Date(Date.now() + 86400000 * 2); // Less than 2 days
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* Platform Badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${styling.bg} ${styling.border} ${styling.text}`}>
                            {item.platform}
                          </span>
                        </td>
                        
                        {/* Project Name */}
                        <td className="px-6 py-4">
                          <span className="font-black text-slate-900 text-sm whitespace-nowrap">{item.project_name || 'Unknown'}</span>
                        </td>
                        
                        {/* Title & Description */}
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{item.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{item.description || 'No description available'}</p>
                        </td>
                        
                        {/* Reward Type */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded w-fit">
                            <Award size={12} />
                            {item.reward}
                          </div>
                        </td>

                        {/* AI Score Bar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-200 rounded-full h-2 max-w-[60px]">
                              <div 
                                className={`h-2 rounded-full ${item.score >= 80 ? 'bg-purple-500' : item.score >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`} 
                                style={{ width: `${Math.min(100, Math.max(0, item.score || 0))}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-black text-slate-700">{item.score || 0}</span>
                          </div>
                        </td>
                        
                        {/* End Date */}
                        <td className="px-6 py-4">
                          {item.end_date ? (
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className={isEndingSoon ? 'text-red-500' : 'text-slate-400'} />
                              <span className={`text-xs font-bold ${isEndingSoon ? 'text-red-600' : 'text-slate-600'}`}>
                                {new Date(item.end_date).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">Ongoing</span>
                          )}
                        </td>
                        
                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {item.link ? (
                            <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-lg text-[11px] font-black uppercase transition-colors shadow-sm whitespace-nowrap">
                              Open <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold uppercase">No Link</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}