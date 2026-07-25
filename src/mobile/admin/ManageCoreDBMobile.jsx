import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Database, DollarSign, CheckSquare, 
  X, Download, Image as ImageIcon, Sparkles, List, Lightbulb, 
  Eye, EyeOff, Bold, Italic, Link as LinkIcon, Users, Coins, AlertCircle 
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

// --- AI PARSING UTILITY ---
const safeParseAI = (data) => {
  if (!data || typeof data !== 'string') return null;
  try {
    return JSON.parse(data);
  } catch (error) {
    try {
      const jsonMatch = data.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (extractError) {
      console.error('Failed to extract JSON:', extractError);
    }
    return null;
  }
};

// --- IMGBB ASSET PIPELINE ---
const autoMigrateLogoToImgBB = async (xUrl, entityName) => {
  if (!xUrl || xUrl.trim() === '' || xUrl === '#') return null;
  const handle = xUrl.match(/(?:twitter\.com|x\.com)\/([^\/?]+)/i)?.[1];
  if (!handle) return null;

  try {
    const { data, error } = await supabase.functions.invoke('upload-logo', { body: { handle: handle } });
    if (error) throw error;
    if (data && data.url) return data.url;
  } catch (error) {
    console.error(`Asset migration failure for ${entityName}:`, error);
  }
  return null; 
};

export default function ManageCoreDBMobile() {
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
  
  // Prompt States
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedFoundersPrompt, setGeneratedFoundersPrompt] = useState('');
  const [generatedTokenomicsPrompt, setGeneratedTokenomicsPrompt] = useState('');
  const [generatedCompetitorPrompt, setGeneratedCompetitorPrompt] = useState('');

  // Investor Tag States
  const [vcList, setVcList] = useState([]);
  const [investorSearch, setInvestorSearch] = useState('');
  const [showVcDropdown, setShowVcDropdown] = useState(false);
  
  // Roles State
  const [projectFormTab, setProjectFormTab] = useState('details'); 
  const [roles, setRoles] = useState([{ role_name: '', requirements: '', perks: '', difficulty_level: 'Medium' }]);

  useEffect(() => {
    fetchData();
    const fetchVCs = async () => {
      const { data } = await supabase.from('pioneer_profiles').select('name').eq('pioneer_type', 'VC');
      if (data) setVcList(data.map(v => v.name));
    };
    fetchVCs();
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
      if (activeTab === 'projects') alert(`Projects Failed to Load. Reason: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFetch = async () => {
    if (!formData.x_link) return alert('Please enter a Twitter/X URL first');
    setIsAutoFetching(true);
    try {
      const handle = formData.x_link.match(/(?:twitter\.com|x\.com)\/([^\/?]+)/i)?.[1];
      if (!handle) {
        setIsAutoFetching(false);
        return alert('Invalid Twitter/X URL format');
      }

      const permanentLogoUrl = await autoMigrateLogoToImgBB(formData.x_link, handle);
      if (!permanentLogoUrl) alert("Couldn't fetch profile picture. Add logo manually.");

      const finalLogo = permanentLogoUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${handle}`;
      
      if (activeTab === 'projects') {
        let fundingAmount = ''; let leadInvestor = '';
        try {
          const { data } = await supabase.from('funding_opportunities').select('*').ilike('x_link', `%${handle}%`).limit(1);
          if (data && data.length > 0) {
            fundingAmount = data[0].funding_amount || ''; leadInvestor = data[0].lead_investor || '';
          }
        } catch (err) {}
        setFormData(prev => ({ ...prev, logo_url: finalLogo, funding: fundingAmount || prev.funding || '', lead_investors: leadInvestor || prev.lead_investors || '' }));
      } else if (activeTab === 'fundraising') {
        setFormData(prev => ({ ...prev, project_logo: finalLogo })); 
      }
    } catch (error) {
      alert(`Auto-fetch halted: ${error.message}`);
    } finally {
      setIsAutoFetching(false);
    }
  };

  // --- AI PROMPT GENERATORS ---
  const generateAIPrompt = () => {
    let prompt = '';
    if (activeTab === 'projects') {
      prompt = `Analyze the following crypto project deeply.\nFocus ONLY on:\n* Funding strength\n* Investors quality\n* Founder credibility\n* Social signals\n* Airdrop signals\n* Token status\n* Product tracking behavior\n* Competition\n\nProject Data:\nName: ${formData.name || ''}\nFunding: ${formData.funding || ''}\nInvestors: ${formData.lead_investors || ''}\nTwitter: ${formData.x_link || ''}\nDescription: ${formData.description || ''}\n\n---\nReturn ONLY JSON matching your required schema.`;
    } else if (activeTab === 'fundraising') {
      prompt = `Analyze the following funded crypto project deeply.\n\nProject Data:\nName: ${formData.project_name || ''}\nFunding: ${formData.funding_amount || ''}\nRound: ${formData.round || ''}\nInvestors: ${formData.lead_investor || ''}\nCategory: ${formData.category || ''}\n\n---\nReturn ONLY a raw JSON object with this exact schema:\n{\n  "summary": "A punchy, 2-sentence bio.",\n  "early_tasks": [\n    { "task_name": "Task", "link": "https://link" }\n  ],\n  "analysis": "Your analysis."\n}`;
    }
    setGeneratedPrompt(prompt);
  };

  const handleAIPaste = (value) => {
    handleInputChange('ai_research_data', value);
    try {
      const parsed = JSON.parse(value);
      if (parsed.summary) {
        setFormData(prev => ({ ...prev, sector: prev.sector ? `${prev.sector}\n\n${parsed.summary}` : parsed.summary }));
      }
    } catch (e) {}
  };

  const generateFoundersAIPrompt = () => {
    setGeneratedFoundersPrompt(`You are a cryptocurrency data researcher. Find the core founders for this project: ${formData.name || 'N/A'}.\n\nOutput ONLY a raw JSON array of objects with keys: name, role, background, twitter_handle, linkedin_url.`);
  };

  const generateTokenomicsAIPrompt = () => {
    setGeneratedTokenomicsPrompt(`You are a cryptocurrency data researcher. Find the tokenomics for this project: ${formData.name || 'N/A'}.\n\nOutput ONLY a raw JSON object with keys: ticker, total_supply, community_allocation_percentage, investor_allocation_percentage, team_allocation_percentage, ecosystem_allocation_percentage, tge_date, vesting_notes.`);
  };

  const generateCompetitorAIPrompt = () => {
    setGeneratedCompetitorPrompt(`Find the top 5 direct competitors for: ${formData.name || 'N/A'}.\n\nOutput ONLY a raw JSON object with this schema: { "project_similarity": "text", "competitors": [ { "name": "name", "domain": "domain.com", "x_url": "url", "followers": "count", "past_airdrops": ["drop1"], "average_airdrop_usd": 100 } ] }`);
  };

  // --- INVESTOR TAGS ---
  const handleAddInvestor = (name) => {
    if (!name.trim()) return;
    const current = formData.lead_investor ? formData.lead_investor.split(',').map(n => n.trim()).filter(Boolean) : [];
    if (!current.includes(name.trim())) handleInputChange('lead_investor', [...current, name.trim()].join(', '));
    setInvestorSearch(''); setShowVcDropdown(false);
  };

  const handleRemoveInvestor = (nameToRemove) => {
    const current = formData.lead_investor ? formData.lead_investor.split(',').map(n => n.trim()).filter(Boolean) : [];
    handleInputChange('lead_investor', current.filter(n => n !== nameToRemove).join(', '));
  };

  // --- ARTICLE FORMATTING ---
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentVal = formData.tutorial_markdown || '';
    const selectedText = currentVal.substring(startPos, endPos);
    const newVal = currentVal.substring(0, startPos) + prefix + selectedText + suffix + currentVal.substring(endPos);
    handleInputChange('tutorial_markdown', newVal);
  };

  const insertAtCursor = (textToInsert) => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;
    const startPos = textarea.selectionStart;
    const currentVal = formData.tutorial_markdown || '';
    handleInputChange('tutorial_markdown', currentVal.substring(0, startPos) + textToInsert + currentVal.substring(textarea.selectionEnd));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImageUploading(true);
    try {
      const uploadData = new FormData(); uploadData.append('image', file);
      const IMGBB_KEY = '1de173c5b97e6a61196a6f5153b93960'; 
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.success) insertAtCursor(`\n![Screenshot](${data.data.url})\n`);
    } catch (err) { alert('Upload failed: ' + err.message); } finally { setIsImageUploading(false); }
  };

  const handleAIEnhance = async () => {
    if (!formData.tutorial_markdown) return alert("Write a rough draft first!");
    setIsAIEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-article', { body: { markdown: formData.tutorial_markdown } });
      if (error) throw error;
      if (data?.enhanced_markdown) handleInputChange('tutorial_markdown', data.enhanced_markdown);
    } catch (err) { alert("AI enhancement failed: " + err.message); } finally { setIsAIEnhancing(false); }
  };

  // --- CRUD ---
  const handleDelete = async (id, table) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchData(); 
    } catch (error) { alert(`Delete failed: ${error.message}`); }
  };

  const toggleVisibility = async (projectId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await supabase.from('projects').update({ is_public: newStatus }).eq('id', projectId);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, is_public: newStatus } : p));
    } catch (error) {}
  };

  const handleSave = async () => {
    try {
      let result;
      if (activeTab === 'projects') {
        let parsedFounders = []; let parsedTokenomics = {}; let parsedCompetitors = { project_similarity: "", competitors: [] };
        try { parsedFounders = JSON.parse(formData.founders_details || '[]'); } catch (e) {}
        try { parsedTokenomics = JSON.parse(formData.tokenomics_details || '{}'); } catch (e) {}
        try { parsedCompetitors = JSON.parse(formData.competitor_analysis || '{"project_similarity": "", "competitors": []}'); } catch (e) {}

        const projectData = {
          slug: formData.slug || '', funding: formData.funding || '', lead_investors: formData.lead_investors || '',
          x_link: formData.x_link || '', name: formData.name || '', logo_url: formData.logo_url || '',
          galxe_alias: formData.galxe_alias || '', discord_link: formData.discord_link || '',
          tier: formData.tier || 'Tier 3', status: formData.status || 'Waitlist', airdrop_status: formData.airdrop_status || 'Unconfirmed',
          description: formData.description || '', ai_research_data: formData.ai_research_data || '{}',
          founders_details: parsedFounders, tokenomics_details: parsedTokenomics, competitor_analysis: parsedCompetitors,
          is_public: formData.is_public !== false
        };

        let projectId = editingItem ? editingItem.id : null;
        if (editingItem) result = await supabase.from('projects').update(projectData).eq('id', projectId).select();
        else { result = await supabase.from('projects').insert([projectData]).select(); if (result.data) projectId = result.data[0].id; }
        
        if (result.error) throw result.error;

        if (projectId) {
          await supabase.from('discord_roles').delete().eq('project_id', projectId);
          const validRoles = roles.filter(r => r.role_name && r.role_name.trim() !== '');
          if (validRoles.length > 0) {
            await supabase.from('discord_roles').insert(validRoles.map(r => ({ ...r, project_id: projectId })));
          }
        }
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
        if (formData.lead_investor) {
          const vcNames = formData.lead_investor.split(',').map(n => n.trim()).filter(Boolean);
          for (const vcName of vcNames) {
            const { data: existingVc } = await supabase.from('pioneer_profiles').select('id').ilike('name', vcName).single();
            if (!existingVc) await supabase.from('pioneer_profiles').insert({ name: vcName, pioneer_type: 'VC', smart_money: true });
          }
        }
        let parsedFounders = []; try { parsedFounders = JSON.parse(formData.founders_details || '[]'); } catch (e) {}

        const fundingData = {
          project_name: formData.project_name || '', x_link: formData.x_link || '', funding_amount: formData.funding_amount || '',
          round: formData.round || '', lead_investor: formData.lead_investor || '', category: formData.category || '',
          sector: formData.sector || '', project_logo: formData.project_logo || '', ai_research_data: formData.ai_research_data || '{}',
          founders_details: parsedFounders
        };
        if (editingItem) result = await supabase.from('funding_opportunities').update(fundingData).eq('id', editingItem.id);
        else result = await supabase.from('funding_opportunities').insert([fundingData]);
      }
      
      if (result.error) throw result.error;
      closeModal(); fetchData();
    } catch (error) { alert(`Save failed: ${error.message}`); }
  };

  const openModal = async (item = null) => {
    setEditingItem(item); setProjectFormTab('details');
    if (item) {
      setFormData({ 
        ...item,
        ai_research_data: typeof item.ai_research_data === 'object' ? JSON.stringify(item.ai_research_data, null, 2) : item.ai_research_data,
        founders_details: typeof item.founders_details === 'object' ? JSON.stringify(item.founders_details, null, 2) : item.founders_details,
        tokenomics_details: typeof item.tokenomics_details === 'object' ? JSON.stringify(item.tokenomics_details, null, 2) : item.tokenomics_details,
      });
      if (activeTab === 'tasks') setEntryType(item.source === 'article' ? 'article' : 'standard');
      if (activeTab === 'projects') {
        const { data } = await supabase.from('discord_roles').select('*').eq('project_id', item.id);
        if (data && data.length > 0) setRoles(data); else setRoles([{ role_name: '', requirements: '', perks: '', difficulty_level: 'Medium' }]);
      }
    } else {
      setFormData(getDefaultFormData());
      if (activeTab === 'tasks') setEntryType('standard');
      setRoles([{ role_name: '', requirements: '', perks: '', difficulty_level: 'Medium' }]);
    }
    setGeneratedPrompt(''); setGeneratedFoundersPrompt(''); setGeneratedTokenomicsPrompt(''); setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); setFormData({}); };
  const getDefaultFormData = () => {
    if (activeTab === 'projects') return { tier: 'Tier 3', status: 'Waitlist', airdrop_status: 'Unconfirmed', is_public: true };
    if (activeTab === 'tasks') return { recurring: 'One-time', status: 'Active' };
    return {};
  };
  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const filteredProjects = projects.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTasks = tasks.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()) && (!taskFilter || t.project_id === taskFilter));
  const filteredFunding = funding.filter(f => f.project_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* HEADER & TABS (STICKY) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Core Database</h1>
            <p className="text-xs text-slate-500 font-medium">Manage main inventory</p>
          </div>
          <button onClick={() => openModal()} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/20">
            <Plus size={20} />
          </button>
        </div>

        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('projects')} className={`flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'projects' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Database size={14} /> Projects</button>
          <button onClick={() => setActiveTab('tasks')} className={`flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><CheckSquare size={14} /> Tasks</button>
          <button onClick={() => setActiveTab('fundraising')} className={`flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'fundraising' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><DollarSign size={14} /> Fundraising</button>
        </div>

        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-700" />
          </div>
          {activeTab === 'tasks' && (
            <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} className="w-full mt-3 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none text-xs font-bold text-slate-700">
              <option value="">All Target Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* DATA LIST (CARDS) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Database className="w-8 h-8 animate-pulse mb-2" />
            <span className="text-sm font-bold">Loading records...</span>
          </div>
        ) : (
          <>
            {/* PROJECTS */}
            {activeTab === 'projects' && filteredProjects.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={p.logo_url || 'https://via.placeholder.com/40'} alt="logo" className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 object-cover shrink-0" />
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-tight">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.tier}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{p.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button onClick={() => toggleVisibility(p.id, p.is_public)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${p.is_public ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {p.is_public ? <Eye size={14}/> : <EyeOff size={14}/>} {p.is_public ? 'Public' : 'Private'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openModal(p)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg bg-slate-50 border border-slate-100"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id, 'projects')} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg bg-slate-50 border border-slate-100"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}

            {/* TASKS */}
            {activeTab === 'tasks' && filteredTasks.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold text-slate-500">Project: {projects.find(p => p.id === t.project_id)?.name || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${t.source === 'article' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    {t.source === 'article' ? 'Article' : 'Standard'} Task
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openModal(t)} className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 border border-slate-100 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(t.id, 'tasks')} className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 border border-slate-100 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}

            {/* FUNDING */}
            {activeTab === 'fundraising' && filteredFunding.map(f => (
              <div key={f.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {f.project_logo ? <img src={f.project_logo} alt="logo" className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 object-cover shrink-0" /> : <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0"><DollarSign size={16} className="text-slate-400"/></div>}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-900 text-base leading-tight truncate">{f.project_name}</h3>
                    <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{f.round || 'Unknown Round'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{f.funding_amount || '$0'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end pt-3 border-t border-slate-100 gap-2">
                  <button onClick={() => openModal(f)} className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 border border-slate-100 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(f.id, 'funding_opportunities')} className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 border border-slate-100 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}

            {/* Empty States */}
            {activeTab === 'projects' && filteredProjects.length === 0 && !isLoading && <div className="text-center py-10 text-slate-400 font-bold">No projects found.</div>}
            {activeTab === 'tasks' && filteredTasks.length === 0 && !isLoading && <div className="text-center py-10 text-slate-400 font-bold">No tasks found.</div>}
            {activeTab === 'fundraising' && filteredFunding.length === 0 && !isLoading && <div className="text-center py-10 text-slate-400 font-bold">No funding data found.</div>}
          </>
        )}
      </div>

      {/* FULL SCREEN MOBILE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-200">
          
          {/* Modal Header */}
          <div className="px-4 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
            <div>
              <h2 className="text-lg font-black text-slate-900">{editingItem ? 'Edit Record' : 'Create Record'}</h2>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">{activeTab}</p>
            </div>
            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
          </div>
          
          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-24">
            
            {/* PROJECTS FORM */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex bg-slate-200/50 p-1 rounded-xl w-full border border-slate-200 shadow-inner">
                  <button type="button" onClick={() => setProjectFormTab('details')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${projectFormTab === 'details' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>Details</button>
                  <button type="button" onClick={() => setProjectFormTab('roles')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${projectFormTab === 'roles' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>Roles</button>
                </div>

                {projectFormTab === 'details' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Twitter / X URL</label>
                        <div className="flex flex-col gap-2">
                          <input type="url" value={formData.x_link || ''} onChange={(e) => handleInputChange('x_link', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="https://x.com/..." />
                          <button type="button" onClick={handleAutoFetch} disabled={isAutoFetching} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-black text-xs uppercase tracking-wider">
                            <Download size={16} /> {isAutoFetching ? 'Scanning...' : 'Auto-Fetch Logo & Data'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Name *</label>
                        <input required type="text" value={formData.name || ''} onChange={(e) => {
                          const val = e.target.value; handleInputChange('name', val);
                          handleInputChange('slug', val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                        }} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="Project Name" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Logo URL</label>
                        <input type="url" value={formData.logo_url || ''} onChange={(e) => handleInputChange('logo_url', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                        <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows="3" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 resize-none" placeholder="Short bio..." />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Raised</label>
                          <input type="text" value={formData.funding || ''} onChange={(e) => handleInputChange('funding', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="$5M" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tier</label>
                          <select value={formData.tier || ''} onChange={(e) => handleInputChange('tier', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                            <option value="Tier 1">Tier 1</option><option value="Tier 2">Tier 2</option><option value="Tier 3">Tier 3</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Lead Investors</label>
                        <input type="text" value={formData.lead_investors || ''} onChange={(e) => handleInputChange('lead_investors', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="a16z, Jump..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Phase</label>
                          <select value={formData.status || ''} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                            <option value="Waitlist">Waitlist</option><option value="Testnet">Testnet</option><option value="Mainnet">Mainnet</option><option value="Point Farming">Point Farming</option><option value="TGE">TGE</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Airdrop</label>
                          <select value={formData.airdrop_status || ''} onChange={(e) => handleInputChange('airdrop_status', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                            <option value="Confirmed">Confirmed</option><option value="Possible">Possible</option><option value="Unconfirmed">Unconfirmed</option>
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <input type="checkbox" checked={formData.is_public !== false} onChange={(e) => handleInputChange('is_public', e.target.checked)} className="w-5 h-5 text-blue-600 rounded border-slate-300" />
                        <div>
                          <span className="block text-sm font-bold text-slate-900">Make Public</span>
                          <span className="block text-[10px] text-slate-500">Visible to users on website</span>
                        </div>
                      </label>
                    </div>

                    {/* AI Data Blocks */}
                    <div className="bg-slate-900 p-4 rounded-2xl shadow-sm space-y-5 text-white">
                      <div>
                        <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Sparkles size={14} /> AI Research (JSON)</label>
                        <button type="button" onClick={generateAIPrompt} className="w-full py-2.5 mb-2 bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-wider">Generate Prompt</button>
                        {generatedPrompt && <textarea value={generatedPrompt} readOnly rows="3" className="w-full p-3 bg-black text-slate-300 text-[10px] font-mono rounded-xl mb-2" onClick={() => navigator.clipboard.writeText(generatedPrompt)}/>}
                        <textarea value={formData.ai_research_data || '{}'} onChange={(e) => handleInputChange('ai_research_data', e.target.value)} rows="3" className="w-full p-3 bg-black border border-slate-700 text-emerald-400 text-[11px] font-mono rounded-xl focus:border-emerald-500 outline-none" placeholder="{}" />
                      </div>
                      
                      <div className="border-t border-slate-800 pt-5">
                        <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Users size={14} /> Founders (JSON Array)</label>
                        <button type="button" onClick={generateFoundersAIPrompt} className="w-full py-2.5 mb-2 bg-slate-800 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-wider">Generate Prompt</button>
                        {generatedFoundersPrompt && <textarea value={generatedFoundersPrompt} readOnly rows="3" className="w-full p-3 bg-black text-slate-300 text-[10px] font-mono rounded-xl mb-2" onClick={() => navigator.clipboard.writeText(generatedFoundersPrompt)}/>}
                        <textarea value={formData.founders_details || '[]'} onChange={(e) => handleInputChange('founders_details', e.target.value)} rows="3" className="w-full p-3 bg-black border border-slate-700 text-blue-400 text-[11px] font-mono rounded-xl focus:border-blue-500 outline-none" placeholder="[]" />
                      </div>

                      <div className="border-t border-slate-800 pt-5">
                        <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Coins size={14} /> Tokenomics (JSON)</label>
                        <button type="button" onClick={generateTokenomicsAIPrompt} className="w-full py-2.5 mb-2 bg-slate-800 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-black uppercase tracking-wider">Generate Prompt</button>
                        {generatedTokenomicsPrompt && <textarea value={generatedTokenomicsPrompt} readOnly rows="3" className="w-full p-3 bg-black text-slate-300 text-[10px] font-mono rounded-xl mb-2" onClick={() => navigator.clipboard.writeText(generatedTokenomicsPrompt)}/>}
                        <textarea value={formData.tokenomics_details || '{}'} onChange={(e) => handleInputChange('tokenomics_details', e.target.value)} rows="3" className="w-full p-3 bg-black border border-slate-700 text-purple-400 text-[11px] font-mono rounded-xl focus:border-purple-500 outline-none" placeholder="{}" />
                      </div>
                    </div>
                  </div>
                )}

                {projectFormTab === 'roles' && (
                  <div className="space-y-4">
                    {roles.map((role, index) => (
                      <div key={index} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative">
                        <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Role {index + 1}</span>
                          <button type="button" onClick={() => setRoles(roles.filter((_, i) => i !== index))} className="text-rose-500 bg-rose-50 p-1.5 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Name</label>
                            <input type="text" value={role.role_name || ''} onChange={(e) => { const r = [...roles]; r[index].role_name = e.target.value; setRoles(r); }} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Early Adopter" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Difficulty</label>
                            <select value={role.difficulty_level || 'Medium'} onChange={(e) => { const r = [...roles]; r[index].difficulty_level = e.target.value; setRoles(r); }} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                              <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Requirements</label>
                            <textarea value={role.requirements || ''} onChange={(e) => { const r = [...roles]; r[index].requirements = e.target.value; setRoles(r); }} rows="2" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" placeholder="Reach level 10..." />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Perks</label>
                            <input type="text" value={role.perks || ''} onChange={(e) => { const r = [...roles]; r[index].perks = e.target.value; setRoles(r); }} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Airdrop multiplier..." />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setRoles([...roles, { role_name: '', requirements: '', perks: '', difficulty_level: 'Medium' }])} className="w-full py-4 border-2 border-dashed border-slate-300 text-blue-600 bg-blue-50/50 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                      <Plus size={16} /> Add Role
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TASKS FORM */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex bg-slate-200/50 p-1 rounded-xl w-full border border-slate-200 shadow-inner">
                  <button type="button" onClick={() => setEntryType('standard')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${entryType === 'standard' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>Standard</button>
                  <button type="button" onClick={() => setEntryType('article')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${entryType === 'article' ? 'bg-white text-purple-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>Article</button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Target Project *</label>
                    <select required value={formData.project_id || ''} onChange={(e) => handleInputChange('project_id', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800">
                      <option value="">-- Choose Project --</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  {entryType === 'standard' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Task Name *</label>
                        <input required type="text" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Name" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Task Link</label>
                        <input type="url" value={formData.link || ''} onChange={(e) => handleInputChange('link', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="https://..." />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Cost ($)</label>
                          <input type="number" value={formData.cost || 0} onChange={(e) => handleInputChange('cost', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Time (Min)</label>
                          <input type="number" value={formData.time_minutes || 0} onChange={(e) => handleInputChange('time_minutes', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Recurring</label>
                          <select value={formData.recurring || 'One-time'} onChange={(e) => handleInputChange('recurring', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                            <option value="One-time">One-time</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                          <select value={formData.status || 'Active'} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                            <option value="Active">Active</option><option value="Ending Soon">Ending Soon</option><option value="High Priority">Priority</option><option value="Ended">Ended</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                        <input type="date" value={formData.end_date || ''} onChange={(e) => handleInputChange('end_date', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                      </div>
                    </>
                  )}

                  {entryType === 'article' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Article Title *</label>
                        <input required type="text" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 text-sm" placeholder="Title..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Cover Image URL</label>
                        <input type="url" value={formData.external_link || ''} onChange={(e) => handleInputChange('external_link', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 text-sm" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5">Markdown Content</label>
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-purple-500">
                          <div className="bg-slate-50 border-b border-slate-200 px-2 py-2 flex flex-wrap gap-1">
                            <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2 bg-white border border-slate-200 rounded text-slate-700 shadow-sm"><Bold size={14}/></button>
                            <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2 bg-white border border-slate-200 rounded text-slate-700 shadow-sm"><Italic size={14}/></button>
                            <button type="button" onClick={() => insertFormatting('[', '](url)')} className="p-2 bg-white border border-slate-200 rounded text-slate-700 shadow-sm"><LinkIcon size={14}/></button>
                            <label className="cursor-pointer p-2 bg-white border border-slate-200 rounded text-slate-700 shadow-sm">
                              {isImageUploading ? <Sparkles size={14} className="animate-spin text-purple-500"/> : <ImageIcon size={14}/>}
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isImageUploading} />
                            </label>
                            <button type="button" onClick={handleAIEnhance} className="ml-auto flex items-center gap-1 px-3 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] font-black uppercase">
                              {isAIEnhancing ? 'Wait...' : 'AI Polish'}
                            </button>
                          </div>
                          <textarea id="markdown-editor" value={formData.tutorial_markdown || ''} onChange={(e) => handleInputChange('tutorial_markdown', e.target.value)} className="w-full p-4 h-48 font-mono text-xs outline-none resize-y" placeholder="Write guide here..." />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* FUNDING FORM */}
            {activeTab === 'fundraising' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Twitter / X Link</label>
                  <div className="flex flex-col gap-2">
                    <input type="url" value={formData.x_link || ''} onChange={(e) => handleInputChange('x_link', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="https://x.com/..." />
                    <button type="button" onClick={handleAutoFetch} disabled={isAutoFetching} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-black text-xs uppercase tracking-wider">
                      <Download size={16} /> {isAutoFetching ? 'Scanning...' : 'Fetch Logo'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Project Name *</label>
                  <input required type="text" value={formData.project_name || ''} onChange={(e) => handleInputChange('project_name', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Amount</label>
                    <input type="text" value={formData.funding_amount || ''} onChange={(e) => handleInputChange('funding_amount', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="$5M" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Round</label>
                    <input type="text" value={formData.round || ''} onChange={(e) => handleInputChange('round', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Seed..." />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                  <input type="text" value={formData.category || ''} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="DeFi..." />
                </div>

                {/* Tags Input Mobile */}
                <div className="relative">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Lead Investors</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px] items-center">
                    {(formData.lead_investor ? formData.lead_investor.split(',').map(n => n.trim()).filter(Boolean) : []).map((inv, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700 rounded-md">
                        {inv} <button type="button" onClick={() => handleRemoveInvestor(inv)} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
                      </span>
                    ))}
                    <input 
                      type="text" 
                      value={investorSearch}
                      onChange={(e) => { setInvestorSearch(e.target.value); setShowVcDropdown(true); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInvestor(investorSearch); } }}
                      className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-slate-900" 
                      placeholder="Type VC & Enter..." 
                    />
                  </div>
                  {showVcDropdown && investorSearch.trim() !== '' && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {vcList.filter(vc => vc.toLowerCase().includes(investorSearch.toLowerCase())).map((vc, idx) => (
                        <div key={idx} onClick={() => handleAddInvestor(vc)} className="px-4 py-3 hover:bg-blue-50 border-b border-slate-100 text-sm font-medium">
                          {vc}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl text-white space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Sparkles size={14} /> AI Analysis (JSON)</label>
                    <button type="button" onClick={generateAIPrompt} className="w-full py-2.5 mb-2 bg-slate-800 text-green-400 border border-green-500/30 rounded-xl text-xs font-black uppercase">Generate Prompt</button>
                    {generatedPrompt && <textarea value={generatedPrompt} readOnly rows="3" className="w-full p-3 bg-black text-slate-300 text-[10px] font-mono rounded-xl mb-2" onClick={() => navigator.clipboard.writeText(generatedPrompt)}/>}
                    <textarea value={formData.ai_research_data || '{}'} onChange={(e) => handleAIPaste(e.target.value)} rows="3" className="w-full p-3 bg-black border border-slate-700 text-green-400 text-[11px] font-mono rounded-xl outline-none" />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Sticky Footer */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 pb-safe">
            <button onClick={closeModal} className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-black text-sm uppercase tracking-wider">Cancel</button>
            <button onClick={handleSave} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-500/30">
              {editingItem ? 'Save Updates' : 'Deploy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}