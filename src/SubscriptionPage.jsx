import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from './supabaseClient';
import { 
  Anchor, Sparkles, CheckCircle2, X, Shield, Zap, Target, Infinity, Crown, Flame, Calendar, Loader2
} from 'lucide-react';

export default function SubscriptionPage() {
  const { ready, authenticated, user } = usePrivy();
  
  const [points, setPoints] = useState(0);
  const [projectLimit, setProjectLimit] = useState(5);

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchPointsData();
    }
  }, [ready, authenticated, user]);

  const fetchPointsData = async () => {
    const privyId = user?.id;
    if (!privyId) return;

    // 1. Fetch Points & Limit
    const { data: profile } = await supabase.from('user_profiles').select('project_limit').eq('auth_id', privyId).maybeSingle();
    if (profile) setProjectLimit(profile.project_limit || 5);

    const { data: pointsData } = await supabase.from('user_points').select('total_points').eq('auth_id', privyId).maybeSingle();
    if (pointsData) setPoints(pointsData.total_points || 0);

    // 2. 🚀 NEW: Fetch Daily Check-in Status
    const { data: checkinData } = await supabase.from('user_checkins').select('streak_count, last_checkin_at').eq('auth_id', privyId).maybeSingle();
    
    if (checkinData) {
      setStreak(checkinData.streak_count || 0);
      
      if (checkinData.last_checkin_at) {
        const lastCheckIn = new Date(checkinData.last_checkin_at);
        const now = new Date();
        
        // Check if the last check-in date matches today's date
        const isToday = 
          lastCheckIn.getFullYear() === now.getFullYear() &&
          lastCheckIn.getMonth() === now.getMonth() &&
          lastCheckIn.getDate() === now.getDate();
          
        setHasCheckedInToday(isToday);
        
        if (isToday) {
          setCheckInMessage("You're all caught up for today!");
        }
      }
    }
  };

  // --- REDEEM POINTS LOGIC ---
  const handleRedeem = async (cost, slotsToAdd) => {
    if (points < cost) return alert(`Not enough points! You need ${cost} points.`);
    
    const isConfirmed = window.confirm(`Spend ${cost} points to unlock ${slotsToAdd} project slots?`);
    if (!isConfirmed) return;

    const privyId = user.id; 
    const newPoints = points - cost;
    const newLimit = projectLimit + slotsToAdd;

    try {
      // 1. Deduct Points
      await supabase.from('user_points').update({ total_points: newPoints }).eq('auth_id', privyId);
      
      // 2. 🚀 THE FIX: Check if profile exists before updating!
      const { data: profileCheck } = await supabase.from('user_profiles').select('id').eq('auth_id', privyId).maybeSingle();
      
      if (profileCheck) {
        // Profile exists, safe to update
        await supabase.from('user_profiles').update({ project_limit: newLimit }).eq('auth_id', privyId);
      } else {
        // Profile is missing! Insert a fresh one so the limit saves permanently
        await supabase.from('user_profiles').insert({ 
          auth_id: privyId, 
          project_limit: newLimit,
          subscription_tier: 'Free',
          points: 0
        });
      }

      setPoints(newPoints);
      setProjectLimit(newLimit);
      alert(`Success! Your project limit is now ${newLimit}.`);
    } catch (error) {
      console.error("Redemption failed:", error);
    }
  };
  // --- DAILY CHECK-IN LOGIC ---
  const [streak, setStreak] = useState(0); 
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const weekDays = [1, 2, 3, 4, 5, 6, 7];

  const handleCheckIn = async () => {
    if (!authenticated || !user) return;
    setIsCheckingIn(true);
    setCheckInMessage('');

    try {
      const response = await fetch('https://ptobheftxcjiqobxgeal.supabase.co/functions/v1/daily-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0b2JoZWZ0eGNqaXFvYnhnZWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjU0NzYsImV4cCI6MjA4NDE0MTQ3Nn0.kgs53pdaRHM2G_xsIrw0PbGex-Z-7DuKGfdxBRMRVU8` 
        },
        body: JSON.stringify({ auth_id: user.id })
      });

      const result = await response.json();

      if (result.success) {
        setStreak(result.newStreak);
        setHasCheckedInToday(true);
        setCheckInMessage(`Success! +${result.earned} Points earned.`);
        setPoints(prev => prev + result.earned); // Instantly updates your balance banner!
      } else {
        setHasCheckedInToday(true);
        setCheckInMessage(result.message);
        if (result.currentStreak) setStreak(result.currentStreak);
      }
    } catch (error) {
      console.error("Check-in failed:", error);
      setCheckInMessage("Failed to check in. Try again later.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (!ready || !authenticated) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-400">Loading Access...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 pb-24 selection:bg-blue-100">
      
      {/* 1. HERO SECTION WITH TRUST INDICATORS */}
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-4xl md:text-[46px] font-black text-slate-900 tracking-tight leading-tight mb-4">
          Points Arena
        </h1>
        <p className="text-[16px] text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
          Unlock hidden alpha, increase your farming capacity, and maximize your airdrop rewards.
        </p>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <span className="px-4 py-1.5 bg-orange-50/80 text-orange-600 rounded-full text-xs font-bold border border-orange-200/50 shadow-sm flex items-center gap-1.5">
            🔥 12,000+ farmers using AirdropSailor
          </span>
          <span className="px-4 py-1.5 bg-blue-50/80 text-blue-600 rounded-full text-xs font-bold border border-blue-200/50 shadow-sm flex items-center gap-1.5">
            ⚡ 2,300 upgrades this week
          </span>
        </div>
      </div>

      {/* 2. GAMIFICATION HOOK BANNER (Updated to Brand Blue) */}
      <div className="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-6 text-center shadow-xl border border-blue-500 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
               <Anchor className="w-5 h-5 text-white" />
             </div>
             <div className="text-left">
               <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Your Balance</p>
               <p className="text-white text-xl font-black">{points} PTS</p>
             </div>
           </div>
           <div className="hidden md:block w-px h-10 bg-blue-400/50"></div>
           <p className="text-blue-50 font-medium text-sm text-left max-w-sm">
             <strong className="text-white">Upgrade to Pro</strong> → Unlock unlimited farming slots + earn points 2x faster.
           </p>
        </div>
      </div>
      {/* ========================================= */}
      {/* DAILY CHECK-IN MODULE */}
      {/* ========================================= */}
      <div className="max-w-4xl mx-auto mb-12 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <Flame className={`w-6 h-6 ${streak > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
              Daily Check-In
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Maintain your streak to multiply your daily point drops.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 md:gap-2 mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-amber-400 -translate-y-1/2 z-0 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min((streak / 7) * 100, 100)}%` }}
          ></div>

          {weekDays.map((day) => {
            const isCompleted = day <= streak;
            const isToday = day === streak + (hasCheckedInToday ? 0 : 1);

            return (
              <div key={day} className="relative z-10 flex flex-col items-center gap-1.5 md:gap-2">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black border-2 transition-all duration-500 text-sm md:text-base ${
                  isCompleted 
                    ? 'bg-amber-400 border-amber-400 text-white shadow-lg shadow-amber-400/30 scale-110' 
                    : isToday
                      ? 'bg-white border-amber-400 text-amber-500 shadow-xl'
                      : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : `+${day * 10}`}
                </div>
                <span className={`text-[10px] md:text-xs font-bold ${isCompleted ? 'text-amber-600' : 'text-slate-400'}`}>
                  Day {day}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center">
          <button 
            onClick={handleCheckIn}
            disabled={isCheckingIn || hasCheckedInToday || !authenticated}
            className={`w-full max-w-sm py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
              hasCheckedInToday
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5'
            }`}
          >
            {isCheckingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : hasCheckedInToday ? (
              <>
                <CheckCircle2 className="w-5 h-5" /> Come back tomorrow!
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" /> Check In Now
              </>
            )}
          </button>

          {checkInMessage && (
            <p className={`mt-3 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 ${hasCheckedInToday ? 'text-emerald-600' : 'text-slate-600'}`}>
              {checkInMessage}
            </p>
          )}
        </div>
      </div>

      {/* 3. CORE PRICING CARDS */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center mb-10">
        
        {/* FREE PLAN (Decoy) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col h-full hover:border-slate-300 transition-colors">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Free Plan</h3>
          <div className="mb-6 flex items-baseline text-4xl font-black text-slate-900 tracking-tighter">
            $0<span className="ml-1 text-sm font-bold text-slate-400 tracking-normal">/ month</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" /> Track up to 5 Projects</li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" /> Daily check-in rewards</li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-400 opacity-50"><X className="w-5 h-5 shrink-0" /> Unlimited Premium Projects</li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-400 opacity-50"><X className="w-5 h-5 shrink-0" /> On-Chain Analytics</li>
          </ul>
          <button className="w-full py-3 px-4 bg-transparent border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 text-sm font-bold rounded-xl transition-all">
            Current Plan
          </button>
        </div>

        {/* PRO FARMER (The Hero - Updated to Solid Blue) */}
        <div className="relative bg-white rounded-2xl border border-blue-100 p-8 shadow-[0_20px_40px_-12px_rgba(37,99,235,0.15)] flex flex-col h-full transform md:-translate-y-4 z-10 ring-4 ring-blue-500/10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5" /> Most Popular
          </div>
          <h3 className="text-lg font-black text-blue-600 mb-2">Pro Farmer</h3>
          <div className="mb-2 flex items-baseline text-5xl font-black text-slate-900 tracking-tighter">
            $3<span className="ml-1 text-sm font-bold text-slate-500 tracking-normal">/ month</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">Billed $6 every 2 months</p>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm font-bold text-slate-800"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Unlimited Premium Projects</li>
            <li className="flex items-start gap-3 text-sm font-bold text-slate-800"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Advanced Sybil Checker</li>
            <li className="flex items-start gap-3 text-sm font-bold text-slate-800"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Automated On-Chain Sync</li>
            <li className="flex items-start gap-3 text-sm font-bold text-slate-800"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Priority Support Signals</li>
          </ul>
          
          <button className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 flex items-center justify-center gap-2">
            Upgrade to Pro <span className="text-lg leading-none">→</span>
          </button>
        </div>

        {/* LIFETIME ACCESS (Updated Button) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col h-full relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-[10px] font-black tracking-widest uppercase bg-purple-50 text-purple-600 px-2.5 py-1 rounded-md border border-purple-100">
            💎 Best Value
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Lifetime</h3>
          <div className="mb-2 flex items-baseline text-4xl font-black text-slate-900 tracking-tighter">
            $100
          </div>
          <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">One-Time Payment</p>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> All Pro Tier Features</li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> Lifetime Updates</li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> Early Beta Access</li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> Exclusive Discord Role</li>
          </ul>
          <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
            Get Lifetime Access
          </button>
        </div>
      </div>

      {/* 4. MICRO-CONVERSIONS */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mt-6 mb-20 text-xs font-bold text-slate-400 uppercase tracking-wider">
         <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No hidden fees</span>
         <span className="hidden sm:block text-slate-300">•</span>
         <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cancel anytime</span>
         <span className="hidden sm:block text-slate-300">•</span>
         <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant activation</span>
      </div>

      {/* 5. WHY UPGRADE? (Reward-Driven Section) */}
      <div className="max-w-4xl mx-auto mb-20">
         <h2 className="text-2xl font-black text-slate-900 tracking-tight text-center mb-10">Why successful farmers upgrade to Pro</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
               <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                 <Infinity className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-slate-900 mb-1">Unlimited Tracking</h4>
                 <p className="text-xs font-medium text-slate-500 leading-relaxed">Stop rationing your slots. Track every potential airdrop across multiple ecosystems without hitting limits.</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
               <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600">
                 <Shield className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-slate-900 mb-1">Sybil Protection</h4>
                 <p className="text-xs font-medium text-slate-500 leading-relaxed">Use our advanced on-chain engine to monitor your wallet's health and avoid being flagged by protocols.</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
               <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                 <Zap className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-slate-900 mb-1">Priority Signals</h4>
                 <p className="text-xs font-medium text-slate-500 leading-relaxed">Get access to time-sensitive testnets and high-alpha opportunities before the free tier users see them.</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
               <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                 <Target className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-slate-900 mb-1">Improve Efficiency</h4>
                 <p className="text-xs font-medium text-slate-500 leading-relaxed">Automate your daily tracking, auto-sync your on-chain data, and spend less time managing spreadsheets.</p>
               </div>
            </div>
         </div>
      </div>

      {/* 6. REDEEM POINTS (Alternative Path) */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Prefer to grind? Redeem Points</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Your current project capacity is <strong className="text-slate-800">{projectLimit} slots</strong>.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { cost: 20, slots: 1, title: 'Unlock 1 Project' },
              { cost: 30, slots: 2, title: 'Unlock 2 Projects' },
              { cost: 50, slots: 5, title: 'Unlock 5 Projects' },
            ].map((reward, i) => (
              <div 
                key={i}
                onClick={() => handleRedeem(reward.cost, reward.slots)}
                className="group flex flex-col justify-between bg-slate-50 border border-slate-200 p-5 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
              >
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{reward.title}</h4>
                  <p className="text-xs font-medium text-slate-500 mt-1">Permanently add +{reward.slots} slots.</p>
                </div>
                <div className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border transition-colors ${
                  points >= reward.cost 
                    ? 'bg-white text-slate-900 border-slate-200 group-hover:border-blue-200 group-hover:shadow-sm' 
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  <span className="text-sm font-black">{reward.cost} PTS</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Redeem</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
