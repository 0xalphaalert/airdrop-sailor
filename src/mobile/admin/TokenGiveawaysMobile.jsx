import React, { useState, useEffect } from 'react';
import { Search, Gift, ExternalLink, Zap, Award, Clock } from 'lucide-react';
import { scraperDb } from '../../scraperClient'; 

export default function TokenGiveawaysMobile() {
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

      if (galxeRes.data) {
        galxeRes.data.forEach(g => {
          normalizedData.push({
            id: `galxe-${g.id}`, platform: 'Galxe', project_name: g.project_name || g.matched_keyword,
            title: g.title, description: g.description, score: Number(g.ai_score || 0),
            end_date: g.end_date, link: g.campaign_id ? `https://app.galxe.com/quest/${g.campaign_id}` : '', reward: 'Reward Pool'
          });
        });
      }

      if (taskonRes.data) {
        taskonRes.data.forEach(t => {
          normalizedData.push({
            id: `taskon-${t.id}`, platform: 'TaskOn', project_name: t.project_name || t.matched_keyword,
            title: t.title, description: t.description, score: Number(t.ai_score || 0),
            end_date: t.end_time, link: t.campaign_id ? `https://taskon.xyz/campaign/detail/${t.campaign_id}` : '', reward: 'Campaign Prize'
          });
        });
      }

      if (zealyRes.data) {
        zealyRes.data.forEach(z => {
          normalizedData.push({
            id: `zealy-${z.id}`, platform: 'Zealy', project_name: z.community_name || z.matched_keyword,
            title: z.title, description: z.description, score: Number(z.ai_score || 0),
            end_date: null, link: z.community_name && z.quest_id ? `https://zealy.io/cw/${z.community_name}/questboard/${z.quest_id}` : `https://zealy.io/cw/${z.community_name}`, reward: z.reward_type || 'XP / Tokens'
          });
        });
      }

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
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans pb-safe">
      
      {/* STICKY HEADER & CONTROLS */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Gift className="text-purple-500 w-5 h-5" /> Token Giveaways
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Aggregated raffles & bounties</p>
        </div>

        {/* Platform Tabs */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setActivePlatform('all')} className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePlatform === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All Platforms
          </button>
          <button onClick={() => setActivePlatform('galxe')} className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePlatform === 'galxe' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Galxe
          </button>
          <button onClick={() => setActivePlatform('taskon')} className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePlatform === 'taskon' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            TaskOn
          </button>
          <button onClick={() => setActivePlatform('zealy')} className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePlatform === 'zealy' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Zealy
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        
        {/* COMPACT METRICS GRID */}
        {!isLoading && (
          <div className="grid grid-cols-3 gap-3 mb-2">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm text-center">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Galxe</p>
              <p className="text-lg font-black text-slate-800 leading-tight mt-0.5">{galxeCount}</p>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm text-center">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">TaskOn</p>
              <p className="text-lg font-black text-slate-800 leading-tight mt-0.5">{taskonCount}</p>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm text-center">
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Zealy</p>
              <p className="text-lg font-black text-slate-800 leading-tight mt-0.5">{zealyCount}</p>
            </div>
          </div>
        )}

        {/* DATA LIST (CARDS) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Zap className="animate-pulse mb-3 text-purple-500 w-8 h-8" />
            <span className="text-sm font-bold">Syncing Giveaways...</span>
          </div>
        ) : filteredGiveaways.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm text-slate-400 font-bold text-sm">
            No giveaways found for this filter.
          </div>
        ) : (
          filteredGiveaways.map(item => {
            const styling = getPlatformStyling(item.platform);
            const isEndingSoon = item.end_date && new Date(item.end_date) < new Date(Date.now() + 86400000 * 2);
            
            return (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                
                {/* Header: Platform & Project Name */}
                <div className="flex justify-between items-start gap-2">
                  <span className="font-black text-slate-900 text-sm truncate">{item.project_name || 'Unknown'}</span>
                  <span className={`inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${styling.bg} ${styling.border} ${styling.text}`}>
                    {item.platform}
                  </span>
                </div>
                
                {/* Title & Description */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                    {item.description || 'No description available.'}
                  </p>
                </div>
                
                {/* Metrics Row: Reward, Score, Date */}
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="col-span-1 flex flex-col justify-center items-start bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reward</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <Award size={10} /> {item.reward}
                    </div>
                  </div>
                  
                  <div className="col-span-1 flex flex-col justify-center items-start bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">AI Score</span>
                    <div className="flex items-center gap-1.5 w-full">
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${item.score >= 80 ? 'bg-purple-500' : item.score >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`} 
                          style={{ width: `${Math.min(100, Math.max(0, item.score || 0))}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-700">{item.score || 0}</span>
                    </div>
                  </div>

                  <div className="col-span-1 flex flex-col justify-center items-start bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Deadline</span>
                    {item.end_date ? (
                      <div className="flex items-center gap-1">
                        <Clock size={10} className={isEndingSoon ? 'text-rose-500' : 'text-slate-400'} />
                        <span className={`text-[10px] font-bold truncate ${isEndingSoon ? 'text-rose-600' : 'text-slate-600'}`}>
                          {new Date(item.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Ongoing</span>
                    )}
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="pt-2">
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-1.5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-[0.98] shadow-md">
                      Open Campaign <ExternalLink size={14} />
                    </a>
                  ) : (
                    <button disabled className="w-full flex items-center justify-center gap-1.5 py-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider cursor-not-allowed">
                      No Link Available
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}