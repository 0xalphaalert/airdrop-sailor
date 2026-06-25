import React, { useEffect, useState } from "react";
import {
  Star,
  CheckCircle2,
  Image as ImageIcon,
  Flame,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Info,
  CircleDot,
  X as XIcon,
  Circle,
  Minus,
  ArrowRight,
  Clock,
  Award,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import sailorShip from "../assets/sailor-pass-hero.png";
import { useNavigate } from "react-router-dom";

export default function TrackerOverview() {

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {

    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    // TRACKED TASKS
    const {
      data: trackedTasks,
      error: taskError
    } = await supabase
      .from("tracker_user_tasks")
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
      .eq("auth_id", user.id);

    // TRACKED PROJECTS
    const {
      data: trackedProjects,
      error: projectError
    } = await supabase
      .from("tracker_user_projects")
      .select(`
        *,
        projects (
          id,
          name,
          logo_url,
          social_score
        )
      `)
      .eq("auth_id", user.id);

    console.log(
      "OVERVIEW TASKS:",
      trackedTasks
    );

    console.log(
      "OVERVIEW PROJECTS:",
      trackedProjects
    );

    console.log(
      "OVERVIEW TASK ERROR:",
      taskError
    );

    console.log(
      "OVERVIEW PROJECT ERROR:",
      projectError
    );

    setTasks(trackedTasks || []);
    setProjects(trackedProjects || []);

    setLoading(false);

  };
  const totalXP =
  tasks.reduce(
    (sum, t) =>
      sum + (t.tasks?.xp || 0),
    0
  );

const completedTasks =
  tasks.filter(
    t => t.last_completed_at
  );

const totalCompleted =
  completedTasks.length;

const totalProjects =
  projects.length;

// STREAK
const completionDates = [
  ...new Set(
    completedTasks.map(t => {

      const d =
        new Date(t.last_completed_at);

      return d.toDateString();

    })
  )
];

let streak = 0;

for (let i = 0; i < 365; i++) {

  const d = new Date();

  d.setDate(d.getDate() - i);

  const dateStr =
    d.toDateString();

  if (
    completionDates.includes(dateStr)
  ) {

    streak++;

  } else {

    break;

  }

}

const dailyStreak = streak;
const weeklyAnalytics = [];

for (let i = 6; i >= 0; i--) {

  const d = new Date();

  d.setDate(d.getDate() - i);

  const label =
    d.toLocaleDateString(
      'en-US',
      { weekday: 'short' }
    );

  const completedCount =
    completedTasks.filter(task => {

      if (!task.last_completed_at)
        return false;

      const completed =
        new Date(task.last_completed_at);

      return (
        completed.toDateString() ===
        d.toDateString()
      );

    }).length;

  weeklyAnalytics.push({

    label,
    value: completedCount

  });

}

const maxGraphValue =

  Math.max(
    ...weeklyAnalytics.map(d => d.value),
    1
  );
  // TASK COMPLETION ANALYTICS

const dailyTasks =
  tasks.filter(
    t => t.custom_interval === "24h"
  ).length;

const weeklyTasks =
  tasks.filter(
    t => t.custom_interval === "7d"
  ).length;

const monthlyTasks =
  tasks.filter(
    t => t.custom_interval === "30d"
  ).length;

const oneTimeTasks =
  tasks.filter(
    t => t.custom_interval === "once"
  ).length;

const totalTaskBreakdown =
  dailyTasks +
  weeklyTasks +
  monthlyTasks +
  oneTimeTasks;

const completionRate =


  tasks.length > 0
    ? Math.round(
        (
          completedTasks.length /
          tasks.length
        ) * 100
      )
    : 0;
    // WEEKLY PROGRESS

const completedXP =
  completedTasks.reduce(
    (sum, t) =>
      sum + (t.tasks?.xp || 0),
    0
  );

const xpProgress =

  totalXP > 0
    ? Math.round(
        (completedXP / totalXP) * 100
      )
    : 0;

const taskProgress =

  tasks.length > 0
    ? Math.round(
        (
          completedTasks.length /
          tasks.length
        ) * 100
      )
    : 0;
    // UPCOMING TASKS

const upcomingTasks =
  [...tasks]

    .filter(task => {

      if (!task.next_due_time)
        return false;

      return (
        new Date(task.next_due_time)
        > new Date()
      );

    })

    .sort(
      (a, b) =>
        new Date(a.next_due_time)
        -
        new Date(b.next_due_time)
    )

    .slice(0, 5);
    // PORTFOLIO ANALYTICS

const portfolioProjects =
  projects.map(project => {

    const projectTasks =
      tasks.filter(
        t =>
          t.project_id ===
          project.project_id
      );

    const completed =
      projectTasks.filter(
        t => t.last_completed_at
      ).length;

    const total =
      projectTasks.length;

    const pct =
      total > 0
        ? Math.round(
            (completed / total) * 100
          )
        : 0;

    const xp =
      projectTasks.reduce(
        (sum, t) =>
          sum + (t.tasks?.xp || 0),
        0
      );

    return {

      id:
        project.project_id,

      name:
        project.projects?.name,

      logo:
        project.projects?.logo_url,

      score:
        project.projects?.social_score || 0,

      done:
        completed,

      total,

      pct,

      xp

    };

  });
    const formatDueTime = (date) => {

  const now = new Date();

  const due =
    new Date(date);

  const diff =
    due - now;

  const mins =
    Math.floor(diff / 60000);

  const hours =
    Math.floor(mins / 60);

  const days =
    Math.floor(hours / 24);

  if (mins < 60)
    return `Due in ${mins}m`;

  if (hours < 24)
    return `Due in ${hours}h`;

  return `Due in ${days}d`;

};

  return (
    <div className="w-full flex flex-col pb-8">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-8 py-6 lg:py-8 space-y-6 w-full">
        
        {/* ─── GREETING & CONTROLS ─── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Welcome back, Sailor! <span>👋</span>
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Here's your farming overview and progress.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button className="h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors flex-grow md:flex-grow-0 justify-center">
              <Calendar className="h-4 w-4 text-slate-500" />
              Last 7 Days
              <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
            </button>
            <button className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors flex-grow md:flex-grow-0 justify-center">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              Customize
            </button>
          </div>
        </div>

        {/* ─── TOP STATS ROW (5 Columns) ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard icon={<Star className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50 border-blue-100" label="Total XP" value={totalXP} unit="XP" sub="↑ 18.6% from last 7 days" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50 border-emerald-100" label="Tasks Completed" value={totalCompleted} sub="↑ 12.4% from last 7 days" />
          <StatCard icon={<ImageIcon className="h-5 w-5 text-purple-600" />} iconBg="bg-purple-50 border-purple-100" label="Projects Tracked" value={totalProjects} sub="↑ 9.1% from last 7 days" />
          <StatCard icon={<Flame className="h-5 w-5 text-orange-500" />} iconBg="bg-orange-50 border-orange-100" label="Daily Streak" value={dailyStreak} unit="days" sub="Best: 14 days" subColor="text-slate-500" />
          <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-5 shadow-sm hover:shadow-md transition-all min-h-[140px]">

  {/* Glow */}
  <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-2xl" />

  <div className="relative z-10 h-full flex flex-col justify-between">

    {/* TOP */}
    <div className="flex items-center justify-between">

      <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm shadow-sm">
        <img
          src="https://cdn.simpleicons.org/telegram/ffffff"
          alt="Telegram"
          className="w-5 h-5"
        />
      </div>

      <span className="text-[9px] font-black uppercase tracking-widest text-white/80 bg-white/10 px-2 py-1 rounded-md border border-white/10">
        Live
      </span>

    </div>

    {/* CONTENT */}
    <div className="mt-4">

      <div className="text-lg font-black text-white leading-none">
        Join Telegram
      </div>

      <div className="text-[10px] font-bold uppercase tracking-widest text-white/80 mt-2">
        Instant task alerts
      </div>

    </div>

    {/* BUTTON */}
    <a
      href="https://t.me/airdropsailor"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 h-9 rounded-lg bg-white text-blue-700 text-[11px] font-black flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm"
    >
      Join Community
    </a>

  </div>

</div>
        </div>

        {/* ─── MIDDLE ROW (Charts & Upcoming) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* XP Overview Chart */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 tracking-tight">Productivity Overview</h3>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <button className="h-8 px-2.5 rounded-md border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:bg-slate-50">
                Last 7 Days <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 w-full overflow-hidden flex items-end relative min-h-[280px] mb-4">
  <XPChart
    weeklyAnalytics={weeklyAnalytics}
    maxGraphValue={maxGraphValue}
  />
</div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-auto pt-4 border-t border-slate-100">
              <div>
  <div className="text-sm font-black text-slate-900">
    {completedTasks.length}
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
      Tasks
    </span>
  </div>

  <div className="text-xs font-medium text-slate-500 mt-0.5">
    Completed Tasks
  </div>
</div>
              <div>
                <div className="text-sm font-black text-slate-900">{
  Math.round(
    completedTasks.length / 7
  )
} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task</span></div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">Avg Daily Tasks</div>
              </div>
              <div>
                <div className="text-sm font-black text-emerald-600">{
  totalCompleted > 0
    ? `${Math.round(
        (completedTasks.length / tasks.length) * 100
      )}%`
    : "0%"
}</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">Completion Rate</div>
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">{
  Math.max(
    ...weeklyAnalytics.map(
      d => d.value
    )
  )
} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">XP</span></div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">Best Day</div>
              </div>
            </div>
          </div>

          {/* Task Completion Donut */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-900 tracking-tight mb-6">Task Completion</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 flex-1 justify-center">
              <div className="shrink-0 drop-shadow-sm">
                <XPDonut
  dailyTasks={dailyTasks}
  weeklyTasks={weeklyTasks}
  monthlyTasks={monthlyTasks}
  oneTimeTasks={oneTimeTasks}
  totalTaskBreakdown={totalTaskBreakdown}
/>
              </div>
              <div className="space-y-3 w-full sm:w-auto">
                <LegendDot
  color="bg-violet-500 shadow-sm"
  label="Daily Tasks"
  value={`${dailyTasks} (${Math.round((dailyTasks / totalTaskBreakdown) * 100 || 0)}%)`}
/>

<LegendDot
  color="bg-blue-500 shadow-sm"
  label="Weekly Tasks"
  value={`${weeklyTasks} (${Math.round((weeklyTasks / totalTaskBreakdown) * 100 || 0)}%)`}
/>

<LegendDot
  color="bg-emerald-500 shadow-sm"
  label="Monthly Tasks"
  value={`${monthlyTasks} (${Math.round((monthlyTasks / totalTaskBreakdown) * 100 || 0)}%)`}
/>

<LegendDot
  color="bg-amber-500 shadow-sm"
  label="One Time"
  value={`${oneTimeTasks} (${Math.round((oneTimeTasks / totalTaskBreakdown) * 100 || 0)}%)`}
/>
              </div>
            </div>
            <div className="mt-auto pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-slate-500">Completion Rate</span>
                <span className="text-slate-900">
  {completionRate}%
</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" style={{
  width: `${completionRate}%`
}} />
              </div>
            </div>
          </div>

          {/* Upcoming Tasks List */}
          <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 tracking-tight">Upcoming Tasks</h3>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View All</button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto pr-1">
              {
  upcomingTasks.map(task => (

    <UpcomingRow

  key={task.id}

  logo={
    task.projects?.logo_url
  }

  title={
    task.tasks?.name
  }

  project={
    task.projects?.name
  }

  due={
    formatDueTime(
      task.next_due_time
    )
  }

  recurring={
    task.custom_interval
  }

  link={
    task.tasks?.link
  }

/>

  ))
}
            </div>
            <a
  href="/tracker/daily"
  className="mt-4 w-full h-10 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-100 transition-colors"
>

  View All ({upcomingTasks.length})

  <ArrowRight className="h-3.5 w-3.5" />

</a>
          </div>
        </div>

        {/* ─── BOTTOM ROW (Portfolio & Activity) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Portfolio Overview */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-900 tracking-tight mb-4">Portfolio Overview</h3>
            <div className="grid grid-cols-12 gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 pb-3 border-b border-slate-100">
              <div className="col-span-4 sm:col-span-3">Project</div>
              <div className="col-span-3 sm:col-span-2 hidden sm:block">Score</div>
              <div className="col-span-3 sm:col-span-2 text-center sm:text-left">Done</div>
              <div className="col-span-5 sm:col-span-3 hidden sm:block">Completion</div>
              <div className="col-span-5 sm:col-span-2 text-right">XP Earned</div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {
                portfolioProjects.slice((currentPage - 1) * 8, currentPage * 8).map(project => (
                  <PortfolioRow
                    key={project.id}
                    logo={project.logo}
                    name={project.name}
                    score={project.score}
                    done={project.done}
                    total={project.total}
                    pct={project.pct}
                    xp={`${project.xp} XP`}
                  />
                ))
              }
            </div>
            
            {/* NEW PAGINATION DESIGN (Right Aligned) */}
            {portfolioProjects.length > 8 && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(Math.ceil(portfolioProjects.length / 8))].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                          currentPage === i + 1 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(portfolioProjects.length / 8), p + 1))}
                    disabled={currentPage === Math.ceil(portfolioProjects.length / 8)}
                    className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                     <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SAILOR PASS */}
