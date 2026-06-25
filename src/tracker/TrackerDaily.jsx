import React, {
  useEffect,
  useState
} from "react";

import { supabase } from "../supabaseClient";
import {
  ChevronDown, ChevronLeft, ChevronRight, Zap, 
  CalendarCheck, PieChart, Clock, Check, Twitter, 
  CircleDot, ArrowRight, CheckSquare, Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TrackerDaily() {
  const [tasks, setTasks] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => {

  fetchDailyTasks();

}, []);

const fetchDailyTasks = async () => {

  try {

    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from('tracker_user_tasks')
      .select(`
        *,
        tasks (
          id,
          name,
          xp,
          link,
          recurring,
          status
        ),
        projects (
  id,
  name,
  logo_url,
  social_score
)
      `)
      .eq('auth_id', user.id)
      .order('next_due_time', {
        ascending: true
      });

    console.log("DAILY TASKS:", data);

    console.log("DAILY TASKS ERROR:", error);

    if (error) throw error;

    setTasks(data || []);

  } catch (error) {

    console.error(error);

  } finally {

    setLoading(false);

  }

};
const navigate = useNavigate();
const now = new Date();

// --- NEW: SMART COMPLETION CHECKER ---
const isTaskCompleted = (task) => {
  if (!task.last_completed_at) return false;
  if (task.custom_interval === 'once') return true;
  if (!task.next_due_time) return false;
  // If the due time is still in the future, it is currently "done"
  return new Date(task.next_due_time) > new Date();
};

const dueNowTasks = tasks.filter(task => {

  if (!task.next_due_time) return false;

  const due =
    new Date(task.next_due_time);

  const diff =
    due.getTime() - now.getTime();

  return diff <= 60 * 60 * 1000;

});

const upcomingTasks = tasks.filter(task => {

  if (!task.next_due_time) return false;

  const due =
    new Date(task.next_due_time);

  const diff =
    due.getTime() - now.getTime();

  return diff > 60 * 60 * 1000;

});
const completedTasks = tasks.filter(t => isTaskCompleted(t));

const dailyTasks =
  tasks.filter(
    t => t.custom_interval === '24h'
  );

const tier1Tasks =
  tasks.filter(
    t =>
      t.projects?.social_score >= 80
  );

const completionRate =
  tasks.length > 0
    ? Math.round(
        (completedTasks.length / tasks.length) * 100
      )
    : 0;

const today = new Date();

const hasCompletedToday =
  tasks.some(task => {

    if (!task.last_completed_at)
      return false;

    const completed =
      new Date(task.last_completed_at);

    return (
      completed.toDateString() ===
      today.toDateString()
    );

  });

const completionDates = [
  ...new Set(
    tasks
      .filter(t => t.last_completed_at)
      .map(t => {

        const d =
          new Date(t.last_completed_at);

        return d.toDateString();

      })
  )
];

let streak = 0;

const streakDays = [];

for (let i = 6; i >= 0; i--) {

  const d = new Date();

  d.setDate(d.getDate() - i);

  const dateStr =
    d.toDateString();

  const completed =
    completionDates.includes(dateStr);

  streakDays.push({

    day: d.toLocaleDateString(
      'en-US',
      { weekday: 'short' }
    ),

    date: d.getDate(),

    completed,

    today:
      d.toDateString() ===
      new Date().toDateString()

  });

}

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
const onceTasks =
  tasks.filter(
    t => t.custom_interval === 'once'
  );

const weeklyTasks =
  tasks.filter(
    t => t.custom_interval === '7d'
  );

const monthlyTasks =
  tasks.filter(
    t => t.custom_interval === '30d'
  );

const totalTaskCount =
  tasks.length;

  const completeTask = async (task) => {

  try {

    const now = new Date();

    let nextDue = null;

    if (task.custom_interval === '24h') {

      nextDue = new Date(
        now.getTime() + 24 * 60 * 60 * 1000
      );

    } else if (task.custom_interval === '7d') {

      nextDue = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );

    } else if (task.custom_interval === '30d') {

      nextDue = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

    }

    const { error } = await supabase
      .from('tracker_user_tasks')
      .update({

        last_completed_at:
          now.toISOString(),

        completion_count:
          (task.completion_count || 0) + 1,

        next_due_time:
          nextDue
            ? nextDue.toISOString()
            : null

      })
      .eq('id', task.id);

    console.log("COMPLETE ERROR:", error);

    if (error) throw error;

    fetchDailyTasks();

  } catch (error) {

    console.error(error);

  }

};
const formatDueTime = (date) => {

  if (!date) return 'No Due';

  const now = new Date();
  const due = new Date(date);

  const diffMs =
    due.getTime() - now.getTime();

  const diffHours =
    Math.floor(diffMs / (1000 * 60 * 60));

  const diffDays =
    Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    return 'Overdue';
  }

  if (diffHours < 1) {
    return 'Due Soon';
  }

  if (diffHours < 24) {
    return `Due in ${diffHours}h`;
  }

  return `Due in ${diffDays}d`;

};
  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col pb-8">
      
      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <div className="px-6 lg:px-8 pt-8 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daily Tasks</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Your personalized tasks for today. Complete them to earn XP and maintain your streak.
          </p>
        </div>
        
        <div />
      </div>

      {/* ─── STATS ROW (5 Columns) ─── */}
      <div className="px-6 lg:px-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Tasks Today"
          value={tasks.length}
          sub={`${completedTasks.length} completed`}
          subTone="emerald"
          icon={<CheckSquare className="w-5 h-5" />}
          iconBg="bg-blue-50 border-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
  label="Daily Tasks"
  value={dailyTasks.length}
  sub={`${dailyTasks.filter(
    t => t.last_completed_at
  ).length} completed`}
  sub={`${dailyTasks.filter(t => isTaskCompleted(t)).length} completed`}
  icon={<Zap className="w-5 h-5" />}
  iconBg="bg-violet-50 border-violet-100"
  iconColor="text-violet-600"
