// src/sybilEngine.js

// 🚨 Replace these with your NEW Analytics Supabase Project keys
const ANALYTICS_SUPABASE_URL = 'https://pddykfluvauwsfleqsfk.supabase.co';
const ANALYTICS_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZHlrZmx1dmF1d3NmbGVxc2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzU3ODgsImV4cCI6MjA4OTMxMTc4OH0.F8A-EWHhxueh5jYNBA7lYy241S0f55tmfEwVlUArcF8';

/**
 * Calls the secure Edge Function to calculate and save the Sybil Score
 */
export const calculateSybilScore = async (walletAddress) => {
  if (!walletAddress) return null;

  try {
    console.log("🚀 Pinging Analytics Engine for:", walletAddress);

    // Call the secure Edge Function
    const response = await fetch(`${ANALYTICS_SUPABASE_URL}/functions/v1/analyze-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANALYTICS_ANON_KEY}` 
      },
      body: JSON.stringify({ wallet_address: walletAddress })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze wallet");
    }

    // The Edge Function returns the data exactly as it saved it in your database
    const dbData = await response.json();
    console.log("🔥 ON-CHAIN DATA SECURED:", dbData);

    // Map the database columns back to what your ProfilePage.jsx UI expects
    return {
      score: dbData.sailor_score || 0,
      riskLevel: dbData.sybil_risk_level || 'Unknown',
      transactionCount: dbData.total_tx_count || 0 
    };

  } catch (error) {
    console.error("Error analyzing wallet via Edge Function:", error);
    return { score: 0, transactionCount: 0, riskLevel: 'Error' };
  }
};