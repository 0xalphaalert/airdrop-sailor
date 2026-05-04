import React, { useState, useEffect } from 'react';
import { Gift, Zap, ArrowRight, ShieldCheck, Search, Filter, TrendingUp, Wallet, ArrowDownUp, CheckCircle2 } from 'lucide-react';
// import { supabase } from './supabaseClient'; // Uncomment when ready to link to your DB

export default function ExchangeOffers() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Set to true when hooking up DB

  // MOCK DATA: Replace this with your actual Supabase fetch later
  const [offers, setOffers] = useState([
    {
      id: 1,
      exchange: 'Bybit',
      logo: 'https://cryptologos.cc/logos/bybit-logo.png',
      title: 'New User Exclusive Bonus',
      reward: 30000,
      rewardType: 'Up to $30,000',
      type: 'Deposit Match',
      requirements: ['Sign Up', 'Complete KYC Lv.1', 'Make First Deposit'],
      isHot: true,
      url: 'https://bybit.com'
    },
    {
      id: 2,
      exchange: 'Binance',
      logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
      title: 'Welcome Trading Fee Rebate',
      reward: 100,
      rewardType: '$100 Voucher',
      type: 'Trading Volume',
      requirements: ['Register', 'Trade $50+ Spot', 'Claim in Reward Center'],
      isHot: true,
      url: 'https://binance.com'
    },
    {
      id: 3,
      exchange: 'OKX',
      logo: 'https://cryptologos.cc/logos/okb-okb-logo.png',
      title: 'Mystery Box Unlock',
      reward: 50,
      rewardType: 'Up to 50 USDT',
      type: 'Sign Up',
      requirements: ['Download App', 'Log In', 'Open Mystery Box'],
      isHot: false,
      url: 'https://okx.com'
    },
    {
      id: 4,
      exchange: 'Bitget',
      logo: 'https://cryptologos.cc/logos/bitget-token-bgb-logo.png',
      title: 'Copy Trading Loss Protection',
      reward: 500,
      rewardType: '$500 Coverage',
      type: 'Trading',
      requirements: ['Follow Elite Trader', 'Enable Loss Protection'],
      isHot: false,
      url: 'https://bitget.com'
    }
  ]);

  // Filters setup
  const filterOptions = ['All', 'Sign Up', 'Deposit Match', 'Trading'];
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.exchange.toLowerCase().includes(searchQuery.toLowerCase()) || offer.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || offer.type.includes(activeFilter.replace(' ', ''));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] font-sans pb-20">
      
      {/* 🚀 PREMIUM HERO SECTION */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12 lg:py-16 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-black uppercase tracking-widest mb-6">
              <Gift size={14} /> Partnered Rewards
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Unlock Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Exchange Bonuses</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg mb-8 max-w-xl">
              Maximize your capital. We track the highest ROI sign-up bonuses, deposit matches, and trading rebates across top-tier centralized exchanges.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-white border border-slate-200 shadow-sm px-5 py-3 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Claimable</p>
                  <p className="text-xl font-black text-slate-900">$30,650+</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm px-5 py-3 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Offers</p>
                  <p className="text-xl font-black text-slate-900">12 Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 pt-10">
        
        {/* 🚀 SEARCH & FILTER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0" style={{ scrollbarWidth: 'none' }}>
            {filterOptions.map(option => (
              <button
                key={option}
                onClick={() => setActiveFilter(option)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeFilter === option 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search exchanges or offers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* 🚀 OFFERS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] hover:border-blue-200 transition-all duration-300 group flex flex-col justify-between">
              
              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <img src={offer.logo} alt={offer.exchange} className="w-12 h-12 rounded-full border border-slate-100 shadow-sm p-1 object-contain" />
                    <div>
                      <h3 className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{offer.exchange}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          <ShieldCheck size={10} className="text-emerald-500" /> Verified
                        </span>
                        {offer.isHot && (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                            <TrendingUp size={10} /> Trending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">Max Reward</p>
                    <p className="text-lg font-black text-emerald-700 leading-none">{offer.rewardType}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="mb-6">
                  <h4 className="text-base font-bold text-slate-800 mb-2">{offer.title}</h4>
                  <p className="text-sm text-slate-500 font-medium mb-4">Complete the following steps to unlock your exclusive rewards in the reward center.</p>
                  
                  {/* Steps Checklist */}
                  <div className="space-y-2.5 bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Action Plan</p>
                    {offer.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-black">{idx + 1}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <a 
                href={offer.url} 
                target="_blank" 
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Claim Bonus Now <ArrowRight size={16} />
              </a>
              
            </div>
          ))}

          {filteredOffers.length === 0 && (
            <div className="col-span-1 lg:col-span-2 py-20 text-center bg-white border border-slate-200 rounded-2xl border-dashed">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-700 mb-1">No offers found</h3>
              <p className="text-sm text-slate-500 font-medium">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}