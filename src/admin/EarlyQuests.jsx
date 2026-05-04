import React, { useState, useEffect } from 'react';
import { Search, Target, ExternalLink, Zap, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { scraperDb } from '../scraperClient'; 

export default function EarlyQuests() {
  const [quests, setQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    setIsLoading(true);
    try {
      // Fetch quests, ordered by newest first
      const { data, error } = await scraperDb
        .from('keyword_galxe_quests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) throw error;

      // Filter out Giveaways locally to ensure strict inverse of the Token Giveaways page
      const nonGiveaways = (data || []).filter(q => {
        const keyword = (q.matched_keyword || '').toLowerCase();
        const title = (q.title || '').toLowerCase();
        return !keyword.includes('giveaway') && !title.includes('giveaway');
      });

      setQuests(nonGiveaways);
    } catch (error) {
      console.error("Error fetching Early Quests:", error);
      alert("Failed to sync Galxe quests.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- TOGGLE VISIBILITY ON WEBPAGE ---
  const toggleVisibility = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    
    // Optimistic UI update for instant feedback
    setQuests(prev => prev.map(q => q.id === id ? { ...q, is_actionable: newStatus } : q));

    try {
      const { error } = await scraperDb
        .from('keyword_galxe_quests')
        .update({ is_actionable: newStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      alert("Failed to update visibility: " + err.message);
      // Revert if failed
      setQuests(prev => prev.map(q => q.id === id ? { ...q, is_actionable: currentStatus } : q));
    }
  };

  // --- DELETE QUEST ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this quest?")) return;
    
    // Optimistic UI update
    setQuests(prev => prev.filter(q => q.id !== id));

    try {
      const { error } = await scraperDb.from('keyword_galxe_quests').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      alert("Delete failed: " + err.message);
      fetchQuests(); // Re-sync if failed
    }
  };

  // --- EDIT MODAL FUNCTIONS ---
  const openEditModal = (quest) => {
    setEditingQuest({ ...quest });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        project_name: editingQuest.project_name,
        title: editingQuest.title,
        description: editingQuest.description,
        ai_score: parseInt(editingQuest.ai_score) || 0,
        web_visibility: editingQuest.web_visibility || 'Low',
        end_date: editingQuest.end_date || null
      };

      const { error } = await scraperDb
        .from('keyword_galxe_quests')
        .update(payload)
        .eq('id', editingQuest.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingQuest(null);
      fetchQuests(); // Refresh data
    } catch (err) {
      alert("Failed to update quest: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuests = quests.filter(q => 
    q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.project_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Metrics
  const activeCount = quests.filter(q => q.is_actionable).length;
  const highScoringCount = quests.filter(q => q.ai_score >= 70).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER & METRICS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Early Quests</h1>
          <p className="text-sm text-slate-500 mt-1">Manage high-value, non-giveaway campaigns from Galxe.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-center min-w-[110px]">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Public Live</p>
            <p className="text-lg font-black text-slate-800">{activeCount}</p>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-center min-w-[110px]">
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">High Score (>70)</p>
            <p className="text-lg font-black text-slate-800">{highScoringCount}</p>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-center min-w-[110px]">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Total Scraped</p>
            <p className="text-lg font-black text-slate-800">{quests.length}</p>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-end">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search campaigns or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Zap className="animate-pulse mb-3 text-blue-500" size={32} />
            <p className="font-bold">Syncing Galxe Early Quests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Campaign Details</th>
                  <th className="px-6 py-4">AI Score</th>
                  <th className="px-6 py-4 text-center">Web Visibility</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuests.length === 0 ? (
                  <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold">No quests match your filter.</td></tr>
                ) : (
                  filteredQuests.map(quest => {
                    const questLink = quest.campaign_id ? `https://app.galxe.com/quest/${quest.campaign_id}` : '#';
                    
                    return (
                      <tr key={quest.id} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* Project Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                              <Target size={14} />
                            </div>
                            <span className="font-black text-slate-900 text-sm whitespace-nowrap">{quest.project_name || quest.matched_keyword || 'Unknown'}</span>
                          </div>
                        </td>
                        
                        {/* Title & Description */}
                        <td className="px-6 py-4 max-w-md">
                          <p className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{quest.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed">{quest.description || 'No description available'}</p>
                        </td>

                        {/* AI Score */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-200 rounded-full h-2 max-w-[60px]">
                              <div 
                                className={`h-2 rounded-full ${quest.ai_score >= 80 ? 'bg-purple-500' : quest.ai_score >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`} 
                                style={{ width: `${Math.min(100, Math.max(0, quest.ai_score || 0))}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-black text-slate-700">{quest.ai_score || 0}</span>
                          </div>
                        </td>
                        
                        {/* Visibility Toggle */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleVisibility(quest.id, quest.is_actionable)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border ${
                              quest.is_actionable 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {quest.is_actionable ? <><Eye size={12}/> Visible</> : <><EyeOff size={12}/> Hidden</>}
                          </button>
                        </td>
                        
                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                              href={questLink} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Open Galxe Link"
                            >
                              <ExternalLink size={16} />
                            </a>
                            <button 
                              onClick={() => openEditModal(quest)}
                              className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Edit Quest Details"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(quest.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === EDIT MODAL OVERLAY === */}
      {isEditModalOpen && editingQuest && (
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900">Edit Quest Metadata</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">ID: {editingQuest.campaign_id}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Project Name</label>
                  <input type="text" value={editingQuest.project_name || ''} onChange={(e) => setEditingQuest({...editingQuest, project_name: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Campaign Title</label>
                  <input required type="text" value={editingQuest.title || ''} onChange={(e) => setEditingQuest({...editingQuest, title: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">AI Score (0-100)</label>
                  <input type="number" min="0" max="100" value={editingQuest.ai_score || 0} onChange={(e) => setEditingQuest({...editingQuest, ai_score: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Web Visibility</label>
                  <select value={editingQuest.web_visibility || 'Low'} onChange={(e) => setEditingQuest({...editingQuest, web_visibility: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                  <input type="date" value={editingQuest.end_date ? editingQuest.end_date.split('T')[0] : ''} onChange={(e) => setEditingQuest({...editingQuest, end_date: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea value={editingQuest.description || ''} onChange={(e) => setEditingQuest({...editingQuest, description: e.target.value})} rows="4" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900 resize-none custom-scrollbar" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 font-bold text-xs transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase tracking-widest shadow-sm transition-colors text-xs disabled:bg-slate-400">
                  {isSubmitting ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}