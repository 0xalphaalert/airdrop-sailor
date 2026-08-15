import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  CheckSquare,
  DollarSign,
  Image as ImageIcon,
  Palette,
  RefreshCw,
  Target,
  X,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const hasValue = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized !== '' && normalized !== 'n/a' && normalized !== 'null' && normalized !== 'undefined';
};

const normalizeSlug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export default function StudioDailyTasks() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [processingKey, setProcessingKey] = useState(null);
  const [projectsQueue, setProjectsQueue] = useState([]);
  const [tasksQueue, setTasksQueue] = useState([]);
  const [fundingQueue, setFundingQueue] = useState([]);
  const [weeklyFundingCount, setWeeklyFundingCount] = useState(0);

  const fetchQueues = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setNotice(null);

    try {
      // 1. Fetch Ignored/Handled Items from Ledger
      let ignoredKeys = new Set();
      try {
        const { data: ledgerData } = await supabase
          .from('studio_action_ledger')
          .select('item_type, item_id, item_name');

        if (ledgerData) {
          ledgerData.forEach((row) => {
            ignoredKeys.add(`${row.item_type}:${row.item_id}`);
            if (row.item_name) ignoredKeys.add(row.item_name.toLowerCase().trim());
          });
        }
      } catch (_) {
        // Table may not exist yet; gracefully fallback
      }

      const isHandled = (type, id, name) => {
        if (ignoredKeys.has(`${type}:${id}`)) return true;
        if (name && ignoredKeys.has(String(name).toLowerCase().trim())) return true;
        return false;
      };

      // 2. Fetch Core Data from Supabase 1
      const [projectsResult, tasksResult, fundingResult] = await Promise.all([
        supabase.from('projects').select('*').eq('is_public', true),
        supabase.from('tasks').select('*').in('status', ['Active', 'Pending']),
        supabase.from('funding_opportunities').select('*'),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (tasksResult.error) throw tasksResult.error;
      if (fundingResult.error) throw fundingResult.error;

      setProjectsQueue((projectsResult.data || []).filter((project) => (
        hasValue(project.name)
        && hasValue(project.logo_url)
        && hasValue(project.description)
        && hasValue(project.x_link)
        && !isHandled('project', project.id, project.name)
      )));

      setTasksQueue((tasksResult.data || []).filter((task) => (
        hasValue(task.name)
        && hasValue(task.description)
        && hasValue(task.link)
        && !isHandled('task', task.id, task.name)
      )));

      const eligibleFunding = (fundingResult.data || []).filter((funding) => (
        hasValue(funding.project_name)
        && hasValue(funding.project_logo)
        && hasValue(funding.x_link)
        && !isHandled('funding', funding.id, funding.project_name)
      ));
      const weeklyCutoff = Date.now() - WEEK_IN_MS;

      setFundingQueue(eligibleFunding);
      setWeeklyFundingCount(eligibleFunding.filter((item) => {
        const updatedAt = Date.parse(item.last_updated);
        return Number.isFinite(updatedAt) && updatedAt >= weeklyCutoff;
      }).length);
    } catch (error) {
      setNotice({ type: 'error', text: `Failed to load studio queues: ${error.message}` });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(fetchQueues, 0);
    return () => window.clearTimeout(request);
  }, [fetchQueues]);

  const testnetCount = projectsQueue.filter(
    (project) => String(project.status || '').toLowerCase() === 'testnet',
  ).length;

  const totalItems = projectsQueue.length + tasksQueue.length + fundingQueue.length;

  const openStudio = (type, item) => {
    const params = new URLSearchParams({ type, id: String(item.id) });
    navigate(`/studio/create?${params.toString()}`);
  };

  const openRoundup = (type) => {
    const params = new URLSearchParams({ type: 'roundup', roundup: type });
    navigate(`/studio/create?${params.toString()}`);
  };

  const handleIgnore = async (type, item) => {
    const itemName = type === 'funding' ? item.project_name : item.name;
    const itemKey = `${type}:${item.id}`;
    setProcessingKey(itemKey);
    setNotice(null);

    try {
      // Save to studio_action_ledger in Supabase 1
      const { error } = await supabase.from('studio_action_ledger').insert([{
        item_type: type,
        item_id: String(item.id),
        item_name: itemName,
        action: 'ignored'
      }]);

      if (error) {
        // Fallback to local filtering if table is not yet migrated
        console.warn('Ledger insert warning:', error.message);
      }

      if (type === 'project') setProjectsQueue((items) => items.filter((entry) => entry.id !== item.id));
      if (type === 'task') setTasksQueue((items) => items.filter((entry) => entry.id !== item.id));
      if (type === 'funding') {
        const updatedAt = Date.parse(item.last_updated);
        const wasInWeeklyRoundup = Number.isFinite(updatedAt) && updatedAt >= Date.now() - WEEK_IN_MS;
        setFundingQueue((items) => items.filter((entry) => entry.id !== item.id));
        if (wasInWeeklyRoundup) setWeeklyFundingCount((count) => Math.max(0, count - 1));
      }
      setNotice({ type: 'success', text: `Ignored "${itemName}". It will not appear again.` });
    } catch (error) {
      setNotice({ type: 'error', text: `Failed to ignore item: ${error.message}` });
    } finally {
      setProcessingKey(null);
    }
  };

  return (
    <div className="min-h-full w-full bg-white pb-20 text-slate-900">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-violet-600">
              <Palette className="h-4 w-4" />
              Content Production
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Studio Daily Tasks</h1>
            <p className="mt-1 text-xs font-medium text-slate-500">{totalItems} items ready for design generation.</p>
          </div>
          <button
            type="button"
            onClick={() => fetchQueues({ background: true })}
            disabled={refreshing || loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        {notice && (
          <div className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-xs font-bold ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification"><X className="h-4 w-4" /></button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center text-sm font-bold text-slate-400">Scanning eligibility gates...</div>
        ) : (
          <div className="space-y-8">
            <Roundups weeklyFundingCount={weeklyFundingCount} testnetCount={testnetCount} onCreate={openRoundup} />

            <section className="space-y-3" aria-labelledby="action-queue-heading">
              <h2 id="action-queue-heading" className="pl-1 text-xs font-black uppercase tracking-widest text-slate-400">Action Queue</h2>
              {totalItems === 0 ? (
                <div className="border border-dashed border-slate-200 bg-white py-16 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-9 w-9 text-emerald-500" />
                  <h3 className="text-base font-black text-slate-900">Queue Cleared</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">No single designs pending generation.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  {projectsQueue.map((item) => (
                    <ActionRow key={`project:${item.id}`} type="project" item={item} icon={ImageIcon} color="blue" processing={processingKey === `project:${item.id}`} onCreate={openStudio} onIgnore={handleIgnore} />
                  ))}
                  {tasksQueue.map((item) => (
                    <ActionRow key={`task:${item.id}`} type="task" item={item} icon={CheckSquare} color="violet" processing={processingKey === `task:${item.id}`} onCreate={openStudio} onIgnore={handleIgnore} />
                  ))}
                  {fundingQueue.map((item) => (
                    <ActionRow key={`funding:${item.id}`} type="funding" item={item} icon={DollarSign} color="emerald" processing={processingKey === `funding:${item.id}`} onCreate={openStudio} onIgnore={handleIgnore} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Roundups({ weeklyFundingCount, testnetCount, onCreate }) {
  if (weeklyFundingCount === 0 && testnetCount === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="roundups-heading">
      <h2 id="roundups-heading" className="pl-1 text-xs font-black uppercase tracking-widest text-slate-400">Weekly Roundups</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {weeklyFundingCount > 0 && (
          <RoundupCard
            icon={Calendar}
            iconClass="text-emerald-600"
            title="Top 10 Funding Raised This Week"
            description={`${weeklyFundingCount} eligible funding rounds discovered in the last 7 days.`}
            onCreate={() => onCreate('funding')}
          />
        )}
        {testnetCount > 0 && (
          <RoundupCard
            icon={Target}
            iconClass="text-blue-600"
            title="Top 5 Testnets This Week"
            description={`${testnetCount} active testnets eligible for spotlight.`}
            onCreate={() => onCreate('testnets')}
          />
        )}
      </div>
    </section>
  );
}

function RoundupCard({ icon, iconClass, title, description, onCreate }) {
  return (
    <article className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className={`mb-2 flex items-center gap-2 ${iconClass}`}>
          {React.createElement(icon, { className: 'h-5 w-5' })}
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
        </div>
        <p className="text-xs font-medium leading-5 text-slate-500">{description}</p>
      </div>
      <button type="button" onClick={onCreate} className="mt-4 inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700">
        Create Roundup
        <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  );
}

function ActionRow({ type, item, icon, color, processing, onCreate, onIgnore }) {
  const itemName = type === 'funding' ? item.project_name : item.name;
  const copy = type === 'project'
    ? <>New project <strong>{itemName}</strong> - generate a single project design.</>
    : type === 'task'
      ? <>New task <strong>{itemName}</strong> - generate a single task design.</>
      : <>New fundraising record for <strong>{itemName}</strong> - generate a single funding design.</>;
  const colors = {
    blue: 'border-blue-100 bg-blue-50 text-blue-600',
    violet: 'border-violet-100 bg-violet-50 text-violet-600',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="flex flex-col gap-4 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${colors[color]}`}>
          {React.createElement(icon, { className: 'h-4 w-4' })}
        </div>
        <p className="min-w-0 text-sm leading-5 text-slate-900">
          <span className={`mr-2 font-black ${color === 'blue' ? 'text-blue-600' : color === 'violet' ? 'text-violet-600' : 'text-emerald-600'}`}>[{type === 'funding' ? 'Funding' : type === 'task' ? 'Task' : 'Project'}]</span>
          {copy}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        <button type="button" onClick={() => onCreate(type, item)} disabled={processing} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-[11px] font-bold uppercase text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">
          Create in Studio
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => onIgnore(type, item)} disabled={processing} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60">
          {processing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Ignore
        </button>
      </div>
    </div>
  );
}