<div className="lg:col-span-4 rounded-2xl overflow-hidden border border-blue-200 bg-gradient-to-br from-[#0f172a] via-[#172554] to-[#1e40af] shadow-sm relative">

  {/* GLOW */}
  <div className="absolute top-0 right-0 w-56 h-56 bg-cyan-400/10 rounded-full blur-3xl" />

  <div className="relative z-10 p-6 h-full flex flex-col">

    {/* TOP */}
    <div className="flex items-start justify-between mb-4">

      <div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200 backdrop-blur-sm">

          <Star className="h-3 w-3 fill-cyan-200 text-cyan-200" />

          Sailor Pass

        </div>

        <h3 className="mt-4 text-2xl font-black text-white leading-tight">
          Upgrade Your
          <br />
          Farming Experience
        </h3>

      </div>

      <div className="text-right">

        <div className="text-3xl font-black text-white">
          $1
        </div>

        <div className="text-[11px] uppercase tracking-widest font-bold text-blue-200">
          per month
        </div>

      </div>

    </div>

    {/* SHIP IMAGE */}
    <div className="relative flex justify-center mb-5">

      <img
        src={sailorShip}
        alt="Sailor Pass"
        className="w-72 object-contain drop-shadow-2xl"
      />

    </div>

    {/* BENEFITS */}
    <div className="space-y-3 mb-6">

      <BenefitItem text="Track Unlimited Projects" />

      <BenefitItem text="Full Access To Marketplace" />

      <BenefitItem text="Instant Telegram Bot Alerts" />

      <BenefitItem text="Earn More SAIL Than Others" />

    </div>

    {/* BUTTON */}
    <button
  onClick={() => navigate("/subscription")}
  className="mt-auto h-12 rounded-xl bg-white text-blue-700 font-black text-sm hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/30"
