import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from './supabaseClient';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

export default function ProfilePerformance() {
  const { user } = usePrivy();
  const [loading, setLoading] = useState(true);
  
  // Analytics State
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [projectStats, setProjectStats] = useState([]);
  const [globalStats, setGlobalStats] = useState({ totalTasks: 0, completedTasks: 0, completionRate: 0 });

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    const privyId = user.id;

    try {
      // 1. Fetch Points and Streaks
      const [
        { data: pointsData },
        { data: streakData },
        { data: subs }
      ] = await Promise.all([
        supabase.from('user_points').select('total_points').eq('auth_id', privyId).maybeSingle(),
        supabase.from('user_checkins').select('streak_count').eq('auth_id', privyId).maybeSingle(),
        supabase.from('user_subscriptions').select('project_id').eq('auth_id', privyId)
      ]);

      if (pointsData) setPoints(pointsData.total_points || 0);
      if (streakData) setStreak(streakData.streak_count || 0);

      // 2. Fetch Tasks and Progress for Analytics
      if (subs && subs.length > 0) {
        const projectIds = subs.map(s => s.project_id);

        const [
          { data: projectsData },
          { data: allTasks },
          { data: progress }
        ] = await Promise.all([
          supabase.from('projects').select('id, name, logo_url').in('id', projectIds),
          supabase.from('tasks').select('*').in('project_id', projectIds),
          supabase.from('user_task_progress').select('task_id').eq('auth_id', privyId)
        ]);

        if (projectsData && allTasks) {
          let globalTotal = allTasks.length;
          let globalCompleted = 0;

          // Calculate stats per project for the Bar Chart
          const statsArray = projectsData.map(proj => {
            const pTasks = allTasks.filter(t => t.project_id === proj.id);
            const pCompleted = pTasks.filter(t => progress?.some(p => p.task_id === t.id)).length;
            
            globalCompleted += pCompleted;

            return {
              name: proj.name,
              logo: proj.logo_url,
              total: pTasks.length,
              completed: pCompleted,
              pending: pTasks.length - pCompleted,
              rate: pTasks.length > 0 ? Math.round((pCompleted / pTasks.length) * 100) : 0
            };
          });

          // Sort by highest completion rate
          statsArray.sort((a, b) => b.rate - a.rate);
          setProjectStats(statsArray);
          
          setGlobalStats({
            totalTasks: globalTotal,
            completedTasks: globalCompleted,
            completionRate: globalTotal > 0 ? Math.round((globalCompleted / globalTotal) * 100) : 0
          });
        }
      }
    } catch (error) {
      console.error("Performance Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recharts Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs font-bold border border-slate-700">
          <p className="mb-1 text-slate-300 uppercase tracking-widest">{label}</p>
          <p className="text-emerald-400">{`Completed: ${payload[0].value}`}</p>
          <p className="text-slate-400">{`Pending: ${payload[1].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return <div className="p-10 text-slate-400 font-medium animate-pulse">Loading Analytics Engine...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Farming Analytics</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Measure your platform consistency and task velocity.</p>
        </div>
      </div>

      {/* TOP STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-default">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Points</p>
           </div>
           <h4 className="text-3xl font-black text-slate-900">{points.toLocaleString()}</h4>
         </div>

         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-default">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
               <span className="text-lg">🔥</span>
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Streak</p>
           </div>
           <h4 className="text-3xl font-black text-slate-900">{streak} <span className="text-lg font-bold text-slate-400">Days</span></h4>
         </div>

         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-default">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Task Win Rate</p>
           </div>
           <div className="flex items-end gap-2">
             <h4 className="text-3xl font-black text-slate-900">{globalStats.completionRate}%</h4>
             {globalStats.completionRate > 70 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mb-1">Top Tier</span>}
           </div>
         </div>

         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-default">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Volume</p>
           </div>
           <h4 className="text-3xl font-black text-slate-900">
             {globalStats.completedTasks} <span className="text-sm font-bold text-slate-400">/ {globalStats.totalTasks}</span>
           </h4>
         </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Project Completion Velocity</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Track which ecosystems you are dominating.</p>
          </div>
          <div className="h-[280px] w-full">
            {projectStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400">No data available. Join projects to see metrics.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStats.slice(0, 7)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="completed" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={30}>
                    {projectStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                  <Bar dataKey="pending" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Detailed Progress List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Ecosystem Rankings</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Your highest converting targets.</p>
          </div>
          
          <div className="flex-1 space-y-5 overflow-y-auto pr-2">
            {projectStats.length === 0 ? (
               <div className="text-center text-sm font-medium text-slate-400 mt-10">No projects joined.</div>
            ) : (
              projectStats.map((proj, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2.5">
                      <img src={proj.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${proj.name}`} alt="" className="w-5 h-5 rounded-full shadow-sm border border-slate-200 bg-slate-50" />
                      <span className="text-sm font-bold text-slate-800">{proj.name}</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-500">{proj.rate}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out group-hover:bg-blue-600" 
                      style={{ width: `${proj.rate}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}