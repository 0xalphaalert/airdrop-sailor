import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Image, UploadCloud, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Filter, Save, Trash2, Search } from 'lucide-react';

export default function InvestorLogoStudioMobile() {
  const [pioneers, setPioneers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Per-item processing states
  const [xUrls, setXUrls] = useState({});
  const [manualUrls, setManualUrls] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [statusMap, setStatusMap] = useState({});

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterLogo, setFilterLogo] = useState('All');

  useEffect(() => {
    fetchPioneers();
  }, []);

  const fetchPioneers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pioneer_profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        setPioneers(data);
        const initialX = {};
        const initialManual = {};
        data.forEach(p => {
          if (p.x_url || p.twitter) initialX[p.id] = p.x_url || p.twitter;
          if (p.logo_url) initialManual[p.id] = p.logo_url;
        });
        setXUrls(initialX);
        setManualUrls(initialManual);
      }
    } catch (err) {
      console.error("Error fetching pioneers:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 ACTION 1: Trigger Edge Function via X
  const handleGenerateLogo = async (pioneer) => {
    const inputUrl = xUrls[pioneer.id];

    if (!inputUrl) {
      setStatusMap(prev => ({ ...prev, [pioneer.id]: { type: 'error', msg: 'Paste X URL' } }));
      return;
    }

    const handle = inputUrl.match(/(?:twitter\.com|x\.com)\/([^\/?]+)/i)?.[1];
    if (!handle) {
      setStatusMap(prev => ({ ...prev, [pioneer.id]: { type: 'error', msg: 'Invalid URL' } }));
      return;
    }

    setProcessingId(pioneer.id);
    setStatusMap(prev => ({ ...prev, [pioneer.id]: { type: 'loading', msg: 'Uploading...' } }));

    try {
      const { data, error } = await supabase.functions.invoke('upload-logo', { body: { handle: handle } });
      if (error) throw error;
      if (!data || !data.url) throw new Error("Upload failed.");

      const permanentLogoUrl = data.url;

      const { error: dbError } = await supabase
        .from('pioneer_profiles')
        .update({ logo_url: permanentLogoUrl })
        .eq('id', pioneer.id);

      if (dbError) throw dbError;

      setPioneers(prev => prev.map(p => p.id === pioneer.id ? { ...p, logo_url: permanentLogoUrl } : p));
      setManualUrls(prev => ({ ...prev, [pioneer.id]: permanentLogoUrl }));
      setStatusMap(prev => ({ ...prev, [pioneer.id]: { type: 'success', msg: 'Saved!' } }));

    } catch (err) {
      setStatusMap(prev => ({ ...prev, [pioneer.id]: { type: 'error', msg: 'Failed' } }));
    } finally {
      setProcessingId(null);
    }
  };

  // 🚀 ACTION 2: Save Manual Logo
  const handleSaveManualLogo = async (pioneer) => {
    const manualUrl = manualUrls[pioneer.id];

    if (!manualUrl) {
      setStatusMap(prev => ({ ...prev, [pioneer.id]: { type: 'error', msg: 'Paste Image URL' } }));
      return;
    }

    setProcessingId(pioneer.id);
    setStatusMap(prev => ({ ...prev, [pioneer.id]: { type: 'loading', msg: 'Saving...' } }));

    try {
      const { error: dbError } = await supabase
        .from('pioneer_profiles')
        .update({ logo_url: manualUrl })
        .eq('id', pioneer.id);

      if (dbError) throw dbError;

      setPioneers(prev => prev.map(p => p.id === pioneer.id ? { ...p, logo_url: manualUrl } : p));
      setStatusMap(prev => ({ ...prev, [pioneer.id]: { type: 'success', msg: 'Saved!' } }));

    } catch (err) {
      setStatusMap(prev => ({ ...prev, [pioneer.id]: { type: 'error', msg: 'Failed' } }));
    } finally {
      setProcessingId(null);
    }
  };

  // 🚀 ACTION 3: Delete Record
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      const { error } = await supabase.from('pioneer_profiles').delete().eq('id', id);
      if (error) throw error;
      setPioneers(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  const uniqueTypes = ['All', ...new Set(pioneers.map(p => p.pioneer_type).filter(Boolean))];

  const filteredPioneers = pioneers.filter(pioneer => {
    if (searchTerm && !pioneer.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterType !== 'All' && pioneer.pioneer_type !== filterType) return false;
    if (filterLogo === 'Available' && !pioneer.logo_url) return false;
    if (filterLogo === 'Missing' && pioneer.logo_url) return false;
    return true;
  });

  return (
    <div className="w-full px-3 py-4 space-y-4 bg-slate-50 min-h-screen text-slate-900 pb-20">
      
      {/* MOBILE HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black flex items-center gap-1.5 tracking-tight text-slate-900">
            <Sparkles className="text-blue-600 w-4 h-4" /> Pioneer Studio
          </h2>
          <button 
            onClick={fetchPioneers}
            className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <p className="text-[11px] font-medium text-slate-500">
          Showing {filteredPioneers.length} investors. Extract via X or attach direct URLs.
        </p>

        {/* SEARCH BAR */}
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-slate-400 mr-2 shrink-0" />
          <input 
            type="text"
            placeholder="Search investor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none"
          />
        </div>

        {/* MOBILE FILTERS */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter size={12} className="text-slate-400 mr-2 shrink-0" />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
            >
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select 
              value={filterLogo} 
              onChange={(e) => setFilterLogo(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Connected</option>
              <option value="Missing">Missing</option>
            </select>
          </div>
        </div>
      </div>

      {/* MOBILE CARD STREAM */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-bold text-xs bg-white border border-slate-200 rounded-2xl">Loading...</div>
      ) : filteredPioneers.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-bold text-xs bg-white border border-slate-200 rounded-2xl">No pioneers match search & filters.</div>
      ) : (
        <div className="space-y-3">
          {filteredPioneers.map((pioneer) => {
            const status = statusMap[pioneer.id];
            const isProcessing = processingId === pioneer.id;
            const hasLogo = Boolean(pioneer.logo_url);

            return (
              <div key={pioneer.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-3 relative">
                
                {/* Delete Button */}
                <button 
                  onClick={() => handleDelete(pioneer.id, pioneer.name)}
                  className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>

                {/* Card Header */}
                <div className="flex items-center gap-3 pr-8">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    {pioneer.logo_url ? (
                      <img src={pioneer.logo_url} alt={pioneer.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="text-slate-300 w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-900 text-xs truncate flex items-center gap-1">
                      {pioneer.name}
                      {hasLogo && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {pioneer.pioneer_type || 'Unk'}
                      </span>
                      {pioneer.tier && (
                        <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                          {pioneer.tier}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inputs Stack */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  
                  {/* X URL Input */}
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      placeholder="Paste X URL..."
                      value={xUrls[pioneer.id] || ''}
                      onChange={(e) => setXUrls({ ...xUrls, [pioneer.id]: e.target.value })}
                      className="flex-1 min-w-0 h-8 bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 font-medium"
                    />
                    <button
                      onClick={() => handleGenerateLogo(pioneer)}
                      disabled={isProcessing}
                      className="h-8 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <UploadCloud size={13} /> Gen
                    </button>
                  </div>

                  {/* Manual URL Input */}
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      placeholder="Direct image URL..."
                      value={manualUrls[pioneer.id] || ''}
                      onChange={(e) => setManualUrls({ ...manualUrls, [pioneer.id]: e.target.value })}
                      className="flex-1 min-w-0 h-8 bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 font-medium"
                    />
                    <button
                      onClick={() => handleSaveManualLogo(pioneer)}
                      disabled={isProcessing}
                      className="h-8 px-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <Save size={13} /> Save
                    </button>
                  </div>

                </div>

                {/* Status Message */}
                {status && (
                  <div className={`text-[10px] font-bold flex items-center gap-1 pt-0.5 ${
                    status.type === 'error' ? 'text-rose-500' :
                    status.type === 'success' ? 'text-emerald-600' : 'text-blue-500'
                  }`}>
                    {status.type === 'error' && <AlertCircle size={12} />}
                    {status.type === 'success' && <CheckCircle2 size={12} />}
                    <span>{status.msg}</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}