/>
        <StatCard
  label="Tier 1 Tasks"
  value={tier1Tasks.length}
  sub="High social score"
  subTone="orange"
  icon={<CalendarCheck className="w-5 h-5" />}
  iconBg="bg-orange-50 border-orange-100"
  iconColor="text-orange-500"
/>
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={<PieChart className="w-5 h-5" />}
          iconBg="bg-blue-50 border-blue-100"
          iconColor="text-blue-600"
        >
          <div className="mt-3.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
  className="h-full bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"
  style={{
    width: `${completionRate}%`
  }}
/>
          </div>
        </StatCard>
        <StatCard
  label="Daily Streak"
  value={`${dailyStreak} Day`}
  sub={
    hasCompletedToday
      ? "Streak Active 🔥"
      : "Complete a task today"
  }
  subTone="orange"
  icon={<Clock className="w-5 h-5" />}
  iconBg="bg-slate-100 border-slate-200"
  iconColor="text-slate-600"
/>
      </div>

      {/* ─── FILTER PILLS ─── */}
      <div className="px-6 lg:px-8 mt-6 flex flex-wrap items-center gap-3">
        <Pill
  label="All Tasks"
  count={tasks.length}
  active
  tone="blue"
/>

<Pill
  label="Due Now"
  count={dueNowTasks.length}
  active
  tone="orange"
/>

<Pill
  label="Completed"
  count={tasks.filter(t => isTaskCompleted(t)).length}
  active
  tone="emerald"
/>
      </div>

      {/* ─── MAIN GRID (2/3 Split) ─── */}
      <div className="px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* LEFT COLUMN (2/3): Due Now + Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Due Now Box */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Due Now</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                {dueNowTasks.length} Tasks
              </span>
            </div>

            <div className="space-y-3">
              <div className="hidden lg:grid grid-cols-[3fr_2fr_1fr_1fr_1fr_1fr_0.8fr] gap-4 px-3 pb-2 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">

  <div>Task</div>
  <div>Project</div>
  <div>Recurring</div>
  <div>Status</div>
  <div>Task Link</div>
  <div>Completion</div>
  <div>Notes</div>

