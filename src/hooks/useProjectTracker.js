import { useState, useCallback } from 'react';
import { useAuth } from '../useAuth';
import { supabase } from '../supabaseClient';

// Treasury address for paid tier payments
const TREASURY_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with actual treasury address
const PAID_TIER_PRICE = '0.000044'; // ETH

export const useProjectTracker = () => {
  const { ready, authenticated, user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddProject = useCallback(async (projectId) => {
    if (!ready || !authenticated || !user) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    setIsAdding(true);

    try {
      // Check current project count
      const { data: subscriptions, error: countError } = await supabase
        .from('tracked_projects')
        .select('id')
        .eq('auth_id', user.id);

      if (countError) throw countError;

      const currentCount = subscriptions?.length || 0;
      const isFreeTier = currentCount < 5;

      if (isFreeTier) {
        // Free tier: Add project and award 500 XP
        const { error: subError } = await supabase
          .from('tracked_projects')
          .insert({
            auth_id: user.id,
            project_id: projectId,
            subscription_tier: 'Free'
          });

        if (subError) throw subError;

        // Add XP to ledger
        const { error: xpError } = await supabase
          .from('xp_ledger')
          .insert({
            auth_id: user.id,
            amount: 500,
            action_type: 'project_added',
            reference_id: projectId,
            status: 'completed'
          });

        if (xpError) throw xpError;

        // Update user profile XP
        await supabase
          .from('user_profiles')
          .update({
            xp_balance: supabase.rpc('increment', { amount: 500 }),
            lifetime_xp: supabase.rpc('increment', { amount: 500 })
          })
          .eq('auth_id', user.id);

        showToast('Project Added! +500 XP', 'success');
      } else {
        // Paid tier: Wallet payments not available with email auth
        showToast('Project limit reached. Upgrade your Sailor Pass to add more.', 'error');
        setIsAdding(false);
        return;
      }
    } catch (error) {
      console.error('Error adding project:', error);
      showToast('Failed to add project. Please try again.', 'error');
    } finally {
      setIsAdding(false);
    }
  }, [ready, authenticated, user]);

  const handleRemoveProject = useCallback(async (projectId) => {
    if (!ready || !authenticated || !user) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    setIsRemoving(true);

    try {
      // Find the XP amount earned when this project was added
      const { data: xpEntry, error: xpError } = await supabase
        .from('xp_ledger')
        .select('amount')
        .eq('auth_id', user.id)
        .eq('reference_id', projectId)
        .in('action_type', ['project_added', 'project_added_paid'])
        .single();

      if (xpError && xpError.code !== 'PGRST116') throw xpError;

      const previousAmount = xpEntry?.amount || 500; // Default to 500 if not found

      // Delete project from subscriptions
      const { error: deleteError } = await supabase
        .from('tracked_projects')
        .delete()
        .eq('auth_id', user.id)
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      // Apply penalty by reversing the XP
      const { error: penaltyError } = await supabase
        .from('xp_ledger')
        .insert({
          auth_id: user.id,
          amount: -previousAmount,
          action_type: 'project_removed',
          reference_id: projectId,
          status: 'completed'
        });

      if (penaltyError) throw penaltyError;

      // Update user profile XP (deduct)
      await supabase
        .from('user_profiles')
        .update({
          xp_balance: supabase.rpc('increment', { amount: -previousAmount }),
          lifetime_xp: supabase.rpc('increment', { amount: -previousAmount })
        })
        .eq('auth_id', user.id);

      showToast(`Project Removed. -${previousAmount} XP Deducted`, 'warning');
    } catch (error) {
      console.error('Error removing project:', error);
      showToast('Failed to remove project. Please try again.', 'error');
    } finally {
      setIsRemoving(false);
    }
  }, [ready, authenticated, user]);

  return {
    handleAddProject,
    handleRemoveProject,
    isAdding,
    isRemoving,
    toast
  };
};
