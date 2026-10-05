import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Flame, FolderKanban, Send, Star } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import TrackerLayoutMobile from '../components/TrackerLayoutMobile';

const statCards = [
  { label: 'Total XP', icon: Star, iconClassName: 'bg-blue-50 text-blue-600', value: (stats) => stats.totalXP.toLocaleString(), suffix: 'XP' },
  { label: 'Tasks Completed', icon: CheckCircle2, iconClassName: 'bg-emerald-50 text-emerald-600', value: (stats) => stats.completedTasks },
  { label: 'Projects Tracked', icon: FolderKanban, iconClassName: 'bg-violet-50 text-violet-600', value: (stats) => stats.projectsCount },
  { label: 'Daily Streak', icon: Flame, iconClassName: 'bg-orange-50 text-orange-500', value: (stats) => stats.dailyStreak, suffix: 'days' },
];

export default function TrackerDashboardMobile() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const [tasksResult, projectsResult] = await Promise.all([
        supabase
          .from('tracker_user_tasks')
          .select('id, project_id, last_completed_at, custom_interval, tasks (id, xp), projects (name)')
          .eq('auth_id', currentUser.id),
        supabase
          .from('tracker_user_projects')
          .select('id, project_id, projects (id, name, logo_url)')
          .eq('auth_id', currentUser.id),
      ]);

      setTasks(tasksResult.data || []);
      setProjects(projectsResult.data || []);
      setLoading(false);
    };

    loadOverview();
  }, []);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.last_completed_at);
    const totalXP = tasks.reduce((sum, task) => sum + (task.tasks?.xp || 0), 0);
    const completedDates = new Set(completed.map((task) => new Date(task.last_completed_at).toDateString()));
    let dailyStreak = 0;

    for (let offset = 0; offset < 365; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      if (!completedDates.has(date.toDateString())) break;
      dailyStreak += 1;
    }

    const completionRate = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
    const categories = ['24h', '7d', '30d', 'once'].map((interval) => tasks.filter((task) => task.custom_interval === interval).length);

    return {
      totalXP,
      completedTasks: completed.length,
      projectsCount: projects.length,
      dailyStreak,
      completionRate,
      categories,
    };
  }, [projects.length, tasks]);

  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: tasks.filter((task) => task.last_completed_at && new Date(task.last_completed_at).toDateString() === date.toDateString()).length,
      };
    });
  }, [tasks]);

  const portfolio = useMemo(() => projects.map((project) => {
    const relatedTasks = tasks.filter((task) => task.project_id === project.project_id);
    const done = relatedTasks.filter((task) => task.last_completed_at).length;
    const xp = relatedTasks.reduce((sum, task) => sum + (task.tasks?.xp || 0), 0);
    return {
      id: project.id,
      name: project.projects?.name || 'Untitled project',
      logo: project.projects?.logo_url,
      done,
      total: relatedTasks.length,
      progress: relatedTasks.length ? Math.round((done / relatedTasks.length) * 100) : 0,
      xp,
    };
  }), [projects, tasks]);

  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || 'Sailor';

  return (
    <TrackerLayoutMobile>
      <div className="w-full space-y-6 px-4 pt-0 pb-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {displayName}! 👋</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Here's your farming overview and progress.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, icon: Icon, iconClassName, value, suffix }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconClassName}`}>
                {React.createElement(Icon, { className: 'h-4 w-4', 'aria-hidden': true })}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-xl font-bold tracking-tight text-slate-900">{loading ? '—' : value(stats)}</span>
                {suffix && !loading && <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{suffix}</span>}
              </div>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div>
          <a href="https://t.me/airdropsailor" target="_blank" rel="noopener noreferrer" className="relative flex overflow-hidden rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-4 shadow-sm">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white">
                <Send className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-bold text-white">Join Telegram</p>
                <p className="mt-0.5 text-xs font-medium text-blue-50">Get instant task alerts and alpha.</p>
              </div>
            </div>
            <span className="relative self-center rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700">Join</span>
          </a>
        </div>

        <div className="flex flex-col gap-5">
          <ChartCard title="Productivity Overview">
            <ProductivityChart data={weeklyData} />
          </ChartCard>
          <ChartCard title="Task Completion">
            <div className="flex items-center gap-5">
              <CompletionDonut rate={stats.completionRate} />
              <div className="min-w-0 flex-1 space-y-2.5">
                <Legend color="bg-violet-500" label="Daily" value={stats.categories[0]} />
                <Legend color="bg-blue-500" label="Weekly" value={stats.categories[1]} />
                <Legend color="bg-emerald-500" label="Monthly" value={stats.categories[2]} />
                <Legend color="bg-amber-500" label="One time" value={stats.categories[3]} />
              </div>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold"><span className="text-slate-500">Completion rate</span><span className="text-slate-900">{stats.completionRate}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${stats.completionRate}%` }} /></div>
            </div>
          </ChartCard>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-slate-900">Portfolio Overview</h2><span className="text-xs font-semibold text-slate-400">{portfolio.length} tracked</span></div>
          <div className="overflow-x-auto pb-4">
            <table className="w-full min-w-[560px] text-left">
              <thead className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr><th className="pb-3 pr-4">Project</th><th className="pb-3 pr-4">Tasks</th><th className="pb-3 pr-4">Progress</th><th className="pb-3 text-right">XP Earned</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {portfolio.map((project) => (
                  <tr key={project.id} className="text-sm">
                    <td className="py-3 pr-4"><div className="flex items-center gap-2"><div className="h-7 w-7 overflow-hidden rounded-full bg-slate-100">{project.logo && <img src={project.logo} alt="" className="h-full w-full object-cover" />}</div><span className="max-w-[145px] truncate font-semibold text-slate-800">{project.name}</span></div></td>
                    <td className="py-3 pr-4 text-xs font-semibold text-slate-600">{project.done} / {project.total}</td>
                    <td className="py-3 pr-4"><div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${project.progress}%` }} /></div><span className="text-xs font-semibold text-slate-500">{project.progress}%</span></div></td>
                    <td className="py-3 text-right text-sm font-bold text-violet-600">{project.xp.toLocaleString()} XP</td>
                  </tr>
                ))}
                {!loading && portfolio.length === 0 && <tr><td colSpan="4" className="py-8 text-center text-sm font-medium text-slate-400">No projects tracked yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </TrackerLayoutMobile>
  );
}

function ChartCard({ title, children }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-4 font-bold text-slate-900">{title}</h2>{children}</div>;
}

function Legend({ color, label, value }) {
  return <div className="flex items-center gap-2 text-xs font-semibold"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="flex-1 text-slate-600">{label}</span><span className="text-slate-900">{value}</span></div>;
}

function CompletionDonut({ rate }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return <div className="relative h-28 w-28 shrink-0"><svg viewBox="0 0 112 112" className="h-28 w-28 -rotate-90"><circle cx="56" cy="56" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" /><circle cx="56" cy="56" r={radius} fill="none" stroke="#7c3aed" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (rate / 100) * circumference} /></svg><span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900">{rate}%</span></div>;
}

function ProductivityChart({ data }) {
  const max = Math.max(...data.map((entry) => entry.value), 1);
  const points = data.map((entry, index) => `${12 + index * 46},${98 - (entry.value / max) * 68}`).join(' ');
  return <div><svg viewBox="0 0 300 124" className="h-40 w-full overflow-visible"><path d="M 12 98 H 288" stroke="#e2e8f0" strokeDasharray="3 5" /><polyline points={points} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{data.map((entry, index) => <circle key={entry.label} cx={12 + index * 46} cy={98 - (entry.value / max) * 68} r="4" fill="#7c3aed" stroke="white" strokeWidth="2" />)}</svg><div className="flex justify-between px-1 text-[10px] font-semibold text-slate-400">{data.map((entry) => <span key={entry.label}>{entry.label}</span>)}</div></div>;
}
