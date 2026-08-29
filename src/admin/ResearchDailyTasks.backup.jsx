import React, { useCallback, useEffect, useState } from 'react';
import {
  Bold, CheckCircle2, Coins, Download, ExternalLink, Image as ImageIcon,
  Italic, Lightbulb, Link as LinkIcon, List, Plus, RefreshCw, Search,
  Sparkles, Target, Trash2, Users, X,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const inputClassName = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const emptyProject = { slug: '', funding: '', lead_investors: '', x_link: '', name: '', logo_url: '', galxe_alias: '', discord_link: '', tier: 'Tier 3', status: 'Waitlist', airdrop_status: 'Unconfirmed', description: '', ai_research_data: '{}', founders_details: '[]', tokenomics_details: '{}', competitor_analysis: '{"project_similarity":"","competitors":[]}', is_public: true };
const emptyTask = { project_id: '', name: '', recurring: 'One-time', link: '', cost: 0, time_minutes: 0, end_date: '', status: 'Active', task_category: '', rpc_url: '', contract_address: '', tutorial_markdown: '', external_link: '' };

const safeJSON = (value, fallback) => { try { return JSON.parse(value || JSON.stringify(fallback)); } catch { return fallback; } };
const channelName = (source) => String(source || '').split('/')[0] || 'Telegram Signal';

// --- IMGBB ASSET PIPELINE (the same secure Edge Function used by Manageas.jsx) ---
const autoMigrateLogoToImgBB = async (xUrl, entityName) => {
  if (!xUrl || xUrl.trim() === '' || xUrl === '#') return null;
  const handle = xUrl.match(/(?:twitter\.com|x\.com)\/([^/?]+)/i)?.[1];
  if (!handle) return null;
  try {
    const { data, error } = await supabase.functions.invoke('upload-logo', { body: { handle } });
    if (error) throw error;
    return data?.url || null;
  } catch (error) {
    console.error(`Asset migration failure for ${entityName}:`, error);
    return null;
  }
};

async function loadPendingQueues() {
  const [projects, tasks, options] = await Promise.all([
    supabase.from('pending_projects_review').select('*').eq('status', 'pending_approval').order('created_at', { ascending: false }),
    supabase.from('pending_tasks_review').select('*').eq('status', 'pending_approval').order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name').order('name', { ascending: true }),
  ]);
  if (projects.error) throw projects.error;
  if (tasks.error) throw tasks.error;
  if (options.error) throw options.error;
  return { projects: projects.data || [], tasks: tasks.data || [], options: options.data || [] };
}

function ModalShell({ title, subtitle, onClose, children }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4"><div><h2 className="text-lg font-black text-slate-950">{title}</h2>{subtitle && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{subtitle}</p>}</div><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Close modal"><X size={20} /></button></div>
      {children}
    </div>
  </div>;
}

function PromptBlock({ icon, label, prompt, generate, value, setValue, placeholder, colors }) {
  return <div className="border-t border-slate-100 pt-4 md:col-span-2">
    <label className={`mb-1 flex items-center gap-1 text-[11px] font-black uppercase tracking-widest ${colors.label}`}>{icon} {label}</label>
    <div className="mb-2 flex flex-wrap gap-2"><button type="button" onClick={generate} className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white ${colors.button}`}>⚡ Generate Prompt</button><button type="button" onClick={() => navigator.clipboard.writeText(prompt)} disabled={!prompt} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${prompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'cursor-not-allowed bg-slate-50 text-slate-400'}`}>📋 Copy Prompt</button></div>
    {prompt && <textarea value={prompt} readOnly rows={4} className={`mb-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-xs ${colors.text}`} />}
    <textarea value={value} onChange={(event) => setValue(event.target.value)} rows={3} className={`w-full resize-none rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-[11px] ${colors.text}`} placeholder={placeholder} />
  </div>;
}

