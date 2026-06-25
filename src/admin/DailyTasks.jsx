import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit2, Trash2, Save, X, Loader2, ExternalLink, Calendar, Clock, Star } from 'lucide-react';

export default function DailyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    task_name: '',
    task_type: 'social',
    xp_reward: 50,
    description: '',
    target_url: '',
    requires_proof: true,
    is_promoted: false,
    bonus_xp: 0,
    is_recurring: false,
    cooldown_hours: 24,
    start_date: '',
    end_date: '',
    is_active: true
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

  const handleAddTask = async () => {
    try {
      const sanitizedPayload = {
        id: generateSlug(newTask.task_name),
        title: newTask.task_name,
        task_type: newTask.task_type,
        xp_reward: Number(newTask.xp_reward) || 0,
        description: newTask.description,
        target_url: newTask.target_url || null,
        requires_proof: Boolean(newTask.requires_proof),
        is_promoted: Boolean(newTask.is_promoted),
        bonus_xp: Number(newTask.bonus_xp) || 0,
        is_recurring: Boolean(newTask.is_recurring),
        cooldown_hours: Number(newTask.cooldown_hours) || 0,
        start_date: newTask.start_date || null,
        end_date: newTask.end_date || null,
        is_active: Boolean(newTask.is_active)
      };

      const { error } = await supabase
        .from('platform_tasks')
        .insert(sanitizedPayload);

      if (error) throw error;

      setShowAddForm(false);
      setNewTask({
        task_name: '',
        task_type: 'social',
        xp_reward: 50,
        description: '',
        target_url: '',
        requires_proof: true,
        is_promoted: false,
        bonus_xp: 0,
        is_recurring: false,
        cooldown_hours: 24,
        start_date: '',
        end_date: '',
        is_active: true
      });
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const { error } = await supabase
        .from('platform_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('platform_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
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
                Platform Tasks
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Manage quest tasks and XP rewards
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Add New Task</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            
            {/* Section: Basic Info */}
            <div className="mb-6">
              <div className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4">Basic Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={newTask.task_name}
                    onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="e.g., Follow on X"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                    Task Type
                  </label>
                  <select
                    value={newTask.task_type}
                    onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="social">Social</option>
                    <option value="onchain">On-Chain</option>
                    <option value="sponsored">Sponsored</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                    rows="2"
                    placeholder="Task description..."
                  />
                </div>
              </div>
            </div>

            {/* Section: Rewards & Links */}
            <div className="mb-6">
              <div className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4">Rewards & Links</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                    XP Reward
                  </label>
                  <input
                    type="number"
                    value={newTask.xp_reward}
                    onChange={(e) => setNewTask({ ...newTask, xp_reward: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                    Target URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newTask.target_url}
                    onChange={(e) => setNewTask({ ...newTask, target_url: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="https://x.com/..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="requiresProof"
                    checked={newTask.requires_proof}
                    onChange={(e) => setNewTask({ ...newTask, requires_proof: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor="requiresProof" className="text-sm font-medium text-slate-700">
                    Requires Proof URL
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPromoted"
                    checked={newTask.is_promoted}
                    onChange={(e) => setNewTask({ ...newTask, is_promoted: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor="isPromoted" className="text-sm font-medium text-slate-700">
                    Promoted Task
                  </label>
                </div>

                {newTask.is_promoted && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                      Bonus XP
                    </label>
                    <input
                      type="number"
                      value={newTask.bonus_xp}
                      onChange={(e) => setNewTask({ ...newTask, bonus_xp: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="25"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section: Timing */}
            <div className="mb-6">
              <div className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4">Timing & Recurrence</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newTask.start_date}
                    onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newTask.end_date}
                    onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={newTask.is_recurring}
                    onChange={(e) => setNewTask({ ...newTask, is_recurring: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700">
                    Recurring Task
                  </label>
                </div>

                {newTask.is_recurring && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                      Cooldown (Hours)
                    </label>
                    <input
                      type="number"
                      value={newTask.cooldown_hours}
                      onChange={(e) => setNewTask({ ...newTask, cooldown_hours: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="24"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section: Status */}
            <div className="mb-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newTask.is_active}
                  onChange={(e) => setNewTask({ ...newTask, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  Active
                </label>
              </div>
            </div>
            
            <button
              onClick={handleAddTask}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-all"
            >
              <Save className="w-4 h-4" />
              Save Task
            </button>
          </div>
        )}

        {/* Tasks Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              <span className="ml-3 text-sm font-medium text-slate-500">Loading tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm font-medium text-slate-500">No tasks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Task Name
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      URL
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Proof
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Timeline
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      XP Reward
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-sm font-bold text-slate-900">{task.task_name}</span>
                          <p className="text-xs font-medium text-slate-500 mt-1">{task.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg capitalize">
                          {task.task_type}
                        </span>
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
                            <span className="max-w-[100px] truncate">{task.target_url}</span>
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
                        <div className="flex flex-col gap-1">
                          {task.is_promoted && (
                            <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                              <Star className="w-3 h-3 fill-amber-500" />
                              <span>Promoted (+{task.bonus_xp} XP)</span>
                            </div>
                          )}
                          {task.is_recurring && (
                            <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                              <Clock className="w-3 h-3" />
                              <span>Recurring ({task.cooldown_hours}h)</span>
                            </div>
                          )}
                          {!task.is_promoted && !task.is_recurring && (
                            <span className="text-xs font-medium text-slate-400">Standard</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-600">
                          {task.start_date && task.end_date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(task.start_date).toLocaleDateString()} - {new Date(task.end_date).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Ongoing</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">+{task.xp_reward} XP</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-lg ${
                          task.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {task.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingTask(task.id)}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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