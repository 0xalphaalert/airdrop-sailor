// src/mobile/pages/SubscriptionPageMobile.jsx
import React, { useState } from 'react';
import { 
  CheckCircle2, Crown, ShieldCheck, ArrowRight, 
  Calendar, Sparkles, Clock, Flame, Plus, Minus,
  Zap, Gem, Target, TrendingUp, Tag
} from 'lucide-react';
import MobileHeader from '../components/navigation/MobileHeader';
import BottomNavigation from '../components/navigation/BottomNavigation';
import heroGraphic from '../../assets/sailor-pass-hero.png'; // Adjust path if needed

export default function SubscriptionPageMobile({
  activeTier,
  timeLeft,
  isPassActive,
  handleCheckout,
  isProcessing,
  faqs
}) {
  const [selectedPlan, setSelectedPlan] = useState("1_month");
  const [openFaq, setOpenFaq] = useState(null);

  // Custom mobile icons for the grid based on the design
  const mobileUnlocks = [
    { icon: <Target className="w-5 h-5 text-purple-500" />, title: "NFT Whitelists", bg: "bg-purple-50" },
    { icon: <Zap className="w-5 h-5 text-amber-500" />, title: "FCFS Access", bg: "bg-amber-50" },
    { icon: <Crown className="w-5 h-5 text-orange-500" />, title: "OG Role Access", bg: "bg-orange-50" },
    { icon: <Gem className="w-5 h-5 text-emerald-500" />, title: "Reward Chests", bg: "bg-emerald-50" },
    { icon: <Tag className="w-5 h-5 text-rose-500" />, title: "Partner Coupons", bg: "bg-rose-50" },
    { icon: <TrendingUp className="w-5 h-5 text-blue-500" />, title: "Premium Analytics", bg: "bg-blue-50" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] pb-32 font-sans selection:bg-blue-100">
      <MobileHeader />

      <main className="w-full px-4 pt-4">
        
        {/* PAGE TITLE */}
        <div className="flex items-center gap-x-2 mb-4">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Sailor Pass</h1>
          {isPassActive && (
            <div className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full gap-x-1">
              <CheckCircle2 className="w-3 h-3" /> Active {activeTier}
            </div>
          )}
        </div>

        {/* HERO BANNER */}
        <div className="bg-gradient-to-br from-[#eef1ff] to-[#e6efff] border border-slate-100 rounded-3xl p-5 relative overflow-hidden mb-8 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black leading-tight tracking-tighter mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Unlock Exclusive<br />Web3 Opportunities
              </span>
            </h2>
            <p className="text-[13px] text-slate-600 font-medium leading-relaxed max-w-[280px]">
              Access NFT whitelists, FCFS token launches, partner rewards & the SAIL marketplace — all in one membership.
            </p>

            <div className="flex justify-end -mt-4 mb-2 relative z-0">
              {/* Fallback box if image isn't loaded */}
              <img src={heroGraphic} alt="Sailor Pass" className="w-[140px] drop-shadow-xl" onError={(e) => e.target.style.display='none'} />
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
              {["NFT Whitelists", "FCFS Access", "SAIL Market", "OG Role Access", "Reward Chests", "Partner Coupons"].map(label => (
                <div key={label} className="flex items-center gap-x-1 bg-white/80 backdrop-blur rounded-lg px-2 py-1 shadow-sm border border-white text-[9px] font-bold text-slate-700">
                  <span className="w-1 h-1 rounded-full bg-blue-500 inline-block"></span>
                  {label}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap relative z-10">
              <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-md px-2 py-1 text-[9px] font-bold text-red-700">
                <Flame className="w-3 h-3" /> Season 1 ending soon
              </div>
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 text-[9px] font-bold text-amber-700">
                <Clock className="w-3 h-3" /> 42 whitelist spots left
              </div>
            </div>
          </div>
        </div>

        {/* WHAT YOU UNLOCK (Mobile Grid) */}
        <div className="mb-8">
          <h3 className="text-lg font-black tracking-tight text-slate-900 mb-1">What You Unlock</h3>
          <p className="text-slate-500 text-[11px] mb-4">Every Sailor Pass member gets immediate access.</p>
          
          <div className="grid grid-cols-3 gap-3">
            {mobileUnlocks.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-2">
                <div className={`w-12 h-12 rounded-2xl ${item.bg} border border-slate-100 flex items-center justify-center shadow-sm`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-tight">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHOOSE YOUR PASS */}
        <div className="mb-8">
          <h3 className="text-lg font-black tracking-tight text-slate-900 mb-1">Choose Your Pass</h3>
          
          {/* Pay with Crypto Bar */}
          <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3 py-2.5 mb-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500">Pay with any crypto token</span>
            <div className="flex items-center gap-1.5">
               {/* Tiny crypto placeholder circles mimicking icons */}
               <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[7px] text-white font-black">E</div>
               <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[7px] text-white font-black">U</div>
               <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center text-[7px] text-white font-black">S</div>
               <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[7px] text-white font-black">B</div>
               <span className="text-[9px] font-bold text-slate-400 ml-1">+20</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Explorer Pass — 1 Month */}
            <div
              onClick={() => setSelectedPlan("1_month")}
              className={`relative bg-white border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                selectedPlan === "1_month" ? "border-indigo-600 shadow-md" : "border-slate-200"
              }`}
            >
              <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                Most Popular
              </div>
              
              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">Explorer Pass</div>
                    <div className="text-[10px] text-slate-400">Monthly membership</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 leading-none">$2</div>
                  <div className="text-[9px] text-slate-400 mt-1">/ month</div>
                </div>
              </div>

              <ul className="grid grid-cols-2 gap-y-2 gap-x-1 mb-5 border-t border-slate-50 pt-4">
                {["SAIL Market access", "NFT whitelist", "FCFS token access", "Reward chest", "Partner coupons"].map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[10px] font-medium text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" /> <span className="leading-tight">{f}</span>
                  </li>
                ))}
              </ul>

              {isPassActive && activeTier === "Explorer Pass" ? (
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Active Pass</span>
                  {timeLeft && <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">{timeLeft} left</span>}
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCheckout("1_month"); }}
                  disabled={isProcessing || isPassActive}
                  className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all ${
                    isPassActive ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  }`}
                >
                  {isProcessing && selectedPlan === "1_month" ? 'Generating...' : 'Get Explorer Pass'}
                  {!isProcessing && !isPassActive && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Voyager Pass — 3 Months */}
            <div
              onClick={() => setSelectedPlan("3_months")}
              className={`relative bg-white border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                selectedPlan === "3_months" ? "border-emerald-500 shadow-md" : "border-slate-200"
              }`}
            >
              <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                Best Value
              </div>
              
              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">Voyager Pass</div>
                    <div className="text-[10px] text-slate-400">3-month membership</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 leading-none">$5</div>
                  <div className="text-[9px] text-slate-400 mt-1">/ 3 months</div>
                </div>
              </div>

              <ul className="grid grid-cols-2 gap-y-2 gap-x-1 mb-5 border-t border-slate-50 pt-4">
                {["Everything in Explorer", "Priority FCFS", "Triple SAIL bonus", "Exclusive campaigns", "Seasonal reward chest"].map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[10px] font-medium text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" /> <span className="leading-tight">{f}</span>
                  </li>
                ))}
              </ul>

              {isPassActive && activeTier === "Voyager Pass" ? (
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Active Pass</span>
                  {timeLeft && <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">{timeLeft} left</span>}
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCheckout("3_months"); }}
                  disabled={isProcessing || isPassActive}
                  className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all ${
                    isPassActive ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white shadow-md'
                  }`}
                >
                  {isProcessing && selectedPlan === "3_months" ? 'Generating...' : 'Get Voyager Pass'}
                  {!isProcessing && !isPassActive && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Cancel anytime · No hidden fees</span>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-6">
          <h3 className="text-lg font-black tracking-tight text-slate-900 mb-1">FAQ</h3>
          <div className="space-y-2 mt-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between text-left px-4 py-3 gap-3"
                >
                  <span className="font-bold text-slate-900 text-[11px]">{faq.q}</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${openFaq === i ? 'bg-blue-600' : 'bg-slate-100'}`}>
                    {openFaq === i ? <Minus className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-slate-500" />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3">
                    <p className="text-slate-500 leading-relaxed text-[11px]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>

      <BottomNavigation />
    </div>
  );
}
