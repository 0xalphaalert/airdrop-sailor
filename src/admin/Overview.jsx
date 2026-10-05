import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, CheckSquare, Database, DollarSign, Inbox, Minus,
  Palette, Radio, RefreshCw, SearchCheck, TrendingDown, TrendingUp,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { supabase } from '../supabaseClient';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const hasValue = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized !== '' && normalized !== 'n/a' && normalized !== 'null' && normalized !== 'undefined';
};

const toDayKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const createSevenDaySeries = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * DAY_IN_MS);
    return {
      key: toDayKey(date),
      date: date.toLocaleDateString(undefined, { weekday: 'short' }),
      fullDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      completed: 0, pending: 0, processed: 0, eligible: 0, rate: 0,
    };
  });
};

const calculateGrowth = (dates, currentDays, previousDays) => {
  const now = Date.now();
  const currentStart = now - currentDays * DAY_IN_MS;
  const previousStart = now - previousDays * DAY_IN_MS;
  let current = 0;
  let previous = 0;
  dates.forEach((value) => {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return;
    if (timestamp >= currentStart && timestamp <= now) current += 1;
    else if (timestamp >= previousStart && timestamp < currentStart) previous += 1;
  });
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
};

const buildGrowth = (rows) => {
  const dates = rows.map((row) => row.created_at).filter(Boolean);
  return { weekly: calculateGrowth(dates, 7, 14), monthly: calculateGrowth(dates, 30, 60) };
};

const assertResult = (result, label) => {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result;
};

async function fetchFundingAnalytics(sixtyDayCutoff) {
  const createdAtResult = await supabase
    .from('funding_opportunities')
    .select('id, project_name, project_logo, x_link, created_at')
    .gte('created_at', sixtyDayCutoff);
  if (!createdAtResult.error) return createdAtResult.data || [];

  const fallbackResult = await supabase
    .from('funding_opportunities')
    .select('id, project_name, project_logo, x_link, last_updated')
    .gte('last_updated', sixtyDayCutoff);
  assertResult(fallbackResult, 'Funding history');
  return (fallbackResult.data || []).map((row) => ({ ...row, created_at: row.last_updated }));
}

