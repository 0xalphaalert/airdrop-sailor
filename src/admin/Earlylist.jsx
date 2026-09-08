import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Copy, ClipboardPaste, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

export default function Earlylist() {
  const [pendingVCs, setPendingVCs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pasteModal, setPasteModal] = useState({ isOpen: false, vc: null, text: '' });

  useEffect(() => {
    fetchPendingVCs();
  }, []);

  const fetchPendingVCs = async () => {
    // Fetch VCs that are missing crucial profile data
    const { data, error } = await supabase
      .from('pioneer_profiles')
      .select('*')
      .eq('pioneer_type', 'VC')
      .or('tier.is.null,score.is.null,website.is.null');

    if (!error && data) {
      setPendingVCs(data);
    }
    setLoading(false);
  };

  const handleCopyPrompt = (vc) => {
    const prompt = `You are a cryptocurrency and venture capital data researcher. Find the exact details for the VC firm: "${vc.name}".\n\nOutput ONLY a raw JSON object with no markdown, no code blocks, and no extra text.\nUse this exact structure:\n{\n  "tier": "Tier 1 / Tier 2 / Tier 3 / Unknown",\n  "score": <integer from 1 to 100 based on reputation>,\n  "website": "https://...",\n  "handle": "<twitter handle without @>",\n  "bio": "<short description of the VC>",\n  "followers": "<number of followers on X, e.g., '50k'>",\n  "portfolio_count": <integer of known investments>,\n  "partners": ["Partner Name 1", "Partner Name 2"],\n  "investment_focus": ["DeFi", "Layer 1", "Web3"]\n}`;
    
    navigator.clipboard.writeText(prompt);
    alert(`AI Prompt for ${vc.name} copied to clipboard!`);
  };

  // 🚀 NEW: Function to handle deleting a VC
  const handleDeleteVC = async (vcId, vcName) => {
    // Ask for confirmation to prevent accidental clicks
    if (!window.confirm(`Are you sure you want to permanently delete "${vcName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pioneer_profiles')
        .delete()
        .eq('id', vcId);

      if (error) throw error;

      // Remove from the local state to update the UI instantly
      setPendingVCs(current => current.filter(v => v.id !== vcId));
    } catch (err) {
      alert("Failed to delete VC.\nDetails: " + err.message);
    }
  };
  // --- IMGBB ASSET PIPELINE ---
  const autoMigrateLogoToImgBB = async (handle) => {
    try {
      const { data, error } = await supabase.functions.invoke('upload-logo', {
        body: { handle: handle }
      });
      if (error) throw error;
      return data?.url || null;
    } catch (error) {
      console.error(`Asset migration failure for ${handle}:`, error);
      return null;
    }
  };

  const handlePasteJSON = async () => {
    try {
      const cleanText = pasteModal.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(cleanText);

      // 1. Process the logo first
      let permanentLogoUrl = null;
      if (aiData.handle) {
        permanentLogoUrl = await autoMigrateLogoToImgBB(aiData.handle);
      }

      // 2. Format the payload using the NEW permanent URL
      const updatePayload = {
        tier: aiData.tier || null,
        score: aiData.score ? parseInt(aiData.score) : null,
        website: aiData.website || null,
        handle: aiData.handle || null,
        x_url: aiData.handle ? `https://x.com/${aiData.handle}` : null,
        bio: aiData.bio || null,
        followers: aiData.followers ? String(aiData.followers) : null,
        portfolio_count: aiData.portfolio_count ? parseInt(aiData.portfolio_count) : null,
        partners: Array.isArray(aiData.partners) ? aiData.partners : null,
        investment_focus: Array.isArray(aiData.investment_focus) ? aiData.investment_focus : null,
        logo_url: permanentLogoUrl // 🚀 NOW USES PERMANENT IMGBB LINK
      };

      // 3. Update Supabase
      const { data, error } = await supabase
        .from('pioneer_profiles')
        .update(updatePayload)
        .eq('id', pasteModal.vc.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Update blocked by database.");

      setPendingVCs(current => current.filter(v => v.id !== pasteModal.vc.id));
      setPasteModal({ isOpen: false, vc: null, text: '' });
      
    } catch (err) {
      alert("Failed to update VC.\nDetails: " + err.message);
    }
  };

  if (loading) return <div className="text-white font-bold animate-pulse">Loading Intelligence Data...</div>;

  return (
    <div className="w-full h-full pb-10 text-gray-900">
      
      {/* Header section matches the dark layout context, container shifts to clean white */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <AlertCircle className="text-blue-500" />
          Incomplete VC Profiles
        </h2>
        <p className="text-gray-400 text-sm mt-1">Generate AI prompts and paste JSON results to enrich the pioneer directory.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {pendingVCs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
             <CheckCircle2 size={48} className="text-green-500 mb-3" />
             <h3 className="text-xl font-bold text-gray-800">All Caught Up!</h3>
             <p className="text-gray-500 mt-2">There are no pending VC profiles requiring data enrichment.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-4">VC Name</th>
                <th className="p-4">Date Added</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingVCs.map((vc) => (
                <tr key={vc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                  <td className="p-4 font-bold text-gray-900">{vc.name}</td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(vc.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleCopyPrompt(vc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors"
                    >
                      <Copy size={16} /> Copy Prompt
                    </button>
                    <button 
                      onClick={() => setPasteModal({ isOpen: true, vc, text: '' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-sm font-bold transition-colors"
                    >
                      <ClipboardPaste size={16} /> Paste JSON
                    </button>
                    {/* 🚀 NEW: Delete Button */}
                    <button
                      onClick={() => handleDeleteVC(vc.id, vc.name)}
                      className="flex items-center justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                      title="Delete VC"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PASTE JSON MODAL */}
      {pasteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">
                Update Data for <span className="text-blue-600">{pasteModal.vc?.name}</span>
              </h3>
              <button 
                onClick={() => setPasteModal({ isOpen: false, vc: null, text: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 bg-gray-50">
              <textarea 
                value={pasteModal.text}
                onChange={(e) => setPasteModal({ ...pasteModal, text: e.target.value })}
                placeholder='Paste the raw JSON from AI here...'
                className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm shadow-inner bg-white"
              />
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setPasteModal({ isOpen: false, vc: null, text: '' })}
                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePasteJSON}
                disabled={!pasteModal.text.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
              >
                Save & Autofill
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}