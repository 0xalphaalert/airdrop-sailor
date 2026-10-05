import React, { useCallback, useEffect, useState } from 'react';
import {
  Database, Bold, CheckCircle2, Coins, Copy, Download, ExternalLink, Image as ImageIcon,
  Italic, Lightbulb, Link as LinkIcon, List, Plus, RefreshCw, Search,
  Sparkles, Target, Trash2, Users, X, LayoutTemplate, MessageSquare, Twitter, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { supabase2 } from '../supabaseClient2';

// --- HELPERS ---
const timeAgo = (dateString) => {
  if (!dateString) return '—';
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (Number.isNaN(diffMs)) return '—';
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffMs / 86400000)}d ago`;
};

const inputClassName = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const emptyProject = { slug: '', funding: '', lead_investors: '', x_link: '', name: '', logo_url: '', galxe_alias: '', discord_link: '', tier: 'Tier 3', status: 'Waitlist', airdrop_status: 'Unconfirmed', description: '', ai_research_data: '{}', founders_details: '[]', tokenomics_details: '{}', competitor_analysis: '{"project_similarity":"","competitors":[]}', is_public: true };
const emptyStandaloneTask = { project_id: '', name: '', recurring: 'One-time', link: '', cost: 0, time_minutes: 0, sail_reward: '', end_date: '', status: 'Active', task_category: '', rpc_url: '', contract_address: '', tutorial_markdown: '', external_link: '' };
const emptyFunding = { project_name: '', x_link: '', funding_amount: '', round: '', lead_investor: '', category: '', sector: '', project_logo: '', ai_research_data: '{}', founders_details: '[]' };

export default function ResearchGigs() {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState(null);
  
  // Workflow States
  const [selectedGig, setSelectedGig] = useState(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [editorType, setEditorType] = useState(null); 
  const [processing, setProcessing] = useState(false);

  // Form States
  const [projectData, setProjectData] = useState(emptyProject);
  const [roles, setRoles] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]); 

  // Standalone task/funding states
  const [standaloneTaskData, setStandaloneTaskData] = useState(emptyStandaloneTask);
  const [standaloneTaskEntryType, setStandaloneTaskEntryType] = useState('standard');
  const [fundingData, setFundingData] = useState(emptyFunding);
  const [projectOptions, setProjectOptions] = useState([]);
  
  // UI States for Forms
  const [projectFormTab, setProjectFormTab] = useState('details'); 
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isAIEnhancing, setIsAIEnhancing] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false); 

  // Prompts
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedFoundersPrompt, setGeneratedFoundersPrompt] = useState('');
  const [generatedTokenomicsPrompt, setGeneratedTokenomicsPrompt] = useState('');
  const [generatedCompetitorPrompt, setGeneratedCompetitorPrompt] = useState('');
  const [generatedMasterPrompt, setGeneratedMasterPrompt] = useState('');

  const fetchGigs = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [xRes, tgRes, projRes] = await Promise.all([
        supabase.from('research_required').select('*').order('created_at', { ascending: false }),
        supabase2.from('telegram_inbound_queue').select('*').eq('status', 'processed').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name').order('name', { ascending: true })
      ]);

      if (xRes.error) throw xRes.error;
      if (tgRes.error) throw tgRes.error;
      if (projRes.error) throw projRes.error;

      const formattedX = (xRes.data || []).map(item => ({ id: item.id, source: 'X', author: item.x_handle || 'Unknown', content: item.content || '', url: item.x_url, date: item.date_posted || item.created_at, raw: item }));
      const formattedTg = (tgRes.data || []).map(item => ({ id: item.id, source: 'Telegram', author: item.channel_name || 'Unknown Channel', content: item.raw_text || '', url: null, date: item.created_at, raw: item }));

      setGigs([...formattedX, ...formattedTg].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setProjectOptions(projRes.data || []);
    } catch (error) {
      setNotice({ type: 'error', text: `Failed to load gigs: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGigs(); }, [fetchGigs]);

  const deleteGig = async (gigId, source) => {
    if (source === 'X') {
      const { error } = await supabase.from('research_required').delete().eq('id', gigId);
      if (error) throw error;
    } else {
      const { error } = await supabase2.from('telegram_inbound_queue').delete().eq('id', gigId);
      if (error) throw error;
    }
    setGigs(prev => prev.filter(g => g.id !== gigId));
  };

  const handleDeleteClick = async (gigId, source) => {
    if (!window.confirm('Delete this gig completely?')) return;
    try { await deleteGig(gigId, source); setNotice({ type: 'success', text: 'Gig removed.' }); } catch (error) {}
  };

  const openTypeSelector = (gig) => { setSelectedGig(gig); setShowTypeSelector(true); };

  const startResearch = (type) => {
    setEditorType(type);
    setShowTypeSelector(false);
    
    const safeContent = selectedGig?.content || '';
    setProjectData({ ...emptyProject, description: safeContent.substring(0, 300) });
    setRoles([{ role_name: '', requirements: '', perks: '', difficulty_level: 'Medium', isExpanded: true }]);
    setProjectTasks([{ ...emptyStandaloneTask, entryType: 'standard', isExpanded: true }]);
    
    setStandaloneTaskData({ ...emptyStandaloneTask, tutorial_markdown: safeContent });
    setFundingData({ ...emptyFunding });
    setGeneratedMasterPrompt('');
    setProjectFormTab('details');
  };

  const cancelResearch = () => { setSelectedGig(null); setEditorType(null); setGeneratedMasterPrompt(''); };

  // --- GROQ AI TASK EXTRACTION ---
  const generateTaskJSON = async (markdown) => {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!groqKey || !markdown) return {};
    const prompt = `Analyze the following tutorial markdown and extract the information into a strict JSON object. Do NOT output any markdown formatting, conversational text, or code blocks. Only output the raw JSON.\n\nMARKDOWN TO ANALYZE:\n${markdown}\n\nREQUIRED JSON SCHEMA:\n{\n  "headline": "String - Main title or hook of the task",\n  "short_description": "String - Brief 1-2 sentence summary",\n  "image_url": "String - The first image URL found in the markdown (or null)",\n  "steps": [\n    {\n      "action": "String - Step description",\n      "url": "String - The URL for this step (or null)"\n    }\n  ],\n  "key_actions": ["String", "String"],\n  "important_note": "String - Any pro-tips or warnings (or null)",\n  "primary_url": "String - The main overarching URL"\n}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [ { role: 'system', content: 'You are a strict data extraction AI. You must output in valid JSON format.' }, { role: 'user', content: prompt } ], temperature: 0.1, response_format: { type: "json_object" } })
      });
      if (!response.ok) throw new Error("Groq API Error");
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.warn("Groq Extraction Skipped/Failed:", e);
      return {};
    }
  };

  // --- AI AUTO FILL ---
  const handleAutoFillFromSource = async () => {
    setIsAutoFilling(true);
    setNotice(null);
    try {
      const { data, error } = await supabase.functions.invoke('autofill-gig', {
        body: {
          content: selectedGig?.content || '',
          editorType: editorType,
          author: selectedGig?.author || '',
          url: selectedGig?.url || ''
        }
      });

      if (error) throw error;
      if (!data) throw new Error("No data returned from AI");

      if (editorType === 'project') {
        setProjectData(prev => ({
          ...prev,
          name: data.name || prev.name,
          x_link: data.x_link || prev.x_link,
          funding: data.funding || prev.funding,
          lead_investors: data.lead_investors || prev.lead_investors,
          galxe_alias: data.galxe_alias || prev.galxe_alias,
          discord_link: data.discord_link || prev.discord_link,
          tier: data.tier || prev.tier,
          status: data.status || prev.status,
          airdrop_status: data.airdrop_status || prev.airdrop_status,
          description: data.description || prev.description,
          ai_research_data: data.ai_research_data && Object.keys(data.ai_research_data).length ? JSON.stringify(data.ai_research_data, null, 2) : prev.ai_research_data,
          founders_details: data.founders_details && data.founders_details.length ? JSON.stringify(data.founders_details, null, 2) : prev.founders_details,
          tokenomics_details: data.tokenomics_details && Object.keys(data.tokenomics_details).length ? JSON.stringify(data.tokenomics_details, null, 2) : prev.tokenomics_details,
          competitor_analysis: data.competitor_analysis && Object.keys(data.competitor_analysis).length ? JSON.stringify(data.competitor_analysis, null, 2) : prev.competitor_analysis
        }));

        if (data.extracted_tasks && Array.isArray(data.extracted_tasks) && data.extracted_tasks.length > 0) {
          const newTasks = data.extracted_tasks.map(t => ({
            ...emptyStandaloneTask,
            name: t.name || '',
            link: t.link || '',
            cost: t.cost || 0,
            time_minutes: t.time_minutes || 0,
            tutorial_markdown: t.tutorial_markdown || '',
            entryType: t.entryType || 'standard',
            isExpanded: true
          }));
          setProjectTasks(newTasks);
        }
      } 
      else if (editorType === 'task') {
        setStandaloneTaskEntryType(data.entryType || 'standard');
        setStandaloneTaskData(prev => ({
          ...prev,
          name: data.name || prev.name,
          recurring: data.recurring || prev.recurring,
          link: data.link || prev.link,
          cost: data.cost || prev.cost,
          time_minutes: data.time_minutes || prev.time_minutes,
          task_category: data.task_category || prev.task_category,
          rpc_url: data.rpc_url || prev.rpc_url,
          contract_address: data.contract_address || prev.contract_address,
          tutorial_markdown: data.tutorial_markdown || prev.tutorial_markdown
        }));
      } 
      else if (editorType === 'fundraising') {
        setFundingData(prev => ({
          ...prev,
          project_name: data.project_name || prev.project_name,
          x_link: data.x_link || prev.x_link,
          funding_amount: data.funding_amount || prev.funding_amount,
          round: data.round || prev.round,
          lead_investor: data.lead_investor || prev.lead_investor,
          category: data.category || prev.category,
          sector: data.sector || prev.sector,
          ai_research_data: data.ai_research_data && Object.keys(data.ai_research_data).length ? JSON.stringify(data.ai_research_data, null, 2) : prev.ai_research_data,
          founders_details: data.founders_details && data.founders_details.length ? JSON.stringify(data.founders_details, null, 2) : prev.founders_details
        }));
      }
      
      setNotice({ type: 'success', text: 'AI Extraction Complete!' });
    } catch (error) {
      console.error(error);
      setNotice({ type: 'error', text: `Auto-fill failed: ${error.message}` });
    } finally {
      setIsAutoFilling(false);
    }
  };

  // --- SUBMIT HANDLER (BULLETPROOF FIXES) ---
  const handleDeploy = async () => {
    setProcessing(true);
    setNotice(null);
    try {
      if (editorType === 'project') {
        const payload = {
          ...projectData,
          name: projectData.name.trim(),
          ai_research_data: projectData.ai_research_data || '{}',
          founders_details: JSON.parse(projectData.founders_details || '[]'),
          tokenomics_details: JSON.parse(projectData.tokenomics_details || '{}'),
          competitor_analysis: JSON.parse(projectData.competitor_analysis || '{"project_similarity":"","competitors":[]}')
        };
        const { data: created, error } = await supabase.from('projects').insert([payload]).select('id').single();
        if (error) {
          if (error.code === '23505') throw new Error("A Project with this Name or Slug already exists (Duplicate).");
          throw new Error(`Project Error: ${error.message}`);
        }
        
        const validRoles = roles.filter(r => r.role_name?.trim());
        if (validRoles.length) {
          const rolesToInsert = validRoles.map(r => {
            const { isExpanded, ...dbRole } = r; 
            return { ...dbRole, project_id: created.id };
          });
          const { error: roleError } = await supabase.from('discord_roles').insert(rolesToInsert);
          if (roleError) console.warn("Discord Role Error:", roleError.message);
        }

        const validTasks = projectTasks.filter(t => t.name?.trim());
        for (const t of validTasks) {
          let generatedPostJson = {};
          if (t.tutorial_markdown && t.tutorial_markdown.trim() !== '') {
            try {
              generatedPostJson = await generateTaskJSON(t.tutorial_markdown);
            } catch (err) {
              console.warn("Groq JSON generation skipped due to error.");
            }
          }
          const { isExpanded, entryType, ...dbTask } = t;
          
          // SAFETY FIX: Convert empty strings to null for strict Postgres columns
          const taskPayload = {
            ...dbTask,
            project_id: created.id,
            cost: parseFloat(dbTask.cost) || 0,
            time_minutes: parseInt(dbTask.time_minutes) || 0,
            sail_reward: parseInt(dbTask.sail_reward) || 0,
            end_date: dbTask.end_date || null,
            task_category: dbTask.task_category || null,
            post_json: generatedPostJson,
            source: entryType
          };

          const { error: taskError } = await supabase.from('tasks').insert([taskPayload]);
          if (taskError) {
             if (taskError.code === '23505') throw new Error(`Project Task Error: A task with this name/link already exists (Duplicate).`);
             throw new Error(`Project Task Error: ${taskError.message}`);
          }
        }
      } 
      else if (editorType === 'task') {
        if (!standaloneTaskData.project_id) {
          throw new Error("You must select a Target Project before deploying this task.");
        }

        let generatedPostJson = {};
        if (standaloneTaskData.tutorial_markdown && standaloneTaskData.tutorial_markdown.trim() !== '') {
           try {
             generatedPostJson = await generateTaskJSON(standaloneTaskData.tutorial_markdown);
           } catch(err) {
             console.warn("Groq JSON generation skipped due to error.");
           }
        }
        
        // SAFETY FIX: Convert empty strings to null
        const payload = { 
          ...standaloneTaskData, 
          cost: parseFloat(standaloneTaskData.cost) || 0,
          time_minutes: parseInt(standaloneTaskData.time_minutes) || 0,
          sail_reward: parseInt(standaloneTaskData.sail_reward) || 0,
          end_date: standaloneTaskData.end_date || null, 
          task_category: standaloneTaskData.task_category || null,
          source: standaloneTaskEntryType,
          post_json: generatedPostJson
        };
        
        const { error } = await supabase.from('tasks').insert([payload]);
        if (error) {
            if (error.code === '23505') throw new Error(`Standalone Task Error: This task already exists in your database (Duplicate).`);
            throw new Error(`Standalone Task Error: ${error.message}`);
        }

        if (standaloneTaskData.task_category) {
          await supabase.from('projects').update({ status: standaloneTaskData.task_category }).eq('id', standaloneTaskData.project_id);
        }
      } 
      else if (editorType === 'fundraising') {
        const payload = { ...fundingData, founders_details: JSON.parse(fundingData.founders_details || '[]') };
        const { error } = await supabase.from('funding_opportunities').insert([payload]);
        if (error) throw new Error(`Funding Error: ${error.message}`);
      }

      await deleteGig(selectedGig.id, selectedGig.source);
      setNotice({ type: 'success', text: `Successfully deployed ${editorType} and removed source gig.` });
      cancelResearch();
    } catch (error) {
      setNotice({ type: 'error', text: `Deployment failed: ${error.message}` });
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoFetch = async () => {
    if (!projectData.x_link) return alert('Please enter a Twitter/X URL first');
    setIsAutoFetching(true);
    try {
      const handle = projectData.x_link.match(/(?:twitter\.com|x\.com)\/([^/?]+)/i)?.[1];
      if (!handle) throw new Error('Invalid Twitter/X URL format');
      const { data, error } = await supabase.functions.invoke('upload-logo', { body: { handle } });
      if (error) throw error;
      setProjectData(prev => ({ ...prev, logo_url: data?.url || `https://api.dicebear.com/7.x/shapes/svg?seed=${handle}` }));
    } catch (error) {
      alert(`Auto-fetch failed: ${error.message}`);
    } finally { setIsAutoFetching(false); }
  };

  // --- Prompts ---
  const generateMasterAIPrompt = () => { setGeneratedMasterPrompt(`You are a cryptocurrency data researcher. Analyze the project described below and output ONLY a valid JSON object containing four specific keys. Do NOT output markdown formatting or code blocks.\n\n---\nCONTEXT DATA:\nProject Name: ${projectData.name || 'N/A'}\nTwitter/X Profile: ${projectData.x_link || 'N/A'}\nAmount Raised: ${projectData.funding || 'N/A'}\nLead Investors: ${projectData.lead_investors || 'N/A'}\nProject Description: ${projectData.description || 'N/A'}\n---\n\nUse this exact JSON schema:\n{\n  "master_research": { "summary": "1-2 sentence overview of the project and its goals", "funding_strength": "Brief analysis of funding", "social_signals": "Brief analysis of social presence", "airdrop_signals": "Brief analysis of airdrop potential" },\n  "master_founders": [ { "name": "Founder Name", "role": "CEO / Co-founder / CTO", "background": "Ultra-short background, max 4-7 words", "twitter_handle": "exact_handle_without_@", "linkedin_url": "https://linkedin.com/in/..." } ],\n  "master_tokenomics": { "ticker": "TOKEN", "total_supply": "1000000000", "community_allocation_percentage": 50.5, "investor_allocation_percentage": 15.0, "team_allocation_percentage": 20.0, "ecosystem_allocation_percentage": 14.5, "tge_date": "Q3 2024 / confirmed date / null", "vesting_notes": "Brief details on cliffs" },\n  "master_competitors": { "project_similarity": "Brief 1-2 sentence comparison explaining market differentiators.", "competitors": [ { "name": "Competitor Name", "domain": "competitordomain.com", "x_url": "https://x.com/exact_profile_handle", "followers": "450K", "past_airdrops": ["Season 1 (2024)"], "average_airdrop_usd": 1250 } ] }\n}`); };
  const handleMasterAIPaste = (value) => { try { const data = JSON.parse(value); setProjectData(prev => ({ ...prev, ai_research_data: data.master_research ? JSON.stringify(data.master_research, null, 2) : prev.ai_research_data, founders_details: data.master_founders ? JSON.stringify(data.master_founders, null, 2) : prev.founders_details, tokenomics_details: data.master_tokenomics ? JSON.stringify(data.master_tokenomics, null, 2) : prev.tokenomics_details, competitor_analysis: data.master_competitors ? JSON.stringify(data.master_competitors, null, 2) : prev.competitor_analysis })); } catch (e) {} };
  const generateAIPrompt = () => setGeneratedPrompt(`Analyze the following crypto project deeply.\nFocus ONLY on:\n* Funding strength\n* Investors quality\n* Founder credibility\n* Social signals\n* Airdrop signals\n* Token status\n* Product tracking behavior\n* Competition\n\nProject Data:\nName: ${projectData.name || ''}\nFunding: ${projectData.funding || ''}\nInvestors: ${projectData.lead_investors || ''}\nTwitter: ${projectData.x_link || ''}\nDescription: ${projectData.description || ''}\n\n---\nReturn ONLY JSON matching your required schema.`);
  const generateFoundersAIPrompt = () => setGeneratedFoundersPrompt(`Find core founders for: ${projectData.name || 'N/A'}. Output ONLY raw JSON array: [{"name":"", "role":"", "background":"", "twitter_handle":"", "linkedin_url":""}]`);
  const generateTokenomicsAIPrompt = () => setGeneratedTokenomicsPrompt(`Find exact tokenomics for: ${projectData.name || 'N/A'}. Output ONLY raw JSON object: {"ticker":"", "total_supply":"", "community_allocation_percentage":0, "investor_allocation_percentage":0, "team_allocation_percentage":0, "ecosystem_allocation_percentage":0, "tge_date":"", "vesting_notes":""}`);
  const generateCompetitorAIPrompt = () => setGeneratedCompetitorPrompt(`Find top 5 direct competitors for: ${projectData.name || 'N/A'}. Output ONLY raw JSON object: {"project_similarity":"", "competitors":[{"name":"", "domain":"", "x_url":"", "followers":"", "past_airdrops":[], "average_airdrop_usd":0}]}`);

  // --- MARKDOWN DYNAMIC HELPERS ---
  const handleMarkdownAction = (actionType, prefix, suffix, taskId, isStandalone = false) => {
    const textarea = document.getElementById(taskId);
    if (!textarea) return;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    
    if (isStandalone) {
      const currentVal = standaloneTaskData.tutorial_markdown || '';
      const textToInsert = actionType === 'format' ? prefix + currentVal.substring(startPos, endPos) + suffix : prefix;
      setStandaloneTaskData(prev => ({ ...prev, tutorial_markdown: currentVal.substring(0, startPos) + textToInsert + currentVal.substring(actionType === 'format' ? endPos : startPos) }));
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(startPos + prefix.length, actionType === 'format' ? endPos + prefix.length : startPos + textToInsert.length); }, 10);
    } else {
      const tIndex = parseInt(taskId.replace('markdown-editor-task-', ''));
      const currentVal = projectTasks[tIndex].tutorial_markdown || '';
      const textToInsert = actionType === 'format' ? prefix + currentVal.substring(startPos, endPos) + suffix : prefix;
      const newTasks = [...projectTasks];
      newTasks[tIndex].tutorial_markdown = currentVal.substring(0, startPos) + textToInsert + currentVal.substring(actionType === 'format' ? endPos : startPos);
      setProjectTasks(newTasks);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(startPos + prefix.length, actionType === 'format' ? endPos + prefix.length : startPos + textToInsert.length); }, 10);
    }
  };

  const handleDynamicImageUpload = async (e, taskId, isStandalone = false) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImageUploading(true);
    try {
      const uploadData = new FormData(); uploadData.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=1de173c5b97e6a61196a6f5153b93960`, { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.success) handleMarkdownAction('insert', `\n![Screenshot](${data.data.url})\n`, '', taskId, isStandalone);
      else throw new Error("Upload failed");
    } catch (err) { alert(err.message); } finally { setIsImageUploading(false); }
  };

  const handleDynamicAIEnhance = async (taskId, isStandalone = false) => {
    const markdown = isStandalone ? standaloneTaskData.tutorial_markdown : projectTasks[parseInt(taskId.replace('markdown-editor-task-', ''))].tutorial_markdown;
    if (!markdown) return alert("Write a rough draft first!");
    setIsAIEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-article', { body: { markdown } });
      if (error) throw error;
      if (data?.enhanced_markdown) {
        if (isStandalone) setStandaloneTaskData(p => ({ ...p, tutorial_markdown: data.enhanced_markdown }));
        else {
          const newTasks = [...projectTasks];
          newTasks[parseInt(taskId.replace('markdown-editor-task-', ''))].tutorial_markdown = data.enhanced_markdown;
          setProjectTasks(newTasks);
        }
      }
    } catch (err) { alert(err.message); } finally { setIsAIEnhancing(false); }
  };

  const query = searchTerm.toLowerCase();
  const visibleGigs = gigs
    .filter(g => activeTab === 'all' || (g.source || '').toLowerCase() === activeTab)
    .filter(g => (g.content || '').toLowerCase().includes(query) || (g.author || '').toLowerCase().includes(query));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6">
      
      {!editorType ? (
        // ================= INBOX VIEW =================
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600"><Search size={16} /> Research Gigs Inbox</div>
              <h1 className="text-3xl font-black text-slate-950 tracking-tight">Gig Triage</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">Process incoming X and Telegram signals into research data.</p>
            </div>
            <button onClick={fetchGigs} className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50 w-fit"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
          </header>

          {notice && (
            <div className={`p-4 rounded-xl border font-bold text-sm flex justify-between ${notice.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {notice.text} <button onClick={() => setNotice(null)}><X size={16}/></button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
              {[ { id: 'all', label: 'All Gigs' }, { id: 'x', label: 'X (Twitter)' }, { id: 'telegram', label: 'Telegram' } ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:max-w-xs shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search content or author..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? <div className="col-span-full py-20 text-center font-bold text-slate-400">Loading signals...</div> :
             visibleGigs.length === 0 ? <div className="col-span-full py-20 text-center font-bold text-slate-400 border border-dashed border-slate-300 rounded-xl">No gigs found in inbox.</div> :
             visibleGigs.map(gig => (
              <div key={gig.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col relative">
                <div className="flex items-center justify-between mb-3">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${gig.source === 'X' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    {gig.source === 'X' ? <Twitter size={12}/> : <MessageSquare size={12}/>} {gig.source}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{timeAgo(gig.date)}</span>
                </div>
                <div className="font-bold text-sm text-slate-800 mb-2">@{gig.author || 'Unknown'}</div>
                <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed flex-1 mb-4 whitespace-pre-wrap break-words">{gig.content}</p>
                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                  <button onClick={() => openTypeSelector(gig)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm transition-colors">Open Gig</button>
                  <button onClick={() => handleDeleteClick(gig.id, gig.source)} className="p-2 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // ================= SPLIT SCREEN EDITOR =================
        <div className="h-[calc(100vh-2rem)] flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100">
          
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <LayoutTemplate size={20} className="text-blue-600"/> Researching {editorType.charAt(0).toUpperCase() + editorType.slice(1)}
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Extracting data from {selectedGig.source}</p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <button onClick={cancelResearch} className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 whitespace-nowrap transition-colors">Cancel & Keep in Inbox</button>
              <button onClick={handleDeploy} disabled={processing} className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-sm uppercase tracking-wider disabled:opacity-50 whitespace-nowrap transition-colors">
                {processing ? 'Deploying...' : 'Deploy & Remove Gig'}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Left: Form Area */}
            <div className="flex-1 bg-white overflow-y-auto custom-scrollbar p-4 lg:p-6 lg:border-r border-slate-200 order-2 lg:order-1">
              <div className="max-w-3xl mx-auto space-y-6">

                {/* AI AUTO-FILL BLOCK */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
                  <div>
                    <h4 className="text-sm font-black text-indigo-900">AI Context Extraction</h4>
                    <p className="text-xs text-indigo-700 mt-1">Pre-fill standard fields using the source context.</p>
                  </div>
                  <button 
                    onClick={handleAutoFillFromSource} 
                    disabled={isAutoFilling}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity whitespace-nowrap w-full sm:w-auto"
                  >
                    <Sparkles size={14}/> {isAutoFilling ? 'Extracting...' : 'Auto-Fill Form'}
                  </button>
                </div>

                {/* PROJECT EDITOR */}
                {editorType === 'project' && (
                  <div className="space-y-5">
                    <div className="flex p-1 bg-slate-100 rounded-lg w-full sm:w-fit border border-slate-200 overflow-x-auto">
                      <button onClick={() => setProjectFormTab('details')} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase transition-all whitespace-nowrap flex-1 sm:flex-none ${projectFormTab === 'details' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Project Details</button>
                      <button onClick={() => setProjectFormTab('roles')} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase transition-all whitespace-nowrap flex-1 sm:flex-none ${projectFormTab === 'roles' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Discord Roles</button>
                      <button onClick={() => setProjectFormTab('tasks')} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase transition-all whitespace-nowrap flex-1 sm:flex-none ${projectFormTab === 'tasks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Tasks & Guides</button>
                    </div>

                    {projectFormTab === 'details' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Twitter / X URL</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input type="url" value={projectData.x_link} onChange={(e) => setProjectData({...projectData, x_link: e.target.value})} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="https://twitter.com/..." />
                            <button onClick={handleAutoFetch} disabled={isAutoFetching} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold text-xs transition-colors whitespace-nowrap">
                              <Download size={14} /> {isAutoFetching ? 'Scanning...' : 'Auto-Fetch Logo'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Name *</label>
                          <input required type="text" value={projectData.name} onChange={(e) => setProjectData({...projectData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')})} className={inputClassName} placeholder="Project Name" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Logo URL</label>
                          <input type="url" value={projectData.logo_url} onChange={(e) => setProjectData({...projectData, logo_url: e.target.value})} className={inputClassName} placeholder="https://..." />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount Raised</label>
                          <input type="text" value={projectData.funding} onChange={(e) => setProjectData({...projectData, funding: e.target.value})} className={inputClassName} placeholder="$5M" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Lead Investors</label>
                          <input type="text" value={projectData.lead_investors} onChange={(e) => setProjectData({...projectData, lead_investors: e.target.value})} className={inputClassName} placeholder="a16z, Jump..." />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Galxe Alias</label>
                          <input type="text" value={projectData.galxe_alias} onChange={(e) => setProjectData({...projectData, galxe_alias: e.target.value})} className={inputClassName} placeholder="Campaign Alias" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Discord URL</label>
                          <input type="url" value={projectData.discord_link} onChange={(e) => setProjectData({...projectData, discord_link: e.target.value})} className={inputClassName} placeholder="https://discord.gg/..." />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Tier</label>
                          <select value={projectData.tier} onChange={(e) => setProjectData({...projectData, tier: e.target.value})} className={inputClassName}>
                            <option value="Tier 1">Tier 1</option><option value="Tier 2">Tier 2</option><option value="Tier 3">Tier 3</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Phase</label>
                          <select value={projectData.status} onChange={(e) => setProjectData({...projectData, status: e.target.value})} className={inputClassName}>
                            <option value="Waitlist">Waitlist</option><option value="Testnet Waitlist">Testnet Waitlist</option><option value="Incentivized Testnet">Incentivized Testnet</option><option value="Point Farming">Point Farming</option><option value="Snapshot">Snapshot</option><option value="TGE & Claim">TGE & Claim</option><option value="Post-TGE / Season 2">Post-TGE / Season 2</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Airdrop Status</label>
                          <select value={projectData.airdrop_status} onChange={(e) => setProjectData({...projectData, airdrop_status: e.target.value})} className={inputClassName}>
                            <option value="Confirmed">Confirmed</option><option value="Possible">Possible</option><option value="Unconfirmed">Unconfirmed</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Project Description</label>
                          <textarea value={projectData.description} onChange={(e) => setProjectData({...projectData, description: e.target.value})} rows="2" className={`${inputClassName} resize-none`} placeholder="Short bio..." />
                        </div>

                        {/* MASTER AI */}
                        <div className="sm:col-span-2 pt-6 mt-4 border-t-2 border-slate-200">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                            <label className="block text-xs font-black text-indigo-700 uppercase tracking-widest mb-2 flex items-center gap-1"><Sparkles size={14}/> Ultimate AI Auto-Fill</label>
                            <p className="text-xs text-indigo-600 mb-3 font-medium">Generate one master prompt to fetch Research, Founders, Tokenomics, and Competitors simultaneously.</p>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <button onClick={generateMasterAIPrompt} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">⚡ Generate Master Prompt</button>
                              <button onClick={() => navigator.clipboard.writeText(generatedMasterPrompt)} disabled={!generatedMasterPrompt} className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm ${generatedMasterPrompt ? 'bg-white text-indigo-700 hover:bg-slate-50 border border-indigo-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'}`}>📋 Copy Master Prompt</button>
                            </div>
                            {generatedMasterPrompt && <textarea value={generatedMasterPrompt} readOnly rows="3" className="w-full px-3 py-2 bg-slate-900 text-indigo-300 font-mono text-xs border border-slate-800 rounded-lg mb-3" />}
                            <textarea onChange={(e) => handleMasterAIPaste(e.target.value)} rows="2" className="w-full px-3 py-3 bg-white text-slate-800 font-mono text-[11px] border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner" placeholder="Paste the Master JSON output here. The 4 boxes below will auto-fill instantly..." />
                          </div>
                        </div>

                        {/* AI RESEARCH DATA */}
                        <div className="sm:col-span-2 pt-4 border-t border-slate-100">
                          <label className="block text-[11px] font-black text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles size={12} /> AI Research Data (JSON)</label>
                          <div className="flex items-center gap-2 mb-2">
                            <button onClick={generateAIPrompt} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">⚡ Generate Prompt</button>
                            <button onClick={() => navigator.clipboard.writeText(generatedPrompt)} disabled={!generatedPrompt} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${generatedPrompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}>📋 Copy</button>
                          </div>
                          {generatedPrompt && <textarea value={generatedPrompt} readOnly rows="4" className="w-full px-3 py-2 bg-slate-900 text-green-400 font-mono text-xs border border-slate-800 rounded-lg mb-2" />}
                          <textarea value={projectData.ai_research_data} onChange={(e) => setProjectData({...projectData, ai_research_data: e.target.value})} rows="3" className="w-full px-3 py-2 bg-slate-900 text-green-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 resize-none custom-scrollbar" placeholder="Paste AI output (JSON)" />
                        </div>

                        {/* FOUNDERS DETAILS */}
                        <div className="sm:col-span-2 pt-4 border-t border-slate-100">
                          <label className="block text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={12} /> Founders Details (JSON Array)</label>
                          <div className="flex items-center gap-2 mb-2">
                            <button onClick={generateFoundersAIPrompt} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">⚡ Generate Founders Prompt</button>
                            <button onClick={() => navigator.clipboard.writeText(generatedFoundersPrompt)} disabled={!generatedFoundersPrompt} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${generatedFoundersPrompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}>📋 Copy</button>
                          </div>
                          {generatedFoundersPrompt && <textarea value={generatedFoundersPrompt} readOnly rows="4" className="w-full px-3 py-2 bg-slate-900 text-blue-400 font-mono text-xs border border-slate-800 rounded-lg mb-2" />}
                          <textarea value={projectData.founders_details} onChange={(e) => setProjectData({...projectData, founders_details: e.target.value})} rows="3" className="w-full px-3 py-2 bg-slate-900 text-blue-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none custom-scrollbar" placeholder="Paste AI output (JSON Array)" />
                        </div>

                        {/* TOKENOMICS DETAILS */}
                        <div className="sm:col-span-2 pt-4 border-t border-slate-100">
                          <label className="block text-[11px] font-black text-purple-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Coins size={12} /> Tokenomics Details (JSON)</label>
                          <div className="flex items-center gap-2 mb-2">
                            <button onClick={generateTokenomicsAIPrompt} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors">⚡ Generate Tokenomics Prompt</button>
                            <button onClick={() => navigator.clipboard.writeText(generatedTokenomicsPrompt)} disabled={!generatedTokenomicsPrompt} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${generatedTokenomicsPrompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}>📋 Copy</button>
                          </div>
                          {generatedTokenomicsPrompt && <textarea value={generatedTokenomicsPrompt} readOnly rows="4" className="w-full px-3 py-2 bg-slate-900 text-purple-400 font-mono text-xs border border-slate-800 rounded-lg mb-2" />}
                          <textarea value={projectData.tokenomics_details} onChange={(e) => setProjectData({...projectData, tokenomics_details: e.target.value})} rows="3" className="w-full px-3 py-2 bg-slate-900 text-purple-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none custom-scrollbar" placeholder="Paste AI output (JSON object)" />
                        </div>

                        {/* COMPETITOR MATRIX */}
                        <div className="sm:col-span-2 pt-4 border-t border-slate-100">
                          <label className="block text-[11px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles size={12} /> Competitor Matrix Analysis (JSON)</label>
                          <div className="flex items-center gap-2 mb-2">
                            <button onClick={generateCompetitorAIPrompt} className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors">⚡ Generate Competitors Prompt</button>
                            <button onClick={() => navigator.clipboard.writeText(generatedCompetitorPrompt)} disabled={!generatedCompetitorPrompt} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${generatedCompetitorPrompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}>📋 Copy</button>
                          </div>
                          {generatedCompetitorPrompt && <textarea value={generatedCompetitorPrompt} readOnly rows="4" className="w-full px-3 py-2 bg-slate-900 text-amber-400 font-mono text-xs border border-slate-800 rounded-lg mb-2" />}
                          <textarea value={projectData.competitor_analysis} onChange={(e) => setProjectData({...projectData, competitor_analysis: e.target.value})} rows="3" className="w-full px-3 py-2 bg-slate-900 text-amber-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none custom-scrollbar" placeholder='Paste AI output object format here...' />
                        </div>
                      </div>
                    )}

                    {projectFormTab === 'roles' && (
                      <div className="space-y-4">
                        {roles.map((role, index) => (
                          <div key={index} className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm">
                            {/* Accordion Header */}
                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100" onClick={() => { const newRoles = [...roles]; newRoles[index].isExpanded = !newRoles[index].isExpanded; setRoles(newRoles); }}>
                              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                <Users size={16} className="text-blue-500"/> {role.role_name || `New Role ${index + 1}`}
                              </h4>
                              <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setRoles(roles.filter((_, i) => i !== index)); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                {role.isExpanded ? <ChevronUp size={18} className="text-slate-500"/> : <ChevronDown size={18} className="text-slate-500"/>}
                              </div>
                            </div>
                            
                            {/* Accordion Body */}
                            {role.isExpanded && (
                              <div className="p-4 pt-0 border-t border-slate-200 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white pt-4">
                                <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Role Name</label>
                                  <input type="text" value={role.role_name} onChange={(e) => { const newRoles = [...roles]; newRoles[index].role_name = e.target.value; setRoles(newRoles); }} className={inputClassName} placeholder="e.g., Early Adopter" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Difficulty</label>
                                  <select value={role.difficulty_level} onChange={(e) => { const newRoles = [...roles]; newRoles[index].difficulty_level = e.target.value; setRoles(newRoles); }} className={inputClassName}>
                                    <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Requirements</label>
                                  <textarea value={role.requirements} onChange={(e) => { const newRoles = [...roles]; newRoles[index].requirements = e.target.value; setRoles(newRoles); }} rows="1" className={`${inputClassName} resize-none`} placeholder="Reach level 10..." />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Perks</label>
                                  <input type="text" value={role.perks} onChange={(e) => { const newRoles = [...roles]; newRoles[index].perks = e.target.value; setRoles(newRoles); }} className={inputClassName} placeholder="Airdrop multiplier..." />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <button onClick={() => setRoles([...roles, { role_name: '', requirements: '', perks: '', difficulty_level: 'Medium', isExpanded: true }])} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-xl font-bold text-xs transition-colors">
                          <Plus size={16} /> Add Discord Role
                        </button>
                      </div>
                    )}

                    {projectFormTab === 'tasks' && (
                      <div className="space-y-4">
                        {projectTasks.map((task, index) => (
                          <div key={index} className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm">
                            
                            {/* Accordion Header */}
                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100" onClick={() => { const newTasks = [...projectTasks]; newTasks[index].isExpanded = !newTasks[index].isExpanded; setProjectTasks(newTasks); }}>
                              <div className="flex items-center gap-2">
                                {task.entryType === 'article' ? <LayoutTemplate size={16} className="text-purple-500"/> : <CheckCircle2 size={16} className="text-blue-500"/>}
                                <h4 className="font-bold text-sm text-slate-800">{task.name || `New ${task.entryType === 'article' ? 'Guide' : 'Task'} ${index + 1}`}</h4>
                                <span className={`hidden sm:inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${task.entryType === 'article' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{task.entryType}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setProjectTasks(projectTasks.filter((_, i) => i !== index)); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                {task.isExpanded ? <ChevronUp size={18} className="text-slate-500"/> : <ChevronDown size={18} className="text-slate-500"/>}
                              </div>
                            </div>

                            {/* Accordion Body */}
                            {task.isExpanded && (
                              <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2 flex gap-2 p-1 bg-slate-100 rounded-lg w-full sm:w-fit overflow-x-auto">
                                  <button onClick={() => { const n = [...projectTasks]; n[index].entryType = 'standard'; setProjectTasks(n); }} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase flex-1 sm:flex-none whitespace-nowrap ${task.entryType === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Standard Task</button>
                                  <button onClick={() => { const n = [...projectTasks]; n[index].entryType = 'article'; setProjectTasks(n); }} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase flex-1 sm:flex-none whitespace-nowrap ${task.entryType === 'article' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>Article / Guide</button>
                                </div>

                                {task.entryType === 'standard' ? (
                                  <>
                                    <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task Name *</label><input required value={task.name} onChange={(e) => { const n = [...projectTasks]; n[index].name = e.target.value; setProjectTasks(n); }} className={inputClassName} placeholder="Enter task name" /></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Recurring</label><select value={task.recurring} onChange={(e) => { const n = [...projectTasks]; n[index].recurring = e.target.value; setProjectTasks(n); }} className={inputClassName}><option value="One-time">One-time</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option></select></div>
                                    <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task Link</label><input type="url" value={task.link} onChange={(e) => { const n = [...projectTasks]; n[index].link = e.target.value; setProjectTasks(n); }} className={inputClassName} placeholder="https://..." /></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cost ($)</label><input type="number" value={task.cost} onChange={(e) => { const n = [...projectTasks]; n[index].cost = e.target.value; setProjectTasks(n); }} className={inputClassName} /></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time (Min)</label><input type="number" value={task.time_minutes} onChange={(e) => { const n = [...projectTasks]; n[index].time_minutes = e.target.value; setProjectTasks(n); }} className={inputClassName} /></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">SAIL Reward</label><input type="number" min="0" value={task.sail_reward} onChange={(e) => { const n = [...projectTasks]; n[index].sail_reward = e.target.value; setProjectTasks(n); }} className={inputClassName} placeholder="e.g. 100" /></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">End Date</label><input type="date" value={task.end_date} onChange={(e) => { const n = [...projectTasks]; n[index].end_date = e.target.value; setProjectTasks(n); }} className={inputClassName} /></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</label><select value={task.status} onChange={(e) => { const n = [...projectTasks]; n[index].status = e.target.value; setProjectTasks(n); }} className={inputClassName}><option value="Active">Active</option><option value="Ending Soon">Ending Soon</option><option value="High Priority">High Priority</option><option value="Ended">Ended</option></select></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task Category / Milestone</label><select value={task.task_category} onChange={(e) => { const n = [...projectTasks]; n[index].task_category = e.target.value; setProjectTasks(n); }} className={inputClassName}><option value="">Select...</option><option value="Waitlist">Waitlist</option><option value="Testnet Waitlist">Testnet Waitlist</option><option value="Incentivized Testnet">Incentivized Testnet</option><option value="Point Farming">Point Farming</option><option value="Snapshot">Snapshot</option><option value="TGE & Claim">TGE & Claim</option><option value="Post-TGE / Season 2">Post-TGE / Season 2</option></select></div>
                                    
                                    <div className="sm:col-span-2 pt-3 border-t border-slate-100"><h4 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Search size={12}/> On-Chain Verification</h4></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Network RPC URL</label><input type="url" value={task.rpc_url} onChange={(e) => { const n = [...projectTasks]; n[index].rpc_url = e.target.value; setProjectTasks(n); }} className={inputClassName} placeholder="https://mainnet..." /></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Contract</label><input type="text" value={task.contract_address} onChange={(e) => { const n = [...projectTasks]; n[index].contract_address = e.target.value; setProjectTasks(n); }} className={inputClassName} placeholder="0x..." /></div>
                                    
                                    <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task / Markdown Content</label><textarea rows={6} value={task.tutorial_markdown} onChange={(e) => { const n = [...projectTasks]; n[index].tutorial_markdown = e.target.value; setProjectTasks(n); }} className={`${inputClassName} font-mono`} placeholder="Write instructions here..." /></div>
                                  </>
                                ) : (
                                  <>
                                    <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Article Title *</label><input required value={task.name} onChange={(e) => { const n = [...projectTasks]; n[index].name = e.target.value; setProjectTasks(n); }} className={inputClassName} placeholder="How to run a node..." /></div>
                                    <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cover Image URL</label><input type="url" value={task.external_link} onChange={(e) => { const n = [...projectTasks]; n[index].external_link = e.target.value; setProjectTasks(n); }} className={inputClassName} placeholder="https://..." /></div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Article Editor (Markdown)</label>
                                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:border-purple-500 transition-colors bg-white">
                                        <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div className="flex flex-wrap gap-1.5">
                                            <button onClick={() => handleMarkdownAction('format', '**', '**', `markdown-editor-task-${index}`)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold"><Bold size={12}/></button>
                                            <button onClick={() => handleMarkdownAction('format', '*', '*', `markdown-editor-task-${index}`)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold"><Italic size={12}/></button>
                                            <button onClick={() => handleMarkdownAction('format', '[', '](url)', `markdown-editor-task-${index}`)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold"><LinkIcon size={12}/></button>
                                            <button onClick={() => handleMarkdownAction('insert', '\n- ', '', `markdown-editor-task-${index}`)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold"><List size={12}/></button>
                                            <button onClick={() => handleMarkdownAction('insert', '\n## ', '', `markdown-editor-task-${index}`)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold">H2</button>
                                            <button onClick={() => handleMarkdownAction('insert', '\n### Step X: Title\n1. Do this...\n2. Then this...\n', '', `markdown-editor-task-${index}`)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1"><List size={12}/> Step</button>
                                            <button onClick={() => handleMarkdownAction('insert', '\n> **Pro Tip:** \n', '', `markdown-editor-task-${index}`)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1"><Lightbulb size={12}/> Tip</button>
                                            <label className="cursor-pointer px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1">
                                              {isImageUploading ? '⏳...' : <><ImageIcon size={12}/> Image</>}
                                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleDynamicImageUpload(e, `markdown-editor-task-${index}`)} disabled={isImageUploading} />
                                            </label>
                                          </div>
                                          <button onClick={() => handleDynamicAIEnhance(`markdown-editor-task-${index}`)} disabled={isAIEnhancing} className="flex items-center justify-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded hover:bg-purple-200 text-[10px] font-black uppercase tracking-wider w-full sm:w-auto">
                                            {isAIEnhancing ? '✨ Processing...' : <><Sparkles size={12}/> Polish</>}
                                          </button>
                                        </div>
                                        <textarea id={`markdown-editor-task-${index}`} value={task.tutorial_markdown} onChange={(e) => { const n = [...projectTasks]; n[index].tutorial_markdown = e.target.value; setProjectTasks(n); }} className="w-full px-4 py-4 focus:outline-none text-slate-800 h-64 font-mono text-xs leading-relaxed custom-scrollbar resize-y bg-transparent" placeholder="Start writing your guide here..." />
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        <button onClick={() => setProjectTasks([...projectTasks, { ...emptyStandaloneTask, entryType: 'standard', isExpanded: true }])} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-xl font-bold text-xs transition-colors">
                          <Plus size={16} /> Add Task or Guide
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* STANDALONE TASK EDITOR */}
                {editorType === 'task' && (
                  <div className="space-y-4">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-full sm:w-fit border border-slate-200 overflow-x-auto">
                      <button onClick={() => setStandaloneTaskEntryType('standard')} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase transition-all flex-1 sm:flex-none whitespace-nowrap ${standaloneTaskEntryType === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Standard Task</button>
                      <button onClick={() => setStandaloneTaskEntryType('article')} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase transition-all flex-1 sm:flex-none whitespace-nowrap ${standaloneTaskEntryType === 'article' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>Article/Guide</button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Target Project *</label>
                        <select required value={standaloneTaskData.project_id} onChange={e => setStandaloneTaskData({...standaloneTaskData, project_id: e.target.value})} className={inputClassName}>
                          <option value="">Select Project...</option>
                          {projectOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      
                      {standaloneTaskEntryType === 'standard' ? (
                        <>
                          <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task Title *</label><input required value={standaloneTaskData.name} onChange={e => setStandaloneTaskData({...standaloneTaskData, name: e.target.value})} className={inputClassName} placeholder="Enter task name" /></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Recurring</label><select value={standaloneTaskData.recurring} onChange={e => setStandaloneTaskData({...standaloneTaskData, recurring: e.target.value})} className={inputClassName}><option value="One-time">One-time</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option></select></div>
                          <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task Link</label><input type="url" value={standaloneTaskData.link} onChange={e => setStandaloneTaskData({...standaloneTaskData, link: e.target.value})} className={inputClassName} placeholder="https://..." /></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cost ($)</label><input type="number" value={standaloneTaskData.cost} onChange={e => setStandaloneTaskData({...standaloneTaskData, cost: e.target.value})} className={inputClassName} /></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time (Min)</label><input type="number" value={standaloneTaskData.time_minutes} onChange={e => setStandaloneTaskData({...standaloneTaskData, time_minutes: e.target.value})} className={inputClassName} /></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">SAIL Reward</label><input type="number" min="0" value={standaloneTaskData.sail_reward} onChange={e => setStandaloneTaskData({...standaloneTaskData, sail_reward: e.target.value})} className={inputClassName} placeholder="e.g. 100" /></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">End Date</label><input type="date" value={standaloneTaskData.end_date} onChange={e => setStandaloneTaskData({...standaloneTaskData, end_date: e.target.value})} className={inputClassName} /></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</label><select value={standaloneTaskData.status} onChange={e => setStandaloneTaskData({...standaloneTaskData, status: e.target.value})} className={inputClassName}><option value="Active">Active</option><option value="Ending Soon">Ending Soon</option><option value="High Priority">High Priority</option><option value="Ended">Ended</option></select></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task Category / Milestone</label><select value={standaloneTaskData.task_category} onChange={e => setStandaloneTaskData({...standaloneTaskData, task_category: e.target.value})} className={inputClassName}><option value="">Select a category (Optional)...</option><option value="Waitlist">Waitlist</option><option value="Testnet Waitlist">Testnet Waitlist</option><option value="Incentivized Testnet">Incentivized Testnet</option><option value="Point Farming">Point Farming</option><option value="Snapshot">Snapshot</option><option value="TGE & Claim">TGE & Claim</option><option value="Post-TGE / Season 2">Post-TGE / Season 2</option></select></div>
                          
                          <div className="sm:col-span-2 pt-3 border-t border-slate-100 mt-2"><h4 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Search size={12}/> On-Chain Verification</h4></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Network RPC URL</label><input type="url" value={standaloneTaskData.rpc_url} onChange={e => setStandaloneTaskData({...standaloneTaskData, rpc_url: e.target.value})} className={inputClassName} placeholder="https://mainnet..." /></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Contract</label><input type="text" value={standaloneTaskData.contract_address} onChange={e => setStandaloneTaskData({...standaloneTaskData, contract_address: e.target.value})} className={inputClassName} placeholder="0x..." /></div>
                          
                          <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task / Markdown Content</label><textarea rows={6} value={standaloneTaskData.tutorial_markdown} onChange={e => setStandaloneTaskData({...standaloneTaskData, tutorial_markdown: e.target.value})} className={`${inputClassName} font-mono`} placeholder="Write instructions here..." /></div>
                        </>
                      ) : (
                        <>
                          <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Article Title *</label><input required value={standaloneTaskData.name} onChange={e => setStandaloneTaskData({...standaloneTaskData, name: e.target.value})} className={inputClassName} /></div>
                          <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cover Image URL</label><input type="url" value={standaloneTaskData.external_link} onChange={e => setStandaloneTaskData({...standaloneTaskData, external_link: e.target.value})} className={inputClassName} placeholder="https://..." /></div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Article Editor (Markdown)</label>
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => handleMarkdownAction('format', '**', '**', 'standalone-markdown', true)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold"><Bold size={12}/></button>
                                    <button onClick={() => handleMarkdownAction('format', '*', '*', 'standalone-markdown', true)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold"><Italic size={12}/></button>
                                    <button onClick={() => handleMarkdownAction('format', '[', '](url)', 'standalone-markdown', true)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold"><LinkIcon size={12}/></button>
                                    <button onClick={() => handleMarkdownAction('insert', '\n- ', '', 'standalone-markdown', true)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold"><List size={12}/></button>
                                    <button onClick={() => handleMarkdownAction('insert', '\n## ', '', 'standalone-markdown', true)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold">H2</button>
                                    <button onClick={() => handleMarkdownAction('insert', '\n### Step X: Title\n1. Do this...\n2. Then this...\n', '', 'standalone-markdown', true)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1"><List size={12}/> Step</button>
                                    <button onClick={() => handleMarkdownAction('insert', '\n> **Pro Tip:** \n', '', 'standalone-markdown', true)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1"><Lightbulb size={12}/> Tip</button>
                                    <label className="cursor-pointer px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1">
                                      {isImageUploading ? '⏳...' : <><ImageIcon size={12}/> Image</>}
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleDynamicImageUpload(e, 'standalone-markdown', true)} disabled={isImageUploading} />
                                    </label>
                                  </div>
                                  <button onClick={() => handleDynamicAIEnhance('standalone-markdown', true)} disabled={isAIEnhancing} className="flex items-center justify-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded hover:bg-purple-200 text-[10px] font-black uppercase tracking-wider w-full sm:w-auto">
                                    {isAIEnhancing ? '✨ Processing...' : <><Sparkles size={12}/> Polish</>}
                                  </button>
                                </div>
                                <textarea id="standalone-markdown" value={standaloneTaskData.tutorial_markdown} onChange={(e) => setStandaloneTaskData({...standaloneTaskData, tutorial_markdown: e.target.value})} className="w-full px-4 py-4 focus:outline-none text-slate-800 h-64 font-mono text-xs leading-relaxed resize-y bg-transparent" placeholder="Start writing your guide here..." />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* FUNDRAISING EDITOR */}
                {editorType === 'fundraising' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Project Name</label><input value={fundingData.project_name} onChange={e => setFundingData({...fundingData, project_name: e.target.value})} className={inputClassName} /></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Amount</label><input value={fundingData.funding_amount} onChange={e => setFundingData({...fundingData, funding_amount: e.target.value})} className={inputClassName} /></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Investors</label><input value={fundingData.lead_investor} onChange={e => setFundingData({...fundingData, lead_investor: e.target.value})} className={inputClassName} /></div>
                  </div>
                )}
              </div>
            </div>

            {/* Right/Top: Original Source Context Panel (Now Visible on Mobile) */}
            <div className="w-full lg:w-[400px] xl:w-[450px] max-h-[200px] lg:max-h-none lg:h-auto bg-slate-50 flex flex-col shrink-0 order-1 lg:order-2 border-b lg:border-b-0 lg:border-l border-slate-200">
              <div className="p-4 border-b border-slate-200 bg-slate-100/50">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Database size={14} /> Source Context
                </h3>
              </div>
              <div className="p-4 lg:p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      {selectedGig.source === 'X' ? <Twitter size={18} className="text-slate-700"/> : <MessageSquare size={18} className="text-slate-700"/>}
                    </div>
                    <div>
                      <div className="font-black text-sm text-slate-900 break-all">{selectedGig.author}</div>
                      <div className="text-[10px] font-bold text-slate-400">{new Date(selectedGig.date).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-serif break-words">
                    {selectedGig.content}
                  </div>
                  {selectedGig.url && (
                    <a href={selectedGig.url} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors">
                      <ExternalLink size={14} /> Open Original Post
                    </a>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* TYPE SELECTOR MODAL */}
      {showTypeSelector && selectedGig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 text-center">Classify Gig</h2>
              <p className="text-xs text-slate-500 text-center mt-1">What type of research is this?</p>
            </div>
            <div className="p-3 space-y-2">
              <button onClick={() => startResearch('project')} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors text-left group">
                <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg group-hover:scale-110 transition-transform"><Database size={20} /></div>
                <div><div className="font-black text-sm text-slate-900">Project</div><div className="text-[11px] font-medium text-slate-500">Research a new crypto project</div></div>
              </button>
              <button onClick={() => startResearch('task')} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-purple-50 border border-transparent hover:border-purple-100 transition-colors text-left group">
                <div className="bg-purple-100 text-purple-600 p-2.5 rounded-lg group-hover:scale-110 transition-transform"><CheckCircle2 size={20} /></div>
                <div><div className="font-black text-sm text-slate-900">Task / Article</div><div className="text-[11px] font-medium text-slate-500">Document a specific opportunity</div></div>
              </button>
              <button onClick={() => startResearch('fundraising')} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-colors text-left group">
                <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-lg group-hover:scale-110 transition-transform"><Coins size={20} /></div>
                <div><div className="font-black text-sm text-slate-900">Fundraising</div><div className="text-[11px] font-medium text-slate-500">Log a new funding announcement</div></div>
              </button>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowTypeSelector(false)} className="w-full py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}