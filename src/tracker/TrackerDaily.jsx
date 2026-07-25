import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleDollarSign, Clock3, Ellipsis, Filter, Flame, FolderKanban, Gift,
  ListPlus, Play, Plus, Repeat2, Timer, Trophy, Zap,
} from 'lucide-react';

const DAY = 86400000;
const intervalLabels = { once: 'One-time', '24h': 'Daily', '7d': 'Weekly', '30d': 'Monthly' };

const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const isComplete = task => task.status === 'completed';
const completedToday = task => task.lastCompletedAt && new Date(task.lastCompletedAt) >= startOfDay(new Date());
const normalizeProjectTask = row => {
  const definition = row.tasks || {};
  return { id: `project-${row.id}`, sourceId: row.id, source: 'project', name: definition.name || 'Untitled task', project: row.projects?.name || 'Project task', projectLogo: row.projects?.logo_url, notes: row.notes || '', link: definition.link || row.link, resources: definition.resources || [], priority: row.priority || 'Medium', recurrence: row.custom_interval || 'once', nextDue: row.next_due_time, preferredTime: row.preferred_time || '', status: row.status || 'pending', lastCompletedAt: row.last_completed_at, timeSpent: Number(row.time_spent_seconds) || 0, xp: Number(definition.xp) || 0, sail: Number(definition.sail || definition.sail_reward || row.sail_reward) || 0 };
};
const normalizeCustomTask = row => ({ id: `custom-${row.id}`, sourceId: row.id, source: 'custom', name: row.name || row.title || row.task_name || 'Personal task', project: row.project_name || 'Personal Workspace', projectLogo: row.project_logo_url, notes: row.notes || row.note || row.description || '', link: row.link || row.url, resources: row.resources || [], priority: row.priority || 'Medium', recurrence: row.custom_interval || row.recurrence || 'once', nextDue: row.next_due_time || row.due_date, preferredTime: row.preferred_time || '', status: row.status || 'pending', lastCompletedAt: row.last_completed_at, timeSpent: Number(row.time_spent_seconds) || 0, xp: Number(row.xp) || 0, sail: Number(row.sail || row.sail_reward) || 0 });

function formatDuration(seconds = 0) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

function timeLeft(date) {
  if (!date) return { label: 'No due date', className: 'text-slate-400' };
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  if (seconds < 0) return { label: `${formatDuration(Math.abs(seconds))} late`, className: 'text-rose-500' };
  return { label: `${formatDuration(seconds)} left`, className: seconds < 86400 ? 'text-blue-600' : 'text-slate-500' };
}

