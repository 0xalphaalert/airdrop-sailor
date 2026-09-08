import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

const TrackerContext = createContext();

export function useTracker() {
  return useContext(TrackerContext);
}

// Helper functions (same as desktop)
const normalizeProjectTask = (row) => {
  const definition = row.tasks || {};
  return { id: `project-${row.id}`, sourceId: row.id, source: 'project', name: definition.name || 'Untitled task', project: row.projects?.name || 'Project task', projectLogo: row.projects?.logo_url, notes: row.notes || '', tutorialMarkdown: definition.tutorial_markdown || '', resources: definition.resources || [], link: definition.link || row.link, priority: row.priority || 'Medium', recurrence: row.custom_interval || 'once', nextDue: row.next_due_time, preferredTime: row.preferred_time || '', status: row.status || 'pending', lastCompletedAt: row.last_completed_at, timeSpent: Number(row.time_spent_seconds) || 0, xp: Number(definition.xp) || 0, sail: Number(definition.sail || definition.sail_reward || row.sail_reward) || 0 };
};

const normalizeCustomTask = (row) => ({ id: `custom-${row.id}`, sourceId: row.id, source: 'custom', name: row.name || row.title || row.task_name || 'Personal task', project: row.project_name || 'Personal Workspace', projectLogo: row.project_logo_url, notes: row.notes || row.note || row.description || '', tutorialMarkdown: row.tutorial_markdown || '', resources: row.resources || [], link: row.link || row.url, priority: row.priority || 'Medium', recurrence: row.custom_interval || row.recurrence || 'once', nextDue: row.next_due_time || row.due_date, preferredTime: row.preferred_time || '', status: row.status || 'pending', lastCompletedAt: row.last_completed_at, timeSpent: Number(row.time_spent_seconds) || 0, xp: Number(row.xp) || 0, sail: Number(row.sail || row.sail_reward) || 0 });

export function TrackerProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerNow, setTimerNow] = useState(Date.now());

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [projectResult, customResult] = await Promise.all([
        supabase.from('tracker_user_tasks').select('*, tasks (*), projects (id, name, logo_url)').eq('auth_id', user.id).order('next_due_time', { ascending: true }),
        supabase.from('tracker_custom_tasks').select('*').eq('auth_id', user.id).order('created_at', { ascending: false }),
      ]);
      setTasks([...(projectResult.data || []).map(normalizeProjectTask), ...(customResult.data || []).map(normalizeCustomTask)]);
    } catch (error) { console.error('Unable to load tasks:', error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Global Timer Tick
  useEffect(() => {
    if (!activeTimer) return undefined;
    const interval = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  const toggleTimer = async (task) => {
    if (!activeTimer) { 
      const startedAt = Date.now(); 
      setTimerStartedAt(startedAt); 
      setTimerNow(startedAt); 
      setActiveTimer(task); 
      return; 
    }
    if (activeTimer.id !== task.id) return;
    const elapsed = Math.max(1, Math.round((Date.now() - timerStartedAt) / 1000));
    try {
      const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
      
      // Optimistic update
      const newTime = task.timeSpent + elapsed;
      task.timeSpent = newTime;
      setTasks(current => current.map(item => item.id === task.id ? { ...item, timeSpent: newTime } : item));
      
      setActiveTimer(null); 
      setTimerStartedAt(null); 
      
      await supabase.from(table).update({ time_spent_seconds: newTime }).eq('id', task.sourceId);
    } catch (error) { console.error('Unable to save timer:', error); }
  };

  const completeTask = async (task) => {
    try {
      const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
      const now = new Date();
      
      let newStatus = 'pending';
      let nextDue = null;

      if (task.recurrence === 'once') {
        newStatus = 'completed';
      } else {
        let baseDate = (task.nextDue && new Date(task.nextDue) > now) ? new Date(task.nextDue) : new Date();
        if (task.preferredTime) {
          const [hours, minutes] = task.preferredTime.split(':');
          baseDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
        }
        if (task.recurrence === '24h' || task.recurrence.toLowerCase() === 'daily') baseDate.setDate(baseDate.getDate() + 1);
        else if (task.recurrence === '7d' || task.recurrence.toLowerCase() === 'weekly') baseDate.setDate(baseDate.getDate() + 7);
        else if (task.recurrence === '30d' || task.recurrence.toLowerCase() === 'monthly') baseDate.setMonth(baseDate.getMonth() + 1);
        nextDue = baseDate.toISOString();
      }

      // Optimistic update
      task.status = newStatus;
      task.nextDue = nextDue;
      task.lastCompletedAt = now.toISOString();
      setTasks(current => current.map(item => item.id === task.id ? { ...item, status: newStatus, nextDue, lastCompletedAt: task.lastCompletedAt } : item));

      if (activeTimer?.id === task.id) { setActiveTimer(null); setTimerStartedAt(null); }
      
      await supabase.from(table).update({ status: newStatus, last_completed_at: task.lastCompletedAt, next_due_time: nextDue }).eq('id', task.sourceId);
    } catch (error) { console.error('Unable to complete task:', error); }
  };

  const saveNotes = async (task, notes) => {
    // 1. Optimistic Update (fixes the cursor wiping issue instantly)
    task.notes = notes; 
    setTasks(current => current.map(item => item.id === task.id ? { ...item, notes } : item));
    
    // 2. Silent background save
    const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
    await supabase.from(table).update({ notes }).eq('id', task.sourceId);
  };

  const updatePriority = async (task, priority) => {
    // 1. Optimistic Update
    task.priority = priority;
    setTasks(current => current.map(item => item.id === task.id ? { ...item, priority } : item));

    // 2. Silent background save
    const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
    await supabase.from(table).update({ priority }).eq('id', task.sourceId);
  };

  const updateRecurrence = async (task, recurrence, preferredTime) => {
    // 1. Optimistic Update (fixes the snapping dropdown issue)
    task.recurrence = recurrence;
    task.preferredTime = preferredTime;
    setTasks(current => current.map(item => item.id === task.id ? { ...item, recurrence, preferredTime } : item));

    // 2. Silent background save
    const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
    await supabase.from(table).update({ custom_interval: recurrence, preferred_time: preferredTime }).eq('id', task.sourceId);
  };

  const untrackTask = async (task) => {
    // 1. Optimistic UI removal
    setTasks(current => current.filter(item => item.id !== task.id));
    if (activeTimer?.id === task.id) { setActiveTimer(null); setTimerStartedAt(null); }

    // 2. Background delete
    const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
    await supabase.from(table).delete().eq('id', task.sourceId);
  };

  return (
    <TrackerContext.Provider value={{
      tasks, loading, fetchTasks,
      activeTimer, timerStartedAt, timerNow,
      toggleTimer, completeTask, saveNotes, updatePriority, updateRecurrence, untrackTask
    }}>
      {children}
    </TrackerContext.Provider>
  );
}