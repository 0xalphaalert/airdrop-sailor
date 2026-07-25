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
      await supabase.from(table).update({ time_spent_seconds: task.timeSpent + elapsed }).eq('id', task.sourceId);
      setActiveTimer(null); 
      setTimerStartedAt(null); 
      await fetchTasks();
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

      await supabase.from(table).update({ status: newStatus, last_completed_at: now.toISOString(), next_due_time: nextDue }).eq('id', task.sourceId);
      await fetchTasks();
      if (activeTimer?.id === task.id) { setActiveTimer(null); setTimerStartedAt(null); }
    } catch (error) { console.error('Unable to complete task:', error); }
  };

  const saveNotes = async (task, notes) => {
    const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
    await supabase.from(table).update({ notes }).eq('id', task.sourceId);
    await fetchTasks();
  };

  const updatePriority = async (task, priority) => {
    const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
    await supabase.from(table).update({ priority }).eq('id', task.sourceId);
    await fetchTasks();
  };

  const updateRecurrence = async (task, recurrence, preferredTime) => {
    const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
    await supabase.from(table).update({ custom_interval: recurrence, preferred_time: preferredTime }).eq('id', task.sourceId);
    await fetchTasks();
  };

  const untrackTask = async (task) => {
    const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
    await supabase.from(table).delete().eq('id', task.sourceId);
    if (activeTimer?.id === task.id) { setActiveTimer(null); setTimerStartedAt(null); }
    await fetchTasks();
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