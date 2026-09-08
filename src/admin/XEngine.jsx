import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle2, Clock, Sparkles, Loader2, AlertCircle, XCircle, Send } from 'lucide-react';

export default function XEngine() {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [historyPosts, setHistoryPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchXQueues();
  }, []);

  const fetchXQueues = async () => {
    setIsLoading(true);
    try {
      const { data: pendingData, error: pendingError } = await supabase
        .from('scheduled_posts')
        .select('*')
        .contains('target_channels', ['x'])
        .in('x_status', ['pending', 'approved'])
        .order('scheduled_at', { ascending: true });

      if (pendingError) throw pendingError;
      setPendingPosts(pendingData || []);

      const { data: historyData, error: historyError } = await supabase
        .from('scheduled_posts')
        .select('*')
        .contains('target_channels', ['x'])
        .in('x_status', ['posted', 'failed'])
        .order('scheduled_at', { descending: true });

      if (historyError) throw historyError;
      setHistoryPosts(historyData || []);

    } catch (error) {
      console.error("Error fetching X queues:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (id, newText) => {
    setPendingPosts(pendingPosts.map(p => p.id === id ? { ...p, x_content: newText } : p));
  };

  const handleTimeChange = (id, newTime) => {
    setPendingPosts(pendingPosts.map(p => p.id === id ? { ...p, scheduled_at: newTime } : p));
  };

  const handleApprove = async (post) => {
    setProcessingId(post.id);
    try {
      const finalContent = post.x_content || post.raw_content;
      const finalTime = new Date(post.scheduled_at).toISOString();

      const { error } = await supabase
        .from('scheduled_posts')
        .update({ 
          x_content: finalContent,
          scheduled_at: finalTime,
          x_status: 'approved' 
        })
        .eq('id', post.id);

      if (error) throw error;
      fetchXQueues(); 
    } catch (error) {
      alert("Failed to approve post: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden font-sans">
      
      {/* 1. MASTER HEADER (Edge to Edge) */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white shrink-0 flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="text-blue-500 text-3xl leading-none">𝕏</span> ENGINE QUEUE
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage your upcoming timeline and review past dispatches.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          System Online
        </div>
      </div>

      {/* 2. SPLIT PANE DASHBOARD */}
      <div className="flex-1 flex overflow-hidden bg-slate-50">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: ACTION QUEUE (65% width)      */}
        {/* ========================================== */}
        <div className="w-2/3 flex flex-col border-r border-slate-200 overflow-hidden relative">
          
          {/* Column Header */}
          <div className="px-8 py-4 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md shrink-0 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Action Queue
            </h2>
            <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-blue-200 shadow-sm">
              {pendingPosts.length} Pending
            </span>
          </div>

          {/* Column Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {pendingPosts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-600">Queue is empty</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">Schedule posts from the Studio to populate this engine.</p>
              </div>
            ) : (
              pendingPosts.map(post => {
                const isApproved = post.x_status === 'approved';
                const displayContent = post.x_content !== null ? post.x_content : post.raw_content;

                return (
                  <div key={post.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${isApproved ? 'border-emerald-400 shadow-emerald-500/10' : 'border-slate-200 hover:border-blue-300'}`}>
                    <div className="flex gap-5">
                      
                      {/* Image Preview */}
                      <div className="w-40 shrink-0 flex flex-col gap-2">
                        <div className="w-full aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                          {post.image_url ? <img src={post.image_url} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">NO IMAGE</div>}
                        </div>
                        <div className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest ${isApproved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {post.x_status}
                        </div>
                      </div>

                      {/* Content & Controls */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Source: {post.content_type}</span>
                        </div>

                        <textarea 
                          value={displayContent || ''}
                          onChange={(e) => handleContentChange(post.id, e.target.value)}
                          disabled={isApproved}
                          rows="3"
                          className={`w-full flex-1 rounded-lg p-3 text-sm font-medium leading-relaxed resize-none outline-none transition-colors border ${isApproved ? 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                        />

                        <div className="flex items-center justify-between mt-3">
                          <input 
                            type="datetime-local" 
                            value={new Date(new Date(post.scheduled_at).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
                            onChange={(e) => handleTimeChange(post.id, e.target.value)}
                            disabled={isApproved}
                            className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border outline-none ${isApproved ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'}`}
                          />
                          {!isApproved && (
                            <button onClick={() => handleApprove(post)} disabled={processingId === post.id} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-black text-xs transition-all shadow-sm disabled:opacity-50">
                              {processingId === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: HISTORY LOG (35% width)      */}
        {/* ========================================== */}
        <div className="w-1/3 flex flex-col bg-slate-100/50 overflow-hidden relative">
          
          {/* Column Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-100/80 backdrop-blur-md shrink-0 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Send className="w-4 h-4 text-slate-400" /> History Log
            </h2>
          </div>

          {/* Column Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {historyPosts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <p className="text-sm font-bold text-slate-400">No past dispatches.</p>
              </div>
            ) : (
              historyPosts.map(post => {
                const isFailed = post.x_status === 'failed';
                
                return (
                  <div key={post.id} className="bg-white/60 rounded-xl p-4 shadow-sm border border-slate-200/60 hover:bg-white hover:border-slate-300 transition-all">
                    <div className="flex gap-4">
                      
                      {/* Tiny Thumbnail */}
                      <div className="w-12 h-12 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {post.image_url ? <img src={post.image_url} alt="Thumb" className="w-full h-full object-cover grayscale opacity-80" /> : null}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-snug">
                          {post.x_content || post.raw_content}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(post.scheduled_at).toLocaleDateString()}
                          </span>
                          <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                            isFailed ? 'bg-rose-50 text-rose-600' : 'text-slate-500'
                          }`}>
                            {isFailed ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {post.x_status}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}