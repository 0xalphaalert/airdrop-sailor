// src/mobile/pages/MarketplacePageMobile.jsx
import React from 'react';
import {
  Trophy,
  ShieldCheck,
  Zap,
  Star,
  Flame,
  Sparkles,
  Gift,
  X,
  ExternalLink,
  Crown,
  Anchor,
  Box
} from 'lucide-react';
import MobilePageWrapper from '../components/layout/MobilePageWrapper';

export default function MarketplacePageMobile({
  active,
  setActive,
  tabs,
  items,
  purchasedItems,
  userBalance,
  activeTier,
  timeLeft,
  expiresAt,
  selectedItem,
  setSelectedItem,
  walletAddress,
  setWalletAddress,
  isProcessing,
  processingId,
  handleActionClick,
  executeTransaction,
  getSubUI,
  getCouponUI,
  getAirdropUI
}) {
  
  // Reusable sub-component for the category headers
  const SectionHeader = ({ title, desc }) => (
    <div className="mb-4 mt-8 px-1">
      <h3 className="text-[15px] font-black tracking-tight text-slate-900">{title}</h3>
      <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">{desc}</p>
    </div>
  );

  return (
    <MobilePageWrapper hidePadding={false}>
      
      {/* 1. TOP HEADER & BALANCE */}
      <div className="flex items-end justify-between mb-12 -mt-12">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Marketplace</h1>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5 max-w-[200px]">Redeem XP, grab exclusive offers and coupons.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm text-right shrink-0">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Your Balance</div>
          <div className="text-[15px] font-black text-blue-600 leading-none">{userBalance.toLocaleString()} <span className="text-[10px]">SAIL</span></div>
        </div>
      </div>

      {/* 2. SCROLLABLE TABS */}
      <div className="flex overflow-x-auto snap-x gap-2 pb-3 mb-4 scrollbar-hide -mx-4 px-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`snap-start shrink-0 px-4 py-2 rounded-xl text-[11px] font-black transition-all ${
              active === t
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 3. HERO BANNER */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight leading-tight mb-2">
            Exclusive Access.<br/>Premium Rewards.
          </h2>
          <p className="text-[11px] text-blue-100 font-medium max-w-[200px] mb-5">
            Subscriptions, NFTs, Coupons and Token Airdrops for active hunters.
          </p>
          
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Trophy, label: "Top Projects" },
              { icon: ShieldCheck, label: "Limited" },
              { icon: Zap, label: "Early Access" }
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-[9px] font-bold">
                <Icon className="w-3 h-3 text-blue-300" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. SUBSCRIPTIONS SECTION */}
      {(active === "All" || active === "Subscriptions") && (
        <section>
          <SectionHeader title="Subscriptions" desc="Unlock premium tools, analytics and exclusive benefits." />
          <div className="space-y-3">
            {items.filter(i => i.category === 'Subscriptions').map((s) => {
              const ui = getSubUI(s.title);
              const isLoading = isProcessing && processingId === s.id;
              const daysText = s.title.includes('Voyage') ? '90' : '30';
              
              const isPassActive = (activeTier === 'Sailor Pass' || activeTier === 'Voyager Pass') && 
                     expiresAt && new Date(expiresAt).getTime() > Date.now();
              
              return (
                <div key={s.id} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${ui.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      <ui.icon className={`w-5 h-5 ${ui.color}`} />
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-sm">{s.title}</div>
                      <div className="text-[10px] text-blue-600 font-bold">{s.cost_sail.toLocaleString()} SAIL / {daysText} Days</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mb-4">{s.description}</p>
                  
                  {isPassActive ? (
                    <button disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-[11px] font-black text-slate-400 flex items-center justify-center gap-2">
                      Active Pass
                      {timeLeft && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[9px] tracking-wider">{timeLeft}</span>}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleActionClick(s)} 
                      disabled={isLoading}
                      className="w-full bg-blue-50 border border-blue-100 hover:bg-blue-100 active:scale-95 transition-transform rounded-xl py-3 text-[11px] font-black text-blue-600 disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Upgrade Now'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. NFT OFFERS */}
      {(active === "All" || active === "NFT Offers") && (
        <section>
          <SectionHeader title="NFT Offers" desc="Exclusive NFT collections and whitelist spots." />
          <div className="grid grid-cols-2 gap-3">
            {items.filter(i => i.category === 'NFT Offers').map((n) => {
              const isOwned = purchasedItems.includes(n.id);
              const isLoading = isProcessing && processingId === n.id;
              return (
                <div key={n.id} className="bg-white border border-slate-100 rounded-3xl p-2.5 shadow-sm flex flex-col">
                  {n.banner_url ? (
                    <div className="h-24 rounded-2xl overflow-hidden bg-slate-100 mb-2">
                      <img src={n.banner_url} alt={n.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-2">🖼️</div>
                  )}
                  <div className="px-1 mb-3">
                    <div className="font-black text-slate-900 text-xs mb-0.5 truncate">{n.title}</div>
                    <div className="text-[9px] text-blue-600 font-bold">{n.cost_sail.toLocaleString()} SAIL</div>
                  </div>
                  <button 
                    onClick={() => handleActionClick(n)} 
                    disabled={isLoading}
                    className="mt-auto w-full border border-slate-200 rounded-xl py-2 text-[10px] font-bold text-slate-700 active:scale-95 transition-transform bg-slate-50 hover:bg-slate-100"
                  >
                    {isLoading ? 'Unlocking...' : isOwned ? 'View Link 🔓' : 'Claim FCFS'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. COUPONS */}
      {(active === "All" || active === "Coupons") && (
        <section>
          <SectionHeader title="Coupons" desc="Save more with exclusive partner coupons & rebates." />
          <div className="space-y-3">
            {items.filter(i => i.category === 'Coupons').map((c) => {
              const ui = getCouponUI(c.title);
              const isOwned = purchasedItems.includes(c.id);
              const isLoading = isProcessing && processingId === c.id;
              return (
                <div key={c.id} className="bg-white border border-slate-100 rounded-3xl p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${ui.bg} rounded-xl flex items-center justify-center font-black text-sm overflow-hidden shrink-0`}>
                      {c.project_logo_url ? <img src={c.project_logo_url} className="w-full h-full object-cover" alt="" /> : ui.letter}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-xs">{c.title}</div>
                      <div className="text-[10px] text-blue-600 font-bold">{c.cost_sail.toLocaleString()} SAIL</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleActionClick(c)} 
                    disabled={isLoading}
                    className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-700 active:scale-95 transition-transform"
                  >
                    {isLoading ? 'Wait...' : isOwned ? 'View 🔓' : 'Redeem'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. FCFS TOKEN AIRDROPS */}
      {(active === "All" || active === "Token Airdrops") && (
        <section>
          <SectionHeader title="FCFS Token Airdrops" desc="Limited token drops for active hunters." />
          <div className="space-y-3">
            {items.filter(i => i.category === 'Token Airdrops').map((a) => {
              const ui = getAirdropUI(a.title);
              const isOwned = purchasedItems.includes(a.id);
              return (
                <div key={a.id} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${ui.bg} rounded-full flex items-center justify-center font-black text-sm overflow-hidden border border-slate-100`}>
                        {a.project_logo_url ? <img src={a.project_logo_url} className="w-full h-full object-cover" alt="" /> : ui.letter}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm">{a.title}</div>
                        <div className="text-[10px] text-blue-600 font-bold">{a.cost_sail.toLocaleString()} SAIL</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mb-4">{a.description}</p>
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-bold text-orange-500 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                      <Flame className="w-3 h-3" /> FCFS
                    </div>
                    <button 
                      onClick={() => handleActionClick(a)}
                      disabled={isOwned}
                      className={`flex-1 rounded-xl py-2.5 text-[11px] font-black active:scale-95 transition-transform ${
                        isOwned 
                          ? 'border border-slate-200 text-slate-400 bg-slate-50'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      {isOwned ? 'Pending ⏳' : 'Claim Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[10px] text-slate-400 font-bold mt-5 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Rewards are limited. First come, first served!
          </p>
        </section>
      )}

      {/* ================= MOBILE MODAL (Pop-up from Bottom) ================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isProcessing && setSelectedItem(null)}></div>
          
          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 duration-300">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl sm:rounded-t-3xl">
              <h3 className="text-sm font-black text-slate-900 truncate pr-4">{selectedItem.title}</h3>
              <button 
                onClick={() => setSelectedItem(null)}
                disabled={isProcessing}
                className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-500 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 pb-8 sm:pb-5">
              
              {/* FLOW 1: Airdrop Address Collection */}
              {selectedItem.category === 'Token Airdrops' ? (
                <div>
                  <h4 className="text-[13px] font-black text-slate-900 mb-1">Receiving Address</h4>
                  <p className="text-[11px] text-slate-500 font-medium mb-4">You are spending <span className="font-bold text-blue-600">{selectedItem.cost_sail} SAIL</span>. Payments are distributed within an hour.</p>
                  
                  <div className="relative mb-4">
                    <input 
                      type="text"
                      placeholder="E.g. 0x123... or APTOS wallet"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  
                  <button 
                    onClick={() => executeTransaction(selectedItem, walletAddress)}
                    disabled={!walletAddress || isProcessing}
                    className="w-full py-3.5 bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-xs font-black active:scale-95 transition-transform shadow-md shadow-blue-600/20"
                  >
                    {isProcessing ? 'Processing Claim...' : 'Submit & Pay'}
                  </button>
                </div>
              ) : (
                
                /* FLOW 2: Revealed Link */
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Claim Guide</h4>
                  <div className="bg-slate-50 rounded-2xl p-4 text-[11px] font-medium text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100 mb-5">
                    {selectedItem.guide_text || "Follow the link below to redeem your item."}
                  </div>

                  {selectedItem.action_link && (
                    <button 
                      onClick={() => window.open(selectedItem.action_link, '_blank')}
                      className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-xs font-black active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md shadow-slate-900/20"
                    >
                      {selectedItem.category === 'Coupons' ? 'Use Coupon Link' : 'Go to Mint / Project'} 
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </MobilePageWrapper>
  );
}