import React from 'react';
import {
  Anchor,
  ShieldCheck,
  Ticket,
  ChevronRight,
  Compass,
  Crown,
  Info,
  BarChart3,
  TrendingUp,
  ShieldHalf,
  Trophy,
  Lock,
  CheckCircle2,
  Ship,
} from "lucide-react";

import useIsMobile from '../hooks/useIsMobile';
import RolesPageMobile from '../mobile/pages/RolesPageMobile';


function ProfileRoles() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <RolesPageMobile />;
  }

  return (
    <div className="min-h-screen bg-[#fafbfd] py-10 px-4 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <Header />
<CurrentRoles />
<NextRoleCard />
<AllRolesProgression />
<BottomRolesGrid />
<HowRolesWork />
<FooterBanner />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-500/40 text-blue-600">
          <Compass className="h-9 w-9" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Roles &amp; Progress
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete quests, stay consistent and build your reputation.
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Your Total Power</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
            <Anchor className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-blue-600">74,440</span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">SAIL Balance</p>
      </div>
    </div>
  );
}

function CurrentRoles() {
  const roles = [
    {
      icon: <ShieldHalf className="h-6 w-6 text-white" />,
      bg: "bg-blue-600",
      title: "Captain",
      tag: "Progression",
      dot: "bg-blue-500",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-white" />,
      bg: "bg-emerald-500",
      title: "Trusted",
      tag: "Trust",
      dot: "bg-emerald-500",
    },
    {
      icon: <Ticket className="h-6 w-6 text-white" />,
      bg: "bg-blue-500",
      title: "Sailor Pass Holder",
      tag: "Premium",
      dot: "bg-blue-500",
    },
    
  ];
  return (
    <section>
      <h2 className="mb-3 text-xs font-bold tracking-wider text-blue-600">
        YOUR CURRENT ROLES (3)
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => (
          <div
            key={r.title}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${r.bg}`}
              >
                {r.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
                  {r.tag}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        ))}
      </div>
    </section>
  );
}
function NextRoleCard() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid lg:grid-cols-3 gap-6 items-center">
        
        <div>
          <p className="text-xs font-bold tracking-wider text-blue-600">
            YOUR NEXT ROLE
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            Elite Sailor
          </h3>

          <p className="text-slate-500 mt-1">
            Requires 50,000 Tracker XP
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Current XP
          </p>

          <p className="text-3xl font-bold text-blue-600">
            22,850 XP
          </p>

          <div className="mt-3 h-3 rounded-full bg-slate-200">
            <div
              className="h-3 rounded-full bg-blue-600"
              style={{ width: "45.7%" }}
            />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            22,850 / 50,000 XP
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500">
            Progress
          </p>

          <p className="text-4xl font-bold text-blue-600">
            45.7%
          </p>
        </div>

      </div>
    </section>
  );
}

function AllRolesProgression() {
  const tiers = [
    {
      name: "Explorer",
      xp: "0 XP",
      desc: "Every journey starts here.",
      color: "text-amber-700",
      wheel: "from-amber-300 to-amber-600",
      unlocked: true,
    },
    {
      name: "Navigator",
      xp: "2,500 XP",
      desc: "Chart your course and move forward.",
      color: "text-slate-600",
      wheel: "from-slate-300 to-slate-500",
      unlocked: true,
    },
    {
      name: "Captain",
      xp: "10,000 XP",
      desc: "A true leader at sea.",
      color: "text-blue-600",
      wheel: "from-blue-700 to-blue-900",
      current: true,
      progress: { value: 22850, max: 10000 },
    },
    {
      name: "Elite Sailor",
      xp: "50,000 XP",
      desc: "Proven. Skilled. Respected.",
      color: "text-purple-700",
      wheel: "from-purple-500 to-purple-800",
      progress: { value: 22850, max: 50000 },
    },
    {
      name: "Legend",
      xp: "150,000 XP",
      desc: "Legends are remembered across the seas.",
      color: "text-amber-600",
      wheel: "from-amber-400 to-yellow-600",
      progress: { value: 22850, max: 150000 },
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wider text-blue-600">
          ALL ROLES (13)
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          Keep earning to unlock higher roles!
          <Info className="h-3.5 w-3.5 text-blue-500" />
        </div>
      </div>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-500 text-blue-600">
              <Anchor className="h-3 w-3" />
            </div>
            <h3 className="text-sm font-bold text-blue-600">
              1. PROGRESSION ROLES{" "}
              <span className="font-normal text-slate-500">
                (Based on Tracker XP)
              </span>
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Earn Tracker XP by completing quests and campaigns to level up and
            unlock new roles.
          </p>
        </div>
        <p className="text-xs text-slate-600">
          Your Tracker XP:{" "}
          <span className="font-bold text-blue-600">22,850 XP</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-xl border p-4 text-center ${
              t.current
                ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-100"
                : "border-slate-200 bg-white"
            }`}
          >
            {t.current && (
              <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                <Crown className="h-3 w-3" />
              </div>
            )}
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${t.wheel}`}
            >
              {t.name === "Captain" || t.name === "Elite Sailor" ? (
                <Anchor className="h-8 w-8 text-amber-300" />
              ) : (
                <Compass className="h-8 w-8 text-white" strokeWidth={1.5} />
              )}
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">{t.name}</p>
            <p className={`text-xs font-semibold ${t.color}`}>{t.xp}</p>
            <p className="mt-2 min-h-[32px] text-xs text-slate-500">{t.desc}</p>
            {t.unlocked ? (
              <div className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Unlocked
              </div>
            ) : t.progress ? (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      t.current ? "bg-blue-600" : "bg-slate-400"
                    }`}
                    style={{
                      width: `${Math.min(100, (t.progress.value / t.progress.max) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {t.progress.value.toLocaleString()} /{" "}
                  {t.progress.max.toLocaleString()} XP
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomRolesGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <TrustRoles />
      <PremiumRoles />
      <PerformanceRoles />
    </div>
  );
}

function TrustRoles() {
  const items = [
    {
      icon: <ShieldHalf className="h-5 w-5 text-white" />,
      bg: "bg-blue-600",
      name: "Elite Verified",
      range: "90 – 100",
      value: 92,
      color: "bg-blue-500",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-white" />,
      bg: "bg-emerald-500",
      name: "Trusted",
      range: "60 – 89",
      value: 75,
      color: "bg-emerald-500",
    },
    {
      icon: <ShieldHalf className="h-5 w-5 text-white" />,
      bg: "bg-slate-500",
      name: "Verified",
      range: "0 – 59",
      value: 32,
      color: "bg-slate-400",
    },
  ];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-blue-600">
        <ShieldCheck className="h-4 w-4" />
        <h3 className="text-sm font-bold">
          2. TRUST ROLES{" "}
          <span className="font-normal text-slate-500">(Based on Sybil Score)</span>
        </h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Build a clean on-chain identity to gain trust and higher rewards.
      </p>
      <div className="mt-4 space-y-3">
        {items.map((i) => (
          <div key={i.name} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-md ${i.bg}`}
              >
                {i.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{i.name}</p>
                  <p className="text-sm font-semibold text-slate-700">{i.value}</p>
                </div>
                <p className="text-xs text-slate-500">{i.range}</p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${i.color}`}
                    style={{ width: `${i.value}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-blue-600 hover:bg-slate-50">
        View your Sybil Score →
      </button>
    </section>
  );
}

function PremiumRoles() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-blue-600">
        <Crown className="h-4 w-4" />
        <h3 className="text-sm font-bold">
          3. PREMIUM ROLES{" "}
          <span className="font-normal text-slate-500">(Based on Subscription)</span>
        </h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Subscribe to unlock premium features and exclusive opportunities.
      </p>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-lg border-2 border-blue-500 bg-blue-50/40 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Sailor Pass Holder</p>
              <p className="text-xs text-blue-600">Active</p>
            </div>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-300">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Voyager Pass Holder</p>
              <p className="text-xs text-slate-500">Upgrade to unlock</p>
            </div>
          </div>
          <Lock className="h-4 w-4 text-slate-400" />
        </div>
      </div>
      <button className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-blue-600 hover:bg-slate-50">
        Manage Subscription →
      </button>
    </section>
  );
}
function PerformanceRoles() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-blue-600">
        <BarChart3 className="h-4 w-4" />
        <h3 className="text-sm font-bold">
          4. PERFORMANCE ROLES
        </h3>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Based on all-time performance score.
      </p>

      <div className="mt-4 space-y-3">

        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="font-semibold">
            Advanced Farmer
          </p>
          <p className="text-xs text-slate-500">
            Performance Score 90+
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold">
            Normal Farmer
          </p>
          <p className="text-xs text-slate-500">
            Performance Score 30-89
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold">
            Low Effort Farmer
          </p>
          <p className="text-xs text-slate-500">
            Performance Score 0-29
          </p>
        </div>

      </div>
    </section>
  );
}

  

function HowRolesWork() {
  const items = [
    {
      icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
      title: "Earn & Progress",
      desc: "Complete quests and campaigns to earn XP, SAIL and build your profile.",
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
      title: "Unlock & Upgrade",
      desc: "Reach the required milestones to unlock higher roles.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-purple-600" />,
      title: "Gain Benefits",
      desc: "Higher roles unlock better rewards and exclusive access.",
    },
    {
      icon: <Trophy className="h-5 w-5 text-amber-500" />,
      title: "Stay Consistent",
      desc: "Keep your streak alive and maintain your roles.",
    },
  ];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-blue-600">
        <Info className="h-4 w-4" />
        <h3 className="text-sm font-bold tracking-wider">HOW ROLES WORK</h3>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.title} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
              {i.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{i.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{i.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FooterBanner() {
  return (
    <section className="flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
          <Anchor className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-slate-700">
            Roles show your journey, consistency and contribution on AirdropSailor.
          </p>
          <p className="text-sm text-slate-700">
            The more active, trusted and valuable you are, the more you earn!
          </p>
        </div>
      </div>
      <Ship className="hidden h-16 w-16 text-blue-500 md:block" strokeWidth={1.2} />
    </section>
  );
}
export default ProfileRoles;
