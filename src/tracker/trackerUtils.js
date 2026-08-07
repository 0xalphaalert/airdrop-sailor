/**
 * Shared tracker helpers.
 *
 * Centralises the task-shape normalisation, recurrence maths and formatting
 * helpers that used to be duplicated between TrackerTasks.jsx and
 * TrackerDaily.jsx (and partially re-implemented in TrackerOverview.jsx).
 *
 * Design system reference used by every tracker page:
 *   violet-600  -> primary actions / accents
 *   emerald-600 -> completed status / gains
 *   amber-500   -> pending / due soon
 *   rose-500    -> overdue / destructive (untrack)
 */

export const DAY = 86400000;

export const intervalLabels = {
  once: 'One-time',
  '24h': 'Daily',
  '7d': 'Weekly',
  '30d': 'Monthly',
};

/** Canonical palette tokens so pages never hardcode divergent colours. */
export const palette = {
  primary: 'violet',
  completed: 'emerald',
  pending: 'amber',
  overdue: 'rose',
};

export const statusTone = {
  completed: 'bg-emerald-50 text-emerald-600',
  pending: 'bg-amber-50 text-amber-600',
  overdue: 'bg-rose-50 text-rose-600',
};

/* ------------------------------------------------------------------ */
/* Dates & status                                                      */
/* ------------------------------------------------------------------ */

export const startOfDay = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Parses anything Supabase may hand back (ISO string, epoch number, Date) into
 * a local *calendar day* timestamp. Returns null when the value is unusable so
 * callers can filter it out instead of poisoning maths with NaN.
 */
export function toLocalDayTimestamp(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = value instanceof Date ? value : new Date(value);
  const time = parsed.getTime();
  if (Number.isNaN(time)) return null;
  return startOfDay(parsed).getTime();
}


export const isComplete = (task) => task?.status === 'completed';

export const isOverdue = (task) =>
  !!task && !isComplete(task) && !!task.nextDue && new Date(task.nextDue) < new Date();

export const statusFor = (task) => {
  if (isComplete(task)) return 'completed';
  if (isOverdue(task)) return 'overdue';
  return 'pending';
};

export const completedToday = (task) =>
  !!task?.lastCompletedAt && new Date(task.lastCompletedAt) >= startOfDay(new Date());

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatDuration(seconds = 0) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

/**
 * Human readable "time until due" plus the palette-aligned text colour.
 * Overdue -> rose-500, due within 24h -> amber-500, otherwise neutral.
 */
export function timeLeft(date) {
  if (!date) return { label: 'No due date', className: 'text-slate-400' };
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  if (seconds < 0) {
    return { label: `${formatDuration(Math.abs(seconds))} late`, className: 'text-rose-500' };
  }
  return {
    label: `${formatDuration(seconds)} left`,
    className: seconds < 86400 ? 'text-amber-500' : 'text-slate-500',
  };
}

export function priorityTone(priority) {
  return (
    {
      High: 'bg-rose-50 text-rose-600',
      Medium: 'bg-amber-50 text-amber-600',
      Low: 'bg-emerald-50 text-emerald-600',
    }[priority] || 'bg-slate-100 text-slate-600'
  );
}

/* ------------------------------------------------------------------ */
/* Recurrence                                                          */
/* ------------------------------------------------------------------ */

/** Accepts both the stored codes ("24h") and human labels ("Daily"). */
export function getRecurrenceType(value) {
  if (!value) return 'once';
  const lower = String(value).toLowerCase();
  if (lower === 'daily' || lower === '24h') return 'daily';
  if (lower === 'weekly' || lower === '7d') return 'weekly';
  if (lower === 'monthly' || lower === '30d') return 'monthly';
  return 'once';
}

function applyPreferredTime(date, preferredTime) {
  if (!preferredTime) return date;
  const [hours, minutes] = String(preferredTime).split(':');
  date.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
  return date;
}

/**
 * Single source of truth for recurring schedules.
 *
 * @param {string} recurrence     'once' | '24h' | '7d' | '30d' (or labels)
 * @param {string} preferredTime  'HH:MM' - optional time of day anchor
 * @param {string} currentNextDue ISO string of the existing due date
 * @returns {string|null} ISO string for the next occurrence, null for one-time
 */
export function calculateNextDueDate(recurrence, preferredTime, currentNextDue) {
  const type = getRecurrenceType(recurrence);
  if (type === 'once') return null;

  const now = new Date();
  let base;

  if (currentNextDue && new Date(currentNextDue) > now) {
    base = new Date(currentNextDue);
  } else {
    base = new Date();
    applyPreferredTime(base, preferredTime);
  }

  if (type === 'daily') base.setDate(base.getDate() + 1);
  else if (type === 'weekly') base.setDate(base.getDate() + 7);
  else if (type === 'monthly') base.setMonth(base.getMonth() + 1);

  applyPreferredTime(base, preferredTime);

  return base.toISOString();
}

/**
 * Builds the Supabase update payload used when a task is marked complete.
 * One-time tasks close out, recurring tasks roll forward and stay pending.
 */
export function buildCompletionPayload(task) {
  const completedAt = new Date().toISOString();
  const nextDue = calculateNextDueDate(task.recurrence, task.preferredTime, task.nextDue);
  return {
    status: nextDue ? 'pending' : 'completed',
    last_completed_at: completedAt,
    next_due_time: nextDue,
  };
}

/** Recurring tasks live in a different table depending on their origin. */
export const tableForTask = (task) =>
  task?.source === 'project' ? 'tracker_user_tasks' : 'tracker_custom_tasks';

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

