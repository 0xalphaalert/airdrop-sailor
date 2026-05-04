import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Database, DollarSign, CheckSquare, X, Download, Image as ImageIcon, Sparkles, List, Lightbulb } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

// --- AI PARSING UTILITY ---
const safeParseAI = (data) => {
  if (!data || typeof data !== 'string') return null;
  
  try {
    // Try direct JSON parse first
    return JSON.parse(data);
  } catch (error) {
    try {
      // Try to extract JSON from messy AI output
      const jsonMatch = data.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (extractError) {
      console.error('Failed to extract JSON:', extractError);
    }
    return null;
  }
};

export default function Manageas() {
  const [activeTab, setActiveTab] = useState('projects'); 
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [funding, setFunding] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  
  // Tasks & Article specific state
  const [taskFilter, setTaskFilter] = useState(''); 
  const [entryType, setEntryType] = useState('standard'); 
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isAIEnhancing, setIsAIEnhancing] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'projects') {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setProjects(data || []);
      } else if (activeTab === 'tasks') {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setTasks(data || []);
      } else if (activeTab === 'fundraising') {
        const { data, error } = await supabase.from('funding_opportunities').select('*').order('last_updated', { ascending: false });
        if (error) throw error;
        setFunding(data || []);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-Fetch Details Function
  const handleAutoFetch = async () => {
    if (!formData.x_link) return alert('Please enter a Twitter/X URL first');
    
    setIsAutoFetching(true);
    try {
      const handle = formData.x_link.match(/twitter\.com\/([^\/?]+)/)?.[1] || formData.x_link.match(/x\.com\/([^\/?]+)/)?.[1];
      if (!handle) return alert('Invalid Twitter/X URL format');

      const logoUrl = `https://unavatar.io/twitter/${handle}`;
      
      if (activeTab === 'projects') {
        const { data: fundingData } = await supabase.from('funding_opportunities').select('*').ilike('x_link', `%${handle}%`).limit(1);
        setFormData(prev => ({
          ...prev,
          logo_url: logoUrl,
          funding: fundingData?.[0]?.funding_amount || prev.funding,
          lead_investors: fundingData?.[0]?.lead_investor || prev.lead_investors
        }));
      } else if (activeTab === 'fundraising') {
        setFormData(prev => ({ ...prev, project_logo: logoUrl }));
      }
    } catch (error) {
      console.error('Auto-fetch error:', error);
      alert('Failed to auto-fetch details');
    } finally {
      setIsAutoFetching(false);
    }
  };

  // --- AI PROMPT GENERATOR FUNCTION ---
  const generateAIPrompt = () => {
    let prompt = '';
    
    if (activeTab === 'projects') {
      prompt = `Analyze the following crypto project deeply.

Focus ONLY on:

* Funding strength
* Investors quality
* Founder credibility
* Social signals (Twitter, Discord, engagement)
* Airdrop signals (points, leaderboard, campaigns)
* Token status and tokenomics
* Product tracking behavior
* Competition and entry difficulty

Project Data:
Name: ${formData.name || ''}
Funding: ${formData.funding || ''}
Investors: ${formData.lead_investors || ''}
Twitter: ${formData.x_link || ''}
Description: ${formData.description || ''}

---

Return ONLY JSON in this format:

{
"project_overview": {
"summary": "",
"category": "",
"sector": "",
"chain": "",
"stage": ""
},
"credibility_analysis": {
"funding": {
"amount": "",
"tier": "",
"investors": [],
"investor_quality": ""
},
"team": {
"founders": [],
"background": "",
"notable_affiliations": []
},
"backing_signals": []
},
"social_signal": {
"twitter": {
"followers": 0,
"growth": "",
"engagement": "",
"notable_followers": []
},
"discord": {
"members": 0,
"activity": ""
},
"hype_level": ""
},
"airdrop_signal": {
"airdrop_announced": false,
"type": "",
"evidence": [],
"token_status": "",
"tokenomics_available": false
},
"product_signal": {
"has_points_system": false,
"has_leaderboard": false,
"user_tracking": [],
"repeatable_actions": false,
"onchain_dependency": ""
},
"opportunity_analysis": {
"early_access": false,
"competition_level": "",
"entry_barrier": "",
"cost": "",
"time_required": "",
"effort_type": ""
},
"risk_analysis": {
"red_flags": [],
"downside": "",
"security_concerns": []
},
"alpha_evaluation": {
"why_this_is_alpha": [],
"category_strength": "",
"narrative_fit": ""
},
"final_verdict": {
"airdrop_probability": "",
"confidence_score": 0,
"recommended_action": "",
"strategy": ""
}
}`;
    } else if (activeTab === 'fundraising') {
      prompt = `Analyze the following funded crypto project deeply.

Focus ONLY on:

* Funding strength and round details
* Investors quality and valuation logic
* Founder credibility and team background
* Social signals (Twitter, Discord, engagement)
* Airdrop signals (points, leaderboard, campaigns)
* Token status and tokenomics
* Product tracking behavior
* Competition and entry difficulty

Project Data:
Name: ${formData.project_name || ''}
Funding: ${formData.funding_amount || ''}
Round: ${formData.round || ''}
Investors: ${formData.lead_investor || ''}
Category: ${formData.category || ''}
Sector: ${formData.sector || ''}

---

Return ONLY JSON in this format:

{
"project_overview": {
"summary": "",
"category": "",
"sector": "",
"chain": "",
"stage": ""
},
"credibility_analysis": {
"funding": {
"amount": "",
"tier": "",
"investors": [],
"investor_quality": ""
},
"team": {
"founders": [],
"background": "",
"notable_affiliations": []
},
"backing_signals": []
},
"social_signal": {
"twitter": {
"followers": 0,
"growth": "",
"engagement": "",
"notable_followers": []
},
"discord": {
"members": 0,
"activity": ""
},
"hype_level": ""
},
"airdrop_signal": {
"airdrop_announced": false,
"type": "",
"evidence": [],
"token_status": "",
"tokenomics_available": false
},
"product_signal": {
"has_points_system": false,
"has_leaderboard": false,
"user_tracking": [],
"repeatable_actions": false,
"onchain_dependency": ""
},
"opportunity_analysis": {
"early_access": false,
"competition_level": "",
"entry_barrier": "",
"cost": "",
"time_required": "",
"effort_type": ""
},
"risk_analysis": {
"red_flags": [],
"downside": "",
"security_concerns": []
},
"alpha_evaluation": {
"why_this_is_alpha": [],
"category_strength": "",
"narrative_fit": ""
},
"final_verdict": {
"airdrop_probability": "",
"confidence_score": 0,
"recommended_action": "",
"strategy": ""
}
}`;
    }
    
    setGeneratedPrompt(prompt);
  };

  // --- ARTICLE EDITOR FUNCTIONS ---
  const insertAtCursor = (textToInsert) => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;
    
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentVal = formData.tutorial_markdown || '';
    
    const newVal = currentVal.substring(0, startPos) + textToInsert + currentVal.substring(endPos);
    handleInputChange('tutorial_markdown', newVal);
    
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
    if (!formData.tutorial_markdown) return alert("Write a rough draft first!");
    setIsAIEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-article', {
        body: { markdown: formData.tutorial_markdown }
      });
      if (error) throw error;
      if (data?.enhanced_markdown) handleInputChange('tutorial_markdown', data.enhanced_markdown);
    } catch (err) {
      alert("AI enhancement failed: " + err.message);
    } finally {
      setIsAIEnhancing(false);
    }
  };

  // CRUD Functions
  const handleDelete = async (id, table) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchData(); 
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  const handleSave = async () => {
    try {
      let result;
      if (activeTab === 'projects') {
        const projectData = {
          funding: formData.funding || '', lead_investors: formData.lead_investors || '',
          x_link: formData.x_link || '', name: formData.name || '', logo_url: formData.logo_url || '',
          galxe_alias: formData.galxe_alias || '', discord_link: formData.discord_link || '',
          tier: formData.tier || '', status: formData.status || '', airdrop_status: formData.airdrop_status || '',
          description: formData.description || '', ai_research_data: formData.ai_research_data || '{}'
        };
        if (editingItem) result = await supabase.from('projects').update(projectData).eq('id', editingItem.id);
        else result = await supabase.from('projects').insert([projectData]);

      } else if (activeTab === 'tasks') {
        const taskData = {
          project_id: formData.project_id || '', name: formData.name || '', recurring: formData.recurring || 'One-time',
          link: formData.link || '', cost: parseFloat(formData.cost) || 0, time_minutes: parseInt(formData.time_minutes) || 0,
          end_date: formData.end_date || null, status: formData.status || 'Active', rpc_url: formData.rpc_url || '',
          contract_address: formData.contract_address || '', tutorial_markdown: formData.tutorial_markdown || '',
          external_link: formData.external_link || '', source: entryType
        };
        if (editingItem) result = await supabase.from('tasks').update(taskData).eq('id', editingItem.id);
        else result = await supabase.from('tasks').insert([taskData]);

      } else {
        const fundingData = {
          project_name: formData.project_name || '', x_link: formData.x_link || '', funding_amount: formData.funding_amount || '',
          round: formData.round || '', lead_investor: formData.lead_investor || '', category: formData.category || '',
          sector: formData.sector || '', project_logo: formData.project_logo || '', ai_research_data: formData.ai_research_data || '{}'
        };
        if (editingItem) result = await supabase.from('funding_opportunities').update(fundingData).eq('id', editingItem.id);
        else result = await supabase.from('funding_opportunities').insert([fundingData]);
      }
      
      if (result.error) throw result.error;
      closeModal();
      fetchData();
    } catch (error) {
      alert(`Save failed: ${error.message}`);
    }
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
      if (activeTab === 'tasks') setEntryType(item.source === 'article' ? 'article' : 'standard');
    } else {
      setFormData(getDefaultFormData());
      if (activeTab === 'tasks') setEntryType('standard');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const getDefaultFormData = () => {
    if (activeTab === 'projects') return { funding: '', lead_investors: '', x_link: '', name: '', logo_url: '', galxe_alias: '', discord_link: '', tier: 'Tier 3', status: 'Waitlist', airdrop_status: 'Unconfirmed', description: '', ai_research_data: '{}' };
    if (activeTab === 'tasks') return { project_id: '', name: '', recurring: 'One-time', link: '', cost: 0, time_minutes: 0, end_date: '', status: 'Active', rpc_url: '', contract_address: '', tutorial_markdown: '', external_link: '' };
    return { project_name: '', x_link: '', funding_amount: '', round: '', lead_investor: '', category: '', sector: '', project_logo: '', ai_research_data: '{}' };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredProjects = projects.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTasks = tasks.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()) && (!taskFilter || t.project_id === taskFilter));
  const filteredFunding = funding.filter(f => f.project_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Core Database</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your official inventory of projects, tasks, and funding rounds.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm">
          <Plus size={18} /> Add New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-1 overflow-x-auto">
          <button onClick={() => setActiveTab('projects')} className={`flex shrink-0 items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'projects' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><Database size={16} /> Projects</button>
          <button onClick={() => setActiveTab('tasks')} className={`flex shrink-0 items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><CheckSquare size={16} /> Tasks</button>
          <button onClick={() => setActiveTab('fundraising')} className={`flex shrink-0 items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'fundraising' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><DollarSign size={16} /> Fundraising</button>
        </div>
        <div className="relative w-full sm:w-72 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {activeTab === 'tasks' && (
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Filter Project:</label>
            <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} className="w-full max-w-xs px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-bold text-slate-700">
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        
        {isLoading ? <div className="p-10 text-center text-slate-500 font-bold">Loading records...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500 font-black">
                  {activeTab === 'projects' ? (
                    <><th className="px-6 py-4">Project Name</th><th className="px-6 py-4">Tier</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></>
                  ) : activeTab === 'tasks' ? (
                    <><th className="px-6 py-4">Task Name</th><th className="px-6 py-4">Project</th><th className="px-6 py-4">Type</th><th className="px-6 py-4 text-right">Actions</th></>
                  ) : (
                    <><th className="px-6 py-4">Project Name</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Round</th><th className="px-6 py-4 text-right">Actions</th></>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTab === 'projects' && filteredProjects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={p.logo_url || 'https://via.placeholder.com/40'} alt="logo" className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 object-cover shrink-0" />
                      <span className="font-bold text-slate-900">{p.name}</span>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm font-medium text-slate-700">{p.tier}</span></td>
                    <td className="px-6 py-4"><span className="text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">{p.status}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(p.id, 'projects')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'tasks' && filteredTasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4"><span className="font-bold text-slate-900">{t.name}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-medium text-slate-700">{projects.find(p => p.id === t.project_id)?.name || 'N/A'}</span></td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${t.source === 'article' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                        {t.source === 'article' ? 'Article' : 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(t.id, 'tasks')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'fundraising' && filteredFunding.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {f.project_logo ? <img src={f.project_logo} alt="logo" className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 object-cover shrink-0" /> : <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0"><DollarSign size={14} className="text-slate-400"/></div>}
                      <span className="font-bold text-slate-900">{f.project_name}</span>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm font-bold text-emerald-600">{f.funding_amount || '$0'}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-medium text-slate-700">{f.round || 'N/A'}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(f)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(f.id, 'funding_opportunities')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OVERHAULED MODAL ARCHITECTURE */}
      {/* 1. NUCLEAR Z-INDEX TO BEAT SIDEBAR */}
      {/* 2. MAX-W-2XL FOR COMPACT MODAL WIDTH */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6" 
          style={{ zIndex: 99999, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900">{editingItem ? 'Edit Record' : 'Create New Record'}</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{activeTab} Database</p>
              </div>
              <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar bg-white flex-1">
              
              {/* === PROJECTS FORM === */}
              {activeTab === 'projects' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Twitter / X URL</label>
                    <div className="flex gap-2">
                      <input type="url" value={formData.x_link || ''} onChange={(e) => handleInputChange('x_link', e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="https://twitter.com/..." />
                      <button type="button" onClick={handleAutoFetch} disabled={isAutoFetching} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold text-xs transition-colors whitespace-nowrap">
                        <Download size={14} /> {isAutoFetching ? 'Scanning...' : 'Auto-Fetch Logo'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Name *</label>
                    <input required type="text" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="Project Name" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Logo URL</label>
                    <input type="url" value={formData.logo_url || ''} onChange={(e) => handleInputChange('logo_url', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount Raised</label>
                    <input type="text" value={formData.funding || ''} onChange={(e) => handleInputChange('funding', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="$5M" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Lead Investors</label>
                    <input type="text" value={formData.lead_investors || ''} onChange={(e) => handleInputChange('lead_investors', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="a16z, Jump..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Galxe Alias</label>
                    <input type="text" value={formData.galxe_alias || ''} onChange={(e) => handleInputChange('galxe_alias', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="Campaign Alias" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Discord URL</label>
                    <input type="url" value={formData.discord_link || ''} onChange={(e) => handleInputChange('discord_link', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="https://discord.gg/..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Tier</label>
                    <select value={formData.tier || ''} onChange={(e) => handleInputChange('tier', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-700">
                      <option value="Tier 1">Tier 1</option><option value="Tier 2">Tier 2</option><option value="Tier 3">Tier 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Phase</label>
                    <select value={formData.status || ''} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-700">
                      <option value="Waitlist">Waitlist</option><option value="Testnet">Testnet</option><option value="Mainnet">Mainnet</option><option value="Point Farming">Point Farming</option><option value="TGE">TGE</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Airdrop Status</label>
                    <select value={formData.airdrop_status || ''} onChange={(e) => handleInputChange('airdrop_status', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-700">
                      <option value="Confirmed">Confirmed</option><option value="Possible">Possible</option><option value="Unconfirmed">Unconfirmed</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Project Description</label>
                    <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows="2" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900 resize-none" placeholder="Short bio..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles size={12} /> AI Research Data (JSON)</label>
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={generateAIPrompt} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg">
                        ⚡ Generate Prompt
                      </button>
                      <button 
                        onClick={() => navigator.clipboard.writeText(generatedPrompt)} 
                        disabled={!generatedPrompt}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                          generatedPrompt 
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                            : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        📋 Copy Prompt
                      </button>
                    </div>
                    <textarea 
                      value={generatedPrompt || ''} 
                      readOnly
                      rows="6" 
                      placeholder="Click generate to create AI prompt"
                      className="w-full px-3 py-2 bg-slate-900 text-blue-400 font-mono text-xs border border-slate-800 rounded-lg mb-2"
                    />
                    <textarea 
                      value={formData.ai_research_data || '{}'} 
                      onChange={(e) => handleInputChange('ai_research_data', e.target.value)} 
                      rows="3" 
                      className="w-full px-3 py-2 bg-slate-900 text-green-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 resize-none custom-scrollbar" 
                      placeholder="Paste AI output (JSON will be auto-processed)"
                    />
                  </div>
                </div>
              )}

              {/* === TASKS FORM === */}
              {activeTab === 'tasks' && (
                <div className="space-y-5">
                  <div className="flex p-1 bg-slate-100 rounded-lg w-fit border border-slate-200">
                    <button type="button" onClick={() => setEntryType('standard')} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase transition-all ${entryType === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Standard Task</button>
                    <button type="button" onClick={() => setEntryType('article')} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase transition-all ${entryType === 'article' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Article / Guide</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Target Project *</label>
                      <select required value={formData.project_id || ''} onChange={(e) => handleInputChange('project_id', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-900">
                        <option value="">-- Choose Project --</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    {entryType === 'standard' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task Name *</label>
                          <input required type="text" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="Enter task name" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Recurring</label>
                          <select value={formData.recurring || 'One-time'} onChange={(e) => handleInputChange('recurring', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-700">
                            <option value="One-time">One-time</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task Link</label>
                          <input type="url" value={formData.link || ''} onChange={(e) => handleInputChange('link', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="https://..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cost ($)</label>
                          <input type="number" value={formData.cost || 0} onChange={(e) => handleInputChange('cost', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time (Min)</label>
                          <input type="number" value={formData.time_minutes || 0} onChange={(e) => handleInputChange('time_minutes', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">End Date</label>
                          <input type="date" value={formData.end_date || ''} onChange={(e) => handleInputChange('end_date', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</label>
                          <select value={formData.status || 'Active'} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-700">
                            <option value="Active">Active</option><option value="Ending Soon">Ending Soon</option><option value="High Priority">High Priority</option><option value="Ended">Ended</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 pt-3 border-t border-slate-100 mt-2">
                          <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Search size={12}/> On-Chain Verification</h4>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Network RPC URL</label>
                          <input type="url" value={formData.rpc_url || ''} onChange={(e) => handleInputChange('rpc_url', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="https://mainnet..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Contract</label>
                          <input type="text" value={formData.contract_address || ''} onChange={(e) => handleInputChange('contract_address', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="0x..." />
                        </div>
                      </>
                    )}

                    {entryType === 'article' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Article Title *</label>
                          <input required type="text" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm text-slate-900" placeholder="How to run a node..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cover Image URL</label>
                          <input type="url" value={formData.external_link || ''} onChange={(e) => handleInputChange('external_link', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm text-slate-900" placeholder="https://..." />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Article Editor (Markdown)</label>
                          
                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:border-purple-500 transition-colors bg-white">
                            {/* Markdown Toolbar */}
                            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex gap-1.5">
                                <button type="button" onClick={() => insertAtCursor('\n## ')} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold transition shadow-sm">H2</button>
                                <button type="button" onClick={() => insertAtCursor('\n### Step X: Title\n1. Do this...\n2. Then this...\n')} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold transition shadow-sm flex items-center gap-1"><List size={12}/> Step</button>
                                <button type="button" onClick={() => insertAtCursor('\n> **Pro Tip:** \n')} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold transition shadow-sm flex items-center gap-1"><Lightbulb size={12}/> Tip</button>
                                
                                <label className="cursor-pointer px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold transition shadow-sm flex items-center gap-1">
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
                              value={formData.tutorial_markdown || ''}
                              onChange={(e) => handleInputChange('tutorial_markdown', e.target.value)}
                              className="w-full px-4 py-4 focus:outline-none text-slate-800 h-48 font-mono text-xs leading-relaxed custom-scrollbar resize-y bg-transparent"
                              placeholder="Start writing your guide here..."
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* === FUNDRAISING FORM === */}
              {activeTab === 'fundraising' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Twitter / X Link</label>
                    <div className="flex gap-2">
                      <input type="url" value={formData.x_link || ''} onChange={(e) => handleInputChange('x_link', e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="https://twitter.com/..." />
                      <button type="button" onClick={handleAutoFetch} disabled={isAutoFetching} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold text-xs transition-colors whitespace-nowrap shadow-sm">
                        <Download size={14} /> {isAutoFetching ? 'Scanning...' : 'Fetch Logo'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Project Name *</label>
                    <input required type="text" value={formData.project_name || ''} onChange={(e) => handleInputChange('project_name', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount Raised</label>
                    <input type="text" value={formData.funding_amount || ''} onChange={(e) => handleInputChange('funding_amount', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="$5M" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Round</label>
                    <input type="text" value={formData.round || ''} onChange={(e) => handleInputChange('round', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="Seed, Series A..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Category</label>
                    <input type="text" value={formData.category || ''} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="DeFi, L1..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lead Investors</label>
                    <input type="text" value={formData.lead_investor || ''} onChange={(e) => handleInputChange('lead_investor', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sector / Bio</label>
                    <textarea value={formData.sector || ''} onChange={(e) => handleInputChange('sector', e.target.value)} rows="2" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900 resize-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles size={12} /> AI Research Data (JSON)</label>
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={generateAIPrompt} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg">
                        ⚡ Generate Prompt
                      </button>
                      <button 
                        onClick={() => navigator.clipboard.writeText(generatedPrompt)} 
                        disabled={!generatedPrompt}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                          generatedPrompt 
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                            : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        📋 Copy Prompt
                      </button>
                    </div>
                    <textarea 
                      value={generatedPrompt || ''} 
                      readOnly
                      rows="6" 
                      placeholder="Click generate to create AI prompt"
                      className="w-full px-3 py-2 bg-slate-900 text-blue-400 font-mono text-xs border border-slate-800 rounded-lg mb-2"
                    />
                    <textarea 
                      value={formData.ai_research_data || '{}'} 
                      onChange={(e) => handleInputChange('ai_research_data', e.target.value)} 
                      rows="3" 
                      className="w-full px-3 py-2 bg-slate-900 text-green-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 resize-none custom-scrollbar" 
                      placeholder="Paste AI output (JSON will be auto-processed)"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={closeModal} className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase tracking-widest shadow-sm transition-colors text-xs">{editingItem ? 'Save Updates' : 'Deploy Record'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}