export default function ResearchDailyTasks() {
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const [projectsQueue, setProjectsQueue] = useState([]); const [tasksQueue, setTasksQueue] = useState([]); const [projectOptions, setProjectOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); const [notice, setNotice] = useState(null); const [processingKey, setProcessingKey] = useState(null);
  const [projectModal, setProjectModal] = useState(null); const [taskModal, setTaskModal] = useState(null);
  const [projectFormData, setProjectFormData] = useState(emptyProject); const [taskFormData, setTaskFormData] = useState(emptyTask);

  // Rich Manageas form state.
  const [projectFormTab, setProjectFormTab] = useState('details'); const [entryType, setEntryType] = useState('standard');
  const [roles, setRoles] = useState([]); const [generatedPrompt, setGeneratedPrompt] = useState(''); const [generatedFoundersPrompt, setGeneratedFoundersPrompt] = useState('');
  const [generatedTokenomicsPrompt, setGeneratedTokenomicsPrompt] = useState(''); const [generatedCompetitorPrompt, setGeneratedCompetitorPrompt] = useState('');
  const [isAutoFetching, setIsAutoFetching] = useState(false); const [isImageUploading, setIsImageUploading] = useState(false); const [isAIEnhancing, setIsAIEnhancing] = useState(false);

  const applyQueues = useCallback(({ projects, tasks, options }) => { setProjectsQueue(projects); setTasksQueue(tasks); setProjectOptions(options); }, []);
  const fetchQueues = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true); else setLoading(true); setNotice(null);
    try { applyQueues(await loadPendingQueues()); } catch (error) { setNotice({ type: 'error', text: `Failed to load research queues: ${error.message}` }); } finally { setLoading(false); setRefreshing(false); }
  }, [applyQueues]);
  useEffect(() => { let cancelled = false; loadPendingQueues().then((queues) => { if (!cancelled) applyQueues(queues); }).catch((error) => { if (!cancelled) setNotice({ type: 'error', text: `Failed to load research queues: ${error.message}` }); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, [applyQueues]);

  const setProjectField = (field, value) => setProjectFormData((current) => ({ ...current, [field]: value }));
  const setTaskField = (field, value) => setTaskFormData((current) => ({ ...current, [field]: value }));
  const openProject = (item) => { const name = item.suggested_name || ''; setProjectFormData({ ...emptyProject, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''), x_link: item.primary_link || '', description: item.raw_telegram_text || '' }); setRoles([]); setProjectFormTab('details'); setGeneratedPrompt(''); setGeneratedFoundersPrompt(''); setGeneratedTokenomicsPrompt(''); setGeneratedCompetitorPrompt(''); setProjectModal(item); };
  const closeProject = () => { setProjectModal(null); setProjectFormData(emptyProject); setRoles([]); };
  const openTask = (item) => { setTaskFormData({ ...emptyTask, project_id: item.project_id || '', name: item.extracted_task_name || '', link: item.link || item.primary_link || '', tutorial_markdown: item.raw_telegram_text || '' }); setEntryType('standard'); setTaskModal(item); };
  const closeTask = () => { setTaskModal(null); setTaskFormData(emptyTask); setEntryType('standard'); };

  const handleAutoFetch = async () => {
    if (!projectFormData.x_link) return window.alert('Please enter a Twitter/X URL first');
    const handle = projectFormData.x_link.match(/(?:twitter\.com|x\.com)\/([^/?]+)/i)?.[1]; if (!handle) return window.alert('Invalid Twitter/X URL format');
    setIsAutoFetching(true); try { const logo = await autoMigrateLogoToImgBB(projectFormData.x_link, handle); let funding = ''; let investor = '';
      const { data } = await supabase.from('funding_opportunities').select('funding_amount, lead_investor').ilike('x_link', `%${handle}%`).limit(1); if (data?.[0]) { funding = data[0].funding_amount || ''; investor = data[0].lead_investor || ''; }
      setProjectFormData((current) => ({ ...current, logo_url: logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${handle}`, funding: funding || current.funding, lead_investors: investor || current.lead_investors }));
    } catch (error) { window.alert(`Auto-fetch execution halted: ${error.message || 'Network exception encountered.'}`); } finally { setIsAutoFetching(false); }
  };

  const generateAIPrompt = () => setGeneratedPrompt(`Analyze the following crypto project deeply.
Focus ONLY on:
* Funding strength
* Investors quality
* Founder credibility
* Social signals
* Airdrop signals
* Token status
* Product tracking behavior
* Competition

Project Data:
Name: ${projectFormData.name || ''}
Funding: ${projectFormData.funding || ''}
Investors: ${projectFormData.lead_investors || ''}
Twitter: ${projectFormData.x_link || ''}
Description: ${projectFormData.description || ''}

---
Return ONLY JSON matching your required schema.`);

  const generateFoundersAIPrompt = () => setGeneratedFoundersPrompt(`You are a cryptocurrency data researcher. Find the core founders and team details for the crypto project described below.

Use the provided Context Data to uniquely identify the exact company and avoid mixing it up with entities of similar names.

---
CONTEXT DATA:
Project Name: ${projectFormData.name || 'N/A'}
Twitter/X Profile: ${projectFormData.x_link || 'N/A'}
Amount Raised: ${projectFormData.funding || 'N/A'}
Lead Investors: ${projectFormData.lead_investors || 'N/A'}
Project Description: ${projectFormData.description || 'N/A'}
---

Output ONLY a raw JSON array of objects with no markdown, no code blocks, and no extra text.
Use this exact structure:
[
  {
    "name": "Founder Name",
    "role": "CEO / Co-founder / CTO",
    "background": "Ultra-short background, maximum 4 to 7 words (e.g., Ex-Binance, Stanford CS)",
    "twitter_handle": "exact_handle_without_@",
    "linkedin_url": "https://linkedin.com/in/..."
  }
]`);

  const generateTokenomicsAIPrompt = () => setGeneratedTokenomicsPrompt(`You are a cryptocurrency data researcher. Find the exact tokenomics distribution details for the crypto project described below.

Use the provided Context Data to uniquely identify the exact company and avoid mixing it up with entities of similar names.

---
CONTEXT DATA:
Project Name: ${projectFormData.name || 'N/A'}
Twitter/X Profile: ${projectFormData.x_link || 'N/A'}
Amount Raised: ${projectFormData.funding || 'N/A'}
Lead Investors: ${projectFormData.lead_investors || 'N/A'}
Project Description: ${projectFormData.description || 'N/A'}
---

Output ONLY a raw JSON object with no markdown, no code blocks, and no extra text. Use null if a specific data point is completely unknown.
Use this exact structure:
{
  "ticker": "TOKEN",
  "total_supply": "1000000000",
  "community_allocation_percentage": 50.5,
  "investor_allocation_percentage": 15.0,
  "team_allocation_percentage": 20.0,
  "ecosystem_allocation_percentage": 14.5,
  "tge_date": "Q3 2024 / confirmed date / null",
  "vesting_notes": "Brief details on team/investor cliffs"
}`);

  const generateCompetitorAIPrompt = () => setGeneratedCompetitorPrompt(`You are a cryptocurrency data researcher. Find the top 5 direct competitors for the crypto project described below and perform a comparative analysis.

Use the provided Context Data to uniquely identify the exact company:
---
CONTEXT DATA:
Project Name: ${projectFormData.name || 'N/A'}
Twitter/X Profile: ${projectFormData.x_link || 'N/A'}
Project Description: ${projectFormData.description || 'N/A'}
---

Output ONLY a raw JSON object with no markdown formatting, no code blocks, and no extra text.
Use this exact JSON structural schema:
{
  "project_similarity": "A brief 1-2 sentence comparison explaining if the project is similar to its competitors or what specific extra technology/differentiator it brings to the market.",
  "competitors": [
    {
      "name": "Competitor Name",
      "domain": "competitordomain.com",
      "x_url": "https://x.com/exact_profile_handle",
      "followers": "Follower count string (e.g., 450K, 1.2M)",
      "past_airdrops": ["Season 1 (2024)", "Token Airdrop (2025)"],
      "average_airdrop_usd": 1250
    }
  ]
}

Ensure there are a maximum of 5 competitor objects inside the "competitors" array. If some metrics are unknown, use rough market estimates or historical distribution tracking values for average_airdrop_usd. For the domain, provide the exact root website URL without https (e.g., spectral.finance).`);

  // --- ARTICLE EDITOR FUNCTIONS copied from Manageas.jsx ---
  const insertFormatting = (prefix, suffix = '') => { const textarea = document.getElementById('markdown-editor'); if (!textarea) return; const start = textarea.selectionStart; const end = textarea.selectionEnd; const current = taskFormData.tutorial_markdown || ''; const selected = current.substring(start, end); setTaskField('tutorial_markdown', current.substring(0, start) + prefix + selected + suffix + current.substring(end)); setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + prefix.length, end + prefix.length); }, 10); };
  const insertAtCursor = (text) => { const textarea = document.getElementById('markdown-editor'); if (!textarea) return; const start = textarea.selectionStart; const end = textarea.selectionEnd; const current = taskFormData.tutorial_markdown || ''; setTaskField('tutorial_markdown', current.substring(0, start) + text + current.substring(end)); setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + text.length, start + text.length); }, 10); };
  const handleImageUpload = async (event) => { const file = event.target.files[0]; if (!file) return; setIsImageUploading(true); try { const body = new FormData(); body.append('image', file); const response = await fetch('https://api.imgbb.com/1/upload?key=1de173c5b97e6a61196a6f5153b93960', { method: 'POST', body }); const data = await response.json(); if (!data.success) throw new Error(data.error?.message || 'Upload failed'); insertAtCursor(`\n![Screenshot](${data.data.url})\n`); } catch (error) { window.alert(`Upload failed: ${error.message}`); } finally { setIsImageUploading(false); event.target.value = ''; } };
  const handleAIEnhance = async () => { if (!taskFormData.tutorial_markdown) return window.alert('Write a rough draft first!'); setIsAIEnhancing(true); try { const { data, error } = await supabase.functions.invoke('enhance-article', { body: { markdown: taskFormData.tutorial_markdown } }); if (error) throw error; if (data?.enhanced_markdown) setTaskField('tutorial_markdown', data.enhanced_markdown); } catch (error) { window.alert(`AI enhancement failed: ${error.message}`); } finally { setIsAIEnhancing(false); } };
  const generateTaskJSON = async (markdown) => {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!groqKey) {
      console.warn('No Groq API key found. Please add VITE_GROQ_API_KEY to your .env');
      return {};
    }

    const prompt = `Analyze the following tutorial markdown and extract the information into a strict JSON object.
Do NOT output any markdown formatting, conversational text, or code blocks. Only output the raw JSON.

MARKDOWN TO ANALYZE:
${markdown}

REQUIRED JSON SCHEMA:
{
  "headline": "String - Main title or hook of the task",
  "short_description": "String - Brief 1-2 sentence summary",
  "image_url": "String - The first image URL found in the markdown (or null)",
  "steps": [
    {
      "action": "String - Step description",
      "url": "String - The URL for this step (or null)"
    }
  ],
  "key_actions": ["String", "String"],
  "important_note": "String - Any pro-tips or warnings (or null)",
  "primary_url": "String - The main overarching URL"
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a strict data extraction AI. You must output in valid JSON format.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${await response.text()}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  };

  const handleReject = async (table, id) => { const key = `${table}:${id}`; setProcessingKey(key); setNotice(null); try { const { error } = await supabase.from(table).update({ status: 'rejected' }).eq('id', id); if (error) throw error; if (table === 'pending_projects_review') setProjectsQueue((current) => current.filter((item) => item.id !== id)); else setTasksQueue((current) => current.filter((item) => item.id !== id)); setNotice({ type: 'success', text: 'Item rejected and removed from the queue.' }); } catch (error) { setNotice({ type: 'error', text: `Failed to reject item: ${error.message}` }); } finally { setProcessingKey(null); } };

  const submitProject = async (event) => { event.preventDefault(); if (!projectFormData.name.trim()) { setProjectFormTab('details'); setNotice({ type: 'error', text: 'Project name is required.' }); return; } const key = `pending_projects_review:${projectModal.id}`; setProcessingKey(key); setNotice(null); try {
      const projectData = { slug: projectFormData.slug || '', funding: projectFormData.funding || '', lead_investors: projectFormData.lead_investors || '', x_link: projectFormData.x_link || '', name: projectFormData.name.trim(), logo_url: projectFormData.logo_url || '', galxe_alias: projectFormData.galxe_alias || '', discord_link: projectFormData.discord_link || '', tier: projectFormData.tier || '', status: projectFormData.status || '', airdrop_status: projectFormData.airdrop_status || '', description: projectFormData.description || '', ai_research_data: projectFormData.ai_research_data || '{}', founders_details: safeJSON(projectFormData.founders_details, []), tokenomics_details: safeJSON(projectFormData.tokenomics_details, {}), competitor_analysis: safeJSON(projectFormData.competitor_analysis, { project_similarity: '', competitors: [] }), is_public: projectFormData.is_public !== false };
      const { data: created, error } = await supabase.from('projects').insert([projectData]).select('id').single(); if (error) throw error;
      const validRoles = roles.filter((role) => role.role_name?.trim()); if (validRoles.length) { const { error: roleError } = await supabase.from('discord_roles').insert(validRoles.map((role) => ({ role_name: role.role_name.trim(), requirements: role.requirements || '', perks: role.perks || '', difficulty_level: role.difficulty_level || 'Medium', project_id: created.id }))); if (roleError) throw roleError; }
      const { error: updateError } = await supabase.from('pending_projects_review').update({ status: 'approved' }).eq('id', projectModal.id); if (updateError) throw updateError;
      setProjectsQueue((current) => current.filter((item) => item.id !== projectModal.id)); setProjectOptions((current) => [...current, { id: created.id, name: projectData.name }].sort((a, b) => a.name.localeCompare(b.name))); closeProject(); setNotice({ type: 'success', text: `Project "${projectData.name}" created successfully.` });
    } catch (error) { setNotice({ type: 'error', text: `Failed to create project: ${error.message}` }); } finally { setProcessingKey(null); } };
  const submitTask = async (event) => { event.preventDefault(); const key = `pending_tasks_review:${taskModal.id}`; setProcessingKey(key); setNotice(null); try { const postJson = entryType === 'article' ? await generateTaskJSON(taskFormData.tutorial_markdown) : {}; const taskData = { project_id: taskFormData.project_id, name: taskFormData.name.trim(), recurring: taskFormData.recurring || 'One-time', link: taskFormData.link || '', cost: parseFloat(taskFormData.cost) || 0, time_minutes: parseInt(taskFormData.time_minutes, 10) || 0, end_date: taskFormData.end_date || null, status: taskFormData.status || 'Active', task_category: taskFormData.task_category || null, rpc_url: taskFormData.rpc_url || '', contract_address: taskFormData.contract_address || '', tutorial_markdown: taskFormData.tutorial_markdown || '', post_json: postJson, external_link: taskFormData.external_link || '', source: entryType }; const { error } = await supabase.from('tasks').insert([taskData]); if (error) throw error; const { error: updateError } = await supabase.from('pending_tasks_review').update({ status: 'approved' }).eq('id', taskModal.id); if (updateError) throw updateError; setTasksQueue((current) => current.filter((item) => item.id !== taskModal.id)); closeTask(); setNotice({ type: 'success', text: `Task "${taskData.name}" added successfully.` }); } catch (error) { setNotice({ type: 'error', text: `Failed to add task: ${error.message}` }); } finally { setProcessingKey(null); } };

  const query = searchTerm.trim().toLowerCase();
  const visibleProjects = projectsQueue.filter((item) => !query || [item.suggested_name, item.raw_telegram_text, item.primary_link, item.source_telegram_msg_id].some((value) => String(value || '').toLowerCase().includes(query)));
  const visibleTasks = tasksQueue.filter((item) => !query || [item.project_name, item.extracted_task_name, item.raw_telegram_text, item.link, item.source_telegram_msg_id].some((value) => String(value || '').toLowerCase().includes(query)));
  const visibleQueue = activeTab === 'projects' ? visibleProjects : visibleTasks;

  return <div className="min-h-full bg-white text-slate-900"><div className="mx-auto w-full max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-1 flex items-center gap-2 text-xs font-black uppercase text-blue-600"><Target size={16} /> Telegram Intel Triage</div><h1 className="text-2xl font-black text-slate-950">Research Daily Tasks</h1><p className="mt-1 text-xs font-medium text-slate-500">Review and approve incoming Telegram intelligence.</p></div><button type="button" onClick={() => fetchQueues({ background: true })} disabled={loading || refreshing} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh feeds</button></header>
    {notice && <div className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-xs font-bold ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice"><X size={14} /></button></div>}
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><button type="button" onClick={() => setActiveTab('projects')} className={`rounded-lg px-4 py-2.5 text-xs font-black ${activeTab === 'projects' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'}`}>New Projects <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5">{projectsQueue.length}</span></button><button type="button" onClick={() => setActiveTab('tasks')} className={`rounded-lg px-4 py-2.5 text-xs font-black ${activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'}`}>Project Tasks <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5">{tasksQueue.length}</span></button></div><label className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search intelligence" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-blue-500" /></label></div>
    {loading ? <div className="flex min-h-72 items-center justify-center text-sm font-bold text-slate-400"><RefreshCw size={18} className="mr-2 animate-spin" /> Loading intelligence feeds...</div> : !visibleQueue.length ? <div className="rounded-lg border border-dashed border-slate-200 py-16 text-center"><CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={36} /><h2 className="text-base font-black">Inbox Zero</h2><p className="mt-1 text-xs text-slate-500">No matching intelligence is pending.</p></div> : <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{activeTab === 'projects' ? visibleProjects.map((item) => { const busy = processingKey === `pending_projects_review:${item.id}`; return <article key={item.id} className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-slate-200 p-4 relative flex flex-col justify-between"><div><div className="text-[#3390ec] font-bold text-[13px] hover:underline cursor-pointer">{channelName(item.source_telegram_msg_id)}</div><div className="bg-blue-50 text-blue-700 font-black text-[10px] px-2 py-1 rounded-md mt-2 w-fit">{item.suggested_name || 'Unnamed project'}</div><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-900 mt-3 mb-4 font-sans">{item.raw_telegram_text || ''}</p>{item.primary_link && <a href={item.primary_link} target="_blank" rel="noreferrer" className="mb-4 inline-flex max-w-full items-center gap-1 break-all text-[10px] font-bold text-blue-600 hover:underline"><ExternalLink size={12} /> {item.primary_link}</a>}</div><div className="flex gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => openProject(item)} disabled={busy} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Plus size={14} /> Add Project</button><button type="button" onClick={() => handleReject('pending_projects_review', item.id)} disabled={busy} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60" aria-label={`Reject ${item.suggested_name || 'project'}`}><Trash2 size={14} /></button></div></article>; }) : visibleTasks.map((item) => { const busy = processingKey === `pending_tasks_review:${item.id}`; return <article key={item.id} className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-slate-200 p-4 relative flex flex-col justify-between"><div><div className="text-[#3390ec] font-bold text-[13px] hover:underline cursor-pointer">{channelName(item.source_telegram_msg_id)}</div><div className="bg-blue-50 text-blue-700 font-black text-[10px] px-2 py-1 rounded-md mt-2 w-fit">{item.extracted_task_name || 'Unnamed task'}</div><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-900 mt-3 mb-4 font-sans">{item.raw_telegram_text || ''}</p>{item.link && <a href={item.link} target="_blank" rel="noreferrer" className="mb-4 inline-flex max-w-full items-center gap-1 break-all text-[10px] font-bold text-blue-600 hover:underline"><ExternalLink size={12} /> {item.link}</a>}</div><div className="flex gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => openTask(item)} disabled={busy} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Plus size={14} /> Add Task</button><button type="button" onClick={() => handleReject('pending_tasks_review', item.id)} disabled={busy} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60" aria-label={`Reject ${item.task_name || 'task'}`}><Trash2 size={14} /></button></div></article>; })}</div>}
  </div>

    {projectModal && <ModalShell title="Create Project" subtitle="Projects Database" onClose={closeProject}><form onSubmit={submitProject} className="flex min-h-0 flex-1 flex-col"><div className="custom-scrollbar flex-1 overflow-y-auto p-6"><div className="space-y-5"><div className="flex w-fit rounded-lg border border-slate-200 bg-slate-100 p-1"><button type="button" onClick={() => setProjectFormTab('details')} className={`rounded-md px-4 py-1.5 text-[11px] font-black uppercase ${projectFormTab === 'details' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Project Details</button><button type="button" onClick={() => setProjectFormTab('roles')} className={`rounded-md px-4 py-1.5 text-[11px] font-black uppercase ${projectFormTab === 'roles' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Discord Roles</button></div>
      {projectFormTab === 'details' ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="md:col-span-2"><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-blue-600">Twitter / X URL</label><div className="flex gap-2"><input type="url" value={projectFormData.x_link} onChange={(event) => setProjectField('x_link', event.target.value)} className={`${inputClassName} flex-1`} placeholder="https://twitter.com/..." /><button type="button" onClick={handleAutoFetch} disabled={isAutoFetching} className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:bg-slate-300"><Download size={14} /> {isAutoFetching ? 'Scanning...' : 'Auto-Fetch Logo'}</button></div></div><div><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">Name *</label><input required value={projectFormData.name} onChange={(event) => { const value = event.target.value; setProjectField('name', value); setProjectField('slug', value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')); }} className={inputClassName} /></div><div><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">Logo URL</label><input value={projectFormData.logo_url} onChange={(event) => setProjectField('logo_url', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">Amount Raised</label><input value={projectFormData.funding} onChange={(event) => setProjectField('funding', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">Lead Investors</label><input value={projectFormData.lead_investors} onChange={(event) => setProjectField('lead_investors', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">Galxe Alias</label><input value={projectFormData.galxe_alias} onChange={(event) => setProjectField('galxe_alias', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">Discord URL</label><input value={projectFormData.discord_link} onChange={(event) => setProjectField('discord_link', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">Tier</label><select value={projectFormData.tier} onChange={(event) => setProjectField('tier', event.target.value)} className={inputClassName}><option>Tier 1</option><option>Tier 2</option><option>Tier 3</option></select></div><div><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">Phase</label><select value={projectFormData.status} onChange={(event) => setProjectField('status', event.target.value)} className={inputClassName}><option>Waitlist</option><option>Testnet</option><option>Mainnet</option><option>Point Farming</option><option>TGE</option></select></div><div className="md:col-span-2"><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">Airdrop Status</label><select value={projectFormData.airdrop_status} onChange={(event) => setProjectField('airdrop_status', event.target.value)} className={inputClassName}><option>Confirmed</option><option>Possible</option><option>Unconfirmed</option></select></div><div className="md:col-span-2"><label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500"><input type="checkbox" checked={projectFormData.is_public !== false} onChange={(event) => setProjectField('is_public', event.target.checked)} /> Is Public (visible to users)</label></div><div className="md:col-span-2"><label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">Project Description</label><textarea value={projectFormData.description} onChange={(event) => setProjectField('description', event.target.value)} rows={4} className={`${inputClassName} resize-y`} /></div><PromptBlock icon={<Sparkles size={12} />} label="AI Research Data (JSON)" prompt={generatedPrompt} generate={generateAIPrompt} value={projectFormData.ai_research_data} setValue={(value) => setProjectField('ai_research_data', value)} placeholder="Paste AI output (JSON)" colors={{ label: 'text-green-600', button: 'bg-green-600', text: 'text-green-400' }} /><PromptBlock icon={<Users size={12} />} label="Founders Details (JSON Array)" prompt={generatedFoundersPrompt} generate={generateFoundersAIPrompt} value={projectFormData.founders_details} setValue={(value) => setProjectField('founders_details', value)} placeholder="Paste AI output (JSON array)" colors={{ label: 'text-blue-600', button: 'bg-blue-600', text: 'text-blue-400' }} /><PromptBlock icon={<Coins size={12} />} label="Tokenomics Details (JSON)" prompt={generatedTokenomicsPrompt} generate={generateTokenomicsAIPrompt} value={projectFormData.tokenomics_details} setValue={(value) => setProjectField('tokenomics_details', value)} placeholder="Paste AI output (JSON object)" colors={{ label: 'text-purple-600', button: 'bg-purple-600', text: 'text-purple-400' }} /><PromptBlock icon={<Sparkles size={12} />} label="Competitor Matrix Analysis (JSON)" prompt={generatedCompetitorPrompt} generate={generateCompetitorAIPrompt} value={projectFormData.competitor_analysis} setValue={(value) => setProjectField('competitor_analysis', value)} placeholder="Paste AI output" colors={{ label: 'text-amber-600', button: 'bg-amber-600', text: 'text-amber-400' }} /></div> : <div className="space-y-4">{roles.map((role, index) => <div key={index} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4"><button type="button" onClick={() => setRoles((current) => current.filter((_, roleIndex) => roleIndex !== index))} className="absolute right-3 top-3 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button><div className="grid gap-3 md:grid-cols-2"><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Role Name</label><input value={role.role_name} onChange={(event) => setRoles((current) => current.map((entry, roleIndex) => roleIndex === index ? { ...entry, role_name: event.target.value } : entry))} className={inputClassName} /></div><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Difficulty</label><select value={role.difficulty_level} onChange={(event) => setRoles((current) => current.map((entry, roleIndex) => roleIndex === index ? { ...entry, difficulty_level: event.target.value } : entry))} className={inputClassName}><option>Easy</option><option>Medium</option><option>Hard</option></select></div><div className="md:col-span-2"><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Requirements</label><textarea value={role.requirements} onChange={(event) => setRoles((current) => current.map((entry, roleIndex) => roleIndex === index ? { ...entry, requirements: event.target.value } : entry))} rows={2} className={`${inputClassName} resize-none`} /></div><div className="md:col-span-2"><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Perks</label><input value={role.perks} onChange={(event) => setRoles((current) => current.map((entry, roleIndex) => roleIndex === index ? { ...entry, perks: event.target.value } : entry))} className={inputClassName} /></div></div></div>)}<button type="button" onClick={() => setRoles((current) => [...current, { role_name: '', requirements: '', perks: '', difficulty_level: 'Medium' }])} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-xs font-bold text-slate-500 hover:border-blue-300 hover:text-blue-600"><Plus size={16} /> Add Another Role</button></div>}
    </div></div><div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 px-6 py-4"><button type="button" onClick={closeProject} className="rounded-lg border border-slate-300 px-5 py-2 text-xs font-bold text-slate-700">Cancel</button><button type="submit" disabled={processingKey === `pending_projects_review:${projectModal.id}`} className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60">{processingKey === `pending_projects_review:${projectModal.id}` ? 'Saving...' : 'Deploy Project'}</button></div></form></ModalShell>}

    {taskModal && <ModalShell title="Add Task" subtitle={`Add to ${taskModal.project_name || 'Projects Database'}`} onClose={closeTask}><form onSubmit={submitTask} className="flex min-h-0 flex-1 flex-col"><div className="custom-scrollbar flex-1 overflow-y-auto p-6"><div className="space-y-5"><div className="flex w-fit rounded-lg border border-slate-200 bg-slate-100 p-1"><button type="button" onClick={() => setEntryType('standard')} className={`rounded-md px-4 py-1.5 text-[11px] font-black uppercase ${entryType === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Standard Task</button><button type="button" onClick={() => setEntryType('article')} className={`rounded-md px-4 py-1.5 text-[11px] font-black uppercase ${entryType === 'article' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>Article / Guide</button></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="md:col-span-2"><label className="mb-1 block text-[10px] font-black uppercase text-blue-600">Target Project *</label><select required value={taskFormData.project_id} onChange={(event) => setTaskField('project_id', event.target.value)} className={inputClassName}><option value="">-- Choose Project --</option>{projectOptions.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>{entryType === 'standard' ? <><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Task Name *</label><input required value={taskFormData.name} onChange={(event) => setTaskField('name', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Recurring</label><select value={taskFormData.recurring} onChange={(event) => setTaskField('recurring', event.target.value)} className={inputClassName}><option>One-time</option><option>Daily</option><option>Weekly</option></select></div><div className="md:col-span-2"><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Task Link</label><input type="url" value={taskFormData.link} onChange={(event) => setTaskField('link', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Cost ($)</label><input type="number" value={taskFormData.cost} onChange={(event) => setTaskField('cost', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Time (Min)</label><input type="number" value={taskFormData.time_minutes} onChange={(event) => setTaskField('time_minutes', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">End Date</label><input type="date" value={taskFormData.end_date} onChange={(event) => setTaskField('end_date', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Status</label><select value={taskFormData.status} onChange={(event) => setTaskField('status', event.target.value)} className={inputClassName}><option>Active</option><option>Ending Soon</option><option>High Priority</option><option>Ended</option></select></div><div className="md:col-span-2"><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Task Category / Milestone</label><select value={taskFormData.task_category} onChange={(event) => setTaskField('task_category', event.target.value)} className={inputClassName}><option value="">Select a category...</option><option>Waitlist</option><option>Testnet Live</option><option>Mainnet Launched</option><option>Social Quest</option><option>Airdrop Live</option></select></div><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Network RPC URL</label><input type="url" value={taskFormData.rpc_url} onChange={(event) => setTaskField('rpc_url', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Target Contract</label><input value={taskFormData.contract_address} onChange={(event) => setTaskField('contract_address', event.target.value)} className={inputClassName} /></div></> : <><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Article Title *</label><input required value={taskFormData.name} onChange={(event) => setTaskField('name', event.target.value)} className={inputClassName} /></div><div><label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Cover Image URL</label><input value={taskFormData.external_link} onChange={(event) => setTaskField('external_link', event.target.value)} className={inputClassName} /></div><div className="md:col-span-2"><label className="mb-1 block text-[10px] font-black uppercase text-purple-600">Article Editor (Markdown)</label><div className="overflow-hidden rounded-xl border border-slate-200"><div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2"><button type="button" onClick={() => insertFormatting('**', '**')} className="flex items-center gap-1 rounded border bg-white px-2.5 py-1 text-[11px] font-bold"><Bold size={12} /> Bold</button><button type="button" onClick={() => insertFormatting('*', '*')} className="flex items-center gap-1 rounded border bg-white px-2.5 py-1 text-[11px] font-bold"><Italic size={12} /> Italic</button><button type="button" onClick={() => insertFormatting('[', '](url)')} className="flex items-center gap-1 rounded border bg-white px-2.5 py-1 text-[11px] font-bold"><LinkIcon size={12} /> Link</button><button type="button" onClick={() => insertFormatting('\n- ')} className="flex items-center gap-1 rounded border bg-white px-2.5 py-1 text-[11px] font-bold"><List size={12} /> Bullet</button><button type="button" onClick={() => insertAtCursor('\n## ')} className="rounded border bg-white px-2.5 py-1 text-[11px] font-bold">H2</button><button type="button" onClick={() => insertAtCursor('\n### Step X: Title\n1. Do this...\n2. Then this...\n')} className="rounded border bg-white px-2.5 py-1 text-[11px] font-bold">Step</button><button type="button" onClick={() => insertAtCursor('\n> **Pro Tip:** \n')} className="flex items-center gap-1 rounded border bg-white px-2.5 py-1 text-[11px] font-bold"><Lightbulb size={12} /> Tip</button><label className="flex cursor-pointer items-center gap-1 rounded border bg-white px-2.5 py-1 text-[11px] font-bold">{isImageUploading ? '⏳ Uploading...' : <><ImageIcon size={12} /> Image</>}<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isImageUploading} /></label><button type="button" onClick={handleAIEnhance} disabled={isAIEnhancing} className="flex items-center gap-1 rounded border border-purple-200 bg-purple-100 px-2.5 py-1 text-[11px] font-bold text-purple-700">{isAIEnhancing ? '✨ Processing...' : <><Sparkles size={12} /> AI Polish</>}</button></div><textarea id="markdown-editor" required value={taskFormData.tutorial_markdown} onChange={(event) => setTaskField('tutorial_markdown', event.target.value)} className="h-64 w-full resize-y p-4 font-mono text-xs leading-relaxed outline-none" placeholder="Start writing your guide here..." /></div></div></>}</div></div></div><div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 px-6 py-4"><button type="button" onClick={closeTask} className="rounded-lg border border-slate-300 px-5 py-2 text-xs font-bold text-slate-700">Cancel</button><button type="submit" disabled={!taskFormData.project_id || processingKey === `pending_tasks_review:${taskModal.id}`} className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-black uppercase tracking-widest text-white disabled:bg-slate-300">{processingKey === `pending_tasks_review:${taskModal.id}` ? 'Saving...' : 'Deploy Task'}</button></div></form></ModalShell>}
  </div>;
}