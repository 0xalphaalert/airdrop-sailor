import React, { useState, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function AdminDashboard() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [activeTab, setActiveTab] = useState('command-center');

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
    discord_link: '',        
    tier: 'Tier 3',         
    status: 'Waitlist',         
    airdrop_status: 'Possible', 
    description: '',
    galxe_alias: '',   
    zealy_subdomain: '',    
    funding: '',            
    lead_investors: ''      
  });
  // ==================================================
  // 💬 NEW: DISCORD ANNOUNCEMENTS STATES
  // ==================================================
  const [discordAnnouncements, setDiscordAnnouncements] = useState([]);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);

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
  // 💰 NEW: FUNDRAISING STATES
  // ==================================================
  const [fundingData, setFundingData] = useState([]);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [fundingForm, setFundingForm] = useState({
    id: null, project_name: '', round: '', funding_amount: '', lead_investor: '', category: '', sector: '', x_link: '', project_logo: ''
  });
  // ==================================================
  // 📝 NEW: ARTICLE EDITOR STATES & FUNCTIONS
  // ==================================================
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isAIEnhancing, setIsAIEnhancing] = useState(false);

  // Helper to insert text exactly where the cursor is in the textarea
  const insertAtCursor = (textToInsert) => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;
    
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentVal = taskFormData.tutorial_markdown || '';
    
    const newVal = currentVal.substring(0, startPos) + textToInsert + currentVal.substring(endPos);
    setTaskFormData({ ...taskFormData, tutorial_markdown: newVal });
    
    // Auto-focus back to textarea after clicking a button
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + textToInsert.length, startPos + textToInsert.length);
    }, 10);
  };

  // ImgBB Free Image Upload (Zero Bandwidth Costs!)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImageUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      // ⚠️ IMPORTANT: Replace this with your free ImgBB API Key!
      const IMGBB_KEY = '1de173c5b97e6a61196a6f5153b93960'; 
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Instantly inject the free hosted image into the article!
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
    if (!taskFormData.tutorial_markdown) return alert("Write a rough draft first!");
    setIsAIEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-article', {
        body: { markdown: taskFormData.tutorial_markdown }
      });
      if (error) throw error;
      
      if (data?.enhanced_markdown) {
        setTaskFormData({ ...taskFormData, tutorial_markdown: data.enhanced_markdown });
      }
    } catch (err) {
      alert("AI enhancement failed: " + err.message);
    } finally {
      setIsAIEnhancing(false);
    }
  };

  // ==================================================
  // 🚀 NEW: SHORT TASKS / SPRINTS PROMOTION STATES
  // ==================================================
  const [isShortTaskModalOpen, setIsShortTaskModalOpen] = useState(false);
  const [shortTaskForm, setShortTaskForm] = useState({
    id: null, // 🚀 NEW: Tracks if we are editing!
    bounty_id: null, task_name: '', task_description: '', logo_url: '',
    banner_url: '', platform_name: '', task_link: '', api_slug: '',
    join_date: new Date().toISOString().split('T')[0], end_date: '', recurring: 'One-time',
    rewards: []
  });
  const [activeSprints, setActiveSprints] = useState([]);
  
  const fetchActiveSprints = async () => {
    const { data, error } = await supabase.from('short_tasks').select('*').order('created_at', { ascending: false });
    if (!error && data) setActiveSprints(data);
  };

  const handleDeleteSprint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Sprint?")) return;
    await supabase.from('short_tasks').delete().eq('id', id);
    fetchActiveSprints();
  };

  // ==================================================
  // 📡 NEW: ALPHA STREAM / MASTER INTEL QUEUE STATES
  // ==================================================
  const [alphaFilter, setAlphaFilter] = useState('telegram');
  const [alphaProjectFilter, setAlphaProjectFilter] = useState('all');
  const [alphaData, setAlphaData] = useState([]);
  const [isAlphaLoading, setIsAlphaLoading] = useState(false);

  // Command Center states
  const [pendingIntel, setPendingIntel] = useState([]);
  const [isIntelLoading, setIsIntelLoading] = useState(false);
  const [selectedProjectForIntel, setSelectedProjectForIntel] = useState('all');
  const [commandCenterTaskDraft, setCommandCenterTaskDraft] = useState(null);
  const [activeTaskCount, setActiveTaskCount] = useState(0);

  // Load projects immediately so the dropdowns in the Task section actually work
  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (data) setAllProjects(data);
  };

  const safeParseLinks = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' && item.trim().length > 0);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => typeof item === 'string' && item.trim().length > 0);
        }
      } catch (error) {
        if (value.startsWith('http')) return [value];
      }
    }
    return [];
  };

  const trimContent = (text, max = 180) => {
    if (!text) return '';
    if (text.length <= max) return text;
    return `${text.slice(0, max)}...`;
  };

  const getPriorityMeta = (score) => {
    const normalized = Number(score || 0);
    if (normalized > 7) return { label: 'High', className: 'bg-red-900/30 text-red-300 border border-red-600/30' };
    if (normalized >= 4) return { label: 'Medium', className: 'bg-orange-900/30 text-orange-300 border border-orange-600/30' };
    return { label: 'Low', className: 'bg-gray-800 text-gray-300 border border-gray-700' };
  };

  const deriveInsightLevel = (intel) => {
    if (intel.ai_summary) return 'AI';
    const content = (intel.raw_content || '').toLowerCase();
    if (content.includes('ama') || content.includes('campaign') || content.includes('whitelist')) return 'Medium';
    return 'Low';
  };

  const deriveTaskTitleFromIntel = (intel) => {
    const summary = (intel.ai_summary || '').toLowerCase();
    const content = (intel.raw_content || '').toLowerCase();
    if (summary.includes('ama') || content.includes('ama')) return 'Join project AMA';
    if (summary.includes('whitelist') || content.includes('whitelist')) return 'Complete whitelist steps';
    if (summary.includes('campaign') || content.includes('campaign')) return 'Complete campaign';
    if (summary.includes('quest') || content.includes('quest')) return 'Finish new quest';
    return `Review ${intel.project_name || 'project'} update`;
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
  const forceSyncSocialScores = async () => {
    // We will reuse your existing loading state so the button gives visual feedback
    setIsSubmitting(true); 
    try {
      // This tells Supabase to fire your Edge Function immediately
      const { data, error } = await supabase.functions.invoke('update-social-scores');
      
      if (error) throw error;
      
      alert(`✅ Success! Updated scores for ${data.updated} projects.`);
      fetchAllProjects(); // Refresh the UI to show the new scores
      
    } catch (err) {
      console.error("Manual Sync Error:", err);
      alert(`❌ Sync Failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeployProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 🚀 Helper to format the slug (e.g. "Nemesis Trade" -> "nemesis-trade")
      const generateSlug = (text) => {
        return text.toString().toLowerCase().trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/[\s-]+/g, '-');
      };

      const payload = {
        name: formData.name,
        slug: generateSlug(formData.name), // 🚀 100% automatically generates from the Name!
        logo_url: formData.logo_url,
        x_link: formData.x_link,
        discord_link: formData.discord_link,
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

  const fetchCommandCenterData = async () => {
    setIsIntelLoading(true);
    try {
      const [intelRes, discordRes, activeTaskRes] = await Promise.all([
        supabase.from('master_intel_queue').select('*').eq('status', 'Pending').order('created_at', { ascending: false }),
        supabase.from('discord_announcements').select('*').eq('status', 'raw').order('created_at', { ascending: false }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'Active')
      ]);

      const masterIntel = intelRes.data || [];
      const discordIntel = discordRes.data || [];

      // Normalize Discord data to look like Master Intel data so the UI doesn't break
      const normalizedDiscord = discordIntel.map(d => ({
        ...d,
        isDiscord: true, // Secret flag so we know which table to delete from later
        raw_content: d.content,
        source_platform: 'Discord',
        extracted_links: d.source_link ? [d.source_link] : [] 
      }));

      // Combine and sort by newest first
      const combinedFeed = [...masterIntel, ...normalizedDiscord].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setPendingIntel(combinedFeed);
      if (!activeTaskRes.error) setActiveTaskCount(activeTaskRes.count || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsIntelLoading(false);
    }
  };
  
  useEffect(() => {
    if (activeTab === 'research') {
      fetchResearchTasks();
    }
    // FETCH NEW ALPHA STREAM WHEN TAB IS ACTIVE
    if (activeTab === 'alpha-stream') {
      fetchAlphaStream();
    }
    if (activeTab === 'command-center') {
      fetchCommandCenterData();
    }
    // ✅ FIXED: It now stands on its own!
    if (activeTab === 'discord-announcements') {
      fetchDiscordAnnouncements();
    }
    if (activeTab === 'fundraising') {
      fetchFunding();
    }
    if (activeTab === 'manage-sprints') fetchActiveSprints(); 
  }, [activeTab, alphaFilter, alphaProjectFilter]);

  const fetchResearchTasks = async () => {
    const { data } = await supabase
      .from('bounty_radar')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setResearchTasks(data);
  };
  // --- FUNDRAISING FUNCTIONS ---
  const fetchFunding = async () => {
    const { data, error } = await supabase.from('funding_opportunities').select('*').order('last_updated', { ascending: false });
    if (!error && data) setFundingData(data);
  };

  const handleSaveFunding = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // AUTO-GENERATE LOGO FROM X LINK
    let finalLogoUrl = fundingForm.project_logo;
    if (fundingForm.x_link) {
      const match = fundingForm.x_link.match(/(?:twitter\.com|x\.com)\/([^/]+)/);
      if (match && match[1]) {
        finalLogoUrl = `https://unavatar.io/twitter/${match[1]}`;
      }
    }

    const payload = {
      project_name: fundingForm.project_name,
      round: fundingForm.round,
      funding_amount: fundingForm.funding_amount,
      lead_investor: fundingForm.lead_investor,
      category: fundingForm.category,
      sector: fundingForm.sector,
      x_link: fundingForm.x_link,
      project_logo: finalLogoUrl || 'N/A',
      last_updated: new Date().toISOString()
    };

    if (fundingForm.id) payload.id = fundingForm.id;

    const { error } = await supabase.from('funding_opportunities').upsert(payload, { onConflict: 'project_name' });

    if (error) {
      alert(`Error saving funding: ${error.message}`);
    } else {
      setIsFundingModalOpen(false);
      setFundingForm({ id: null, project_name: '', round: '', funding_amount: '', lead_investor: '', category: '', sector: '', x_link: '', project_logo: '' });
      fetchFunding();
    }
    setIsSubmitting(false);
  };

  const handleDeleteFunding = async (id) => {
    if(window.confirm('Are you sure you want to delete this funding record?')) {
      await supabase.from('funding_opportunities').delete().eq('id', id);
      fetchFunding();
    }
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
  const fetchDiscordAnnouncements = async () => {
    setIsDiscordLoading(true);
    try {
      const { data, error } = await supabase
        .from('discord_announcements')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setDiscordAnnouncements(data || []);
    } catch (err) {
      console.error("Error fetching Discord announcements:", err);
    } finally {
      setIsDiscordLoading(false);
    }
  };

  const processAlphaItem = async (id, newStatus, isBounty = false) => {
    // Optimistic UI Removal
    setAlphaData(prev => prev.filter(item => item.id !== id));
    
    // DB Update
    const table = isBounty ? 'bounty_radar' : 'master_intel_queue';
    await supabase.from(table).update({ status: newStatus }).eq('id', id);
  };

  const deleteRawIntel = async (item) => {
    // Optimistic UI removal for instant feedback
    setPendingIntel((prev) => prev.filter((i) => i.id !== item.id));

    // Check our secret flag to know which table to delete from
    const table = item.isDiscord ? 'discord_announcements' : 'master_intel_queue';
    
    const { error } = await supabase.from(table).delete().eq('id', item.id);
    
    if (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete item.");
      fetchCommandCenterData(); // Revert UI if DB fails
    }
  };
  const handleDraftTask = (intel) => {
    const matchedProject = allProjects.find((p) => p.name === (intel.project_name || ''));
    const links = safeParseLinks(intel.extracted_links);

    // 1. Pre-fill the basics
    setTaskFormData({
      project_id: matchedProject?.id || '',
      name: deriveTaskTitleFromIntel(intel),
      description: intel.raw_content || intel.ai_summary || '',
      link: links[0] || '',
      // 2. Clear defaults to force manual entry
      recurring: 'One-time', cost: '', time_minutes: '', end_date: '',
      status: 'Active', external_link: '', tutorial_markdown: '',
      rpc_url: '', contract_address: '' 
    });

    // 3. Switch tabs
    setEntryType('task');
    setActiveTab('add-task');
    
    // Auto-delete the raw intel now that it's drafted
    deleteRawIntel(intel); 
  };

  const openConvertToTaskModal = (intel) => {
    const matchedProject = allProjects.find((project) => project.name === intel.project_name);
    const links = safeParseLinks(intel.extracted_links);
    const firstLink = links[0] || '';
    setCommandCenterTaskDraft({
      intel_id: intel.id,
      project_id: matchedProject?.id || '',
      name: deriveTaskTitleFromIntel(intel),
      description: intel.raw_content || '',
      link: firstLink,
      source_platform: intel.source_platform || null,
      raw_content: intel.raw_content || '',
      source: 'auto_intel',
      recurring: 'One-time',
      cost: '0',
      time_minutes: 5,
      status: 'Active',
      external_link: firstLink
    });
  };

  const approveIntelAsTask = async (intel) => {
    const matchedProject = allProjects.find((project) => project.name === intel.project_name);
    if (!matchedProject) {
      alert(`Project "${intel.project_name}" not found. Please map this intel manually.`);
      return;
    }
    const links = safeParseLinks(intel.extracted_links);
    const firstLink = links[0] || '';
    const payload = {
      project_id: matchedProject.id,
      name: deriveTaskTitleFromIntel(intel),
      description: intel.raw_content || '',
      link: firstLink,
      recurring: 'One-time',
      cost: '0',
      time_minutes: 5,
      status: 'Active',
      source: 'auto_intel',
      source_platform: intel.source_platform || null,
      raw_content: intel.raw_content || null,
      external_link: firstLink
    };

    const { error } = await supabase.from('tasks').insert([payload]);
    if (error) {
      alert(`Failed to create task: ${error.message}`);
      return;
    }
    await dismissIntelItem(intel.id);
    fetchCommandCenterData();
  };

  const submitTaskDraftFromIntel = async (e) => {
    e.preventDefault();
    if (!commandCenterTaskDraft?.project_id) {
      alert('Please select a project before creating task.');
      return;
    }
    const payload = {
      project_id: commandCenterTaskDraft.project_id,
      name: commandCenterTaskDraft.name,
      description: commandCenterTaskDraft.description,
      link: commandCenterTaskDraft.link,
      recurring: 'One-time',
      cost: '0',
      time_minutes: 5,
      status: 'Active',
      source: 'auto_intel',
      source_platform: commandCenterTaskDraft.source_platform || null,
      raw_content: commandCenterTaskDraft.raw_content || null,
      external_link: commandCenterTaskDraft.link || null
    };
    const { error } = await supabase.from('tasks').insert([payload]);
    if (error) {
      alert(`Failed to create task: ${error.message}`);
      return;
    }

    await supabase
      .from('master_intel_queue')
      .update({ status: 'Approved' })
      .eq('id', commandCenterTaskDraft.intel_id);

    setCommandCenterTaskDraft(null);
    fetchCommandCenterData();
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
  // ==================================================
  // 🚀 SHORT TASKS PROMOTION LOGIC
  // ==================================================
  const openShortTaskModal = (task) => {
    setShortTaskForm({
      bounty_id: task.id,
      task_name: task.task_name || task.project_name || '',
      task_description: task.task_description || task.description || '',
      logo_url: task.logo_url || '',
      banner_url: '', // New column
      platform_name: task.platform_name || 'Zealy',
      task_link: task.task_link || '', // Ready to be swapped for your referral link!
      api_slug: '', // New column
      join_date: new Date().toISOString().split('T')[0],
      end_date: task.end_date || '',
      recurring: task.recurring || 'One-time',
      rewards: [
        { tier: '1st', prize: '$100' },
        { tier: '2nd-5th', prize: '$50' },
        { tier: '6th-10th', prize: '$10' },
        { tier: '11th-100th', prize: '$5' }
      ]
    });
    setIsShortTaskModalOpen(true);
  };
  // Open modal to EDIT an existing sprint
  const openEditSprintModal = (sprint) => {
    setShortTaskForm({
      id: sprint.id, // Set the ID so we know to update, not insert
      bounty_id: null,
      task_name: sprint.task_name || '',
      task_description: sprint.task_description || '',
      logo_url: sprint.logo_url || '',
      banner_url: sprint.banner_url || '',
      platform_name: sprint.platform_name || '',
      task_link: sprint.task_link || '',
      api_slug: sprint.api_slug || '',
      join_date: sprint.join_date || new Date().toISOString().split('T')[0],
      end_date: sprint.end_date || '',
      recurring: sprint.recurring || 'One-time',
      rewards: sprint.rewards || [] // Pre-fill existing rewards!
    });
    setIsShortTaskModalOpen(true);
  };

  // Open modal to CREATE a manual sprint from scratch
  const openNewSprintModal = () => {
    setShortTaskForm({
      id: null, bounty_id: null, task_name: '', task_description: '', logo_url: '',
      banner_url: '', platform_name: 'Zealy', task_link: '', api_slug: '',
      join_date: new Date().toISOString().split('T')[0], end_date: '', recurring: 'One-time',
      rewards: [
        { tier: '1st', prize: '$100' },
        { tier: '2nd-5th', prize: '$50' }
      ]
    });
    setIsShortTaskModalOpen(true);
  };

  const handleRewardChange = (index, field, value) => {
    const updatedRewards = [...shortTaskForm.rewards];
    updatedRewards[index][field] = value;
    setShortTaskForm({ ...shortTaskForm, rewards: updatedRewards });
  };

  const submitShortTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        task_name: shortTaskForm.task_name,
        task_description: shortTaskForm.task_description,
        logo_url: shortTaskForm.logo_url,
        banner_url: shortTaskForm.banner_url || null,
        platform_name: shortTaskForm.platform_name,
        task_link: shortTaskForm.task_link,
        api_slug: shortTaskForm.api_slug || null,
        join_date: shortTaskForm.join_date || null,
        end_date: shortTaskForm.end_date || null,
        recurring: shortTaskForm.recurring,
        rewards: shortTaskForm.rewards,
        status: 'Active'
      };

      if (shortTaskForm.id) {
        // 🔄 UPDATE EXISTING SPRINT
        const { error } = await supabase.from('short_tasks').update(payload).eq('id', shortTaskForm.id);
        if (error) throw error;
        alert("Sprint Successfully Updated! 🔄");
      } else {
        // 🚀 INSERT NEW SPRINT
        payload.profit_gained = '0';
        payload.last_task_count = 0;
        payload.new_tasks_added = 0;
        
        const { error } = await supabase.from('short_tasks').insert([payload]);
        if (error) throw error;
        
        // Only update bounty_radar if it came from the queue
        if (shortTaskForm.bounty_id) {
          await supabase.from('bounty_radar').update({ status: 'Promoted', visible_to_users: true }).eq('id', shortTaskForm.bounty_id);
        }
        alert("Sprint Successfully Deployed! 🚀");
      }

      setIsShortTaskModalOpen(false);
      fetchActiveSprints(); // Refresh Manage Sprints tab
      fetchResearchTasks(); // Refresh Research Queue tab
    } catch (err) {
      alert(`Error saving task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPendingIntel = useMemo(() => {
    if (selectedProjectForIntel === 'all') return pendingIntel;
    return pendingIntel.filter((item) => (item.project_name || '') === selectedProjectForIntel);
  }, [pendingIntel, selectedProjectForIntel]);

  const intelInsights = useMemo(() => {
    const grouped = {};
    filteredPendingIntel.forEach((intel) => {
      const key = intel.project_name || 'Unknown Project';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(intel);
    });
    return Object.entries(grouped);
  }, [filteredPendingIntel]);

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

  const FeedCard = ({ intel }) => {
    const links = safeParseLinks(intel.extracted_links);
    const preview = intel.ai_summary || trimContent(intel.raw_content, 160);
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-orange-300 font-black uppercase tracking-wider">{intel.project_name || 'Unknown Project'}</p>
            <p className="text-[11px] text-gray-500 font-bold uppercase">{intel.source_platform || 'Unknown Source'}</p>
          </div>
          <span className="text-[10px] text-gray-500">{new Date(intel.created_at).toLocaleString()}</span>
        </div>

        <p className="text-sm text-gray-200 leading-relaxed">{preview || 'No summary available.'}</p>

        <div className="flex flex-wrap gap-2">
          {links.length > 0 ? links.slice(0, 2).map((link, idx) => (
            <a key={`${intel.id}-link-${idx}`} href={link} target="_blank" rel="noreferrer" className="text-xs bg-purple-900/20 text-purple-300 border border-purple-700/40 rounded-md px-2 py-1 truncate max-w-[240px]">
              {link}
            </a>
          )) : <span className="text-xs text-gray-500">No extracted links</span>}
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-800">
          <button onClick={() => handleDraftTask(intel)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg py-2">
            Draft Task
          </button>
          <button onClick={() => deleteRawIntel(intel)} className="bg-red-900/20 border border-red-700/30 text-red-300 hover:bg-red-900/30 text-xs font-bold rounded-lg px-4">
            🗑️ Delete
          </button>
        </div>
      </div>
    );
  };

  const InsightCard = ({ projectName, items }) => (
    <div className="bg-gray-900 border border-purple-700/30 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-black text-purple-300 uppercase">{projectName}</h4>
        <span className="text-[10px] text-purple-200 bg-purple-900/20 px-2 py-1 rounded-md border border-purple-700/30">
          {items.length} signal{items.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {items.slice(0, 3).map((intel) => {
          const isHigh = Number(intel.ai_importance_score || 0) > 7;
          const fallbackLevel = deriveInsightLevel(intel);
          return (
            <div key={`insight-${intel.id}`} className="bg-gray-950 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase tracking-wider ${isHigh ? 'text-red-300' : 'text-orange-300'}`}>
                  {isHigh ? 'High activity detected' : `Signal level: ${fallbackLevel}`}
                </span>
                <span className="text-[10px] text-gray-500">Score: {intel.ai_importance_score ?? 'n/a'}</span>
              </div>
              <p className="text-xs text-gray-300">{trimContent(intel.ai_summary || intel.raw_content, 120)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const TaskCard = ({ intel }) => {
    const links = safeParseLinks(intel.extracted_links);
    const primaryLink = links[0] || '';
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-[11px] text-green-300 font-black uppercase tracking-wider mb-1">{intel.project_name || 'Unknown Project'}</p>
        <h4 className="text-sm font-bold text-white mb-2">{deriveTaskTitleFromIntel(intel)}</h4>
        <p className="text-xs text-gray-400 mb-3">{trimContent(intel.raw_content, 120)}</p>
        {primaryLink && (
          <a href={primaryLink} target="_blank" rel="noreferrer" className="inline-block text-xs text-blue-300 underline mb-3">
            Open source link
          </a>
        )}
        <div className="flex gap-2">
          <button onClick={() => handleDraftTask(intel)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg py-2">
            Draft Task ⚡
          </button>
          <button onClick={() => deleteRawIntel(intel)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-bold rounded-lg py-2">
            🗑️ Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-950 min-h-screen flex flex-col md:flex-row font-sans text-white">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-[260px] bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 min-h-screen">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3 font-black uppercase text-[14px]">👑 God Mode</div>
        <div className="p-4 flex flex-col gap-1 flex-1 mt-4">
          <NavItem id="command-center" label="Command Center" icon="🧠" />
          <NavItem id="add-project" label={editingProject ? "Editing Mode" : "Add Project"} icon="➕" />
          <NavItem id="manage-tasks" label="Manage Projects" icon="📝" />
          
          <p className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest mt-6 mb-2">Tasks</p>
          <NavItem id="add-task" label={editingTask ? "Editing Task" : "Add Task"} icon="⚡" />
          <NavItem id="manage-tasks-list" label="Manage Tasks" icon="📝" />
          <NavItem id="research" label="Research Queue" icon="🔬" />
          {/* 🚀 NEW: Manage Sprints Sidebar Button */}
          <NavItem id="manage-sprints" label="Manage Sprints" icon="🏃" />
          
        
          
          {/* 🚀 NEW: Alpha Stream Tab */}
          <NavItem id="alpha-stream" label="Alpha Stream" icon="📡" />
        </div>
        {/* 💬 NEW: Discord Announcements */}
          <NavItem id="discord-announcements" label="Discord Intel" icon="💬" />
          {/* 💰 NEW: Fundraising Hub */}
          <NavItem id="fundraising" label="Fundraising Hub" icon="💰" />
        <div className="p-6 border-t border-gray-800"><Link to="/" className="w-full block text-center py-2 bg-gray-800 text-gray-300 text-[11px] font-black uppercase rounded-lg">Exit Admin</Link></div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">

        {/* COMMAND CENTER */}
        {activeTab === 'command-center' && (
          <div className="max-w-[1400px] space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-[26px] font-black tracking-tight">Airdrop Intelligence Command Center</h2>
                <p className="text-[13px] text-gray-400">Raw Intel → AI Insights → Task Suggestions → Approved Tasks</p>
              </div>
              <div className="w-full lg:w-[280px]">
                <select
                  value={selectedProjectForIntel}
                  onChange={(e) => setSelectedProjectForIntel(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white"
                >
                  <option value="all">All Projects</option>
                  {allProjects.map((project) => (
                    <option key={project.id} value={project.name}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-[11px] uppercase text-gray-500 font-black">Total projects</p>
                <p className="text-2xl font-black text-white mt-2">{allProjects.length}</p>
              </div>
              <div className="bg-gray-900 border border-orange-700/40 rounded-xl p-4">
                <p className="text-[11px] uppercase text-orange-300 font-black">Pending intel</p>
                <p className="text-2xl font-black text-orange-200 mt-2">{filteredPendingIntel.length}</p>
              </div>
              <div className="bg-gray-900 border border-green-700/40 rounded-xl p-4">
                <p className="text-[11px] uppercase text-green-300 font-black">Active tasks</p>
                <p className="text-2xl font-black text-green-200 mt-2">{activeTaskCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-orange-300">Unified Feed</h3>
                {isIntelLoading ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">Loading pending intel...</div>
                ) : filteredPendingIntel.length === 0 ? (
                  <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-8 text-center text-gray-500">No pending intel for this filter.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredPendingIntel.map((intel) => <FeedCard key={`feed-${intel.id}`} intel={intel} />)}
                  </div>
                )}
              </div>

              <div className="xl:col-span-5 space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 mb-3">AI Insight Panel</h3>
                  <div className="space-y-3">
                    {intelInsights.length === 0 ? (
                      <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-6 text-sm text-gray-500">No insights available.</div>
                    ) : (
                      intelInsights.map(([projectName, items]) => (
                        <InsightCard key={`insight-group-${projectName}`} projectName={projectName} items={items} />
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-green-300 mb-3">Suggested Tasks</h3>
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {filteredPendingIntel.slice(0, 8).map((intel) => (
                      <TaskCard key={`suggest-${intel.id}`} intel={intel} />
                    ))}
                    {filteredPendingIntel.length === 0 && (
                      <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-6 text-sm text-gray-500">No task suggestions right now.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ================================================== */}
        {/* 💬 NEW: DISCORD ANNOUNCEMENTS TAB                  */}
        {/* ================================================== */}
        {activeTab === 'discord-announcements' && (
          <div className="max-w-6xl">
            <h2 className="text-[24px] font-black tracking-tighter mb-2">
              Discord Feed <span className="text-xs bg-[#5865F2]/20 text-[#5865F2] px-2 py-0.5 rounded ml-2 uppercase tracking-widest font-black">Live</span>
            </h2>
            <p className="text-[13px] text-gray-400 mb-6">Raw announcements fetched directly from your community hub.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isDiscordLoading ? (
                <div className="col-span-full py-10 flex items-center justify-center text-gray-500 font-bold">
                  💬 Fetching Discord intel...
                </div>
              ) : discordAnnouncements.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500 font-bold border border-dashed border-gray-800 rounded-2xl">
                  No Discord announcements in the database yet.
                </div>
              ) : (
                discordAnnouncements.map((post) => {
                  // Hack: Extract the first URL from the content to make a nice button
                  const urlMatch = post.content?.match(/https?:\/\/[^\s]+/);
                  const firstUrl = urlMatch ? urlMatch[0] : null;

                  return (
                    <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col h-[380px] shadow-sm">
                      
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#5865F2]/20 text-[#5865F2] text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                            {post.project_name || 'Discord Alert'}
                          </span>
                          {post.channel_name && (
                            <span className="text-[10px] font-bold text-gray-500 uppercase">#{post.channel_name}</span>
                          )}
                        </div>
                        <span className="text-[9px] text-gray-500 font-mono">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 overflow-y-auto mb-3 custom-scrollbar pr-2 bg-gray-950/50 p-3 rounded-lg border border-gray-800/50">
                        <p className="text-xs text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                          {formatTweetContent(post.content)}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex gap-2 pt-3 border-t border-gray-800 shrink-0">
                        {firstUrl ? (
                          <a href={firstUrl} target="_blank" rel="noreferrer" className="flex-1 bg-[#5865F2] hover:bg-[#4752C4] text-white text-center py-2.5 rounded-lg text-xs font-bold transition shadow-sm">
                            Open Target Link
                          </a>
                        ) : (
                          <div className="flex-1 bg-gray-800 text-gray-500 text-center py-2.5 rounded-lg text-xs font-bold">
                            No Link Detected
                          </div>
                        )}
                        <button className="px-4 bg-gray-950 border border-gray-800 text-gray-400 py-2.5 rounded-lg text-xs font-bold hover:text-white hover:bg-gray-800 transition">
                          Review
                        </button>
                      </div>
                      
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        
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
                <div>
  <label className="text-[11px] font-black text-[#5865F2] uppercase block mb-2">Discord URL</label>
  <input name="discord_link" value={formData.discord_link || ''} onChange={handleInputChange} placeholder="https://discord.gg/..." className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3" />
</div>

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
                            
                            {/* 🚀 NEW: TASK STATUS DROPDOWN */}
                            <div className="col-span-2 md:col-span-1"><label className="text-[11px] font-black text-gray-500 uppercase block mb-2">Task Status</label>
                            <select value={taskFormData.status} onChange={(e) => setTaskFormData({...taskFormData, status: e.target.value})} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none">
                                <option value="Active">Active</option>
                                <option value="Ending Soon">Ending Soon</option>
                                <option value="High Priority">High Priority</option>
                                <option value="Ended">Ended</option>
                            </select></div>
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

                        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                            {/* THE MARKDOWN TOOLBAR */}
                            <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between overflow-x-auto">
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => insertAtCursor('\n## ')} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white text-xs font-bold transition">H2</button>
                                    <button type="button" onClick={() => insertAtCursor('\n### Step X: Title\n1. Do this...\n2. Then this...\n')} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white text-xs font-bold transition">+ Step</button>
                                    <button type="button" onClick={() => insertAtCursor('\n> **Pro Tip:** \n')} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white text-xs font-bold transition">💡 Tip</button>
                                    
                                    {/* IMAGE UPLOAD BUTTON (ImgBB) */}
                                    <label className="cursor-pointer px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white text-xs font-bold transition flex items-center gap-2">
                                      {isImageUploading ? '⏳ Uploading...' : '🖼️ Add Image'}
                                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isImageUploading} />
                                    </label>
                                </div>

                                {/* AI ENHANCE BUTTON */}
                                <button type="button" onClick={handleAIEnhance} disabled={isAIEnhancing} className="flex items-center gap-2 px-4 py-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-600/40 hover:text-purple-300 text-xs font-black uppercase tracking-wider transition">
                                  {isAIEnhancing ? '✨ Processing...' : '✨ Polish with AI'}
                                </button>
                            </div>
                            
                            {/* THE TEXTAREA */}
                            <textarea 
                              id="markdown-editor"
                              required 
                              value={taskFormData.tutorial_markdown || ''} 
                              onChange={(e) => setTaskFormData({...taskFormData, tutorial_markdown: e.target.value})} 
                              rows="16" 
                              placeholder="Write your rough draft here, paste links, or use the buttons above..." 
                              className="w-full bg-transparent text-white px-5 py-5 resize-y outline-none font-mono text-[13px] leading-relaxed custom-scrollbar"
                            ></textarea>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[24px] font-black tracking-tighter">Inventory Management</h2>
              
              {/* 🚀 NEW: Force Sync Button */}
              <button 
                onClick={forceSyncSocialScores} 
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isSubmitting ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white'}`}
              >
                {isSubmitting ? 'Syncing...' : '⚡ Force Sync Social Scores'}
              </button>
            </div>
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
                  
                  <div className="flex items-center gap-3">
                    {task.status === 'Promoted' ? (
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                         ✅ Promoted
                       </span>
                    ) : (
                      <>
                        <button onClick={() => processAlphaItem(task.id, 'Dismissed', true)} className="px-4 py-2 bg-gray-800 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition">Dismiss</button>
                        <button onClick={() => openShortTaskModal(task)} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-lg shadow-blue-900/20">Promote to Sprint 🚀</button>
                      </>
                    )}
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
                  const priority = getPriorityMeta(item.ai_importance_score);
                  
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
                      <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col justify-between h-[300px] shadow-sm">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="bg-indigo-900/30 text-indigo-400 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">{item.project_name || 'Unknown'}</span>
                                  <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider ${priority.className}`}>{priority.label}</span>
                                </div>
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
                      <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col justify-between h-[300px] shadow-sm">
                          <div>
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                      <span className="bg-sky-900/30 text-sky-400 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">@TWITTER</span>
                                      {item.project_name && <span className="text-[10px] font-bold text-gray-500 uppercase">{item.project_name}</span>}
                                      <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider ${priority.className}`}>{priority.label}</span>
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
                      <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col h-[300px] shadow-sm">
                          <div className="flex gap-3 mb-3 shrink-0">
                            <span className="bg-orange-900/30 text-orange-400 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">{platformName}</span>
                            <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider ${priority.className}`}>{priority.label}</span>
                          </div>
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
        {/* ================================================== */}
        {/* 🏃 NEW: MANAGE ACTIVE SPRINTS TAB                   */}
        {/* ================================================== */}
        {activeTab === 'manage-sprints' && (
          <div className="max-w-6xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-[24px] font-black tracking-tighter mb-1">Active Sprints Inventory</h2>
                <p className="text-[13px] text-gray-400">Manage the short tasks currently live on the public feed.</p>
              </div>
              {/* 🚀 THE ADD MANUAL SPRINT BUTTON */}
              <button 
                onClick={openNewSprintModal} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
              >
                + Add Custom Sprint
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {activeSprints.map(sprint => (
                <div key={sprint.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    {sprint.logo_url ? (
                      <img src={sprint.logo_url} className="w-10 h-10 rounded-lg object-cover bg-white p-0.5" alt="logo" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-xl">⚡</div>
                    )}
                    <div>
                      <h4 className="font-bold text-white text-[15px] leading-tight">{sprint.task_name}</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">
                        {sprint.platform_name} • {sprint.recurring} • Ends: {sprint.end_date || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <a href={sprint.task_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-black uppercase rounded-lg transition-colors">
                      Test Link
                    </a>
                    {/* 🚀 THE EDIT BUTTON */}
                    <button onClick={() => openEditSprintModal(sprint)} className="px-4 py-2 bg-blue-900/20 text-blue-400 hover:bg-blue-600 hover:text-white text-[11px] font-black uppercase rounded-lg transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteSprint(sprint.id)} className="px-4 py-2 bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white text-[11px] font-black uppercase rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {activeSprints.length === 0 && (
                <div className="text-center py-12 text-gray-500 font-bold border border-dashed border-gray-800 rounded-2xl">
                  No active sprints found. Go to the Research Queue to promote some!
                </div>
              )}
            </div>
          </div>
        )}
        {/* ================================================== */}
        {/* 💰 NEW: FUNDRAISING TAB                            */}
        {/* ================================================== */}
        {activeTab === 'fundraising' && (
          <div className="max-w-6xl space-y-6">
            <div className="flex justify-between items-center bg-gray-900 p-6 rounded-2xl border border-gray-800">
              <div>
                <h2 className="text-[24px] font-black text-white tracking-tighter">Fundraising Database</h2>
                <p className="text-gray-400 font-medium text-sm mt-1">Manage seed rounds and investments. Logos auto-fetch from X.</p>
              </div>
              <button 
                onClick={() => {
                  setFundingForm({ id: null, project_name: '', round: '', funding_amount: '', lead_investor: '', category: '', sector: '', x_link: '', project_logo: '' });
                  setIsFundingModalOpen(true);
                }} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                + Add Funding
              </button>
            </div>

            {/* DATA TABLE */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-950 text-gray-500 text-[11px] uppercase font-black tracking-widest border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Amount / Round</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {fundingData.map((fund) => (
                    <tr key={fund.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={fund.project_logo !== 'N/A' && fund.project_logo ? fund.project_logo : `https://api.dicebear.com/7.x/shapes/svg?seed=${fund.project_name}`} alt="logo" className="w-10 h-10 rounded-lg bg-gray-800 object-cover" />
                        <span className="font-bold text-white text-[15px]">{fund.project_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-green-400">{fund.funding_amount}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase mt-0.5">{fund.round}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-medium">{fund.category}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => { setFundingForm(fund); setIsFundingModalOpen(true); }} className="px-3 py-1.5 bg-gray-800 hover:bg-blue-600 rounded-lg text-xs font-bold uppercase transition-colors">Edit</button>
                        <button onClick={() => handleDeleteFunding(fund.id)} className="px-3 py-1.5 bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold uppercase transition-colors">Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MODAL */}
            {isFundingModalOpen && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
                  <h3 className="text-[24px] font-black text-white tracking-tighter mb-6">{fundingForm.id ? 'Edit' : 'Add'} Funding Record</h3>
                  <form onSubmit={handleSaveFunding} className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Project Name *</label>
                        <input required type="text" value={fundingForm.project_name} onChange={e => setFundingForm({...fundingForm, project_name: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-[#1DA1F2] uppercase tracking-widest mb-2 block">X (Twitter) Link</label>
                        <input type="text" placeholder="https://x.com/username" value={fundingForm.x_link} onChange={e => setFundingForm({...fundingForm, x_link: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-[#1DA1F2] outline-none" />
                        <p className="text-[10px] text-gray-500 font-bold mt-1">Logo auto-generates from this URL</p>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Amount Raised</label>
                        <input type="text" placeholder="$5M" value={fundingForm.funding_amount} onChange={e => setFundingForm({...fundingForm, funding_amount: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Round</label>
                        <input type="text" placeholder="Seed, Series A..." value={fundingForm.round} onChange={e => setFundingForm({...fundingForm, round: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Lead Investors</label>
                        <input type="text" placeholder="a16z, Jump Crypto..." value={fundingForm.lead_investor} onChange={e => setFundingForm({...fundingForm, lead_investor: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Category</label>
                        <input type="text" placeholder="DeFi, L1, Web3..." value={fundingForm.category} onChange={e => setFundingForm({...fundingForm, category: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Sector / Bio</label>
                        <input type="text" placeholder="Prediction Protocol..." value={fundingForm.sector} onChange={e => setFundingForm({...fundingForm, sector: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-800">
                      <button type="button" onClick={() => setIsFundingModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest shadow-md transition-all">
                        {isSubmitting ? 'Saving...' : 'Save Record'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {commandCenterTaskDraft && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white">Convert Intel to Task</h3>
                <button onClick={() => setCommandCenterTaskDraft(null)} className="text-gray-400 hover:text-white text-sm font-bold">Close</button>
              </div>
              <form onSubmit={submitTaskDraftFromIntel} className="space-y-4">
                <div>
                  <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">Project</label>
                  <select
                    required
                    value={commandCenterTaskDraft.project_id}
                    onChange={(e) => setCommandCenterTaskDraft((prev) => ({ ...prev, project_id: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">-- Match project --</option>
                    {allProjects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">Task name</label>
                  <input
                    required
                    value={commandCenterTaskDraft.name}
                    onChange={(e) => setCommandCenterTaskDraft((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">Description</label>
                  <textarea
                    rows="4"
                    value={commandCenterTaskDraft.description}
                    onChange={(e) => setCommandCenterTaskDraft((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">Link</label>
                  <input
                    value={commandCenterTaskDraft.link}
                    onChange={(e) => setCommandCenterTaskDraft((prev) => ({ ...prev, link: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-bold">Create Task</button>
                  <button type="button" onClick={() => { dismissIntelItem(commandCenterTaskDraft.intel_id); setCommandCenterTaskDraft(null); }} className="bg-red-900/20 border border-red-700/30 text-red-300 rounded-lg px-4 py-2 text-sm font-bold">Dismiss Intel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* 🚀 NEW: SHORT TASK PROMOTION / EDIT MODAL          */}
        {/* ================================================== */}
        {isShortTaskModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 w-full max-w-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              {/* SMART TITLE: Changes based on Edit vs Promote vs New */}
              <h3 className="text-[24px] font-black text-white tracking-tighter mb-2">
                {shortTaskForm.id ? 'Edit Active Sprint' : (shortTaskForm.bounty_id ? 'Promote to Active Sprint' : 'Deploy Custom Sprint')}
              </h3>
              <p className="text-gray-400 text-sm mb-6">Modify the details, inject your referral link, and set up the reward tiers.</p>
              
              <form onSubmit={submitShortTask} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Task Name</label>
                    <input required value={shortTaskForm.task_name} onChange={e => setShortTaskForm({...shortTaskForm, task_name: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-2 block">Task Link (Referral URL)</label>
                    <input required value={shortTaskForm.task_link} onChange={e => setShortTaskForm({...shortTaskForm, task_link: e.target.value})} className="w-full bg-blue-950/20 border border-blue-900/50 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Logo URL</label>
                    <input required value={shortTaskForm.logo_url} onChange={e => setShortTaskForm({...shortTaskForm, logo_url: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-2 block">Banner Image URL</label>
                    <input value={shortTaskForm.banner_url} onChange={e => setShortTaskForm({...shortTaskForm, banner_url: e.target.value})} placeholder="https://..." className="w-full bg-gray-950 border border-emerald-900/30 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none" />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Platform</label>
                    <input value={shortTaskForm.platform_name} onChange={e => setShortTaskForm({...shortTaskForm, platform_name: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-orange-400 uppercase tracking-widest mb-2 block">API Slug (For Tracking)</label>
                    <input value={shortTaskForm.api_slug} onChange={e => setShortTaskForm({...shortTaskForm, api_slug: e.target.value})} placeholder="e.g., chainersnft" className="w-full bg-gray-950 border border-orange-900/30 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none" />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">End Date</label>
                    <input type="date" value={shortTaskForm.end_date} onChange={e => setShortTaskForm({...shortTaskForm, end_date: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Recurring</label>
                    <select value={shortTaskForm.recurring} onChange={e => setShortTaskForm({...shortTaskForm, recurring: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none">
                      <option value="One-time">One-time</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Description</label>
                    <textarea required value={shortTaskForm.task_description} onChange={e => setShortTaskForm({...shortTaskForm, task_description: e.target.value})} rows="3" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none" />
                  </div>
                </div>

                {/* DYNAMIC REWARD POOL */}
                <div className="bg-gray-950 border border-amber-900/30 p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[12px] font-black text-amber-500 uppercase tracking-widest">🏆 Reward Pool Tiers</h4>
                    <button type="button" onClick={() => setShortTaskForm({ ...shortTaskForm, rewards: [...shortTaskForm.rewards, { tier: '', prize: '' }] })} className="text-[10px] bg-amber-500/20 text-amber-500 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-500/30">+ Add Tier</button>
                  </div>
                  <div className="space-y-3">
                    {shortTaskForm.rewards.map((reward, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <input placeholder="e.g. 1st Place" value={reward.tier} onChange={(e) => handleRewardChange(index, 'tier', e.target.value)} className="w-1/2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
                        <input placeholder="e.g. $100" value={reward.prize} onChange={(e) => handleRewardChange(index, 'prize', e.target.value)} className="w-1/2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
                        <button type="button" onClick={() => setShortTaskForm({ ...shortTaskForm, rewards: shortTaskForm.rewards.filter((_, i) => i !== index) })} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg">✕</button>
                      </div>
                    ))}
                    {shortTaskForm.rewards.length === 0 && <p className="text-xs text-gray-500 italic">No rewards configured. (Optional)</p>}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                  <button type="button" onClick={() => setIsShortTaskModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
                  
                  {/* SMART SUBMIT BUTTON */}
                  <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest shadow-md transition-all">
                    {isSubmitting ? 'Saving...' : (shortTaskForm.id ? 'Save Changes 🔄' : 'Deploy Sprint 🚀')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}