>
  Upgrade To Sailor Pass
</button>

  </div>

</div>

          {/* Weekly Progress Overview */}
          <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 tracking-tight">Weekly Progress</h3>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Full Report</button>
            </div>
            
            <div className="space-y-5">
              <div>

  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">

    <span>XP Progress</span>

    <span className="text-blue-600">
      {xpProgress}%
    </span>

  </div>

  <div className="flex items-end gap-1 mb-2">

    <span className="text-lg font-black text-slate-900 leading-none">
      {completedXP}
    </span>

    <span className="text-xs font-bold text-slate-400">
      / {totalXP} XP
    </span>

  </div>

  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">

    <div
      className="h-full rounded-full bg-blue-600 shadow-sm"
      style={{
        width: `${xpProgress}%`
      }}
    />

  </div>

</div>

              <div>

  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">

    <span>Tasks Progress</span>

    <span className="text-emerald-600">
      {taskProgress}%
    </span>

  </div>

  <div className="flex items-end gap-1 mb-2">

    <span className="text-lg font-black text-slate-900 leading-none">
      {completedTasks.length}
    </span>

    <span className="text-xs font-bold text-slate-400">
      / {tasks.length}
    </span>

  </div>

  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">

    <div
      className="h-full rounded-full bg-emerald-500 shadow-sm"
      style={{
        width: `${taskProgress}%`
      }}
    />

  </div>