</div>
              {dueNowTasks.map((t, i) => (
                <div key={i} className="grid lg:grid-cols-[3fr_2fr_1fr_1fr_1fr_1fr_0.8fr] gap-4 items-center px-3 py-2 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  {/* TASK */}
<div className="text-sm font-semibold text-slate-900 truncate">
  {t.tasks?.name}
</div>
{/* PROJECT */}
<div className="flex items-center gap-2 min-w-0">

  <ProjectIcon
    p={t.projects?.name}
    logo={t.projects?.logo_url}
  />

  <span className="text-xs font-medium text-slate-700 truncate">
    {t.projects?.name}
  </span>

</div>
{/* RECURRING */}
<div>

  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-violet-50 border border-violet-100 text-violet-700">

    {t.custom_interval === '24h'
      ? 'Daily'
      : t.custom_interval === '7d'
      ? 'Weekly'
      : t.custom_interval === '30d'
      ? 'Monthly'
      : 'Once'}

  </span>

</div>
                  
                  
{/* STATUS */}
<div>
  <span
    className={`text-xs font-bold px-2 py-1 rounded-md ${
      formatDueTime(t.next_due_time) === 'Overdue'
        ? 'bg-orange-50 text-orange-600'
        : 'bg-blue-50 text-blue-600'
    }`}
  >
    {formatDueTime(t.next_due_time)}
  </span>
</div>

{/* TASK LINK */}
<div>
  <a
    href={t.tasks?.link}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
  >
    Open
  </a>
</div>

{/* COMPLETION */}
<div>
  <button
    onClick={() => !isTaskCompleted(t) && completeTask(t)}
    disabled={isTaskCompleted(t)}
    className={`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-colors ${
      isTaskCompleted(t) 
        ? 'border-emerald-200 bg-emerald-50 cursor-not-allowed' 
        : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
    }`}
  >
    {isTaskCompleted(t) ? (
      <Check className="w-4 h-4 text-emerald-600" />
    ) : null}
  </button>
</div>

{/* NOTES */}
<div className="text-slate-400 text-sm">
  -
</div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Box */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Upcoming</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                {upcomingTasks.length} Tasks
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-3">

  {upcomingTasks.map((t, i) => (

    <div
      key={i}
      className="flex items-center justify-between gap-5 p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm group"
    >

      {/* LEFT SIDE */}
      <div className="flex items-center gap-4 flex-1 min-w-0">

        <ProjectIcon
          p={t.projects?.name}
          logo={t.projects?.logo_url}
        />

        <div className="flex-1 min-w-0">

          {/* PROJECT */}
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            {t.projects?.name}
          </div>

          {/* TASK */}
          <div className="text-sm font-bold text-slate-900 truncate">
            {t.tasks?.name}
          </div>

          {/* BADGES */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">

            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-violet-50 border border-violet-100 text-violet-700">
              {t.custom_interval === '24h'
                ? 'Daily'
                : t.custom_interval === '7d'
                ? 'Weekly'
                : t.custom_interval === '30d'
                ? 'Monthly'
                : 'Once'}
            </span>

          </div>

        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3 shrink-0">

        {/* DUE */}
        <div className="text-[11px] font-black text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
          {formatDueTime(t.next_due_time)}
        </div>

        {/* XP */}
        <div className="text-blue-600 font-black text-sm whitespace-nowrap min-w-[55px] text-right">
          {t.tasks?.xp || 0} XP
        </div>

        {/* ACTION */}
        <div className="flex items-center gap-2">

  <a
    href={t.tasks?.link}
    target="_blank"
    rel="noopener noreferrer"
    className="h-9 px-4 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold shadow-sm transition-colors flex items-center"
  >
    Open
  </a>

  <button
    onClick={() => !isTaskCompleted(t) && completeTask(t)}
    disabled={isTaskCompleted(t)}
    className={`h-9 px-4 rounded-lg text-xs font-bold shadow-sm transition-colors ${
      isTaskCompleted(t)
        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-not-allowed'
        : 'bg-blue-600 hover:bg-blue-700 text-white'
    }`}
  >
    {isTaskCompleted(t) ? 'Completed' : 'Complete'}
  </button>

</div>

      </div>

    </div>

  ))}

</div>
</div>

            <button
  onClick={() => navigate("/tracker/tasks")}
  className="w-full mt-5 h-11 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
>
  View All {tasks.length} Tasks
  <ArrowRight className="w-4 h-4" />
</button>
          </section>
        </div>

        {/* RIGHT COLUMN (1/3): Progress, Streak, Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Daily Progress */}
          {/* Sponsor / Advertisement Box */}
<section className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm min-h-[260px] flex flex-col">

  <div className="flex items-center justify-between mb-4">

    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
      Sponsored
    </h3>

    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
      Ad Space
    </span>

  </div>

  <div className="flex-1 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">

    <div className="text-center px-6">

      <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm mb-4">
        <Zap className="w-6 h-6 text-slate-400" />
      </div>

      <h4 className="text-sm font-bold text-slate-700">
        Future Sponsored Campaign
      </h4>

      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
        This space can display promoted airdrops,
        featured campaigns, ecosystem boosts,
        or premium partner advertisements.
      </p>

    </div>

  </div>

</section>

          {/* Streak Calendar */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Streak Calendar</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">{dailyStreak} Day{dailyStreak !== 1 ? 's' : ''} 🔥</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {streakDays.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${d.today ? 'text-blue-600' : 'text-slate-400'}`}>{d.day}</span>
                  <div
  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-black transition-all ${
    
    d.today
      ? "border-2 border-blue-500 text-blue-600 bg-blue-50 shadow-sm"

      : d.completed
      ? "border-2 border-emerald-400 text-slate-700 bg-white"

      : "border-2 border-slate-200 text-slate-400 bg-slate-50"

  }`}
>
                    {d.date}
                  </div>
                  {d.completed && !d.today && (
  <Check className="w-3 h-3 text-emerald-500 -mt-1 stroke-[3]" />
)}
                </div>
              ))}
            </div>
          </section>

          {/* XP Breakdown */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Today's Task Breakdown</h3>

            <div className="mt-6 flex flex-col sm:flex-row xl:flex-col gap-6">
              {/* Fake Donut Chart via CSS */}
              <div className="flex justify-center shrink-0">
                <div className="relative w-28 h-28 rounded-full shadow-inner" style={{
  background: `conic-gradient(
    #8b5cf6 0 ${
      totalTaskCount > 0
        ? (onceTasks.length / totalTaskCount) * 100
        : 0
    }%,

    #3b82f6 ${
      totalTaskCount > 0
        ? (onceTasks.length / totalTaskCount) * 100
        : 0
    }% ${
      totalTaskCount > 0
        ? ((onceTasks.length + dailyTasks.length) / totalTaskCount) * 100
        : 0
    }%,

    #10b981 ${
      totalTaskCount > 0
        ? ((onceTasks.length + dailyTasks.length) / totalTaskCount) * 100
        : 0
    }% 100%
  )`
}}>
                  <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                    <span className="text-2xl font-black text-slate-900 leading-none mt-1">{totalTaskCount}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Tasks</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 text-sm flex flex-col justify-center">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
  <span className="flex items-center gap-2.5 font-bold text-slate-700 text-xs">
    <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm" />
    One-Time
  </span>

  <span className="flex items-center gap-3">

    <span className="font-black text-slate-900">
      {onceTasks.length}
    </span>

    <span className="text-[10px] font-black text-slate-400 w-8 text-right bg-slate-100 px-1 py-0.5 rounded">
      {totalTaskCount > 0
        ? Math.round(
            (onceTasks.length / totalTaskCount) * 100
          )
        : 0}%
    </span>

  </span>
</div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
  <span className="flex items-center gap-2.5 font-bold text-slate-700 text-xs">
    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
    Daily
  </span>

  <span className="flex items-center gap-3">

    <span className="font-black text-slate-900">
      {dailyTasks.length}
    </span>

    <span className="text-[10px] font-black text-slate-400 w-8 text-right bg-slate-100 px-1 py-0.5 rounded">
      {totalTaskCount > 0
        ? Math.round(
            (dailyTasks.length / totalTaskCount) * 100
          )
        : 0}%
    </span>

  </span>
</div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
  <span className="flex items-center gap-2.5 font-bold text-slate-700 text-xs">
    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
    Weekly
  </span>

  <span className="flex items-center gap-3">

    <span className="font-black text-slate-900">
      {weeklyTasks.length}
    </span>

    <span className="text-[10px] font-black text-slate-400 w-8 text-right bg-slate-100 px-1 py-0.5 rounded">
      {totalTaskCount > 0
        ? Math.round(
            (weeklyTasks.length / totalTaskCount) * 100
          )
        : 0}%
    </span>

  </span>
</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200 bg-white px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-400 gap-4 mt-auto">
        <span>Tracker Pro v1.0.0</span>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <span className="flex items-center gap-2 uppercase tracking-widest">
            Track <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          </span>
          <span className="flex items-center gap-2 uppercase tracking-widest">
            Complete <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          </span>
          <span className="flex items-center gap-2 uppercase tracking-widest">
            Earn <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          </span>
        </div>
        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          All systems operational
        </span>
      </footer>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS & DUMMY DATA
// ============================================================================

function StatCard({ label, value, sub, subTone = "emerald", icon, iconBg, iconColor, children }) {
  const subCls = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    orange: "text-orange-600",
  }[subTone];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-default flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
          <div className="text-2xl font-black text-slate-900">{value}</div>
          {sub && <div className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${subCls}`}>{sub}</div>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      {children}
    </div>
  );
}

