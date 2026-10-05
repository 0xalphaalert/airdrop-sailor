import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, ToggleLeft, ToggleRight, Loader2, Save, ExternalLink, Calendar, Edit2 } from 'lucide-react';

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    xp_reward: 50,
    target_url: '',
    requires_proof: true,
    is_promoted: false,
    bonus_xp: 0,
    is_recurring: false,
    cooldown_hours: 24,
    start_date: '',
    end_date: ''
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  };

  const handleEditTask = (task) => {
    setFormData({
      title: task.title || task.name || '',
      xp_reward: task.xp_reward || 50,
      target_url: task.target_url || '',
      requires_proof: task.requires_proof || false,
      is_promoted: task.is_promoted || false,
      bonus_xp: task.bonus_xp || 0,
      is_recurring: task.is_recurring || false,
      cooldown_hours: task.cooldown_hours || 24,
      start_date: task.start_date && typeof task.start_date === 'string' ? task.start_date.slice(0, 16) : '',
      end_date: task.end_date && typeof task.end_date === 'string' ? task.end_date.slice(0, 16) : ''
    });
    setEditingTaskId(task.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateTask = async () => {
    setSaving(true);
    try {
      const taskId = generateSlug(formData.title);

      const payload = {
        title: formData.title,
        name: formData.title,
        xp_reward: formData.xp_reward,
        target_url: formData.target_url || null,
        requires_proof: formData.requires_proof,
        is_promoted: formData.is_promoted,
        bonus_xp: formData.is_promoted ? formData.bonus_xp : 0,
        is_recurring: formData.is_recurring,
        cooldown_hours: formData.is_recurring ? formData.cooldown_hours : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      const { error } = editingTaskId
        ? await supabase
          .from('platform_tasks')
          .update(payload)
          .eq('id', editingTaskId)
        : await supabase
          .from('platform_tasks')
          .insert({
            id: taskId,
            ...payload,
            is_active: true
          });

      if (error) throw error;

      // Reset form
      setFormData({
        title: '',
        xp_reward: 50,
        target_url: '',
        requires_proof: true,
        is_promoted: false,
        bonus_xp: 0,
        is_recurring: false,
        cooldown_hours: 24,
        start_date: '',
        end_date: ''
      });
      setEditingTaskId(null);
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      alert(`Failed to save task: ${error.message || error.details || error.hint || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (taskId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('platform_tasks')
        .update({ is_active: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task status:', error);
      alert('Failed to update task status. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                Platform Tasks & Quests
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Create and manage quests for the Points Arena
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) setEditingTaskId(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Close Form' : 'Create New Task'}
            </button>
          </div>
        </div>

        {/* Section 1: Create New Task Form */}
        {showForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-black text-slate-900 mb-6">{editingTaskId ? 'Edit Task' : 'Create New Task'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="e.g., Follow us on X"
                />
              </div>

              {/* XP Reward */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  XP Reward *
                </label>
                <input
                  type="number"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>

              {/* Target URL */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Target URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="https://twitter.com/..."
                />
              </div>

              {/* Requires Proof */}
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="requiresProof"
                  checked={formData.requires_proof}
                  onChange={(e) => setFormData({ ...formData, requires_proof: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300"
                />
                <label htmlFor="requiresProof" className="text-sm font-medium text-slate-700">
                  User must submit a proof URL
                </label>
              </div>

              {/* Is Promoted */}
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isPromoted"
                  checked={formData.is_promoted}
                  onChange={(e) => setFormData({ ...formData, is_promoted: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300"
                />
                <label htmlFor="isPromoted" className="text-sm font-medium text-slate-700">
                  Promoted Quest (Featured)
                </label>
              </div>

              {/* Bonus XP (conditional) */}
              {formData.is_promoted && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                    Bonus XP
                  </label>
                  <input
                    type="number"
                    value={formData.bonus_xp}
                    onChange={(e) => setFormData({ ...formData, bonus_xp: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="25"
                  />
                </div>
              )}

              {/* Is Recurring */}
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700">
                  Recurring Quest
                </label>
              </div>

              {/* Cooldown Hours (conditional) */}
              {formData.is_recurring && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                    Cooldown (Hours)
                  </label>
                  <input
                    type="number"
                    value={formData.cooldown_hours}
                    onChange={(e) => setFormData({ ...formData, cooldown_hours: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="24"
                  />
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <button
                onClick={handleCreateTask}
                disabled={saving || !formData.title}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {editingTaskId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingTaskId ? 'Update Task' : 'Create Task'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Active Tasks Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              <span className="ml-3 text-sm font-medium text-slate-500">Loading tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm font-medium text-slate-500">No tasks found. Create your first task!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Task Title
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Reward
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Target URL
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Proof Required
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Dates
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-sm font-bold text-slate-900">{task.title || task.name || 'Untitled Task'}</span>
                          {task.is_promoted && (
                            <span className="ml-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">
                              Promoted
                            </span>
                          )}
                          {task.is_recurring && (
                            <span className="ml-2 inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
                              Recurring
                            </span>
                          )}
                        </div>
                        {task.bonus_xp > 0 && (
                          <p className="text-xs font-medium text-slate-500 mt-1">+{task.bonus_xp} bonus XP</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">+{task.xp_reward} XP</span>
                      </td>
                      <td className="px-6 py-4">
                        {task.target_url ? (
                          <a
                            href={task.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="max-w-[150px] truncate">{task.target_url}</span>
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-lg ${
                          task.requires_proof
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {task.requires_proof ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-600">
                          {task.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Start: {new Date(task.start_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {task.end_date && (
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>End: {new Date(task.end_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {!task.start_date && !task.end_date && (
                            <span className="text-slate-400">No dates set</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(task.id, task.is_active)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                              task.is_active
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {task.is_active ? (
                              <>
                                <ToggleRight className="w-4 h-4" />
                                Active
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4" />
                                Inactive
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
