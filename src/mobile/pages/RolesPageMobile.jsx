// src/mobile/pages/RolesPageMobile.jsx
import React, { useState } from 'react';
import { 
  ChevronLeft, Info, Shield, Award, Anchor, Zap, 
  Crown, Star, Lock, CheckCircle2, TrendingUp, Calendar, Trophy
} from 'lucide-react';
import MobilePageWrapper from '../components/layout/MobilePageWrapper';

export default function RolesPageMobile({
  // Add props here to pass your real Supabase data later
  userLevel = 3,
  lifetimeXP = 22850,
  nextLevelXP = 50000,
  sybilScore = 75,
  activePass = 'Voyager Pass',
  sailBalance = 74440
}) {
  // View states: 'overview', 'all_roles', 'how_it_works'
  const [view, setView] = useState('overview');

  const xpPercentage = ((lifetimeXP / nextLevelXP) * 100).toFixed(1);

  // --- COMPONENT: SUB-HEADER ---
  const SubHeader = ({ title, onBack }) => (
    <div className="flex items-center justify-between mb-14 -mt-14">
      <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
        <ChevronLeft size={24} className="text-slate-800" />
      </button>
      <h1 className="text-lg font-black tracking-tight text-slate-900">{title}</h1>
      <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
        <Info size={20} className="text-blue-600" />
      </button>
    </div>
  );

  // ==========================================
  // VIEW 1: MAIN OVERVIEW (Screen 1)
  // ==========================================
  if (view === 'overview') {
    return (
      <MobilePageWrapper hidePadding={false}>
        <SubHeader title="Roles & Progress" onBack={() => window.history.back()} />

        {/* HERO CARD */}
        <div className="bg-[#0b1021] rounded-[32px] p-6 mb-8 relative overflow-hidden shadow-2xl shadow-blue-900/20">
          {/* Decorative Background Elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">
              <SparklesIcon /> Your Journey <SparklesIcon />
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-2">Captain</h2>
                <span className="bg-blue-600 border border-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-blue-600/30">
                  Progression Role
                </span>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-inner border-2 border-white/10 shrink-0">
                <Anchor className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-[11px] font-bold text-white mb-2">
                <span>{lifetimeXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP</span>
                <span>{xpPercentage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-blue-500 rounded-full relative" style={{ width: `${xpPercentage}%` }}>
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>Next Role: Elite Sailor</span>
                <span>{(nextLevelXP - lifetimeXP).toLocaleString()} XP to go</span>
              </div>
            </div>
          </div>
        </div>

        {/* YOUR ROLE SUMMARY GRID */}
        <div className="mb-8">
          <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 px-1">Your Role Summary</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Progression */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Progression</div>
              <div className="font-black text-slate-900 text-sm">Captain</div>
              <div className="text-[10px] text-slate-500 font-medium">Level 3 of 5</div>
            </div>
            
            {/* Trust */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Trust</div>
              <div className="font-black text-slate-900 text-sm">Trusted</div>
              <div className="text-[10px] text-slate-500 font-medium">Score: {sybilScore}/100</div>
            </div>

            {/* Subscription */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                <Crown className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Subscription</div>
              <div className="font-black text-slate-900 text-sm">{activePass}</div>
              <div className="text-[10px] text-slate-500 font-medium">Active</div>
            </div>

            {/* Performance */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center mb-3">
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Performance</div>
              <div className="font-black text-slate-900 text-sm">Advanced Farmer</div>
              <div className="text-[10px] text-slate-500 font-medium">Score: 92/100</div>
            </div>
          </div>

          {/* Leaderboard Banner */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <div className="font-black text-slate-900 text-sm">Top 10%</div>
                <div className="text-[10px] text-slate-600 font-medium">Leaderboard</div>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded relative z-10">Active</span>
          </div>
        </div>

        {/* OVERALL POWER */}
        <div className="mb-8 relative">
          <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 px-1">Overall Power</h3>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex justify-between items-center">
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1">{sailBalance.toLocaleString()}</div>
              <div className="text-xs text-slate-500 font-semibold mb-4">SAIL Balance</div>
              <button className="text-[11px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
                View Breakdown <ChevronLeft className="w-3 h-3 rotate-180" />
              </button>
            </div>
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl">
              🏆
            </div>
          </div>
        </div>

        {/* NEXT ROLE PREVIEW */}
        <div className="mb-8">
          <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 px-1">Next Role Preview</h3>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center">
                  <Anchor className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Elite Sailor</h4>
                  <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-indigo-500" /> 50,000 XP
                  </div>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180" />
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><Star className="w-3 h-3 text-slate-400" /> Higher Limits</li>
              <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><GiftIcon /> Premium Rewards</li>
              <li className="flex items-center gap-2 text-[11px] font-bold text-emerald-600"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Exclusive Access</li>
            </ul>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '45.7%' }}></div>
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-400">
              <span>22,850 / 50,000 XP</span>
              <span>45.7%</span>
            </div>
          </div>
        </div>

        {/* RECENT MILESTONES */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Recent Milestones</h3>
            <button className="text-[11px] font-bold text-blue-600 flex items-center gap-1">View All <ChevronLeft className="w-3 h-3 rotate-180" /></button>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 pb-2">
              
              <div className="relative pl-6">
                <div className="absolute -left-[17px] top-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                  <Star className="w-3 h-3 text-purple-600 fill-purple-600" />
                </div>
                <div className="font-black text-[13px] text-slate-900 mb-0.5">Reached Captain Role</div>
                <div className="text-[10px] text-slate-500 font-medium mb-1">10,000 XP</div>
                <div className="text-[9px] text-slate-400 font-bold">May 18, 2026</div>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-[17px] top-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                  <Shield className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="font-black text-[13px] text-slate-900 mb-0.5">Trust Improved</div>
                <div className="text-[10px] text-slate-500 font-medium mb-1">Score reached 75 (Trusted)</div>
                <div className="text-[9px] text-slate-400 font-bold">May 15, 2026</div>
              </div>

            </div>
          </div>
        </div>

        <button 
          onClick={() => setView('all_roles')}
          className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all mb-4"
        >
          View All Roles & Progress
        </button>

      </MobilePageWrapper>
    );
  }

  // ==========================================
  // VIEW 2: ALL ROLES & PROGRESS (Screen 2)
  // ==========================================
  if (view === 'all_roles') {
    return (
      <MobilePageWrapper hidePadding={false}>
        <SubHeader title="Roles & Progress" onBack={() => setView('overview')} />
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">All Roles & Progress</h3>

        {/* 1. PROGRESSION ROLE */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Info className="w-4 h-4 text-blue-600" />
            <h4 className="text-[13px] font-black text-blue-600 uppercase tracking-widest">1. Progression Role</h4>
          </div>
          <p className="text-xs text-slate-500 mb-4 px-1">Earn Tracker XP by completing tasks, campaigns and quests.</p>

          <div className="bg-white border border-slate-100 rounded-3xl p-3 shadow-sm space-y-2">
            
            <div className="p-3 border border-slate-100 bg-slate-50 rounded-2xl flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"><Award className="w-5 h-5 text-amber-600" /></div>
                <div><div className="font-black text-slate-900 text-sm">Legend</div><div className="text-[10px] text-slate-500 font-medium">150,000 XP</div></div>
              </div>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="p-3 border border-blue-200 bg-blue-50/50 rounded-2xl relative shadow-sm">
              <div className="absolute top-3 right-3 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">Current</div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md shadow-blue-600/30">
                  <Anchor className="w-5 h-5 text-white" />
                </div>
                <div><div className="font-black text-blue-900 text-sm">Captain</div><div className="text-[10px] text-blue-600 font-bold">10,000 XP</div></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                <span>22,850 / 50,000 XP</span>
                <span>45.7%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '45.7%' }}></div>
              </div>
            </div>

            <div className="p-3 border border-slate-100 bg-white rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><Anchor className="w-5 h-5 text-slate-400" /></div>
                <div><div className="font-black text-slate-900 text-sm">Explorer</div><div className="text-[10px] text-slate-500 font-medium">0 XP</div></div>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Completed</span>
            </div>

            <button onClick={() => setView('how_it_works')} className="w-full py-3 text-[11px] font-bold text-blue-600 hover:text-blue-700">How it works? &rarr;</button>
          </div>
        </div>

        {/* 2. TRUST ROLE */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Info className="w-4 h-4 text-blue-600" />
            <h4 className="text-[13px] font-black text-blue-600 uppercase tracking-widest">2. Trust Role</h4>
          </div>
          <p className="text-xs text-slate-500 mb-4 px-1">Improve your Sybil Score to build trust and unlock higher roles.</p>

          <div className="bg-white border border-slate-100 rounded-3xl p-3 shadow-sm space-y-2">
            <div className="p-3 border border-emerald-200 bg-emerald-50/50 rounded-2xl relative shadow-sm">
              <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">Current</div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center"><Shield className="w-5 h-5 text-emerald-600" /></div>
                <div><div className="font-black text-emerald-900 text-sm">Trusted</div><div className="text-[10px] text-emerald-600 font-bold">60 - 89</div></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                <span>75 / 100</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>

      </MobilePageWrapper>
    );
  }

  // ==========================================
  // VIEW 3: HOW ROLES WORK (Screen 3)
  // ==========================================
  if (view === 'how_it_works') {
    return (
      <MobilePageWrapper hidePadding={false}>
        <SubHeader title="Roles & Progress" onBack={() => setView('overview')} />
        
        <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 px-1">How Roles Work</h3>
        
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-6 mb-6">
          
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Earn & Progress</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">Complete quests, tasks and campaigns to earn Tracker XP and increase your level.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Build Trust</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">Improve your Sybil Score by maintaining a clean on-chain identity.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Unlock Benefits</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">Higher roles unlock better rewards, limits and exclusive features.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Stay Consistent</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">Keep your streak alive and stay active to climb the ranks.</p>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Anchor className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed font-medium mb-2">
              Your roles reflect your journey, contribution and consistency on AirdropSailor.
            </p>
            <p className="text-[11px] text-blue-700 font-black">
              The more active, trusted and valuable you are, the more you earn!
            </p>
          </div>

          <button className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Trophy className="w-4 h-4" /> View Leaderboard
          </button>
        </div>

      </MobilePageWrapper>
    );
  }
}

// Simple decorative SVG component for the Hero section
const SparklesIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor"/>
  </svg>
);

const GiftIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
    <polyline points="20 12 20 22 4 22 4 12"></polyline>
    <rect x="2" y="7" width="20" height="5"></rect>
    <line x1="12" y1="22" x2="12" y2="7"></line>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
  </svg>
);