</div>
            </div>

            <div className="mt-auto pt-5 border-t border-slate-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Category Breakdown</h4>
              <div className="space-y-3">
                <CategoryBar
  color="bg-violet-500"
  label="Daily"
  pct={
    Math.round(
      (dailyTasks / totalTaskBreakdown) * 100
    ) || 0
  }
/>

<CategoryBar
  color="bg-blue-500"
  label="Weekly"
  pct={
    Math.round(
      (weeklyTasks / totalTaskBreakdown) * 100
    ) || 0
  }
/>

<CategoryBar
  color="bg-emerald-500"
  label="Monthly"
  pct={
    Math.round(
      (monthlyTasks / totalTaskBreakdown) * 100
    ) || 0
  }
/>

<CategoryBar
  color="bg-amber-500"
  label="One Time"
  pct={
    Math.round(
      (oneTimeTasks / totalTaskBreakdown) * 100
    ) || 0
  }
/>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <footer className="flex flex-col sm:flex-row items-center justify-between pt-4 text-xs font-bold text-slate-400 gap-4">
          <span>Tracker Pro v1.0.0</span>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <span className="flex items-center gap-1.5 uppercase tracking-widest">
              Track <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            </span>
            <span className="flex items-center gap-1.5 uppercase tracking-widest">
              Complete <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </span>
            <span className="flex items-center gap-1.5 uppercase tracking-widest">
              Earn <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            </span>
          </div>
          <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 px-2.5 py-1 rounded-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 
            All systems operational
          </span>
        </footer>

      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS & DUMMY DATA
