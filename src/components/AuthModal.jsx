import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../useAuth';

import {
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  AtSign,
  Twitter,
  Send,
  Wallet,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function AuthModal() {
  const {
  isModalOpen,
  closeModal,
  user,
  profile,
  refreshProfile
} = useAuth();

const [step, setStep] = useState(0);

const [username, setUsername] = useState('');
const [twitterHandle, setTwitterHandle] = useState('');
const [telegramUsername, setTelegramUsername] = useState('');
const [walletAddress, setWalletAddress] = useState('');

const [usernameError, setUsernameError] = useState('');
const [isCheckingUsername, setIsCheckingUsername] = useState(false);
const [isSaving, setIsSaving] = useState(false);

// Authentication status
const isAuthenticated = !!user;

// Logged-in user whose profile setup is incomplete
const isOnboarding =
  isAuthenticated &&
  profile?.is_profile_completed === false;

// Automatically move authenticated incomplete users
// from Google login to onboarding Step 1
useEffect(() => {
  if (isOnboarding && step === 0) {
    setStep(1);
  }
}, [isOnboarding, step]);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({
    type: '',
    text: '',
  });

  // If the modal isn't told to open, don't render anything
  if (!isModalOpen) return null;

  // ------------------------------------------
  // GOOGLE LOGIN
  // ------------------------------------------
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMsg({
      type: '',
      text: '',
    });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setStatusMsg({
        type: 'error',
        text: error.message,
      });

      setIsLoading(false);
    }

    // Successful login redirects to Google.
  };

  const checkUsername = async () => {
  const cleanUsername = username.trim().toLowerCase();

  if (!cleanUsername) {
    setUsernameError('Username is required.');
    return false;
  }

  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
    setUsernameError(
      'Use 3–20 characters: lowercase letters, numbers, or underscores.'
    );
    return false;
  }

  setIsCheckingUsername(true);
  setUsernameError('');

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('auth_id')
      .eq('username', cleanUsername)
      .neq('auth_id', user.id)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      setUsernameError('This username is already taken.');
      return false;
    }

    return true;

  } catch (error) {
    console.error('Username check error:', error);
    setUsernameError('Unable to verify username. Please try again.');
    return false;

  } finally {
    setIsCheckingUsername(false);
  }
};

const saveUsername = async () => {
  const available = await checkUsername();

  if (!available) return;

  setIsSaving(true);

  try {
    const cleanUsername = username.trim().toLowerCase();

    const { error } = await supabase
      .from('user_profiles')
      .update({
        username: cleanUsername,
      })
      .eq('auth_id', user.id);

    if (error) throw error;

    

    setStep(2);

  } catch (error) {
    console.error('Username save error:', error);
    setUsernameError(error.message || 'Failed to save username.');

  } finally {
    setIsSaving(false);
  }
};

const saveTwitter = async () => {
  setIsSaving(true);

  try {
    const cleanHandle = twitterHandle
      .trim()
      .replace(/^@/, '');

    const { error } = await supabase
      .from('user_profiles')
      .update({
        twitter_handle: cleanHandle || null,
      })
      .eq('auth_id', user.id);

    if (error) throw error;

    
    setStep(3);

  } catch (error) {
    console.error('Twitter save error:', error);
    setStatusMsg({
      type: 'error',
      text: 'Could not save your X username.',
    });

  } finally {
    setIsSaving(false);
  }
};


const saveTelegram = async () => {
  setIsSaving(true);

  try {
    const cleanTelegram = telegramUsername
      .trim()
      .replace(/^@/, '');

    const { error } = await supabase
      .from('user_profiles')
      .update({
        telegram_id: cleanTelegram || null,
      })
      .eq('auth_id', user.id);

    if (error) throw error;

    
    setStep(4);

  } catch (error) {
    console.error('Telegram save error:', error);

  } finally {
    setIsSaving(false);
  }
};


