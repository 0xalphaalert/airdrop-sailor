import { useEffect, useRef, useState } from 'react';
import { Anchor, X, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../useAuth';

export default function XpRewardNotification() {
  const { user } = useAuth();

  const [reward, setReward] = useState(null);
  const [queue, setQueue] = useState([]);

  const isInitialized = useRef(false);
  const timerRef = useRef(null);

  // Listen for new xp_ledger entries
  useEffect(() => {
    if (!user?.id) {
      isInitialized.current = false;
      return;
    }

    // Prevent notifications from old ledger rows
    isInitialized.current = false;

    const initializeListener = async () => {
      // Small delay ensures existing page/session activity
      // does not immediately trigger as a new reward
      setTimeout(() => {
        isInitialized.current = true;
      }, 1000);
    };

    initializeListener();

    const channel = supabase
      .channel(`xp-reward-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'xp_ledger',
          filter: `auth_id=eq.${user.id}`,
        },
        (payload) => {
          if (!isInitialized.current) return;

          const newReward = payload.new;

          if (!newReward?.amount) return;

          const rewardData = {
            id: newReward.id,
            amount: newReward.amount,
            description:
              newReward.description ||
              formatActionType(newReward.action_type),
          };

          setQueue((prev) => [...prev, rewardData]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user?.id]);

  // Process reward queue
  useEffect(() => {
    if (reward || queue.length === 0) return;

    const nextReward = queue[0];

    setReward(nextReward);
    setQueue((prev) => prev.slice(1));
  }, [queue, reward]);

  // Auto close reward notification
  useEffect(() => {
    if (!reward) return;

    timerRef.current = setTimeout(() => {
      setReward(null);
    }, 5000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [reward]);

  const closeNotification = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setReward(null);
  };

  if (!reward) return null;

  const isNegative = Number(reward.amount) < 0;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-[calc(100%-32px)] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-500">
      
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0b1120]/95 shadow-2xl backdrop-blur-xl">
        
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

        {/* Top Progress Bar */}
        <div className="absolute top-0 left-0 h-[2px] w-full overflow-hidden bg-white/5">
          <div className="h-full w-full origin-left animate-[shrink_5s_linear_forwards] bg-gradient-to-r from-cyan-400 to-blue-500" />
        </div>

        <div className="relative p-5">
          
          {/* Close */}
          <button
            onClick={closeNotification}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-4">
            
            {/* SAIL Icon */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 to-blue-500/10">
              <Anchor
                size={24}
                className={
                  isNegative
                    ? 'text-red-400'
                    : 'text-cyan-400'
                }
              />

              {!isNegative && (
                <Sparkles
                  size={14}
                  className="absolute -right-1 -top-1 text-cyan-300"
                />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pr-4">
              
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                {isNegative ? 'SAIL Updated' : 'SAIL Received'}
              </p>

              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-black tracking-tight ${
                    isNegative ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {isNegative ? '' : '+'}
                  {Number(reward.amount).toLocaleString()}
                </span>

                <span className="text-sm font-semibold text-slate-400">
                  SAIL
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {reward.description}
              </p>
            </div>
          </div>

          {/* Bottom Status */}
          <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />

            <span className="text-[11px] text-slate-500">
              Added to your Airdrop Sailor rewards
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


// Convert action_type into readable text if description is missing
function formatActionType(actionType) {
  if (!actionType) return 'New reward received';

  return actionType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}