import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Clock, AlertCircle, Server, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

// --- TIME FORMATTER ---
const timeAgo = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return '—';
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const formatNextRun = (dateString) => {
  if (!dateString) return 'Manual Trigger';
  const date = new Date(dateString);
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'Running soon...';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 60) return `In ${diffMins} mins`;
  return `In ${diffHours} hours`;
};

export default function SystemHealthDashboard() {
  const [healthData, setHealthData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchHealthData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_health_monitor')
        .select('*')
        .order('function_name');
      
      if (error) throw error;
      setHealthData(data || []);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to fetch health data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // --- REALTIME SUBSCRIPTION ---
    // Instantly updates the UI the exact second an Edge Function updates its row
    const healthSubscription = supabase
      .channel('health_monitor_changes')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'system_health_monitor' }, 
        (payload) => {
          console.log("Realtime ping received!", payload);
          fetchHealthData(); // Re-fetch to get the cleanest fresh data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(healthSubscription);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Activity size={18} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Command Center</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Health</h1>
          <p className="text-sm text-slate-500 mt-1">Live monitoring for automated cron jobs and Supabase Edge Functions.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-400">
            Last ping: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button 
            onClick={fetchHealthData} 
            disabled={isLoading}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      {isLoading && healthData.length === 0 ? (
        <div className="flex justify-center items-center h-64 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw size={24} className="animate-spin" />
            <span className="text-sm font-bold uppercase tracking-wider">Syncing with server...</span>
          </div>
        </div>
      ) : healthData.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <AlertCircle size={32} className="text-amber-500 mb-3" />
          <span className="text-sm font-bold text-slate-700">No Edge Functions Found</span>
          <span className="text-xs text-slate-500 mt-1">Please ensure you ran the INSERT SQL in Supabase.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {healthData.map((func) => {
            const isFailing = func.status === 'Failing';
            const isWarning = func.status === 'Warning';
            
            return (
              <div key={func.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shadow-sm">
                      <Server size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{func.function_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{func.description}</p>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{func.status}</span>
                    <div className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isFailing ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${
                        isFailing ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></span>
                    </div>
                  </div>
                </div>

                {/* Card Body - Timestamps */}
                <div className="p-5 space-y-4 flex-1">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <CheckCircle2 size={16} />
                      <span className="font-semibold">Last Run</span>
                    </div>
                    <span className="font-bold text-slate-900">{timeAgo(func.last_run_at)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={16} />
                      <span className="font-semibold">Next Expected</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatNextRun(func.next_expected_run_at)}</span>
                  </div>

                  {/* Error Log Block (Only shows if failing or error exists) */}
                  {(isFailing || func.last_error) && (
                    <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs mb-1 uppercase tracking-wider">
                        <AlertCircle size={14} /> Error Log
                      </div>
                      <p className="text-xs text-rose-600 font-mono break-words leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">
                        {func.last_error || "Unknown execution failure."}
                      </p>
                    </div>
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