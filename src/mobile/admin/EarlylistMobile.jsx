import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Copy, ClipboardPaste, CheckCircle2, AlertCircle, Trash2, Brain, X, Loader2 } from 'lucide-react';

export default function EarlylistMobile() {
  const [pendingVCs, setPendingVCs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pasteModal, setPasteModal] = useState({ isOpen: false, vc: null, text: '' });

  useEffect(() => {
    fetchPendingVCs();
  }, []);

  const fetchPendingVCs = async () => {
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

  const handleDeleteVC = async (vcId, vcName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${vcName}"?`)) return;

    try {
      const { error } = await supabase.from('pioneer_profiles').delete().eq('id', vcId);
      if (error) throw error;
      setPendingVCs(current => current.filter(v => v.id !== vcId));
    } catch (err) {
      alert("Failed to delete VC.\nDetails: " + err.message);
    }
  };

  const autoMigrateLogoToImgBB = async (handle) => {
    try {
      const { data, error } = await supabase.functions.invoke('upload-logo', { body: { handle: handle } });
      if (error) throw error;
      return data?.url || null;
    } catch (error) {
      console.error(`Asset migration failure for ${handle}:`, error);
      return null;
    }
  };

  const handlePasteJSON = async () => {
    setIsSaving(true);
    try {
      const cleanText = pasteModal.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(cleanText);

      let permanentLogoUrl = null;
      if (aiData.handle) {
        permanentLogoUrl = await autoMigrateLogoToImgBB(aiData.handle);
      }

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
        logo_url: permanentLogoUrl 
      };

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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans pb-safe">
      
      {/* HEADER (STICKY) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              AI Intelligence
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Incomplete VC Profiles</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Brain size={20} />
          </div>
        </div>
      </div>

      {/* DATA LIST (CARDS) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <AlertCircle className="w-8 h-8 animate-pulse mb-2" />
            <span className="text-sm font-bold">Scanning profiles...</span>
          </div>
        ) : pendingVCs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
             <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
             <h3 className="text-lg font-black text-slate-900">All Caught Up!</h3>
             <p className="text-sm font-medium text-slate-500 mt-2 max-w-[80%]">There are no pending VC profiles requiring data enrichment.</p>
          </div>
        ) : (
          pendingVCs.map((vc) => (
            <div key={vc.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">{vc.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Added: {new Date(vc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteVC(vc.id, vc.name)}
                  className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button 
                  onClick={() => handleCopyPrompt(vc)}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                >
                  <Copy size={16} /> Copy Prompt
                </button>
                <button 
                  onClick={() => setPasteModal({ isOpen: true, vc, text: '' })}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md"
                >
                  <ClipboardPaste size={16} /> Paste JSON
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FULL SCREEN PASTE MODAL */}
      {pasteModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-200">
          
          <div className="px-4 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-lg font-black text-slate-900 truncate">Update Data</h2>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5 truncate">
                {pasteModal.vc?.name}
              </p>
            </div>
            <button 
              onClick={() => !isSaving && setPasteModal({ isOpen: false, vc: null, text: '' })} 
              className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-full transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 bg-slate-50 p-4 flex flex-col pb-24">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Brain size={14} className="text-blue-500" /> AI Output (JSON)
            </label>
            <textarea 
              value={pasteModal.text}
              onChange={(e) => setPasteModal({ ...pasteModal, text: e.target.value })}
              disabled={isSaving}
              placeholder="Paste the raw JSON from AI here..."
              className="w-full flex-1 p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-xs shadow-inner bg-white resize-none disabled:opacity-50 custom-scrollbar"
            />
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 pb-safe">
            <button 
              onClick={handlePasteJSON}
              disabled={!pasteModal.text.trim() || isSaving}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {isSaving ? 'Processing...' : 'Save & Autofill'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}