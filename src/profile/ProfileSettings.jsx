import React, { useState, useEffect } from 'react';
import { useAuth } from "../useAuth";
import { useNavigate } from 'react-router-dom';
import { supabase } from "../supabaseClient";
import { Twitter, Send, Wallet } from 'lucide-react';

export default function ProfileSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [twitterInput, setTwitterInput] = useState('');
  const [telegramInput, setTelegramInput] = useState('');
  const [walletAddress, setWalletAddress] = useState(''); // 🚀 New local state for wallet
  const [currentProfile, setCurrentProfile] = useState(null);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 NATIVE WEB3 WALLET CONNECTOR
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]); // Save the connected address to local state
        }
      } catch (error) {
        console.error("Wallet connection failed:", error);
        if (error.code === 4001) {
          alert("Wallet connection rejected by user.");
        } else {
          alert("Failed to connect wallet.");
        }
      }
    } else {
      alert("No Web3 wallet detected! Please install MetaMask or Rabby Wallet.");
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
          wallet_address: walletAddress || null // 🚀 Saves the connected wallet
        })
        .eq('auth_id', user.id);

      if (error) {
        if (error.code === '23505') {
          alert("❌ That username or wallet is already taken by another account!");
        } else {
          alert("❌ Error saving profile. Please try again.");
        }
      } else {
        alert("✅ Profile updated successfully!");
        fetchProfileData(); // Refresh to lock it in
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return <div className="p-10 text-slate-400 font-medium animate-pulse">Loading Profile Settings...</div>;
  }

  // 🚀 Checks if the new wallet string differs from the database
  const hasChanges = 
    usernameInput.trim() !== (currentProfile?.username || '') ||
    twitterInput.trim().replace('@', '') !== (currentProfile?.twitter_handle || '') ||
    telegramInput.trim().replace('@', '') !== (currentProfile?.telegram_id || '') ||
    walletAddress !== (currentProfile?.wallet_address || '');

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Profile Settings</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your identity, connections, and platform preferences.</p>
        </div>
        
        <button 
          onClick={handleSaveProfile}
          disabled={isSaving || !hasChanges}
          className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            hasChanges && !isSaving 
              ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] ring-2 ring-blue-400 scale-105' 
              : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Form & Connections */}
        <div className="md:col-span-2 space-y-6">
          
          {/* USERNAME CLAIMING BLOCK */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Public Identity</h3>
                <p className="text-xs text-slate-500 font-medium">This name appears on leaderboards.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Claim Your Sailor Name</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                <input
  type="text"
  disabled={Boolean(currentProfile?.username)}
  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.replace(/\s/g, ''))}
                  placeholder="AirdropKing99" 
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* SOCIAL CONNECTIONS BLOCK */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Social Connections</h3>
                <p className="text-xs text-slate-500 font-medium">Link your accounts for social tasks.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Twitter Input */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <Twitter className="w-3.5 h-3.5 text-sky-500" /> X (Twitter) Handle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                  <input 
                    type="text" 
                    value={twitterInput}
                    onChange={(e) => setTwitterInput(e.target.value)}
                    placeholder="elonmusk" 
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Telegram Input */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <Send className="w-3.5 h-3.5 text-blue-500" /> Telegram Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                  <input 
                    type="text" 
                    value={telegramInput}
                    onChange={(e) => setTelegramInput(e.target.value)}
                    placeholder="satoshi" 
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* WEB3 CONNECTION BLOCK */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Web3 Security</h3>
                <p className="text-xs text-slate-500 font-medium">Link your wallet to track on-chain tasks.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm text-lg">
                    📧
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Email Login</p>
                    <p className="text-xs font-medium text-slate-500">
  {user?.email?.address || user?.email || "No Email"}
