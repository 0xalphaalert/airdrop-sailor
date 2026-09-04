import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Manage Authentication State
  useEffect(() => {
    // Check session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. 🎯 NEW: AUTO-APPLY REFERRAL CODE ---
  useEffect(() => {
    const processReferral = async () => {
      // Only run if the user is successfully logged in
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
            
            // Wipe the code from storage so it doesn't try to run again
            localStorage.removeItem('referral_code');
          } catch (err) {
            console.error("Failed to apply referral code:", err);
          }
        }
      }
    };
    
    processReferral();
  }, [user]); // This hook fires whenever the 'user' state changes
  // ------------------------------------------

  // Controls the popup!
  const login = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      ready, 
      authenticated: !!user, 
      user: user ? { 
        id: user.id, 
        email: { address: user.email },
        wallet: { address: null } 
      } : null, 
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