/** Maps a `tracker_user_tasks` row (joined with tasks/projects) to the UI shape. */
export function normalizeProjectTask(row) {
  const definition = row.tasks || {};
  return {
    id: `project-${row.id}`,
    sourceId: row.id,
    source: 'project',
    name: definition.name || 'Untitled task',
    project: row.projects?.name || 'Project task',
    projectId: row.project_id || row.projects?.id || null,
    projectLogo: row.projects?.logo_url,
    notes: row.notes || '',
    tutorialMarkdown: definition.tutorial_markdown || '',
    resources: definition.resources || [],
    link: definition.link || row.link,
    priority: row.priority || 'Medium',
    recurrence: row.custom_interval || 'once',
    nextDue: row.next_due_time,
    preferredTime: row.preferred_time || '',
    status: row.status || 'pending',
    lastCompletedAt: row.last_completed_at,
    completionCount: Number(row.completion_count) || 0,
    timeSpent: Number(row.time_spent_seconds) || 0,
    xp: Number(definition.xp) || 0,
    sail: Number(definition.sail || definition.sail_reward || row.sail_reward) || 0,
    difficulty: row.priority || 'Medium',
    estimatedTime: definition.estimated_time || row.estimated_time || '2 min',
  };
}

/** Maps a `tracker_custom_tasks` row to the same UI shape. */
export function normalizeCustomTask(row) {
  return {
    id: `custom-${row.id}`,
    sourceId: row.id,
    source: 'custom',
    name: row.name || row.title || row.task_name || 'Personal task',
    project: row.project_name || 'Personal Workspace',
    projectId: row.project_id || null,
    projectLogo: row.project_logo_url,
    notes: row.notes || row.note || row.description || '',
    tutorialMarkdown: row.tutorial_markdown || '',
    resources: row.resources || [],
    link: row.link || row.url,
    priority: row.priority || 'Medium',
    recurrence: row.custom_interval || row.recurrence || 'once',
    nextDue: row.next_due_time || row.due_date,
    preferredTime: row.preferred_time || '',
    status: row.status || 'pending',
    lastCompletedAt: row.last_completed_at,
    completionCount: Number(row.completion_count) || 0,
    timeSpent: Number(row.time_spent_seconds) || 0,
    xp: Number(row.xp) || 0,
    sail: Number(row.sail || row.sail_reward) || 0,
    difficulty: row.priority || 'Medium',
    estimatedTime: row.estimated_time || 'Personal',
  };
}

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

/**
 * Consecutive-day streak from a list of completion timestamps.
 *
 * - Accepts ISO strings (`last_completed_at`), epoch numbers or Date objects.
 * - Collapses multiple completions on the same calendar day into one active day.
 * - Anchors on today, falling back to yesterday so the streak is not wiped out
 *   before the user has had a chance to complete anything today.
 * - Walks backwards with real calendar arithmetic so DST shifts cannot break
 *   the chain (a naive `-86400000` loses/gains an hour twice a year).
 *
 * @param {Array<string|number|Date>} timestamps completion timestamps
 * @returns {number} number of consecutive active days
 */
export function calculateStreak(timestamps = []) {
  const list = Array.isArray(timestamps) ? timestamps : [];

  const days = new Set();
  for (const value of list) {
    const day = toLocalDayTimestamp(value);
    if (day !== null) days.add(day);
  }
  if (!days.size) return 0;

  const today = new Date();
  const todayStart = startOfDay(today).getTime();

  // Anchor: today if it is already active, otherwise yesterday.
  const cursor = startOfDay(today);
  if (!days.has(todayStart)) cursor.setDate(cursor.getDate() - 1);
  if (!days.has(cursor.getTime())) return 0;

  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* ------------------------------------------------------------------ */
/* Cross-page live sync                                                */
/* ------------------------------------------------------------------ */

/**
 * Event name broadcast whenever tracker data mutates (complete, untrack,
 * create, schedule change). TrackerHeader listens for it so the Streak / XP /
 * SAIL pills refresh without a hard page reload.
 */
export const TRACKER_UPDATED_EVENT = 'tracker_task_updated';

/**
 * Notifies every mounted tracker surface that the user's task data changed.
 * Safe to call during SSR / tests where `window` is undefined.
 *
 * @param {object} [detail] optional payload (e.g. { reason: 'complete' })
 */
export function emitTrackerUpdate(detail = {}) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(TRACKER_UPDATED_EVENT, { detail }));
  } catch {
    // Very old browsers without the CustomEvent constructor.
    window.dispatchEvent(new Event(TRACKER_UPDATED_EVENT));
  }
}


/**
 * Percentage delta between the current and the preceding window.
 * Returns a display-ready label plus the palette colour class.
 */
export function growthTrend(current, previous) {
  if (!previous) {
    if (!current) return { label: 'No change vs last 7 days', className: 'text-slate-500' };
    return { label: `↑ New in the last 7 days`, className: 'text-emerald-600' };
  }
  const delta = Math.round(((current - previous) / previous) * 1000) / 10;
  if (delta === 0) return { label: 'No change vs last 7 days', className: 'text-slate-500' };
  return {
    label: `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)}% from last 7 days`,
    className: delta > 0 ? 'text-emerald-600' : 'text-rose-500',
  };
}

/** Counts entries whose date field falls inside [start, end). */
export function countInWindow(rows, field, start, end) {
  return rows.filter((row) => {
    const value = row?.[field];
    if (!value) return false;
    const time = new Date(value).getTime();
    return time >= start && time < end;
  }).length;
}

/** Sums a numeric selector over the entries inside [start, end). */
export function sumInWindow(rows, field, start, end, selector) {
  return rows.reduce((total, row) => {
    const value = row?.[field];
    if (!value) return total;
    const time = new Date(value).getTime();
    if (time < start || time >= end) return total;
    return total + (Number(selector(row)) || 0);
  }, 0);
}
