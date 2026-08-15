import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const inputClassName = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

async function loadPendingQueues() {
  const [projectsResult, tasksResult] = await Promise.all([
    supabase
      .from('pending_projects_review')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false }),
    supabase
      .from('pending_tasks_review')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false }),
  ]);

  if (projectsResult.error) throw projectsResult.error;
  if (tasksResult.error) throw tasksResult.error;

  return {
    projects: projectsResult.data || [],
    tasks: tasksResult.data || [],
  };
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 p-4" role="presentation" onMouseDown={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-base font-black text-slate-950">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ResearchDailyTasks() {
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectsQueue, setProjectsQueue] = useState([]);
  const [tasksQueue, setTasksQueue] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState(null);
  const [processingKey, setProcessingKey] = useState(null);
  const [projectModal, setProjectModal] = useState(null);
  const [taskModal, setTaskModal] = useState(null);

  const fetchQueues = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setNotice(null);

    try {
      const queues = await loadPendingQueues();
      setProjectsQueue(queues.projects);
      setTasksQueue(queues.tasks);
    } catch (error) {
      setNotice({ type: 'error', text: `Failed to load research queues: ${error.message}` });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadPendingQueues()
      .then((queues) => {
        if (cancelled) return;
        setProjectsQueue(queues.projects);
        setTasksQueue(queues.tasks);
      })
      .catch((error) => {
        if (!cancelled) setNotice({ type: 'error', text: `Failed to load research queues: ${error.message}` });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleReject = async (table, id) => {
    const key = `${table}:${id}`;
    setProcessingKey(key);
    setNotice(null);

    try {
      const { error } = await supabase.from(table).update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;

      if (table === 'pending_projects_review') {
        setProjectsQueue((current) => current.filter((item) => item.id !== id));
      } else {
        setTasksQueue((current) => current.filter((item) => item.id !== id));
      }
      setNotice({ type: 'success', text: 'Item rejected and removed from the queue.' });
    } catch (error) {
      setNotice({ type: 'error', text: `Failed to reject item: ${error.message}` });
    } finally {
      setProcessingKey(null);
    }
  };

  const submitProject = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const key = `pending_projects_review:${projectModal.id}`;
    const primaryLink = String(formData.get('primary_link') || '').trim();
    const linkField = primaryLink && /(?:twitter\.com|x\.com)\//i.test(primaryLink) ? 'x_link' : 'website';
    const newProject = {
      name: String(formData.get('name') || '').trim(),
      category: String(formData.get('category') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      status: 'Not Started',
      ...(primaryLink ? { [linkField]: primaryLink } : {}),
    };

    setProcessingKey(key);
    setNotice(null);

    try {
      const { error: insertError } = await supabase.from('projects').insert([newProject]);
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('pending_projects_review')
        .update({ status: 'approved' })
        .eq('id', projectModal.id);
      if (updateError) throw updateError;

      setProjectsQueue((current) => current.filter((item) => item.id !== projectModal.id));
      setProjectModal(null);
      setNotice({ type: 'success', text: `Project "${newProject.name}" created successfully.` });
    } catch (error) {
      setNotice({ type: 'error', text: `Failed to create project: ${error.message}` });
    } finally {
      setProcessingKey(null);
    }
  };

  const submitTask = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const key = `pending_tasks_review:${taskModal.id}`;
    const newTask = {
      project_id: taskModal.project_id,
      name: String(formData.get('name') || '').trim(),
      link: String(formData.get('link') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      status: 'Pending',
    };

    setProcessingKey(key);
    setNotice(null);

    try {
      const { error: insertError } = await supabase.from('tasks').insert([newTask]);
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('pending_tasks_review')
        .update({ status: 'approved' })
        .eq('id', taskModal.id);
      if (updateError) throw updateError;

      setTasksQueue((current) => current.filter((item) => item.id !== taskModal.id));
      setTaskModal(null);
      setNotice({ type: 'success', text: `Task "${newTask.name}" added successfully.` });
    } catch (error) {
      setNotice({ type: 'error', text: `Failed to add task: ${error.message}` });
    } finally {
      setProcessingKey(null);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleProjects = projectsQueue.filter((item) => !normalizedSearch || [item.suggested_name, item.category, item.summary, item.primary_link]
    .some((value) => String(value || '').toLowerCase().includes(normalizedSearch)));
  const visibleTasks = tasksQueue.filter((item) => !normalizedSearch || [item.project_name, item.task_name, item.description, item.link]
    .some((value) => String(value || '').toLowerCase().includes(normalizedSearch)));
  const visibleQueue = activeTab === 'projects' ? visibleProjects : visibleTasks;

  return (
    <div className="min-h-full bg-white text-slate-900">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase text-blue-600">
              <Target size={16} /> Telegram Intel Triage
            </div>
            <h1 className="text-2xl font-black text-slate-950">Research Daily Tasks</h1>
            <p className="mt-1 text-xs font-medium text-slate-500">Review and approve incoming Telegram intelligence.</p>
          </div>
          <button
            type="button"
            onClick={() => fetchQueues({ background: true })}
            disabled={loading || refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh feeds
          </button>
        </header>

        {notice && (
          <div className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-xs font-bold ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} className="rounded p-1 hover:bg-white" aria-label="Dismiss notice"><X size={14} /></button>
          </div>
        )}

        <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'projects', label: 'New Projects', count: projectsQueue.length },
              { id: 'tasks', label: 'Project Tasks', count: tasksQueue.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{tab.count}</span>
              </button>
            ))}
          </div>
          <label className="relative w-full sm:max-w-xs">
            <span className="sr-only">Search intelligence</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search intelligence" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-blue-500" />
          </label>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center text-sm font-bold text-slate-400">
            <RefreshCw size={18} className="mr-2 animate-spin" /> Loading intelligence feeds...
          </div>
        ) : visibleQueue.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
            <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={36} />
            <h2 className="text-base font-black text-slate-900">Inbox Zero</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">No matching {activeTab === 'projects' ? 'project' : 'task'} intelligence is pending.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeTab === 'projects'
              ? visibleProjects.map((item) => {
                  const processing = processingKey === `pending_projects_review:${item.id}`;
                  return (
                    <article key={item.id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <h2 className="break-words text-sm font-black text-slate-950">{item.suggested_name || 'Unnamed project'}</h2>
                          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{item.category || 'Uncategorized'}</span>
                        </div>
                        <p className="text-xs leading-5 text-slate-600">{item.summary || 'No summary provided.'}</p>
                        {item.primary_link && <a href={item.primary_link} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-1 break-all text-[10px] font-bold text-blue-600 hover:underline"><ExternalLink size={12} className="shrink-0" /> {item.primary_link}</a>}
                      </div>
                      <div className="flex gap-2 border-t border-slate-100 pt-3">
                        <button type="button" onClick={() => setProjectModal(item)} disabled={processing} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Plus size={14} /> Add Project</button>
                        <button type="button" onClick={() => handleReject('pending_projects_review', item.id)} disabled={processing} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60" aria-label={`Reject ${item.suggested_name || 'project'}`}><Trash2 size={14} /></button>
                      </div>
                    </article>
                  );
                })
              : visibleTasks.map((item) => {
                  const processing = processingKey === `pending_tasks_review:${item.id}`;
                  return (
                    <article key={item.id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <h2 className="break-words text-sm font-black text-slate-950">{item.task_name || 'Unnamed task'}</h2>
                          <span className="shrink-0 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{item.project_name || 'Unknown project'}</span>
                        </div>
                        <p className="text-xs leading-5 text-slate-600">{item.description || 'No description provided.'}</p>
                        {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-1 break-all text-[10px] font-bold text-blue-600 hover:underline"><ExternalLink size={12} className="shrink-0" /> {item.link}</a>}
                      </div>
                      <div className="flex gap-2 border-t border-slate-100 pt-3">
                        <button type="button" onClick={() => setTaskModal(item)} disabled={processing} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Plus size={14} /> Add Task</button>
                        <button type="button" onClick={() => handleReject('pending_tasks_review', item.id)} disabled={processing} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60" aria-label={`Reject ${item.task_name || 'task'}`}><Trash2 size={14} /></button>
                      </div>
                    </article>
                  );
                })}
          </div>
        )}
      </div>

      {projectModal && (
        <ModalShell title="Create Project" subtitle="Review the Telegram discovery before adding it to the projects database." onClose={() => setProjectModal(null)}>
          <form onSubmit={submitProject} className="space-y-4 p-5">
            <div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Project Name</label><input required name="name" defaultValue={projectModal.suggested_name || ''} className={inputClassName} /></div>
            <div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Category</label><input name="category" defaultValue={projectModal.category || ''} className={inputClassName} /></div>
            <div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">X / Website Link</label><input type="url" name="primary_link" defaultValue={projectModal.primary_link || ''} className={inputClassName} /></div>
            <div><label className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-slate-500"><FileText size={12} /> Description / Summary</label><textarea required name="description" rows={4} defaultValue={projectModal.summary || ''} className={`${inputClassName} resize-y`} /></div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setProjectModal(null)} className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={processingKey === `pending_projects_review:${projectModal.id}`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Plus size={14} /> {processingKey === `pending_projects_review:${projectModal.id}` ? 'Saving...' : 'Save Project'}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {taskModal && (
        <ModalShell title="Add Task" subtitle={`Add this task to ${taskModal.project_name || 'the selected project'}.`} onClose={() => setTaskModal(null)}>
          <form onSubmit={submitTask} className="space-y-4 p-5">
            <div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Project ID</label><input value={taskModal.project_id || ''} readOnly className={`${inputClassName} bg-slate-50 text-slate-500`} /></div>
            <div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Task Name</label><input required name="name" defaultValue={taskModal.task_name || ''} className={inputClassName} /></div>
            <div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Task Link</label><input type="url" name="link" defaultValue={taskModal.link || ''} className={inputClassName} /></div>
            <div><label className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-slate-500"><FileText size={12} /> Description</label><textarea required name="description" rows={4} defaultValue={taskModal.description || ''} className={`${inputClassName} resize-y`} /></div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setTaskModal(null)} className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={!taskModal.project_id || processingKey === `pending_tasks_review:${taskModal.id}`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"><Plus size={14} /> {processingKey === `pending_tasks_review:${taskModal.id}` ? 'Saving...' : 'Save Task'}</button>
            </div>
            {!taskModal.project_id && <p className="text-xs font-semibold text-rose-600">This review row has no project_id. Link it to a project before approval.</p>}
          </form>
        </ModalShell>
      )}
    </div>
  );
}