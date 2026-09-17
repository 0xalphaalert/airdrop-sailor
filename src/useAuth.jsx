import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

// Admin accounts
const ADMIN_EMAILS = [
  import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase() || 'dkrout006@gmail.com',
  'moon69703.cm@gmail.com',
];

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
      
      setProfile(data || null);
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

  // Automatically open AuthModal when an authenticated user
// has not completed onboarding
useEffect(() => {
  if (!ready || !user) return;

  if (profile?.is_profile_completed === false) {
    setIsModalOpen(true);
  }

  if (profile?.is_profile_completed === true) {
    setIsModalOpen(false);
  }
}, [ready, user, profile]);

  // Controls the popup!
  const login = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const logout = async () => await supabase.auth.signOut();

    // 🎯 NEW: Function to manually refresh profile state after completing wizard steps
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  // Check whether the currently logged-in user is an admin
  const isAdmin =
    !!user?.email &&
    ADMIN_EMAILS.includes(user.email.toLowerCase());

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

      // Admin access
      isAdmin,

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
