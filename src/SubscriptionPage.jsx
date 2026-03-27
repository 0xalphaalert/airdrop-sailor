import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from './supabaseClient';
import { Anchor, Sparkles, CheckCircle2, X, Coins, UploadCloud, Check, Clock } from 'lucide-react';

export default function SubscriptionPage() {
  const { ready, authenticated, user } = usePrivy();
  
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [projectLimit, setProjectLimit] = useState(5);
  const [lastCheckin, setLastCheckin] = useState(null);
  
  const [promotedQuests, setPromotedQuests] = useState([]);
  const [userSubmissions, setUserSubmissions] = useState([]);

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchPointsData();
    }
  }, [ready, authenticated, user]);

  const fetchPointsData = async () => {
    const privyId = user.id; // 🚀 THE FIX: Use Privy ID
    if (!privyId) return;

    // Fetch Points & Limit
    const { data: profile } = await supabase.from('user_profiles').select('project_limit').eq('auth_id', privyId).maybeSingle();
    if (profile) setProjectLimit(profile.project_limit || 5);

    const { data: pointsData } = await supabase.from('user_points').select('total_points').eq('auth_id', privyId).maybeSingle();
    if (pointsData) setPoints(pointsData.total_points || 0);

    // Fetch Check-in Streak
    const { data: checkinData } = await supabase.from('user_checkins').select('*').eq('auth_id', privyId).maybeSingle();
    if (checkinData) {
      setStreak(checkinData.streak_count || 0);
      setLastCheckin(checkinData.last_checkin_at);
    }

    // Fetch Active Quests & User Submissions
    const { data: quests } = await supabase.from('promoted_quests').select('*').eq('is_active', true);
    if (quests) setPromotedQuests(quests);

    const { data: submissions } = await supabase.from('quest_submissions').select('*').eq('auth_id', privyId);
    if (submissions) setUserSubmissions(submissions);
  };

  // --- 1. DAILY CHECK-IN LOGIC ---
  const handleDailyCheckin = async () => {
    if (!user) return;
    const privyId = user.id;

    try {
      // 1. Fetch exact streak data
      const { data: lastCheckin } = await supabase
        .from('user_checkins')
        .select('*')
        .eq('auth_id', privyId)
        .maybeSingle();

      const now = new Date();
      let newStreak = 1;

      if (lastCheckin && lastCheckin.last_checkin_at) {
        const lastDate = new Date(lastCheckin.last_checkin_at);
        const diffHours = (now - lastDate) / (1000 * 60 * 60);

        if (diffHours < 24) {
          return alert("You already checked in today! Come back tomorrow.");
        }
        
        if (diffHours >= 24 && diffHours < 48) {
          newStreak = lastCheckin.streak_count >= 7 ? 7 : lastCheckin.streak_count + 1;
        }
      }

      // 2. 🚀 THE FIX: Fetch the EXACT current points from the DB before doing math!
      // 2. 🚀 THE MATH FIX: Fetch the EXACT current points and multiply!
      const { data: currentPointsData } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('auth_id', privyId)
        .maybeSingle();
        
      const currentDbPoints = currentPointsData?.total_points || 0;
      const pointsEarned = newStreak * 10; // <--- The multiplier
      const updatedPoints = currentDbPoints + pointsEarned;

      // 3. Save the new Streak (Explicitly handle conflicts)
      const { error: streakError } = await supabase.from('user_checkins').upsert({
        auth_id: privyId,
        streak_count: newStreak,
        last_checkin_at: now.toISOString()
      }, { onConflict: 'auth_id' });

      if (streakError) throw streakError;

      // 4. Save the new Points (Explicitly handle conflicts)
      const { error: pointsError } = await supabase.from('user_points').upsert({
        auth_id: privyId,
        total_points: updatedPoints,
        updated_at: now.toISOString()
      }, { onConflict: 'auth_id' });

      if (pointsError) throw pointsError;

      // 5. Refresh the UI safely depending on which page we are on
      if (typeof fetchMasterDashboardData === 'function') fetchMasterDashboardData();
      if (typeof fetchPointsData === 'function') fetchPointsData();
      
      alert(`Checked in! You earned ${pointsEarned} points. Keep up the streak!`);

    } catch (error) {
      console.error("Check-in Error:", error);
      alert("Failed to save check-in. Check the console for details.");
    }
  };

  // --- 2. REDEEM POINTS LOGIC ---
  const handleRedeem = async (cost, slotsToAdd) => {
    if (points < cost) return alert(`Not enough points! You need ${cost} points.`);
    
    const isConfirmed = window.confirm(`Spend ${cost} points to unlock ${slotsToAdd} project slots?`);
    if (!isConfirmed) return;

    const privyId = user.id; // 🚀 THE FIX
    const newPoints = points - cost;
    const newLimit = projectLimit + slotsToAdd;

    try {
      // Deduct Points
      await supabase.from('user_points').update({ total_points: newPoints }).eq('auth_id', privyId);
      
      // Increase Limit 
      await supabase.from('user_profiles').update({ project_limit: newLimit }).eq('auth_id', privyId);

      setPoints(newPoints);
      setProjectLimit(newLimit);
      alert(`Success! Your project limit is now ${newLimit}.`);
    } catch (error) {
      console.error("Redemption failed:", error);
    }
  };

  // --- 3. PROMOTED QUEST SUBMISSION ---
  const handleQuestSubmit = async (questId) => {
    const proofLink = window.prompt("Please paste the link to your screenshot or post (e.g., Twitter link, Imgur link):");
    if (!proofLink) return;

    const privyId = user.id; // 🚀 THE FIX

    try {
      const { error } = await supabase.from('quest_submissions').insert({
        auth_id: privyId, // 🚀 THE FIX
        quest_id: questId,
        proof_link: proofLink,
        status: 'Pending'
      });

      if (error) throw error;
      
      alert("Proof submitted successfully! Our team will verify it shortly.");
      fetchPointsData(); // Refresh table to show 'Pending' state
    } catch (error) {
      alert("You have already submitted proof for this quest!");
    }
  };

  // UI Helpers
  const currentDayTracker = streak >= 7 ? 7 : streak + 1; // Shows what day they are currently on
  const checkinValue = currentDayTracker * 10;
  
  // Calculate if they can check in right now
  const canCheckIn = !lastCheckin || ((new Date() - new Date(lastCheckin)) / (1000 * 60 * 60)) >= 24;

  if (!ready || !authenticated) return <div className="p-10 text-center">Please connect your wallet.</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 pb-24">
      
      {/* HEADER */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="inline-flex items-center justify-center p-3.5 bg-blue-50 rounded-2xl mb-5 text-blue-600 shadow-sm border border-blue-100/50">
          <Anchor className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight">
          Points Arena
        </h1>
        <p className="mt-4 text-[16px] text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
          Unlock hidden alpha, redeem points for project slots, and earn daily rewards.
        </p>
      </div>

      {/* PRICING TIERS */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-20">
        <div className="bg-white rounded-[16px] border border-slate-200 p-8 shadow-sm flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-900">Standard Tier</h3>
          <div className="mt-4 mb-6 flex items-baseline text-4xl font-extrabold text-slate-900">
            $5<span className="ml-1 text-sm font-medium text-slate-500">/ month</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Track up to 5 Projects</li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Daily Check-in Rewards</li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-400 opacity-60"><X className="w-5 h-5 shrink-0" /> Unlimited Premium Projects</li>
          </ul>
          <button className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-bold rounded-[12px] transition-colors">Get Standard</button>
        </div>

        <div className="relative bg-white rounded-[16px] border-2 border-blue-600 p-8 shadow-[0_20px_40px_-12px_rgba(37,99,235,0.15)] flex flex-col h-full transform md:-translate-y-4 z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Most Popular
          </div>
          <h3 className="text-lg font-bold text-blue-600">Pro Tier</h3>
          <div className="mt-4 mb-2 flex items-baseline text-4xl font-extrabold text-slate-900">
            $3<span className="ml-1 text-sm font-medium text-slate-500">/ month</span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wide">Billed $6 every 2 months</p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm font-semibold text-slate-900"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Unlimited Premium Projects</li>
            <li className="flex items-start gap-3 text-sm font-semibold text-slate-900"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Advanced Sybil Checker</li>
            <li className="flex items-start gap-3 text-sm font-semibold text-slate-900"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Priority Support</li>
          </ul>
          <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-[12px] transition-colors shadow-sm">Upgrade to Pro</button>
        </div>

        <div className="bg-white rounded-[16px] border border-slate-200 p-8 shadow-sm flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-900">Lifetime Access</h3>
          <div className="mt-4 mb-2 flex items-baseline text-4xl font-extrabold text-slate-900">$100</div>
          <p className="text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wide">One-Time Payment</p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> All Pro Tier Features</li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Lifetime Updates</li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Early Beta Access</li>
          </ul>
          <button className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-[12px] transition-colors">Get Lifetime</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 gap-8">
        
        {/* DAILY CHECK-IN */}
        <div className="bg-white border border-slate-200 rounded-[16px] p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Daily Check-in Streak</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Don't miss a day! Missing a day resets your streak to Day 1.</p>
            </div>
            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-bold">{points} PTS Total</span>
            </div>
          </div>

          <div className="relative py-4 mb-8">
            <div className="absolute top-1/2 left-[5%] right-[5%] h-1.5 bg-slate-100 rounded-full -translate-y-1/2 z-0"></div>
            <div className="relative z-10 flex justify-between">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isCompleted = day <= streak;
                const isActive = day === currentDayTracker && canCheckIn;

                return (
                  <div key={day} className="flex flex-col items-center gap-2 group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-500 text-white shadow-md scale-100' :
                      isActive ? 'bg-white border-4 border-blue-600 text-blue-600 scale-110 shadow-md' :
                      'bg-slate-100 border-2 border-slate-200 text-slate-400'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : `${day * 10}`}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                      Day {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={handleDailyCheckin}
            disabled={!canCheckIn}
            className={`w-full sm:w-auto mx-auto flex items-center justify-center gap-2 py-3 px-8 text-sm font-bold rounded-[12px] transition-all shadow-sm ${
              canCheckIn 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {canCheckIn ? `Claim ${checkinValue} Points (Day ${currentDayTracker})` : 'Come back tomorrow!'}
          </button>
        </div>

        {/* REDEEM POINTS */}
        <div className="bg-amber-50/40 border border-amber-200/60 rounded-[16px] p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Redeem Points</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Your current project capacity is <strong className="text-slate-800">{projectLimit} slots</strong>.</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              // 🚀 NEW: Early growth hacking prices!
              { cost: 20, slots: 1, title: 'Unlock 1 Premium Project' },
              { cost: 30, slots: 2, title: 'Unlock 2 Premium Projects' },
              { cost: 50, slots: 5, title: 'Unlock 5 Premium Projects' },
            ].map((reward, i) => (
              <div 
                key={i}
                onClick={() => handleRedeem(reward.cost, reward.slots)}
                className="group flex items-center justify-between bg-white border border-slate-200 p-4 rounded-[12px] hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Anchor className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{reward.title}</h4>
                    <p className="text-xs font-medium text-slate-500">Adds +{reward.slots} tracked projects to your limit.</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                  points >= reward.cost 
                    ? 'bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-500 group-hover:text-white' 
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  <span className="text-sm font-bold">{reward.cost}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">PTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PROMOTED TASKS */}
        <div className="bg-white border border-slate-200 rounded-[16px] shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Promoted Quests</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Complete manual verification tasks to earn extra points.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider h-12 border-b border-slate-200">
                  <th className="px-8 font-semibold">Task Name</th>
                  <th className="px-6 font-semibold">Description</th>
                  <th className="px-6 font-semibold text-center">Reward</th>
                  <th className="px-8 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promotedQuests.map((quest) => {
                  const submission = userSubmissions.find(s => s.quest_id === quest.id);
                  const isPending = submission?.status === 'Pending';
                  const isApproved = submission?.status === 'Approved';

                  return (
                    <tr key={quest.id} className="h-16 hover:bg-slate-50 transition-colors">
                      <td className="px-8">
                        <span className="text-sm font-bold text-slate-900">{quest.task_name}</span>
                      </td>
                      <td className="px-6 text-sm font-medium text-slate-500">
                        {quest.description}
                      </td>
                      <td className="px-6 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-100">
                          +{quest.reward_points} pts
                        </span>
                      </td>
                      <td className="px-8 text-right">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg border border-amber-100">
                            <Clock className="w-3.5 h-3.5" /> Pending Review
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleQuestSubmit(quest.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                          >
                            <UploadCloud className="w-3.5 h-3.5" /> Upload Proof
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}