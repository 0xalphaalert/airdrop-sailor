import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BellRing,
  Check,
  Clock3,
  ExternalLink,
  FolderKanban,
  Hash,
  Inbox,
  Loader2,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const STATUS_FILTERS = [
  { value: 'pending_approval', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

const QUEUES = {
  projects: {
    title: 'Unique Projects',
    description: 'New projects discovered in Telegram channels',
    icon: FolderKanban,
    table: 'pending_projects_review',
  },
  tasks: {
    title: 'Task Alerts',
    description: 'New campaign and participation signals',
    icon: BellRing,
    table: 'pending_tasks_review',
  },
};

export default function TelegramIntel() {
  const [activeQueue, setActiveQueue] = useState('projects');
  const [statusFilter, setStatusFilter] = useState('pending_approval');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchIntelligence = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [projectsResult, tasksResult] = await Promise.all([
        supabase.from('pending_projects_review').select('*').order('created_at', { ascending: false }),
        supabase.from('pending_tasks_review').select('*').order('created_at', { ascending: false }),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (tasksResult.error) throw tasksResult.error;

      setProjects(projectsResult.data || []);
      setTasks(tasksResult.data || []);
    } catch (fetchError) {
      console.error('Unable to load Telegram intelligence:', fetchError);
      setError(fetchError.message || 'Unable to load Telegram intelligence.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(fetchIntelligence, 0);
    return () => window.clearTimeout(request);
  }, [fetchIntelligence]);

  const counts = useMemo(() => ({
    projects: projects.filter((item) => item.status === 'pending_approval').length,
    tasks: tasks.filter((item) => item.status === 'pending_approval').length,
  }), [projects, tasks]);

  const activeItems = activeQueue === 'projects' ? projects : tasks;
  const visibleItems = statusFilter === 'all'
    ? activeItems
    : activeItems.filter((item) => item.status === statusFilter);

  const handleReview = async (item, nextStatus) => {
    setProcessingId(item.id);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from(QUEUES[activeQueue].table)
        .update({ status: nextStatus })
        .eq('id', item.id);

      if (updateError) throw updateError;

      const updateItems = (items) => items.map((currentItem) => (
        currentItem.id === item.id ? { ...currentItem, status: nextStatus } : currentItem
      ));

      if (activeQueue === 'projects') setProjects(updateItems);
      else setTasks(updateItems);
    } catch (reviewError) {
      console.error('Unable to update Telegram review:', reviewError);
      setError(reviewError.message || 'Unable to update this review.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-700">
              <Send className="h-4 w-4" />
              Telegram signal desk
            </div>
            <h1 className="text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">Telegram Intelligence</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
              Validate projects and actionable task signals extracted from monitored channels.
            </p>
          </div>
          <button type="button" onClick={fetchIntelligence} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh feeds
          </button>
        </header>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {Object.entries(QUEUES).map(([queueKey, queue]) => {
            const Icon = queue.icon;
            const isActive = activeQueue === queueKey;
            return (
              <button key={queueKey} type="button" onClick={() => setActiveQueue(queueKey)} className={`group flex min-h-24 items-center gap-4 rounded-lg border p-4 text-left transition-all sm:p-5 ${isActive ? 'border-sky-500 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-sky-500' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${queueKey === 'projects' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-base font-black text-slate-900">{queue.title}</span><span className="mt-1 block text-xs font-medium text-slate-500">{queue.description}</span></span>
                <span className={`flex min-w-10 items-center justify-center rounded-md px-2 py-1 text-sm font-black tabular-nums ${isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{counts[queueKey]}</span>
              </button>
            );
          })}
        </div>

        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div><h2 className="text-base font-black text-slate-900">{QUEUES[activeQueue].title}</h2><p className="mt-1 text-xs font-medium text-slate-500">{visibleItems.length} {visibleItems.length === 1 ? 'signal' : 'signals'} in this view</p></div>
            <div className="flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-1">
              {STATUS_FILTERS.map((filter) => <button key={filter.value} type="button" onClick={() => setStatusFilter(filter.value)} className={`h-8 whitespace-nowrap rounded-md px-3 text-xs font-bold transition-colors ${statusFilter === filter.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{filter.label}</button>)}
            </div>
          </div>

          {error && <div className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 sm:m-6"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error"><X className="h-4 w-4" /></button></div>}
          {loading ? <LoadingState /> : visibleItems.length === 0 ? <EmptyState queueTitle={QUEUES[activeQueue].title} status={statusFilter} /> : <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2">{visibleItems.map((item) => <TelegramReviewCard key={item.id} item={item} type={activeQueue} processing={processingId === item.id} onReview={handleReview} />)}</div>}
        </section>
      </div>
    </div>
  );
}

function TelegramReviewCard({ item, type, processing, onReview }) {
  const isProject = type === 'projects';
  const title = isProject ? item.suggested_name : item.task_name;
  const description = isProject ? item.summary : item.description;
  const source = parseSource(item.source_telegram_msg_id);
  const link = isProject ? item.primary_link : item.link;
  const metadata = isProject ? item.extracted_task_json : item.post_json;

  return (
    <article className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-slate-50/60 transition-colors hover:border-slate-300">
      <div className="flex items-start gap-3 border-b border-slate-200/80 p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm"><Send className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="truncate text-sm font-black text-slate-900">{source.channel}</span><span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400"><Hash className="h-3 w-3" />{source.messageId}</span></div><div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><Clock3 className="h-3 w-3" />{formatDate(item.created_at)}</div></div><StatusBadge status={item.status} /></div>
      <div className="flex-1 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2"><span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider ${isProject ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>{isProject ? 'Project discovery' : item.project_name}</span>{isProject && item.category && <span className="rounded-md bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{item.category}</span>}</div>
        <h3 className="text-base font-black leading-snug text-slate-950">{title}</h3>
        {description && <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{description}</p>}
        {isProject && item.extracted_task_name && <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extracted task</p><p className="mt-1 text-sm font-bold text-slate-800">{item.extracted_task_name}</p></div>}
        {metadata && Object.keys(metadata).length > 0 && <details className="mt-4 rounded-lg border border-slate-200 bg-white p-3"><summary className="cursor-pointer text-xs font-bold text-slate-600">Extracted metadata</summary><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-500">{JSON.stringify(metadata, null, 2)}</pre></details>}
        {item.raw_telegram_text && <details className="mt-3 rounded-lg border border-sky-100 bg-sky-50/70 p-3"><summary className="cursor-pointer text-xs font-bold text-sky-800">View original Telegram message</summary><p className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap break-words text-xs font-medium leading-5 text-slate-600">{item.raw_telegram_text}</p></details>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white p-3">{link ? <a href={link} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-xs font-bold text-sky-700 transition-colors hover:bg-sky-50"><ExternalLink className="h-4 w-4" />Open source</a> : <span className="text-xs font-medium text-slate-400">No source link</span>}<div className="flex items-center gap-2"><button type="button" onClick={() => onReview(item, 'rejected')} disabled={processing || item.status === 'rejected'} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40">{processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}Reject</button><button type="button" onClick={() => onReview(item, 'approved')} disabled={processing || item.status === 'approved'} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">{processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Approve</button></div></div>
    </article>
  );
}

function StatusBadge({ status }) {
  const styles = { pending_approval: 'border-amber-200 bg-amber-50 text-amber-700', approved: 'border-emerald-200 bg-emerald-50 text-emerald-700', rejected: 'border-red-200 bg-red-50 text-red-700' };
  const labels = { pending_approval: 'Pending', approved: 'Approved', rejected: 'Rejected' };
  return <span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${styles[status] || styles.pending_approval}`}>{labels[status] || 'Pending'}</span>;
}

function LoadingState() {
  return <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><Loader2 className="h-7 w-7 animate-spin text-sky-600" /><p className="mt-3 text-sm font-bold text-slate-700">Scanning review queues...</p><p className="mt-1 text-xs font-medium text-slate-400">Loading the latest Telegram signals</p></div>;
}

function EmptyState({ queueTitle, status }) {
  const filterLabel = STATUS_FILTERS.find((filter) => filter.value === status)?.label.toLowerCase();
  return <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Inbox className="h-5 w-5" /></span><p className="mt-4 text-sm font-black text-slate-800">No {filterLabel} signals</p><p className="mt-1 text-xs font-medium text-slate-400">{queueTitle} will appear here when detected.</p></div>;
}

function parseSource(sourceId) {
  if (!sourceId) return { channel: 'Unknown channel', messageId: 'unknown' };
  const separatorIndex = sourceId.lastIndexOf('/');
  if (separatorIndex === -1) return { channel: sourceId, messageId: 'unknown' };
  return { channel: sourceId.slice(0, separatorIndex) || 'Unknown channel', messageId: sourceId.slice(separatorIndex + 1) || 'unknown' };
}

function formatDate(dateValue) {
  if (!dateValue) return 'Unknown time';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateValue));
}