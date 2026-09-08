import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Check,
  Mail,
  Send,
  ShieldCheck,
  Twitter,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../useAuth';
import { supabase } from '../supabaseClient';
import useIsMobile from '../hooks/useIsMobile';
import ProfileSettingsMobile from '../mobile/pages/ProfileSettingsMobile';

export default function ProfileSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [twitterInput, setTwitterInput] = useState('');
  const [telegramInput, setTelegramInput] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [currentProfile, setCurrentProfile] = useState(null);
  const [quickStats, setQuickStats] = useState({ projects: 0, tasks: 0, streak: 0, hours: 0 });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
    // fetchProfileData intentionally follows the authenticated user lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (data) {
        setCurrentProfile(data);
        if (data.username) setUsernameInput(data.username);
        if (data.twitter_handle) setTwitterInput(data.twitter_handle);
        if (data.telegram_id) setTelegramInput(data.telegram_id);
        if (data.wallet_address) setWalletAddress(data.wallet_address);
      }

      // Fetch quick stats
      await fetchQuickStats();
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickStats = async () => {
    try {
      // Fetch tracked projects count
      const { data: projectsData, error: projectsError } = await supabase
        .from('tracker_user_projects')
        .select('id')
        .eq('auth_id', user.id);

      // Fetch tracked tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tracker_user_tasks')
        .select('last_completed_at')
        .eq('auth_id', user.id);

      if (!projectsError && !tasksError) {
        const projectsCount = projectsData?.length || 0;
        const completedTasks = tasksData?.filter(t => t.last_completed_at) || [];
        const tasksCount = completedTasks.length;

        // Calculate streak from completion dates
        const completionDates = [...new Set(completedTasks.map(t => {
          const d = new Date(t.last_completed_at);
          return d.toDateString();
        }))];

        let streak = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toDateString();
          if (completionDates.includes(dateStr)) {
            streak++;
          } else {
            break;
          }
        }

        // Hours - not available in current schema, set to 0
        const hours = 0;

        setQuickStats({
          projects: projectsCount,
          tasks: tasksCount,
          streak,
          hours
        });
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Wallet connection failed:', error);
        if (error.code === 4001) {
          alert('Wallet connection rejected by user.');
        } else {
          alert('Failed to connect wallet.');
        }
      }
    } else {
      alert('No Web3 wallet detected! Please install MetaMask or Rabby Wallet.');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: usernameInput.trim() || null,
          twitter_handle: twitterInput.trim().replace('@', '') || null,
          telegram_id: telegramInput.trim().replace('@', '') || null,
          wallet_address: walletAddress || null,
        })
        .eq('auth_id', user.id);

      if (error) {
        if (error.code === '23505') {
          alert('❌ That username or wallet is already taken by another account!');
        } else {
          alert('❌ Error saving profile. Please try again.');
        }
      } else {
        alert('✅ Profile updated successfully!');
        fetchProfileData();
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return <div className="p-10 font-medium text-slate-400 animate-pulse">Loading Profile Settings...</div>;
  }

  const hasChanges =
    usernameInput.trim() !== (currentProfile?.username || '') ||
    twitterInput.trim().replace('@', '') !== (currentProfile?.twitter_handle || '') ||
    telegramInput.trim().replace('@', '') !== (currentProfile?.telegram_id || '') ||
    walletAddress !== (currentProfile?.wallet_address || '');

  const lifetimeXp = currentProfile?.lifetime_xp || 0;
  const level = Math.floor(lifetimeXp / 1000) + 1;
  const sybilScore = currentProfile?.sybil_score || 0;
  const completionItems = [
    Boolean(currentProfile?.username),
    Boolean(currentProfile?.wallet_address),
    Boolean(currentProfile?.twitter_handle),
    Boolean(currentProfile?.telegram_id),
  ];
  const completionPercent = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100
  );

  if (isMobile) {
    return (
      <ProfileSettingsMobile
        currentProfile={currentProfile}
        usernameInput={usernameInput}
        setUsernameInput={setUsernameInput}
        twitterInput={twitterInput}
        setTwitterInput={setTwitterInput}
        telegramInput={telegramInput}
        setTelegramInput={setTelegramInput}
        walletAddress={walletAddress}
        connectWallet={connectWallet}
        handleSaveProfile={handleSaveProfile}
        isSaving={isSaving}
        hasChanges={hasChanges}
        formatAddress={formatAddress}
        quickStats={quickStats}
      />
    );
  }

  return (
    <div className="min-h-full bg-slate-50/70 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-blue-600">Sailor dashboard</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Profile &amp; Settings</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Manage your public identity, trusted connections, and Web3 security.
            </p>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving || !hasChanges}
            className={`shrink-0 rounded-xl px-6 py-3 text-sm font-black transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
              hasChanges && !isSaving
                ? 'scale-[1.02] bg-blue-600 text-white shadow-[0_0_24px_rgba(37,99,235,0.45)] ring-2 ring-blue-400/70'
                : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <aside className="space-y-6 lg:col-span-1">
            <section className="relative overflow-hidden rounded-3xl bg-[#0f172a] p-6 text-white shadow-xl shadow-slate-900/10">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-blue-400/70 bg-slate-800 shadow-lg">
                    {/* 🚀 DYNAMIC AVATAR LOGIC */}
                    {(() => {
                      const twitterHandle = currentProfile?.twitter_handle?.replace('@', '');
                      const avatarUrl = currentProfile?.profile_picture_url || (twitterHandle ? `https://unavatar.io/twitter/${twitterHandle}` : null);

                      if (avatarUrl) {
                        return (
                          <img
                            src={avatarUrl}
                            alt={`${currentProfile?.username || 'Sailor'} avatar`}
                            className="h-full w-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }} // Fallback if image fails
                          />
                        );
                      }
                      return <UserRound className="h-9 w-9 text-blue-300" />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="truncate text-xl font-black">@{currentProfile?.username || 'sailor'}</h2>
                      <BadgeCheck className="h-5 w-5 shrink-0 text-blue-400" />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-blue-400/30 bg-blue-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-200">
                        Elite Hunter
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                        Verified Sailor
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 🚀 REAL TRACKER XP & SAIL SPLIT */}
                <div className="mt-6 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-5 text-center">
                  <Stat label="Level" value={Math.floor((currentProfile?.tracker_xp || 0) / 1000) + 1} />
                  <Stat label="Total XP" value={(currentProfile?.tracker_xp || 0).toLocaleString()} />
                  <Stat label="SAIL" value={(currentProfile?.lifetime_xp || 0).toLocaleString()} />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Trust Status</p>
                  <div className="mt-2 text-4xl font-black text-slate-950">
                    {sybilScore}<span className="text-lg text-slate-400">/100</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4">
                {sybilScore >= 90 ? (
                  <TrustBadge className="bg-emerald-100 text-emerald-700">Elite Verified</TrustBadge>
                ) : sybilScore >= 60 ? (
                  <TrustBadge className="bg-blue-100 text-blue-700">Trusted</TrustBadge>
                ) : (
                  <TrustBadge className="bg-orange-100 text-orange-700">Low Trust</TrustBadge>
                )}
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  style={{ width: `${Math.min(sybilScore, 100)}%` }}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Profile Overview</h3>
              <div className="my-6 flex justify-center">
                <div className="relative h-36 w-36">
                  <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      stroke="#10b981"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={327}
                      strokeDashoffset={327 - (327 * completionPercent) / 100}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-950">{completionPercent}%</span>
                    <span className="text-xs font-bold text-slate-500">Complete</span>
                  </div>
                </div>
              </div>
              <p className="mb-5 text-center text-sm font-semibold text-slate-700">
                {completionPercent === 100
                  ? 'Great job! Your profile is fully completed.'
                  : 'Complete your profile to unlock more benefits.'}
              </p>
              <div className="space-y-3">
                <ProfileCheck title="Username" done={Boolean(currentProfile?.username)} />
                <ProfileCheck title="Wallet Connected" done={Boolean(currentProfile?.wallet_address)} />
                <ProfileCheck title="Twitter Connected" done={Boolean(currentProfile?.twitter_handle)} />
                <ProfileCheck title="Telegram Connected" done={Boolean(currentProfile?.telegram_id)} />
              </div>
            </section>
          </aside>

          <main className="space-y-6 lg:col-span-2">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-950">Your Roles</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">Badges earned across your Sailor journey.</p>
                </div>
                <button
                  onClick={() => navigate('/profile/roles')}
                  className="text-sm font-bold text-blue-600 transition-colors hover:text-blue-700"
                >
                  View All →
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {currentProfile?.earned_roles?.map((role) => (
                  <span key={role} className={`rounded-xl border px-4 py-2 text-xs font-black ${getRoleStyle(role)}`}>
                    {role}
                  </span>
                ))}
                {(!currentProfile?.earned_roles || currentProfile.earned_roles.length === 0) && (
                  <div className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-8 text-center text-sm font-bold text-slate-400">
                    No roles earned yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeading
                title="Public Identity & Social Connections"
                description="Control how other sailors discover and recognize you."
              />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <InputLabel>Claim Your Sailor Name</InputLabel>
                  <AtInput
                    disabled={Boolean(currentProfile?.username)}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.replace(/\s/g, ''))}
                    placeholder="AirdropKing99"
                  />
                </div>
                <div>
                  <InputLabel><Twitter className="h-4 w-4 text-sky-500" /> X (Twitter) Handle</InputLabel>
                  <AtInput
                    value={twitterInput}
                    onChange={(e) => setTwitterInput(e.target.value)}
                    placeholder="elonmusk"
                  />
                </div>
                <div>
                  <InputLabel><Send className="h-4 w-4 text-blue-500" /> Telegram Username</InputLabel>
                  <AtInput
                    value={telegramInput}
                    onChange={(e) => setTelegramInput(e.target.value)}
                    placeholder="satoshi"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeading
                title="Web3 Security"
                description="Review your primary login and connect an on-chain identity."
              />
              <div className="space-y-4">
                <AccountRow
                  icon={<Mail className="h-5 w-5" />}
                  iconClass="border border-slate-200 bg-white text-slate-600 shadow-sm"
                  title="Email Login"
                  detail={user?.email?.address || user?.email || 'No Email'}
                  action={<span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">Primary</span>}
                  className="bg-slate-50"
                />
                <AccountRow
                  icon={<Wallet className="h-5 w-5" />}
                  iconClass="bg-gradient-to-tr from-purple-500 to-blue-500 text-white shadow-md"
                  title="Web3 Wallet"
                  detail={walletAddress ? formatAddress(walletAddress) : 'Not connected'}
                  action={
                    <button
                      onClick={connectWallet}
                      className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-black transition-colors ${
                        walletAddress
                          ? 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {walletAddress ? 'Change Wallet' : 'Connect Wallet'}
                    </button>
                  }
                />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function getRoleStyle(role) {
  if (role.includes('Voyager') || role.includes('Sailor Pass')) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (role.includes('Captain') || role.includes('Elite') || role.includes('Legend')) return 'border-purple-200 bg-purple-50 text-purple-700';
  if (role.includes('Trusted') || role.includes('Sybil') || role.includes('Verified')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (role.includes('Farmer')) return 'border-orange-200 bg-orange-50 text-orange-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function TrustBadge({ className, children }) {
  return <span className={`rounded-lg px-3 py-1.5 text-xs font-black ${className}`}>{children}</span>;
}

function SectionHeading({ title, description }) {
  return (
    <div className="mb-6 border-b border-slate-100 pb-5">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
    </div>
  );
}

function InputLabel({ children }) {
  return (
    <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
      {children}
    </label>
  );
}

function AtInput(props) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">@</span>
      <input
        type="text"
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm font-bold text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  );
}

function AccountRow({ icon, iconClass, title, detail, action, className = 'bg-white' }) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="truncate text-xs font-medium text-slate-500">{detail}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function ProfileCheck({ title, done }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
        {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </div>
      <span className={`text-sm font-semibold ${done ? 'text-slate-700' : 'text-slate-400'}`}>{title}</span>
    </div>
  );
}