// ============================================================================

function StatCard({ icon, iconBg, label, value, unit, sub, subColor = "text-emerald-600" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-default flex flex-col justify-between">
      <div className="flex items-start gap-4">
        <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border shadow-sm ${iconBg}`}>
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
          <div className="text-2xl font-black text-slate-900 leading-none">
            {value}
            {unit && <span className="ml-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{unit}</span>}
          </div>
          <div className={`mt-2 text-[10px] font-black uppercase tracking-widest ${subColor}`}>{sub}</div>
        </div>
      </div>
    </div>
  );
}



function PortfolioRow({
  logo,
  name,
  score,
  done,
  total,
  pct,
  xp
}) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group rounded-lg px-2 -mx-2">
      <div className="col-span-4 sm:col-span-3 flex items-center gap-3">

  {/* PROJECT LOGO */}
  <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border border-slate-200 bg-white shadow-sm">

    <img
      src={logo}
      alt={name}
      className="w-full h-full object-cover"
    />

  </div>

  {/* PROJECT NAME */}
  <span className="font-bold text-slate-900 text-sm truncate">
    {name}
  </span>

</div>
      <div className="col-span-3 sm:col-span-2 hidden sm:flex items-center">
        <span className={`inline-flex items-center justify-center min-w-[34px] h-6 rounded-md border text-[10px] font-black shadow-sm ${score >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
          {score}
        </span>
      </div>
      <div className="col-span-3 sm:col-span-2 text-xs font-bold text-slate-600 text-center sm:text-left">{done} <span className="text-slate-400">/ {total}</span></div>
      <div className="col-span-5 sm:col-span-3 hidden sm:flex items-center gap-2 pr-4">
        <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] font-black text-slate-500 w-8 text-right">{pct}%</span>
      </div>
      <div className="col-span-5 sm:col-span-2 text-right text-sm font-black text-blue-600">{xp}</div>
    </div>
  );
}

