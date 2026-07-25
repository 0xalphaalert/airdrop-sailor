// src/mobile/pages/ProfileSettingsMobile.jsx
import React from 'react';
import {
  Anchor,
  CheckCircle2,
  Clock,
  Gem,
  ListTodo,
  Send,
  Shield,
  ShieldCheck,
  Twitter,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import MobileHeader from '../components/navigation/MobileHeader';
import BottomNavigation from '../components/navigation/BottomNavigation';

export default function ProfileSettingsMobile({
  currentProfile,
  usernameInput,
  setUsernameInput, // 🚀 ADDED THIS PROP
  twitterInput,
  setTwitterInput,
  telegramInput,
  setTelegramInput,
  walletAddress,
  connectWallet,
  handleSaveProfile,
  isSaving,
  hasChanges,
  formatAddress,
  quickStats,
}) {
  const lifetimeXp = currentProfile?.lifetime_xp || 0;
  const stats = [
    { label: 'Projects', val: quickStats?.projects?.toLocaleString() || '0', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Tasks', val: quickStats?.tasks?.toLocaleString() || '0', icon: ListTodo, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Streak', val: quickStats?.streak?.toString() || '0', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Hours', val: quickStats?.hours?.toLocaleString() || '0', icon: Clock, color: 'text-slate-700', bg: 'bg-slate-100' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] pb-32 font-sans">
      <MobileHeader />

      <main className="w-full space-y-6 px-4 pb-6 pt-[68px]">
        {/* HERO CARD */}
        <section className="relative overflow-hidden rounded-3xl bg-[#0f172a] p-5 shadow-xl shadow-blue-950/10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative z-10 mb-6 flex items-center gap-4">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-blue-400 bg-slate-800 shadow-lg">
              {(() => {
                const twitterHandle = currentProfile?.twitter_handle?.replace('@', '');
                const avatarUrl = currentProfile?.profile_picture_url || (twitterHandle ? `https://unavatar.io/twitter/${twitterHandle}` : null);

                if (avatarUrl) {
                  return (
                    <img
                      src={avatarUrl}
                      className="h-full w-full object-cover"
                      alt={`${currentProfile?.username || 'Sailor'} avatar`}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  );
                }
                return <User className="h-8 w-8 text-blue-300" />;
              })()}
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-1.5">
                <h1 className="truncate text-xl font-black leading-none tracking-tight text-white">
                  @{currentProfile?.username || usernameInput || 'sailor'}
                </h1>
                <CheckCircle2 className="h-4 w-4 shrink-0 fill-blue-400/20 text-blue-400" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border border-blue-500/30 bg-blue-600/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-200">
                  Elite Hunter
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[9px] font-bold text-white/70">
                  Verified Sailor
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4 text-center">
            <HeroStat label="Level" value={Math.floor((currentProfile?.tracker_xp || 0) / 1000) + 1} />
            <HeroStat label="XP" value={(currentProfile?.tracker_xp || 0).toLocaleString()} />
            <HeroStat label="SAIL" value={(currentProfile?.lifetime_xp || 0).toLocaleString()} />
          </div>
        </section>

        {/* QUICK STATS */}
        <section>
          <h2 className="mb-3 text-[13px] font-black tracking-tight text-slate-900">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-lg font-black leading-none text-slate-900">{stat.val}</div>
                  <div className="mt-1 text-[10px] font-bold text-slate-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ROLES */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[13px] font-black tracking-tight text-slate-900">Your Roles</h2>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">Your earned community badges</p>
            </div>
            <button className="text-[11px] font-bold text-blue-600">View All</button>
          </div>
          <div className="flex snap-x gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {currentProfile?.earned_roles?.map((role) => (
              <div
                key={role}
                className={`flex min-w-[128px] shrink-0 snap-start flex-col items-center rounded-2xl border bg-white p-4 text-center shadow-sm ${getRoleStyle(role)}`}
              >
                <div className="mb-2">{getRoleIcon(role)}</div>
                <div className="flex h-8 items-center justify-center text-[11px] font-bold leading-tight">{role}</div>
                <span className="mt-2 rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                  Active
                </span>
              </div>
            ))}
            {(!currentProfile?.earned_roles || currentProfile.earned_roles.length === 0) && (
              <div className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-6 text-center text-xs font-bold text-slate-400">
                No roles earned yet.
              </div>
            )}
          </div>
        </section>

        {/* SETTINGS HEADER (Sticky) */}
        <section className="sticky top-[68px] z-30 -mx-1 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur mt-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Settings</h2>
            <p className="text-[10px] font-medium text-slate-500">Manage connected accounts</p>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving || !hasChanges}
            className={`rounded-xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              hasChanges && !isSaving
                ? 'bg-blue-600 text-white shadow-[0_0_18px_rgba(37,99,235,0.35)]'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </section>

        {/* SETTINGS FORMS */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          
          <div className="space-y-5">
            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700">Sailor Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">@</span>
                <input
                  type="text"
                  disabled={Boolean(currentProfile?.username)}
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.replace(/\s/g, ''))}
                  placeholder="AirdropKing99"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-xs font-bold text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* X (Twitter) Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <Twitter className="h-3.5 w-3.5 text-sky-500" /> X (Twitter)
                </label>
                <ConnectionStatus connected={Boolean(twitterInput)} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">@</span>
                <input
                  type="text"
                  value={twitterInput}
                  onChange={(e) => setTwitterInput(e.target.value)}
                  placeholder="elonmusk"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-xs font-bold text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Telegram Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <Send className="h-3.5 w-3.5 text-blue-500" /> Telegram
                </label>
                <ConnectionStatus connected={Boolean(telegramInput)} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">@</span>
                <input
                  type="text"
                  value={telegramInput}
                  onChange={(e) => setTelegramInput(e.target.value)}
                  placeholder="satoshi"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-xs font-bold text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Wallet Connector */}
            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <Wallet className="h-3.5 w-3.5 text-slate-900" /> Web3 Wallet
                </label>
                <button
                  onClick={connectWallet}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-colors ${
                    walletAddress ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {walletAddress ? 'Change' : 'Connect'}
                </button>
              </div>
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-500 shadow-sm">
                {walletAddress ? formatAddress(walletAddress) : 'Not connected'}
              </div>
            </div>
            
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}

function HeroStat({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</div>
      <div className="mt-0.5 text-xl font-black text-white">{value}</div>
    </div>
  );
}

function ConnectionStatus({ connected }) {
  return (
    <span className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
      {connected ? 'Connected' : 'Pending'}
    </span>
  );
}

function getRoleStyle(role) {
  if (role.includes('Voyager') || role.includes('Sailor Pass')) return 'border-blue-200 text-blue-700';
  if (role.includes('Captain') || role.includes('Elite') || role.includes('Legend')) return 'border-purple-200 text-purple-700';
  if (role.includes('Trusted') || role.includes('Verified')) return 'border-emerald-200 text-emerald-700';
  if (role.includes('10%')) return 'border-amber-200 text-amber-700';
  return 'border-slate-200 text-slate-700';
}

function getRoleIcon(role) {
  if (role.includes('Voyager') || role.includes('Sailor Pass')) return <Anchor className="h-5 w-5 text-blue-600" />;
  if (role.includes('Captain') || role.includes('Elite')) return <Shield className="h-5 w-5 text-purple-600" />;
  if (role.includes('Trusted') || role.includes('Verified')) return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (role.includes('10%')) return <Gem className="h-5 w-5 text-amber-500" />;
  return <User className="h-5 w-5 text-slate-600" />;
}