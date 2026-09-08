import React, { useState, useEffect } from "react";
import { useAuth } from '../useAuth';
import { supabase } from '../supabaseClient';
import useIsMobile from '../hooks/useIsMobile';
import NotificationModal from '../components/NotificationModal';
import MarketplacePageMobile from '../mobile/pages/MarketplacePageMobile';
import {
  Sparkles,
  Crown,
  Zap,
  Trophy,
  Star,
  Gift,
  ShieldCheck,
  Flame,
  ChevronRight,
  Box,
  Anchor,
  X,
  ExternalLink
} from "lucide-react";
import treasure from "../assets/marketplace-treasure.png";


const tabs = ["All", "Subscriptions", "Swap SAIL"];

const getTimeRemaining = (expiresAt: string | null) => {
  if (!expiresAt) return null;
  // Use native getTime() to prevent browser parsing bugs
  const total = new Date(expiresAt).getTime() - Date.now();
  if (total <= 0) return null; 
  
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  return `${days}d ${hours}h remaining`;
};

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
      <button className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:underline">
        View All <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
      {children}
    </div>
  );
}

// Updated Button to support loading & disabled states without changing design
function PrimaryGhostBtn({ children, onClick, disabled }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="mt-4 w-full border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [active, setActive] = useState("All");
  const [items, setItems] = useState<any[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [activeTier, setActiveTier] = useState("Free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  
  // Modal & Processing States
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  // SAIL → USDC Swap States
const [swapAmount, setSwapAmount] = useState("");
const [swapWallet, setSwapWallet] = useState("");
const [isSwapProcessing, setIsSwapProcessing] = useState(false);
  const [notification, setNotification] = useState({
  isOpen: false,
  type: 'success',
  title: '',
  message: '',
  details: ''
});
const showNotification = ({
  type = 'success',
  title,
  message,
  details = ''
}) => {
  setNotification({
    isOpen: true,
    type,
    title,
    message,
    details
  });
};

const closeNotification = () => {
  setNotification(prev => ({
    ...prev,
    isOpen: false
  }));
};


  // Fetch from Supabase
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      // 1. Fetch Marketplace Items
      const { data: itemsData } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (itemsData) setItems(itemsData);

      if (user) {
        // 2. Fetch User Data (Upgraded)
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('lifetime_xp, subscription_tier, subscription_expires_at')
          .eq('auth_id', user.id)
          .single();
          
        if (profile) {
          setUserBalance(profile.lifetime_xp || 0);
          setActiveTier(profile.subscription_tier);
          setExpiresAt(profile.subscription_expires_at);
        }

        // 3. Fetch User's Purchase History (Ledger)
        const { data: ledger } = await supabase
          .from('xp_ledger')
          .select('reference_id')
          .eq('auth_id', user.id)
          .eq('action_type', 'marketplace_purchase');
        
        if (ledger) setPurchasedItems(ledger.map(l => l.reference_id));
      }
    };
    fetchMarketplaceData();
  }, [user]);

  // Keep the timer ticking visually every minute
  useEffect(() => {
    if (expiresAt) {
      setTimeLeft(getTimeRemaining(expiresAt));
      const interval = setInterval(() => {
        setTimeLeft(getTimeRemaining(expiresAt));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  // --- THE PURCHASE ENGINE ---
  const handleActionClick = async (item: any) => {
    if (!user) {
  showNotification({
  type: 'warning',
  title: 'Sign In Required',
  message: 'Please connect your wallet or sign in first.',
  details: [
    {
      label: 'Access',
      value: 'Authentication Required'
    }
  ]
});

  return;
}

    const alreadyBought = purchasedItems.includes(item.id);

    // FLOW 1: FCFS Token Airdrops (Data Collection)
    if (item.category === 'Token Airdrops') {
      if (alreadyBought) return alert("You have already claimed this airdrop! It is currently pending.");
      setSelectedItem(item); // Opens popup to ask for wallet BEFORE paying
      return;
    }

    // FLOW 2: NFTs & Coupons (Paywall)
    if (item.category === 'NFT Offers' || item.category === 'Coupons') {
      if (alreadyBought) {
        setSelectedItem(item); // Opens popup instantly (Free)
        return;
      }
      // Deduct SAIL first, then open popup
      await executeTransaction(item);
    }

    // FLOW 3: Subscriptions
if (item.category === 'Subscriptions') {
  await executeTransaction(item);
}
  };

  const executeTransaction = async (item, providedWallet = null) => {
  if (userBalance < item.cost_sail) {
  showNotification({
  type: 'error',
  title: 'Insufficient SAIL Balance',
  message: `You don't have enough SAIL to complete this purchase.`,
  details: [
    {
      label: 'Required',
      value: `${item.cost_sail.toLocaleString()} SAIL`
    },
    {
      label: 'Your Balance',
      value: `${userBalance.toLocaleString()} SAIL`
    }
  ]
});

  return;
}

  setIsProcessing(true);
  setProcessingId(item.id);

  try {

    // ==================================================
    // SUBSCRIPTION PURCHASE
    // ==================================================

    if (item.category === 'Subscriptions') {

      const { data, error } = await supabase.rpc(
        'purchase_subscription_with_sail',
        {
          p_auth_id: user.id,
          p_item_id: item.id
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      // Update SAIL balance
      setUserBalance(data.new_balance);

      // Update subscription UI
      setActiveTier(data.tier);

      // Refresh exact expiry date from database
      const { data: updatedProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_expires_at, lifetime_xp')
        .eq('auth_id', user.id)
        .single();

      if (!profileError && updatedProfile) {
        setActiveTier(updatedProfile.subscription_tier);
        setExpiresAt(updatedProfile.subscription_expires_at);
        setUserBalance(updatedProfile.lifetime_xp || 0);
      }

      showNotification({
  type: 'success',
  title: 'Subscription Activated!',
  message: `${data.tier} is now active for ${data.days_added} days.`,
  details: [
    {
      label: 'SAIL Spent',
      value: `${data.sail_spent.toLocaleString()} SAIL`
    },
    {
      label: 'Access Period',
      value: `${data.days_added} Days`
    }
  ]
});

      return;
    }


    // ==================================================
    // OTHER MARKETPLACE PURCHASES
    // ==================================================

    const { error: rpcError } = await supabase.rpc(
      'spend_sail_balance',
      {
        p_auth_id: user.id,
        p_amount: item.cost_sail,
        p_item_id: item.id
      }
    );

    if (rpcError) {
      throw new Error(
        "Failed to process transaction. " + rpcError.message
      );
    }


    // ==================================================
    // TOKEN AIRDROP
    // ==================================================

    if (item.category === 'Token Airdrops') {

      const { error: airdropError } = await supabase
        .from('airdrop_claims')
        .insert({
          auth_id: user.id,
          item_id: item.id,
          wallet_address: providedWallet,
          status: 'pending'
        });

      if (airdropError) {
        throw new Error(
          "Failed to save claim: " + airdropError.message
        );
      }

showNotification({
  type: 'success',
  title: 'Airdrop Claim Submitted!',
  message: 'Your claim has been successfully submitted.',
  details: [
    {
      label: 'Status',
      value: 'Processing'
    }
  ]
});

      setSelectedItem(null);
      setWalletAddress("");

    } else {

      // NFTs & Coupons
      setSelectedItem(item);

    }


    // Update normal marketplace UI
    setPurchasedItems(prev => [...prev, item.id]);

    setUserBalance(prev => prev - item.cost_sail);

  } catch (err) {

    console.error("Marketplace transaction error:", err);

showNotification({
  type: 'error',
  title: 'Transaction Failed',
  message: err.message,
  details: [
    {
      label: 'Status',
      value: 'Not Completed'
    }
  ]
});

  } finally {

    setIsProcessing(false);
    setProcessingId(null);

  }
};
// ==================================================
// SAIL → USDC SWAP REQUEST
// ==================================================

const handleSwapRequest = async () => {
  if (!user) {
    showNotification({
      type: 'warning',
      title: 'Sign In Required',
      message: 'Please sign in to submit a swap request.',
      details: []
    });
    return;
  }

  const amount = Number(swapAmount);

  if (!amount || amount <= 0) {
    showNotification({
      type: 'warning',
      title: 'Invalid Amount',
      message: 'Please enter a valid SAIL amount.',
      details: []
    });
    return;
  }

  if (amount < minimumSwapSail) {
    showNotification({
      type: 'warning',
      title: 'Minimum Swap Not Reached',
      message: `Your minimum swap amount is ${minimumSwapSail.toLocaleString()} SAIL.`,
      details: []
    });
    return;
  }

  if (amount > userBalance) {
    showNotification({
      type: 'error',
      title: 'Insufficient SAIL Balance',
      message: 'You do not have enough SAIL for this swap.',
      details: []
    });
    return;
  }

  if (!swapWallet || swapWallet.trim().length < 10) {
    showNotification({
      type: 'warning',
      title: 'Wallet Required',
      message: 'Please enter your receiving wallet address.',
      details: []
    });
    return;
  }

  setIsSwapProcessing(true);

  try {

    const { data, error } = await supabase.rpc(
      'request_sail_swap',
      {
        p_auth_id: user.id,
        p_sail_amount: amount,
        p_wallet_address: swapWallet.trim()
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    // Update SAIL balance
    setUserBalance(prev => prev - amount);

    // Clear form
    setSwapAmount("");
    setSwapWallet("");

    showNotification({
      type: 'success',
      title: 'Swap Request Submitted!',
      message: 'Your USDC withdrawal request has been successfully created.',
      details: [
        {
          label: 'SAIL Swapped',
          value: `${amount.toLocaleString()} SAIL`
        },
        {
          label: 'You Will Receive',
          value: `$${Number(data.usdc_amount).toFixed(2)} USDC`
        },
        {
          label: 'Processing Time',
          value: 'Within 7 Days'
        }
      ]
    });

  } catch (err: any) {

    console.error('SAIL swap error:', err);

    showNotification({
      type: 'error',
      title: 'Swap Request Failed',
      message: err.message || 'Unable to process your swap request.',
      details: []
    });

  } finally {

    setIsSwapProcessing(false);

  }
};
  // --- UI DECORATORS ---
  const getSubUI = (title) => {
    // Give Voyage the premium Crown, give Pass the Anchor
    if (title.includes('Voyage')) return { icon: Crown, color: "text-amber-500", bg: "bg-amber-50" };
    if (title.includes('Pass')) return { icon: Anchor, color: "text-blue-600", bg: "bg-blue-50" };
    return { icon: Zap, color: "text-emerald-500", bg: "bg-emerald-50" }; 
  };

  const getCouponUI = (title) => {
    if (title.includes('Binance')) return { letter: "B", bg: "bg-yellow-400 text-slate-900" };
    if (title.includes('Bybit')) return { letter: "BYB", bg: "bg-yellow-300 text-slate-900" };
    if (title.includes('OKX')) return { letter: "X", bg: "bg-black text-white" };
    return { letter: "G", bg: "bg-sky-500 text-white" }; 
  };

  const getAirdropUI = (title) => {
    if (title.includes('Aptos')) return { bg: "bg-slate-900 text-white", letter: "A" };
    if (title.includes('LayerZero')) return { bg: "bg-white border text-slate-900", letter: "L" };
    if (title.includes('Starknet')) return { bg: "bg-rose-50 text-rose-600", letter: "S" };
    return { bg: "bg-sky-50 text-sky-600", letter: "A" };
  };
  // ==================================================
// SAIL → USDC SWAP CALCULATIONS
// ==================================================

const isPremiumActive =
  expiresAt !== null &&
  new Date(expiresAt).getTime() > Date.now();

const minimumSwapSail = isPremiumActive
  ? 17500
  : 35000;

const swapUsdcAmount =
  Number(swapAmount || 0) / 3500;

const formattedSwapUsdc =
  swapUsdcAmount > 0
    ? swapUsdcAmount.toFixed(2)
    : "0.00";

  // --- ADD THIS MOBILE HANDOFF RIGHT BEFORE THE DESKTOP RETURN ---
  if (isMobile) {
  return (
    <>
      <MarketplacePageMobile
  active={active}
  setActive={setActive}
  tabs={tabs}
  items={items}
  purchasedItems={purchasedItems}
  userBalance={userBalance}
  activeTier={activeTier}
  timeLeft={timeLeft}
  expiresAt={expiresAt}
  selectedItem={selectedItem}
  setSelectedItem={setSelectedItem}
  walletAddress={walletAddress}
  setWalletAddress={setWalletAddress}
  isProcessing={isProcessing}
  processingId={processingId}
  handleActionClick={handleActionClick}
  executeTransaction={executeTransaction}
  getSubUI={getSubUI}
  getCouponUI={getCouponUI}
  getAirdropUI={getAirdropUI}

  swapAmount={swapAmount}
  setSwapAmount={setSwapAmount}
  swapWallet={swapWallet}
  setSwapWallet={setSwapWallet}
  isSwapProcessing={isSwapProcessing}
  handleSwapRequest={handleSwapRequest}
  minimumSwapSail={minimumSwapSail}
  formattedSwapUsdc={formattedSwapUsdc}
  isPremiumActive={isPremiumActive}
/>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        details={notification.details}
      />
    </>
  );
}
  // -------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 relative">
      <div className="max-w-[1200px] mx-auto">
        {/* Title & Balance */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Marketplace</h1>
            <p className="text-slate-500 mt-1">Redeem your XP, grab exclusive offers, coupons and more.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm text-right">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Your Balance</div>
            <div className="text-xl font-black text-blue-600 tabular">{userBalance.toLocaleString()} SAIL</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                active === t
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Hero */}
        <div className="mt-6 bg-gradient-to-r from-[#dbe7ff] to-[#e7eeff] border border-slate-100 rounded-3xl p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-8 overflow-hidden">
          <div className="flex-1">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
              Exclusive Access.{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Premium Rewards.
              </span>
            </h2>
            <p className="mt-3 text-slate-600 max-w-md">
              Subscriptions, NFTs, Coupons and Token Airdrops only for active hunters.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              {[
                { icon: Trophy, label: "Top Projects" },
                { icon: ShieldCheck, label: "Limited Offers" },
                { icon: Zap, label: "Early Access" },
                { icon: Star, label: "Premium Benefits" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-slate-100 text-sm">
                  <Icon className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            <img src={treasure} alt="Treasure" className="w-[300px] lg:w-[360px] drop-shadow-2xl" />
          </div>
        </div>

        {/* Subscriptions */}
        {(active === "All" || active === "Subscriptions") && (
        <section className="mt-10">
          <SectionHeader title="Subscriptions" desc="Unlock premium tools, analytics and exclusive benefits." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.filter(i => i.category === 'Subscriptions').map((s) => {
              const ui = getSubUI(s.title);
              const isLoading = isProcessing && processingId === s.id;
              const daysText = s.title.includes('Voyage') ? '90' : '30';
              
              // This is the master lock for the UI - NOW SUPPORTS BOTH TIERS
const isPassActive = (
  activeTier === 'Explorer Pass' ||
  activeTier === 'Voyager Pass'
) && 
                     expiresAt && new Date(expiresAt).getTime() > Date.now();
              
              return (
                <Card key={s.id}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${ui.bg} rounded-xl flex items-center justify-center`}>
                      <ui.icon className={`w-5 h-5 ${ui.color}`} />
                    </div>
                    <div className="font-bold text-slate-900">{s.title}</div>
                  </div>
                  <p className="text-sm text-slate-500 mt-3 flex-1">{s.description}</p>
                  <div className="mt-4 text-blue-600 font-bold tabular">
                    {s.cost_sail.toLocaleString()} <span className="text-slate-500 font-medium text-sm">SAIL / {daysText} Days</span>
                  </div>
                  
                  <PrimaryGhostBtn
  onClick={() => handleActionClick(s)}
  disabled={isLoading}
>
  {isLoading ? 'Processing...' : 'Buy Now'}
</PrimaryGhostBtn>
                </Card>
              );
            })}
          </div>
        </section>
        )}

        {/* ========================================================= */}
{/* SAIL → USDC SWAP */}
{/* ========================================================= */}

{(active === "All" || active === "Swap SAIL") && (
  <section className="mt-14">

    {/* ================================================ */}
    {/* SECTION INTRO */}
    {/* ================================================ */}

    <div className="mb-8">

      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-blue-600" />
        </div>

        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">
          Sail Rewards Exchange
        </span>
      </div>

      <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-950 leading-tight">
        Turn your{" "}
        <span className="text-blue-600">SAIL</span>{" "}
        into real rewards.
      </h2>

      <p className="mt-3 text-base text-slate-500 max-w-2xl leading-relaxed">
        Redeem your earned SAIL for USDC. Your withdrawal benefits improve
        as you unlock Premium access and future Ambassador rewards.
      </p>

    </div>


    {/* ================================================ */}
    {/* CONVERSION HERO */}
    {/* ================================================ */}

    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-7 lg:p-9 shadow-lg shadow-blue-200/40">

      {/* Decorative Background */}
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
      <div className="absolute right-24 bottom-0 w-32 h-32 rounded-full bg-indigo-400/20 blur-2xl"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

        {/* Left */}
        <div>

          <div className="flex items-center gap-2 text-blue-100">
            <Sparkles className="w-4 h-4" />

            <span className="text-[11px] font-black uppercase tracking-[0.2em]">
              Current Conversion Rate
            </span>
          </div>

          <div className="flex items-center gap-4 mt-5">

            <div>
              <div className="text-3xl lg:text-4xl font-black tracking-tight text-white">
                3,500
              </div>

              <div className="text-sm font-semibold text-blue-200 mt-1">
                SAIL
              </div>
            </div>

            <ChevronRight className="w-7 h-7 text-blue-300" />

            <div>
              <div className="text-3xl lg:text-4xl font-black tracking-tight text-white">
                $1.00
              </div>

              <div className="text-sm font-semibold text-blue-200 mt-1">
                USDC
              </div>
            </div>

          </div>

        </div>


        {/* Right */}
        <div className="lg:text-right">

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-3 backdrop-blur-sm">

            <ShieldCheck className="w-5 h-5 text-blue-100" />

            <div>
              <div className="text-sm font-bold text-white">
                Secure Manual Processing
              </div>

              <div className="text-xs text-blue-200 mt-0.5">
                Completed within 7 days
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>


    {/* ================================================ */}
    {/* WITHDRAWAL TIERS */}
    {/* ================================================ */}

    <div className="mt-10">

      <div className="flex items-end justify-between mb-5">

        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
            Withdrawal Benefits
          </div>

          <h3 className="text-xl font-black tracking-tight text-slate-950">
  The more you unlock, the lower you can withdraw.
</h3>
        </div>

      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


        {/* ================================================ */}
        {/* FREE */}
        {/* ================================================ */}

        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 flex flex-col min-h-[340px]">

          <div className="flex items-start justify-between">

            <div>

              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Free Access
              </div>

              <h4 className="text-lg font-black text-slate-900 mt-2">
                Free Sailor
              </h4>

            </div>

            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Anchor className="w-5 h-5 text-slate-600" />
            </div>

          </div>


          <div className="mt-8">

            <div className="flex items-end gap-2">

              <span className="text-3xl font-black tracking-tight">
                $10
              </span>

              <span className="text-sm font-bold text-slate-400 mb-2">
                USDC
              </span>

            </div>

            <p className="text-sm font-medium text-slate-500 mt-1">
              Minimum withdrawal
            </p>

          </div>


          <div className="mt-7 pt-5 border-t border-slate-100">

            <div className="text-lg font-black text-blue-600">
  35,000 SAIL
</div>

            <div className="text-xs font-medium text-slate-400 mt-1">
              Required to redeem
            </div>

          </div>


          <div className="mt-auto pt-6">

            <div className="text-xs text-slate-400 leading-relaxed">
              Upgrade your access to reduce your minimum withdrawal.
            </div>

          </div>

        </div>


        {/* ================================================ */}
        {/* PREMIUM */}
        {/* ================================================ */}

        <div className={`relative overflow-hidden rounded-3xl p-6 flex flex-col min-h-[340px] border ${
          isPremiumActive
            ? "bg-gradient-to-b from-blue-50 to-white border-blue-300 shadow-xl shadow-blue-100/70"
            : "bg-white border-blue-200"
        }`}>

          {/* Best Value Badge */}

          <div className="absolute top-0 right-0">

            <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-bl-2xl">
              Best Value
            </div>

          </div>


          <div className="flex items-start justify-between">

            <div>

              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-500">
                Premium Benefit
              </div>

              <h4 className="text-lg font-black text-slate-900 mt-2">
                Premium Sailor
              </h4>

            </div>

            <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>

          </div>


          <div className="mt-8">

            <div className="flex items-end gap-2">

              <span className="text-3xl font-black tracking-tight">
                $5
              </span>

              <span className="text-sm font-bold text-slate-400 mb-2">
                USDC
              </span>

            </div>

            <p className="text-sm font-medium text-slate-500 mt-1">
              Minimum withdrawal
            </p>

          </div>


          <div className="mt-7 pt-5 border-t border-blue-100">

            <div className="text-lg font-black text-blue-600">
              17,500 SAIL
            </div>

            <div className="text-xs font-medium text-slate-400 mt-1">
              Required to redeem
            </div>

          </div>


          <div className="mt-auto pt-6">

            {isPremiumActive ? (

              <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
                Premium benefit active
              </div>

            ) : (

              <div className="text-xs text-slate-400 leading-relaxed">
                Active Premium subscription required.
              </div>

            )}

          </div>

        </div>


        {/* ================================================ */}
        {/* AMBASSADOR */}
        {/* ================================================ */}

        <div className="relative overflow-hidden bg-white border border-purple-100 rounded-3xl p-6 flex flex-col min-h-[340px]">

          <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-purple-50"></div>


          <div className="relative flex items-start justify-between">

            <div>

              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-500">
                Future Reward
              </div>

              <h4 className="text-lg font-black text-slate-900 mt-2">
                Ambassador
              </h4>

            </div>

            <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>

          </div>


          <div className="relative mt-8">

            <div className="flex items-end gap-2">

              <span className="text-3xl font-black tracking-tight">
                $1
              </span>

              <span className="text-sm font-bold text-slate-400 mb-2">
                USDC
              </span>

            </div>

            <p className="text-sm font-medium text-slate-500 mt-1">
              Minimum withdrawal
            </p>

          </div>


          <div className="relative mt-7 pt-5 border-t border-purple-100">

            <div className="text-lg font-black text-purple-600">
              3,500 SAIL
            </div>

            <div className="text-xs font-medium text-slate-400 mt-1">
              Required to redeem
            </div>

          </div>


          <div className="relative mt-auto pt-6">

            <div className="inline-flex px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 text-[11px] font-black uppercase tracking-wider">
              Coming Soon
            </div>

          </div>

        </div>

      </div>

    </div>


    {/* ================================================ */}
    {/* SWAP FORM */}
    {/* ================================================ */}

    <div className="mt-10 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">


      {/* Form Header */}

      <div className="px-6 lg:px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-5">

        <div>

          <div className="flex items-center gap-2">

            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Gift className="w-4 h-4 text-emerald-600" />
            </div>

            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Withdrawal Request
            </span>

          </div>

          <h3 className="text-xl font-black tracking-tight text-slate-950 mt-3">
  Ready to redeem your SAIL?
</h3>

          <p className="text-sm text-slate-500 mt-1">
            Enter the amount you want to convert and submit your request.
          </p>

        </div>


        {/* Balance */}

        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4">

          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Available Balance
          </div>

          <div className="text-xl font-black text-blue-600 mt-1 tabular-nums">
            {userBalance.toLocaleString()}
            <span className="text-sm ml-1">SAIL</span>
          </div>

        </div>

      </div>


      {/* Form Body */}

      <div className="p-6 lg:p-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


          {/* SAIL INPUT */}

          <div>

            <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              You Send
            </label>

            <div className="relative mt-2">

              <input
  type="number"
  value={swapAmount}
  onChange={(e) => setSwapAmount(e.target.value)}
  disabled={isSwapProcessing}
  placeholder={`Minimum ${minimumSwapSail.toLocaleString()}`}
  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 pr-20 text-lg font-black text-slate-900 outline-none transition focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
/>

              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-blue-600">
                SAIL
              </div>

            </div>

            <div className="flex justify-between mt-2 px-1">

              <span className="text-xs text-slate-400">
                Minimum withdrawal
              </span>

              <span className="text-xs font-bold text-slate-600">
                {minimumSwapSail.toLocaleString()} SAIL
              </span>

            </div>

          </div>


          {/* USDC OUTPUT */}

          <div>

            <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              You Receive
            </label>

            <div className="relative mt-2 bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-100 rounded-2xl px-5 py-4">

              <div className="text-lg font-black text-emerald-600">
                ${formattedSwapUsdc}
              </div>

              <div className="text-sm font-bold text-emerald-500 mt-1">
                USDC
              </div>

            </div>

            <div className="flex justify-between mt-2 px-1">

              <span className="text-xs text-slate-400">
                Conversion rate
              </span>

              <span className="text-xs font-bold text-slate-600">
                3,500 SAIL = $1
              </span>

            </div>

          </div>

        </div>


        {/* Wallet */}

        <div className="mt-7">

          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Receiving Wallet Address
          </label>

          <input
  type="text"
  value={swapWallet}
  onChange={(e) => setSwapWallet(e.target.value)}
  disabled={isSwapProcessing}
  placeholder="Enter your USDC receiving wallet address"
  className="mt-2 w-full border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
/>

        </div>


        {/* Submit */}

        <button
          onClick={handleSwapRequest}
          disabled={isSwapProcessing}
          className="group mt-7 w-full bg-slate-950 hover:bg-blue-600 text-white rounded-2xl py-4 font-black text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >

          {isSwapProcessing ? (
            "Submitting Swap Request..."
          ) : (
            <>
              Convert SAIL to USDC
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </>
          )}

        </button>


        {/* Footer Info */}

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            SAIL is deducted only after your request is successfully created.
          </div>

          <div>
            Estimated processing: <span className="font-bold text-slate-600">Within 7 days</span>
          </div>

        </div>

      </div>

    </div>

  </section>
)}
      </div>

      {/* ================= MODAL OVERLAY ================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isProcessing && setSelectedItem(null)}></div>
          
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">{selectedItem.title}</h3>
              <button 
                onClick={() => setSelectedItem(null)}
                disabled={isProcessing}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              
              {/* FLOW 1: FCFS Airdrop Data Collection */}
              {selectedItem.category === 'Token Airdrops' ? (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Provide your receiving address</h4>
                  <p className="text-xs text-slate-500 mb-4">You are spending <span className="font-bold text-blue-600">{selectedItem.cost_sail} SAIL</span> to claim this drop. Payments are distributed within an hour.</p>
                  <input 
                    type="text"
                    placeholder="E.g. 0x123... or APTOS wallet"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all mb-4"
                  />
                  <button 
                    onClick={() => executeTransaction(selectedItem, walletAddress)}
                    disabled={!walletAddress || isProcessing}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md"
                  >
                    {isProcessing ? 'Processing Claim...' : 'Submit & Pay'}
                  </button>
                </div>
              ) : (
                
                /* FLOW 2: Revealed Secret for NFTs & Coupons */
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Claim Guide</h4>
                  <div className="bg-slate-50 rounded-2xl p-4 text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100 mb-6">
                    {selectedItem.guide_text || "Follow the link below to redeem your item."}
                  </div>

                  {selectedItem.action_link && (
                    <button 
                      onClick={() => window.open(selectedItem.action_link, '_blank')}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {selectedItem.category === 'Coupons' ? 'Use Coupon / Link' : 'Go to Mint / Project'} 
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

<NotificationModal
  isOpen={notification.isOpen}
  onClose={closeNotification}
  type={notification.type}
  title={notification.title}
  message={notification.message}
  details={notification.details}
/>
    </div>
  );
}