function BenefitItem({ text }) {

  return (

    <div className="flex items-center gap-3">

      <div className="h-5 w-5 rounded-full bg-cyan-400/20 border border-cyan-300/20 flex items-center justify-center shrink-0">

        <CheckCircle2 className="h-3.5 w-3.5 text-cyan-200" />

      </div>

      <span className="text-sm font-semibold text-blue-50">
        {text}
      </span>

    </div>

  );

}

function UpcomingRow({
  logo,
  title,
  project,
  due,
  recurring,
  link
}) {

  return (

    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer group">

      {/* LOGO */}
<div className="h-8 w-8 shrink-0 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">

  <img
    src={logo}
    alt={project}
    className="w-full h-full object-cover"
  />

</div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0">

        <div className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
          {title}
        </div>

        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5 truncate">
          {project}
        </div>

      </div>

      {/* RIGHT */}
      <div className="flex flex-col items-end gap-1">

        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">

          <Clock className="h-3 w-3 stroke-[3]" />

          {due}
          

<div className="flex items-center gap-1.5">

  <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">

    {
      recurring === "24h"
        ? "Daily"
        : recurring === "7d"
        ? "Weekly"
        : recurring === "30d"
        ? "Monthly"
        : "One Time"
    }

  </span>

</div>

        </div>

        

      </div>

    </div>

  );

}

function LegendDot({ color, label, value }) {
  return (
    <div className="flex items-center gap-3 text-xs font-bold">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="flex-1 text-slate-600">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}

function CategoryBar({ color, label, pct }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider">
      <span className="w-24 text-slate-500">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full shadow-sm ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-900 w-8 text-right">{pct}%</span>
    </div>
  );
}

/* ---------- XP donut (SVG) ---------- */
function XPDonut({
  dailyTasks,
  weeklyTasks,
  monthlyTasks,
  oneTimeTasks,
  totalTaskBreakdown
}) {

  const r = 60;

  const c =
    2 * Math.PI * r;

  const segs = [

    {
      v: dailyTasks,
      color: "#8b5cf6"
    },

    {
      v: weeklyTasks,
      color: "#3b82f6"
    },

    {
      v: monthlyTasks,
      color: "#10b981"
    },

    {
      v: oneTimeTasks,
      color: "#f59e0b"
    }

  ];

  let offset = 0;

  return (

    <svg
      viewBox="0 0 160 160"
      className="w-36 h-36 sm:w-44 sm:h-44 transform -rotate-90"
    >

      {/* BG */}
      <circle
        cx="80"
        cy="80"
        r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth="18"
      />

      {segs.map((s, i) => {

        const len =
          totalTaskBreakdown > 0
            ? (s.v / totalTaskBreakdown) * c
            : 0;

        const el = (

          <circle
            key={i}
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="18"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

        );

        offset += len;

        return el;

      })}

      {/* CENTER */}
      <g transform="rotate(90 80 80)">

        <text
          x="80"
          y="76"
          textAnchor="middle"
          className="fill-slate-900 font-black text-3xl"
        >
          {totalTaskBreakdown}
        </text>

        <text
          x="80"
          y="96"
          textAnchor="middle"
          className="fill-slate-400 font-black text-[10px] uppercase tracking-widest"
        >
          Tracked
        </text>

      </g>

    </svg>

  );

}

