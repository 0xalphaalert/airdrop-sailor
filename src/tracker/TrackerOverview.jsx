import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Crown,
  Image as ImageIcon,
  Info,
  Megaphone,
  Repeat2,
  SlidersHorizontal,
  Star,
  Trophy,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import sailorShip from '../assets/sailor-pass-hero.png';

const PIE_COLORS = ['#2563eb', '#6d28d9', '#10b981', '#f59e0b'];
const MotionDiv = motion.div;

export default function TrackerOverview() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [globalTopProjects, setGlobalTopProjects] = useState([]);
  const [ledgerLogs, setLedgerLogs] = useState([]);
  const [platformUpdates, setPlatformUpdates] = useState([]);
  const [profileStats, setProfileStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const navigate = useNavigate();

  const fetchOverviewData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: trackedTasks } = await supabase
      .from('tracker_user_tasks')
      .select(`
        *,
        tasks (
          id,
          name,
          xp,
          link
        ),
        projects (
          id,
          name,
          logo_url,
          social_score
        )
      `)
      .eq('auth_id', user.id);

    const { data: trackedProjects } = await supabase
      .from('tracker_user_projects')
      .select(`
        *,
        projects (
          id,
          name,
          logo_url,
          status
        )
      `)
      .eq('auth_id', user.id);

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('project_limit, lifetime_xp, profile_engagement_score, subscription_tier, subscription_expires_at')
      .eq('auth_id', user.id)
      .maybeSingle();

    const { data: topJoined } = await supabase.rpc('get_top_joined_projects');

    const { data: ledgerData } = await supabase
      .from('xp_ledger')
      .select('amount, action_type, description, created_at')
      .eq('auth_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);

    const { data: updatesData } = await supabase
      .from('platform_updates')
      .select('category, title, category_color, category_bg, link, created_at')
      .order('created_at', { ascending: false })
      .limit(15);

    setTasks(trackedTasks || []);
    setProjects(trackedProjects || []);
    setGlobalTopProjects(topJoined || []);
    setLedgerLogs(ledgerData || []);
    setPlatformUpdates(updatesData || []);
    setProfileStats(profileData || null);
    setLoading(false);
  };

  useEffect(() => {
    // Data fetching updates local state when the external request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOverviewData();
  }, []);

  useEffect(() => {
    if (ledgerLogs.length <= 5 && platformUpdates.length <= 5) return undefined;

    const itemCount = Math.max(ledgerLogs.length, platformUpdates.length);
    const timer = window.setInterval(() => {
      setSlideIndex((previousIndex) => (previousIndex + 1) % itemCount);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [ledgerLogs.length, platformUpdates.length]);

  const getVisibleItems = (items) => {
    if (!items.length) return [];

    return Array.from(
      { length: Math.min(5, items.length) },
      (_, index) => items[(slideIndex + index) % items.length],
    );
  };

  const visibleLedger = getVisibleItems(ledgerLogs);
  const visibleUpdates = getVisibleItems(platformUpdates);

  const totalXP = tasks.reduce((sum, task) => sum + (Number(task.tasks?.xp) || 0), 0);
  const completedTasks = tasks.filter((task) => task.last_completed_at);
  const totalCompleted = completedTasks.length;
  const totalProjects = projects.length;
  const engagementScore = Number(profileStats?.profile_engagement_score) || 0;

  const weeklyAnalytics = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const value = completedTasks.filter((task) => (
      new Date(task.last_completed_at).toDateString() === date.toDateString()
    )).length;
    weeklyAnalytics.push({
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value,
    });
  }

  const dailyTaskItems = tasks.filter((task) => task.custom_interval === '24h');
  const dailyTasks = dailyTaskItems.length;
  const completedDailyTasks = dailyTaskItems.filter((task) => task.last_completed_at).length;
  const weeklyTasks = tasks.filter((task) => task.custom_interval === '7d').length;
  const monthlyTasks = tasks.filter((task) => task.custom_interval === '30d').length;
  const oneTimeTasks = tasks.filter((task) => task.custom_interval === 'once').length;
  const totalTaskBreakdown = dailyTasks + weeklyTasks + monthlyTasks + oneTimeTasks;

  const portfolioProjects = projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.project_id === project.project_id);
    const done = projectTasks.filter((task) => task.last_completed_at).length;
    const total = projectTasks.length;

    return {
      id: project.project_id,
      name: project.projects?.name || 'Unnamed project',
      logo: project.projects?.logo_url,
      score: Number(project.engagement_score) || 0,
      xp: Number(project.total_xp_gained) || 0,
      done,
      total,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
      status: project.projects?.status || 'Active',
    };
  });

  const topProjects = [...portfolioProjects].sort((left, right) => right.xp - left.xp).slice(0, 5);
  const needsEffortProjects = [...projects]
    .sort((a, b) => (Number(a.engagement_score) || 0) - (Number(b.engagement_score) || 0))
    .slice(0, 5);
  const performanceData = topProjects.map((project) => ({
    name: project.name,
    completion: project.pct,
    xp: project.xp,
  }));
  const pieData = [
    { name: 'Daily Tasks', value: dailyTasks },
    { name: 'Weekly Tasks', value: weeklyTasks },
    { name: 'Monthly Tasks', value: monthlyTasks },
    { name: 'One-time Tasks', value: oneTimeTasks },
  ];
  const projectLimit = profileStats?.project_limit || 5;
  const lifetimeXP = Number(profileStats?.lifetime_xp) || 0;
  const planName = profileStats?.subscription_tier || 'Free Plan';
  const isPremium = planName !== 'Free Plan' && planName !== 'Free';
  const expiryDate = profileStats?.subscription_expires_at
    ? new Date(profileStats.subscription_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '-';

  if (loading) {
    return <div className="grid min-h-[70vh] place-items-center bg-white text-sm font-semibold text-slate-400">Loading your tracker overview...</div>;
  }

  return (
    <div className="w-full bg-white pb-8 text-slate-900">
      <div className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">Welcome back, Sailor! <span>👋</span></h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Track smarter, farm better, earn more SAIL.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <Dropdown label="This Month" icon={CalendarDays} />
            <button type="button" className="flex h-10 flex-grow items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 md:flex-grow-0">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" /> Customize
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <CircularStatCard label="Projects Joined" current={totalProjects} max={projectLimit} format="fraction" />
          <CircularStatCard label="Tasks Completed" current={totalCompleted} max={tasks.length} format="fraction" />
          <CircularStatCard label="Daily Tasks" current={completedDailyTasks} max={dailyTasks} format="fraction" />
          <CircularStatCard label="Engagement Score" current={engagementScore} max={100} format="percent" />
          <CircularStatCard label="SAIL Earned" current={lifetimeXP} max={lifetimeXP} format="raw" />
          <CircularStatCard label="$1 / Mo Premium" isUpgrade onClick={() => navigate('/subscription')} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <Card>
              <div className="flex items-center justify-between gap-4">
                <div><h2 className="text-sm font-bold text-slate-900">Tracking Limit (Free Plan)</h2><p className="mt-1 text-xs font-medium text-slate-500">You can track {Math.max(0, projectLimit - totalProjects)} more projects</p></div>
                <span className="text-xs font-black text-slate-700">{totalProjects} / {projectLimit} Projects</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, (totalProjects / projectLimit) * 100)}%` }} /></div>
              <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs font-medium text-slate-600">Keep building your portfolio</span><button type="button" onClick={() => navigate('/subscription')} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50">Upgrade to unlock unlimited</button></div>
            </Card>
            <Card>
              <CardHeader title="How Engagement Score Works" icon={Info} />
              <div className="flex flex-col items-center justify-between gap-6 xl:flex-row">
                <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-4">
                  <ScoreRule icon={<Trophy className="h-4 w-4" />} label="Project Completion" value="40%" tone="text-violet-600 bg-violet-50" />
                  <ScoreRule icon={<span className="text-sm">2</span>} label="Task Completion" value="30%" tone="text-blue-600 bg-blue-50" />
                  <ScoreRule icon={<Repeat2 className="h-4 w-4" />} label="Recurring Performance" value="20%" tone="text-emerald-600 bg-emerald-50" />
                  <ScoreRule icon={<Star className="h-4 w-4" />} label="SAIL Earned" value="10%" tone="text-emerald-600 bg-emerald-50" />
                </div>
                <div className="flex min-w-[240px] shrink-0 items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex flex-col">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-700">Your Score</p>
                    <div className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-emerald-500 bg-white text-sm font-black text-slate-900 shadow-sm">{engagementScore}</div>
                  </div>
                  <p className="max-w-[100px] text-[9px] font-medium leading-relaxed text-slate-500">Higher score = more SAIL opportunities.<br /><br />Stay consistent and complete tasks on time.</p>
                </div>
              </div>
            </Card>
          </div>
          <PremiumCard navigate={navigate} />
        </div>

        <div className="flex min-h-[84px] items-center justify-between gap-5 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white px-6 py-4">
          <div className="flex items-center gap-4"><Megaphone className="h-10 w-10 text-violet-600" /><span className="hidden text-xl font-black text-slate-700 sm:block">720 x 90</span><span className="text-lg font-black text-violet-700">YOUR ADVERTISEMENT GOES HERE</span></div>
          <button type="button" className="hidden rounded-lg border border-violet-200 bg-white px-6 py-2.5 text-xs font-bold text-blue-600 shadow-sm hover:bg-violet-50 sm:block">Advertise Now</button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardHeader title="SAIL Earned Breakdown" />
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <div className="relative h-48 w-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={2} stroke="white" strokeWidth={2}>{pieData.map((item, index) => <Cell key={item.name} fill={PIE_COLORS[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-2xl font-black text-slate-900">{totalXP.toLocaleString()}</p><p className="text-[10px] font-bold text-slate-400">Total SAIL</p></div></div></div>
              <div className="w-full space-y-3 sm:w-auto"><LegendRows data={pieData} total={totalTaskBreakdown} /></div>
            </div>
          </Card>
          <Card className="lg:col-span-5">
            <CardHeader title="Consistency Score" />
            <div className="h-56"><ResponsiveContainer height="100%" width="100%"><AreaChart data={weeklyAnalytics} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}><defs><linearGradient id="colorConsistency" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '4px', boxShadow: '0 1px 6px rgba(0, 0, 0, 0.1)', color: '#2563eb', fontWeight: 700 }} itemStyle={{ color: '#2563eb' }} /><Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fill="url(#colorConsistency)" fillOpacity={1} activeDot={{ r: 6, fill: '#fff', stroke: '#2563eb', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div>
          </Card>
          <Card className="flex flex-col lg:col-span-2">
            <CardHeader title="Plan Overview" icon={Crown} />
            <div className="mb-4 border-b border-slate-100 pb-4">
              <span className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${isPremium ? 'border border-violet-100 bg-violet-50 text-violet-700' : 'border border-blue-100 bg-blue-50 text-blue-700'}`}>
                {planName}
              </span>
            </div>
            <div className="flex-1 space-y-4 text-[11px] font-medium text-slate-600">
              <PlanRow label="Projects Tracking" value={`${totalProjects} / ${projectLimit}`} />
              <PlanRow label="Tasks Tracking" value="Unlimited" />
              <PlanRow label="Daily Tasks" value="Unlimited" />
              <PlanRow label="Plan Expires" value={expiryDate} />
            </div>
            {!isPremium && (
              <button type="button" onClick={() => navigate('/subscription')} className="mt-6 w-full rounded-lg bg-violet-600 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-violet-700">
                Upgrade to Premium
              </button>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {globalTopProjects.length > 0 ? (
            <Card className="lg:col-span-5">
              <CardHeader title="Top 5 Popular Projects" />
              <div className="space-y-1">
                {globalTopProjects.map((project, index) => (
                  <TopProjectRow
                    key={project.project_id}
                    project={project}
                    index={index}
                    maxCount={globalTopProjects[0]?.user_count}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <Card className="lg:col-span-5">
              <CardHeader title="Need your Efforts!" />
              <div className="space-y-1">
                {needsEffortProjects.length ? (
                  needsEffortProjects.map((project, index) => (
                    <NeedsEffortRow key={project.project_id} project={project} index={index} />
                  ))
                ) : (
                  <EmptyState text="No project data available." />
                )}
              </div>
            </Card>
          )}
          <Card className="lg:col-span-7"><CardHeader title="Performance by Project" right={<Dropdown label="This Month" />} /><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={performanceData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis yAxisId="left" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6d28d9' }} axisLine={false} tickLine={false} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} /><Bar yAxisId="left" dataKey="completion" name="Completion %" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={22} /><Bar yAxisId="right" dataKey="xp" name="SAIL Earned" fill="#6d28d9" radius={[3, 3, 0, 0]} maxBarSize={22} /></BarChart></ResponsiveContainer></div></Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="flex h-[400px] flex-col">
            <CardHeader title="Recent SAIL Activity" right={<button type="button" onClick={() => navigate('/xp-levels')} className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>} />
            <SlidingList slideKey={slideIndex} isEmpty={!visibleLedger.length} emptyText="No recent activity found.">
              {visibleLedger.map((log, index) => (
                <LedgerRow key={`${log.created_at}-${log.action_type}-${index}`} log={log} />
              ))}
            </SlidingList>
          </Card>
          <Card className="flex h-[400px] flex-col">
            <CardHeader title="Latest Announcements" icon={Bell} />
            <SlidingList slideKey={slideIndex} isEmpty={!visibleUpdates.length} emptyText="No new announcements.">
              {visibleUpdates.map((update, index) => (
                <AnnouncementRow key={`${update.created_at}-${update.title}-${index}`} announcement={update} />
              ))}
            </SlidingList>
          </Card>
        </div>

        <Card>
          <CardHeader title="Project Performance Overview" right={<Dropdown label="This Month" />} />
          <div className="overflow-x-auto pb-2">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="pb-4 pl-2">Project</th>
                  <th className="pb-4">Engagement Score</th>
                  <th className="pb-4">Completion</th>
                  <th className="pb-4">SAIL Earned</th>
                  <th className="pb-4 pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topProjects.length ? (
                  topProjects.map((project) => (
                    <PerformanceRow key={project.id} project={project} />
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <EmptyState text="No project performance data yet." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <footer className="flex flex-col items-center justify-between gap-4 pt-3 text-xs font-bold text-slate-400 sm:flex-row"><span>Tracker Pro v1.0.0</span><div className="flex items-center gap-6"><span>TRACK <i className="ml-1 inline-block h-2 w-2 rounded-full bg-blue-500" /></span><span>COMPLETE <i className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /></span><span>EARN <i className="ml-1 inline-block h-2 w-2 rounded-full bg-amber-500" /></span></div><span className="flex items-center gap-1.5 text-emerald-600"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> All systems operational</span></footer>
      </div>
    </div>
  );
}

function Card({ children, className = '' }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 ${className}`}>{children}</section>;
}

function CardHeader({ title, icon: Icon, right }) {
  return <div className="mb-5 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">{Icon && <Icon className="h-4 w-4 text-violet-600" />}{title}</h2>{right}</div>;
}

function Dropdown({ label, icon: Icon }) {
  return <button type="button" className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">{Icon && <Icon className="h-4 w-4 text-slate-500" />}{label}<ChevronDown className="ml-1 h-4 w-4 text-slate-400" /></button>;
}

function CircularStatCard({ label, current = 0, max = 0, format = 'fraction', isUpgrade = false, onClick }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = isUpgrade || format === 'raw' ? 1 : max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const formattedValue = format === 'fraction'
    ? `${current}/${max}`
    : format === 'percent'
      ? `${Math.round(current)}%`
      : Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(current).toLowerCase();
  const content = (
    <>
      <div className="relative grid h-24 w-24 place-items-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          {isUpgrade && (
            <defs>
              <linearGradient id="premium-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
          )}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#eff6ff" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={isUpgrade ? 'url(#premium-ring-gradient)' : '#2563eb'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <span className="absolute text-lg font-black text-slate-900">{isUpgrade ? <Crown className="h-6 w-6 text-violet-600" /> : formattedValue}</span>
      </div>
      <span className="mt-3 text-center text-[11px] font-bold text-slate-500">{label}</span>
    </>
  );

  return onClick
    ? <button type="button" onClick={onClick} className="flex min-h-[158px] flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">{content}</button>
    : <div className="flex min-h-[158px] flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-sm">{content}</div>;
}

function PremiumCard({ navigate }) {
  return <section className="relative overflow-hidden rounded-xl border border-violet-200 bg-[linear-gradient(135deg,#F3F0FF_0%,#EDE9FE_100%)] p-5 shadow-sm lg:col-span-4"><div className="relative z-10"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-violet-700"><Crown className="h-5 w-5" /><span className="text-sm font-black">Upgrade to Premium</span></div><p className="mt-3 text-sm font-bold text-slate-900">Only $1 / month</p></div><img src={sailorShip} alt="Sailor Pass" className="-mr-4 -mt-3 h-28 w-28 object-contain" /></div><div className="mt-3 space-y-2 text-xs font-medium text-slate-700">{['Get Voyager Role', 'Unlimited Project Tracking', 'Unlimited Task Tracking', 'Priority Support', 'Early Access to New Features'].map((item) => <p key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-violet-600" />{item}</p>)}</div><button type="button" onClick={() => navigate('/subscription')} className="mt-5 h-10 w-full rounded-lg bg-violet-600 text-xs font-black text-white shadow-sm hover:bg-violet-700">Upgrade Now - $1 / Month</button></div></section>;
}

function ScoreRule({ icon, label, value, tone }) {
  return <div className="flex items-center gap-2.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${tone}`}>{icon}</span><div><p className="whitespace-nowrap text-[10px] font-medium text-slate-500">{label}</p><p className="text-xs font-black text-slate-900">{value}</p></div></div>;
}

function PlanRow({ label, value }) {
  return <div className="flex items-center justify-between gap-2"><span>{label}</span><span className="font-black text-slate-900">{value}</span></div>;
}

function LegendRows({ data, total }) {
  return data.map((item, index) => <div key={item.name} className="flex items-center gap-3 text-xs font-medium text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} /><span className="min-w-32 flex-1">{item.name}</span><span className="font-black text-slate-900">{item.value} <span className="font-medium text-slate-400">({total ? Math.round((item.value / total) * 100) : 0}%)</span></span></div>);
}

function TopProjectRow({ project, index, maxCount }) {
  const userCount = Number(project.user_count) || 0;
  const highestUserCount = Number(maxCount) || 0;
  const barWidth = highestUserCount > 0 ? Math.min(100, (userCount / highestUserCount) * 100) : 0;

  return (
    <div className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-0">
      <span className="w-4 text-xs font-black text-slate-500">{index + 1}</span>
      <ProjectIdentity logo={project.logo_url} name={project.name} />
      <div className="hidden min-w-20 flex-1 items-center gap-2 sm:flex">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${barWidth}%` }} />
        </div>
      </div>
      <span className="whitespace-nowrap text-xs font-black text-slate-700">{userCount.toLocaleString()} Users</span>
    </div>
  );
}

function NeedsEffortRow({ project, index }) {
  const score = Number(project.engagement_score) || 0;
  const barWidth = Math.min(100, Math.max(0, score));
  const barColor = score < 50 ? 'bg-rose-500' : 'bg-amber-500';
  const textColor = score < 50 ? 'text-rose-600' : 'text-amber-600';

  return (
    <div className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-0">
      <span className="w-4 text-xs font-black text-slate-500">{index + 1}</span>
      <ProjectIdentity logo={project.projects?.logo_url} name={project.projects?.name || 'Unnamed project'} />
      <div className="hidden min-w-20 flex-1 items-center gap-2 sm:flex">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
        </div>
      </div>
      <span className={`whitespace-nowrap text-xs font-black ${textColor}`}>{score}% Score</span>
    </div>
  );
}

function ProjectIdentity({ logo, name }) {
  return <div className="flex min-w-0 flex-1 items-center gap-2"><div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">{logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-3.5 w-3.5 text-slate-400" />}</div><span className="truncate text-xs font-bold text-slate-900">{name}</span></div>;
}

function PerformanceRow({ project }) {
  let scoreColor = 'bg-slate-100 text-slate-600';
  let scoreLabel = 'Needs Effort';

  if (project.score >= 80) {
    scoreColor = 'border border-emerald-100 bg-emerald-50 text-emerald-600';
    scoreLabel = 'Excellent';
  } else if (project.score >= 50) {
    scoreColor = 'border border-blue-100 bg-blue-50 text-blue-600';
    scoreLabel = 'Good';
  } else if (project.score > 0) {
    scoreColor = 'border border-amber-100 bg-amber-50 text-amber-600';
    scoreLabel = 'Average';
  }

  return (
    <tr className="group transition-colors hover:bg-slate-50/50">
      <td className="py-4 pl-2">
        <ProjectIdentity logo={project.logo} name={project.name} />
      </td>
      <td className="py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-black tabular-nums text-slate-800">{project.score}</span>
          <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${scoreColor}`}>
            {scoreLabel}
          </span>
        </div>
      </td>
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${project.pct}%` }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums text-slate-700">{project.pct}%</span>
        </div>
      </td>
      <td className="py-4">
        <span className="text-xs font-black tabular-nums text-blue-600">
          +{project.xp.toLocaleString()} SAIL
        </span>
      </td>
      <td className="py-4 pr-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {project.status || 'Active'}
        </span>
      </td>
    </tr>
  );
}

function SlidingList({ children, slideKey, isEmpty, emptyText }) {
  return (
    <div className="relative flex-1 overflow-hidden">
      {isEmpty ? (
        <EmptyState text={emptyText} />
      ) : (
        <AnimatePresence initial={false} mode="wait">
          <MotionDiv
            key={slideKey}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="divide-y divide-slate-100"
          >
            {children}
          </MotionDiv>
        </AnimatePresence>
      )}
    </div>
  );
}

function LedgerRow({ log }) {
  const date = formatShortDate(log.created_at);
  const amount = Number(log.amount) || 0;
  const isPositive = amount >= 0;
  const description = log.description || log.action_type?.replaceAll('_', ' ') || 'SAIL activity';

  return (
    <div className="grid min-h-14 grid-cols-[auto_1fr_auto] items-center gap-3 py-3 text-xs">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {isPositive ? '+' : '-'}
      </span>
      <span className="truncate font-medium capitalize text-slate-700">{description}</span>
      <div className="flex flex-col items-end gap-0.5">
        <span className={`font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? '+' : ''}{amount.toLocaleString()} SAIL
        </span>
        <span className="whitespace-nowrap text-[9px] font-medium text-slate-400">{date}</span>
      </div>
    </div>
  );
}

function AnnouncementRow({ announcement }) {
  const date = formatShortDate(announcement.created_at);
  const categoryColor = announcement.category_color || '#2563eb';
  const categoryBackground = announcement.category_bg || '#eff6ff';
  const destination = announcement.link || undefined;

  return (
    <a
      href={destination}
      target={destination ? '_blank' : undefined}
      rel={destination ? 'noreferrer' : undefined}
      aria-disabled={!destination}
      className={`grid min-h-14 grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-3 text-xs transition-colors ${destination ? 'hover:bg-slate-50' : 'cursor-default'}`}
    >
      <span className="flex min-w-0 items-center gap-2 truncate font-medium text-slate-700">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor }} />
        {announcement.title}
      </span>
      <span
        className="hidden rounded border px-2 py-1 text-[9px] font-bold sm:block"
        style={{
          backgroundColor: categoryBackground,
          borderColor: announcement.category_bg ? 'transparent' : '#bfdbfe',
          color: categoryColor,
        }}
      >
        {announcement.category}
      </span>
      <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">{date}</span>
      <ArrowRight className={`h-3.5 w-3.5 ${destination ? 'text-slate-400' : 'text-slate-200'}`} />
    </a>
  );
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function EmptyState({ text }) {
  return <div className="py-10 text-center text-xs font-medium text-slate-400">{text}</div>;
}