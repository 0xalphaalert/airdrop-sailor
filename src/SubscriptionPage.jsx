import React, { useState, useEffect } from "react";
import { useAuth } from './useAuth';
import { supabase } from './supabaseClient';
import {
  CheckCircle2, Crown, ShieldCheck, ArrowRight,
  Calendar, Sparkles, Clock, Flame, Plus, Minus,
} from "lucide-react";

import heroGraphic from "./assets/sailor-pass-hero.png";

const getTimeRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const total = new Date(expiresAt).getTime() - Date.now();
  if (total <= 0) return null; 
  
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  return `${days}d ${hours}h remaining`;
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("1_month");
  const [openFaq, setOpenFaq] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // --- NEW: Universal Truth States ---
  const [activeTier, setActiveTier] = useState("Free");
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // 1. Fetch from Database
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('subscription_tier, subscription_expires_at')
          .eq('auth_id', user.id)
          .single();
          
        if (data) {
          setActiveTier(data.subscription_tier);
          setExpiresAt(data.subscription_expires_at);
        }
      }
    };
    fetchProfile();
  }, [user]);

  // 2. Keep Timer Ticking
  useEffect(() => {
    if (expiresAt) {
      setTimeLeft(getTimeRemaining(expiresAt));
      const interval = setInterval(() => {
        setTimeLeft(getTimeRemaining(expiresAt));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  // 3. The Master Lock
  const isPassActive = (activeTier === 'Sailor Pass' || activeTier === 'Voyager Pass') && 
                       expiresAt && new Date(expiresAt).getTime() > Date.now();

  const handleCheckout = async (plan) => {
    if (!user) return alert("Please log in first!");
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-nowpayments-invoice', {
        body: { plan_id: plan, user_id: user.id }
      });
      if (error) throw error;
      if (data && data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        throw new Error("Failed to generate checkout link.");
      }
    } catch (err) {
      console.error("Checkout Error:", err);
      alert("Checkout failed. Please try again later.");
      setIsProcessing(false);
    }
  };

  const faqs = [
    { q: "What is Sailor Pass?", a: "Sailor Pass is our premium membership that unlocks exclusive airdrops, NFT whitelists, FCFS token access, advanced analytics, and ecosystem reward chests." },
    { q: "Can I cancel anytime?", a: "Yes. You can cancel your subscription at any time from your account settings — no questions asked." },
    { q: "How does billing work?", a: "You're billed at the start of each cycle. Monthly plans renew every 30 days, 3-month plans renew every 90 days." },
    { q: "Will I be charged again?", a: "Your plan auto-renews unless cancelled before the end of the current billing cycle." },
    { q: "What payment methods are accepted?", a: "We accept crypto payments including ETH, USDC, SOL, BNB, MATIC, and BASE ETH via our secure payment partner." },
  ];

  const unlocks = [
    { icon: "🎯", title: "NFT Whitelists", desc: "Get guaranteed early whitelist spots on high-signal partner project launches — before they open to the public." },
    { icon: "⚡", title: "FCFS Token Access", desc: "Claim priority access to new token launches via first-come-first-served windows reserved exclusively for members." },
    { icon: "🎁", title: "Reward Chests", desc: "Open seasonal reward chests containing NFTs, tokens, and exclusive partner surprises each season." },
    { icon: "👑", title: "OG Role Access", desc: "Receive verified OG status and community role assignments across partner Discord servers and ecosystems." },
    { icon: "📊", title: "Premium Analytics", desc: "Unlock advanced wallet analytics, campaign performance tracking, and cross-chain portfolio insights." },
    { icon: "🏷️", title: "Partner Coupons", desc: "Access exclusive fee discounts and protocol coupons from our growing roster of ecosystem partners." },
  ];

  return (
    <div className="px-8 py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-[1400px] mx-auto">

        {/* Page Title */}
        <div className="flex items-center gap-x-3 mb-1.5">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Sailor Pass</h1>
          {isPassActive && (
            <div className="inline-flex items-center px-3 h-7 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full gap-x-1.5">
              <CheckCircle2 className="w-4 h-4" /> Active {activeTier}
            </div>
          )}
        </div>
        

        {/* HERO BANNER */}
        <div className="mt-5 bg-gradient-to-r from-[#eef1ff] to-[#e6efff] border border-slate-100 rounded-3xl px-10 py-8 lg:px-14 lg:py-10 flex flex-col lg:flex-row gap-10 items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-40 w-48 h-48 bg-purple-400/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex-1 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold mb-3">
              <Sparkles className="w-3 h-3" /> Season 1 — Now Live
            </div>
            <h2 className="text-5xl lg:text-6xl font-black leading-tight tracking-tighter">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Unlock Exclusive<br />Web3 Opportunities
              </span>
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed font-medium max-w-xl">
              Access NFT whitelists, FCFS token launches, partner rewards & the SAIL marketplace — all in one membership.
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {["NFT Whitelists", "FCFS Token Access", "SAIL Marketplace", "Partner Coupons", "OG Role Access", "Reward Chests", "Early Ecosystem Access"].map(label => (
                <div key={label} className="flex items-center gap-x-1.5 bg-white/80 backdrop-blur rounded-xl px-3 py-1.5 shadow-sm border border-white text-xs font-semibold text-slate-700 hover:border-blue-200 transition-colors cursor-default">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 text-xs font-bold text-red-700">
                <Flame className="w-3 h-3" /> Season 1 ending soon
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 text-xs font-bold text-amber-700">
                <Clock className="w-3 h-3" /> 42 whitelist spots left
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end relative z-10">
            <img src={heroGraphic} alt="Sailor Pass" className="w-[320px] lg:w-[400px] drop-shadow-2xl" />
          </div>
        </div>

        {/* ── WHAT YOU UNLOCK ── */}
        <div className="mt-14">
          <div className="flex items-end justify-between mb-7">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">What You Unlock</h3>
              <p className="text-slate-500 text-sm mt-1">Every Sailor Pass member gets immediate access to these benefits.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocks.map((item) => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-2xl px-5 py-5 flex items-start gap-4 hover:shadow-md hover:border-slate-300 transition-all">
                <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-black text-slate-900 text-sm mb-1">{item.title}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CHOOSE YOUR PASS ── */}
        <div className="mt-14">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Choose Your Pass</h3>
            <p className="text-slate-500 text-sm mt-1.5">Simple, transparent pricing. Pay with any crypto token.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[1000px] mx-auto">
            {/* Explorer Pass — 1 Month */}
            <div
              onClick={() => setSelectedPlan("1_month")}
              className={`relative bg-white border-2 rounded-3xl p-7 cursor-pointer transition-all ${
                selectedPlan === "1_month"
                  ? "border-indigo-600 shadow-xl shadow-indigo-500/10"
                  : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
              }`}
            >
              <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                Most Popular
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-base font-black text-slate-900">Explorer Pass</div>
                  <div className="text-xs text-slate-400">Monthly membership</div>
                </div>
              </div>
              <div className="flex gap-7 mb-5">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="text-4xl font-black text-slate-900 leading-none">$1</div>
                  <div className="text-xs text-slate-400 mt-1">per month</div>
                </div>
                <ul className="space-y-2 flex-1">
                  {[
                    "SAIL Marketplace access",
                    "NFT whitelist eligibility",
                    "FCFS token claim access",
                    "Reward chest participation",
                    "Partner coupon rewards",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              {isPassActive ? (
                <button 
                  disabled={true}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 text-sm font-bold text-slate-500 cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Active Pass</span>
                  {timeLeft && (
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                      {timeLeft}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCheckout("1_month"); }}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isProcessing ? 'Generating Invoice...' : 'Get Explorer Pass'}
                  {!isProcessing && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Voyager Pass — 3 Months */}
            <div
              onClick={() => setSelectedPlan("3_months")}
              className={`relative bg-white border-2 rounded-3xl p-7 cursor-pointer transition-all ${
                selectedPlan === "3_months"
                  ? "border-indigo-600 shadow-xl shadow-indigo-500/10"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                Best Value
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-base font-black text-slate-900">Voyager Pass</div>
                  <div className="text-xs text-slate-400">3-month membership</div>
                </div>
              </div>
              <div className="flex gap-7 mb-5">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="text-4xl font-black text-slate-900 leading-none">$3</div>
                  <div className="text-xs text-slate-400 mt-1">3 months</div>
                </div>
                <ul className="space-y-2 flex-1">
                  {[
                    "Everything in Explorer Pass",
                    "Priority FCFS access windows",
                    "Triple SAIL streak bonus",
                    "Exclusive 3-month campaigns",
                    "Seasonal reward chest",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              {isPassActive ? (
                <button 
                  disabled={true}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 text-sm font-bold text-slate-500 cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Active Pass</span>
                  {timeLeft && (
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                      {timeLeft}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCheckout("3_months"); }}
                  disabled={isProcessing}
                  className="w-full bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isProcessing ? 'Generating Invoice...' : 'Get Voyager Pass'}
                  {!isProcessing && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Guarantee line */}
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>7-day refund guarantee &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; No hidden fees</span>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mt-14 mb-10">
          <div className="max-w-[820px] mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Frequently Asked Questions</h3>
              <p className="text-slate-500 text-sm mt-1.5">Everything you need to know about Sailor Pass.</p>
            </div>
            <div className="space-y-2.5">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-colors">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between text-left px-6 py-4 gap-4"
                  >
                    <span className="font-bold text-slate-900 text-sm">{faq.q}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openFaq === i ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                      {openFaq === i
                        ? <Minus className="w-3 h-3 text-white" />
                        : <Plus className="w-3 h-3 text-slate-500" />
                      }
                    </div>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4">
                      <p className="text-slate-500 leading-relaxed text-sm">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}