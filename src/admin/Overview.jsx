import React, { useState, useEffect } from 'react';
import { Activity, Database, Zap, ShieldAlert, TrendingUp, Clock, Twitter, MessageSquare, Target, Gift, DollarSign } from 'lucide-react';
import { supabase } from '../supabaseClient'; 
import { scraperDb } from '../scraperClient'; 
import { Link } from 'react-router-dom';

export default function Overview() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: 0,
    activeTasks: 0,
    totalIntel: 0,
    fundingEvents: 0
  });
  
  const [pipeline, setPipeline] = useState({
    tweets: 0,
    discord: 0,
    galxeGiveaways: 0,
    galxeEarly: 0,
    taskon: 0,
    zealy: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Core DB Counts
      const [
        { count: projectsCount }, 
        { count: tasksCount }, 
        { count: fundingCount },
        { data: recentProjects },
        { data: recentTasks }
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('funding_opportunities').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('id, name, created_at').order('created_at', { ascending: false }).limit(4),
        supabase.from('tasks').select('id, name, created_at').order('created_at', { ascending: false }).limit(4)
      ]);

      // 2. Fetch Scraper DB Counts (The Intelligence Pipeline)
      const [
        { count: tweetsCount },
        { count: discordCount },
        { count: taskonCount },
        { count: zealyCount },
        { data: galxeData }
      ] = await Promise.all([
        scraperDb.from('project_tweets').select('*', { count: 'exact', head: true }),
        scraperDb.from('project_discord_announcements').select('*', { count: 'exact', head: true }),
        scraperDb.from('keyword_taskon_quests').select('*', { count: 'exact', head: true }),
        scraperDb.from('keyword_zealy_quests').select('*', { count: 'exact', head: true }),
        scraperDb.from('keyword_galxe_quests').select('id, matched_keyword, title')
      ]);

      // Process Galxe split (Giveaways vs Early Quests)
      let galxeGiveaways = 0;
      let galxeEarly = 0;
      if (galxeData) {
        galxeData.forEach(q => {
          const isGiveaway = (q.matched_keyword || '').toLowerCase().includes('giveaway') || (q.title || '').toLowerCase().includes('giveaway');
          if (isGiveaway) galxeGiveaways++;
          else galxeEarly++;
        });
      }

      const totalIntel = (tweetsCount || 0) + (discordCount || 0) + (taskonCount || 0) + (zealyCount || 0) + (galxeData?.length || 0);

      setStats({
        projects: projectsCount || 0,
        activeTasks: tasksCount || 0,
        totalIntel: totalIntel,
        fundingEvents: fundingCount || 0
      });

      setPipeline({
        tweets: tweetsCount || 0,
        discord: discordCount || 0,
        galxeGiveaways,
        galxeEarly,
        taskon: taskonCount || 0,
        zealy: zealyCount || 0
      });

      // 3. Construct Recent Activity Timeline
      const combinedActivity = [
        ...(recentProjects || []).map(p => ({ id: `p-${p.id}`, action: 'New Project Added', project: p.name, time: p.created_at, type: 'success' })),
        ...(recentTasks || []).map(t => ({ id: `t-${t.id}`, action: 'Task Deployed', project: t.name, time: t.created_at, type: 'info' }))
      ];

      // Sort newest first, take top 6
      combinedActivity.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(combinedActivity.slice(0, 6));

    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Zap className="animate-pulse mb-3 text-blue-500" size={32} />
        <p className="font-bold">Aggregating Command Center Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Command Center</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time system health and intelligence backlog.</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
            <Database size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracked Projects</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.projects}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-50 text-red-500 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending AI Intel</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalIntel}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tasks</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.activeTasks}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600 shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Funding Records</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.fundingEvents}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Intelligence Pipeline Breakdown */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              Intelligence Pipeline Backlog
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            
            {/* Project Research Queue */}
            <Link to="/admin/projects" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-all">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Project Research</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Twitter size={14} className="text-sky-500"/><span className="text-sm font-medium text-slate-600">X / Tweets</span></div>
                  <span className="font-black text-sky-600 bg-sky-100 px-2 py-0.5 rounded-md text-xs">{pipeline.tweets}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><MessageSquare size={14} className="text-indigo-500"/><span className="text-sm font-medium text-slate-600">Discord</span></div>
                  <span className="font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md text-xs">{pipeline.discord}</span>
                </div>
              </div>
            </Link>

            {/* Token Giveaways Queue */}
            <Link to="/admin/giveaways" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-orange-300 rounded-xl p-4 transition-all">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Token Giveaways</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Target size={14} className="text-blue-500"/><span className="text-sm font-medium text-slate-600">Galxe (Giveaways)</span></div>
                  <span className="font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md text-xs">{pipeline.galxeGiveaways}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Gift size={14} className="text-emerald-500"/><span className="text-sm font-medium text-slate-600">TaskOn</span></div>
                  <span className="font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md text-xs">{pipeline.taskon}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Activity size={14} className="text-orange-500"/><span className="text-sm font-medium text-slate-600">Zealy</span></div>
                  <span className="font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md text-xs">{pipeline.zealy}</span>
                </div>
              </div>
            </Link>

            {/* Early Quests Queue */}
            <Link to="/admin/earlyquests" className="md:col-span-2 group bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-all flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Early Quests</h4>
                <p className="text-[11px] text-slate-500 font-medium">Non-giveaway, high-value Galxe campaigns.</p>
              </div>
              <span className="font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                <Target size={14}/> {pipeline.galxeEarly} Pending
              </span>
            </Link>

          </div>
        </div>

        {/* Recent Core Activity Feed */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              Core Activity
            </h3>
          </div>

          <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-1">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400 font-bold text-center mt-10">No recent activity found.</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4 relative">
                  {/* Timeline Line */}
                  <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-slate-100 last:hidden"></div>
                  
                  {/* Timeline Icon */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10 ${
                    activity.type === 'success' ? 'bg-emerald-500' : 
                    activity.type === 'info' ? 'bg-blue-500' : 'bg-orange-500'
                  }`}></div>
                  
                  {/* Content */}
                  <div>
                    <p className="text-[13px] font-black text-slate-900">
                      {activity.action}
                    </p>
                    <p className="text-[11px] font-bold text-blue-600 truncate max-w-[200px] mt-0.5">{activity.project}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{getTimeAgo(activity.time)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Link to="/admin/manage" className="mt-4 pt-4 border-t border-slate-100 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors w-full text-center block">
            Open Core DB &rarr;
          </Link>
        </div>

      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}