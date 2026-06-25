import React, { useState, useEffect } from 'react';
import { Search, Twitter, MessageSquare, Target, Filter, ArrowDownUp, Zap, ExternalLink, Activity, Trash2, PlusCircle, CheckSquare, X, Image as ImageIcon, Sparkles, List, Lightbulb } from 'lucide-react';
import { supabase } from '../supabaseClient'; 
import { scraperDb } from '../scraperClient'; 

export default function ProjectsResearch() {
  const [projects, setProjects] = useState([]);
  const [intelData, setIntelData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [columnSettings, setColumnSettings] = useState({});

  // --- Modal & Task States ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  
  // Article Editor States
  const [entryType, setEntryType] = useState('standard');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isAIEnhancing, setIsAIEnhancing] = useState(false);

  useEffect(() => {
    fetchResearchData();
  }, []);

  const fetchResearchData = async () => {
    setIsLoading(true);
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (projectError) throw projectError;
      setProjects(projectData || []);

      const [tweetsRes, discordRes, galxeRes] = await Promise.all([
        scraperDb.from('project_tweets').select('*').order('posted_at', { ascending: false }).limit(300),
        scraperDb.from('project_discord_announcements').select('*').order('posted_at', { ascending: false }).limit(300),
        scraperDb.from('keyword_galxe_quests').select('*').order('created_at', { ascending: false }).limit(300)
      ]);

      const normalizedIntel = [];

      if (tweetsRes.data) {
        tweetsRes.data.forEach(t => {
          normalizedIntel.push({
            id: `tweet-${t.id}`,
            project_name: t.project_name, 
            platform: 'twitter',
            score: Number(t.ai_score || 0), 
            content: t.content, 
            date: t.posted_at || t.created_at,
            link: t.tweet_id ? `https://twitter.com/i/web/status/${t.tweet_id}` : ''
          });
        });
      }

      if (discordRes.data) {
        discordRes.data.forEach(d => {
          normalizedIntel.push({
            id: `discord-${d.id}`,
            project_name: d.project_name,
            platform: 'discord',
            score: Number(d.ai_score || 0),
            content: d.content,
            date: d.posted_at || d.created_at,
            link: '' 
          });
        });
      }

      if (galxeRes.data) {
        galxeRes.data.forEach(g => {
          normalizedIntel.push({
            id: `galxe-${g.id}`,
            project_name: g.project_name || g.matched_keyword,
            platform: 'galxe',
            score: Number(g.ai_score || 0),
            content: `${g.title}\n\n${g.description || ''}`.trim(),
            date: g.created_at,
            link: g.campaign_id ? `https://app.galxe.com/quest/${g.campaign_id}` : ''
          });
        });
      }

      setIntelData(normalizedIntel);

      const initialSettings = {};
      (projectData || []).forEach(p => {
        initialSettings[p.name] = { platform: 'all', sort: 'desc' };
      });
      setColumnSettings(initialSettings);

    } catch (error) {
      console.error("Error fetching Kanban data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateColumnSetting = (projectName, key, value) => {
    setColumnSettings(prev => ({
      ...prev, [projectName]: { ...prev[projectName], [key]: value }
    }));
  };

  const cleanName = (name) => {
    if (!name) return '';
    return name.toLowerCase().replace(/[^a-z0-9]/g, ''); 
  };

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlatformColors = (platform) => {
    if (platform === 'twitter') return { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', icon: <Twitter size={14} /> };
    if (platform === 'discord') return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: <MessageSquare size={14} /> };
    if (platform === 'galxe') return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: <Target size={14} /> };
    return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: <Activity size={14} /> };
  };

  // --- DELETE INTEL ---
  const handleDeleteIntel = async (idStr, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm("Are you sure you want to delete this intelligence signal?")) return;
    
    const prefixIndex = idStr.indexOf('-');
    const prefix = idStr.substring(0, prefixIndex);
    const realId = idStr.substring(prefixIndex + 1);
    
    let table = '';
    if (prefix === 'tweet') table = 'project_tweets';
    else if (prefix === 'discord') table = 'project_discord_announcements';
    else if (prefix === 'galxe') table = 'keyword_galxe_quests';

    setIntelData(prev => prev.filter(item => item.id !== idStr));

    try {
      const { error } = await scraperDb.from(table).delete().eq('id', realId);
      if (error) throw error;
    } catch(err) {
      alert("Failed to delete from Scraper DB: " + err.message);
      fetchResearchData(); 
    }
  };

  // --- DRAFT TASK ---
  const handleOpenTaskModal = (intel, project) => {
    setEntryType('standard'); 
    
    // Auto-select and pre-fill all available data
    setTaskDraft({
      intel_id: intel.id,
      project_id: project.id,
      project_name: project.name,
      name: intel.content ? intel.content.substring(0, 40).replace(/\n/g, ' ') + '...' : 'New Task',
      link: intel.link || '',
      description: intel.content || '',
      cost: 0,
      time_minutes: 5,
      recurring: 'One-time',
      status: 'Active',
      end_date: '',
      rpc_url: '',
      contract_address: '',
      tutorial_markdown: intel.content || '', 
      external_link: ''
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setIsSubmittingTask(true);
    try {
      const payload = {
        project_id: taskDraft.project_id,
        name: taskDraft.name,
        link: taskDraft.link,
        description: taskDraft.description,
        cost: parseFloat(taskDraft.cost) || 0,
        time_minutes: parseInt(taskDraft.time_minutes) || 0,
        recurring: taskDraft.recurring,
        status: taskDraft.status,
        end_date: taskDraft.end_date || null,
        rpc_url: taskDraft.rpc_url || null,
        contract_address: taskDraft.contract_address || null,
        source: entryType === 'article' ? 'article' : 'standard',
        tutorial_markdown: entryType === 'article' ? taskDraft.tutorial_markdown : null,
        external_link: taskDraft.external_link || null
      };

      const { error } = await supabase.from('tasks').insert([payload]);
      if (error) throw error;
      
      // Silent Delete after successful save
      handleDeleteIntel(taskDraft.intel_id, true);
      
      setIsTaskModalOpen(false);
      setTaskDraft(null);
    } catch(err) {
      alert("Error creating task: " + err.message);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // --- ARTICLE EDITOR FUNCTIONS ---
  const insertAtCursor = (textToInsert) => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;
    
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentVal = taskDraft.tutorial_markdown || '';
    
    const newVal = currentVal.substring(0, startPos) + textToInsert + currentVal.substring(endPos);
    setTaskDraft({...taskDraft, tutorial_markdown: newVal});
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + textToInsert.length, startPos + textToInsert.length);
    }, 10);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImageUploading(true);
    
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const IMGBB_KEY = '1de173c5b97e6a61196a6f5153b93960'; 
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: uploadData });
      const data = await res.json();
      
      if (data.success) {
        insertAtCursor(`\n![Screenshot](${data.data.url})\n`);
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleAIEnhance = async () => {
    if (!taskDraft.tutorial_markdown) return alert("Write a rough draft first!");
    setIsAIEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-article', {
        body: { markdown: taskDraft.tutorial_markdown }
      });
      if (error) throw error;
      if (data?.enhanced_markdown) {
        setTaskDraft({...taskDraft, tutorial_markdown: data.enhanced_markdown});
      }
    } catch (err) {
      alert("AI enhancement failed: " + err.message);
    } finally {
      setIsAIEnhancing(false);
    }
  };

  const stats = {
    total: intelData.length,
    twitter: intelData.filter(i => i.platform === 'twitter').length,
    galxe: intelData.filter(i => i.platform === 'galxe').length,
    discord: intelData.filter(i => i.platform === 'discord').length,
  };

  return (
    <div className="max-w-full mx-auto h-[calc(100vh-40px)] flex flex-col overflow-hidden relative">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Research</h1>
          <p className="text-sm text-slate-500 mt-1">Deep dive into individual projects via AI-scored social intel.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search projects to view..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Intel</p>
             <h4 className="text-2xl font-black text-slate-800 mt-1">{stats.total}</h4>
           </div>
           <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center"><Activity size={20}/></div>
        </div>
        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest">X / Twitter Pending</p>
             <h4 className="text-2xl font-black text-sky-600 mt-1">{stats.twitter}</h4>
           </div>
           <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center"><Twitter size={20}/></div>
        </div>
        <div className="bg-white border border-orange-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Galxe Pending</p>
             <h4 className="text-2xl font-black text-orange-600 mt-1">{stats.galxe}</h4>
           </div>
           <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center"><Target size={20}/></div>
        </div>
        <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Discord Pending</p>
             <h4 className="text-2xl font-black text-indigo-600 mt-1">{stats.discord}</h4>
           </div>
           <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center"><MessageSquare size={20}/></div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto flex gap-6 pb-4 custom-scrollbar items-start">
        
        {isLoading ? (
          <div className="w-full flex items-center justify-center h-64 text-slate-500 font-bold">
            <Zap className="animate-pulse mr-2 text-blue-500" /> Syncing with Scraper Database...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="w-full flex items-center justify-center h-64 text-slate-500 font-bold bg-white border border-slate-200 border-dashed rounded-2xl">
            No projects match your search.
          </div>
        ) : (
          filteredProjects.map((project) => {
            const settings = columnSettings[project.name] || { platform: 'all', sort: 'desc' };
            const cleanProjectName = cleanName(project.name);
            
            let projectIntel = intelData.filter(intel => {
              const cleanIntelName = cleanName(intel.project_name);
              return cleanIntelName.includes(cleanProjectName) || cleanProjectName.includes(cleanIntelName);
            });
            
            if (settings.platform !== 'all') {
              projectIntel = projectIntel.filter(intel => intel.platform === settings.platform);
            }

            projectIntel.sort((a, b) => {
              return settings.sort === 'desc' ? b.score - a.score : a.score - b.score;
            });

            return (
              <div key={project.id} className="min-w-[360px] max-w-[360px] bg-slate-100/50 border border-slate-200 rounded-2xl p-4 flex flex-col h-full shadow-sm shrink-0">
                
                <div className="flex items-center gap-3 mb-4 shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative">
                   {project.logo_url ? (
                     <img src={project.logo_url} className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0" alt="logo" />
                   ) : (
                     <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0 border border-blue-100 font-black text-xl">
                       {project.name.charAt(0)}
                     </div>
                   )}
                   <div className="overflow-hidden flex-1">
                     <div className="flex items-center gap-2">
                       <h3 className="font-black text-slate-900 text-base truncate">{project.name}</h3>
                       {projectIntel.length > 0 && (
                         <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md text-[10px] font-black border border-red-200 shrink-0">
                           {projectIntel.length}
                         </span>
                       )}
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-1 inline-block
                        ${project.tier === 'Tier 1' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                          project.tier === 'Tier 2' ? 'bg-slate-200 text-slate-700 border border-slate-300' : 
                          'bg-orange-100 text-orange-800 border border-orange-200'}`}
                     >
                       {project.tier || 'No Tier'}
                     </span>
                   </div>
                </div>

                <div className="flex gap-2 mb-4 shrink-0">
                  <div className="relative flex-1">
                    <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                      value={settings.platform}
                      onChange={(e) => updateColumnSetting(project.name, 'platform', e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 focus:outline-none focus:border-blue-500 appearance-none"
                    >
                      <option value="all">All Sources</option>
                      <option value="twitter">Twitter / X</option>
                      <option value="discord">Discord</option>
                      <option value="galxe">Galxe</option>
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <ArrowDownUp size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                      value={settings.sort}
                      onChange={(e) => updateColumnSetting(project.name, 'sort', e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 focus:outline-none focus:border-blue-500 appearance-none"
                    >
                      <option value="desc">Score: High to Low</option>
                      <option value="asc">Score: Low to High</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 pb-2">
                   {projectIntel.length === 0 ? (
                     <div className="flex items-center justify-center h-32 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs text-center p-4">
                       Inbox Zero. No intelligence pending.
                     </div>
                   ) : (
                     projectIntel.map(intel => {
                       const styling = getPlatformColors(intel.platform);
                       const scoreColor = intel.score >= 80 ? 'text-emerald-600 bg-emerald-100 border-emerald-200' : 
                                          intel.score >= 50 ? 'text-amber-600 bg-amber-100 border-amber-200' : 
                                          'text-slate-600 bg-slate-100 border-slate-200';

                       return (
                         <div key={intel.id} className="p-4 rounded-xl border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow flex flex-col group">
                           
                           <div className="flex justify-between items-center mb-3">
                             <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${styling.bg} ${styling.border} ${styling.text}`}>
                               {styling.icon} {intel.platform}
                             </span>
                             <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wider border ${scoreColor}`}>
                               AI Score: {intel.score}
                             </span>
                           </div>
                           
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] text-slate-400 font-bold font-mono">
                               {new Date(intel.date).toLocaleDateString()}
                             </span>
                             {intel.link && (
                               <a href={intel.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors">
                                 Open Source <ExternalLink size={10} />
                               </a>
                             )}
                           </div>
                           
                           <p className="text-[13px] text-slate-700 font-medium leading-relaxed line-clamp-5 mb-4 whitespace-pre-wrap flex-1">
                             {intel.content || 'No text content available.'}
                           </p>
                           
                           <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-auto shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleOpenTaskModal(intel, project)} 
                               className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-black uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-blue-200/50"
                             >
                               <PlusCircle size={12} /> Add to Tasks
                             </button>
                             <button 
                               onClick={() => handleDeleteIntel(intel.id)} 
                               className="bg-red-50 hover:bg-red-100 text-red-500 p-2 rounded-lg transition-colors border border-red-200/50"
                               title="Delete Intel"
                             >
                               <Trash2 size={14} />
                             </button>
                           </div>

                         </div>
                       )
                     })
                   )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* === ADD TASK MODAL OVERLAY (NARROWER WIDTH, HIGHEST Z-INDEX, ALL FIELDS) === */}
      {isTaskModalOpen && taskDraft && (
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900">Draft Content from Intel</h2>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">Target: {taskDraft.project_name}</p>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            
            {/* Toggle standard vs article */}
            <div className="px-6 pt-4 pb-2 shrink-0 bg-slate-50/50 border-b border-slate-100">
              <div className="flex p-1 bg-slate-200/50 rounded-lg w-fit border border-slate-200/80 shadow-inner">
                <button type="button" onClick={() => setEntryType('standard')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${entryType === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Standard Task</button>
                <button type="button" onClick={() => setEntryType('article')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${entryType === 'article' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Article / Guide</button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveTask} className="flex-1 overflow-y-auto custom-scrollbar bg-white p-6">
              
              {/* --- STANDARD TASK UI (WITH ALL FIELDS) --- */}
              {entryType === 'standard' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Task Name *</label>
                      <input required type="text" value={taskDraft.name} onChange={(e) => setTaskDraft({...taskDraft, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Task Link</label>
                      <input type="url" value={taskDraft.link} onChange={(e) => setTaskDraft({...taskDraft, link: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Recurring</label>
                      <select value={taskDraft.recurring} onChange={(e) => setTaskDraft({...taskDraft, recurring: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-bold text-slate-700">
                        <option value="One-time">One-time</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                      <select value={taskDraft.status || 'Active'} onChange={(e) => setTaskDraft({...taskDraft, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-bold text-slate-700">
                        <option value="Active">Active</option>
                        <option value="Ending Soon">Ending Soon</option>
                        <option value="High Priority">High Priority</option>
                        <option value="Ended">Ended</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Cost ($)</label>
                      <input type="number" value={taskDraft.cost} onChange={(e) => setTaskDraft({...taskDraft, cost: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Time (Min)</label>
                      <input type="number" value={taskDraft.time_minutes} onChange={(e) => setTaskDraft({...taskDraft, time_minutes: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                      <input type="date" value={taskDraft.end_date || ''} onChange={(e) => setTaskDraft({...taskDraft, end_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" />
                    </div>

                    <div className="sm:col-span-2 pt-3 border-t border-slate-100">
                      <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Search size={12}/> On-Chain Verification (Optional)</h4>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Network RPC URL</label>
                      <input type="url" value={taskDraft.rpc_url || ''} onChange={(e) => setTaskDraft({...taskDraft, rpc_url: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" placeholder="https://mainnet..." />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Target Contract</label>
                      <input type="text" value={taskDraft.contract_address || ''} onChange={(e) => setTaskDraft({...taskDraft, contract_address: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900" placeholder="0x..." />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Description / Steps</label>
                      <textarea value={taskDraft.description} onChange={(e) => setTaskDraft({...taskDraft, description: e.target.value})} rows="3" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900 resize-none custom-scrollbar" />
                    </div>
                  </div>
                </div>
              )}

              {/* --- ARTICLE / GUIDE UI --- */}
              {entryType === 'article' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Article Title *</label>
                      <input required type="text" value={taskDraft.name} onChange={(e) => setTaskDraft({...taskDraft, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm font-medium text-slate-900" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Cover Image URL</label>
                      <input type="url" value={taskDraft.external_link} onChange={(e) => setTaskDraft({...taskDraft, external_link: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm font-medium text-slate-900" />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5">Article Editor (Markdown)</label>
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:border-purple-500 transition-colors bg-white">
                        
                        {/* Markdown Toolbar */}
                        <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex gap-1.5">
                            <button type="button" onClick={() => insertAtCursor('\n## ')} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[10px] font-bold transition shadow-sm">H2</button>
                            <button type="button" onClick={() => insertAtCursor('\n### Step X: Title\n1. Do this...\n2. Then this...\n')} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[10px] font-bold transition shadow-sm flex items-center gap-1"><List size={12}/> Step</button>
                            <button type="button" onClick={() => insertAtCursor('\n> **Pro Tip:** \n')} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[10px] font-bold transition shadow-sm flex items-center gap-1"><Lightbulb size={12}/> Tip</button>
                            
                            <label className="cursor-pointer px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[10px] font-bold transition shadow-sm flex items-center gap-1">
                              {isImageUploading ? '⏳ Uploading...' : <><ImageIcon size={12}/> Image</>}
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isImageUploading} />
                            </label>
                          </div>
                          <button type="button" onClick={handleAIEnhance} disabled={isAIEnhancing} className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded hover:bg-purple-200 text-[10px] font-black uppercase tracking-wider transition">
                            {isAIEnhancing ? '✨ Processing...' : <><Sparkles size={12}/> Polish</>}
                          </button>
                        </div>
                        
                        <textarea
                          id="markdown-editor"
                          value={taskDraft.tutorial_markdown || ''}
                          onChange={(e) => setTaskDraft({...taskDraft, tutorial_markdown: e.target.value})}
                          className="w-full px-4 py-4 focus:outline-none text-slate-800 h-56 font-mono text-[12px] leading-relaxed custom-scrollbar resize-y bg-transparent"
                          placeholder="Start writing your guide here..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-5 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-xs transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmittingTask} className={`px-6 py-2 text-white rounded-xl font-black uppercase tracking-widest shadow-md transition-colors text-xs ${entryType === 'article' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'} disabled:bg-slate-400`}>
                  {isSubmittingTask ? 'Deploying...' : (entryType === 'article' ? 'Publish Article' : 'Deploy Task')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}