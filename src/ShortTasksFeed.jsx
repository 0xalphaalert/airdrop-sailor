import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink, Zap, AlertTriangle, Calendar, ShieldCheck, Trophy } from 'lucide-react';
import { supabase } from './supabaseClient'; 

export default function ShortTasksFeed() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- MOCK DATA WITH NEW REWARDS ARRAY ---
  const mockTasks = [
    {
      id: '39e146a5-0806-4424-a092-a08f3de3dfa9',
      task_name: 'Join Chainers Universe 🍟',
      task_description: 'Craft your reality in an immersive Web3 adventure. Complete daily social interactions.',
      logo_url: 'https://zealy-webapp-images-prod.s3.eu-west-1.amazonaws.com/public/b426959e-8f4a-484a-8a4e-9d49bc933c22-profile.png',
      banner_url: 'https://images.unsplash.com/photo-1614680376573-e3436ce90fbd?auto=format&fit=crop&w=800&q=80',
      platform_name: 'zealy.io',
      task_link: 'https://zealy.io/cw/chainersnft',
      join_date: '2026-03-06',
      end_date: '2026-04-30', 
      recurring: 'Daily',
      status: 'Active',
      // 🚀 NEW: Reward Tiers Array
      rewards: [
        { tier: '1st', prize: '$100' },
        { tier: '2nd-5th', prize: '$50' },
        { tier: '6th-10th', prize: '$10' },
        { tier: '11th-100th', prize: '$5' }
      ]
    },
    {
      id: 'alpha-task-002',
      task_name: 'Echobit Alpha Taskforce',
      task_description: 'Keyword hunt discovery and social amplification for the upcoming Echobit testnet.',
      logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Echobit',
      banner_url: null,
      platform_name: 'Galxe',
      task_link: '#',
      join_date: '2026-04-17',
      end_date: '2026-04-21',
      recurring: 'One-time',
      status: 'Active',
      // 🚀 NEW: Example of a smaller reward pool
      rewards: [
        { tier: 'Top 10', prize: '500 USDT' },
        { tier: 'Raffle', prize: '10 USDT' }
      ]
    }
  ];

  useEffect(() => {
    const fetchTasks = async () => {
      // Fetch all Active tasks from the database
      const { data, error } = await supabase
        .from('short_tasks')
        .select('*')
        .eq('status', 'Active');
        
      if (error) {
        console.error("Error fetching sprints:", error);
      } else {
        setTasks(data || []);
      }
      setIsLoading(false);
    };
    
    fetchTasks();
  }, []);

  const calculateUrgency = (startDate, endDate) => {
    if (!startDate || !endDate) return { isLate: false, daysLeft: 'Unknown' };
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const totalDuration = end - start;
    const timeElapsed = now - start;
    const timeLeft = end - now;
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    const isLate = (timeElapsed / totalDuration) > 0.75 || daysLeft <= 2;
    
    return { 
      isLate, 
      daysLeft: daysLeft > 0 ? `${daysLeft} Days Left` : 'Ending Today',
      isExpired: daysLeft < 0
    };
  };

  const handleJoinTask = async (task) => {
    window.open(task.task_link, '_blank');
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500 font-bold">Loading Sprints...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      
      {/* HEADER AREA - Expanded max-width */}
      <div className="max-w-[1400px] mx-auto mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Zap className="w-8 h-8 text-blue-600" /> ACTIVE SPRINTS
        </h1>
        <p className="text-slate-500 font-medium mt-2 max-w-2xl text-sm">
          Curated, high-priority tasks from Zealy and Galxe. Join sprints, complete objectives, and track your progress in your dashboard.
        </p>
      </div>

      {/* 🚀 COMPACT GRID: Changed to xl:grid-cols-4 and reduced gap to gap-5 */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {tasks.map((task) => {
          const urgency = calculateUrgency(task.join_date, task.end_date);
          if (urgency.isExpired) return null; 

          return (
            <div key={task.id} className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden flex flex-col group">
              
              {/* 1. BANNER - Reduced height from h-32 to h-24 */}
              <div className="h-24 w-full relative bg-slate-100 overflow-hidden shrink-0">
                {task.banner_url ? (
                  <img src={task.banner_url} alt="Poster" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-100 to-emerald-50"></div>
                )}
                {urgency.isLate && (
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm border border-rose-200 text-rose-600 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Competitive</span>
                  </div>
                )}
              </div>

              {/* 2. CONTENT AREA - Reduced padding from p-6 to p-5 */}
              <div className="px-5 pb-5 flex-1 flex flex-col relative">
                
                {/* LOGO - Reduced size to w-12 h-12 */}
                <div className="w-12 h-12 rounded-xl bg-white border-4 border-white shadow-md relative -mt-6 mb-3 overflow-hidden shrink-0">
                  <img src={task.logo_url} alt="Logo" className="w-full h-full object-cover" />
                </div>

                <div className="mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded text-left">
                    <ShieldCheck className="w-3 h-3" /> {task.platform_name}
                  </span>
                </div>

                {/* TITLE & DESC - Reduced text sizes and clamped description */}
                <h3 className="text-lg font-black text-slate-900 leading-tight mb-1.5 line-clamp-2">{task.task_name}</h3>
                <p className="text-xs font-medium text-slate-500 line-clamp-2 mb-4 flex-1">{task.task_description}</p>

                {/* 🚀 NEW: REWARD POOL TIERS */}
                {task.rewards && task.rewards.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Reward Pool</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {task.rewards.map((reward, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-amber-50 border border-amber-100/50 px-2 py-1 rounded-md">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">{reward.tier}</span>
                          <span className="text-[10px] font-black text-amber-600">{reward.prize}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* META DETAILS - Shrunk padding */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 shrink-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Deadline
                    </span>
                    <span className={`text-[10px] font-black uppercase ${urgency.isLate ? 'text-rose-600' : 'text-slate-700'}`}>
                      {urgency.daysLeft}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Frequency
                    </span>
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {task.recurring}
                    </span>
                  </div>
                </div>

                {/* BUTTON - Reduced height slightly */}
                <button 
                  onClick={() => handleJoinTask(task)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all flex items-center justify-center gap-2 text-sm"
                >
                  Join Sprint <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}