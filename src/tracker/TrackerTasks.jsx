import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  CalendarClock, CheckCircle2, ChevronDown, CircleAlert, ClipboardList, Clock3,
  ExternalLink, Flame, FolderKanban, LayoutGrid, List, ListFilter, Pause, Play,
  Plus, Repeat2, Search, X, ChevronLeft, ChevronRight, Timer,
} from 'lucide-react';

import {
  buildCompletionPayload,
  calculateNextDueDate,
  emitTrackerUpdate,
  formatDuration,
  intervalLabels,
  isComplete,
  isOverdue,
  normalizeCustomTask,
  normalizeProjectTask,
  priorityTone,
  statusFor,
  tableForTask,
  timeLeft,
} from './trackerUtils';

const EMPTY_FORM = { name: '', notes: '', priority: 'Medium', recurrence: 'once', dueDate: '' };


export default function TrackerTasks() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(() => searchParams.get('search') || '');
  const [filters, setFilters] = useState({ project: 'all', status: 'all', recurrence: 'all' });
  const [selectedId, setSelectedId] = useState(() => searchParams.get('task') || null);
  const [view, setView] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [personalNotes, setPersonalNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerNow, setTimerNow] = useState(Date.now());

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);
      const [projectResult, customResult] = await Promise.all([
        supabase.from('tracker_user_tasks').select('*, tasks (*), projects (id, name, logo_url)').eq('auth_id', currentUser.id).order('next_due_time', { ascending: true }),
        supabase.from('tracker_custom_tasks').select('*').eq('auth_id', currentUser.id).order('created_at', { ascending: false }),
      ]);
      if (projectResult.error) throw projectResult.error;
      if (customResult.error) console.warn('Unable to load personal tasks:', customResult.error.message);
      setTasks([...(projectResult.data || []).map(normalizeProjectTask), ...(customResult.data || []).map(normalizeCustomTask)]);
    } catch (error) {
      console.error('Unable to load tracker tasks:', error);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => {
    if (!activeTimer) return undefined;
    const interval = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  const selectedTask = useMemo(() => tasks.find(task => task.id === selectedId) || null, [tasks, selectedId]);
  useEffect(() => { if (!selectedTask && tasks.length) setSelectedId(tasks[0].id); }, [selectedTask, tasks]);
  useEffect(() => { setPersonalNotes(selectedTask?.notes || ''); setNotesDirty(false); }, [selectedId, selectedTask?.notes]);

  const summary = useMemo(() => ({
    total: tasks.length, completed: tasks.filter(isComplete).length, pending: tasks.filter(task => statusFor(task) === 'pending').length,
    overdue: tasks.filter(isOverdue).length, once: tasks.filter(task => task.recurrence === 'once').length,
    recurring: tasks.filter(task => task.recurrence !== 'once').length,
  }), [tasks]);
  const projects = useMemo(() => [...new Set(tasks.map(task => task.project))].sort(), [tasks]);
  const visibleTasks = useMemo(() => tasks.filter(task => {
    const needle = query.trim().toLowerCase();
    return (!needle || `${task.name} ${task.project} ${task.notes}`.toLowerCase().includes(needle))
      && (filters.project === 'all' || task.project === filters.project)
      && (filters.status === 'all' || statusFor(task) === filters.status)
      && (filters.recurrence === 'all' || task.recurrence === filters.recurrence);
  }).sort((a, b) => new Date(a.nextDue || '9999-12-31') - new Date(b.nextDue || '9999-12-31')), [tasks, query, filters]);
  const pageCount = Math.max(1, Math.ceil(visibleTasks.length / 10));
  const pageTasks = useMemo(() => visibleTasks.slice((currentPage - 1) * 10, currentPage * 10), [visibleTasks, currentPage]);
  useEffect(() => { setCurrentPage(page => Math.min(page, pageCount)); }, [pageCount]);
  useEffect(() => { setCurrentPage(1); }, [query, filters]);

  const saveNotes = useCallback(async (task, notes) => {
    if (!task) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase.from(tableForTask(task)).update({ notes }).eq('id', task.sourceId);
      if (error) throw error;
      setTasks(current => current.map(item => item.id === task.id ? { ...item, notes } : item));
      setNotesDirty(false);
    } catch (error) { console.error('Unable to save personal notes:', error); }
    finally { setSavingNotes(false); }
  }, []);

  useEffect(() => {
    if (!notesDirty || !selectedTask) return undefined;
    const timeout = window.setTimeout(() => saveNotes(selectedTask, personalNotes), 700);
    return () => window.clearTimeout(timeout);
  }, [personalNotes, notesDirty, selectedTask, saveNotes]);

  const completeTask = async (task) => {
    try {
      // Recurrence maths lives in trackerUtils so Tasks and Daily stay in sync.
      const { error } = await supabase
        .from(tableForTask(task))
        .update(buildCompletionPayload(task))
        .eq('id', task.sourceId);

      if (error) throw error;

      await fetchTasks();

      // Tell TrackerHeader (and any other tracker surface) to re-read the live
      // Streak / XP / SAIL figures — no hard refresh required.
      emitTrackerUpdate({ reason: 'complete', taskId: task.id });

      if (activeTimer?.id === task.id) {
        setActiveTimer(null);
        setTimerStartedAt(null);
      }
      setToast({ type: 'success', text: 'Task completed.' });
    } catch (error) {
      console.error('Unable to complete task:', error);
      setToast({ type: 'error', text: 'Could not complete the task.' });
    }
  };

  const toggleTimer = async task => {
    if (!activeTimer) { const startedAt = Date.now(); setTimerStartedAt(startedAt); setTimerNow(startedAt); setActiveTimer(task); return; }
    if (activeTimer.id !== task.id) return;
    const elapsed = Math.max(1, Math.round((Date.now() - timerStartedAt) / 1000));
    try {
      const { error } = await supabase.from(tableForTask(task)).update({ time_spent_seconds: task.timeSpent + elapsed }).eq('id', task.sourceId);
      if (error) throw error;
      setActiveTimer(null); setTimerStartedAt(null); await fetchTasks();
    } catch (error) { console.error('Unable to save timer:', error); }
  };

  const updateRecurrence = async (values) => {
    if (!selectedTask) return;
    try {
      const updates = {
        custom_interval: values.recurrence,
        preferred_time: values.preferredTime || null,
      };

      if (values.recurrence === 'once') {
        // Dropping recurrence keeps the existing due date untouched.
        if (selectedTask.status !== 'completed') updates.status = 'pending';
      } else if (selectedTask.status === 'completed') {
        // Re-activating a finished task schedules the next occurrence.
        updates.status = 'pending';
        updates.next_due_time = calculateNextDueDate(values.recurrence, values.preferredTime, null);
      } else if (values.preferredTime && selectedTask.nextDue) {
        // Keep the same day, just move it to the newly preferred time of day.
        const updatedDue = new Date(selectedTask.nextDue);
        const [hours, minutes] = values.preferredTime.split(':');
        updatedDue.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
        updates.next_due_time = updatedDue.toISOString();
      } else if (!selectedTask.nextDue) {
        updates.next_due_time = calculateNextDueDate(values.recurrence, values.preferredTime, null);
      }

      const { error } = await supabase
        .from(tableForTask(selectedTask))
        .update(updates)
        .eq('id', selectedTask.sourceId);

      if (error) throw error;

      setRecurrenceOpen(false);
      setToast({ type: 'success', text: 'Schedule updated.' });
      await fetchTasks();
    } catch (error) {
      console.error('Unable to update schedule:', error);
      setToast({ type: 'error', text: 'Could not update the schedule.' });
    }
  };

  const updatePriority = async (task, priority) => {
    try {
      const { error } = await supabase.from(tableForTask(task)).update({ priority }).eq('id', task.sourceId);
      if (error) throw error;
      setTasks(current => current.map(item => item.id === task.id ? { ...item, priority, difficulty: priority } : item));
    } catch (error) { console.error('Unable to update priority:', error); }
  };

  const untrackTask = async task => {
    if (!window.confirm(`Untrack “${task.name}”? This removes it from your tracker.`)) return;
    try {
      const { error } = await supabase.from(tableForTask(task)).delete().eq('id', task.sourceId);
      if (error) throw error;
      if (activeTimer?.id === task.id) { setActiveTimer(null); setTimerStartedAt(null); }
      setSelectedId(null);
      await fetchTasks();
      emitTrackerUpdate({ reason: 'untrack', taskId: task.id });
      setToast({ type: 'success', text: 'Task untracked.' });
    } catch (error) { console.error('Unable to untrack task:', error); setToast({ type: 'error', text: 'Could not untrack the task.' }); }
  };

  const createPersonalTask = async event => {
    event.preventDefault();
    try {
      const { error } = await supabase.from('tracker_custom_tasks').insert({
        auth_id: user.id, name: form.name.trim(), notes: form.notes.trim(), priority: form.priority, custom_interval: form.recurrence,
        next_due_time: form.dueDate ? new Date(form.dueDate).toISOString() : null, status: 'pending', type: 'task',
      });
      if (error) throw error;
      setAddOpen(false); setForm(EMPTY_FORM); await fetchTasks();
      emitTrackerUpdate({ reason: 'create' });
    } catch (error) { console.error('Unable to create personal task:', error); }
  };

  const setFilter = (key, value) => setFilters(current => ({ ...current, [key]: value }));
  const selectTask = taskId => {
    if (notesDirty && selectedTask) saveNotes(selectedTask, personalNotes);
    setSelectedId(taskId);
  };
  const overview = [
    ['Completed', summary.completed, 'emerald'], ['Pending', summary.pending, 'amber'], ['Overdue', summary.overdue, 'rose'], ['One-time', summary.once, 'blue'], ['Recurring', summary.recurring, 'violet'],
  ];

  return <div className="mx-auto w-full max-w-[1700px] px-4 py-6 font-sans sm:px-6 lg:px-8">
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tasks</h1><p className="mt-1 text-sm font-medium text-slate-500">All tasks across your tracked projects and personal workspace.</p></div>
      <button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"><Plus className="h-4 w-4" /> Add task</button>
    </header>

    <div className="grid items-start gap-6 xl:grid-cols-[230px_minmax(0,1fr)_400px]">
      <aside className="hidden xl:sticky xl:top-5 xl:block xl:space-y-5">
        <OverviewCard summary={summary} overview={overview} />
        <TaskInfoNotes task={selectedTask} notes={personalNotes} setNotes={value => { setPersonalNotes(value); setNotesDirty(true); }} savingNotes={savingNotes} onEditSchedule={() => setRecurrenceOpen(true)} onPriorityChange={updatePriority} onUntrack={untrackTask} />
      </aside>
      <main className="min-w-0 xl:col-span-1">
        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
          <SummaryCard label="Total Tasks" value={summary.total} Icon={ClipboardList} tone="violet" /><SummaryCard label="Completed" value={summary.completed} Icon={CheckCircle2} tone="emerald" /><SummaryCard label="Pending" value={summary.pending} Icon={Clock3} tone="amber" /><SummaryCard label="Overdue" value={summary.overdue} Icon={CircleAlert} tone="rose" /><SummaryCard label="One-time" value={summary.once} Icon={CalendarClock} tone="blue" /><SummaryCard label="Recurring" value={summary.recurring} Icon={Repeat2} tone="violet" />
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <FilterBar query={query} setQuery={setQuery} filters={filters} setFilter={setFilter} projects={projects} showFilters={showFilters} setShowFilters={setShowFilters} view={view} setView={setView} />
          <TaskList loading={loading} tasks={pageTasks} selectedId={selectedId} onSelect={selectTask} pageStart={(currentPage - 1) * 10} view={view} />
          <Pagination currentPage={currentPage} pageCount={pageCount} onPageChange={setCurrentPage} total={visibleTasks.length} />
        </section>
      </main>
      <aside className="hidden xl:sticky xl:top-5 xl:block xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><DetailPanel task={selectedTask} onComplete={completeTask} onTimer={toggleTimer} activeTimer={activeTimer} timerNow={timerNow} timerStartedAt={timerStartedAt} onClose={() => setSelectedId(null)} /></aside>
    </div>
    {selectedTask && <div className="xl:hidden"><div className="fixed inset-0 z-40 bg-slate-950/30" onClick={() => setSelectedId(null)} /><div className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl"><DetailPanel task={selectedTask} onComplete={completeTask} onTimer={toggleTimer} activeTimer={activeTimer} timerNow={timerNow} timerStartedAt={timerStartedAt} onClose={() => setSelectedId(null)} /></div></div>}
    {addOpen && <AddTaskModal form={form} setForm={setForm} onClose={() => setAddOpen(false)} onSubmit={createPersonalTask} />}
    {recurrenceOpen && selectedTask && <RecurrenceModal task={selectedTask} onClose={() => setRecurrenceOpen(false)} onSave={updateRecurrence} />}
    {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
  </div>;
}

function SummaryCard({ label, value, Icon, tone }) { const tones = { violet: 'bg-violet-50 text-violet-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-500', rose: 'bg-rose-50 text-rose-500', blue: 'bg-blue-50 text-blue-600' }; return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-slate-600">{label}</span><span className={`rounded-lg p-2 ${tones[tone]}`}>{React.createElement(Icon, { className: 'h-4 w-4' })}</span></div><p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs font-medium text-slate-400">All time</p></div>; }
function OverviewCard({ summary, overview }) { return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="text-sm font-semibold text-slate-800">Tasks Overview</h2><div className="relative mx-auto my-5 grid h-32 w-32 place-items-center rounded-full" style={{ background: `conic-gradient(#8b5cf6 0 ${summary.total ? summary.completed / summary.total * 100 : 0}%, #fb7185 0 ${summary.total ? (summary.completed + summary.overdue) / summary.total * 100 : 0}%, #fbbf24 0 ${summary.total ? (summary.completed + summary.overdue + summary.pending) / summary.total * 100 : 0}%, #e2e8f0 0)` }}><div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center"><strong className="text-xl font-semibold text-slate-900">{summary.total}</strong><span className="-mt-4 text-[10px] font-medium text-slate-400">Total</span></div></div><div className="space-y-2">{overview.map(([label, amount, tone]) => <div key={label} className="flex items-center justify-between text-[11px] font-medium text-slate-500"><span className="flex items-center gap-2"><i className={`h-1.5 w-1.5 rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-400' : tone === 'rose' ? 'bg-rose-400' : tone === 'blue' ? 'bg-blue-500' : 'bg-violet-500'}`} />{label}</span><span>{amount} ({summary.total ? Math.round(amount / summary.total * 100) : 0}%)</span></div>)}</div></section>; }
function StreakCard() { return <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-orange-50" /><p className="text-sm font-semibold text-slate-800">Streak</p><div className="mt-3 flex items-end justify-between"><div><strong className="text-2xl font-semibold text-slate-900">12</strong><span className="ml-1 text-xs font-medium text-slate-400">days</span></div><Flame className="h-8 w-8 fill-orange-400 text-orange-500" /></div><p className="mt-4 text-xs font-medium text-slate-500">Keep it up 🔥</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100"><div className="h-full w-4/5 rounded-full bg-violet-600" /></div></section>; }
function FilterBar({ query, setQuery, filters, setFilter, projects, showFilters, setShowFilters, view, setView }) { return <div className="border-b border-slate-100 p-4"><div className="flex flex-wrap gap-2"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tasks, projects or notes..." className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-500" /></div><Select value={filters.project} onChange={value => setFilter('project', value)}><option value="all">All Projects</option>{projects.map(project => <option key={project} value={project}>{project}</option>)}</Select><Select value={filters.status} onChange={value => setFilter('status', value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="overdue">Overdue</option></Select><Select value={filters.recurrence} onChange={value => setFilter('recurrence', value)}><option value="all">All Recurrence</option><option value="once">One-time</option><option value="24h">Daily</option><option value="7d">Weekly</option><option value="30d">Monthly</option></Select><button onClick={() => setShowFilters(!showFilters)} className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${showFilters ? 'border-violet-200 bg-violet-50 text-violet-600' : 'border-slate-200 text-slate-600'}`}><ListFilter className="h-4 w-4" /> Filters</button><div className="ml-auto flex overflow-hidden rounded-lg border border-slate-200"><button onClick={() => setView('list')} className={`grid h-10 w-10 place-items-center ${view === 'list' ? 'bg-violet-50 text-violet-600' : 'text-slate-400'}`}><List className="h-4 w-4" /></button><button onClick={() => setView('grid')} className={`grid h-10 w-10 place-items-center ${view === 'grid' ? 'bg-violet-50 text-violet-600' : 'text-slate-400'}`}><LayoutGrid className="h-4 w-4" /></button></div></div></div>; }
function Select({ value, onChange, children }) { return <div className="relative"><select value={value} onChange={event => onChange(event.target.value)} className="h-10 appearance-none rounded-lg border border-slate-200 bg-white py-0 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500">{children}</select><ChevronDown className="pointer-events-none absolute right-2 top-3 h-4 w-4 text-slate-400" /></div>; }
function TaskSkeleton() { return <div className="space-y-2 p-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="flex min-h-[66px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"><div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-slate-100" /><div className="min-w-0 flex-1 space-y-2"><div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" /><div className="h-2.5 w-1/4 animate-pulse rounded bg-slate-100" /></div><div className="h-5 w-16 shrink-0 animate-pulse rounded-md bg-slate-100" /></div>)}</div>; }
function TaskList({ loading, tasks, selectedId, onSelect, pageStart }) { if (loading) return <TaskSkeleton />; if (!tasks.length) return <div className="grid min-h-[500px] place-items-center text-center"><ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="text-sm font-semibold text-slate-600">No tasks match these filters.</p></div>; return <div className="space-y-2 p-3">{tasks.map((task, index) => <TaskItem key={task.id} task={task} index={pageStart + index + 1} selected={selectedId === task.id} onClick={() => onSelect(task.id)} />)}</div>; }
function TaskItem({ task, index, selected, onClick }) { const status = statusFor(task); const left = timeLeft(task.nextDue); const statusClasses = { completed: 'bg-emerald-50 text-emerald-600', overdue: 'bg-rose-50 text-rose-600', pending: 'bg-amber-50 text-amber-600' }; return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/30 ${selected ? 'border-violet-300 bg-violet-50/50 ring-1 ring-violet-100' : 'border-slate-200'}`}><div className="w-5 shrink-0 text-center text-xs font-semibold text-slate-400">{index}</div><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-violet-100 text-violet-600">{task.projectLogo ? <img src={task.projectLogo} alt="" className="h-full w-full object-cover" /> : <FolderKanban className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{task.name}</p><p className="mt-0.5 truncate text-xs font-medium text-slate-400">{task.project}</p></div><div className="hidden min-w-[105px] sm:block"><p className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><Repeat2 className="h-3.5 w-3.5" />{intervalLabels[task.recurrence] || task.recurrence}</p><p className={`mt-1 text-[11px] font-semibold ${left.className}`}>{left.label}</p></div><div className="flex shrink-0 flex-col items-end gap-1.5"><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${statusClasses[status]}`}>{status[0].toUpperCase() + status.slice(1)}</span><span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${priorityTone(task.priority)}`}>{task.priority}</span></div></button>; }
function DetailPanel({ task, onComplete, onTimer, activeTimer, timerNow, timerStartedAt, onClose }) {
  if (!task) return <div className="grid min-h-[560px] place-items-center p-8 text-center"><div><ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="text-sm font-semibold text-slate-600">Select a task to view its details.</p></div></div>;
  
  const status = statusFor(task);
  const isTiming = activeTimer?.id === task.id;
  const elapsed = isTiming && timerStartedAt ? Math.round((timerNow - timerStartedAt) / 1000) : 0;
  const resources = Array.isArray(task.resources) ? task.resources : [];
  
  return (
    <div className="flex min-h-[620px] flex-col">
      <div className="border-b border-slate-100 p-5">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">{task.project}</p>
            <h2 className="mt-1 text-lg font-semibold leading-snug text-slate-900">{task.name}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={status}>{status}</Badge>
          <Badge tone="slate"><Timer className="mr-1 inline h-3 w-3" />{task.estimatedTime}</Badge>
          {isTiming && <Badge tone="violet">{formatDuration(elapsed)} tracked</Badge>}
        </div>
      </div>
      
      <div className="flex-1 space-y-3 p-5">
        <InfoCard title="Step-by-step Guide">
          {task.tutorialMarkdown ? <div className="prose prose-sm max-w-none prose-slate prose-headings:font-semibold prose-a:text-violet-600"><ReactMarkdown>{task.tutorialMarkdown}</ReactMarkdown></div> : <p className="text-slate-500">No tutorial guide has been added for this task yet.</p>}
        </InfoCard>
        
        <InfoCard title="Helpful Resources">
          {resources.length ? <div className="space-y-2">{resources.map((resource, i) => <a key={i} href={typeof resource === "string" ? resource : resource.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-violet-600">{typeof resource === "string" ? "Open resource" : resource.title || resource.name || "Open resource"}<ExternalLink className="h-3.5 w-3.5" /></a>)}</div> : task.link ? <a href={task.link} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-violet-600">Project link<ExternalLink className="h-3.5 w-3.5" /></a> : <p className="text-slate-500">No resources added yet.</p>}
        </InfoCard>
      </div>
      
      <div className="flex flex-wrap gap-3 border-t border-slate-100 p-5">
        <button onClick={() => { const url = task.link || (Array.isArray(task.resources) && task.resources[0]?.url); if (url) window.open(url, "_blank"); if (!activeTimer || activeTimer.id !== task.id) onTimer(task); }} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-50 text-sm font-semibold text-violet-600 transition-colors duration-150 hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"><ExternalLink className="h-4 w-4" /> Start Task</button>
        <button onClick={() => onComplete(task)} disabled={status === "completed"} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-600"><CheckCircle2 className="h-4 w-4" /> {status === "completed" ? "Completed" : "Mark Complete"}</button>
        <button onClick={() => onTimer(task)} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${isTiming ? "border-violet-300 bg-violet-50 text-violet-600" : "border-slate-200 text-violet-600 hover:bg-violet-50"}`} title={isTiming ? "Pause timer" : "Start timer"}>{isTiming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
      </div>
    </div>
  );
}
function Badge({ children, tone }) { const classes = { completed: 'bg-emerald-50 text-emerald-600', overdue: 'bg-rose-50 text-rose-600', pending: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-amber-600', slate: 'bg-slate-100 text-slate-600' }; return <span className={`rounded-md px-2 py-1 text-[10px] font-semibold capitalize ${classes[tone]}`}>{children}</span>; }
function InfoCard({ title, children }) { return <section className="rounded-xl border border-slate-100 p-4 text-xs font-medium text-slate-600"><h3 className="mb-3 text-xs font-semibold text-slate-800">{title}</h3>{children}</section>; }
function Pagination({ currentPage, pageCount, onPageChange, total }) { const pages = Array.from({ length: Math.min(pageCount, 5) }, (_, index) => index + 1); return <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3"><span className="text-xs font-medium text-slate-500">Showing {total ? (currentPage - 1) * 10 + 1 : 0}–{Math.min(currentPage * 10, total)} of {total}</span><div className="flex items-center gap-1"><button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-violet-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>{pages.map(page => <button key={page} onClick={() => onPageChange(page)} className={`grid h-8 w-8 place-items-center rounded-md text-xs font-semibold ${page === currentPage ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-violet-50'}`}>{page}</button>)}{pageCount > 5 && <span className="px-1 text-xs text-slate-400">…</span>}<button disabled={currentPage === pageCount} onClick={() => onPageChange(currentPage + 1)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-violet-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></footer>; }
function RecurrenceModal({ task, onClose, onSave }) { const [recurrence, setRecurrence] = useState(task.recurrence); const [preferredTime, setPreferredTime] = useState(task.preferredTime || ''); return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><form onSubmit={event => { event.preventDefault(); onSave({ recurrence, preferredTime }); }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Edit schedule</h2><p className="mt-1 text-sm font-medium text-slate-500">Set when this task should recur.</p></div><button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><label className="mt-5 block text-sm font-semibold text-slate-700">Recurrence<select value={recurrence} onChange={event => setRecurrence(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-violet-500"><option value="once">One-time</option><option value="24h">Daily</option><option value="7d">Weekly</option><option value="30d">Monthly</option></select></label><label className="mt-4 block text-sm font-semibold text-slate-700">Preferred time<input type="time" value={preferredTime} onChange={event => setPreferredTime(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none focus:border-violet-500" /></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">Save schedule</button></div></form></div>; }
function Toast({ toast, onClose }) { useEffect(() => { const timeout = window.setTimeout(onClose, 3500); return () => window.clearTimeout(timeout); }, [onClose]); return <div className={`fixed bottom-5 right-5 z-[70] rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>{toast.text}</div>; }
function AddTaskModal({ form, setForm, onClose, onSubmit }) { const update = (key, value) => setForm(current => ({ ...current, [key]: value })); return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Add personal task</h2><p className="mt-1 text-sm font-medium text-slate-500">Keep habits and project work in one feed.</p></div><button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-4"><label className="block text-sm font-semibold text-slate-700">Task name<input required value={form.name} onChange={event => update('name', event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none focus:border-violet-500" /></label><label className="block text-sm font-semibold text-slate-700">Notes<textarea value={form.notes} onChange={event => update('notes', event.target.value)} rows="3" className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm font-medium outline-none focus:border-violet-500" /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold text-slate-700">Priority<select value={form.priority} onChange={event => update('priority', event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-violet-500"><option>High</option><option>Medium</option><option>Low</option></select></label><label className="text-sm font-semibold text-slate-700">Recurrence<select value={form.recurrence} onChange={event => update('recurrence', event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-violet-500"><option value="once">One-time</option><option value="24h">Daily</option><option value="7d">Weekly</option><option value="30d">Monthly</option></select></label></div><label className="block text-sm font-semibold text-slate-700">Due date<input type="datetime-local" value={form.dueDate} onChange={event => update('dueDate', event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none focus:border-violet-500" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Create task</button></div></form></div>; }

function TaskInfoNotes({ task, notes, setNotes, savingNotes, onEditSchedule, onPriorityChange, onUntrack }) {
  if (!task) return null;

  const left = timeLeft(task.nextDue);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col max-h-[calc(100vh-24rem)] overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">Task Info & Notes</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700">Personal Notes</label>
            <span className="text-[10px] font-medium text-slate-400">{savingNotes ? 'Saving...' : 'Saved'}</span>
          </div>
          <textarea
            value={notes}
            onChange={event => setNotes(event.target.value)}
            placeholder="Add your notes about this task..."
            rows="4"
            className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-500"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completion Count</span>
            <span className="text-xs font-semibold text-slate-900">{task.completionCount || 0} times</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Time</span>
            <span className={`text-xs font-semibold ${left.className}`}>{left.label}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Time Spent</span>
            <span className="text-xs font-semibold text-slate-900">{formatDuration(task.timeSpent)}</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="block text-xs font-medium text-slate-500">Schedule</span>
              <span className="text-xs font-semibold text-slate-900">{intervalLabels[task.recurrence] || task.recurrence} {task.preferredTime ? `at ${task.preferredTime}` : ''}</span>
            </div>
            <button onClick={onEditSchedule} className="text-[11px] font-semibold text-violet-600 hover:text-violet-700">Edit</button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Priority</span>
            <select
              value={task.priority}
              onChange={e => onPriorityChange(task, e.target.value)}
              className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 mt-auto">
        <button
          onClick={() => onUntrack(task)}
          className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-semibold text-rose-600 transition-colors duration-150 hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          Untrack Task
        </button>
      </div>
    </section>
  );
}

