import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Search, ChevronDown, Plus, SlidersHorizontal, MoreVertical, 
  Settings2, Droplet, ArrowLeftRight, MessageCircle, Twitter, 
  Layers, Coins, Users, CircleDot, Sparkles, Calendar,
  CheckSquare // 🚀 Added missing import here!
} from "lucide-react";

export default function TrackerTasks() {
  const [trackedTasks, setTrackedTasks] = useState([]);
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
const [availableTasks, setAvailableTasks] = useState([]);
const [selectedTask, setSelectedTask] = useState(null);
const [showIntervalModal, setShowIntervalModal] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [selectedProject, setSelectedProject] = useState('all');
const [sortOrder, setSortOrder] = useState('asc');
const now = new Date();

const allCount = trackedTasks.length;

const dueTodayCount = trackedTasks.filter(task => {

  if (!task.next_due_time) return false;

  const due = new Date(task.next_due_time);

  return (
    due.toDateString() === now.toDateString()
  );

}).length;

const overdueCount = trackedTasks.filter(task => {

  if (!task.next_due_time) return false;

  return new Date(task.next_due_time) < now;

}).length;

const dueSoonCount = trackedTasks.filter(task => {

  if (!task.next_due_time) return false;

  const due = new Date(task.next_due_time);

  const diff =
    due.getTime() - now.getTime();

  return (
    diff > 0 &&
    diff <= 3 * 24 * 60 * 60 * 1000
  );

}).length;
useEffect(() => {

  fetchTrackedTasks();

}, []);
const isTaskCompleted = (task) => {
  if (!task.last_completed_at) return false;
  if (task.custom_interval === 'once') return true;
  if (!task.next_due_time) return false;
  return new Date(task.next_due_time) > new Date();
};

const completedCount = trackedTasks.filter(task => isTaskCompleted(task)).length;
const uniqueProjects =
  [...new Set(
    trackedTasks.map(
      t => t.projects?.name
    )
  )];
  const filteredTrackedTasks =
  trackedTasks
    .filter(task => {

      const taskName =
        task.tasks?.name?.toLowerCase() || '';

      const projectName =
        task.projects?.name?.toLowerCase() || '';

      const search =
        searchQuery.toLowerCase();

      const matchesSearch =
        taskName.includes(search) ||
        projectName.includes(search);

      const matchesProject =
        selectedProject === 'all' ||
        task.projects?.name === selectedProject;

      return (
        matchesSearch &&
        matchesProject
      );

    })
    .sort((a, b) => {

      const aDate =
        new Date(a.next_due_time || 0);

      const bDate =
        new Date(b.next_due_time || 0);

      return sortOrder === 'asc'
        ? aDate - bDate
        : bDate - aDate;

    });
// AVAILABLE TASK COUNTS

const availableAllCount =
  availableTasks.length;

const availableDailyCount =
  availableTasks.filter(task => {

    const recurring =
      task.recurring?.toLowerCase() || '';

    return (
      recurring.includes('daily') ||
      recurring.includes('24h')
    );

  }).length;

const availableSocialCount =
  availableTasks.filter(task => {

    const category =
      task.category?.toLowerCase() || '';

    const sector =
      task.sector?.toLowerCase() || '';

    return (
      category.includes('social') ||
      sector.includes('social')
    );

  }).length;

const availableTestnetCount =
  availableTasks.filter(task => {

    const category =
      task.category?.toLowerCase() || '';

    const sector =
      task.sector?.toLowerCase() || '';

    return (
      category.includes('testnet') ||
      sector.includes('testnet')
    );

  }).length;

const availableOnchainCount =
  availableTasks.filter(task => {

    const category =
      task.category?.toLowerCase() || '';

    const sector =
      task.sector?.toLowerCase() || '';

    return (
      category.includes('on-chain') ||
      sector.includes('onchain') ||
      sector.includes('defi')
    );

  }).length;
const completeTask = async (task) => {

  try {

    let nextDue = task.next_due_time;

    // CALCULATE NEXT DUE
    if (task.custom_interval === '24h') {

      nextDue = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

    } else if (task.custom_interval === '7d') {

      nextDue = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      );

    } else if (task.custom_interval === '30d') {

      nextDue = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );

    }
    if (task.custom_interval === 'once') {

  nextDue = null;

}

    const { error } = await supabase
      .from('tracker_user_tasks')
      .update({
        last_completed_at: new Date().toISOString(),
        next_due_time: nextDue
      })
      .eq('id', task.id);

    console.log("COMPLETE ERROR:", error);

    if (error) throw error;

    // REFRESH UI
    fetchTrackedTasks();

  } catch (error) {

    console.error(error);

  }
};
const fetchTrackedTasks = async () => {
  

  try {

    setLoading(true);

    // GET USER
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    setUser(user);

    // FETCH TRACKED TASKS
    const { data, error } = await supabase
      .from('tracker_user_tasks')
      .select(`
        *,
        tasks (
          id,
          name,
          link,
          xp
        ),
        projects (
  id,
  name,
  logo_url
)
      `)
      .eq('auth_id', user.id)
      .order('next_due_time', {
        ascending: true
      });

    console.log("TRACKED TASKS:", data);
    console.log("TRACKED TASKS ERROR:", error);

    if (error) throw error;

    setTrackedTasks(data || []);

// TRACKED TASK IDS
const trackedTaskIds =
  data.map(t => t.task_id);

// TRACKED PROJECT IDS
const trackedProjectIds =
  [...new Set(
    data.map(t => t.project_id)
  )];

// FETCH AVAILABLE TASKS
const {
  data: availableData,
  error: availableError
} = await supabase
  .from('tasks')
  .select(`
    *,
    projects (
      id,
      name,
      logo_url
    )
  `)
  .in('project_id', trackedProjectIds)
  .not(
    'id',
    'in',
    `(${trackedTaskIds.join(',') || 'null'})`
  );

console.log(
  "AVAILABLE TASKS:",
  availableData
);

console.log(
  "AVAILABLE TASKS ERROR:",
  availableError
);

setAvailableTasks(
  availableData || []
);

  } catch (error) {

    console.error(error);

  } finally {

    setLoading(false);

  }
};
const getDueStatus = (date) => {

  if (!date) {

  return {
    label: "No Due Date",
    color: "text-slate-500"
  };

}

const now = new Date();
const due = new Date(date);

const diffMs =
  due.getTime() - now.getTime();

const diffMinutes =
  Math.floor(diffMs / (1000 * 60));

const diffHours =
  Math.floor(diffMs / (1000 * 60 * 60));

const diffDays =
  Math.floor(diffMs / (1000 * 60 * 60 * 24));

// OVERDUE
if (diffMs < 0) {

  return {
    label: "Overdue",
    color: "text-red-600"
  };

}

// DUE IN MINUTES
if (diffMinutes < 60) {

  return {
    label: `Due in ${diffMinutes}m`,
    color: "text-orange-600"
  };

}

// DUE IN HOURS
if (diffHours < 24) {

  return {
    label: `Due in ${diffHours}h`,
    color: "text-orange-600"
  };

}

// TOMORROW
if (diffDays === 1) {

  return {
    label: "Due Tomorrow",
    color: "text-blue-600"
  };

}

// DUE SOON
if (diffDays <= 7) {

  return {
    label: `Due in ${diffDays}d`,
    color: "text-blue-600"
  };

}

// FUTURE
return {

  label: `Due in ${diffDays}d`,
  color: "text-slate-600"
}
};
  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col pb-8">
      
      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <div className="px-6 lg:px-8 pt-8 pb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage and track all your airdrop tasks in one place.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
  value={searchQuery}
  onChange={(e) =>
    setSearchQuery(e.target.value)
  }
  placeholder="Search tasks..."
  className="h-10 w-full sm:w-72 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-sm transition-all"
