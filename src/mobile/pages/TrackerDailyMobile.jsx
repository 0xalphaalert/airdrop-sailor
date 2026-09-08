import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Play, Flame, Clock3, Zap, CircleDollarSign, 
  ChevronLeft, ChevronRight, Check, CalendarDays, FolderKanban, Repeat2 
} from 'lucide-react';
import TrackerLayoutMobile from '../components/TrackerLayoutMobile';
import { useTracker } from '../context/TrackerContext';
import { TaskBottomSheetMobile } from '../components/TaskBottomSheetMobile';

const DAY = 86400000;
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const isComplete = (task) => task.status === 'completed';
const completedToday = (task) => task.lastCompletedAt && new Date(task.lastCompletedAt) >= startOfDay(new Date());

const intervalLabels = { once: 'One-time', '24h': 'Daily', '7d': 'Weekly', '30d': 'Monthly' };

export default function TrackerDailyMobile() {
  const { tasks, loading, activeTimer } = useTracker();
  const [selectedTask, setSelectedTask] = useState(null);

  // --- DATA GROUPING LOGIC (Restored from Desktop) ---
  const isOneTime = (task) => {
    const r = (task.recurrence || task.custom_interval || '').toLowerCase();
    return r === 'once' || r === 'one-time';
  };

  const dailyTasks = useMemo(() => {
    return tasks.filter(task => {
      if (task.status === 'pending') return true;
      // Only keep completed tasks in today's view if they are recurring
      return completedToday(task) && !isOneTime(task);
    }).sort((a, b) => new Date(a.nextDue || '9999-12-31') - new Date(b.nextDue || '9999-12-31'));
  }, [tasks]);

  const groups = useMemo(() => {
    const todayEnd = startOfDay(new Date(Date.now() + DAY)).getTime();
    const cutoff = Date.now() + 3 * 3600000; // 3 hours

    // Never process permanently dead one-time tasks
    const activeTasks = dailyTasks.filter(task => {
      if (isComplete(task) && isOneTime(task)) return false;
      return task.status !== 'completed';
    });

    return {
      now: activeTasks.filter(task => !completedToday(task) && task.nextDue && new Date(task.nextDue).getTime() <= cutoff),
      today: activeTasks.filter(task => !completedToday(task) && task.nextDue && new Date(task.nextDue).getTime() > cutoff && new Date(task.nextDue).getTime() < todayEnd),
      upcoming: activeTasks.filter(task => {
        // Completed recurring tasks show in upcoming (for tomorrow/future)
        if (completedToday(task) && !isOneTime(task)) return true;
        // Pending tasks due tomorrow or later
        return task.nextDue && new Date(task.nextDue).getTime() >= todayEnd;
      }),
    };
  }, [dailyTasks]);

  const completed = dailyTasks.filter(isComplete);
  const xpEarned = completed.reduce((sum, task) => sum + task.xp, 0);
  const sailEarned = completed.reduce((sum, task) => sum + task.sail, 0);
  const completionPercent = dailyTasks.length ? Math.round((completed.length / dailyTasks.length) * 100) : 0;

  return (
    <TrackerLayoutMobile>
      <div className="space-y-8 px-4 pt-0 pb-0">
        
        {/* --- HEADER & PROGRESS --- */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Tasks</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Your focused plan for today.</p>
        </div>
        
        <section className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Daily Goal Progress</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{completed.length} of {dailyTasks.length} tasks completed</p>
            </div>
            <span className="text-lg font-black text-violet-600">{completionPercent}%</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-violet-100">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500" 
              style={{ width: `${completionPercent}%` }} 
            />
          </div>
        </section>

        {/* --- MAIN TASK LISTS --- */}
        {loading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-400">Loading your plan...</div>
        ) : (
          <div className="space-y-8">
            <TaskSection 
              icon={<Flame className="w-5 h-5 text-orange-500" />} 
              title="Due Now" 
              subtitle="Requires attention in the next few hours." 
              tasks={groups.now} 
              onSelect={setSelectedTask} 
              activeTimer={activeTimer}
            />
            <TaskSection 
              icon={<CalendarDays className="w-5 h-5 text-blue-500" />} 
              title="Due Today" 
              subtitle="Finish these before the day ends." 
              tasks={groups.today} 
              onSelect={setSelectedTask} 
              activeTimer={activeTimer}
            />
            <TaskSection 
              icon={<Clock3 className="w-5 h-5 text-slate-400" />} 
              title="Upcoming" 
              subtitle="Scheduled for tomorrow and beyond." 
              tasks={groups.upcoming} 
              onSelect={setSelectedTask} 
              activeTimer={activeTimer}
            />
          </div>
        )}

        {/* --- WIDGETS (Stacked for Mobile) --- */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Your Stats</h2>
          <RewardsWidget xp={xpEarned} sail={sailEarned} />
          <StreakWidget tasks={dailyTasks} />
          <CalendarWidget tasks={dailyTasks} />
        </div>

      </div>

      {/* --- BOTTOM SHEET --- */}
      <TaskBottomSheetMobile 
        isOpen={!!selectedTask} 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </TrackerLayoutMobile>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function TaskSection({ icon, title, subtitle, tasks, onSelect, activeTimer }) {
  if (tasks.length === 0) return null; // Hide empty sections on mobile to save space
  
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          {icon} {title} <span className="text-slate-400 text-sm ml-1">({tasks.length})</span>
        </h2>
        <p className="text-xs font-medium text-slate-500 ml-7">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {tasks.map(task => (
          <TaskRow 
            key={task.id} 
            task={task} 
            onSelect={() => onSelect(task)} 
            isTiming={activeTimer?.id === task.id} 
          />
        ))}
      </div>
    </section>
  );
}

function TaskRow({ task, onSelect, isTiming }) {
  return (
    <div 
      onClick={onSelect}
      className={`relative rounded-2xl border bg-white p-4 shadow-sm transition-all cursor-pointer active:scale-[0.98] ${
        isTiming ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 hover:border-violet-300'
      }`}
    >
      <div className="flex gap-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-violet-50 border border-slate-100 flex items-center justify-center text-violet-600 font-bold">
          {task.projectLogo ? <img src={task.projectLogo} alt="" className="h-full w-full object-cover" /> : <FolderKanban className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold text-slate-900 leading-tight pr-8">{task.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 truncate max-w-[100px]">
              {task.project}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <Repeat2 className="w-3 h-3" /> {intervalLabels[task.recurrence] || task.recurrence}
            </span>
          </div>
        </div>
      </div>
      
      {/* Play/Pause Indicator */}
      <div className={`absolute top-4 right-4 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isTiming ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-400'
      }`}>
        <Play className={`w-3.5 h-3.5 ${!isTiming && 'ml-0.5'}`} fill={isTiming ? "currentColor" : "none"} />
      </div>
    </div>
  );
}

function RewardsWidget({ xp, sail }) { 
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900 mb-3">Rewards Earned Today</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 bg-violet-50 p-3 rounded-xl border border-violet-100">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-violet-600 fill-violet-100" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">+{xp}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">XP</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <CircleDollarSign className="w-5 h-5 text-blue-600 fill-blue-100" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">+{sail}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">SAIL</p>
          </div>
        </div>
      </div>
    </section>
  ); 
}

function StreakWidget({ tasks }) { 
  const activeDays = Array.from({ length: 7 }, (_, index) => { 
    const date = startOfDay(new Date(new Date().getTime() - (6 - index) * DAY)); 
    return tasks.some(task => task.lastCompletedAt && startOfDay(new Date(task.lastCompletedAt)).getTime() === date.getTime()); 
  }); 
  const streak = activeDays.slice().reverse().findIndex(day => !day); 
  const count = streak === -1 ? 7 : streak; 

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-900">Streak Status</h2>
        <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
          <Flame className="w-4 h-4 fill-orange-400" /> {count || 0} Days
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {activeDays.map((active, index) => (
          <div key={index} className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-400 mb-1">{'MTWTFSS'[index]}</span>
            <div className={`grid h-7 w-7 place-items-center rounded-full ${active ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-300'}`}>
              {active && <Check className="h-4 w-4" strokeWidth={3} />}
            </div>
          </div>
        ))}
      </div>
    </section>
  ); 
}

function CalendarWidget({ tasks }) { 
  const now = new Date(); 
  const year = now.getFullYear(); 
  const month = now.getMonth(); 
  const first = new Date(year, month, 1); 
  const offset = first.getDay(); 
  const days = new Date(year, month + 1, 0).getDate(); 
  const dots = day => tasks.filter(task => task.nextDue && new Date(task.nextDue).getFullYear() === year && new Date(task.nextDue).getMonth() === month && new Date(task.nextDue).getDate() === day).length; 

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-900">{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-2">
          <button className="p-1 rounded bg-slate-50 text-slate-400"><ChevronLeft className="h-4 w-4" /></button>
          <button className="p-1 rounded bg-slate-50 text-slate-400"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
        {'SMTWTFS'.split('').map((day, index) => <span key={`header-${index}`}>{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset + days }, (_, index) => { 
          const day = index - offset + 1; 
          if (day < 1) return <span key={`empty-${index}`} />; // <-- FIXED KEY
          const count = dots(day); 
          const today = day === now.getDate(); 
          return (
            <div key={`day-${day}`} className="flex h-8 flex-col items-center justify-center"> {/* <-- FIXED KEY */}
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${today ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600'}`}>{day}</span>
              {count > 0 && <i className="mt-0.5 h-1 w-1 rounded-full bg-blue-400" />}
            </div>
          ); 
        })}
      </div>
    </section>
  ); 
}
