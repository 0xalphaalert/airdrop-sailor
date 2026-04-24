import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { 
  ArrowRight, Target, Zap, ShieldCheck, 
  Wallet, Search, CheckCircle2, BarChart3, Users, PlayCircle
} from 'lucide-react';

export default function LandingPage() {
  const { login } = usePrivy();

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* MINIMAL SAAS NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
                alt="AirdropSailor Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">AirdropSailor</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={login} className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </button>
            <button onClick={login} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm shadow-blue-600/20">
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* 🚀 HERO SECTION (Above the Fold) */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-slate-50/50">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left: Text Content */}
            <div className="max-w-2xl relative z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                The Ultimate Farming Assistant
              </div>
              
              <h1 className="text-5xl lg:text-[4rem] font-black tracking-tight leading-[1.1] mb-6 text-slate-900">
                Track, Score & Maximize Your <span className="text-blue-600">Airdrop Rewards</span>
              </h1>
              
              <p className="text-lg text-slate-500 font-medium mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Stop guessing. Discover high-value airdrops, track daily tasks, and avoid sybil risks — all in one clean dashboard.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button 
                  onClick={login}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
                >
                  Start Farming Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-base transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2">
                  <PlayCircle className="w-4 h-4 text-slate-400" />
                  View Demo
                </button>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-400">Used by serious Web3 farmers</p>
            </div>

            {/* Right: 3D Tilted Mockup */}
            <div className="relative w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 z-10 lg:pl-10">
              <div 
                className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl transition-transform duration-700 hover:transform-none"
                style={{ transform: 'perspective(1200px) rotateY(-12deg) rotateX(4deg) scale(1.05)', transformStyle: 'preserve-3d' }}
              >
                {/* Simulated Mac Window Header */}
                <div className="h-8 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex items-center px-4 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                </div>
                {/* 🚀 Replace this src with your actual uploaded screenshot URL if hosted, using a placeholder for now */}
                <img 
                  src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/lop.png" 
                  alt="AirdropSailor Dashboard" 
                  className="w-full h-auto rounded-b-2xl object-cover" 
                />
                
                {/* Floating UI Callouts */}
                <div className="absolute -left-12 top-20 bg-white px-4 py-3 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-blue-600" /></div>
                  <span className="text-sm font-bold text-slate-800">Daily Tasks Tracker</span>
                </div>
                <div className="absolute -right-8 bottom-24 bg-white px-4 py-3 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-emerald-600" /></div>
                  <span className="text-sm font-bold text-slate-800">Airdrop Scoring</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ⚙️ HOW IT WORKS (3 Steps) */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <Wallet className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Connect Wallet</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Securely connect and analyze your on-chain activity without exposing private keys.</p>
            </div>
            <div className="text-center relative">
              {/* Connector Line (Desktop only) */}
              <div className="hidden md:block absolute top-7 -left-1/2 w-full h-px bg-slate-200"></div>
              <div className="w-14 h-14 mx-auto bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm relative z-10">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Discover Airdrops</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Get ranked opportunities based on real signals, funding data, and social momentum.</p>
            </div>
            <div className="text-center relative">
              <div className="hidden md:block absolute top-7 -left-1/2 w-full h-px bg-slate-200"></div>
              <div className="w-14 h-14 mx-auto bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm relative z-10">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Complete Tasks</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Track and complete actions in your daily checklist without missing deadlines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 PRODUCT SHOWCASE SECTION */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
          
          {/* Block 1: Task Management (Text Left, Image Right) */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">Never miss a task again.</h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Track daily, weekly, and one-time actions across all your projects. AirdropSailor's Action Radar builds a personalized daily to-do list so you never forget to interact.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-[2rem] transform translate-x-4 translate-y-4"></div>
              <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/Capture.PNG" alt="Action Radar" className="relative rounded-[2rem] border border-slate-200 shadow-xl w-full object-cover" />
            </div>
          </div>

          {/* Block 2: Airdrop Scoring (Image Left, Text Right) */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-amber-100 rounded-[2rem] transform -translate-x-4 translate-y-4"></div>
              <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/Capture2.PNG" alt="Airdrop Scoring" className="relative rounded-[2rem] border border-slate-200 shadow-xl w-full object-cover" />
            </div>
            <div className="order-1 lg:order-2 lg:pl-10">
              <div className="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">Data-driven scoring.</h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Instantly identify which airdrops are worth your time. We analyze funding rounds, lead backers, and social sentiment to separate the signal from the noise.
              </p>
            </div>
          </div>

          {/* Block 3: Project Deep Dive (Text Left, Image Right) */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">Step-by-step guides.</h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Get exact farming guides, contract links, and detailed project insights for every airdrop. No more scouring Discord channels for the right bridge link.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-100 rounded-[2rem] transform translate-x-4 translate-y-4"></div>
              <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/Capture3.PNG" alt="Project Insights" className="relative rounded-[2rem] border border-slate-200 shadow-xl w-full object-cover" />
            </div>
          </div>

        </div>
      </section>

      {/* ⚡ CORE FEATURES SECTION (Cards) */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Built for precision.</h2>
            <p className="text-slate-500 font-medium mt-3">Everything you need to scale your farming operations safely.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Action Radar</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Track every task across all airdrops in one place. Never forget a daily check-in again.</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <BarChart3 className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Scoring</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Focus only on high-probability rewards. Stop wasting gas on tier-4 projects with no funding.</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sybil Protection</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Avoid mistakes that disqualify your wallet. Cross-reference your behavior with known sybil patterns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🛡️ TRUST / CREDIBILITY SECTION */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-blue-100 mb-10">Built for serious airdrop farmers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-blue-500/50">
            <div>
              <div className="text-4xl font-black tracking-tight mb-1">412+</div>
              <div className="text-blue-200 font-medium text-sm">Projects Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight mb-1">10k+</div>
              <div className="text-blue-200 font-medium text-sm">Tasks Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight mb-1">$2B+</div>
              <div className="text-blue-200 font-medium text-sm">Funding Monitored</div>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight mb-1">24/7</div>
              <div className="text-blue-200 font-medium text-sm">Real-time Intel</div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 FINAL CTA SECTION */}
      <section className="py-32 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-8">
            <img 
              src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
              alt="AirdropSailor Logo" 
              className="w-10 h-10 object-contain" 
            />
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Start Farming Smarter.
          </h2>
          <p className="text-xl text-slate-500 font-medium mb-10">
            Join users maximizing their airdrop rewards with better data and organization.
          </p>
          <button 
            onClick={login}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-blue-600/20"
          >
            Create Free Account
          </button>
        </div>
      </section>

    </div>
  );
}