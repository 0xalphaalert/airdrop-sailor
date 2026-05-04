import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from './supabaseClient';

export default function ProfileSettings() {
  const { user, linkWallet } = usePrivy();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
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
        if (data.username) {
          setUsernameInput(data.username);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) return alert("Username cannot be empty");
    
    // Prevent saving if they haven't changed it
    if (usernameInput === currentProfile?.username) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ username: usernameInput.trim() })
        .eq('auth_id', user.id);

      if (error) {
        if (error.code === '23505') {
          alert("❌ That username is already taken! Try another one.");
        } else {
          alert("❌ Error saving username. Please try again.");
        }
      } else {
        alert("✅ Sailor Name claimed successfully!");
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

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Profile Settings</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage your identity, connections, and platform preferences.</p>
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
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.replace(/\s/g, ''))} // Prevent spaces
                    placeholder="AirdropKing99" 
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
                <button 
                  onClick={handleSaveUsername}
                  disabled={isSaving || usernameInput === currentProfile?.username || !usernameInput}
                  className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSaving ? 'Saving...' : currentProfile?.username === usernameInput ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* WEB3 CONNECTION BLOCK */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Web3 Connections</h3>
                <p className="text-xs text-slate-500 font-medium">Link your wallet to track on-chain tasks.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email (Always there due to progressive onboarding) */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm text-lg">
                    📧
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Email Login</p>
                    <p className="text-xs font-medium text-slate-500">{user?.email?.address}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md">Primary</span>
              </div>

              {/* Wallet Linker */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full border border-slate-200 flex items-center justify-center shadow-sm text-white font-black text-xs">
                    W3
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Web3 Wallet</p>
                    <p className="text-xs font-medium text-slate-500">
                      {user?.wallet?.address ? formatAddress(user.wallet.address) : 'Not connected'}
                    </p>
                  </div>
                </div>
                
                {user?.wallet?.address ? (
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md">Connected</span>
                ) : (
                  <button 
                    onClick={linkWallet}
                    className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                  >
                    Link Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Subscription & Danger Zone */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
             
             <h3 className="font-bold text-white text-sm uppercase tracking-tight mb-1 relative z-10">Current Plan</h3>
             <p className="text-3xl font-black text-blue-400 mb-4 relative z-10">{currentProfile?.subscription_tier || 'Free'}</p>
             
             <ul className="space-y-2 mb-6 relative z-10">
               <li className="text-xs font-medium text-slate-400 flex items-center gap-2">
                 <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> Track up to {currentProfile?.project_limit || 5} Projects
               </li>
               <li className="text-xs font-medium text-slate-400 flex items-center gap-2">
                 <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> On-Chain Analytics Engine
               </li>
             </ul>

             <button className="w-full py-2.5 bg-white text-slate-900 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-50 transition-colors relative z-10">
               Upgrade Plan
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}