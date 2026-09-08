// src/mobile/pages/XPLevelsPageMobile.jsx
import React from 'react';
import { 
  Info, Clock, ArrowRight, Flame, Check, 
  ChevronRight, Award 
} from 'lucide-react';
import MobileHeader from '../components/navigation/MobileHeader';
import BottomNavigation from '../components/navigation/BottomNavigation';
import openChestImg from '../../assets/chest-open.png'; 
import trophyImg from '../../assets/trophy.png'; 

export default function XPLevelsPageMobile({
  userLevel,
  lifetimeXP,
  nextLevelXP,
  remainingXP,
  currentStreak,
  pct,
  dailyQuests,
  handleQuestAction,
  claimingDaily,
  verifyingTask,
  user
}) {
  
  // Mobile-specific circle sizing
  const r = 36;
  const c = 2 * Math.PI * r;

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] font-sans selection:bg-blue-100 pb-32">
      
      <MobileHeader />

      <main className="w-full px-4 pt-4">
        
        {/* PAGE HEADER */}
        <div className="flex items-start justify-between mb-5">
          <div className="pr-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
  Earn Sail <Info className="w-4 h-4 text-slate-400" />
</h1>
            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-snug">
              Track your progress, earn SAIL and level up to unlock exclusive rewards.
            </p>
          </div>
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shrink-0 shadow-sm active:bg-slate-50 transition-colors">
            <Clock className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-[10px] font-bold text-slate-700">SAIL History</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* HERO CARD 1: CURRENT PROGRESS */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 rounded-3xl p-5 relative overflow-hidden mb-4 shadow-lg shadow-blue-900/10">
          <div className="absolute top-4 right-20 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-6 right-40 w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="relative w-[84px] h-[84px] shrink-0">
              <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
                <circle cx="42" cy="42" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="6" fill="none" />
                <circle cx="42" cy="42" r={r} stroke="url(#ringG_mobile)" strokeWidth="6" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                <defs>
                  <linearGradient id="ringG_mobile" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7dd3fc" /><stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-black text-white leading-none">{userLevel}</div>
                <div className="text-[7px] uppercase tracking-widest text-white/70 mt-0.5">Level</div>
              </div>
            </div>

            <div className="flex-1 pt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{lifetimeXP.toLocaleString()}</span>
                <span className="text-[10px] text-white/60 font-medium">/ {nextLevelXP.toLocaleString()} SAIL</span>
              </div>
              <p className="text-white/80 text-[10px] mt-1">{remainingXP.toLocaleString()} SAIL to reach Level {userLevel + 1}</p>
              
              <div className="mt-2 h-1.5 w-[120px] bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-300 to-violet-400" style={{ width: `${pct * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between mt-4 relative z-10">
            <div className="pl-2">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-lg font-black text-white">{currentStreak}</span>
              </div>
              <div className="text-[9px] text-white/70 ml-1">Day Streak</div>
            </div>
          </div>

          <img src={openChestImg} alt="Chest" className="absolute -right-2 -bottom-2 w-[140px] object-contain drop-shadow-xl" onError={(e) => e.target.style.display='none'} />
        </div>

        {/* HERO CARD 2: NEXT REWARD */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 relative overflow-hidden mb-6 shadow-sm">
          <div className="relative z-10">
            <div className="text-[10px] text-white/80 font-bold tracking-wide">Next Level Reward</div>
            <div className="text-2xl font-black text-white mt-0.5">Level {userLevel + 1}</div>
            
            <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-2.5 flex items-center gap-2.5 max-w-[180px] border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-yellow-400/90 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-yellow-900" />
              </div>
              <div>
                <div className="text-[9px] text-white/80 font-medium">Exclusive Badge</div>
                <div className="text-[11px] font-bold text-white">100 SAIL Bonus</div>
              </div>
            </div>
          </div>
          
          <img src={trophyImg} alt="Trophy" className="absolute -right-4 top-2 w-[120px] object-contain drop-shadow-2xl" onError={(e) => e.target.style.display='none'} />
        </div>

        {/* DAILY TASKS (Horizontal Scroll) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Daily Tasks</h2>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">Complete daily tasks to earn SAIL</p>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x">
            {dailyQuests.map((task) => {
              let btnText = task.buttonText;
              if (task.isPending) btnText = 'Pending';
              else if (task.completed) {
                if (task.system_action_id === 'daily_checkin') btnText = 'Claimed';
                else if (task.isOnCooldown) btnText = 'Cooldown';
                else btnText = 'Completed';
              }

              return (
                <div key={task.id} className="snap-start min-w-[120px] w-[120px] bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shrink-0 shadow-sm active:scale-95 transition-transform relative">
                  
                  {task.completed && !task.isPending && (
                    <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </div>
                  )}
                  {task.isPending && (
                    <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-0.5">
                      <Clock className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </div>
                  )}
                  
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${task.iconBg}`}>
                    {task.uiIcon && <task.uiIcon className={`w-5 h-5 ${task.iconColor}`} />}
                  </div>
                  
                  <div className="font-bold text-[11px] text-slate-900 leading-tight h-8 flex items-start justify-center">{task.title}</div>
                  <div className="text-blue-600 font-black text-[10px] mb-3">+{task.reward_sail} SAIL</div>
                  
                  <button 
                    onClick={() => handleQuestAction(task)}
                    disabled={task.completed || task.isPending || (task.system_action_id === 'daily_checkin' && claimingDaily) || verifyingTask}
                    className={`mt-auto w-full py-2 rounded-lg text-[10px] font-bold transition-all ${
                      task.completed || task.isPending 
                        ? 'bg-slate-50 text-slate-400 border border-slate-100' 
                        : task.buttonStyle === 'outline' 
                          ? 'border border-slate-200 text-slate-700 bg-white' 
                          : 'bg-blue-600 text-white shadow-sm'
                    }`}
                  >
                    {claimingDaily && task.system_action_id === 'daily_checkin' ? '...' : btnText}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* CPX RESEARCH OFFERWALL SECTION (Replaces Featured Campaigns on Mobile) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Earn More SAIL</h2>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">Complete offers & surveys to grow your balance</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            <iframe 
              width="100%" 
              frameBorder="0" 
              height="1800px"  
              src="https://offers.cpx-research.com/index.php?app_id=35858&ext_user_id={unique_user_id}&secure_hash={secure_hash}&subid_1=&subid_2="
              title="CPX Research Offerwall"
              className="w-full flex-1 border-0 rounded-2xl"
            />
          </div>
        </div>

      </main>

      <BottomNavigation />
    </div>
  );
}