/>
          </div>
          <select
  value={selectedProject}
  onChange={(e) =>
    setSelectedProject(e.target.value)
  }
  className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition-colors focus:outline-none"
>
  <option value="all">
    All Projects
  </option>

  {uniqueProjects.map(project => (
    <option
      key={project}
      value={project}
    >
      {project}
    </option>
  ))}
</select>
          <select
  value={sortOrder}
  onChange={(e) =>
    setSortOrder(e.target.value)
  }
  className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition-colors focus:outline-none"
>
  <option value="asc">
    Next Due ↑
  </option>

  <option value="desc">
    Next Due ↓
  </option>
</select>
        
        </div>
      </div>

      {/* ─── TOP TABS ─── */}
      <div className="px-6 lg:px-8 flex flex-wrap items-center gap-3">
        <Pill
  label="My Tasks"
  count={allCount}
  active
/>

<Pill
  label="All Tasks"
  count={allCount + availableAllCount}
/>

<Pill
  label="Completed"
  count={completedCount}
/>
      </div>

      {/* ─── TWO-COLUMN GRID ─── */}
      <div className="px-6 lg:px-8 py-6 grid grid-cols-1 xl:grid-cols-[55%_45%] gap-6 flex-1">
        
        {/* LEFT COLUMN: My Tracked Tasks */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">My Tracked Tasks</h2>
            <CountBadge n={allCount} />
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Tasks you've added to your tracker
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-5">
            <Pill label="All" count={allCount} active />
            <Pill label="Due Today" count={dueTodayCount} active tone="orange" />
            <Pill label="Due Soon" count={dueSoonCount} active />
            <Pill label="Overdue" count={overdueCount} />
          </div>

          {/* Tracked Tasks Table */}
          <div className="mt-6 flex-1 overflow-x-auto pb-2">
            <div className="min-w-[820px]">
              {/* Header Row */}
              <div className="grid grid-cols-[2.3fr_1.1fr_1.1fr_0.8fr_0.7fr_0.5fr] gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100">
                <div>Task</div>
                <div>Project</div>
                <div className="flex items-center gap-1">
                  Next Due <span className="text-slate-400">↑</span>
                </div>
                <div>Recurrence</div>
                <div>Task Link</div>
<div>Completion</div>
                
              </div>

              {/* Data Rows */}
              {filteredTrackedTasks.map((r) => (
  <div
    key={r.id}
                  className="grid grid-cols-[2.3fr_1.1fr_1.1fr_0.8fr_0.7fr_0.5fr] gap-3 items-center py-3.5 border-b border-slate-50 text-sm hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <TaskTypeIcon type="checkin" />
                    <span className="truncate font-bold text-slate-800">{r.tasks?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProjectIcon
  p={r.projects?.name}
  logo={r.projects?.logo_url}
  size={5}
/>
                    <span className="font-semibold text-slate-700">{r.projects?.name}</span>
                  </div>
                  <div className={`text-xs font-bold ${getDueStatus(r.next_due_time).color}`}>
  {getDueStatus(r.next_due_time).label}
</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded w-fit">{r.custom_interval}</div>
                  <a
  href={r.tasks?.link}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-600 font-bold text-xs hover:underline"
>
  Open Task
</a>
  <div className="flex items-center">
  <button
    onClick={() => !isTaskCompleted(r) && completeTask(r)}
    disabled={isTaskCompleted(r)}
    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
      isTaskCompleted(r)
        ? "bg-emerald-500 border-emerald-500 cursor-not-allowed"
        : "border-slate-300 hover:border-emerald-400"
    }`}
  >
    {isTaskCompleted(r) && (
      <CheckSquare className="w-3 h-3 text-white" />
    )}
  </button>
</div>

                  
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 mt-auto border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500">
              Showing 1 to 8 of 24 tasks
            </span>
            <button className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              View Calendar
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: Available Tasks */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Available Tasks</h2>
            <CountBadge n={availableAllCount} />
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Discover and add tasks from tracked projects
          </p>

          <div className="flex items-center gap-2 mt-5 flex-wrap">
            <Pill
  label="All"
  count={availableAllCount}
  active
/>
            <Pill
  label="Daily"
  count={availableDailyCount}
/>
            <Pill
  label="Social"
  count={availableSocialCount}
/>
            <Pill
  label="Testnet"
  count={availableTestnetCount}
/>
            <Pill
  label="On-chain"
  count={availableOnchainCount}
/>
          </div>

          <div className="mt-6 flex-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {availableTasks.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 py-3 px-2 border-b border-slate-50 group hover:bg-slate-50/50 rounded-xl transition-colors"
              >
                {/* LEFT SIDE */}
<div className="flex items-center gap-3 flex-1 min-w-0">

  <ProjectIcon
    p={a.projects?.name}
    logo={a.projects?.logo_url}
    size={10}
  />

  <div className="flex-1 min-w-0">

    <div className="text-sm font-bold text-slate-900 truncate">
      {a.name}
    </div>

    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">

      <Tag
        label={a.projects?.name}
        tone="violet"
      />

      <Tag
        label={a.recurring || "ONCE"}
        tone="blue"
      />

      <Tag
        label={a.status || "TASK"}
        tone="slate"
      />

    </div>

  </div>

</div>

{/* RIGHT SIDE */}
<div className="flex items-center gap-2 shrink-0">

  <div className="text-blue-600 font-black text-xs whitespace-nowrap">
    +{a.xp || 0} XP
  </div>

  <a
    href={a.link}
    target="_blank"
    rel="noopener noreferrer"
    className="h-8 px-3 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-bold text-blue-700 flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm whitespace-nowrap"
  >
    Open
  </a>

  <button
    onClick={() => {
      setSelectedTask(a);
      setShowIntervalModal(true);
    }}
    className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 flex items-center gap-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm whitespace-nowrap"
  >
    <Plus className="w-3.5 h-3.5 stroke-[3]" />
    Add
  </button>

</div>
              </div>
            ))}
          </div>

          <button className="mt-4 h-11 w-full rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 text-sm font-bold text-slate-600 flex items-center justify-center gap-2 transition-colors">
            Load More Tasks <ChevronDown className="w-4 h-4" />
          </button>
        </section>
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
      {showIntervalModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

    <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl p-6">

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">
          Set Task Recurrence
        </h3>

        <button
          onClick={() => {
            setShowIntervalModal(false);
            setSelectedTask(null);
          }}
          className="text-slate-400 hover:text-slate-700 text-xl font-bold"
        >
          ×
        </button>
      </div>

      <p className="text-sm text-slate-500 mt-2">
        Choose how often you want this task to repeat.
      </p>

      <div className="mt-5 grid gap-3">

        {[
          { label: 'One Time', value: 'once' },
          { label: 'Daily', value: '24h' },
          { label: 'Weekly', value: '7d' },
          { label: 'Monthly', value: '30d' }
        ].map(interval => (

          <button
            key={interval.value}
            onClick={async () => {

              try {

                const {
                  data: { user }
                } = await supabase.auth.getUser();

                if (!user || !selectedTask) return;

                const { error } = await supabase
                  .from('tracker_user_tasks')
                  .insert({
                    auth_id: user.id,
                    project_id: selectedTask.project_id,
                    task_id: selectedTask.id,
                    custom_interval: interval.value,
                    next_due_time: new Date().toISOString()
                  });

                console.log("ADD TASK ERROR:", error);

                if (error) throw error;

                setShowIntervalModal(false);
                setSelectedTask(null);

                await fetchTrackedTasks();

              } catch (error) {

                console.error(error);

              }

            }}
            className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all font-bold text-slate-700"
          >
            {interval.label}
          </button>

        ))}

      </div>
    </div>
  </div>
)}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS & DUMMY DATA
// ============================================================================

function CountBadge({ n, tone = "blue" }) {
  const cls = tone === "blue" ? "text-blue-600 bg-blue-50 border-blue-100" : "text-slate-600 bg-slate-100 border-slate-200";
  return (
    <span className={`text-[10px] font-black ${cls} border px-2 py-0.5 rounded-md`}>
      {n}
    </span>
  );
}

function Pill({ label, count, active, tone = "blue" }) {
  const activeCls = tone === "orange"
      ? "bg-orange-50 text-orange-700 border-orange-200 shadow-sm"
      : "bg-blue-50 text-blue-700 border-blue-200 shadow-sm";
  return (
    <button className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
        active ? activeCls : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
            active
              ? tone === "orange" ? "bg-orange-100/80 text-orange-700" : "bg-blue-100/80 text-blue-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ProjectIcon({ p, logo, size = 6 }) {
  const sz = `w-${size} h-${size}`;
  const map = {
    Monad: { bg: "bg-violet-600", icon: <CircleDot className="w-3 h-3 text-white" /> },
    Berachain: { bg: "bg-amber-700", icon: <span className="text-white text-[10px] font-black">B</span> },
    Kaito: { bg: "bg-slate-900", icon: <Twitter className="w-3 h-3 text-white" /> },
    Base: { bg: "bg-blue-600", icon: <span className="text-white text-[10px] font-black">B</span> },
    MegaETH: { bg: "bg-slate-900", icon: <span className="text-white text-[10px] font-black">M</span> },
  };
  const cfg = map[p] ?? { bg: "bg-slate-300", icon: <span className="text-white text-[10px] font-black">?</span> };
  if (logo) {

  return (
    <img
      src={logo}
      alt={p}
      className={`${sz} rounded-full object-cover shrink-0 border border-slate-100 shadow-sm`}
    />
  );
}

return (
  <span className={`${sz} ${cfg.bg} rounded-full flex items-center justify-center shrink-0 border border-slate-100 shadow-sm`}>
    {cfg.icon}
  </span>
);
}

function TaskTypeIcon({ type }) {
  const cfg = {
    faucet: { bg: "bg-violet-50 border-violet-100", icon: <Droplet className="w-3.5 h-3.5 text-violet-600" /> },
    "social-x": { bg: "bg-sky-50 border-sky-100", icon: <Twitter className="w-3.5 h-3.5 text-sky-500" /> },
    discord: { bg: "bg-indigo-50 border-indigo-100", icon: <MessageCircle className="w-3.5 h-3.5 text-indigo-600" /> },
    bridge: { bg: "bg-violet-50 border-violet-100", icon: <ArrowLeftRight className="w-3.5 h-3.5 text-violet-600" /> },
    checkin: { bg: "bg-emerald-50 border-emerald-100", icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> },
    post: { bg: "bg-slate-900 border-slate-800", icon: <Twitter className="w-3 h-3 text-white" /> },
    assets: { bg: "bg-blue-50 border-blue-100", icon: <Coins className="w-3.5 h-3.5 text-blue-600" /> },
    testnet: { bg: "bg-slate-900 border-slate-800", icon: <Layers className="w-3.5 h-3.5 text-white" /> },
  };
  const c = cfg[type] || cfg["checkin"];
  return (
    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${c.bg}`}>
      {c.icon}
    </span>
  );
}

function Tag({ label, tone }) {
  const map = {
    violet: "bg-violet-50 border-violet-200 text-violet-700",
    slate: "bg-slate-50 border-slate-200 text-slate-600",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${map[tone]}`}>
      {label}
    </span>
  );
}

// --- DUMMY DATA ---

const mockTracked = [
  { task: "Monad Faucet Claim", type: "faucet", project: "Monad", due: "Today, 10:00 AM", dueTone: "orange", recurrence: "Daily", xp: 10, status: "Due Today" },
  { task: "Follow Monad on X", type: "social-x", project: "Monad", due: "Today, 12:00 PM", dueTone: "orange", recurrence: "Daily", xp: 15, status: "Due Today" },
  { task: "Join Monad Discord", type: "discord", project: "Monad", due: "Tomorrow", dueTone: "slate", recurrence: "Once", xp: 20, status: "Due Soon" },
  { task: "Bridge to Monad Testnet", type: "bridge", project: "Monad", due: "Tomorrow, 8:00 AM", dueTone: "slate", recurrence: "Weekly", xp: 50, status: "Due Soon" },
  { task: "Berachain Daily Check-in", type: "checkin", project: "Berachain", due: "Today, 9:00 AM", dueTone: "orange", recurrence: "Daily", xp: 10, status: "Due Today" },
  { task: "Kaito Social Post", type: "post", project: "Kaito", due: "In 2 days", dueTone: "slate", recurrence: "3x/Week", xp: 15, status: "Due Soon" },
  { task: "Base Bridge Assets", type: "assets", project: "Base", due: "In 2 days", dueTone: "slate", recurrence: "Weekly", xp: 20, status: "Due Soon" },
  { task: "MegaETH Testnet Activity", type: "testnet", project: "MegaETH", due: "In 3 days", dueTone: "slate", recurrence: "Weekly", xp: 30, status: "Scheduled" },
];

const mockAvailable = [
  { title: "Complete Monad Galxe Quest", icon: <CircleDot className="w-5 h-5 text-violet-600" />, iconBg: "bg-violet-100", tags: [{ label: "Monad", tone: "violet" }, { label: "Quest", tone: "slate" }], xp: 25 },
  { title: "Quote Tweet about Monad", icon: <Twitter className="w-4 h-4 text-sky-500" />, iconBg: "bg-sky-50", tags: [{ label: "Monad", tone: "violet" }, { label: "Social", tone: "slate" }], xp: 15 },
  { title: "Refer 3 Friends to Monad", icon: <Users className="w-5 h-5 text-violet-600" />, iconBg: "bg-violet-100", tags: [{ label: "Monad", tone: "violet" }, { label: "Social", tone: "slate" }], xp: 30 },
  { title: "Provide Liquidity on Monad", icon: <Droplet className="w-5 h-5 text-violet-600" />, iconBg: "bg-violet-100", tags: [{ label: "Monad", tone: "violet" }, { label: "DeFi", tone: "slate" }], xp: 40 },
  { title: "Follow Kaito on X", icon: <Twitter className="w-4 h-4 text-sky-500" />, iconBg: "bg-sky-50", tags: [{ label: "Kaito", tone: "slate" }, { label: "Social", tone: "slate" }], xp: 10 },
  { title: "Mint on Berachain Testnet", icon: <Sparkles className="w-5 h-5 text-amber-600" />, iconBg: "bg-amber-100", tags: [{ label: "Berachain", tone: "amber" }, { label: "Testnet", tone: "slate" }], xp: 20 },
  { title: "Transaction on Base Sepolia", icon: <span className="text-white text-[12px] font-black">B</span>, iconBg: "bg-blue-600", tags: [{ label: "Base", tone: "blue" }, { label: "On-chain", tone: "slate" }], xp: 10 },
  { title: "Interact with MegaETH dApp", icon: <span className="text-white text-[12px] font-black">M</span>, iconBg: "bg-slate-900", tags: [{ label: "MegaETH", tone: "slate" }, { label: "dApp", tone: "slate" }], xp: 20 },
];