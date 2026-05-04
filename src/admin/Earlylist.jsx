import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this path matches your setup

export default function Earlylist() {
  const [intelQueue, setIntelQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch from the Intelligence Queue
  const fetchIntel = async () => {
    setIsLoading(true);
    try {
      // Fetching your raw Discord announcements
      const { data, error } = await supabase
        .from('discord_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      setIntelQueue(data || []);
    } catch (error) {
      console.error("Error fetching intel:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntel();
  }, []);

  // 2. The Promotion Engine (Moves data from Research to Core DB)
  const promoteToCoreDB = async (intelItem) => {
    // In a full production setup, the AI JSON would be attached to intelItem.
    // For this example, we mock the structured AI response based on our schema.
    const aiMockResult = {
      project_name: intelItem.project_name || "Unknown Project",
      stage: "Testnet",
      airdrop: { probability: "High", score: 8 },
      effort: { level: "Weekly" },
      reward: { estimated_tier: "Tier 2" },
      category: { type: "DeFi", score: 7 }
    };

    // Calculate Final Score
    const calculatedScore = (aiMockResult.airdrop.score * 3.0) + (aiMockResult.category.score * 1.0) + 40; // Simplified math
    const projectPriority = calculatedScore >= 70 ? 'MUST' : 'GOOD';

    const payload = {
      name: aiMockResult.project_name,
      status: aiMockResult.stage,
      tier: 'Tier 3',
      priority: projectPriority,
      probability: aiMockResult.airdrop.probability,
      final_score: calculatedScore,
      effort_level: aiMockResult.effort.level,
      estimated_reward_tier: aiMockResult.reward.estimated_tier,
      category: aiMockResult.category.type,
      ai_research_data: aiMockResult // Dumping the JSON into our new column!
    };

    try {
      const { error } = await supabase.from('projects').insert([payload]);
      if (error) throw error;
      
      alert(`🚀 Successfully promoted ${payload.name} to the Core Database!`);
      
      // Remove from the local UI queue
      setIntelQueue(prev => prev.filter(item => item.id !== intelItem.id));
      
      // Optionally: Delete or mark as 'processed' in discord_announcements
      await supabase.from('discord_announcements').delete().eq('id', intelItem.id);
      
    } catch (err) {
      alert(`Failed to promote: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Intelligence Radar</h2>
        <p className="text-sm text-slate-500 mt-1">Review raw signals from Discord and Telegram, and promote them to your Core Database.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-blue-600 font-bold">📡 Scanning Web3...</div>
      ) : intelQueue.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 font-medium shadow-sm">
          Inbox Zero. No pending intelligence found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {intelQueue.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-blue-100">
                    {item.project_name || 'Signal'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-slate-900 mb-2">Raw Intel:</h3>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 h-32 overflow-y-auto custom-scrollbar text-sm text-slate-600 whitespace-pre-wrap">
                  {item.content || "No content provided."}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => promoteToCoreDB(item)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  🚀 Promote to Core DB
                </button>
                <button 
                  onClick={() => setIntelQueue(prev => prev.filter(i => i.id !== item.id))}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-sm font-bold transition-colors"
                >
                  Dismiss
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}