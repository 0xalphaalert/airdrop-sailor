import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function AdminDashboard() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [activeTab, setActiveTab] = useState('add-project');

  // --- BOUNCER / ADMIN CHECK ---
  const adminWallet = import.meta.env.VITE_ADMIN_WALLET?.toLowerCase();
  const userWallet = user?.wallet?.address?.toLowerCase();

  // --- States for Management & Editing ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingX, setIsFetchingX] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    x_link: '',             
    tier: 'Tier 3',         
    status: 'Waitlist',         
    airdrop_status: 'Possible', 
    description: '',
    galxe_alias: '',   
    zealy_subdomain: '',    
    funding: '',            
    lead_investors: ''      
  });

  // --- Task States ---
  const [editingTask, setEditingTask] = useState(null);
  const [tasksList, setTasksList] = useState([]);
  const [selectedProjectForFilter, setSelectedProjectForFilter] = useState('');
  
  // 🎯 NEW: The Flip Switch State
  const [entryType, setEntryType] = useState('task'); // 'task' or 'article'
  
  const [taskFormData, setTaskFormData] = useState({
    project_id: '', name: '', description: '', link: '', recurring: 'One-time',
    cost: '0', time_minutes: 0, end_date: '', status: 'Active',
    external_link: '',      
    tutorial_markdown: '',
    rpc_url: '',            // 🚀 NEW
    contract_address: ''    // 🚀 NEW
  });
  
  // --- Research Queue States ---
  const [researchTasks, setResearchTasks] = useState([]);

  // ==================================================
  // 📡 NEW: ALPHA STREAM / MASTER INTEL QUEUE STATES
  // ==================================================
  const [alphaFilter, setAlphaFilter] = useState('telegram');
  const [alphaProjectFilter, setAlphaProjectFilter] = useState('all');
  const [alphaData, setAlphaData] = useState([]);
  const [isAlphaLoading, setIsAlphaLoading] = useState(false);

  // Load projects immediately so the dropdowns in the Task section actually work
  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (data) setAllProjects(data);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      name: '', logo_url: '', x_link: '', tier: 'Tier 3', 
      status: 'Waitlist', airdrop_status: 'Possible', 
      description: '', galxe_alias: '', zealy_subdomain: '', funding: '', lead_investors: ''
    });
  };

  // ✅ FIXED: Added the missing resetTaskForm function
  const resetTaskForm = () => {
    setEditingTask(null);
    setTaskFormData({
      project_id: '', name: '', description: '', link: '', recurring: 'One-time',
      cost: '0', time_minutes: 0, end_date: '', status: 'Active',
      external_link: '', tutorial_markdown: '',
      rpc_url: '', contract_address: '' // 🚀 NEW
    });
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure? This will remove the project for ALL users.")) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) fetchAllProjects();
  };

  const handleAutoFillX = async () => {
    if (!formData.x_link || (!formData.x_link.includes('x.com') && !formData.x_link.includes('twitter.com'))) {
      alert("Please paste a valid X or Twitter URL first!");
      return;
    }
    setIsFetchingX(true);
    try {
      const urlObj = new URL(formData.x_link);
      const handle = urlObj.pathname.split('/')[1];
      const logoHackUrl = `https://unavatar.io/twitter/${handle}`;
      
      // 1. Fetch X Profile Data
      const res = await fetch(`https://api.microlink.io?url=${formData.x_link}`);
      const data = await res.json();
      let cleanName = data.data?.title?.split(' (@')[0] || handle;

      // 2. Cross-reference with Fundraising (Cleaned up columns!)
      const { data: fundData, error: fundError } = await supabase
        .from('funding_opportunities')
        .select('funding_amount, lead_investor') // Removed 'amount'
        .ilike('project_name', `%${cleanName}%`) 
        .maybeSingle();

      if (fundError) console.warn("Funding lookup failed:", fundError.message);

      const foundFunding = fundData?.funding_amount || '';
      const foundInvestors = fundData?.lead_investor || '';

      // 3. Auto-fill the form
      setFormData(prev => ({
        ...prev,
        name: cleanName,
        logo_url: logoHackUrl,
        description: data.data?.description || prev.description,
        funding: foundFunding || prev.funding,
        lead_investors: foundInvestors || prev.lead_investors
      }));
      
    } catch (error) {
      console.error("AutoFill Error:", error);
      alert("X bio fetch blocked, but logo extracted!");
    } finally { setIsFetchingX(false); }
  };

  const handleDeployProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        logo_url: formData.logo_url,
        x_link: formData.x_link,
        tier: formData.tier,
        status: formData.status,
        airdrop_status: formData.airdrop_status,
        description: formData.description,
        galxe_alias: formData.galxe_alias || null,
        zealy_subdomain: formData.zealy_subdomain || null,
        funding: formData.funding || null,
        lead_investors: formData.lead_investors || null,
        is_public: true 
      };

      let result;
      if (editingProject) {
        result = await supabase.from('projects').update(payload).eq('id', editingProject.id);
      } else {
        result = await supabase.from('projects').insert([payload]);
      }

      if (result.error) throw result.error;

      alert(editingProject ? "Project Updated! 🔄" : "Project Deployed! 🚀");
      resetForm();
      setActiveTab('manage-tasks'); 
    } catch (error) {
      alert(`Deployment Failed: ${error.message}`);
    } finally { setIsSubmitting(false); }
  };

  const fetchTasksForProject = async (projectId) => {
    const { data } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (data) setTasksList(data);
  };
  
  useEffect(() => {
    if (activeTab === 'research') {
      fetchResearchTasks();
    }
    // FETCH NEW ALPHA STREAM WHEN TAB IS ACTIVE
    if (activeTab === 'alpha-stream') {
      fetchAlphaStream();
    }
  }, [activeTab, alphaFilter, alphaProjectFilter]);

  const fetchResearchTasks = async () => {
    const { data } = await supabase
      .from('bounty_radar')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setResearchTasks(data);
  };

  // ==================================================
  // 📡 ALPHA STREAM LOGIC (PORTED FROM INDEX.HTML)
  // ==================================================
  const fetchAlphaStream = async () => {
    setIsAlphaLoading(true);
    try {
      if (['telegram', 'tweets', 'galxe'].includes(alphaFilter)) {
        const platformMap = { 'telegram': 'Telegram', 'tweets': 'Twitter', 'galxe': 'Galxe' };
        
        let { data, error } = await supabase
          .from('master_intel_queue')
          .select('*')
          .eq('status', 'Pending')
          .eq('source_platform', platformMap[alphaFilter])
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        let filtered = data || [];
        if (alphaProjectFilter !== 'all') {
          filtered = filtered.filter(d => (d.project_name || '').toLowerCase() === alphaProjectFilter.toLowerCase());
        }
        setAlphaData(filtered);
      } else {
        // Zealy / Bounty Radar
        const { data, error } = await supabase
          .from('bounty_radar')
          .select('*')
          .eq('status', 'Pending')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        const platformMatch = alphaFilter === 'zealy' ? 'Zealy' : 'TG Bounty';
        let filtered = (data || []).filter(b => (b.platform_name || '').includes(platformMatch));
        
        if (alphaProjectFilter !== 'all') {
          filtered = filtered.filter(d => {
            const pName = d.project_name || d.task_name || '';
            return pName.toLowerCase().includes(alphaProjectFilter.toLowerCase());
          });
        }
        setAlphaData(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAlphaLoading(false);
    }
  };

  const processAlphaItem = async (id, newStatus, isBounty = false) => {
    // Optimistic UI Removal
    setAlphaData(prev => prev.filter(item => item.id !== id));
    
    // DB Update
    const table = isBounty ? 'bounty_radar' : 'master_intel_queue';
    await supabase.from(table).update({ status: newStatus }).eq('id', id);
  };

  const formatTweetContent = (text) => {
    if (!text) return 'No content';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => 
      urlRegex.test(part) ? <a key={i} href={part} target="_blank" rel="noreferrer" className="text-sky-500 underline break-all hover:text-sky-400">{part}</a> : part
    );
  };
  // ==================================================

  const toggleTaskVisibility = async (id, currentStatus) => {
    setResearchTasks(prev => prev.map(t => t.id === id ? { ...t, visible_to_users: !currentStatus } : t));
    const { error } = await supabase
      .from('bounty_radar')
      .update({ visible_to_users: !currentStatus })
      .eq('id', id);
      
    if (error) {
      console.error("Supabase Update Error:", error);
      alert(`Failed to update status: ${error.message}`); 
      fetchResearchTasks(); 
    }
  };

  const handleDeployTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { 
        ...taskFormData,
        external_link: taskFormData.external_link || null,
        tutorial_markdown: taskFormData.tutorial_markdown || null
      };
      let result;
      if (editingTask) {
        result = await supabase.from('tasks').update(payload).eq('id', editingTask.id);
      } else {
        result = await supabase.from('tasks').insert([payload]);
      }
      if (result.error) throw result.error;
      alert(editingTask ? "Task Updated! 🔄" : "Task Deployed! 🚀");
      setEditingTask(null);
      setTaskFormData({ project_id: '', name: '', description: '', link: '', recurring: 'One-time', cost: '0', time_minutes: 0, end_date: '', status: 'Active' });
      if (taskFormData.project_id) fetchTasksForProject(taskFormData.project_id);
    } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error && selectedProjectForFilter) {
      fetchTasksForProject(selectedProjectForFilter);
    }
  };

  if (!ready) return <div className="min-h-screen bg-gray-950 flex items-center justify-center font-bold text-gray-500">Verifying Clearance...</div>;
  if (ready && !authenticated) return <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4"><button onClick={login} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">Admin Login</button></div>;
  if (ready && authenticated && userWallet !== adminWallet) return <div className="text-white text-center mt-20 font-black uppercase tracking-widest text-red-500">Access Denied</div>;

  const NavItem = ({ id, label, icon }) => (
    <button 
      onClick={() => { setActiveTab(id); if(id !== 'add-project') resetForm(); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[13px] transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
      <span className="text-lg">{icon}</span> {label}
    </button>
  );

  return (
    <div className="w-full bg-gray-950 min-h-screen flex flex-col md:flex-row font-sans text-white">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-[260px] bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 min-h-screen">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3 font-black uppercase text-[14px]">👑 God Mode</div>
        <div className="p-4 flex flex-col gap-1 flex-1 mt-4">
          <NavItem id="add-project" label={editingProject ? "Editing Mode" : "Add Project"} icon="➕" />
          <NavItem id="manage-tasks" label="Manage Projects" icon="📝" />
          
          <p className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest mt-6 mb-2">Tasks</p>
          <NavItem id="add-task" label={editingTask ? "Editing Task" : "Add Task"} icon="⚡" />
          <NavItem id="manage-tasks-list" label="Manage Tasks" icon="📝" />
          <NavItem id="research" label="Research Queue" icon="🔬" />
          
          {/* 🚀 NEW: Alpha Stream Tab */}
          <NavItem id="alpha-stream" label="Alpha Stream" icon="📡" />
        </div>
        <div className="p-6 border-t border-gray-800"><Link to="/" className="w-full block text-center py-2 bg-gray-800 text-gray-300 text-[11px] font-black uppercase rounded-lg">Exit Admin</Link></div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* ADD / EDIT FORM */}
        {activeTab === 'add-project' && (
          <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-[24px] font-black tracking-tighter">{editingProject ? "Edit Project" : "Deploy New Project"}</h2>
                    <p className="text-[13px] text-gray-400">{editingProject ? `Updating ${editingProject.name}` : "Add a new opportunity to the database."}</p>
                </div>
                {editingProject && (
                    <button onClick={resetForm} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest border border-red-500/20">Cancel Edit</button>
                )}
            </div>
            
            <form onSubmit={handleDeployProject} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-sm">
              <div className="mb-6 bg-gray-950 p-6 rounded-xl border border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Amount Raised</label>
                  <input type="text" name="funding" value={formData.funding} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-3" /></div>
                  <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Lead Investor(s)</label>
                  <input type="text" name="lead_investors" value={formData.lead_investors} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-3" /></div>
                </div>
              </div>

              <div className="mb-6 flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Twitter / X URL</label>
                  <input type="text" name="x_link" value={formData.x_link} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3" />
                </div>
                <button type="button" onClick={handleAutoFillX} className="bg-gray-800 px-6 py-3 rounded-lg text-[12px] font-black uppercase h-[46px]">Scan X ⚡</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Name</label>
                <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3" /></div>
                
                <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Logo URL</label>
                <input required name="logo_url" value={formData.logo_url} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3" /></div>
                
                <div><label className="text-[11px] font-black text-blue-400 uppercase block mb-2">Galxe Alias</label>
                <input name="galxe_alias" value={formData.galxe_alias} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3" /></div>
                
                <div><label className="text-[11px] font-black text-orange-400 uppercase block mb-2">Zealy Subdomain</label>
                <input name="zealy_subdomain" value={formData.zealy_subdomain} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3" /></div>
                
                <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Tier</label>
                <select name="tier" value={formData.tier} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3"><option value="Tier 1">Tier 1</option><option value="Tier 2">Tier 2</option><option value="Tier 3">Tier 3</option></select></div>
                
                <div>
                  <label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Project Phase</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500">
                    <option value="Waitlist">Waitlist</option>
                    <option value="Testnet">Testnet</option>
                    <option value="Mainnet">Mainnet</option>
                    <option value="Point Farming">Point Farming</option>
                    <option value="TGE">TGE</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Airdrop Status</label>
                  <select name="airdrop_status" value={formData.airdrop_status} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500">
                    <option value="Confirmed">Confirmed</option>
                    <option value="Possible">Possible</option>
                    <option value="Unconfirmed">Unconfirmed</option>
                  </select>
                </div>
              </div>

              <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 mb-8 resize-none"></textarea>

              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-500">
                {editingProject ? 'Save Changes 🔄' : 'Deploy Project 🚀'}
              </button>
            </form>
          </div>
        )}

        {/* ADD / EDIT TASK OR ARTICLE */}
        {activeTab === 'add-task' && (
          <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[24px] font-black tracking-tighter">{editingTask ? "Edit Entry" : "Deploy New Entry"}</h2>
                {editingTask && <button onClick={resetTaskForm} className="text-red-500 text-[11px] font-black uppercase border border-red-500/20 px-3 py-1 rounded-md">Cancel Edit</button>}
            </div>

            <div className="flex bg-gray-900 p-1 rounded-lg w-fit mb-8 border border-gray-800 shadow-inner">
              <button type="button" onClick={() => setEntryType('task')} className={`px-6 py-2.5 rounded-md text-[11px] font-black uppercase transition-all ${entryType === 'task' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Standard Task</button>
              <button type="button" onClick={() => setEntryType('article')} className={`px-6 py-2.5 rounded-md text-[11px] font-black uppercase transition-all ${entryType === 'article' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-gray-500 hover:text-white'}`}>Article / Guide</button>
            </div>

            <form onSubmit={handleDeployTask} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-sm">
                
                <div className="mb-6 bg-gray-950 p-4 rounded-xl border border-gray-800">
                    <label className="text-[11px] font-black text-blue-500 uppercase block mb-2">Target Project</label>
                    <select required value={taskFormData.project_id} onChange={(e) => setTaskFormData({...taskFormData, project_id: e.target.value})} className="w-full bg-gray-900 border border-gray-800 text-white font-bold rounded-lg px-4 py-3 outline-none focus:border-blue-500">
                        <option value="">-- Choose Project --</option>
                        {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {entryType === 'task' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Task Name</label>
                            <input required value={taskFormData.name} onChange={(e) => setTaskFormData({...taskFormData, name: e.target.value})} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none" /></div>
                            
                            <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Recurring</label>
                            <select value={taskFormData.recurring} onChange={(e) => setTaskFormData({...taskFormData, recurring: e.target.value})} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3">
                                <option value="One-time">One-time</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option>
                            </select></div>
                            
                            <div className="col-span-2"><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Task Link</label>
                            <input value={taskFormData.link} onChange={(e) => setTaskFormData({...taskFormData, link: e.target.value})} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none" /></div>
                            
                            <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Cost ($)</label>
                            <input value={taskFormData.cost} onChange={(e) => setTaskFormData({...taskFormData, cost: e.target.value})} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none" /></div>
                            
                            <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Time (Minutes)</label>
                            <input type="number" value={taskFormData.time_minutes} onChange={(e) => setTaskFormData({...taskFormData, time_minutes: e.target.value})} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none" /></div>
                            
                            <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">End Date</label>
                            <input type="date" value={taskFormData.end_date} onChange={(e) => setTaskFormData({...taskFormData, end_date: e.target.value})} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3" /></div>
                        </div>

                       <div>
                            <label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Task Description</label>
                            <textarea value={taskFormData.description} onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})} rows="3" className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 resize-none focus:border-blue-500 outline-none"></textarea>
                        </div>

                        {/* 🚀 WEB3 ON-CHAIN TRACKING SECTION */}
                        <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🔗</span>
                            <h3 className="text-[12px] font-black text-blue-400 uppercase tracking-widest">On-Chain Verification (Optional)</h3>
                          </div>
                          <p className="text-[11px] text-gray-500 mb-6 font-bold">Leave these blank if this is a manual off-chain task (like Twitter/Discord).</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Network RPC URL</label>
                              <input 
                                type="text" 
                                value={taskFormData.rpc_url || ''}
                                onChange={(e) => setTaskFormData({...taskFormData, rpc_url: e.target.value})}
                                placeholder="e.g., https://testnet-rpc.monad.xyz" 
                                className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Target Smart Contract</label>
                              <input 
                                type="text" 
                                value={taskFormData.contract_address || ''}
                                onChange={(e) => setTaskFormData({...taskFormData, contract_address: e.target.value})}
                                placeholder="e.g., 0x1234...abcd" 
                                className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>

                    </div>
                )}

                {entryType === 'article' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Article Title</label>
                            <input required value={taskFormData.name} onChange={(e) => setTaskFormData({...taskFormData, name: e.target.value})} placeholder="e.g. How to run a node..." className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none" /></div>
                            
                            <div><label className="text-[11px] font-black text-blue-400 uppercase block mb-2">Cover Image URL</label>
                            <input value={taskFormData.external_link} onChange={(e) => setTaskFormData({...taskFormData, external_link: e.target.value})} placeholder="https://..." className="w-full bg-gray-950 border border-blue-900/30 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none" /></div>
                        </div>

                        <div>
                            <label className="text-[11px] font-black text-gray-500 uppercase block mb-2 flex items-center justify-between">
                                <span>Article Content (Markdown Supported)</span>
                                <span className="text-gray-600">You can use **bold**, # headings, etc.</span>
                            </label>
                            <textarea required value={taskFormData.tutorial_markdown} onChange={(e) => setTaskFormData({...taskFormData, tutorial_markdown: e.target.value})} rows="8" placeholder="Write your guide here..." className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-4 resize-y focus:border-blue-500 outline-none font-mono text-[13px]"></textarea>
                        </div>
                    </div>
                )}

                <button type="submit" disabled={isSubmitting} className="w-full mt-8 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-colors">
                    {editingTask ? 'Save Changes 🔄' : (entryType === 'article' ? 'Publish Article 📝' : 'Deploy Task 🚀')}
                </button>
            </form>
          </div>
        )}

        {/* MANAGE TASKS LIST */}
        {activeTab === 'manage-tasks-list' && (
          <div className="max-w-6xl">
            <h2 className="text-[24px] font-black tracking-tighter mb-6">Task Control</h2>
            <div className="mb-8 bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <label className="text-[11px] font-black text-blue-500 uppercase block mb-2">Filter by Project</label>
                <select value={selectedProjectForFilter} onChange={(e) => { setSelectedProjectForFilter(e.target.value); fetchTasksForProject(e.target.value); }} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3">
                    <option value="">-- Select a Project --</option>
                    {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div className="space-y-3">
              {tasksList.map(t => (
                <div key={t.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center">
                  <div><h4 className="font-bold">{t.name}</h4><p className="text-[10px] text-gray-500 font-black uppercase">{t.recurring}</p></div>
                  <div className="flex gap-2">
                      <button onClick={() => { setTaskFormData(t); setEditingTask(t); setActiveTab('add-task'); }} className="px-4 py-2 bg-gray-800 hover:bg-blue-600 rounded-lg text-xs font-bold uppercase">Edit</button>
                      <button onClick={() => handleDeleteTask(t.id)} className="px-4 py-2 bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white text-xs font-bold uppercase rounded-lg">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVENTORY LIST */}
        {activeTab === 'manage-tasks' && (
          <div className="max-w-6xl">
            <h2 className="text-[24px] font-black tracking-tighter mb-6">Inventory Management</h2>
            <div className="grid grid-cols-1 gap-3">
              {allProjects.map(proj => (
                <div key={proj.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={proj.logo_url} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-white text-[15px]">{proj.name}</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-black">{proj.status} • {proj.tier}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setFormData(proj); setEditingProject(proj); setActiveTab('add-project'); }} className="px-4 py-2 bg-gray-800 hover:bg-blue-600 text-[11px] font-black uppercase rounded-lg">Edit</button>
                    <button onClick={() => handleDeleteProject(proj.id)} className="px-4 py-2 bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white text-[11px] font-black uppercase rounded-lg">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* RESEARCH QUEUE (APPROVALS) */}
        {activeTab === 'research' && (
          <div className="max-w-6xl">
            <h2 className="text-[24px] font-black tracking-tighter mb-2">Research Queue</h2>
            <p className="text-[13px] text-gray-400 mb-8">Review and approve automated tasks fetched by n8n.</p>
            
            <div className="space-y-3">
              {researchTasks.map(task => (
                <div key={task.id} className={`p-4 rounded-xl flex items-center justify-between border transition-all ${task.visible_to_users ? 'bg-blue-900/10 border-blue-900/30' : 'bg-gray-900 border-gray-800'}`}>
                  
                  <div className="flex items-center gap-4">
                      {task.logo_url && (
                          <img src={task.logo_url} alt="logo" className="w-10 h-10 rounded-lg object-cover border border-gray-800" />
                      )}
                      
                      <div>
                          <h4 className={`font-bold text-[15px] ${task.visible_to_users ? 'text-blue-400' : 'text-white'}`}>
                              {task.task_name || "Unnamed Task"}
                          </h4>
                          <div className="text-[10px] text-gray-500 font-black uppercase mt-1 tracking-widest flex items-center gap-2">
                            <span>{task.platform_name || 'Unknown Platform'}</span>
                            <span>•</span>
                            {task.task_link && (
                                <a href={task.task_link} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 underline transition-colors">
                                    View Task ↗
                                </a>
                            )}
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${task.visible_to_users ? 'text-blue-400' : 'text-gray-500'}`}>
                        {task.visible_to_users ? 'Live on Radar' : 'Hidden'}
                    </span>
                    
                    {/* Beautiful iOS-style Toggle Switch */}
                    <button 
                      type="button"
                      onClick={() => toggleTaskVisibility(task.id, task.visible_to_users)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${task.visible_to_users ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${task.visible_to_users ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              ))}
              
              {researchTasks.length === 0 && (
                  <div className="text-center py-12 text-gray-500 font-bold border border-dashed border-gray-800 rounded-2xl">
                      No automated tasks in the queue right now.
                  </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* 📡 NEW: ALPHA STREAM TAB (PORTED FROM INDEX.HTML) */}
        {/* ================================================== */}
        {activeTab === 'alpha-stream' && (
          <div className="max-w-6xl">
            <h2 className="text-[24px] font-black tracking-tighter mb-2">Alpha Stream <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded ml-2 uppercase tracking-widest font-black">Live</span></h2>
            <p className="text-[13px] text-gray-400 mb-6">Real-time intel from your automated scrapers, Telegram inbox, and n8n Twitter pipeline.</p>
            
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setAlphaFilter('telegram')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${alphaFilter === 'telegram' ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}>🕵️‍♂️ Telegram Intel</button>
                    <button onClick={() => setAlphaFilter('tweets')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${alphaFilter === 'tweets' ? 'bg-sky-900/30 text-sky-400 border border-sky-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}>🐦 Project Tweets</button>
                    <button onClick={() => setAlphaFilter('galxe')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${alphaFilter === 'galxe' ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}>🎯 Galxe Scout</button>
                    <button onClick={() => setAlphaFilter('zealy')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${alphaFilter === 'zealy' ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}>🦓 Zealy Scout</button>
                </div>
                
                <div className="flex items-center gap-4">
                    <select value={alphaProjectFilter} onChange={(e) => setAlphaProjectFilter(e.target.value)} className="bg-gray-950 border border-gray-800 text-white px-3 py-2 rounded-lg text-xs font-bold focus:border-blue-500 outline-none">
                        <option value="all">All Projects</option>
                        {allProjects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
                      <span className="text-orange-500 font-black text-sm">{alphaData.length}</span> Items Pending
                    </div>
                </div>
            </div>

            {/* Feed Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {isAlphaLoading ? (
                <div className="col-span-full py-10 flex items-center justify-center text-gray-500 font-bold">
                  📡 Fetching from Master Brain...
                </div>
              ) : alphaData.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500 font-bold border border-dashed border-gray-800 rounded-2xl">
                  Inbox Zero! No pending items for this filter.
                </div>
              ) : (
                alphaData.map(item => {
                  const isTweet = alphaFilter === 'tweets';
                  const isTelegram = alphaFilter === 'telegram';
                  const isBounty = ['galxe', 'zealy'].includes(alphaFilter);
                  
                  // Telegram specific logic
                  let linksHtml = [];
                  if (isTelegram) {
                    try {
                      linksHtml = typeof item.extracted_links === 'string' ? JSON.parse(item.extracted_links) : (item.extracted_links || []);
                    } catch(e) {}
                  }

                  // Bounty specific logic
const platformName = item.source_platform || item.platform_name || 'Bounty';
const isMasterQueue = item.source_platform !== undefined; 
const taskName = isMasterQueue ? item.project_name : item.task_name;
const taskDesc = isMasterQueue ? item.raw_content : item.task_description;

// 🚀 SAFELY parse the links to prevent white-screen crashes
let taskLink = '#';
if (isMasterQueue) {
  try {
    const parsed = typeof item.extracted_links === 'string' ? JSON.parse(item.extracted_links) : (item.extracted_links || []);
    taskLink = Array.isArray(parsed) ? parsed[0] : '#';
  } catch (e) {
    // If it's a raw string URL instead of a JSON array, use it safely
    taskLink = typeof item.extracted_links === 'string' && item.extracted_links.startsWith('http') ? item.extracted_links : '#';
  }
} else {
  taskLink = item.task_link;
}

                  if (isTelegram) {
                    return (
                      <div key={item.id} className="bg-gray-900 border-t-4 border-indigo-500 rounded-xl p-5 flex flex-col justify-between h-[280px]">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-indigo-900/30 text-indigo-400 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">{item.project_name || 'Unknown'}</span>
                                <span className="text-[9px] text-gray-500 font-mono">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[10px] text-indigo-500 font-bold uppercase mb-1">📍 AI Extracted</p>
                            <p className="text-xs text-gray-300 font-medium leading-relaxed mb-3 line-clamp-3">{item.ai_summary || item.raw_content}</p>
                            <div className="flex flex-col gap-1 overflow-hidden">
                              {linksHtml.length > 0 ? linksHtml.map((l, i) => (
                                <a key={i} href={l} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-400 truncate bg-indigo-900/20 px-2 py-1 inline-block rounded border border-indigo-500/20 hover:bg-indigo-900/40">🔗 {l}</a>
                              )) : <span className="text-[10px] text-gray-500 italic">No links extracted.</span>}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-4 border-t border-gray-800 mt-auto shrink-0">
                            <button onClick={() => processAlphaItem(item.id, 'Approved', false)} className="flex-1 bg-emerald-500/20 text-emerald-500 py-2 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition">✅ Approve</button>
                            <button onClick={() => processAlphaItem(item.id, 'Dismissed', false)} className="bg-gray-950 border border-gray-800 text-red-500 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/10 transition">🗑️</button>
                        </div>
                      </div>
                    );
                  }

                  if (isTweet) {
                    const buttonUrl = (item.intel_id && item.intel_id.startsWith('http')) ? item.intel_id : 'https://x.com';
                    return (
                      <div key={item.id} className="bg-gray-900 border-t-4 border-sky-400 rounded-xl p-5 flex flex-col justify-between h-[280px]">
                          <div>
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                      <span className="bg-sky-900/30 text-sky-400 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">@TWITTER</span>
                                      {item.project_name && <span className="text-[10px] font-bold text-gray-500 uppercase">{item.project_name}</span>}
                                  </div>
                                  <span className="text-[9px] text-gray-500 font-mono">{new Date(item.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-gray-300 font-medium leading-relaxed mb-3 overflow-y-auto max-h-[130px] pr-2 custom-scrollbar">
                                {formatTweetContent(item.raw_content || 'No content')}
                              </p>
                          </div>
                          
                          <div className="flex gap-3 pt-4 border-t border-gray-800 mt-auto shrink-0">
                              <a href={buttonUrl} target="_blank" rel="noreferrer" className="flex-1 bg-sky-600 text-white text-center py-2.5 rounded-lg text-xs font-bold hover:bg-sky-500 transition shadow-sm">Open post</a>
                              <button onClick={() => processAlphaItem(item.id, 'Dismissed', false)} className="px-4 bg-gray-950 border border-gray-800 text-gray-500 py-2.5 rounded-lg text-xs font-bold hover:text-red-500 hover:bg-red-500/10 transition">Dismiss</button>
                          </div>
                      </div>
                    );
                  }

                  if (isBounty) {
                    return (
                      <div key={item.id} className="bg-gray-900 border-t-4 border-[#ff6b35] rounded-xl p-5 flex flex-col h-[280px]">
                          <div className="flex gap-3 mb-3 shrink-0"><span className="bg-orange-900/30 text-orange-400 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">{platformName}</span></div>
                          <div className="flex-1 overflow-y-auto mb-3 custom-scrollbar"><h5 className="text-xs font-extrabold mb-1 text-white">{taskName}</h5><p className="text-[11px] text-gray-400">{taskDesc}</p></div>
                          <div className="flex gap-2 pt-3 border-t border-gray-800 shrink-0">
                              <button onClick={() => processAlphaItem(item.id, isMasterQueue ? 'Dismissed' : 'Ignored', !isMasterQueue)} className="flex-1 bg-gray-950 border border-gray-800 text-gray-500 py-2 rounded-lg text-[10px] font-bold hover:text-red-500 hover:bg-red-500/10 transition">Ignore</button>
                              <a href={taskLink} target="_blank" rel="noreferrer" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-[10px] font-bold text-center">Open</a>
                          </div>
                      </div>
                    );
                  }

                  return null;
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}