const saveWallet = async () => {
  setIsSaving(true);

  try {
    const cleanWallet = walletAddress.trim();

    const { error } = await supabase
      .from('user_profiles')
      .update({
        wallet_address: cleanWallet || null,
      })
      .eq('auth_id', user.id);

    if (error) throw error;

    

    setStep(5);

  } catch (error) {
    console.error('Wallet save error:', error);

  } finally {
    setIsSaving(false);
  }
};
const completeOnboarding = async () => {
  setIsSaving(true);

  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_profile_completed: true,
      })
      .eq('auth_id', user.id);

    if (error) throw error;

    await refreshProfile();

    closeModal();

  } catch (error) {
    console.error('Onboarding completion error:', error);

    setStatusMsg({
      type: 'error',
      text: 'Something went wrong. Please try again.',
    });

  } finally {
    setIsSaving(false);
  }
};

  return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
      onClick={step === 0 ? closeModal : undefined}
    />

    {/* Modal */}
    <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">

      {/* Progress */}
      {step > 0 && (
        <div className="px-8 pt-7">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">
              Getting Started
            </span>

            <span className="text-xs font-bold text-slate-400">
              {step}/4
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{
                width:
                  step === 1
                    ? '25%'
                    : step === 2
                    ? '50%'
                    : step === 3
                    ? '75%'
                    : '100%',
              }}
            />
          </div>
        </div>
      )}

      {/* Close */}
      {step === 0 && (
        <button
          onClick={closeModal}
          className="absolute right-5 top-5 z-20 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="px-8 pb-8 pt-8">

        {/* =====================================================
            STEP 0 — GOOGLE LOGIN
        ====================================================== */}

        {step === 0 && (
          <>
            <div className="mb-8 flex flex-col items-center text-center">

              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
                <img
                  src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png"
                  alt="Airdrop Sailor Logo"
                  className="h-9 w-9 object-contain"
                />
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Welcome Aboard
              </h2>

              <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                Sign in to start tracking promising airdrops and earning your SAIL journey.
              </p>
            </div>

            {statusMsg.text && (
              <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 p-3 text-center text-sm font-bold text-rose-600">
                {statusMsg.text}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}

              {isLoading ? 'Connecting...' : 'Continue with Google'}
            </button>

            <p className="mt-6 text-center text-[11px] font-medium leading-relaxed text-slate-400">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </>
        )}

        {/* =====================================================
            STEP 1 — USERNAME
        ====================================================== */}

        {step === 1 && (
          <>
            <div className="mb-8 text-center">

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <AtSign className="h-7 w-7" />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Choose your username
              </h2>

              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                This will be your unique identity across Airdrop Sailor.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                Username
              </label>

              <div
                className={`flex items-center rounded-xl border bg-white px-4 transition ${
                  usernameError
                    ? 'border-rose-300 ring-4 ring-rose-50'
                    : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50'
                }`}
              >
                <AtSign className="mr-3 h-5 w-5 text-slate-400" />

                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase());
                    setUsernameError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveUsername();
                  }}
                  placeholder="your_username"
                  maxLength={20}
                  autoFocus
                  className="w-full bg-transparent py-4 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
                />
              </div>

              {usernameError ? (
                <p className="text-xs font-bold text-rose-500">
                  {usernameError}
                </p>
              ) : (
                <p className="text-xs font-medium text-slate-400">
                  3–20 characters. Letters, numbers and underscores only.
                </p>
              )}
            </div>

            <button
              onClick={saveUsername}
              disabled={isSaving || isCheckingUsername || !username.trim()}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving || isCheckingUsername ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </>
        )}

        {/* =====================================================
            STEP 2 — X USERNAME
        ====================================================== */}

        {step === 2 && (
          <>
            <div className="mb-8 text-center">

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Twitter className="h-6 w-6" />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Connect your X account
              </h2>

              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                Add your X username to personalize your Airdrop Sailor profile.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                X Username
                <span className="ml-2 normal-case tracking-normal text-slate-400">
                  Optional
                </span>
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                <span className="mr-3 text-lg font-bold text-slate-400">@</span>

                <input
                  value={twitterHandle}
                  onChange={(e) =>
                    setTwitterHandle(e.target.value.replace(/^@/, ''))
                  }
                  placeholder="yourhandle"
                  className="w-full bg-transparent py-4 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="mt-7 space-y-3">

              <button
                onClick={saveTwitter}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setTwitterHandle('');
                  setStep(3);
                }}
                className="w-full py-2 text-sm font-bold text-slate-400 transition hover:text-slate-700"
              >
                Skip for now
              </button>

              <button
                onClick={() => setStep(1)}
                className="flex w-full items-center justify-center gap-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

            </div>
          </>
        )}

        {/* =====================================================
            STEP 3 — TELEGRAM
        ====================================================== */}

        {step === 3 && (
          <>
            <div className="mb-8 text-center">

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Send className="h-7 w-7" />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Add your Telegram
              </h2>

              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                Add your Telegram username so we can connect more features to your account in the future.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                Telegram Username
                <span className="ml-2 normal-case tracking-normal text-slate-400">
                  Optional
                </span>
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                <span className="mr-3 text-lg font-bold text-slate-400">@</span>

                <input
                  value={telegramUsername}
                  onChange={(e) =>
                    setTelegramUsername(e.target.value.replace(/^@/, ''))
                  }
                  placeholder="yourtelegram"
                  className="w-full bg-transparent py-4 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="mt-7 space-y-3">

              <button
                onClick={saveTelegram}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setTelegramUsername('');
                  setStep(4);
                }}
                className="w-full py-2 text-sm font-bold text-slate-400 transition hover:text-slate-700"
              >
                Skip for now
              </button>

              <button
                onClick={() => setStep(2)}
                className="flex w-full items-center justify-center gap-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

            </div>
          </>
        )}

        {/* =====================================================
            STEP 4 — WALLET
        ====================================================== */}

        {step === 4 && (
          <>
            <div className="mb-8 text-center">

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <Wallet className="h-7 w-7" />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Add your wallet
              </h2>

              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                You can add a wallet now for future wallet-based features and analysis.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                Wallet Address
                <span className="ml-2 normal-case tracking-normal text-slate-400">
                  Optional
                </span>
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                <Wallet className="mr-3 h-5 w-5 text-slate-400" />

                <input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-transparent py-4 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="mt-7 space-y-3">

              <button
                onClick={saveWallet}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setWalletAddress('');
                  setStep(5);
                }}
                className="w-full py-2 text-sm font-bold text-slate-400 transition hover:text-slate-700"
              >
                Skip for now
              </button>

              <button
                onClick={() => setStep(3)}
                className="flex w-full items-center justify-center gap-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

            </div>
          </>
        )}

        {/* =====================================================
            STEP 5 — COMPLETE
        ====================================================== */}

        {step === 5 && (
          <>
            <div className="flex flex-col items-center py-5 text-center">

              <div className="relative mb-7">

                <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-70" />

                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl shadow-blue-500/30">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

              </div>

              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                  You're Ready
                </span>
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Welcome to Airdrop Sailor!
              </h2>

              <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                Your account is ready. Start tracking projects, managing daily tasks, and discovering your next opportunity.
              </p>

            </div>

            {statusMsg.text && (
              <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 p-3 text-center text-sm font-bold text-rose-600">
                {statusMsg.text}
              </div>
            )}

            <button
              onClick={completeOnboarding}
              disabled={isSaving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Start Exploring
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </>
        )}

      </div>
    </div>
  </div>
);
}