export default function TrackerDaily() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerNow, setTimerNow] = useState(Date.now());
  const [showFilters, setShowFilters] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [projectResult, customResult] = await Promise.all([
        supabase.from('tracker_user_tasks').select('*, tasks (*), projects (id, name, logo_url)').eq('auth_id', user.id).order('next_due_time', { ascending: true }),
        supabase.from('tracker_custom_tasks').select('*').eq('auth_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (projectResult.error) throw projectResult.error;
      if (customResult.error) console.warn('Unable to load personal tasks:', customResult.error.message);
      setTasks([...(projectResult.data || []).map(normalizeProjectTask), ...(customResult.data || []).map(normalizeCustomTask)]);
    } catch (error) { console.error('Unable to load daily tasks:', error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => {
    if (!activeTimer) return undefined;
    const interval = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  const dailyTasks = useMemo(() => {
    return tasks
      .filter(task => {
        if (task.status === 'pending') return true;
        if (completedToday(task)) return true;
        return false;
      })
      .sort((a, b) => new Date(a.nextDue || '9999-12-31') - new Date(b.nextDue || '9999-12-31'));
  }, [tasks]);
  const groups = useMemo(() => {
    const todayEnd = startOfDay(new Date(Date.now() + DAY)).getTime();
    const cutoff = Date.now() + 3 * 3600000;
    const activeTasks = dailyTasks.filter(task => task.status !== 'completed');

    return {
      now: activeTasks.filter(task => !completedToday(task) && task.nextDue && new Date(task.nextDue).getTime() <= cutoff),
      today: activeTasks.filter(task => !completedToday(task) && task.nextDue && new Date(task.nextDue).getTime() > cutoff && new Date(task.nextDue).getTime() < todayEnd),
      upcoming: activeTasks.filter(task => completedToday(task) || !task.nextDue || new Date(task.nextDue).getTime() >= todayEnd),
    };
  }, [dailyTasks]);
  const completed = dailyTasks.filter(isComplete);
  const xpEarnable = dailyTasks.filter(task => !isComplete(task)).reduce((sum, task) => sum + task.xp, 0);
  const sailEarnable = dailyTasks.filter(task => !isComplete(task)).reduce((sum, task) => sum + task.sail, 0);
  const xpEarned = completed.reduce((sum, task) => sum + task.xp, 0);
  const sailEarned = completed.reduce((sum, task) => sum + task.sail, 0);
  const completionPercent = dailyTasks.length ? Math.round(completed.length / dailyTasks.length * 100) : 0;

  const toggleTimer = async task => {
    if (!activeTimer) { const startedAt = Date.now(); setTimerStartedAt(startedAt); setTimerNow(startedAt); setActiveTimer(task); return; }
    if (activeTimer.id !== task.id) return;
    const elapsed = Math.max(1, Math.round((Date.now() - timerStartedAt) / 1000));
    try {
      const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
      const { error } = await supabase.from(table).update({ time_spent_seconds: task.timeSpent + elapsed }).eq('id', task.sourceId);
      if (error) throw error;
      setActiveTimer(null); setTimerStartedAt(null); await fetchTasks();
    } catch (error) { console.error('Unable to save timer:', error); }
  };
  const startTask = task => {
    const firstResource = Array.isArray(task.resources) ? task.resources[0] : null;
    const url = task.link || (typeof firstResource === 'string' ? firstResource : firstResource?.url);
    if (url) window.open(url, '_blank');
    toggleTimer(task);
  };
  const completeTask = async (task) => {
    try {
      const table = task.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';
      const now = new Date();
      const completedAt = now.toISOString();

      const getRecurrenceType = (val) => {
        if (!val) return 'once';
        const lower = val.toLowerCase();
        if (lower === 'daily' || lower === '24h') return 'daily';
        if (lower === 'weekly' || lower === '7d') return 'weekly';
        if (lower === 'monthly' || lower === '30d') return 'monthly';
        return 'once';
      };

      const recurrenceType = getRecurrenceType(task.recurrence);

      let newStatus = 'pending';
      let nextDue = null;

      if (recurrenceType === 'once') {
        newStatus = 'completed';
        nextDue = null;
      } else {
        let baseDate;

        if (task.nextDue && new Date(task.nextDue) > now) {
          baseDate = new Date(task.nextDue);
        } else {
          baseDate = new Date();
          if (task.preferredTime) {
            const [hours, minutes] = task.preferredTime.split(':');
            baseDate.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
          }
        }

        if (recurrenceType === 'daily') {
          baseDate.setDate(baseDate.getDate() + 1);
        } else if (recurrenceType === 'weekly') {
          baseDate.setDate(baseDate.getDate() + 7);
        } else if (recurrenceType === 'monthly') {
          baseDate.setMonth(baseDate.getMonth() + 1);
        }

        nextDue = baseDate.toISOString();
      }

      const { error } = await supabase
        .from(table)
        .update({ status: newStatus, last_completed_at: completedAt, next_due_time: nextDue })
        .eq('id', task.sourceId);

      if (error) throw error;

      await fetchTasks();

      if (activeTimer?.id === task.id) {
        setActiveTimer(null);
        setTimerStartedAt(null);
      }
    } catch (error) {
      console.error('Unable to complete task:', error);
    }
  };
  const editPersonalNote = async task => {
    const notes = window.prompt('Edit personal note', task.notes || '');
    if (notes === null) return;
    try {
      const { error } = await supabase.from('tracker_custom_tasks').update({ notes }).eq('id', task.sourceId);
      if (error) throw error;
      setTasks(current => current.map(item => item.id === task.id ? { ...item, notes } : item));
    } catch (error) { console.error('Unable to update personal note:', error); }
  };

  return <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8">
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <main className="min-w-0">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-semibold tracking-tight text-slate-900">Daily Tasks</h1><p className="mt-1 text-sm font-medium text-slate-500">A focused, prioritized plan to keep your streak and rewards growing.</p></div><div className="flex gap-2"><button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm"><Trophy className="h-4 w-4 text-violet-500" /> Sorted by Priority <ChevronDown className="h-3.5 w-3.5" /></button><button onClick={() => setShowFilters(value => !value)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm"><Filter className="h-4 w-4" /> Filters</button></div></header>
        {showFilters && <div className="mb-5 flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700"><span>Daily feed only includes pending tasks and tasks completed today.</span><button onClick={() => setShowFilters(false)} className="text-xs font-semibold">Close</button></div>}
        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5"><Stat label="Tasks Today" value={dailyTasks.length} icon={ListPlus} tone="violet" /><Stat label="Completed" value={completed.length} icon={CheckCircle2} tone="emerald" /><Stat label="Remaining" value={dailyTasks.length - completed.length} icon={Clock3} tone="rose" /><Stat label="XP Earnable" value={`+${xpEarnable}`} icon={Zap} tone="violet" /><Stat label="SAIL Earnable" value={`+${sailEarnable}`} icon={CircleDollarSign} tone="blue" /></section>
        {groups.now.length > 0 && <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm"><Flame className="h-5 w-5 fill-blue-400" /></span><div><p className="font-semibold text-slate-900">{groups.now.length} {groups.now.length === 1 ? 'task is' : 'tasks are'} due in the next 2 hours</p><p className="text-xs font-medium text-violet-600">Tackle them first to protect your daily momentum.</p></div></div><button onClick={() => document.getElementById('due-now')?.scrollIntoView({ behavior: 'smooth' })} className="h-9 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-violet-700">View Now</button></section>}
        {loading ? <div className="grid min-h-80 place-items-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-400">Loading your daily plan…</div> : <div className="space-y-7"><TaskSection id="due-now" icon="🔥" title="Due Now" subtitle="Tasks that need attention in the next few hours." tasks={groups.now} kind="now" onStart={startTask} onComplete={completeTask} onEditNote={editPersonalNote} activeTimer={activeTimer} timerNow={timerNow} /><TaskSection icon="📅" title="Due Today" subtitle="Finish these later today to keep the board clear." tasks={groups.today} kind="today" onStart={startTask} onComplete={completeTask} onEditNote={editPersonalNote} activeTimer={activeTimer} timerNow={timerNow} /><TaskSection icon="⏳" title="Upcoming" subtitle="Scheduled for tomorrow and beyond." tasks={groups.upcoming} kind="upcoming" onStart={startTask} onComplete={completeTask} onEditNote={editPersonalNote} activeTimer={activeTimer} timerNow={timerNow} /></div>}
        <section className="sticky bottom-3 z-10 mt-7 rounded-2xl border border-violet-200 bg-white/95 p-4 shadow-lg backdrop-blur"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">Daily Goal Progress <span className="ml-1 text-violet-600">{completed.length}/{dailyTasks.length} tasks</span></p><p className="mt-0.5 text-xs font-medium text-slate-500">Complete everything today for a <span className="text-blue-600">+15% XP</span> and <span className="text-blue-600">+10% SAIL</span> bonus.</p></div><span className="text-sm font-semibold text-violet-600">{completionPercent}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all" style={{ width: `${completionPercent}%` }} /></div></section>
      </main>
      <aside className="space-y-5 xl:sticky xl:top-5"><CalendarWidget tasks={dailyTasks} /><StreakWidget tasks={dailyTasks} /><RewardsWidget xp={xpEarned} sail={sailEarned} /><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2><div className="mt-3 space-y-1"><QuickAction icon={Plus} text="Add Personal Task" onClick={() => navigate('/tracker/tasks')} /><QuickAction icon={Timer} text="Add Reminder" onClick={() => navigate('/tracker/tasks')} /><QuickAction icon={CalendarDays} text="View Calendar" onClick={() => document.querySelector('[data-calendar]')?.scrollIntoView({ behavior: 'smooth' })} /><QuickAction icon={Gift} text="Check Alpha Drops" onClick={() => navigate('/tracker/airdrops')} /></div></section></aside>
    </div>
  </div>;
}

function Stat({ label, value, icon, tone }) { const tones = { violet: 'bg-violet-50 text-violet-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600', blue: 'bg-blue-50 text-blue-600' }; return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{label}</span><span className={`grid h-8 w-8 place-items-center rounded-lg ${tones[tone]}`}>{React.createElement(icon, { className: 'h-4 w-4' })}</span></div><p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p></div>; }
function TaskSection({ id, icon, title, subtitle, tasks, kind, onStart, onComplete, onEditNote, activeTimer }) { return <section id={id}><div className="mb-3 flex items-end justify-between"><div><h2 className="text-lg font-semibold text-slate-900"><span className="mr-2">{icon}</span>{title} <span className="ml-1 text-sm font-medium text-slate-400">{tasks.length}</span></h2><p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p></div></div><div className="space-y-2">{tasks.length ? tasks.map(task => <TaskRow key={task.id} task={task} kind={kind} onStart={onStart} onComplete={onComplete} onEditNote={onEditNote} activeTimer={activeTimer} />) : <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm font-medium text-slate-400">Nothing here — you’re all caught up.</div>}</div></section>; }
function TaskRow({ task, kind, onStart, onComplete, onEditNote, activeTimer }) { const [menuOpen, setMenuOpen] = useState(false); const due = timeLeft(task.nextDue); const timing = activeTimer?.id === task.id; const action = kind === 'upcoming' ? 'Upcoming' : timing ? 'Pause' : task.timeSpent > 0 ? 'Continue' : 'Start'; const initials = task.project.split(' ').map(word => word[0]).join('').slice(0, 2); return <article className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-violet-200 hover:shadow-md sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-violet-100 text-xs font-bold text-violet-600">{task.projectLogo ? <img src={task.projectLogo} alt="" className="h-full w-full object-cover" /> : <>{initials || <FolderKanban className="h-4 w-4" />}</>}</div><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-900">{task.name}</h3><div className="mt-1 flex flex-wrap items-center gap-1.5"><span className="text-xs font-medium text-slate-500">{task.project}</span><span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">{task.priority}</span></div><p className="mt-1 truncate text-xs text-slate-400">{task.notes || 'Complete this task to move closer to today’s goal.'}</p></div></div><div className="flex shrink-0 items-center gap-5 sm:w-[205px]"><div className="text-xs font-semibold"><p className="flex items-center gap-1 text-emerald-600"><Repeat2 className="h-3.5 w-3.5" />{intervalLabels[task.recurrence] || task.recurrence}</p><p className={`mt-1 flex items-center gap-1 ${due.className}`}><Clock3 className="h-3.5 w-3.5" />{due.label}</p></div><div className="text-right text-xs font-semibold"><p className="flex items-center justify-end gap-1 text-violet-600"><Zap className="h-3.5 w-3.5" />+{task.xp} XP</p><p className="mt-1 flex items-center justify-end gap-1 text-blue-600"><CircleDollarSign className="h-3.5 w-3.5" />+{task.sail} SAIL</p></div></div><div className="relative flex shrink-0 items-center gap-2"><button disabled={kind === 'upcoming' || (!!activeTimer && !timing)} onClick={() => onStart(task)} className={`h-9 rounded-lg px-4 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed ${kind === 'upcoming' ? 'bg-blue-50 text-blue-400' : kind === 'now' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'} ${activeTimer && !timing ? 'opacity-50' : ''}`}>{action}</button><button onClick={() => setMenuOpen(open => !open)} aria-label="Task actions" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><Ellipsis className="h-4 w-4" /></button>{menuOpen && <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"><button onClick={() => { setMenuOpen(false); onComplete(task); }} className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">✅ Mark Complete</button><button onClick={() => { setMenuOpen(false); task.source === 'custom' ? onEditNote(task) : null; }} className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50">{task.source === 'custom' ? 'Edit Personal Note' : 'Skip'}</button></div>}</div></article>; }
function CalendarWidget({ tasks }) { const now = new Date(); const year = now.getFullYear(); const month = now.getMonth(); const first = new Date(year, month, 1); const offset = first.getDay(); const days = new Date(year, month + 1, 0).getDate(); const dots = day => tasks.filter(task => task.nextDue && new Date(task.nextDue).getFullYear() === year && new Date(task.nextDue).getMonth() === month && new Date(task.nextDue).getDate() === day).length; return <section data-calendar className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-900">{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2><div className="flex gap-1"><ChevronLeft className="h-4 w-4 text-slate-400" /><ChevronRight className="h-4 w-4 text-slate-400" /></div></div><div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">{'SMTWTFS'.split('').map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-1">{Array.from({ length: offset + days }, (_, index) => { const day = index - offset + 1; if (day < 1) return <span key={index} />; const count = dots(day); const today = day === now.getDate(); return <div key={day} className="flex h-8 flex-col items-center justify-center"><span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${today ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600'}`}>{day}</span>{count > 0 && <i className="mt-0.5 h-1 w-1 rounded-full bg-blue-400" />}</div>; })}</div><div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-500"><i className="h-2 w-2 rounded-full bg-violet-500" /> Today <i className="ml-2 h-2 w-2 rounded-full bg-blue-400" /> Tasks scheduled</div></section>; }
function StreakWidget({ tasks }) { const activeDays = Array.from({ length: 7 }, (_, index) => { const date = startOfDay(new Date(new Date().getTime() - (6 - index) * DAY)); return tasks.some(task => task.lastCompletedAt && startOfDay(new Date(task.lastCompletedAt)).getTime() === date.getTime()); }); const streak = activeDays.slice().reverse().findIndex(day => !day); const count = streak === -1 ? 7 : streak; return <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"><h2 className="text-left text-sm font-semibold text-slate-900">Streak Status</h2><div className="relative mx-auto mt-4 grid h-36 w-36 place-items-center rounded-full" style={{ background: 'conic-gradient(#2563eb 0 78%, #eff6ff 0)' }}><div className="grid h-28 w-28 place-items-center rounded-full bg-white"><Flame className="h-6 w-6 fill-blue-400 text-blue-500" /><p className="-mt-5 text-xl font-semibold text-slate-900">{count || 0}</p><span className="-mt-5 text-[10px] font-medium text-slate-400">Day Streak</span></div></div><div className="mt-5 grid grid-cols-7 gap-1">{activeDays.map((active, index) => <div key={index}><span className="text-[9px] font-semibold text-slate-400">{'MTWTFSS'[index]}</span><div className={`mx-auto mt-1 grid h-5 w-5 place-items-center rounded-md ${active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300'}`}>{active && <Check className="h-3 w-3" />}</div></div>)}</div></section>; }
function RewardsWidget({ xp, sail }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-900">Rewards Today</h2><div className="mt-4 grid grid-cols-2 gap-3"><Reward icon={Zap} label="XP Earned" value={xp} tone="violet" /><Reward icon={CircleDollarSign} label="SAIL Earned" value={sail} tone="blue" /></div></section>; }
function Reward({ icon, label, value, tone }) { return <div className="text-center"><div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${tone === 'violet' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'}`}>{React.createElement(icon, { className: 'h-5 w-5' })}</div><p className="mt-2 text-sm font-semibold text-slate-900">{value}</p><p className="text-[10px] font-medium text-slate-400">{label}</p></div>; }
function QuickAction({ icon, text, onClick }) { return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-600">{React.createElement(icon, { className: 'h-4 w-4' })}{text}</button>; }
