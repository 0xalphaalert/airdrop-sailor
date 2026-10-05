import React, { useEffect, useState, useMemo } from 'react';
import { scraperDb } from './scraperClient';
import { 
  Search, ExternalLink, Target, Flame, 
  Zap, LayoutGrid, Clock, CheckCircle2 
} from 'lucide-react';

export default function EarlyTasksPage() {
  const [tasksData, setTasksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTasksData();
  }, []);

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const { data, error } = await scraperDb
        .from('keyword_galxe_quests')
        .select('*')
        .eq('is_actionable', true)
        .order('ai_score', { ascending: false });

      if (error) throw error;
      setTasksData(data || []);
    } catch (error) {
      console.error('Error fetching tasks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasksData;
    
    const term = searchTerm.toLowerCase();
    return tasksData.filter(task => 
      task.project_name?.toLowerCase().includes(term) ||
      task.campaign_name?.toLowerCase().includes(term) ||
      task.platform?.toLowerCase().includes(term)
    );
  }, [tasksData, searchTerm]);

  const parseDescriptionToBullets = (description) => {
    if (!description) return [];
    
    // Split by common delimiters and clean up
    const bullets = description
      .split(/[•\n\r]/)
      .map(point => point.trim())
      .filter(point => point.length > 0)
      .slice(0, 3); // Limit to first 3 bullets
    
    return bullets;
  };

  const getWebVisibility = (webVisibility) => {
    const level = webVisibility || 'Low';
    const colors = {
      'High': 'bg-emerald-50 text-emerald-700',
      'Medium': 'bg-blue-50 text-blue-700',
      'Low': 'bg-slate-100 text-slate-700'
    };
    return { level, color: colors[level] || colors['Low'] };
  };

  const getProgressBarWidth = (aiScore) => {
    return `${Math.min(aiScore, 100)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans">
        <div className="max-w-[1200px] mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-4"></div>
            <div className="h-10 bg-slate-200 rounded w-full mb-6"></div>
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6">
                <div className="grid grid-cols-5 gap-4 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-slate-200 rounded"></div>
                  ))}
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b border-slate-100">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="h-4 bg-slate-200 rounded"></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans">
      <div className="max-w-[1200px] mx-auto">
        
        {/* --- HEADER --- */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Early Tasks</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                High-action quests with strong AI scores and web visibility
              </p>
            </div>
          </div>

          {/* --- SEARCH BAR --- */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* --- STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{filteredTasks.length}</p>
              <p className="text-xs text-slate-500">Actionable Quests</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Flame className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">High Score</p>
              <p className="text-xs text-slate-500">AI Optimized</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">Visible</p>
              <p className="text-xs text-slate-500">Web Ready</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">Quick</p>
              <p className="text-xs text-slate-500">Fast Complete</p>
            </div>
          </div>
        </div>

        {/* --- TASKS TABLE --- */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No tasks found</h3>
            <p className="text-sm text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No actionable quests available'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Campaign Details</th>
                    <th className="px-6 py-4">AI Score</th>
                    <th className="px-6 py-4">Web Visibility</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredTasks.map((task) => {
                    const bullets = parseDescriptionToBullets(task.description);
                    
                    return (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        
                        {/* Project */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border border-purple-200">
                              <Target className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{task.project_name}</div>
                              <div className="text-xs text-slate-500">{task.platform}</div>
                            </div>
                          </div>
                        </td>

                        {/* Campaign Details */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-slate-900 mb-1">{task.campaign_name}</div>
                            {bullets.length > 0 && (
                              <ul className="space-y-1">
                                {bullets.map((bullet, idx) => (
                                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                                    <span className="text-purple-500 mt-0.5">•</span>
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>

                        {/* AI Score */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-900">{task.ai_score || 0}</span>
                              <span className="text-xs text-slate-500">/100</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: getProgressBarWidth(task.ai_score) }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Web Visibility */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getWebVisibility(task.web_visibility).color}`}>
                            {getWebVisibility(task.web_visibility).level}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4">
                          <a 
                            href={task.quest_url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Campaign
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
