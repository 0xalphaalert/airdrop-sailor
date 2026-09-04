import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../useAuth";
import MobileHeader from "../mobile/components/navigation/MobileHeader"; // 🚀 Bring header back
import {
  Link2, Copy, Infinity as InfinityIcon,
  Users, ShieldCheck, Zap, Share2, UserPlus, Coins, Gift, ArrowRight,
  Sailboat, User, Sparkles, Check
} from "lucide-react";
import sailCoin from "../assets/sail-coin.png";
import sailGift from "../assets/sail-gift.png";

const benefits = [
  { icon: InfinityIcon, title: "Lifetime", sub: "Rewards", bg: "bg-blue-100", fg: "text-blue-600" },
  { icon: Users, title: "No Limit", sub: "Invite Anyone", bg: "bg-blue-100", fg: "text-blue-600" },
  { icon: ShieldCheck, title: "100% Transparent", sub: "Track Everything", bg: "bg-emerald-100", fg: "text-emerald-600" },
  { icon: Zap, title: "Instant Credit", sub: "To Your Wallet", bg: "bg-amber-100", fg: "text-amber-600" },
];

function SectionCard({ icon: Icon, title, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Icon className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>
        {action && (
          <button className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
            {action} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function ReferEarnPage() {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ totalEarned: 0, totalReferrals: 0 });
  const [myReferrals, setMyReferrals] = useState([]);

  // Generate unique link safely
  const referralLink = profile?.referral_code 
    ? `https://www.airdropsailor.xyz/ref/${profile.referral_code}`
    : "Loading your link...";

  const handleCopy = () => {
    if (!profile?.referral_code) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!user?.id) return;

    async function fetchReferralData() {
      const { data: refUsers } = await supabase
        .from("user_profiles")
        .select("username, created_at")
        .eq("referred_by", user.id)
        .order("created_at", { ascending: false });

      const { data: ledgerData } = await supabase
        .from("xp_ledger")
        .select("amount")
        .eq("auth_id", user.id)
        .eq("action_type", "referral_commission");

      const totalEarned = ledgerData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
      const totalRefs = refUsers?.length || 0;

      setStats({ totalEarned, totalReferrals: totalRefs });
      setMyReferrals(refUsers || []);
    }

    fetchReferralData();
  }, [user]);

  return (
    // 🚀 Added exact pt-[76px] to clear the fixed mobile header with zero excessive gaps
    <div className="min-h-screen bg-white pb-32 lg:pb-12">
      
      {/* RENDER MOBILE HEADER ON SMALL SCREENS */}
      <div className="block lg:hidden">
        <MobileHeader />
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-4 pb-8 sm:px-8 sm:py-8">
        
        {/* Hero Section */}
        <section className="grid items-center gap-8 grid-cols-1 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold tracking-wide text-blue-600">
              <Sparkles className="h-3.5 w-3.5" /> REFER &amp; EARN
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
              Refer Your Friends
              <br />
              and Earn <span className="text-blue-600">10% SAIL</span>
              <br />
              for Lifetime
            </h1>
            <p className="mt-3 max-w-md text-slate-500 text-sm sm:text-base">
              Invite your friends to AirdropSailor and earn 10% of the SAIL
              tokens they earn, for lifetime. The more they earn, the more you earn!
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-2.5">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${b.bg} ${b.fg}`}>
                    <b.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-tight text-slate-900">{b.title}</p>
                    <p className="text-xs text-slate-500">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <img src={sailCoin} alt="SAIL tokens" className="w-full max-w-xs sm:max-w-md drop-shadow-2xl" />
          </div>
        </section>

        {/* Link & Earnings Container */}
        <section className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Link2 className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-bold text-slate-900">Your Referral Link</h2>
              </div>
              <p className="mt-1.5 text-sm text-slate-500">Share this link with your friends</p>
              
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm font-medium text-slate-900">
                  {referralLink}
                </div>
                <button 
                  onClick={handleCopy}
                  disabled={!profile?.referral_code}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6 text-center sm:text-left">
              <img src={sailGift} alt="Gift box" className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 object-contain drop-shadow-lg" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Invite. Earn. Grow Together.</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Help your friends discover the best airdrop opportunities and earn 10% SAIL for every token they earn, forever.
                </p>
              </div>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <User className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">Your Earnings</h2>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Total Earned (SAIL)</p>
              <div className="mt-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Sailboat className="h-4 w-4" />
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    {stats.totalEarned.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Total Referrals</p>
                  <p className="text-xl font-extrabold text-slate-900">{stats.totalReferrals}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Referrals Table */}
        <section className="grid gap-6 grid-cols-1">
          <SectionCard icon={Users} title="Your Referrals" action="View All">
            {myReferrals.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">You haven't referred anyone yet. Share your link to start earning!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[300px]">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="pb-3">User</th>
                      <th className="pb-3">Joined On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReferrals.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                              {r.username?.slice(0, 1).toUpperCase() || "?"}
                            </span>
                            <span className="font-semibold text-slate-900">{r.username || "Anonymous"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-500">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </section>

        {/* CTA Banner */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-6 sm:px-8 py-7 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Sailboat className="h-10 w-10 text-blue-600 shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Bigger Community. Bigger Opportunities.
              </h2>
              <p className="text-sm font-medium text-slate-600">
                Refer now and help your friends sail the Web3 journey with AirdropSailor.
              </p>
            </div>
          </div>
        </section>
        
      </main>
    </div>
  );
}