</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md">Primary</span>
              </div>

              {/* Wallet Linker */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full border border-slate-200 flex items-center justify-center shadow-sm text-white font-black text-xs">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Web3 Wallet</p>
                    <p className="text-xs font-medium text-slate-500">
                      {walletAddress ? formatAddress(walletAddress) : 'Not connected'}
                    </p>
                  </div>
                </div>
                
                {/* 🚀 Dynamic Connect Button */}
                <button 
                  onClick={connectWallet}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                    walletAddress 
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 shadow-sm'
                  }`}
                >
                  {walletAddress ? 'Change Wallet' : 'Connect Wallet'}
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Right Column */}
<div className="space-y-6">

  {/* Current Roles Card */}
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">

    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-slate-900">
        Current Roles
      </h3>

      <button
        onClick={() => navigate('/profile/roles')}
        className="text-blue-600 text-sm font-semibold"
      >
        View All →
      </button>
    </div>

    <div className="flex flex-wrap gap-3">
  {currentProfile?.earned_roles?.map((role) => {

    let style =
      "bg-slate-100 text-slate-700";

    if (
      role.includes("Voyager") ||
      role.includes("Sailor Pass")
    ) {
      style =
        "bg-blue-100 text-blue-700";
    }

    if (
      role.includes("Captain") ||
      role.includes("Elite") ||
      role.includes("Legend")
    ) {
      style =
        "bg-purple-100 text-purple-700";
    }

    if (
      role.includes("Trusted") ||
      role.includes("Sybil") ||
      role.includes("Verified")
    ) {
      style =
        "bg-emerald-100 text-emerald-700";
    }

    if (
      role.includes("Farmer")
    ) {
      style =
        "bg-orange-100 text-orange-700";
    }

    return (
      <span
        key={role}
        className={`px-4 py-2 rounded-xl text-xs font-bold ${style}`}
      >
        {role}
      </span>
    );
  })}
</div>

  </div>
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">

  <h3 className="font-bold text-slate-900 mb-2">
    Trust Status
  </h3>

  <div className="text-4xl font-black text-slate-900">
    {currentProfile?.sybil_score || 0}
    <span className="text-lg text-slate-400">
      /100
    </span>
  </div>

  <div className="mt-3">

    {(currentProfile?.sybil_score || 0) >= 90 && (
      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">
        Elite Verified
      </span>
    )}

    {(currentProfile?.sybil_score || 0) >= 60 &&
      (currentProfile?.sybil_score || 0) < 90 && (
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">
          Trusted
        </span>
      )}

    {(currentProfile?.sybil_score || 0) < 60 && (
      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold">
        Low Trust
      </span>
    )}

  </div>

</div>
<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">

  <h3 className="font-bold text-slate-900 text-lg mb-5">
    Profile Overview
  </h3>

  {(() => {
    const completionItems = [
      Boolean(currentProfile?.username),
      Boolean(currentProfile?.wallet_address),
      Boolean(currentProfile?.twitter_handle),
      Boolean(currentProfile?.telegram_id),
    ];

    const completedCount = completionItems.filter(Boolean).length;
    const completionPercent = Math.round(
      (completedCount / completionItems.length) * 100
    );

    return (
      <>
        {/* Progress Ring */}
        <div className="flex justify-center mb-6">
          <div className="relative h-32 w-32">

            <svg
              className="h-32 w-32 -rotate-90"
              viewBox="0 0 120 120"
            >
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />

              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="#10b981"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={327}
                strokeDashoffset={
                  327 - (327 * completionPercent) / 100
                }
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900">
                {completionPercent}%
              </span>

              <span className="text-xs font-semibold text-slate-500">
                Complete
              </span>
            </div>

          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="font-semibold text-slate-900">
            {completionPercent === 100
              ? "Great job! Your profile is fully completed."
              : "Complete your profile to unlock more benefits."}
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-3">

          <ProfileCheck
            title="Username"
            done={Boolean(currentProfile?.username)}
          />

          <ProfileCheck
            title="Wallet Connected"
            done={Boolean(currentProfile?.wallet_address)}
          />

          <ProfileCheck
            title="Twitter Connected"
            done={Boolean(currentProfile?.twitter_handle)}
          />

          <ProfileCheck
            title="Telegram Connected"
            done={Boolean(currentProfile?.telegram_id)}
          />

        </div>
      </>
    );
  })()}

</div>

        </div>
      </div>
    </div>
  );
}
  
function ProfileCheck({ title, done }) {
  return (
    <div className="flex items-center gap-3">

      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          done
            ? "bg-emerald-100 text-emerald-600"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {done ? "✓" : ""}
      </div>

      <span
        className={`text-sm ${
          done
            ? "text-slate-700"
            : "text-slate-400"
        }`}
      >
        {title}
      </span>

    </div>
     
  );
}