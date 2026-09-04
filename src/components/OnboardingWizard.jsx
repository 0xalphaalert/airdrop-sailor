import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../useAuth';
import { 
  ChevronRight, ChevronLeft, Wallet, Twitter, Send, Crown, Loader2, 
  CheckCircle2, Circle, Edit2, QrCode, Bell, Check, Sailboat, User
} from 'lucide-react';

export default function OnboardingWizard() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(2); 
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Validation States for Step 2
  const isLengthValid = username.length >= 3;
  const isCharValid = username.length > 0 && /^[a-zA-Z0-9_]+$/.test(username);
  const isUsernameReady = isLengthValid && isCharValid;

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      await supabase
        .from('user_profiles')
        .update({ is_profile_completed: true })
        .eq('auth_id', user.id);
        
      await refreshProfile(); 
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleSaveUsername = async () => {
    if (!isUsernameReady) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ username: username.toLowerCase() })
        .eq('auth_id', user.id);
        
      if (error) throw error;
      setStep(3);
    } catch (err) {
      setErrorMsg("Username might be taken. Try another.");
    }
    setLoading(false);
  };

  const handleSaveSocials = async () => {
    setLoading(true);
    try {
      if (twitter) {
        await supabase
          .from('user_profiles')
          .update({ twitter_handle: twitter })
          .eq('auth_id', user.id);
      }
      setStep(4);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSaveTelegram = async () => {
    setLoading(true);
    try {
      if (telegram) {
        await supabase
          .from('user_profiles')
          .update({ telegram_id: telegram })
          .eq('auth_id', user.id);
      }
      setStep(5);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // --- UI COMPONENTS ---

  const ProgressBar = () => {
    const stepsList = [
      { num: 1, label: 'Welcome' },
      { num: 2, label: 'Identity' },
      { num: 3, label: 'Accounts' },
      { num: 4, label: 'Telegram' },
      { num: 5, label: 'Ready' }
    ];

    return (
      <div className="w-full mb-8 relative">
        <div className="absolute top-3.5 left-0 w-full h-0.5 bg-slate-100 -z-10" />
        <div 
          className="absolute top-3.5 left-0 h-0.5 bg-blue-600 -z-10 transition-all duration-500" 
          style={{ width: `${((step - 1) / (stepsList.length - 1)) * 100}%` }}
        />
        <div className="flex justify-between w-full">
          {stepsList.map((s) => {
            const isCompleted = step > s.num || (s.num === 1);
            const isCurrent = step === s.num;
            
            return (
              <div key={s.num} className="flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${isCompleted ? 'bg-blue-600 text-white' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'}
                `}>
                  {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent || isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Header = () => (
    <div className="flex items-center justify-between w-full mb-8">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Sailboat className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-slate-900 tracking-tight text-lg">AIRDROP SAILOR</span>
      </div>
      <span className="text-sm font-bold text-slate-400">{step}/5</span>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 p-6 sm:p-8 relative overflow-hidden border border-slate-100">
        
        <Header />
        <ProgressBar />

        {/* --- STEP 2: USERNAME --- */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                  <User className="w-12 h-12" />
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm">
                  <Edit2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">Create your sailor identity</h2>
              <p className="text-sm text-slate-500 mt-2">Choose the name other sailors will see on leaderboards and referrals.</p>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                <input 
                  type="text" 
                  placeholder="captain_sailor" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="w-full pl-10 pr-12 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-blue-600 transition-colors"
                />
                {isUsernameReady && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                )}
              </div>

              {errorMsg ? (
                <div className="bg-rose-50 text-rose-600 text-sm font-bold p-3 rounded-xl text-center">
                  {errorMsg}
                </div>
              ) : (
                <div className={`text-sm font-bold p-3 rounded-xl text-center transition-colors ${isUsernameReady ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                  {isUsernameReady ? 'Username available!' : 'Check username availability'}
                </div>
              )}

              <div className="space-y-2 mt-4 px-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className={`w-4 h-4 ${isLengthValid ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span className={isLengthValid ? 'text-slate-700' : 'text-slate-400'}>Minimum 3 characters</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className={`w-4 h-4 ${isCharValid ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span className={isCharValid ? 'text-slate-700' : 'text-slate-400'}>Only letters, numbers and _</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className={`w-4 h-4 ${isUsernameReady ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span className={isUsernameReady ? 'text-slate-700' : 'text-slate-400'}>
                    This is how you'll appear: <strong className="text-slate-900">@{username || '...'}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-4">
              <button disabled className="px-4 py-3.5 text-slate-400 font-bold text-sm opacity-50 cursor-not-allowed flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleSaveUsername}
                disabled={loading || !isUsernameReady}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: ACCOUNTS --- */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">Connect your airdrop accounts</h2>
              <p className="text-sm text-slate-500 mt-2">Connecting accounts helps us personalize tasks and verify eligible campaigns.</p>
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="border-2 border-slate-100 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-200 transition-colors">
                <div className="w-12 h-12 shrink-0 bg-[#F6851B]/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-[#F6851B]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">EVM Wallet</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-3">Track wallet-based rewards and on-chain tasks.</p>
                  <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                    Connect Wallet
                  </button>
                </div>
              </div>

              <div className="border-2 border-slate-100 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-200 transition-colors">
                <div className="w-12 h-12 shrink-0 bg-black rounded-xl flex items-center justify-center">
                  <Twitter className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">X (Twitter)</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-3">Required for social tasks and campaign verification.</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                    <input 
                      type="text" 
                      placeholder="username" 
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button onClick={() => setStep(4)} className="w-full py-3 text-blue-600 font-bold text-sm bg-blue-50 rounded-full hover:bg-blue-100 transition-colors mb-4">
                Skip for now
              </button>
              <div className="flex items-center justify-between gap-4">
                <button onClick={() => setStep(2)} className="px-4 py-3.5 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={handleSaveSocials}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 4: TELEGRAM --- */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="w-20 h-20 bg-[#229ED9] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#229ED9]/20">
                  <Send className="w-10 h-10 ml-[-4px]" />
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full border-2 border-white flex items-center justify-center text-rose-500 shadow-sm">
                  <Bell className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">Never miss an opportunity</h2>
              <p className="text-sm text-slate-500 mt-2">Connect Telegram and let Airdrop Sailor keep watch for you.</p>
            </div>

            <div className="space-y-2 mt-4 px-4">
              {['Daily task reminders', 'Campaign deadline alerts', 'New airdrop opportunities', 'Important tracker updates'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="border-2 border-slate-100 rounded-2xl p-4 flex items-center gap-4 mt-6">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                <QrCode className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Connect our Telegram Bot</p>
                <p className="text-sm font-black text-blue-600 mb-2">@AirdropSailorBot</p>
                <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
                  Open Telegram
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-slate-500 mb-2 px-1">Or enter your Telegram username</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                <input 
                  type="text" 
                  placeholder="yourusername" 
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <button onClick={() => setStep(5)} className="w-full py-3 text-blue-600 font-bold text-sm bg-blue-50 rounded-full hover:bg-blue-100 transition-colors mb-4">
                Skip for now
              </button>
              <div className="flex items-center justify-between gap-4">
                <button onClick={() => setStep(3)} className="px-4 py-3.5 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={handleSaveTelegram}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 5: READY & UPSELL --- */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-blue-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg shadow-blue-600/20">
                  <Sailboat className="w-12 h-12" />
                </div>
                {/* Confetti Dots Placeholder */}
                <div className="absolute -top-2 -left-2 w-3 h-3 bg-emerald-400 rounded-full"></div>
                <div className="absolute top-4 -right-4 w-2 h-2 bg-rose-400 rounded-full"></div>
                <div className="absolute bottom-2 -left-4 w-2.5 h-2.5 bg-amber-400 rounded-full"></div>
                <div className="absolute -bottom-2 right-0 w-3 h-3 bg-blue-400 rounded-full"></div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">You're ready, Captain! 🎉</h2>
              <p className="text-sm text-slate-500 mt-2">Your Airdrop Sailor tracker is ready to explore. Here's your setup summary:</p>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                  <User className="w-5 h-5 text-slate-400" /> Username
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">@{username || 'captain_sailor'}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                  <Wallet className="w-5 h-5 text-slate-400" /> Wallet
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-500">Connected</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                  <Twitter className="w-5 h-5 text-slate-400" /> X (Twitter)
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                     <span className="text-xs font-bold text-emerald-500 block">Connected</span>
                     {twitter && <span className="text-[10px] text-slate-400 block">@{twitter}</span>}
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                  <Send className="w-5 h-5 text-slate-400" /> Telegram
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                     <span className="text-xs font-bold text-emerald-500 block">Connected</span>
                     {telegram && <span className="text-[10px] text-slate-400 block">@{telegram}</span>}
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>

            <button 
              onClick={finishOnboarding} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Launch My Dashboard'} <ChevronRight className="w-4 h-4" />
            </button>

            <div className="mt-6 border-2 border-amber-100 bg-amber-50 rounded-2xl p-4 flex gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Want to go further?</p>
                <h3 className="text-sm font-black text-slate-900">Upgrade to Voyager Pass</h3>
                <p className="text-xs text-slate-600 mt-1 mb-3 leading-relaxed">Unlock advanced automation, priority alerts and premium tools.</p>
                <button className="w-full py-2 bg-white border border-slate-200 text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                  Explore Voyager Pass
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
