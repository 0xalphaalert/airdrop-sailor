import React, { useState, useEffect } from "react";
import { useAuth } from '../useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Info, Clock, ArrowRight, Anchor, Sparkles, Award,
  Hexagon, Layers, Box, Sun, ChevronRight, Check,
  Flame, Star, X, Upload, CalendarCheck, Twitter, MessageCircle, FileText, User,
} from "lucide-react";

import openChestImg from '../assets/chest-open.png';
import trophyImg from '../assets/trophy.png';
import useIsMobile from '../hooks/useIsMobile';
import XPLevelsPageMobile from '../mobile/pages/XPLevelsPageMobile';

export default function XPLevelsPage() {
  const { user, login } = useAuth(); 
  const isMobile = useIsMobile();
  const [lifetimeXP, setLifetimeXP] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [nextLevelXP, setNextLevelXP] = useState(1000);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);

  // --- Modal & Submission States ---
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState({});

  const navigate = useNavigate();
  const [verifyingTask, setVerifyingTask] = useState(false);

  const formatTimeLeft = (endDate) => {
    if (!endDate) return "TBA";
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return "Ended";
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${d}d ${h}h`;
  };

  const getBrandConfig = (brand) => {
    const b = brand?.toLowerCase() || '';
    if (b.includes('monad')) return { icon: Hexagon, color: "text-purple-600" };
    if (b.includes('layerzero')) return { icon: Layers, color: "text-slate-900" };
    if (b.includes('zeta')) return { icon: Box, color: "text-emerald-600" };
    if (b.includes('solana')) return { icon: Sun, color: "text-indigo-500" };
    if (b.includes('bera')) return { icon: Award, color: "text-amber-500" };
    return { icon: Star, color: "text-blue-500" };
  };

  const getTaskUIConfig = (quest) => {
    if (quest.system_action_id === 'daily_checkin') return { icon: CalendarCheck, color: "text-amber-500", bg: "bg-amber-100", btn: "Claim", style: "solid" };
    if (quest.task_type === 'Twitter') return { icon: Twitter, color: "text-sky-500", bg: "bg-sky-50", btn: "Follow & Earn", style: "solid" };
    if (quest.task_type === 'Telegram' || quest.task_type === 'Discord') return { icon: MessageCircle, color: "text-indigo-500", bg: "bg-indigo-50", btn: "Join & Earn", style: "solid" };
    if (quest.task_type === 'Webpage') return { icon: FileText, color: "text-purple-500", bg: "bg-purple-50", btn: "Go", style: "outline" };
    if (quest.system_action_id === 'complete_profile') return { icon: User, color: "text-emerald-500", bg: "bg-emerald-50", btn: "Verify Profile", style: "solid" };
    return { icon: Star, color: "text-blue-500", bg: "bg-blue-50", btn: "Complete", style: "solid" };
  };

  useEffect(() => {
    fetchPageData();
  }, [user]);

  const fetchPageData = async () => {
    try {
      const { data: quests } = await supabase.from('daily_quests').select('*').eq('is_active', true).order('created_at', { ascending: true });
      const { data: campaignsData } = await supabase.from('featured_campaigns').select('*').eq('status', 'active').order('created_at', { ascending: false });

      if (campaignsData) setFeaturedCampaigns(campaignsData);

      let latestLedgerMap = {};
      let hasCheckedInToday = false;
      let subsMap = {};

      if (user) {
        const { data: profile } = await supabase.from('user_profiles').select('lifetime_xp').eq('auth_id', user.id).maybeSingle();
        const xp = profile?.lifetime_xp || 0;
        setLifetimeXP(xp);
        
        const level = Math.floor(xp / 1000) + 1;
        setUserLevel(level);
        setNextLevelXP(level * 1000);

        // 1. Check Daily Check-in Streak
        const { data: checkin } = await supabase.from('user_checkins').select('streak_count, last_checkin_at').eq('auth_id', user.id).maybeSingle();
        setCurrentStreak(checkin?.streak_count || 0);
        const today = new Date().toISOString().split('T')[0];
        hasCheckedInToday = checkin?.last_checkin_at?.startsWith(today);

        // 2. Fetch Ledger to find exactly when they last did ANY task (replaces user_task_progress)
        const { data: ledgerData } = await supabase.from('xp_ledger')
           .select('reference_id, created_at')
           .eq('auth_id', user.id)
           .eq('action_type', 'daily_quest');

        if (ledgerData) {
           ledgerData.forEach(entry => {
               const existing = latestLedgerMap[entry.reference_id];
               if (!existing || new Date(entry.created_at) > new Date(existing)) {
                   latestLedgerMap[entry.reference_id] = entry.created_at;
               }
           });
        }

        // 3. Fetch Submissions (For Pending Proof)
        const { data: subData } = await supabase.from('campaign_submissions').select('campaign_id, quest_id, status').eq('auth_id', user.id);
        if (subData) {
          subData.forEach(sub => {
            if (sub.campaign_id) subsMap[sub.campaign_id] = sub.status;
            if (sub.quest_id) subsMap[sub.quest_id] = sub.status; 
          });
        }
        setUserSubmissions(subsMap);
      } else {
        setLifetimeXP(0);
        setUserLevel(1);
        setCurrentStreak(0);
        setUserSubmissions({});
      }

      if (quests) {
        const formattedQuests = quests.map(q => {
          const uiConfig = getTaskUIConfig(q);
          let isCompleted = false;
          let isOnCooldown = false;
          let isPending = subsMap[q.id] === 'pending';
          
          if (user && !isPending) {
            if (q.system_action_id === 'daily_checkin') {
              isCompleted = hasCheckedInToday;
            } else {
              const lastDone = latestLedgerMap[q.id];
              if (lastDone) {
                // 🚀 If they've done it, and it's a lifetime task (0), it's completed forever!
                if (q.cooldown_hours === 0) {
                   isCompleted = true; 
                } else {
                   // Time-based Cooldown Check
                   const hoursSince = (new Date() - new Date(lastDone)) / (1000 * 60 * 60);
                   if (hoursSince < q.cooldown_hours) {
                     isOnCooldown = true;
                     isCompleted = true; // Blocks interaction
                   }
                }
              }
            }
          }

          return { 
            ...q, 
            uiIcon: uiConfig.icon, 
            iconColor: uiConfig.color, 
            iconBg: uiConfig.bg, 
            buttonText: uiConfig.btn, 
            buttonStyle: uiConfig.style, 
            completed: isCompleted,
            isOnCooldown: isOnCooldown,
            isPending: isPending
          };
        });
        setDailyQuests(formattedQuests);
      }

    } catch (error) {
      console.error("Error fetching page data:", error);
    }
  };

  const completeGenericTask = async (quest) => {
    setVerifyingTask(true);
    try {
      // 🚀 SECURITY PRE-CHECK: Query ledger directly to prevent infinite claiming exploit
      const { data: existingLogs } = await supabase.from('xp_ledger')
        .select('created_at')
        .eq('auth_id', user.id)
        .eq('reference_id', quest.id)
        .eq('action_type', 'daily_quest')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingLogs && existingLogs.length > 0) {
        const lastDone = existingLogs[0].created_at;
        
        if (quest.cooldown_hours === 0) {
          throw new Error("You have already claimed this lifetime reward!");
        } else {
          const hoursSince = (new Date() - new Date(lastDone)) / (1000 * 60 * 60);
          if (hoursSince < quest.cooldown_hours) {
            throw new Error(`Task on cooldown! Please wait ${quest.cooldown_hours} hours between claims.`);
          }
        }
      }

      // If we pass the security check, award the SAIL!
      const { error: ledgerError } = await supabase.from('xp_ledger').insert({ 
        auth_id: user.id, 
        amount: quest.reward_sail, 
        action_type: 'daily_quest', 
        reference_id: quest.id 
      });
      
      if (ledgerError) throw ledgerError;

      await supabase.rpc('increment_sail_balance', { 
        p_auth_id: user.id, 
        p_amount: quest.reward_sail 
      });

      alert(`✅ Verified! You earned ${quest.reward_sail} SAIL.`);
      
      // Update UI Instantly 
      setDailyQuests(prev => prev.map(q => {
        if (q.id === quest.id) {
          return { ...q, completed: true, isOnCooldown: q.cooldown_hours > 0 };
        }
        return q;
      }));
      
    } catch (err) {
      console.error(err);
      alert(`❌ ${err.message || "Error verifying task."}`);
    } finally {
      setVerifyingTask(false);
    }
  };

  const handleQuestAction = async (quest) => {
    if (!user) {
      alert("Please sign in or create an account to start earning SAIL!");
      login(); 
      return;
    }

    // 1. Intercept Proof Required Tasks First
    if (quest.proof_required_type === 'image' || quest.proof_required_type === 'url') {
      setSelectedCampaign(quest); 
      return;
    }

    // 2. Handle System Specific Tasks
    const actionId = quest.system_action_id;

    if (actionId === 'daily_checkin') {
      setClaimingDaily(true);
      try {
        const { data, error } = await supabase.rpc('claim_daily_checkin', { p_auth_id: user.id });
        if (error) throw error;
        if (data.success) {
          alert(`🔥 You claimed ${data.reward} SAIL! Streak: ${data.new_streak} days!`);
          fetchPageData();
        } else {
          alert(`⏳ ${data.message}`);
        }
      } finally {
        setClaimingDaily(false);
      }
      return;
    }

    if (actionId === 'add_tracker') return navigate('/airdrops');
    if (actionId === 'marketplace_purchase') return navigate('/marketplace');

    if (actionId === 'complete_profile') {
      setVerifyingTask(true);
      try {
        const { data: profile } = await supabase.from('user_profiles').select('wallet_address, twitter_handle, telegram_id, is_profile_completed').eq('auth_id', user.id).single();
        const isComplete = profile?.is_profile_completed || (profile?.wallet_address && profile?.twitter_handle && profile?.telegram_id);

        if (isComplete) await completeGenericTask(quest);
        else {
          alert("Your profile is not complete yet! Please link your Wallet, X, and Telegram.");
          navigate('/profile');
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      } finally {
        setVerifyingTask(false);
      }
      return;
    }

    // 3. Auto Execute Social Links & Generic Tasks
    if (quest.action_link) window.open(quest.action_link, '_blank');
    completeGenericTask(quest);
  };

  const handleCampaignSubmit = async () => {
    if (!user) return alert("Please connect your wallet/email first.");
    setIsSubmitting(true);
    let finalProofData = proofUrl;

    try {
      if (selectedCampaign.proof_required_type === 'image') {
        if (!proofFile) throw new Error("Please select a screenshot to upload.");
        const formData = new FormData();
        formData.append('image', proofFile);
        const imgbbKey = '680d11c11f877bd76167ecec5c1b2d2d'; 
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: 'POST', body: formData });
        const imgbbData = await res.json();
        if (!imgbbData.success) throw new Error("Failed to upload image.");
        finalProofData = imgbbData.data.url;
      }

      // Check if it's a Daily Quest vs Featured Campaign
      const isQuest = selectedCampaign.cooldown_hours !== undefined;

      const payload = {
        auth_id: user.id,
        proof_data: finalProofData || 'none',
        status: 'pending'
      };

      if (isQuest) {
        payload.quest_id = selectedCampaign.id;
      } else {
        payload.campaign_id = selectedCampaign.id;
      }

      const { error } = await supabase.from('campaign_submissions').insert(payload);

      if (error && error.code === '23505') throw new Error("You have already submitted proof for this task!");
      if (error) throw error;

      alert("✅ Proof submitted successfully! It is now pending admin approval.");
      setUserSubmissions(prev => ({ ...prev, [selectedCampaign.id]: 'pending' }));
      setSelectedCampaign(null);
      setProofFile(null);
      setProofUrl('');
      fetchPageData(); // Refresh UI State
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(featuredCampaigns.length / 15));

  const xpForCurrentLevel = (userLevel - 1) * 1000;
  const currentLevelProgress = lifetimeXP - xpForCurrentLevel;
  const pct = Math.min(1, Math.max(0, currentLevelProgress / 1000));
  const r = 70;
  const c = 2 * Math.PI * r;
  const remainingXP = nextLevelXP - lifetimeXP;

  // --- ADD THIS MOBILE HANDOFF RIGHT BEFORE THE DESKTOP RETURN ---
  if (isMobile) {
    return (
      <XPLevelsPageMobile 
        userLevel={userLevel}
        lifetimeXP={lifetimeXP}
        nextLevelXP={nextLevelXP}
        remainingXP={remainingXP}
        currentStreak={currentStreak}
        pct={pct}
        dailyQuests={dailyQuests}
        featuredCampaigns={featuredCampaigns}
        handleQuestAction={handleQuestAction}
        setSelectedCampaign={setSelectedCampaign}
        userSubmissions={userSubmissions}
        formatTimeLeft={formatTimeLeft}
        getBrandConfig={getBrandConfig}
        claimingDaily={claimingDaily}
        verifyingTask={verifyingTask}
      />
    );
  }
  // -------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">SAIL &amp; Levels</h1>
              <Info className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-slate-500 mt-1 text-sm">Track your progress, earn SAIL and level up to unlock exclusive rewards.</p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Clock className="w-4 h-4" /> SAIL History <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Top banners */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl p-8 text-white bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 shadow-lg shadow-blue-900/20">
            <Anchor className="absolute right-72 top-6 w-8 h-8 text-white/20" />
            <Sparkles className="absolute right-40 top-4 w-5 h-5 text-white/30" />
            <Sparkles className="absolute right-24 bottom-10 w-4 h-4 text-white/30" />

            <div className="flex items-center gap-10 relative">
              <div className="relative w-[180px] h-[180px] flex-shrink-0">
                <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
                  <circle cx="90" cy="90" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
                  <circle cx="90" cy="90" r={r} stroke="url(#ringG)" strokeWidth="10" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#7dd3fc" /><stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-black">{userLevel}</div>
                  <div className="text-xs uppercase tracking-widest text-white/70">Level</div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">{lifetimeXP.toLocaleString()}</span>
                  <span className="text-white/60 font-medium">/ {nextLevelXP.toLocaleString()} SAIL</span>
                </div>
                <p className="text-white/70 mt-1 text-sm">{remainingXP.toLocaleString()} SAIL to reach Level {userLevel + 1}</p>
                <div className="mt-3 h-2 w-full max-w-[280px] bg-white/15 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-300 to-violet-400" style={{ width: `${pct * 100}%` }} />
                </div>
                <div className="flex gap-8 mt-6">
                  <div>
                    <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" /><span className="text-2xl font-black">{currentStreak}</span></div>
                    <div className="text-xs text-white/70 mt-1">Day Streak</div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex-shrink-0 drop-shadow-2xl -mr-8">
                <img src={openChestImg} alt="SAIL Chest" className="w-64 h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl p-6 text-white bg-gradient-to-br from-blue-600 to-blue-500 shadow-md shadow-blue-500/20">
            <Sparkles className="absolute right-6 top-6 w-5 h-5 text-yellow-300/80" />
            <Sparkles className="absolute right-20 bottom-10 w-4 h-4 text-yellow-300/60" />
            <div className="text-sm text-white/80">Next Level Reward</div>
            <div className="text-3xl font-black mt-1">Level {userLevel + 1}</div>

            <div className="absolute -right-4 top-2 drop-shadow-2xl">
              <img src={trophyImg} alt="Level Trophy" className="w-48 h-auto object-contain" />
            </div>

            <div className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-3 flex items-center gap-3 max-w-[230px]">
              <div className="w-9 h-9 rounded-lg bg-yellow-400/90 flex items-center justify-center"><Award className="w-5 h-5 text-yellow-900" /></div>
              <div><div className="text-xs text-white/70">Exclusive Badge</div><div className="text-sm font-bold">100 SAIL Bonus</div></div>
            </div>
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Daily Tasks</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Complete daily tasks to earn SAIL and climb the leaderboard!</p>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x">
            {dailyQuests.map((task) => {
              
              // Resolve Button Text
              let btnText = task.buttonText;
              if (task.isPending) {
                btnText = 'Pending Approval';
              } else if (task.completed) {
                if (task.system_action_id === 'daily_checkin') btnText = 'Claimed';
                else if (task.isOnCooldown) btnText = 'On Cooldown';
                else btnText = 'Completed';
              }

              return (
                <div key={task.id} className="snap-start min-w-[160px] max-w-[160px] bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center relative shrink-0 shadow-sm hover:shadow-md transition-shadow">
                  {task.completed && !task.isPending && (
                    <div className="absolute top-3 right-3 bg-emerald-500 rounded-full p-0.5 shadow-sm">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                  {task.isPending && (
                    <div className="absolute top-3 right-3 bg-amber-400 rounded-full p-0.5 shadow-sm">
                      <Clock className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                  
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${task.iconBg}`}>
                    {task.uiIcon && <task.uiIcon className={`w-6 h-6 ${task.iconColor}`} />}
                  </div>
                  <div className="font-bold text-sm text-slate-900 leading-tight h-10 flex items-start justify-center">{task.title}</div>
                  <div className="text-blue-600 font-black text-xs mb-4">+{task.reward_sail} SAIL</div>
                  
                  <button 
                    onClick={() => handleQuestAction(task)}
                    disabled={task.completed || task.isPending || (task.system_action_id === 'daily_checkin' && claimingDaily) || verifyingTask}
                    className={`mt-auto w-full py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      task.completed || task.isPending 
                        ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed' 
                        : task.buttonStyle === 'outline' 
                          ? 'border-2 border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 bg-white' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                    }`}
                  >
                    {claimingDaily && task.system_action_id === 'daily_checkin' ? '...' : btnText}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Featured Campaigns */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Featured Campaigns</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Explore exclusive campaigns and earn big rewards.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {featuredCampaigns.slice((currentPage - 1) * 15, currentPage * 15).map((camp) => {
              const { icon: BrandIcon, color: brandColor } = getBrandConfig(camp.brand_name);
              return (
              <div 
                key={camp.id} 
                onClick={() => {
                  if (!user) {
                    alert("Please sign in to view and complete this campaign!");
                    login();
                    return;
                  }
                  setSelectedCampaign(camp);
                }}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col relative shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
              >
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-50 rounded-full opacity-60 group-hover:scale-110 group-hover:bg-blue-50/50 transition-all duration-500 pointer-events-none"></div>

                {userSubmissions[camp.id] && (
                  <div className="absolute top-3 right-3 z-20">
                    {userSubmissions[camp.id] === 'pending' && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded border border-amber-200 shadow-sm">Pending ⏳</span>}
                    {userSubmissions[camp.id] === 'approved' && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded border border-emerald-200 shadow-sm">Completed ✅</span>}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <BrandIcon className={`w-4 h-4 ${brandColor}`} strokeWidth={2.5} />
                  <span className={`font-black text-xs tracking-tight uppercase ${brandColor}`}>{camp.brand_name}</span>
                </div>

                <div className="font-bold text-slate-900 text-sm mb-1 relative z-10 truncate">{camp.title}</div>
                <div className="text-[10px] text-slate-500 leading-snug mb-3 relative z-10 line-clamp-2">{camp.description}</div>

                <div className="mb-4 relative z-10">
                  <span className="inline-flex bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-md border border-blue-100 shadow-sm">+{camp.reward_sail} SAIL</span>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-semibold text-slate-500 relative z-10">
                  <span>Ends in {formatTimeLeft(camp.end_date)}</span>
                </div>
              </div>
            )})}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-8">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="w-4 h-4 rotate-180" /></button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 rounded-lg text-sm font-bold ${currentPage === i+1 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{i+1}</button>
            ))}
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* RE-USABLE PROOF MODAL */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setSelectedCampaign(null)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div><h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{selectedCampaign.title}</h3></div>
              <button onClick={() => setSelectedCampaign(null)} disabled={isSubmitting} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="mb-6"><div className="bg-slate-50 rounded-2xl p-4 text-sm font-medium text-slate-700">{selectedCampaign.guide_text || selectedCampaign.description}</div></div>
              <div className="border-t border-slate-100 pt-6">
                {!userSubmissions[selectedCampaign.id] && (
                  <>
                    <h4 className="text-xs font-black uppercase text-slate-400 mb-3">Submit Proof</h4>
                    
                    {/* Check if image upload is needed */}
                    {selectedCampaign.proof_required_type === 'image' && (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 relative hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 text-slate-400 mb-3" />
                        <div className="text-sm font-bold text-slate-700">Click to upload screenshot</div>
                        <div className="text-xs text-slate-500 mt-1 text-center">PNG, JPG, or WEBP (Max 5MB)</div>
                        {proofFile && (
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl p-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                              <Check className="w-6 h-6 text-blue-600 stroke-[3]" />
                            </div>
                            <div className="text-sm font-bold text-slate-900 truncate w-full text-center">{proofFile.name}</div>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => setProofFile(e.target.files[0])} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                      </div>
                    )}

                    {/* Check if URL input is needed */}
                    {selectedCampaign.proof_required_type === 'url' && (
                      <input type="url" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="Paste link..." />
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={handleCampaignSubmit}
                disabled={isSubmitting || userSubmissions[selectedCampaign.id]}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md"
              >
                {isSubmitting ? 'Uploading...' : userSubmissions[selectedCampaign.id] === 'pending' ? 'Pending' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}