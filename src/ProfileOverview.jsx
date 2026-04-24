import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { calculateSybilScore } from './sybilEngine';
import LockedAnalytics from './LockedAnalytics';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function ProfileOverview() {
  const { user, linkWallet } = usePrivy();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [checkinData, setCheckinData] = useState({ streak: 0 });
  const [myProjects, setMyProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [sybilData, setSybilData] = useState(null);
  
  const [dashData, setDashData] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    dailyTasksPending: 0,
    totalCost: 0
  });

  useEffect(() => {
    if (user) {
      fetchOverviewData();
    }
  }, [user]);

  const fetchOverviewData = async () => {
    setLoading(true);
    const privyId = user.id;

    try {
      // 1. Fetch Sybil Data
      const activeWallet = user?.wallet?.address;
      if (activeWallet) {
        calculateSybilScore(activeWallet).then(data => setSybilData(data));
      } else {
        setSybilData({ score: 0, riskLevel: 'LOCKED', transactionCount: 0 });
      }

      // 2. Fetch Streak
      const { data: streakData } = await supabase.from('user_checkins').select('streak_count').eq('auth_id', privyId).maybeSingle();
      if (streakData) setCheckinData({ streak: streakData.streak_count || 0 });

      // 3. Fetch Projects and Tasks for Stats
      const { data: subs } = await supabase.from('user_subscriptions').select('project_id').eq('auth_id', privyId);
      
      let pCount = 0; let tCount = 0; let cCount = 0; let dailyPending = 0; let costSpent = 0;
      let enrichedProjects = []; let enrichedTasks = [];

      if (subs && subs.length > 0) {
        pCount = subs.length;
        const projectIds = subs.map(s => s.project_id);

        const { data: projectsData } = await supabase.from('projects').select('*').in('id', projectIds);
        const { data: allTasks } = await supabase.from('tasks').select('*').in('project_id', projectIds);
        const { data: progress } = await supabase.from('user_task_progress').select('*').eq('auth_id', privyId);
        
        if (allTasks && projectsData) {
          tCount = allTasks.length;
          
          enrichedTasks = allTasks.map(task => {
            const taskProgress = progress?.find(p => p.task_id === task.id);
            const isDoneEver = !!taskProgress;
            
            let isDoneToday = false;
            if (isDoneEver && taskProgress.completed_at) {
              const completedDate = new Date(taskProgress.completed_at);
              const today = new Date();
              isDoneToday = completedDate.toDateString() === today.toDateString();
            }

            const isCompletedForUI = task.recurring === 'Daily' ? isDoneToday : isDoneEver;
            const parentProject = projectsData.find(p => p.id === task.project_id);
            
            if (isDoneEver) {
              cCount++; 
              if (task.cost && !isNaN(parseFloat(task.cost))) costSpent += parseFloat(task.cost);
            }
            
            if (!isCompletedForUI && task.status === 'Active') {
              dailyPending++; 
            }
            
            return {
              ...task,
              isCompleted: isCompletedForUI,
              project_name: parentProject?.name || 'Unknown',
            };
          });
        }

        if (projectsData) {
          enrichedProjects = projectsData;
        }
      }

      setMyProjects(enrichedProjects);
      setMyTasks(enrichedTasks);
      setDashData({ totalProjects: pCount, totalTasks: tCount, completedTasks: cCount, dailyTasksPending: dailyPending, totalCost: costSpent });

    } catch (error) {
      console.error("Overview Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentlyCompleted) => {
    const privyId = user.id;
    try {
      if (currentlyCompleted) {
        await supabase.from('user_task_progress').delete().match({ auth_id: privyId, task_id: taskId });
      } else {
        await supabase.from('user_task_progress').upsert({ 
          auth_id: privyId, 
          task_id: taskId,
          completed_at: new Date().toISOString()
        }, { onConflict: 'auth_id,task_id' });
      }
      fetchOverviewData(); // Refresh the stats
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const dailyPendingTasks = myTasks.filter(t => !t.isCompleted && t.status === 'Active');
  
  // Charts Data
  const activityData = [
    { name: 'Mon', tasks: 2 }, { name: 'Tue', tasks: 4 }, { name: 'Wed', tasks: 3 },
    { name: 'Thu', tasks: 7 }, { name: 'Fri', tasks: 5 }, { name: 'Sat', tasks: 8 }, 
    { name: 'Sun', tasks: dashData.completedTasks || 6 }
  ];

  const donutData = [
    { name: 'High Signal', value: 12 },
    { name: 'Medium Signal', value: 5 },
    { name: 'Low Signal', value: 2 },
  ];
  const COLORS = ['#3B82F6', '#8B5CF6', '#94A3B8'];

  if (loading) {
    return <div className="p-10 text-slate-400 font-medium animate-pulse">Loading Overview...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      
      {/* 1. HERO HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
              🔥 {checkinData.streak} Day Streak
            </span>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
              +12% Activity
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.email?.address?.split('@')[0] || 'Sailor'} 👋
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            You have <strong className="text-slate-800">{dashData.dailyTasksPending} tasks pending</strong> today. Let's secure those allocations.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/subscription" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all">
            Redeem Points
          </Link>
          <button onClick={() => navigate('/profile/daily-tasks')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 hover:shadow-blue-600/20 hover:-translate-y-0.5 transition-all">
            Start Farming
          </button>
        </div>
      </div>
      
      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 group-hover:bg-blue-100 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">↑ 2 New</span>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Projects Joined</p>
          <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight">{dashData.totalProjects}</h4>
        </div>

        {/* Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Active</span>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
          <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight">{dashData.totalTasks}</h4>
        </div>

        {/* Pending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 group-hover:bg-amber-100 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Pending</p>
          <h4 className="text-3xl font-black text-amber-500 leading-none tracking-tight">{dashData.dailyTasksPending}</h4>
        </div>

        {/* Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Est. Gas</span>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Cost Spent</p>
          <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight">${dashData.totalCost.toFixed(2)}</h4>
        </div>
      </div>

      {/* 3. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Activity Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Farming Activity (7D)</h3>
            <p className="text-xs font-medium text-slate-500">Tasks completed per day</p>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} />
                <Tooltip cursor={{ stroke: '#E2E8F0', strokeWidth: 2 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="tasks" stroke="#3B82F6" strokeWidth={4} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Airdrop Potential */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Portfolio Potential</h3>
          </div>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <PieChart>
                <Pie data={donutData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 leading-none">{dashData.totalProjects}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Projects</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ACTIONABLE LISTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Trending Component */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.5-7 3 3 3 6 3 9s1 2 2 2h-4c1 0 1-1 1-1z" /></svg>
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Trending Opportunities</h3>
            </div>
            <Link to="/" className="text-[11px] font-bold text-blue-600 hover:text-blue-700">View All &rarr;</Link>
          </div>
          <div className="space-y-2 flex-1">
            {['Monad', 'Eclipse', 'Movement'].map((name) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-blue-600">
                    {name.charAt(0)}
                  </div>
                  <span className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">{name}</span>
                </div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">High Signal</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Farming Component */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Daily Farming Progress</h3>
            </div>
            <span className="text-xl font-black text-slate-300">{dashData.totalTasks > 0 ? Math.round((dashData.completedTasks / dashData.totalTasks) * 100) : 0}%</span>
          </div>
          
          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-5 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${dashData.totalTasks > 0 ? Math.round((dashData.completedTasks / dashData.totalTasks) * 100) : 0}%` }}
            />
          </div>

          <div className="space-y-2 flex-1">
            {dailyPendingTasks.slice(0, 3).length > 0 ? dailyPendingTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleTask(task.id, false)} className="w-5 h-5 rounded border-2 border-slate-300 bg-white group-hover:border-emerald-500 transition-colors" />
                  <div>
                    <span className="block text-sm font-semibold text-slate-800">{task.name}</span>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.project_name}</span>
                  </div>
                </div>
                <button onClick={() => navigate('/profile/daily-tasks')} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-600 rounded-lg shadow-sm hover:text-emerald-600 hover:border-emerald-200 transition-all">
                  Farm
                </button>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-6">
                 <span className="text-2xl mb-2">✨</span>
                 <p className="text-sm font-bold text-slate-700">All caught up!</p>
                 <p className="text-xs text-slate-400 mt-1">Check back tomorrow for more tasks.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. SYBIL ENGINE BLOCK */}
      <LockedAnalytics hasWallet={!!user?.wallet} onConnectWallet={linkWallet}>
        <div className="bg-slate-900 p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between relative overflow-hidden mt-6">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 mb-6 md:mb-0">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">On-Chain Intelligence</h3>
            <h2 className="text-2xl font-bold text-white mb-2">Sybil Risk Analysis</h2>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider ${sybilData?.riskLevel === 'Safe' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {sybilData?.riskLevel || 'Scanning...'}
              </span>
              <p className="text-sm font-medium text-slate-400">Based on recent transaction behavior.</p>
            </div>
          </div>
          
          <div className="relative z-10 text-right">
            <p className={`text-6xl font-black leading-none tracking-tighter ${sybilData?.score >= 80 ? 'text-emerald-400' : sybilData?.score >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
              {sybilData?.score || 0}
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">/ 100 Engine Score</p>
          </div>
        </div>
      </LockedAnalytics>
      
    </div>
  );
}