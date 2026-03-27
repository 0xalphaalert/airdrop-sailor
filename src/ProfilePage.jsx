import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { calculateSybilScore } from './sybilEngine';
import ReactMarkdown from 'react-markdown';
import LockedAnalytics from './LockedAnalytics';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function ProfilePage() {
  const { ready, authenticated, user, login, logout, linkWallet } = usePrivy();
  
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  
  const [profileStats, setProfileStats] = useState(null);
  const [sybilData, setSybilData] = useState(null);
  const [myProjects, setMyProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  
  // --- NEW: POINTS & SUBSCRIPTION STATE ---
  const [points, setPoints] = useState(0);
  const [checkinData, setCheckinData] = useState({ streak: 0 });
  const [selectedPerfProject, setSelectedPerfProject] = useState('All'); // 🚀 PASTED HERE
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [txHistory, setTxHistory] = useState([]); // 🚀 MOVED HERE
  
  const [dashData, setDashData] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    dailyTasksPending: 0,
    totalCost: 0
  });

  // AVATAR LOGIC
  const generateAvatar = (address) => {
    if (!address) return 'hsl(0, 0%, 80%)';
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  };

  const walletAddress = user?.wallet?.address || "";
  const avatarBg = generateAvatar(walletAddress);

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchMasterDashboardData();
    } else if (ready && !authenticated) {
      setLoading(false);
    }
  }, [ready, authenticated, user]);

  const fetchMasterDashboardData = async () => {
    setLoading(true);
    const privyId = user.id; // THE NEW GOLDEN THREAD

    try {
      // 1. SYNC LOGIC: Check if user exists, if not, create them!
      const { data: existingProfile } = await supabase.from('user_profiles').select('*').eq('auth_id', privyId).maybeSingle();
      
      if (!existingProfile) {
        await supabase.from('user_profiles').insert({
          auth_id: privyId,
          email: user.email?.address || null,
          wallet_address: user.wallet?.address || null,
          points: 0,
          subscription_tier: 'Free',
          project_limit: 5
        });
      }

      // Fetch official profile
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('auth_id', privyId).single();
      if (profile) setProfileStats(profile);

      // 🚀 THE FIX: Always use Privy's live user object as the source of truth!
      const activeWallet = user?.wallet?.address;
      
      if (activeWallet) {
        // 1. Calculate the score using the live wallet
        calculateSybilScore(activeWallet).then(data => setSybilData(data));
        
        // 2. Auto-heal the database silently in the background!
        if (!profile?.wallet_address) {
          supabase.from('user_profiles').update({ wallet_address: activeWallet }).eq('auth_id', privyId).then();
        }
      } else {
        setSybilData({ score: 0, riskLevel: 'LOCKED', transactionCount: 0 });
      }

      // FETCH POINTS & STREAK (Using auth_id)
      const { data: pointsData } = await supabase.from('user_points').select('total_points').eq('auth_id', privyId).maybeSingle();
      if (pointsData) setPoints(pointsData.total_points || 0);

      const { data: streakData } = await supabase.from('user_checkins').select('*').eq('auth_id', privyId).maybeSingle();
      if (streakData) setCheckinData({ streak: streakData.streak_count || 0 });

      // FETCH PROJECTS AND TASKS (Using auth_id)
      const { data: subs } = await supabase.from('user_subscriptions').select('project_id').eq('auth_id', privyId);
      
      let pCount = 0; let tCount = 0; let cCount = 0; let dailyPending = 0; let costSpent = 0;
      let enrichedProjects = []; let enrichedTasks = [];

      if (subs && subs.length > 0) {
        pCount = subs.length;
        const projectIds = subs.map(s => s.project_id);

        const { data: projectsData } = await supabase.from('projects').select('*').in('id', projectIds);
        const { data: allTasks } = await supabase.from('tasks').select('*').in('project_id', projectIds);
        const { data: progress } = await supabase.from('user_task_progress').select('*').eq('auth_id', privyId); // Changed to auth_id
        
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
              project_logo: parentProject?.logo_url || ''
            };
          });

          enrichedTasks.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
            if (a.status !== b.status) return a.status === 'Active' ? -1 : 1;
            return 0;
          });
        }

        if (projectsData) {
          enrichedProjects = projectsData.map(proj => {
            const projTasks = allTasks?.filter(t => t.project_id === proj.id) || [];
            const completedProjTasks = projTasks.filter(t => progress?.some(p => p.task_id === t.id));
            return {
              ...proj,
              totalTasks: projTasks.length,
              completedTasks: completedProjTasks.length,
              progressPercent: projTasks.length > 0 ? Math.round((completedProjTasks.length / projTasks.length) * 100) : 0
            };
          });
        }
      }

      setMyProjects(enrichedProjects);
      setMyTasks(enrichedTasks);
      setDashData({ totalProjects: pCount, totalTasks: tCount, completedTasks: cCount, dailyTasksPending: dailyPending, totalCost: costSpent });

    } catch (error) {
      console.error("Dashboard Master Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (projectId, projectName) => {
    const isConfirmed = window.confirm(`Are you sure you want to stop tracking ${projectName}?`);
    if (!isConfirmed) return;
    const privyId = user.id;
    try {
      await supabase.from('user_subscriptions').delete().match({ auth_id: privyId, project_id: projectId });
      fetchMasterDashboardData();
    } catch (error) {
      console.error("Error removing project:", error);
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
        }, { onConflict: 'auth_id,task_id' }); // Uses new unique constraint
      }
      fetchMasterDashboardData();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  // --- NEW: DAILY CHECK-IN LOGIC ---
  const handleDailyCheckin = async () => {
    const privyId = user.id;
    const { data: lastCheckin } = await supabase.from('user_checkins').select('*').eq('auth_id', privyId).maybeSingle();

    const now = new Date();
    let newStreak = 1;

    if (lastCheckin && lastCheckin.last_checkin_at) {
      const lastDate = new Date(lastCheckin.last_checkin_at);
      const diffHours = (now - lastDate) / (1000 * 60 * 60);

      if (diffHours < 24) return alert("You already checked in today! Come back tomorrow.");
      
      if (diffHours >= 24 && diffHours < 48) {
        newStreak = lastCheckin.streak_count >= 7 ? 7 : lastCheckin.streak_count + 1;
      }
    }

    // 🚀 THE MATH FIX: Fetch exact points and multiply streak by 10
    const { data: currentPointsData } = await supabase.from('user_points').select('total_points').eq('auth_id', privyId).maybeSingle();
    const currentDbPoints = currentPointsData?.total_points || 0;
    
    const pointsEarned = newStreak * 10; // Day 1 = 10, Day 2 = 20, etc.
    const updatedPoints = currentDbPoints + pointsEarned;

    // Save the new Streak
    await supabase.from('user_checkins').upsert({
      auth_id: privyId,
      streak_count: newStreak,
      last_checkin_at: now.toISOString()
    }, { onConflict: 'auth_id' });

    // Save the new Points
    await supabase.from('user_points').upsert({
      auth_id: privyId,
      total_points: updatedPoints,
      updated_at: now.toISOString()
    }, { onConflict: 'auth_id' });
    
    fetchMasterDashboardData();
    alert(`Checked in! You earned ${pointsEarned} points. Keep up the streak!`);
  };

  const toggleExpand = (taskId) => setExpandedTaskId(expandedTaskId === taskId ? null : taskId);

  const getDaysLeft = (endDate) => {
    if (!endDate) return '-';
    const end = new Date(endDate);
    const today = new Date();
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends Today';
    return `${diffDays}d left`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatAddress = (address) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown';

  const radius = 80;
  const pathLength = Math.PI * radius;
  const performancePercent = dashData.totalTasks > 0 ? Math.round((dashData.completedTasks / dashData.totalTasks) * 100) : 0;
  const dashOffset = pathLength - (performancePercent / 100) * pathLength;

  if (!ready || loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-400">Booting Terminal...</div>;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-xl border border-slate-200 text-center max-w-md w-full shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-500 mb-6">Please sign in to view your profile and analytics.</p>
          <button 
            onClick={login}
            className="bg-slate-900 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const icons = {
    overview: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    projects: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    'all-tasks': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    'daily-tasks': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    performance: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  };

  const NavItem = ({ id, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg font-medium text-sm transition-colors ${activeTab === id ? 'bg-slate-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
      style={{ width: 'calc(100% - 16px)' }}
    >
      {icons[id]} {label}
    </button>
  );

  const dailyPendingTasks = myTasks.filter(t => !t.isCompleted && t.status === 'Active');
  // 🚀 PASTE THIS EXACTLY HERE (STEP 2)
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
  // 🚀 END OF STEP 2 PASTE
  // --- NEW: PERFORMANCE UI STATE & MOCK DATA ---
  


  // --- DYNAMIC PERFORMANCE CALCULATIONS ---
  const isAllPerfSelected = selectedPerfProject === 'All';
  const activePerfProject = isAllPerfSelected ? null : myProjects.find(p => p.id === selectedPerfProject);
  
  // 1. Filter tasks for the selected project
  const perfTasks = isAllPerfSelected ? myTasks : myTasks.filter(t => t.project_id === selectedPerfProject);
  const perfDailyTasks = perfTasks.filter(t => t.recurring === 'Daily');
  
  // 2. Calculate general completion
  const perfTotal = perfTasks.length;
  const perfCompleted = perfTasks.filter(t => t.isCompleted).length;
  const perfProgress = perfTotal > 0 ? Math.round((perfCompleted / perfTotal) * 100) : 0;
  
  // 3. Calculate Daily specific completion %
  const perfDailyTotal = perfDailyTasks.length;
  const perfDailyCompleted = perfDailyTasks.filter(t => t.isCompleted).length;
  const perfDailyProgress = perfDailyTotal > 0 ? Math.round((perfDailyCompleted / perfDailyTotal) * 100) : (perfTotal > 0 ? 100 : 0);

  // 4. Calculate Winning Probability 
  // (Formula: Base progress + a slight boost if they do daily tasks consistently. 
  // Later, you will add the actual on-chain RPC Tx count to this formula!)
  const winningProbability = Math.min(99, Math.round((perfProgress * 0.7) + (perfDailyProgress * 0.3)));
  // --- 🚀 THE LIVE ON-CHAIN ENGINE ---
  const handleForceRefresh = async () => {
    if (isAllPerfSelected || !activePerfProject) {
      return alert("Please select a specific project from the dropdown to scan.");
    }

    const wallet = user?.wallet?.address;
    if (!wallet) return alert("No Web3 wallet connected to scan!");

    // 1. Filter tasks that have an RPC and Contract Address
    const onChainTasks = perfTasks.filter(t => t.rpc_url && t.contract_address);
    
    if (onChainTasks.length === 0) {
      return alert(`No on-chain tracking configured for ${activePerfProject.name} yet. Check back later!`);
    }

    setIsSyncing(true);
    let liveResults = [];

    try {
      // 2. Loop through every task that has an RPC URL
      for (const task of onChainTasks) {
        try {
          // Make a real JSON-RPC call to the network node!
          // (We are fetching the user's transaction count as a basic proof-of-connection)
          const response = await fetch(task.rpc_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_getTransactionCount", 
              params: [wallet, "latest"],
              id: 1
            })
          });

          const data = await response.json();
          
          if (data.result) {
             // Successfully connected to the chain! 
             // Convert the hex result to a normal number
             const txCount = parseInt(data.result, 16);
             
             liveResults.push({
               hash: `${task.contract_address.slice(0, 6)}...${task.contract_address.slice(-4)}`,
               protocol: activePerfProject.name,
               type: task.name,
               date: 'Just now',
               status: txCount > 0 ? 'Verified On-Chain' : 'No Txs Found',
               pts: txCount > 0 ? '+100' : '0'
             });
          }
        } catch (err) {
          console.error(`Failed to ping ${task.rpc_url}`, err);
          liveResults.push({
               hash: 'RPC Error',
               protocol: activePerfProject.name,
               type: task.name,
               date: '-',
               status: 'Failed to Connect',
               pts: '0'
          });
        }
      }

      // 3. Update the UI with the real data!
      setTxHistory(liveResults);
      setLastSyncTime(new Date().toISOString());
      alert(`✅ On-Chain Sync Complete! Found data across ${onChainTasks.length} endpoints.`);

    } catch (error) {
      console.error("Master Sync failed:", error);
      alert("Critical failure connecting to the blockchain.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col md:flex-row font-sans antialiased text-slate-900">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-[260px] bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen shadow-[1px_0_2px_0_rgba(0,0,0,0.02)]">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-sm">AS</div>
          <span className="font-bold text-sm tracking-tight text-slate-900">Command Center</span>
        </div>

        <div className="py-4 flex flex-col gap-1 flex-1">
          <NavItem id="overview" label="Overview" />
          <NavItem id="projects" label="Projects" />
          <NavItem id="all-tasks" label="All Tasks" />
          <NavItem id="daily-tasks" label="Daily Tasks" />
          <NavItem id="performance" label="On-Chain Performance" />
        </div>

        {/* --- NEW: SUBSCRIPTION & POINTS SIDEBAR UI --- */}
        <div className="p-4 border-t border-slate-200 space-y-4">
          
          {/* DAILY CHECK-IN BUTTON */}
          <button 
            onClick={handleDailyCheckin}
            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors border border-emerald-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Daily Check-in
          </button>

          {/* POINTS & LIMITS DISPLAY */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-500 uppercase">Your Progress</p>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {dashData.totalProjects}/5 Projects
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-sm font-bold text-slate-900">{points} PTS</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Streak: {checkinData.streak}d</span>
            </div>
            
            {/* Project Capacity Progress Bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3 mb-1">
              <div 
                className={`h-full transition-all ${dashData.totalProjects >= 5 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                style={{ width: `${Math.min((dashData.totalProjects / 5) * 100, 100)}%` }}
              />
            </div>
            {dashData.totalProjects >= 5 && (
              <p className="text-[10px] text-amber-600 font-bold leading-tight">
                Limit reached. Upgrade or use points to unlock.
              </p>
            )}
          </div>

          {/* UPGRADE BUTTON */}
          <Link 
            to="/subscription" 
            className="block w-full py-2 bg-slate-900 hover:bg-blue-600 text-white text-center text-[11px] font-black rounded-lg transition-all shadow-sm uppercase"
          >
            {profileStats?.subscription_tier === 'Lifetime' ? 'Manage Plan' : 'Upgrade Plan'}
          </Link>

          {/* PROFILE WALLET */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
               <div style={{ backgroundColor: avatarBg }} className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
               <div className="overflow-hidden">
                 <p className="text-sm font-semibold text-slate-900 leading-tight">{formatAddress(user?.wallet?.address)}</p>
                 <p className="text-[10px] font-medium text-slate-500 uppercase">{profileStats?.subscription_tier || 'Free Tier'}</p>
               </div>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors" title="Disconnect">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        <div className="max-w-5xl mx-auto mb-10 flex justify-center">
          <div className="relative w-full max-w-[500px] group">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search airdrops, projects, tasks..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-sm"
            />
          </div>
        </div>

        {/* OVERVIEW TAB - PREMIUM BENTO UI */}
        {activeTab === 'overview' && (
           <div className="max-w-6xl mx-auto space-y-6">
             
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
                 <button onClick={() => setActiveTab('daily-tasks')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 hover:shadow-blue-600/20 hover:-translate-y-0.5 transition-all">
                   Start Farming
                 </button>
               </div>
             </div>
             
             {/* 2. STATS ROW (Micro-interactions & Trends) */}
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

             {/* 3. CHARTS ROW (Data Story) */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
               
               {/* Activity Timeline */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                 <div className="mb-4">
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Farming Activity (7D)</h3>
                   <p className="text-xs font-medium text-slate-500">Tasks completed per day</p>
                 </div>
                 <div className="h-[200px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
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
                   <ResponsiveContainer width="100%" height="100%">
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
                     <span className="text-2xl font-black text-slate-900 leading-none">{myProjects.length}</span>
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
                 
                 {/* Progress Bar */}
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
                       <button onClick={() => setActiveTab('daily-tasks')} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-600 rounded-lg shadow-sm hover:text-emerald-600 hover:border-emerald-200 transition-all">
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
                 {/* Decorative background element */}
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
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Tracked Projects</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
              {myProjects.length === 0 ? (
                <div className="p-16 text-center">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Projects Found</h3>
                  <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">Explore Radar &rarr;</Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider h-14">
                        <th className="px-6">Project</th>
                        <th className="px-4">Tier</th>
                        <th className="px-4">Progress</th>
                        <th className="px-4">Est. Cost</th>
                        <th className="px-4 text-center">Tasks</th>
                        <th className="px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myProjects.map((proj) => (
                        <tr key={proj.id} className="h-14 hover:bg-slate-50/80 transition-colors">
                          <td className="px-6">
                            <Link to={`/project/${proj.id}`} className="flex items-center gap-3 w-fit group">
                              <img src={proj.logo_url} className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-sm bg-white" alt="" />
                              <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{proj.name}</span>
                            </Link>
                          </td>
                          <td className="px-4">
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                              {proj.tier || 'TBA'}
                            </span>
                          </td>
                          <td className="px-4">
                            <div className="flex flex-col gap-1.5 w-28">
                              <span className="text-xs font-medium text-slate-500">{proj.completedTasks} / {proj.totalTasks} Done</span>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${proj.progressPercent}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 text-sm font-medium text-slate-700">{proj.total_cost_estimate || 'Free'}</td>
                          <td className="px-4 text-center">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold text-xs border border-slate-200">
                              {proj.totalTasks}
                            </span>
                          </td>
                          <td className="px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <Link to={`/project/${proj.id}`} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-sm">View</Link>
                              <button onClick={() => handleUnsubscribe(proj.id, proj.name)} className="px-3 py-1.5 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors shadow-sm">Remove</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ALL TASKS TAB */}
        {activeTab === 'all-tasks' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Master Task Archive</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
              {myTasks.length === 0 ? (
                <div className="p-16 text-center">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Tasks Found</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider h-14">
                        <th className="px-6">Project</th>
                        <th className="px-4">Task</th>
                        <th className="px-4 text-center">Schedule</th>
                        <th className="px-4 text-center">Remaining</th>
                        <th className="px-4 text-center">Status</th>
                        <th className="px-4 text-center">Link</th>
                        <th className="px-6 text-right">Done</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myTasks.map((task) => (
                        <tr key={task.id} className={`h-14 transition-colors ${task.isCompleted ? 'bg-slate-50/50' : 'hover:bg-slate-50/80'}`}>
                          <td className="px-6">
                            <div className="flex items-center gap-3">
                              <img src={task.project_logo} className="w-6 h-6 rounded-full border border-slate-200 object-cover bg-white shadow-sm" alt="" />
                              <span className={`font-semibold text-sm ${task.isCompleted ? 'text-slate-400' : 'text-slate-900'}`}>{task.project_name}</span>
                            </div>
                          </td>
                          <td className="px-4">
                            <span className={`font-medium text-sm ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.name}</span>
                          </td>
                          <td className="px-4 text-center">
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">{task.recurring || 'One-Time'}</span>
                          </td>
                          <td className="px-4 text-center">
                            <span className={`text-xs font-medium ${getDaysLeft(task.end_date) === 'Ended' ? 'text-rose-500' : 'text-slate-500'}`}>{getDaysLeft(task.end_date)}</span>
                          </td>
                          <td className="px-4 text-center">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${task.status === 'Ended' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{task.status || 'Active'}</span>
                          </td>
                          <td className="px-4 text-center">
                            {task.link ? (
                              <a href={task.link} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors inline-flex justify-center w-full">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                              </a>
                            ) : '-'}
                          </td>
                          <td className="px-6 text-right">
                             <button 
                                onClick={() => handleToggleTask(task.id, task.isCompleted)}
                                disabled={task.status === 'Ended' && !task.isCompleted}
                                className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ml-auto ${task.isCompleted ? 'bg-blue-600 border-blue-600 text-white' : task.status === 'Ended' ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-50' : 'bg-white border-slate-300 hover:border-blue-400 shadow-sm'}`}
                             >
                               {task.isCompleted && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DAILY TASKS TAB */}
        {activeTab === 'daily-tasks' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Action List</h2>
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">{dailyPendingTasks.length} Pending</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
              {dailyPendingTasks.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">All Caught Up!</h3>
                  <p className="text-sm text-slate-500 font-medium">You have completed your daily check-ins.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider h-14">
                        <th className="px-6 w-16 text-center">Done</th>
                        <th className="px-6">Project</th>
                        <th className="px-6">Task Name</th>
                        <th className="px-4 text-center">Cost/Gas</th>
                        <th className="px-6 text-right">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyPendingTasks.map((task) => (
                        <React.Fragment key={task.id}>
                          <tr 
                            className={`h-16 transition-colors cursor-pointer hover:bg-slate-50 ${expandedTaskId === task.id ? 'bg-slate-50' : ''}`}
                            onClick={() => toggleExpand(task.id)}
                          >
                            <td className="px-6 text-center" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleToggleTask(task.id, task.isCompleted)}
                                className="w-6 h-6 rounded-md flex items-center justify-center border bg-white border-slate-300 hover:border-blue-500 transition-all mx-auto shadow-sm"
                              ></button>
                            </td>
                            
                            <td className="px-6">
                              <div className="flex items-center gap-3">
                                <img src={task.project_logo} className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-sm bg-white" alt="" />
                                <span className="font-semibold text-sm text-slate-900">{task.project_name}</span>
                              </div>
                            </td>
                            
                            <td className="px-6">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-700">{task.name}</span>
                                {task.recurring === 'Daily' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
                              </div>
                            </td>
                            
                            <td className="px-4 text-center">
                              <span className="text-sm font-medium text-slate-500">{task.cost > 0 ? `$${task.cost}` : 'Free'}</span>
                            </td>
                            
                            <td className="px-6 text-right flex justify-end items-center gap-4 h-16">
                              {task.link && (
                                <a 
                                  href={task.link} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                                >
                                  Go to Quest
                                </a>
                              )}
                              <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </td>
                          </tr>

                          {/* Expanded Tutorial Row */}
                          {expandedTaskId === task.id && (
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                              <td colSpan="5" className="p-0">
                                <div className="p-6 px-10 animate-in fade-in slide-in-from-top-2 duration-200 border-l-2 border-blue-500">
                                  <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                                    <div className="flex-1 w-full whitespace-normal">
                                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tutorial / Notes</p>
                                      <div className="prose prose-sm prose-blue max-w-none text-slate-600 font-medium leading-relaxed">
                                        <ReactMarkdown>{task.tutorial_markdown || task.description || "No specific instructions provided. Click the quest link to proceed."}</ReactMarkdown>
                                      </div>
                                    </div>
                                    <div className="w-full md:w-64 shrink-0 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-slate-500">Created</span>
                                        <span className="text-xs font-semibold text-slate-900">{formatDate(task.created_at)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-slate-500">Deadline</span>
                                        <span className="text-xs font-semibold text-slate-900">{formatDate(task.end_date)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-slate-500">Schedule</span>
                                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{task.recurring || 'One-Time'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ON-CHAIN PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header & Project Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">On-Chain Performance</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Track your smart contract interactions and estimated airdrop allocations.</p>
              </div>
              
              <div className="relative group">
                <select 
                  value={selectedPerfProject}
                  onChange={(e) => setSelectedPerfProject(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-800 font-bold text-sm rounded-xl pl-5 pr-10 py-2.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm cursor-pointer transition-all w-full md:w-auto min-w-[200px]"
                >
                  <option value="All">All Tracked Projects</option>
                  {myProjects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Top Stats Row (Dynamic) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Tasks</p>
                 <div className="flex items-end gap-2">
                   <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight">{perfTotal}</h4>
                 </div>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                 <div className="flex items-end gap-2">
                   <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight">{perfCompleted}</h4>
                   <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md mb-1">{perfProgress}% Done</span>
                 </div>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Task %</p>
                 <div className="flex items-end gap-2">
                   <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight">{perfDailyProgress}%</h4>
                   {perfDailyProgress === 100 && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md mb-1">Max</span>}
                 </div>
               </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">On-Chain Engine</p>
                 {isSyncing ? (
                   <h4 className="text-lg font-black text-blue-500 leading-tight mt-1 animate-pulse">Scanning RPCs...</h4>
                 ) : lastSyncTime ? (
                   <h4 className="text-lg font-black text-emerald-500 leading-tight mt-1">Synced Today</h4>
                 ) : (
                   <h4 className="text-lg font-black text-slate-400 leading-tight mt-1">Pending Sync</h4>
                 )}
               </div>
            </div>

            {/* Middle Row: Score Breakdown & Contract Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              
              {/* Dynamic Score Card */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 z-10">
                  {isAllPerfSelected ? 'Total Portfolio Probability' : `${activePerfProject?.name} Winning Rate`}
                </h3>
                
                {/* Dynamic Circular Progress */}
                <div className="relative w-40 h-40 flex items-center justify-center z-10 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke={winningProbability > 70 ? '#10B981' : winningProbability > 40 ? '#3b82f6' : '#F59E0B'} strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * winningProbability) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white">{winningProbability}<span className="text-xl">%</span></span>
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-400 z-10">
                  {winningProbability > 80 ? 'Excellent! You are positioned well for a top-tier allocation.' : 
                   winningProbability > 40 ? 'Good progress. Keep hitting your daily tasks to increase your tier.' : 
                   'Low probability. Complete more tasks to secure your spot.'}
                </p>
              </div>

              {/* Dynamic Task Checklist */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Verified Protocol Tasks</h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md">{perfCompleted} / {perfTotal} Completed</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
                  {perfTasks.length === 0 ? (
                     <div className="col-span-2 text-center text-slate-500 py-8 text-sm font-medium">No tasks found. Select a project or add tasks to your dashboard.</div>
                  ) : (
                    perfTasks.slice(0, 6).map((task) => (
                      <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border ${task.isCompleted ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                         <div className="flex items-center gap-3 truncate pr-4">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${task.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                             {task.isCompleted ? (
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                             ) : (
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             )}
                           </div>
                           <div className="truncate">
                             <p className="text-sm font-bold text-slate-900 truncate">{task.name}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                               {task.project_name} • {task.recurring || 'One-Time'}
                             </p>
                           </div>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Transaction History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mt-6">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Recent Transactions</h3>
                <button 
                  onClick={handleForceRefresh}
                  disabled={isSyncing}
                  className={`text-[11px] font-bold px-4 py-2 rounded-lg transition-colors ${
                    isSyncing 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100'
                  }`}
                >
                  {isSyncing ? 'Scanning Blockchain...' : 'Force Refresh On-Chain ⚡'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Tx Hash</th>
                      <th className="px-6 py-4">Protocol</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Time</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Points Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {txHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium text-sm">
                          Click "Force Refresh On-Chain" to scan the blockchain for your activity.
                        </td>
                      </tr>
                    ) : txHistory.map((tx, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors h-14">
                        <td className="px-6">
                          <a href="#" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1.5">
                            {tx.hash} <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        </td>
                        <td className="px-6 text-sm font-semibold text-slate-800">{tx.protocol}</td>
                        <td className="px-6">
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{tx.type}</span>
                        </td>
                        <td className="px-6 text-sm font-medium text-slate-500">{tx.date}</td>
                        <td className="px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {tx.status}
                          </span>
                        </td>
                        <td className="px-6 text-right text-sm font-black text-emerald-600">{tx.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
        
      </div>
    </div>
  );
}