async function loadDashboardData() {
  const sixtyDayCutoff = new Date(Date.now() - 60 * DAY_IN_MS).toISOString();
  const sevenDayStart = new Date();
  sevenDayStart.setHours(0, 0, 0, 0);
  sevenDayStart.setDate(sevenDayStart.getDate() - 6);
  const sevenDayCutoff = sevenDayStart.toISOString();

  const results = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('funding_opportunities').select('*', { count: 'exact', head: true }),
    supabase.from('manual_xp_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('pending_projects_review').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
    supabase.from('pending_tasks_review').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
    supabase.from('projects').select('created_at').gte('created_at', sixtyDayCutoff),
    supabase.from('tasks').select('created_at').gte('created_at', sixtyDayCutoff),
    fetchFundingAnalytics(sixtyDayCutoff),
    supabase.from('pending_projects_review').select('status, created_at').gte('created_at', sevenDayCutoff),
    supabase.from('pending_tasks_review').select('status, created_at').gte('created_at', sevenDayCutoff),
    supabase.from('projects').select('id, name, logo_url, description, x_link, is_public, created_at').gte('created_at', sevenDayCutoff),
    supabase.from('tasks').select('id, name, description, link, status, created_at').gte('created_at', sevenDayCutoff),
    supabase.from('studio_action_ledger').select('action, created_at').gte('created_at', sevenDayCutoff),
  ]);

  const [
    projectsCount, tasksCount, fundingCount, reviewsCount, pendingProjectsCount,
    pendingTasksCount, projectHistory, taskHistory, fundingHistory,
    researchProjects, researchTasks, studioProjects, studioTasks, studioLedger,
  ] = results;

  [
    [projectsCount, 'Project count'], [tasksCount, 'Task count'], [fundingCount, 'Funding count'],
    [reviewsCount, 'Pending review count'], [pendingProjectsCount, 'Pending project research count'],
    [pendingTasksCount, 'Pending task research count'], [projectHistory, 'Project history'],
    [taskHistory, 'Task history'], [researchProjects, 'Project research history'],
    [researchTasks, 'Task research history'], [studioProjects, 'Studio project queue'],
    [studioTasks, 'Studio task queue'],
  ].forEach(([result, label]) => assertResult(result, label));

  const pendingReviews = reviewsCount.count ?? 0;
  const pendingResearch = (pendingProjectsCount.count ?? 0) + (pendingTasksCount.count ?? 0);
  const researchSeries = createSevenDaySeries();
  const researchByDay = new Map(researchSeries.map((entry) => [entry.key, entry]));
  [...(researchProjects.data || []), ...(researchTasks.data || [])].forEach((row) => {
    const bucket = researchByDay.get(toDayKey(row.created_at));
    if (!bucket) return;
    const status = String(row.status || '').toLowerCase();
    if (status === 'approved' || status === 'rejected') bucket.completed += 1;
    else bucket.pending += 1;
  });
  researchSeries.forEach((entry) => {
    const total = entry.completed + entry.pending;
    entry.rate = total ? Math.round((entry.completed / total) * 100) : 0;
  });

  const studioSeries = createSevenDaySeries();
  const studioByDay = new Map(studioSeries.map((entry) => [entry.key, entry]));
  const eligibleProjects = (studioProjects.data || []).filter((row) => (
    row.is_public === true && hasValue(row.name) && hasValue(row.logo_url)
    && hasValue(row.description) && hasValue(row.x_link)
  ));
  const eligibleTasks = (studioTasks.data || []).filter((row) => (
    ['active', 'pending'].includes(String(row.status || '').toLowerCase())
    && hasValue(row.name) && hasValue(row.description) && hasValue(row.link)
  ));
  const eligibleFunding = fundingHistory.filter((row) => (
    Date.parse(row.created_at) >= Date.parse(sevenDayCutoff)
    && hasValue(row.project_name) && hasValue(row.project_logo) && hasValue(row.x_link)
  ));
  [...eligibleProjects, ...eligibleTasks, ...eligibleFunding].forEach((row) => {
    const bucket = studioByDay.get(toDayKey(row.created_at));
    if (bucket) bucket.eligible += 1;
  });

  const studioAvailable = !studioLedger.error;
  if (studioAvailable) {
    (studioLedger.data || []).forEach((row) => {
      const bucket = studioByDay.get(toDayKey(row.created_at));
      if (bucket && ['ignored', 'published'].includes(String(row.action || '').toLowerCase())) bucket.processed += 1;
    });
    studioSeries.forEach((entry) => {
      entry.rate = entry.eligible ? Math.min(100, Math.round((entry.processed / entry.eligible) * 100)) : entry.processed ? 100 : 0;
    });
  }

  return {
    counts: {
      projects: projectsCount.count ?? 0,
      tasks: tasksCount.count ?? 0,
      funding: fundingCount.count ?? 0,
      adminPending: pendingReviews + pendingResearch,
      pendingReviews,
      pendingResearch,
    },
    growth: {
      projects: buildGrowth(projectHistory.data || []),
      tasks: buildGrowth(taskHistory.data || []),
      funding: buildGrowth(fundingHistory),
    },
    researchSeries,
    studioSeries,
    studioAvailable,
    syncedAt: new Date(),
  };
}

function TrendBadge({ value, period }) {
  const trendIcon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const tone = value > 0
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : value < 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-500';
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold ${tone}`}>{React.createElement(trendIcon, { size: 11 })} {Math.abs(value)}% {period}</span>;
}

function MetricCard({ icon, iconTone, label, value, growth, footer, live = false }) {
  return (
    <article className="flex min-h-44 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${iconTone}`}>{React.createElement(icon, { size: 18 })}</div>
        {live && <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live</span>}
      </div>
      <div className="mt-5"><p className="text-[10px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-3xl font-black text-slate-950">{value.toLocaleString()}</p></div>
      {growth ? <div className="mt-4 flex flex-wrap gap-1.5"><TrendBadge value={growth.weekly} period="week" /><TrendBadge value={growth.monthly} period="month" /></div> : <p className="mt-4 text-[11px] font-semibold text-slate-500">{footer}</p>}
    </article>
  );
}

