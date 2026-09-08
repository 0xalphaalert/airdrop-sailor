import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Image, UploadCloud, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Filter, Save, Trash2 } from 'lucide-react';

export default function InvestorLogoStudio() {
  const [pioneers, setPioneers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Per-item processing states
  const [xUrls, setXUrls] = useState({});
  const [manualUrls, setManualUrls] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [statusMap, setStatusMap] = useState({});

  // Filter States
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
    if (!window.confirm(`Are you sure you want to completely delete ${name}?`)) return;
    try {
      const { error } = await supabase.from('pioneer_profiles').delete().eq('id', id);
      if (error) throw error;
      setPioneers(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  // Derived state for filtering
  const uniqueTypes = ['All', ...new Set(pioneers.map(p => p.pioneer_type).filter(Boolean))];

  const filteredPioneers = pioneers.filter(pioneer => {
    if (filterType !== 'All' && pioneer.pioneer_type !== filterType) return false;
    if (filterLogo === 'Available' && !pioneer.logo_url) return false;
    if (filterLogo === 'Missing' && pioneer.logo_url) return false;
    return true;
  });

  return (
    <div className="w-full mx-auto space-y-4">
      
      {/* HEADER & FILTERS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <Sparkles className="text-blue-600 w-5 h-5" /> Pioneer Logo Studio
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Investors ({filteredPioneers.length}) • Extract X avatars securely or attach direct links.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-slate-400 mr-1">
            <Filter size={14} />
          </div>
          
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
          >
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
            ))}
          </select>

          <select 
            value={filterLogo} 
            onChange={(e) => setFilterLogo(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Connected</option>
            <option value="Missing">Missing</option>
          </select>

          <button 
            onClick={fetchPioneers}
            className="p-1.5 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors ml-auto md:ml-0"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* HIGH-DENSITY GRID RENDER */}
      {loading ? (
        <div className="py-10 text-center text-slate-500 font-bold bg-white border border-slate-200 rounded-2xl text-sm">Loading pioneers...</div>
      ) : filteredPioneers.length === 0 ? (
        <div className="py-10 text-center text-slate-500 font-bold bg-white border border-slate-200 rounded-2xl text-sm">No pioneers found matching filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredPioneers.map((pioneer) => {
            const status = statusMap[pioneer.id];
            const isProcessing = processingId === pioneer.id;
            const hasLogo = Boolean(pioneer.logo_url);

            return (
              <div key={pioneer.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-2.5 hover:shadow-md hover:border-blue-200 transition-all group relative">
                
                {/* Delete Button (Hover) */}
                <button 
                  onClick={() => handleDelete(pioneer.id, pioneer.name)}
                  className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="Delete Profile"
                >
                  <Trash2 size={12} />
                </button>

                {/* Header: Logo & Name */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    {pioneer.logo_url ? (
                      <img src={pioneer.logo_url} alt={pioneer.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="text-slate-300 w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="font-black text-slate-900 text-xs flex items-center gap-1 truncate">
                      {pioneer.name}
                      {hasLogo && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                    </h4>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {/* Category Badge */}
                      <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 px-1 py-0.5 rounded leading-none">
                        {pioneer.pioneer_type || 'Unk'}
                      </span>
                      {/* Tier Badge (If Available) */}
                      {pioneer.tier && (
                        <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 px-1 py-0.5 rounded leading-none border border-amber-100">
                          {pioneer.tier}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body: Compact Inputs */}
                <div className="flex flex-col gap-1.5 mt-1">
                  
                  {/* Action 1: X URL */}
                  <div className="flex gap-1">
                    <input 
                      type="text"
                      placeholder="X.com URL..."
                      value={xUrls[pioneer.id] || ''}
                      onChange={(e) => setXUrls({ ...xUrls, [pioneer.id]: e.target.value })}
                      className="flex-1 min-w-0 h-7 bg-slate-50 border border-slate-200 rounded-md px-2 text-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                    <button
                      onClick={() => handleGenerateLogo(pioneer)}
                      disabled={isProcessing}
                      className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all ${
                        isProcessing ? 'opacity-50 bg-blue-100 text-blue-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      }`}
                    >
                      <UploadCloud size={12} />
                    </button>
                  </div>

                  {/* Action 2: Direct URL */}
                  <div className="flex gap-1">
                    <input 
                      type="text"
                      placeholder="Direct image link..."
                      value={manualUrls[pioneer.id] || ''}
                      onChange={(e) => setManualUrls({ ...manualUrls, [pioneer.id]: e.target.value })}
                      className="flex-1 min-w-0 h-7 bg-slate-50 border border-slate-200 rounded-md px-2 text-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 font-medium"
                    />
                    <button
                      onClick={() => handleSaveManualLogo(pioneer)}
                      disabled={isProcessing}
                      className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all ${
                        isProcessing ? 'opacity-50 bg-slate-100 text-slate-400' : 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
                      }`}
                    >
                      <Save size={12} />
                    </button>
                  </div>

                </div>

                {/* Tiny Status Indicator */}
                <div className="h-3 flex items-center">
                  {status && (
                    <span className={`text-[9px] font-bold flex items-center gap-1 ${
                      status.type === 'error' ? 'text-rose-500' :
                      status.type === 'success' ? 'text-emerald-600' : 'text-blue-500'
                    }`}>
                      {status.type === 'error' && <AlertCircle size={10} />}
                      {status.type === 'success' && <CheckCircle2 size={10} />}
                      <span className="truncate">{status.msg}</span>
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}