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
  getAirdropUI,

  swapAmount,
  setSwapAmount,
  swapWallet,
  setSwapWallet,
  isSwapProcessing,
  handleSwapRequest,
  minimumSwapSail,
  formattedSwapUsdc,
  isPremiumActive
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
          <p className="text-[11px] font-medium text-slate-500 mt-0.5 max-w-[200px]">
  Spend SAIL to unlock premium access and exclusive rewards.
</p>
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
  Premium access and exclusive rewards for active sailors.
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
              const hasActiveSubscription =
  (activeTier === 'Explorer Pass' || activeTier === 'Voyager Pass') &&
  expiresAt &&
  new Date(expiresAt).getTime() > Date.now();
  <button 
  onClick={() => handleActionClick(s)} 
  disabled={isLoading}
  className="w-full bg-blue-50 border border-blue-100 hover:bg-blue-100 active:scale-95 transition-transform rounded-xl py-3 text-[11px] font-black text-blue-600 disabled:opacity-50"
>
  {isLoading
    ? 'Processing...'
    : hasActiveSubscription
      ? `Extend ${daysText} Days`
      : `Get ${daysText} Days`
  }
</button>
              
              
              
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
                  
                  <button 
  onClick={() => handleActionClick(s)} 
  disabled={isLoading}
  className="w-full bg-blue-50 border border-blue-100 hover:bg-blue-100 active:scale-95 transition-transform rounded-xl py-3 text-[11px] font-black text-blue-600 disabled:opacity-50"
>
  {isLoading ? 'Processing...' : `Get ${daysText} Days`}
</button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================= */}
{/* SAIL → USDC SWAP */}
{/* ========================================= */}

{(active === "All" || active === "Swap SAIL") && (
  <section>

    <SectionHeader
      title="Swap SAIL → USDC"
      desc="Convert your earned SAIL into USDC rewards."
    />

    {/* Conversion Rate */}
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-lg shadow-blue-900/10 mb-5">

      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-200 mb-3">
        Current Conversion Rate
      </div>

      <div className="flex items-end justify-between">

        <div>
          <div className="text-2xl font-black tracking-tight">
            3,500 SAIL
          </div>

          <div className="text-[10px] font-semibold text-blue-200 mt-1">
            = $1.00 USDC
          </div>
        </div>

        <div className="text-[9px] font-bold bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-blue-100">
          Processed within 7 days
        </div>

      </div>
    </div>


    {/* Withdrawal Benefits */}
    <div className="mb-3">

      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
        Withdrawal Benefits
      </div>

      <h3 className="text-[16px] font-black text-slate-900">
        Unlock better withdrawal limits
      </h3>

    </div>


    <div className="space-y-3">

      {/* FREE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">

        <div className="flex items-center justify-between mb-3">

          <div>
            <div className="text-sm font-black text-slate-900">
              Free Sailor
            </div>

            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Standard withdrawal access
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-black text-slate-900">
              $10
            </div>

            <div className="text-[9px] font-bold text-slate-400">
              MINIMUM
            </div>
          </div>

        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] font-bold text-blue-600">
          35,000 SAIL required
        </div>

      </div>


      {/* PREMIUM */}
      <div
        className={`bg-white rounded-2xl p-4 border ${
          isPremiumActive
            ? "border-blue-500 shadow-sm shadow-blue-100"
            : "border-slate-200"
        }`}
      >

        <div className="flex items-center justify-between mb-3">

          <div>
            <div className="flex items-center gap-2">

              <div className="text-sm font-black text-slate-900">
                Premium Sailor
              </div>

              {isPremiumActive && (
                <span className="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black">
                  ACTIVE
                </span>
              )}

            </div>

            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Active subscription benefit
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-black text-blue-600">
              $5
            </div>

            <div className="text-[9px] font-bold text-slate-400">
              MINIMUM
            </div>
          </div>

        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] font-bold text-blue-600">
          17,500 SAIL required
        </div>

      </div>


      {/* AMBASSADOR */}
      <div className="bg-white border border-purple-100 rounded-2xl p-4 opacity-90">

        <div className="flex items-center justify-between mb-3">

          <div>
            <div className="text-sm font-black text-slate-900">
              Ambassador
            </div>

            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Exclusive community benefit
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-black text-purple-600">
              $1
            </div>

            <div className="text-[9px] font-bold text-slate-400">
              MINIMUM
            </div>
          </div>

        </div>

        <div className="pt-3 border-t border-slate-100 text-[10px] font-black text-purple-500 uppercase tracking-wide">
          Coming Soon
        </div>

      </div>

    </div>


    {/* ========================================= */}
    {/* SWAP FORM */}
    {/* ========================================= */}

    <div className="mt-6 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">

      <div className="p-5 border-b border-slate-100">

        <div className="flex items-start justify-between gap-4">

          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">
              Withdrawal Request
            </div>

            <h3 className="text-[17px] font-black text-slate-900">
              Ready to redeem your SAIL?
            </h3>

            <p className="text-[10px] text-slate-500 font-medium mt-1">
              Convert SAIL into USDC and submit your request.
            </p>
          </div>

          <div className="shrink-0 text-right bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">

            <div className="text-[8px] font-black uppercase tracking-wider text-slate-400">
              Balance
            </div>

            <div className="text-sm font-black text-blue-600 mt-0.5">
              {userBalance.toLocaleString()} SAIL
            </div>

          </div>

        </div>

      </div>


      <div className="p-5 space-y-4">

        {/* YOU SEND */}
        <div>

          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 mb-2">
            You Send
          </div>

          <div className="relative">

            <input
              type="number"
              value={swapAmount}
              disabled={isSwapProcessing}
              onChange={(e) => setSwapAmount(e.target.value)}
              placeholder={`Minimum ${minimumSwapSail.toLocaleString()}`}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-16 text-sm font-black text-slate-900 outline-none focus:border-blue-500 disabled:opacity-50"
            />

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600">
              SAIL
            </span>

          </div>

          <div className="flex justify-between mt-1.5 text-[9px] font-medium text-slate-400">

            <span>
              Minimum withdrawal
            </span>

            <span>
              {minimumSwapSail.toLocaleString()} SAIL
            </span>

          </div>

        </div>


        {/* YOU RECEIVE */}
        <div>

          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 mb-2">
            You Receive
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">

            <div className="text-lg font-black text-emerald-700">
              ${formattedSwapUsdc}
            </div>

            <div className="text-[9px] font-bold text-emerald-600">
              USDC
            </div>

          </div>

        </div>


        {/* WALLET */}
        <div>

          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 mb-2">
            Receiving Wallet Address
          </div>

          <input
            type="text"
            value={swapWallet}
            disabled={isSwapProcessing}
            onChange={(e) => setSwapWallet(e.target.value)}
            placeholder="Enter your USDC receiving wallet address"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 disabled:opacity-50"
          />

        </div>


        {/* BUTTON */}
        <button
          onClick={handleSwapRequest}
          disabled={isSwapProcessing}
          className="w-full bg-slate-900 text-white rounded-xl py-3.5 text-[11px] font-black active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSwapProcessing
            ? "Processing Request..."
            : "Convert SAIL to USDC"
          }
        </button>


        <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">

          <span>
            SAIL is deducted only after successful request creation.
          </span>

          <span className="font-bold text-slate-500">
            Within 7 days
          </span>

        </div>

      </div>

    </div>

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