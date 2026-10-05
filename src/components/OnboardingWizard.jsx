import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../useAuth';

import {
  AtSign,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Loader2,
  Send,
  Sparkles,
  Twitter,
  User,
  Wallet,
  Rocket,
  ShieldCheck,
} from 'lucide-react';

export default function OnboardingWizard() {
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({
    type: '',
    text: '',
  });

  const clearMessage = () => {
    setStatusMsg({
      type: '',
      text: '',
    });
  };

  const showError = (text) => {
    setStatusMsg({
      type: 'error',
      text,
    });
  };

  const nextStep = (stepNumber) => {
    clearMessage();
    setStep(stepNumber);
  };

  /* =====================================================
     USERNAME VALIDATION
  ===================================================== */

  const validateUsername = (value) => {
    if (!value) {
      return 'Username is required.';
    }

    if (value.length < 3) {
      return 'Username must be at least 3 characters.';
    }

    if (value.length > 20) {
      return 'Username cannot exceed 20 characters.';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Only letters, numbers and underscores are allowed.';
    }

    return null;
  };

  /* =====================================================
     STEP 2 — SAVE USERNAME
  ===================================================== */

  const handleUsernameContinue = async () => {
    if (!user) {
      showError('User session not found. Please log in again.');
      return;
    }

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/\s/g, '');

    const validationError = validateUsername(cleanUsername);

    if (validationError) {
      showError(validationError);
      return;
    }

    setIsLoading(true);
    clearMessage();

    try {
      /*
        Check if username already belongs to another user
      */

      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('auth_id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (
        existingUser &&
        existingUser.auth_id !== user.id
      ) {
        showError('This username is already taken. Try another one.');
        return;
      }

      /*
        Save username
      */

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          username: cleanUsername,
        })
        .eq('auth_id', user.id);

      if (updateError) {
        if (
          updateError.code === '23505' ||
          updateError.message?.toLowerCase().includes('duplicate')
        ) {
          throw new Error('This username is already taken.');
        }

        throw updateError;
      }

      nextStep(3);

    } catch (error) {
      console.error('Username save error:', error);

      showError(
        error.message ||
          'Unable to save username. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================================================
     STEP 3 — SAVE X USERNAME
  ===================================================== */

  const handleTwitterContinue = async () => {
    if (!user) return;

    const cleanTwitter = twitterHandle
      .trim()
      .replace(/^@/, '')
      .replace(/\s/g, '');

    if (!cleanTwitter) {
      nextStep(4);
      return;
    }

    setIsLoading(true);
    clearMessage();

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          twitter_handle: cleanTwitter,
        })
        .eq('auth_id', user.id);

      if (error) throw error;

      nextStep(4);

    } catch (error) {
      console.error('Twitter save error:', error);

      showError(
        error.message ||
          'Unable to save X username.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================================================
     STEP 4 — SAVE TELEGRAM USERNAME
  ===================================================== */

  const handleTelegramContinue = async () => {
    if (!user) return;

    const cleanTelegram = telegramUsername
      .trim()
      .replace(/^@/, '')
      .replace(/\s/g, '');

    if (!cleanTelegram) {
      nextStep(5);
      return;
    }

    setIsLoading(true);
    clearMessage();

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          telegram_id: cleanTelegram,
        })
        .eq('auth_id', user.id);

      if (error) throw error;

      nextStep(5);

    } catch (error) {
      console.error('Telegram save error:', error);

      showError(
        error.message ||
          'Unable to save Telegram username.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================================================
     STEP 5 — SAVE WALLET
  ===================================================== */

  const handleWalletContinue = async () => {
    if (!user) return;

    const cleanWallet = walletAddress.trim();

    if (!cleanWallet) {
      nextStep(6);
      return;
    }

    setIsLoading(true);
    clearMessage();

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          wallet_address: cleanWallet,
        })
        .eq('auth_id', user.id);

      if (error) {
        if (
          error.code === '23505' ||
          error.message?.toLowerCase().includes('duplicate')
        ) {
          throw new Error(
            'This wallet is already connected to another account.'
          );
        }

        throw error;
      }

      nextStep(6);

    } catch (error) {
      console.error('Wallet save error:', error);

      showError(
        error.message ||
          'Unable to save wallet address.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================================================
     FINAL COMPLETION
  ===================================================== */

  const handleCompleteOnboarding = async () => {
    if (!user) return;

    setIsLoading(true);
    clearMessage();

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_profile_completed: true,
        })
        .eq('auth_id', user.id);

      if (error) throw error;

      /*
        Refresh auth/profile state.

        This should make:
        needsOnboarding = false

        Then App.jsx will automatically
        stop rendering this wizard.
      */

      if (refreshProfile) {
        await refreshProfile();
      }

    } catch (error) {
      console.error('Completion error:', error);

      showError(
        error.message ||
          'Unable to complete onboarding. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================================================
     PROGRESS BAR
  ===================================================== */

  const Progress = () => (
    <div className="flex items-center justify-center gap-1.5 mt-7">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            item === step
              ? 'w-6 bg-blue-600'
              : item < step
              ? 'w-2 bg-blue-300'
              : 'w-2 bg-slate-200'
          }`}
        />
      ))}
    </div>
  );

  /* =====================================================
     STATUS MESSAGE
  ===================================================== */

  const StatusMessage = () => {
    if (!statusMsg.text) return null;

    return (
      <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-center text-xs font-bold text-rose-600">
        {statusMsg.text}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">

      {/* BACKDROP */}

      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* MODAL */}

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* TOP BLUE LINE */}

        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

        <div className="p-8">

          {/* ============================================= */}
          {/* STEP 1 — WELCOME */}
          {/* ============================================= */}

          {step === 1 && (
            <div>

              <div className="flex flex-col items-center text-center">

                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">

                  <img
                    src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png"
                    alt="Airdrop Sailor"
                    className="h-9 w-9 object-contain"
                  />

                  <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-emerald-500">
                    <Check className="h-3 w-3 stroke-[3] text-white" />
                  </div>

                </div>

                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  Welcome Aboard
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Let's set up your profile
                </h2>

                <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                  A few quick details will help personalize your Airdrop Sailor experience.
                </p>

              </div>

              {/* GOOGLE ACCOUNT */}

              <div className="mt-7 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">

                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                )}

                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-bold text-slate-800">
                    {user?.user_metadata?.full_name || 'Airdrop Sailor'}
                  </p>

                  <p className="truncate text-xs font-medium text-slate-400">
  {user?.email?.address || ''}
</p>

                </div>

                <ShieldCheck className="h-5 w-5 text-emerald-500" />

              </div>

              <button
                onClick={() => nextStep(2)}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                Continue Setup
                <ChevronRight className="h-4 w-4" />
              </button>

              <p className="mt-4 text-center text-[11px] font-medium text-slate-400">
                Takes less than a minute
              </p>

              <Progress />

            </div>
          )}

          {/* ============================================= */}
          {/* STEP 2 — USERNAME */}
          {/* ============================================= */}

          {step === 2 && (
            <div>

              <div className="flex flex-col items-center text-center">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                  <AtSign className="h-6 w-6 text-blue-600" />
                </div>

                <div className="mb-3 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600">
                  Required
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Choose your username
                </h2>

                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                  This will be your identity across Airdrop Sailor.
                </p>

              </div>

              <div className="mt-7">

                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Username
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    @
                  </span>

                  <input
                    autoFocus
                    type="text"
                    value={username}
                    maxLength={20}
                    placeholder="yourusername"
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\s/g, '')
                        .replace(/[^a-zA-Z0-9_]/g, '');

                      setUsername(value);
                      clearMessage();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUsernameContinue();
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                </div>

                <div className="mt-3 flex justify-between text-[11px] font-medium text-slate-400">
                  <span>Letters, numbers & underscores only</span>
                  <span>{username.length}/20</span>
                </div>

                <StatusMessage />

              </div>

              <button
                onClick={handleUsernameContinue}
                disabled={isLoading || !username.trim()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                onClick={() => nextStep(1)}
                className="mt-5 flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <Progress />

            </div>
          )}

          {/* ============================================= */}
          {/* STEP 3 — X */}
          {/* ============================================= */}

          {step === 3 && (
            <div>

              <div className="flex flex-col items-center text-center">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">
                  <Twitter className="h-6 w-6 text-white" />
                </div>

                <div className="mb-3 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Optional
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Add your X username
                </h2>

                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                  Connect your social identity to your Airdrop Sailor profile.
                </p>

              </div>

              <div className="relative mt-7">

                <Twitter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <span className="absolute left-11 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  @
                </span>

                <input
                  type="text"
                  value={twitterHandle}
                  placeholder="yourusername"
                  onChange={(e) => {
                    setTwitterHandle(
                      e.target.value
                        .replace(/^@/, '')
                        .replace(/\s/g, '')
                    );

                    clearMessage();
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-[72px] pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
                You can skip this and add it later.
              </p>

              <StatusMessage />

              <button
                onClick={handleTwitterContinue}
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {twitterHandle.trim()
                      ? 'Save & Continue'
                      : 'Continue'}

                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-5 flex items-center justify-between">

                <button
                  onClick={() => nextStep(2)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  onClick={() => nextStep(4)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Skip for now
                </button>

              </div>

              <Progress />

            </div>
          )}

          {/* ============================================= */}
          {/* STEP 4 — TELEGRAM */}
          {/* ============================================= */}

          {step === 4 && (
            <div>

              <div className="flex flex-col items-center text-center">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50">
                  <Send className="h-6 w-6 text-sky-500" />
                </div>

                <div className="mb-3 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Optional
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Add your Telegram
                </h2>

                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                  Connect your Telegram identity for future Airdrop Sailor features.
                </p>

              </div>

              <div className="relative mt-7">

                <Send className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <span className="absolute left-11 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  @
                </span>

                <input
                  type="text"
                  value={telegramUsername}
                  placeholder="yourusername"
                  onChange={(e) => {
                    setTelegramUsername(
                      e.target.value
                        .replace(/^@/, '')
                        .replace(/\s/g, '')
                    );

                    clearMessage();
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-[72px] pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
                You can skip this and add it later.
              </p>

              <StatusMessage />

              <button
                onClick={handleTelegramContinue}
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {telegramUsername.trim()
                      ? 'Save & Continue'
                      : 'Continue'}

                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-5 flex items-center justify-between">

                <button
                  onClick={() => nextStep(3)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  onClick={() => nextStep(5)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Skip for now
                </button>

              </div>

              <Progress />

            </div>
          )}

          {/* ============================================= */}
          {/* STEP 5 — WALLET */}
          {/* ============================================= */}

          {step === 5 && (
            <div>

              <div className="flex flex-col items-center text-center">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>

                <div className="mb-3 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Optional
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Add your wallet
                </h2>

                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                  Connect a wallet address for personalized wallet insights.
                </p>

              </div>

              <div className="relative mt-7">

                <Wallet className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={walletAddress}
                  placeholder="Paste your wallet address"
                  onChange={(e) => {
                    setWalletAddress(e.target.value);
                    clearMessage();
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
                You can skip this and connect a wallet later.
              </p>

              <StatusMessage />

              <button
                onClick={handleWalletContinue}
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {walletAddress.trim()
                      ? 'Save & Continue'
                      : 'Continue'}

                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-5 flex items-center justify-between">

                <button
                  onClick={() => nextStep(4)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  onClick={() => nextStep(6)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Skip for now
                </button>

              </div>

              <Progress />

            </div>
          )}

          {/* ============================================= */}
          {/* STEP 6 — COMPLETE */}
          {/* ============================================= */}

          {step === 6 && (
            <div>

              <div className="flex flex-col items-center text-center">

                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">

                  <Rocket className="h-7 w-7 text-white" />

                  <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-emerald-500">
                    <Check className="h-3 w-3 stroke-[3] text-white" />
                  </div>

                </div>

                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  You're Ready
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Welcome to the crew.
                </h2>

                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                  Your Airdrop Sailor profile is ready. Start tracking the next big opportunity.
                </p>

              </div>

              {/* FEATURE CARD */}

              <div className="mt-7 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">

                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>

                  <div>

                    <h3 className="text-sm font-black text-slate-900">
                      Explore Airdrop Sailor
                    </h3>

                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">
                      Discover campaigns, track projects, earn XP and never miss important opportunities.
                    </p>

                  </div>

                </div>

              </div>

              <StatusMessage />

              <button
                onClick={handleCompleteOnboarding}
                disabled={isLoading}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Enter Airdrop Sailor
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                onClick={() => nextStep(5)}
                className="mx-auto mt-5 flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <Progress />

            </div>
          )}

        </div>
      </div>
    </div>
  );
}