function Pill({ label, count, active, tone = "blue" }) {
  const activeCls = {
    blue: "bg-blue-50 text-blue-700 border-blue-200 shadow-sm",
    orange: "bg-orange-50 text-orange-700 border-orange-200 shadow-sm",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm",
    slate: "bg-white text-slate-600 border-slate-200",
  }[tone];
  
  const badge = {
    blue: "bg-blue-100/80 text-blue-700",
    orange: "bg-orange-100/80 text-orange-700",
    emerald: "bg-emerald-100/80 text-emerald-700",
    slate: "bg-slate-100 text-slate-500",
  }[tone];

  return (
    <button className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
        active ? activeCls : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      <span>{label}</span>
      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${active ? badge : "bg-slate-100 text-slate-500"}`}>
        {count}
      </span>
    </button>
  );
}

function ProjectIcon({ p, logo }) {
  const map = {
    Monad: { bg: "bg-violet-600 border-violet-700", icon: <CircleDot className="w-5 h-5 text-white" /> },
    Kaito: { bg: "bg-slate-900 border-slate-800", icon: <Twitter className="w-4 h-4 text-white" /> },
    Berachain: { bg: "bg-amber-700 border-amber-800", icon: <span className="text-white text-base font-black">B</span> },
    Base: { bg: "bg-blue-600 border-blue-700", icon: <span className="w-3 h-0.5 bg-white rounded" /> },
    MegaETH: { bg: "bg-slate-900 border-slate-800", icon: <span className="text-amber-400 text-lg font-black">M</span> },
  };
  const cfg = map[p] ?? { bg: "bg-slate-300 border-slate-400", icon: null };
  if (logo) {

  return (
    <img
      src={logo}
      alt={p}
      className="w-8 h-8 rounded-full object-cover border border-slate-100 shadow-sm shrink-0"
    />
  );

}
  return (
    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${cfg.bg}`}>
      {cfg.icon}
    </span>
  );
}

