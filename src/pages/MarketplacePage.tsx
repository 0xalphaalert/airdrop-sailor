import { useState, useEffect } from "react";
import { useAuth } from '../useAuth';
import { supabase } from '../supabaseClient';
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

const tabs = ["All", "Subscriptions", "NFT Offers", "Coupons", "Token Airdrops", "Special Access"];

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
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
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
  const [active, setActive] = useState("All");
  const [items, setItems] = useState([]);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [activeTier, setActiveTier] = useState("Free");
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  
  // Modal & Processing States
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");

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
  const handleActionClick = async (item) => {
    if (!user) return alert("Please connect your wallet/email first.");

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

    // FLOW 3: Subscriptions (Instant Upgrade)
    if (item.category === 'Subscriptions') {
      // Check if they have ANY active pass
      // This is the master lock for the UI - NOW SUPPORTS BOTH TIERS
              const isPassActive = (activeTier === 'Sailor Pass' || activeTier === 'Voyager Pass') && 
                                    expiresAt && new Date(expiresAt).getTime() > Date.now();
      
      if (isPassActive) {
        return alert("You have an active subscription! You can buy a new pass once your current one expires.");
      }
      
      await executeTransaction(item);
    }
  };

  const executeTransaction = async (item, providedWallet = null) => {
    if (userBalance < item.cost_sail) return alert(`Insufficient funds! You need ${item.cost_sail} SAIL.`);
    
    setIsProcessing(true);
    setProcessingId(item.id);

    try {
      // 1. Deduct SAIL & Update Ledger securely via the new RPC
      const { error: rpcError } = await supabase.rpc('spend_sail_balance', {
        p_auth_id: user.id,
        p_amount: item.cost_sail,
        p_item_id: item.id
      });
      
      if (rpcError) throw new Error("Failed to process transaction. " + rpcError.message);

      // 2. Handle Category-Specific Aftermath
      if (item.category === 'Subscriptions') {
        if (item.title.toLowerCase().includes('pro') || item.title.toLowerCase().includes('pass') || item.title.toLowerCase().includes('voyage')) {
          
          // Dynamically define the Tier and the Days
          const passTier = item.title.includes('Voyage') ? 'Voyager Pass' : 'Sailor Pass';
          const daysToAdd = item.title.includes('Voyage') ? 90 : 30;

          // Call the Upgraded Engine and pass the p_tier!
          const { error: subError } = await supabase.rpc('extend_subscription', { 
            p_auth_id: user.id, 
            p_tier: passTier,
            p_days_to_add: daysToAdd 
          });

          if (subError) throw new Error("Payment went through, but failed to apply subscription: " + subError.message);
          
          // Instantly lock the UI locally with the correct tier
          setActiveTier(passTier);
          setExpiresAt(new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString());
        }
        alert("✅ Subscription activated successfully!");
      } 
      else if (item.category === 'Token Airdrops') {
        const { error: airdropError } = await supabase.from('airdrop_claims').insert({
          auth_id: user.id,
          item_id: item.id,
          wallet_address: providedWallet,
          status: 'pending'
        });
        
        if (airdropError) throw new Error("Failed to save claim: " + airdropError.message);

        alert("✅ Airdrop Claimed! Payment will be processed shortly.");
        setSelectedItem(null);
        setWalletAddress("");
      } 
      else {
        // NFTs & Coupons
        setSelectedItem(item);
      }

      // 3. Update UI State Locally
      setPurchasedItems(prev => [...prev, item.id]);
      setUserBalance(prev => prev - item.cost_sail);

    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
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
            <div className="text-xl font-black text-blue-600">{userBalance.toLocaleString()} SAIL</div>
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
const isPassActive = (activeTier === 'Sailor Pass' || activeTier === 'Voyager Pass') && 
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
                  <div className="mt-4 text-blue-600 font-bold">
                    {s.cost_sail.toLocaleString()} <span className="text-slate-500 font-medium text-sm">SAIL / {daysText} Days</span>
                  </div>
                  
                  {isPassActive ? (
                    <button 
                      disabled={true}
                      className="mt-4 w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span>Active Pass</span>
                      {timeLeft && (
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                          {timeLeft}
                        </span>
                      )}
                    </button>
                  ) : (
                    <PrimaryGhostBtn 
                      onClick={() => handleActionClick(s)} 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Buy Now'}
                    </PrimaryGhostBtn>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
        )}

        {/* NFT Offers */}
        {(active === "All" || active === "NFT Offers") && (
        <section className="mt-10">
          <SectionHeader title="NFT Offers" desc="Exclusive NFT collections, whitelist spots and more." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.filter(i => i.category === 'NFT Offers').map((n) => {
              const isOwned = purchasedItems.includes(n.id);
              const isLoading = isProcessing && processingId === n.id;
              return (
              <Card key={n.id}>
                {n.banner_url ? (
                  <div className="h-40 rounded-xl overflow-hidden bg-slate-100">
                    <img src={n.banner_url} alt={n.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-40 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-6xl">🖼️</div>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <div className="font-bold text-slate-900">{n.title}</div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Whitelist</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{n.description}</div>
                <div className="mt-2 text-blue-600 font-bold text-sm">• {n.cost_sail.toLocaleString()} SAIL</div>
                <PrimaryGhostBtn onClick={() => handleActionClick(n)} disabled={isLoading}>
                  {isLoading ? 'Unlocking...' : isOwned ? 'View Secret Link 🔓' : 'Claim'}
                </PrimaryGhostBtn>
              </Card>
            )})}
          </div>
        </section>
        )}

        {/* Coupons */}
        {(active === "All" || active === "Coupons") && (
        <section className="mt-10">
          <SectionHeader title="Coupons" desc="Save more with exclusive partner coupons & fee rebates." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.filter(i => i.category === 'Coupons').map((c) => {
              const ui = getCouponUI(c.title);
              const isOwned = purchasedItems.includes(c.id);
              const isLoading = isProcessing && processingId === c.id;
              return (
                <Card key={c.id}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${ui.bg} rounded-xl flex items-center justify-center font-black text-sm overflow-hidden`}>
                      {/* Dynamic Logo Replacement! */}
                      {c.project_logo_url ? <img src={c.project_logo_url} className="w-full h-full object-cover" alt="" /> : ui.letter}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-500">{c.description}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-3">Valid for 30 Days</div>
                  <div className="mt-2 text-blue-600 font-bold">
                    {c.cost_sail.toLocaleString()} <span className="text-slate-500 font-medium text-sm">SAIL</span>
                  </div>
                  <PrimaryGhostBtn onClick={() => handleActionClick(c)} disabled={isLoading}>
                    {isLoading ? 'Redeeming...' : isOwned ? 'View Coupon 🔓' : 'Redeem'}
                  </PrimaryGhostBtn>
                </Card>
              );
            })}
          </div>
        </section>
        )}

        {/* FCFS Token Airdrops */}
        {(active === "All" || active === "Token Airdrops") && (
        <section className="mt-10">
          <SectionHeader title="FCFS Token Airdrops" desc="Limited token airdrops for active and top hunters." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.filter(i => i.category === 'Token Airdrops').map((a) => {
              const ui = getAirdropUI(a.title);
              const isOwned = purchasedItems.includes(a.id);
              return (
                <Card key={a.id}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${ui.bg} rounded-full flex items-center justify-center font-black text-sm overflow-hidden`}>
                      {/* Dynamic Logo Replacement! */}
                      {a.project_logo_url ? <img src={a.project_logo_url} className="w-full h-full object-cover" alt="" /> : ui.letter}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{a.title}</div>
                      <div className="text-xs text-slate-500">FCFS Airdrop</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 mt-3">{a.description}</div>
                  <div className="mt-2 text-blue-600 font-bold">
                    {a.cost_sail.toLocaleString()} <span className="text-slate-500 font-medium text-sm">SAIL</span>
                  </div>
                  <button 
                    onClick={() => handleActionClick(a)}
                    disabled={isOwned}
                    className={`mt-4 w-full border rounded-xl py-2.5 text-sm font-semibold transition ${
                      isOwned 
                        ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {isOwned ? 'Pending ⏳' : 'Claim'}
                  </button>
                  <div className="text-center text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" /> Ends soon
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Rewards are limited. First come, first served!
            <Gift className="w-3 h-3" />
          </p>
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

    </div>
  );
}