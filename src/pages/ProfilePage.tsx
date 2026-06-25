import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  BadgeCheck,
  Bell,
  Calendar,
  Crown,
  ExternalLink,
  Pencil,
  Zap,
  BarChart3,
  DollarSign,
  Shield,
  User,
  Anchor,
  Compass,
  Briefcase,
  Award,
  CheckCircle2,
  ArrowRight,
  User2,
  Wallet,
  Twitter,
  Send,
  MessageSquare,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../useAuth";
import { supabase } from "../supabaseClient";
import avatarImg from "../assets/profile-avatar.jpg";
import bannerImg from "../assets/profile-banner.jpg";
import crownImg from "../assets/sailor-pass-crown.jpg";

function ProfilePage() {
  const { user } = useAuth();

const [profile, setProfile] = useState(null);
const [loading, setLoading] = useState(true);

const [trackerStats, setTrackerStats] = useState({
  projects: 0,
  completedTasks: 0,
  streak: 0,
});

useEffect(() => {
  if (user) {
    loadProfile();
  }
}, [user]);
const loadProfile = async () => {
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
const avatar =
  profile?.profile_picture_url ||
  (profile?.twitter_handle
    ? `https://unavatar.io/x/${profile.twitter_handle}`
    : avatarImg);
const completionFields = [
  profile?.username,
  profile?.wallet_address,
  profile?.twitter_handle,
  profile?.telegram_id,
];

const profileCompletion = Math.round(
  (completionFields.filter(Boolean).length /
    completionFields.length) *
    100
);
const sybilScore = Number(profile?.sybil_score || 0);

const sybilLabel =
  sybilScore >= 90
    ? "Low Risk"
    : sybilScore >= 60
    ? "Medium Risk"
    : "High Risk";

    const trackerXP = Number(profile?.tracker_xp || 0);

let nextRole = "Navigator";
let nextRoleXP = 2500;
let roleEmoji = "🧭";

if (trackerXP >= 150000) {
  nextRole = "Max Level";
  nextRoleXP = 150000;
  roleEmoji = "🏆";
} else if (trackerXP >= 50000) {
  nextRole = "Legend";
  nextRoleXP = 150000;
  roleEmoji = "🏅";
} else if (trackerXP >= 10000) {
  nextRole = "Elite Sailor";
  nextRoleXP = 50000;
  roleEmoji = "⚓";
} else if (trackerXP >= 2500) {
  nextRole = "Captain";
  nextRoleXP = 10000;
  roleEmoji = "👑";
}

const roleProgress = Math.min(
  (trackerXP / nextRoleXP) * 100,
  100
);
  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6 lg:p-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
       

        {/* Hero banner */}
        <section className="relative overflow-hidden rounded-2xl">
          <img src={bannerImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1335] via-[#13205a]/85 to-[#1a1b54]/30" />
          <div className="relative grid grid-cols-1 gap-6 p-8 md:grid-cols-[auto_1fr]">
            {/* Avatar */}
            <div className="relative">
              <div className="relative h-40 w-40 overflow-hidden rounded-full ring-4 ring-white/90">
                <img
  src={avatar}
  alt={profile?.username || "Sailor"}
  className="h-full w-full object-cover"
/>
              </div>
              <span className="absolute bottom-3 right-3 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-[#13205a]" />
              <button className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-white ring-2 ring-white">
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            {/* Info */}
            <div className="text-white">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">@{profile?.username || "Sailor"}</h1>
                <BadgeCheck className="h-6 w-6 fill-blue-500 text-white" />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">

  <div className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold">
    <Crown className="h-4 w-4" />
    {profile?.earned_roles?.find(role =>
      [
        "Explorer",
        "Navigator",
        "Captain",
        "Elite Sailor",
        "Legend",
      ].includes(role)
    ) || "Explorer"}
  </div>

  <button
    onClick={() => window.location.href = "/profile/roles"}
    className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
  >
    View Roles
    <ArrowRight className="h-4 w-4" />
  </button>

</div>

              <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-200">
                <Calendar className="h-4 w-4" /> Member since {
  profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString()
    : "-"
}
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-5">
                <Stat icon={<BarChart3 className="h-4 w-4 text-blue-400" />} label="Level" value="12" sub="Elite Sailor" />
                <Stat
  icon={<Zap className="h-4 w-4 text-yellow-400" />}
  label="Tracker XP"
  value={profile?.tracker_xp || 0}
sub="Tracker XP"
/>
                <Stat
  icon={<DollarSign className="h-4 w-4 text-blue-400" />}
  label="SAIL Balance"
  value={profile?.lifetime_xp || 0}
  sub="SAIL"
/>
                <Stat
                  icon={<Shield className="h-4 w-4 text-emerald-400" />}
                  label="Sybil Score"
                  value={
  <>
    {Math.round(profile?.sybil_score || 0)}
    <span className="text-lg text-slate-300">/100</span>
  </>
}
                  sub={
                    <span className="inline-flex items-center gap-1.5 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
{sybilLabel}
                    </span>
                  }
                />
                <Stat
                  icon={<User className="h-4 w-4 text-violet-300" />}
                  label="Profile Completion"
                  value={`${profileCompletion}%`}
                  progress={profileCompletion}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Top row of cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* My Roles */}
          <Card>
  <CardHeader title="My Roles" />

  <div className="space-y-3">
    {profile?.earned_roles?.map((role) => (
      <div
        key={role}
        className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
      >
        <div>
          <p className="font-semibold text-slate-900">
            {role}
          </p>

          <p className="text-xs text-slate-500">
            Active Role
          </p>
        </div>

        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      </div>
    ))}
  </div>
</Card>

          {/* Next Role Progress */}
          <Card>
            <CardHeader title="Next Role Progress" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Next Role</p>
                <p className="text-2xl font-bold text-slate-900">
  {nextRole}
</p>
              </div>
              <div className="text-4xl">
  {roleEmoji}
</div>
</div>
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600" style={{ width: `${roleProgress}%` }} />
                </div>
                <span className="text-lg font-bold text-slate-900">
  {roleProgress.toFixed(1)}%
</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
  {trackerXP.toLocaleString()} / {nextRoleXP.toLocaleString()} XP to reach {nextRole}
</p>
            </div>
            <div className="mt-5">
              <p className="mb-3 font-semibold text-slate-900">Upcoming Benefits</p>
              <ul className="space-y-2 text-sm text-slate-700">
                {["50% SAIL Boost", "Premium Marketplace Access", "Exclusive Role Badge & Discord Role", "Early Access to New Features"].map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Profile Completion */}
          <Card>
            <CardHeader
  title="Profile Completion"
  action={
    <span className="text-sm font-semibold text-blue-600">
      {profileCompletion}% Complete
    </span>
  }
/>
            <div className="space-y-3">
              <CompletionRow
  icon={<User2 className="h-5 w-5 text-blue-600" />}
  title="Username"
  desc={profile?.username || "Not Set"}
  done={Boolean(profile?.username)}
/>
              <CompletionRow icon={<Wallet className="h-5 w-5 text-blue-600" />} title="Wallet Connected" desc={
  profile?.wallet_address
    ? profile.wallet_address.slice(0, 10) + "..."
    : "Not Connected"
} done={Boolean(profile?.wallet_address)} />
              <CompletionRow
  icon={<Twitter className="h-5 w-5 text-sky-500" />}
  title="Twitter Connected"
  desc={
    profile?.twitter_handle
      ? `@${profile.twitter_handle}`
      : "Not Connected"
  }
  done={Boolean(profile?.twitter_handle)}
/>
              <CompletionRow
  icon={<Send className="h-5 w-5 text-sky-500" />}
  title="Telegram Connected"
  desc={
    profile?.telegram_id
      ? `@${profile.telegram_id}`
      : "Not Connected"
  }
  done={Boolean(profile?.telegram_id)}
/>
            </div>
<button
  onClick={() => window.location.href = "/profile/settings"}
  className="mt-4 w-full rounded-lg bg-blue-50 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-100"
>
  Complete All to Earn Rewards
</button>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sybil */}
          <Card>
            <CardHeader
  title="Sybil Score"
  action={
    <LinkAction
      onClick={() => window.location.href = "/profile/sybil"}
    >
      View Details
    </LinkAction>
  }
/>
            <div className="flex items-center gap-5">
              <CircularScore value={Math.round(profile?.sybil_score || 0)} />
              <div>
                <p className="text-lg font-bold text-emerald-500">
  {sybilLabel}
</p>
                <p className="mt-1 text-sm text-slate-600">Your on-chain behavior looks natural and healthy.</p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
              <Clock className="h-3.5 w-3.5" /> Updated: 2h ago
            </div>
          </Card>

          {/* Connected Accounts */}
          <Card>
  <CardHeader
  title="Connected Accounts"
  action={
    <LinkAction
      onClick={() => window.location.href = "/profile/settings"}
    >
      Manage All
    </LinkAction>
  }
/>

  <div className="space-y-3">

    <AccountRow
      icon="🦊"
      title="Wallet"
      value={
        profile?.wallet_address
          ? `${profile.wallet_address.slice(0, 8)}...${profile.wallet_address.slice(-4)}`
          : "Not Connected"
      }
      connected={Boolean(profile?.wallet_address)}
    />

    <AccountRow
      icon={<Twitter className="h-5 w-5 text-sky-500" />}
      title="Twitter"
      value={
        profile?.twitter_handle
          ? `@${profile.twitter_handle}`
          : "Not Connected"
      }
      connected={Boolean(profile?.twitter_handle)}
    />

    <AccountRow
      icon={<Send className="h-5 w-5 text-blue-500" />}
      title="Telegram"
      value={
        profile?.telegram_id
          ? `@${profile.telegram_id}`
          : "Not Connected"
      }
      connected={Boolean(profile?.telegram_id)}
    />

    <AccountRow
      icon={<MessageSquare className="h-5 w-5 text-violet-500" />}
      title="Discord"
      value="Not Connected"
      connected={false}
    />

  </div>
</Card>

          {/* Sailor Pass */}
          <Card>
            <CardHeader title="Sailor Pass" action={<span className="rounded-md bg-violet-600 px-2 py-1 text-[10px] font-bold text-white">{profile?.subscription_tier !== "Free"
  ? "ACTIVE"
  : "FREE"}</span>} />
            <div className="flex gap-4">
              <img src={crownImg} alt="Sailor Pass" loading="lazy" width={112} height={112} className="h-28 w-28 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="font-bold text-slate-900">{profile?.subscription_tier || "Free Plan"}</p>
                <p className="text-xs text-slate-500">{
  profile?.subscription_expires_at
    ? `Valid until ${new Date(
        profile.subscription_expires_at
      ).toLocaleDateString()}`
    : "No active subscription"
}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {["Higher Limits", "SAIL Boost", "Premium Rewards", "Marketplace Access"].map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button
  onClick={() => window.location.href = "/subscription"}
  className="mt-4 w-full rounded-lg bg-blue-50 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-100"
>
  Manage Pass
</button>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Stat({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  progress?: number;
}) {
  



  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
        {icon} {label}
      </div>
      <div className="mt-1 text-3xl font-bold leading-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-300">{sub}</div>}
      {typeof progress === "number" && (
        <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-violet-400" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">{children}</div>;
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {action}
    </div>
  );
}

function LinkAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

function RoleRow({
  icon,
  bg,
  title,
  date,
  done,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  date: string;
  done?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${bg}`}>{icon}</div>
        <div>
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{date}</p>
        </div>
      </div>
      {done && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
    </div>
  );
}

function CompletionRow({
  icon,
  title,
  desc,
  done,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  done?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100">{icon}</div>
        <div>
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      {done && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
    </div>
  );
}

function CircularScore({ value }: { value: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="#10b981"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">/100</div>
        </div>
      </div>
    </div>
  );
}

function ConnectedAccount({
  color,
  iconBg,
  icon,
  label,
  sub,
  connected,
}: {
  color: string;
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  connected?: boolean;
}) {

  return (
    <div>
      <div className={`relative mx-auto grid h-16 w-16 place-items-center rounded-full ${color}`}>
        <div className={`grid h-14 w-14 place-items-center rounded-full ${iconBg} text-2xl`}>{icon}</div>
        {connected && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 ring-2 ring-white">
            <CheckCircle2 className="h-3 w-3 text-white" />
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
  
}
function AccountRow({
  icon,
  title,
  value,
  connected,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  connected?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition">

      <div className="flex items-center gap-3">

        <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-100">
          {icon}
        </div>

        <div>
          <p className="font-semibold text-slate-900">
            {title}
          </p>

          <p className="text-sm text-slate-500">
            {value}
          </p>
        </div>

      </div>

      {connected ? (
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          Connected
        </div>
      ) : (
        <button className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100">
          Connect
        </button>
      )}

    </div>
  );
}
export default ProfilePage;
