import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Play, Pause, CheckCircle2, ExternalLink, Timer, Trash2 } from 'lucide-react';
import { useTracker } from '../context/TrackerContext';

function formatDuration(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function TaskBottomSheetMobile({ task, isOpen, onClose }) {
  const { toggleTimer, completeTask, saveNotes, updatePriority, updateRecurrence, untrackTask, activeTimer, timerNow, timerStartedAt } = useTracker();
  const [activeTab, setActiveTab] = useState('action'); // 'action' or 'details'
  
  // Local states for Details tab
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (task) setNotes(task.notes || '');
  }, [task]);

  // Auto-save notes
  useEffect(() => {
    if (!task) return;
    const timeout = setTimeout(async () => {
      if (notes !== (task.notes || '')) {
        setSavingNotes(true);
        await saveNotes(task, notes);
        setSavingNotes(false);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [notes, task, saveNotes]);

  if (!isOpen || !task) return null;

  const isTiming = activeTimer?.id === task.id;
  const elapsed = isTiming && timerStartedAt ? Math.round((timerNow - timerStartedAt) / 1000) : 0;
  const totalSeconds = task.timeSpent + elapsed;

  const handleStartTask = () => {
    if (task.link) window.open(task.link, '_blank');
    if (!isTiming) toggleTimer(task);
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-x-0 bottom-0 z-[70] flex flex-col max-h-[85vh] h-[85vh] bg-white rounded-t-3xl shadow-2xl transition-transform">
        
        {/* Header & Tabs */}
        <div className="flex-shrink-0 pt-5 px-5 border-b border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-violet-600">{task.project}</p>
              <h2 className="text-xl font-bold text-slate-900 leading-tight mt-1">{task.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-6 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('action')}
              className={`pb-3 text-sm font-bold transition-colors ${activeTab === 'action' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500'}`}
            >
              Action Guide
            </button>
            <button 
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-sm font-bold transition-colors ${activeTab === 'details' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500'}`}
            >
              Task Details
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 pb-24">
          {activeTab === 'action' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tutorial</h3>
                {task.tutorialMarkdown ? (
                  <div className="prose prose-sm prose-slate max-w-none prose-a:text-violet-600">
                    <ReactMarkdown>{task.tutorialMarkdown}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">No step-by-step guide provided.</p>
                )}
              </div>

              {task.resources?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Resources</h3>
                  <div className="space-y-2">
                    {task.resources.map((res, i) => (
                      <a key={i} href={typeof res === 'string' ? res : res.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-violet-50 text-violet-700 rounded-xl text-sm font-semibold border border-violet-100">
                        {typeof res === 'string' ? 'Open link' : res.name || 'Open link'}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Notes</label>
                  <span className="text-[10px] font-medium text-slate-400">{savingNotes ? 'Saving...' : 'Saved'}</span>
                </div>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Write down personal progress, wallet addresses used, etc."
                  rows="4" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Priority</span>
                  <select 
                    value={task.priority} 
                    onChange={e => updatePriority(task, e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Recurrence</span>
                  <select 
                    value={task.recurrence} 
                    onChange={e => updateRecurrence(task, e.target.value, task.preferredTime)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="once">One-time</option><option value="24h">Daily</option><option value="7d">Weekly</option>
                  </select>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-sm font-medium text-slate-500">Time Tracked</span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Timer className="w-4 h-4 text-violet-500"/> {formatDuration(totalSeconds)}</span>
                </div>
              </div>

              <button 
                onClick={() => { onClose(); untrackTask(task); }} 
                className="w-full flex justify-center items-center gap-2 py-3 mt-4 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl active:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Untrack Task
              </button>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        {activeTab === 'action' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 pb-safe flex gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => toggleTimer(task)} 
              className={`flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl border-2 transition-all ${isTiming ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'}`}
            >
              {isTiming ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>
            
            {!isTiming && totalSeconds === 0 ? (
              <button onClick={handleStartTask} className="flex-1 bg-slate-900 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform">
                Start Task <ExternalLink className="w-4 h-4 text-slate-400" />
              </button>
            ) : (
              <button 
                onClick={() => { onClose(); completeTask(task); }} 
                className="flex-1 bg-violet-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-200 active:scale-[0.98] transition-transform"
              >
                Mark Complete <CheckCircle2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export function FloatingTimerPill({ onExpand }) {
  const { activeTimer, timerNow, timerStartedAt, toggleTimer } = useTracker();
  
  if (!activeTimer) return null;
  const elapsed = timerStartedAt ? Math.round((timerNow - timerStartedAt) / 1000) : 0;
  const totalSeconds = activeTimer.timeSpent + elapsed;

  return (
    <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[55] animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3 bg-slate-900 text-white p-1.5 pr-4 rounded-full shadow-2xl border border-slate-700">
        <button 
          onClick={(e) => { e.stopPropagation(); toggleTimer(activeTimer); }}
          className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all"
        >
          <Pause className="w-4 h-4 fill-amber-400 text-amber-400" />
        </button>
        
        <div className="flex flex-col cursor-pointer" onClick={() => onExpand(activeTimer)}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Timer</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold leading-none truncate max-w-[120px]">{activeTimer.name}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-xs font-semibold text-amber-400 font-mono tracking-tighter leading-none">{formatDuration(totalSeconds)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}