/* ---------- XP Line chart (SVG) ---------- */
function XPChart({
  weeklyAnalytics,
  maxGraphValue
}) {

  const width = 640;
  const height = 260;

  const paddingX = 45;
  const paddingTop = 35;
  const paddingBottom = 45;

  const chartHeight =
    height - paddingTop - paddingBottom;

  const stepX =
    (width - paddingX * 2) /
    (weeklyAnalytics.length - 1);

  const points =
    weeklyAnalytics.map((d, i) => {

      const x =
        paddingX + i * stepX;

      const y =
        paddingTop +
        (
          1 -
          (d.value / maxGraphValue)
        ) * chartHeight;

      return {
        x,
        y,
        value: d.value,
        label: d.label
      };

    });

  // SMOOTH CURVE
  const smoothPath = points.reduce(
    (acc, point, i, arr) => {

      if (i === 0)
        return `M ${point.x} ${point.y}`;

      const prev = arr[i - 1];

      const midX =
        (prev.x + point.x) / 2;

      return `
        ${acc}
        Q ${midX} ${prev.y},
        ${midX} ${(prev.y + point.y) / 2}
        T ${point.x} ${point.y}
      `;

    },
    ""
  );

  const areaPath = `
    ${smoothPath}
    L ${points[points.length - 1].x} ${height - paddingBottom}
    L ${points[0].x} ${height - paddingBottom}
    Z
  `;

  return (

    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >

      <defs>

        {/* AREA */}
        <linearGradient
          id="areaGradient"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >

          <stop
            offset="0%"
            stopColor="#2563eb"
            stopOpacity="0.22"
          />

          <stop
            offset="100%"
            stopColor="#2563eb"
            stopOpacity="0"
          />

        </linearGradient>

        {/* GLOW */}
        <filter id="glow">

          <feGaussianBlur
            stdDeviation="4"
            result="coloredBlur"
          />

          <feMerge>

            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />

          </feMerge>

        </filter>

      </defs>

      {/* GRID */}
      {[0,1,2,3].map(i => {

        const y =
          paddingTop +
          (chartHeight / 3) * i;

        return (
          <line
            key={i}
            x1={paddingX}
            x2={width - paddingX}
            y1={y}
            y2={y}
            stroke="#e2e8f0"
            strokeDasharray="3 6"
          />
        );

      })}

      {/* AREA */}
      <path
        d={areaPath}
        fill="url(#areaGradient)"
      />

      {/* GLOW LINE */}
      <path
        d={smoothPath}
        fill="none"
        stroke="#60a5fa"
        strokeWidth="8"
        opacity="0.15"
        filter="url(#glow)"
      />

      {/* MAIN LINE */}
      <path
        d={smoothPath}
        fill="none"
        stroke="#2563eb"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* POINTS */}
      {points.map((p, i) => (

        <g key={i}>

          {/* OUTER */}
          <circle
            cx={p.x}
            cy={p.y}
            r="10"
            fill="#dbeafe"
            opacity="0.7"
          />

          {/* INNER */}
          <circle
            cx={p.x}
            cy={p.y}
            r="5"
            fill="#2563eb"
            stroke="white"
            strokeWidth="3"
          />

          {/* VALUE */}
          <text
            x={p.x}
            y={p.y - 18}
            textAnchor="middle"
            className="fill-slate-700 text-[11px] font-black"
          >
            {p.value}
          </text>

          {/* DAY */}
          <text
            x={p.x}
            y={height - 12}
            textAnchor="middle"
            className="fill-slate-400 text-[10px] font-bold uppercase"
          >
            {p.label}
          </text>

        </g>

      ))}

    </svg>

  );

}