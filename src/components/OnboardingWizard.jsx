import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../useAuth';
import { ChevronRight, Wallet, Twitter, Send, Crown, Loader2 } from 'lucide-react';

export default function OnboardingWizard() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(2); // Starts at 2 (Username) since Step 1 was the AuthModal
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 🎯 FINAL EXECUTOR: Marks profile complete and releases user into the app
  const finishOnboarding = async () => {
    setLoading(true);
    try {
      await supabase
        .from('user_profiles')
        .update({ is_profile_completed: true })
        .eq('auth_id', user.id);
        
      await refreshProfile(); // This flips needsOnboarding to false!
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // STEP 2: Save Username
  const handleSaveUsername = async () => {
    if (!username || username.length < 3) {
      setErrorMsg("Username must be at least 3 characters.");
      return;
    }
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

  // STEP 3: Save Wallet & Twitter
  const handleSaveSocials = async () => {
    setLoading(true);
    try {
      // In a real app, Wallet connection uses a Web3 provider like wagmi/ethers. 
      // For this step, we just save Twitter if provided.
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

  // STEP 4: Save Telegram
  const handleSaveTelegram = async () => {
    setLoading(true);
    try {
      if (telegram) {
        await supabase
          .from('user_profiles')
          .update({ telegram_id: telegram }) // Note: Telegram usually gives an ID, using string input for UI demo
          .eq('auth_id', user.id);
      }
      setStep(5);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      
      {/* Progress Indicator */}
      <div className="absolute top-8 w-full max-w-md px-4 flex justify-between items-center text-sm font-bold text-slate-300">
        <span className={step >= 2 ? "text-blue-600" : ""}>Profile</span>
        <span className={step >= 3 ? "text-blue-600" : ""}>Socials</span>
        <span className={step >= 4 ? "text-blue-600" : ""}>Telegram</span>
        <span className={step >= 5 ? "text-blue-600" : ""}>Pass</span>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl p-8 transition-all">
        
        {/* --- STEP 2: USERNAME (MANDATORY) --- */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">Choose a Username</h2>
              <p className="text-sm text-slate-500 mt-2">This is how you will appear on the leaderboards.</p>
            </div>
            
            {errorMsg && <p className="text-sm text-rose-500 font-bold text-center bg-rose-50 p-2 rounded-lg">{errorMsg}</p>}
            
            <input 
              type="text" 
              placeholder="e.g. captain_sailor" 
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button 
              onClick={handleSaveUsername}
              disabled={loading || !username}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- STEP 3: WALLET & TWITTER (OPTIONAL) --- */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">Connect Socials</h2>
              <p className="text-sm text-slate-500 mt-2">Required for validating airdrop tasks.</p>
            </div>
            
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 rounded-xl font-bold transition-all">
              <Wallet className="w-5 h-5" /> Connect EVM Wallet
            </button>

            <div className="relative">
              <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="X (Twitter) Handle" 
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <button onClick={handleSaveSocials} disabled={loading} className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">
                Next Step
              </button>
              <button onClick={() => setStep(4)} className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-bold">
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 4: TELEGRAM (OPTIONAL) --- */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">Connect Telegram</h2>
              <p className="text-sm text-slate-500 mt-2">Get automated tracker alerts via bot.</p>
            </div>

            <div className="relative">
              <Send className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Telegram Username" 
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <button onClick={handleSaveTelegram} disabled={loading} className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">
                Next Step
              </button>
              <button onClick={() => setStep(5)} className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-bold">
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 5: UPSELL (OPTIONAL) --- */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Unlock Voyager Pass</h2>
              <p className="text-sm text-slate-500 mt-2">Automate your airdrops, track 999+ projects, and lower your withdrawal limits for just $2/month.</p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex justify-center items-center gap-2">
                Upgrade Now ($2)
              </button>
              
              {/* THE FINAL SKIP - RELEASES THEM INTO THE APP */}
              <button 
                onClick={finishOnboarding} 
                disabled={loading}
                className="w-full py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-bold transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Maybe Later, Go to Dashboard'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