function AnalyticsTooltip({ active, payload, label, mode }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="min-w-44 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-black text-slate-900">{label}, {row.fullDate}</p>
      <div className="mt-2 space-y-1 text-[11px] font-semibold text-slate-600">
        <p className="flex justify-between gap-6"><span>Completion rate</span><strong className="text-blue-600">{row.rate}%</strong></p>
        <p className="flex justify-between gap-6"><span>{mode === 'research' ? 'Resolved' : 'Processed'}</span><strong className="text-slate-900">{mode === 'research' ? row.completed : row.processed}</strong></p>
        <p className="flex justify-between gap-6"><span>{mode === 'research' ? 'Pending' : 'Eligible additions'}</span><strong className="text-slate-900">{mode === 'research' ? row.pending : row.eligible}</strong></p>
      </div>
    </div>
  );
}

function AnalyticsChart({ title, description, icon, data, mode, available = true }) {
  const totals = data.reduce((summary, row) => ({
    primary: summary.primary + (mode === 'research' ? row.completed : row.processed),
    secondary: summary.secondary + (mode === 'research' ? row.pending : row.eligible),
  }), { primary: 0, secondary: 0 });
  const denominator = mode === 'research' ? totals.primary + totals.secondary : totals.secondary;
  const aggregateRate = denominator ? Math.min(100, Math.round((totals.primary / denominator) * 100)) : 0;
  const hasData = totals.primary > 0 || totals.secondary > 0;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">{React.createElement(icon, { size: 17 })}</div><div><h2 className="text-sm font-black text-slate-950">{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div></div>
        <div className="shrink-0 sm:text-right"><p className="text-2xl font-black text-slate-950">{available ? `${aggregateRate}%` : '--'}</p><p className="text-[10px] font-bold uppercase text-slate-400">7-day rate</p></div>
      </div>
      {!available ? (
        <div className="flex h-72 flex-col items-center justify-center text-center"><AlertCircle className="mb-3 text-amber-500" size={28} /><p className="text-sm font-black text-slate-900">Studio ledger unavailable</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Core metrics are online, but studio processing history could not be read.</p></div>
      ) : !hasData ? (
        <div className="flex h-72 flex-col items-center justify-center text-center"><SearchCheck className="mb-3 text-slate-300" size={30} /><p className="text-sm font-black text-slate-900">No activity in this period</p><p className="mt-1 text-xs text-slate-500">Seven-day activity will appear here as queues are processed.</p></div>
      ) : (
        <div className="mt-5 h-72 w-full" aria-label={`${title} chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={8} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<AnalyticsTooltip mode={mode} />} cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2.5} fill="#dbeafe" fillOpacity={0.7} activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-[11px] font-semibold text-slate-500"><span><strong className="mr-1 text-slate-900">{totals.primary}</strong>{mode === 'research' ? 'resolved' : 'processed'}</span><span><strong className="mr-1 text-slate-900">{totals.secondary}</strong>{mode === 'research' ? 'still pending' : 'eligible additions'}</span></div>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-44 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="h-10 w-10 rounded-lg bg-slate-100" /><div className="mt-8 h-3 w-24 rounded bg-slate-100" /><div className="mt-3 h-8 w-20 rounded bg-slate-100" /></div>)}</div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">{[0, 1].map((index) => <div key={index} className="h-[390px] rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="h-5 w-44 rounded bg-slate-100" /><div className="mt-10 h-64 rounded bg-slate-50" /></div>)}</div>
    </div>
  );
}

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [liveUsers, setLiveUsers] = useState(34);
  const [dashboard, setDashboard] = useState({
    counts: { projects: 0, tasks: 0, funding: 0, adminPending: 0, pendingReviews: 0, pendingResearch: 0 },
    growth: { projects: { weekly: 0, monthly: 0 }, tasks: { weekly: 0, monthly: 0 }, funding: { weekly: 0, monthly: 0 } },
    researchSeries: createSevenDaySeries(), studioSeries: createSevenDaySeries(), studioAvailable: true, syncedAt: null,
  });

  const refreshDashboard = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true); else setLoading(true);
    setError(null);
    try { setDashboard(await loadDashboardData()); }
    catch (loadError) { setError(loadError.message || 'Unable to load Command Center analytics.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(() => refreshDashboard(), 0);
    return () => window.clearTimeout(request);
  }, [refreshDashboard]);

  useEffect(() => {
    const interval = window.setInterval(() => setLiveUsers((current) => Math.min(72, Math.max(18, current + Math.floor(Math.random() * 5) - 2))), 4500);
    return () => window.clearInterval(interval);
  }, []);

  const metrics = useMemo(() => [
    { label: 'Live Users', value: liveUsers, icon: Radio, iconTone: 'border-emerald-100 bg-emerald-50 text-emerald-600', live: true, footer: 'Simulated presence estimate' },
    { label: 'Total Projects', value: dashboard.counts.projects, icon: Database, iconTone: 'border-blue-100 bg-blue-50 text-blue-600', growth: dashboard.growth.projects },
    { label: 'Total Tasks', value: dashboard.counts.tasks, icon: CheckSquare, iconTone: 'border-cyan-100 bg-cyan-50 text-cyan-700', growth: dashboard.growth.tasks },
    { label: 'Total Fundraising', value: dashboard.counts.funding, icon: DollarSign, iconTone: 'border-emerald-100 bg-emerald-50 text-emerald-700', growth: dashboard.growth.funding },
    { label: 'Admin Pending', value: dashboard.counts.adminPending, icon: Inbox, iconTone: 'border-amber-100 bg-amber-50 text-amber-700', footer: `${dashboard.counts.pendingReviews} reviews + ${dashboard.counts.pendingResearch} research` },
  ], [dashboard, liveUsers]);

  return (
    <div className="min-h-full bg-white pb-16 text-slate-900">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="mb-1 flex items-center gap-2 text-xs font-black uppercase text-blue-600"><Activity size={15} /> Operations Analytics</div><h1 className="text-2xl font-black text-slate-950">Command Center</h1><p className="mt-1 text-xs font-medium text-slate-500">Core inventory, admin workload, and seven-day completion health.</p></div>
          <div className="flex flex-wrap items-center gap-3">{dashboard.syncedAt && <p className="text-[11px] font-semibold text-slate-400">Updated {dashboard.syncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}<button type="button" onClick={() => refreshDashboard({ background: true })} disabled={loading || refreshing} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh data</button></div>
        </header>
        {error && <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-2"><AlertCircle className="mt-0.5 shrink-0" size={16} /><div><p className="text-xs font-black">Dashboard sync failed</p><p className="mt-1 text-xs">{error}</p></div></div><button type="button" onClick={() => refreshDashboard()} className="rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-bold hover:bg-rose-100">Try again</button></div>}
        {loading ? <DashboardSkeleton /> : <><section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Command Center metrics">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section><section className="grid grid-cols-1 gap-5 xl:grid-cols-2" aria-label="Completion analytics"><AnalyticsChart title="Research Completion Rate" description="Daily Telegram intelligence resolved versus received." icon={SearchCheck} data={dashboard.researchSeries} mode="research" /><AnalyticsChart title="Studio Completion Rate" description="Daily ledger actions versus eligible core additions." icon={Palette} data={dashboard.studioSeries} mode="studio" available={dashboard.studioAvailable} /></section></>}
      </div>
    </div>
  );
}