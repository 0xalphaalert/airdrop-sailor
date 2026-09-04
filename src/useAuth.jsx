import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // 🎯 NEW: Stores the database profile
  const [ready, setReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to fetch the user profile from Supabase
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
      }
      
      if (data) setProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Manage Authentication State & Fetch Profile
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (mounted) setUser(session.user);
        await fetchProfile(session.user.id); // Fetch profile right after auth
      } else {
        if (mounted) setUser(null);
      }
      if (mounted) setReady(true);
    };

    initializeAuth();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (mounted) setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        if (mounted) setUser(null);
        if (mounted) setProfile(null);
      }
      if (mounted) setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. 🎯 AUTO-APPLY REFERRAL CODE
  useEffect(() => {
    const processReferral = async () => {
      if (user) {
        const storedReferralCode = localStorage.getItem('referral_code');
        if (storedReferralCode) {
          try {
            const { data, error } = await supabase.rpc('apply_referral_code', {
              p_auth_id: user.id,
              p_code: storedReferralCode
            });
            if (error) throw error;
            console.log("Referral applied:", data?.message);
            localStorage.removeItem('referral_code');
          } catch (err) {
            console.error("Failed to apply referral code:", err);
          }
        }
      }
    };
    processReferral();
  }, [user]);

  // Controls the popup!
  const login = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const logout = async () => await supabase.auth.signOut();

  // 🎯 NEW: Function to manually refresh profile state after completing wizard steps
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ 
      ready, 
      authenticated: !!user, 
      user: user ? { 
        id: user.id, 
        email: { address: user.email },
        wallet: { address: profile?.wallet_address || null } 
      } : null, 
      profile, // Expose the full profile data
      needsOnboarding: profile && !profile.is_profile_completed, // 🚨 THE INTERCEPTOR FLAG
      refreshProfile,
      login, 
      logout,
      isModalOpen,
      closeModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
