import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Database, DollarSign, CheckSquare, X, Download, Image as ImageIcon, Sparkles, List, Lightbulb, Eye, EyeOff, Bold, Italic, Link as LinkIcon, Users, Coins } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

// --- AI PARSING UTILITY ---
const safeParseAI = (data) => {
  if (!data || typeof data !== 'string') return null;
  
  try {
    return JSON.parse(data);
  } catch (error) {
    try {
      const jsonMatch = data.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (extractError) {
      console.error('Failed to extract JSON:', extractError);
    }
    return null;
  }
};
// --- IMGBB ASSET PIPELINE (Secure Supabase Edge Function Version) ---
const autoMigrateLogoToImgBB = async (xUrl, entityName) => {
  if (!xUrl || xUrl.trim() === '' || xUrl === '#') return null;
  const handle = xUrl.match(/(?:twitter\.com|x\.com)\/([^\/?]+)/i)?.[1];
  if (!handle) return null;

  try {
    // Ping your secure server. No CORS blocks, no proxy failures!
    const { data, error } = await supabase.functions.invoke('upload-logo', {
      body: { handle: handle }
    });

    if (error) throw error;
    
    if (data && data.url) {
      console.log(`Success! Logo securely processed via backend: ${data.url}`);
      return data.url;
    }
  } catch (error) {
    console.error(`Asset migration failure for ${entityName}:`, error);
  }
  return null; 
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
  
  // --- PROMPT STATES ---
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedFoundersPrompt, setGeneratedFoundersPrompt] = useState('');
  const [generatedTokenomicsPrompt, setGeneratedTokenomicsPrompt] = useState('');
  const [generatedCompetitorPrompt, setGeneratedCompetitorPrompt] = useState('');
  const [generatedMasterPrompt, setGeneratedMasterPrompt] = useState('');

  // --- NEW: INVESTOR TAG STATES ---
  const [vcList, setVcList] = useState([]);
  const [investorSearch, setInvestorSearch] = useState('');
  const [showVcDropdown, setShowVcDropdown] = useState(false);
// --- NEW: ROLES STATE ---
  const [projectFormTab, setProjectFormTab] = useState('details'); 
  const [roles, setRoles] = useState([{ role_name: '', requirements: '', perks: '', difficulty_level: 'Medium' }]);
  useEffect(() => {
    fetchData();
    // NEW: Fetch all existing VCs for the autocomplete dropdown
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
      // 3. THIRD CHANGE: Add a loud alert to catch database rejections
      if (activeTab === 'projects') {
          alert(`Projects Failed to Load. Reason: ${error.message || error.details || JSON.stringify(error)}`);
      }
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

      // 1. Run the proxy migration pipeline
      const permanentLogoUrl = await autoMigrateLogoToImgBB(formData.x_link, handle);
      
      if (!permanentLogoUrl) {
        alert("The proxy couldn't fetch the Twitter profile picture. Double-check that the handle exists, or add a logo URL manually!");
      }

      // 2. Safe fallback only if the upload fails completely
      const finalLogo = permanentLogoUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${handle}`;
      
      if (activeTab === 'projects') {
        let fundingAmount = '';
        let leadInvestor = '';

        try {
          const { data: fundingData, error: lookupError } = await supabase
            .from('funding_opportunities')
            .select('*')
            .ilike('x_link', `%${handle}%`)
            .limit(1);

          if (!lookupError && fundingData && fundingData.length > 0) {
            fundingAmount = fundingData[0].funding_amount || '';
            leadInvestor = fundingData[0].lead_investor || '';
          }
        } catch (dbErr) {
          console.warn("Background funding database lookup skipped:", dbErr);
        }

        setFormData(prev => ({
          ...prev,
          logo_url: finalLogo, 
          funding: fundingAmount || prev.funding || '',
          lead_investors: leadInvestor || prev.lead_investors || ''
        }));
      } else if (activeTab === 'fundraising') {
        setFormData(prev => ({ ...prev, project_logo: finalLogo })); 
      }
    } catch (error) {
      console.error('Auto-fetch error tracking:', error);
      alert(`Auto-fetch execution halted: ${error.message || 'Network exception encountered.'}`);
    } finally {
      setIsAutoFetching(false);
    }
  };

  // --- AI PROMPT GENERATORS ---
  const generateMasterAIPrompt = () => {
    const prompt = `You are a cryptocurrency data researcher. Analyze the project described below and output ONLY a valid JSON object containing four specific keys. Do NOT output markdown formatting or code blocks.

---
CONTEXT DATA:
Project Name: ${formData.name || 'N/A'}
Twitter/X Profile: ${formData.x_link || 'N/A'}
Amount Raised: ${formData.funding || 'N/A'}
Lead Investors: ${formData.lead_investors || 'N/A'}
Project Description: ${formData.description || 'N/A'}
---

Use this exact JSON schema:
{
  "master_research": {
    "summary": "1-2 sentence overview of the project and its goals",
    "funding_strength": "Brief analysis of funding",
    "social_signals": "Brief analysis of social presence",
    "airdrop_signals": "Brief analysis of airdrop potential"
  },
  "master_founders": [
    {
      "name": "Founder Name",
      "role": "CEO / Co-founder / CTO",
      "background": "Ultra-short background, max 4-7 words",
      "twitter_handle": "exact_handle_without_@",
      "linkedin_url": "https://linkedin.com/in/..."
    }
  ],
  "master_tokenomics": {
    "ticker": "TOKEN",
    "total_supply": "1000000000",
    "community_allocation_percentage": 50.5,
    "investor_allocation_percentage": 15.0,
    "team_allocation_percentage": 20.0,
    "ecosystem_allocation_percentage": 14.5,
    "tge_date": "Q3 2024 / confirmed date / null",
    "vesting_notes": "Brief details on cliffs"
  },
  "master_competitors": {
    "project_similarity": "Brief 1-2 sentence comparison explaining market differentiators.",
    "competitors": [
      {
        "name": "Competitor Name",
        "domain": "competitordomain.com",
        "x_url": "https://x.com/exact_profile_handle",
        "followers": "450K",
        "past_airdrops": ["Season 1 (2024)"],
        "average_airdrop_usd": 1250
      }
    ]
  }
}`;
    setGeneratedMasterPrompt(prompt);
  };

  const handleMasterAIPaste = (value) => {
    try {
      const data = JSON.parse(value);
      setFormData(prev => ({
        ...prev,
        ai_research_data: data.master_research ? JSON.stringify(data.master_research, null, 2) : prev.ai_research_data,
        founders_details: data.master_founders ? JSON.stringify(data.master_founders, null, 2) : prev.founders_details,
        tokenomics_details: data.master_tokenomics ? JSON.stringify(data.master_tokenomics, null, 2) : prev.tokenomics_details,
        competitor_analysis: data.master_competitors ? JSON.stringify(data.master_competitors, null, 2) : prev.competitor_analysis
      }));
    } catch (e) {
      // Ignore parsing errors while they are typing/pasting
    }
  };
  const generateAIPrompt = () => {
    let prompt = '';
    if (activeTab === 'projects') {
      prompt = `Analyze the following crypto project deeply.\nFocus ONLY on:\n* Funding strength\n* Investors quality\n* Founder credibility\n* Social signals\n* Airdrop signals\n* Token status\n* Product tracking behavior\n* Competition\n\nProject Data:\nName: ${formData.name || ''}\nFunding: ${formData.funding || ''}\nInvestors: ${formData.lead_investors || ''}\nTwitter: ${formData.x_link || ''}\nDescription: ${formData.description || ''}\n\n---\nReturn ONLY JSON matching your required schema.`;
    } else if (activeTab === 'fundraising') {
      prompt = `Analyze the following funded crypto project deeply.\n\nProject Data:\nName: ${formData.project_name || ''}\nFunding: ${formData.funding_amount || ''}\nRound: ${formData.round || ''}\nInvestors: ${formData.lead_investor || ''}\nCategory: ${formData.category || ''}\n\n---\nReturn ONLY a raw JSON object with this exact schema (no markdown, no code blocks):\n{\n  "summary": "A punchy, 2-sentence bio of the project and what they are building.",\n  "early_tasks": [\n    { "task_name": "Name of early task (e.g. Join Discord)", "link": "https://link-to-task" }\n  ],\n  "analysis": "Your short 1-2 sentence analysis on funding strength, founder credibility, and airdrop potential."\n}`;
    }
    setGeneratedPrompt(prompt);
  };

  // --- NEW: SMART AI AUTO-FILL LISTENER ---
  const handleAIPaste = (value) => {
    handleInputChange('ai_research_data', value);
    try {
      const parsed = JSON.parse(value);
      if (parsed.summary) {
        // If sector is empty, fill it. If it has text, append the summary to the bottom.
        setFormData(prev => ({
          ...prev,
          sector: prev.sector && prev.sector.trim() !== '' ? `${prev.sector}\n\n${parsed.summary}` : parsed.summary
        }));
      }
    } catch (e) {
      // Not valid JSON yet, ignore silently while they paste
    }
  };

  // --- NEW: TAG INPUT LOGIC ---
  const handleAddInvestor = (name) => {
    if (!name.trim()) return;
    const current = formData.lead_investor ? formData.lead_investor.split(',').map(n => n.trim()).filter(Boolean) : [];
    if (!current.includes(name.trim())) {
      handleInputChange('lead_investor', [...current, name.trim()].join(', '));
    }
    setInvestorSearch('');
    setShowVcDropdown(false);
  };

  const handleRemoveInvestor = (nameToRemove) => {
    const current = formData.lead_investor ? formData.lead_investor.split(',').map(n => n.trim()).filter(Boolean) : [];
    handleInputChange('lead_investor', current.filter(n => n !== nameToRemove).join(', '));
  };

  const generateFoundersAIPrompt = () => {
    const prompt = `You are a cryptocurrency data researcher. Find the core founders and team details for the crypto project described below. 
    
Use the provided Context Data to uniquely identify the exact company and avoid mixing it up with entities of similar names.

---
CONTEXT DATA:
Project Name: ${formData.name || 'N/A'}
Twitter/X Profile: ${formData.x_link || 'N/A'}
Amount Raised: ${formData.funding || 'N/A'}
Lead Investors: ${formData.lead_investors || 'N/A'}
Project Description: ${formData.description || 'N/A'}
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
]`;
    setGeneratedFoundersPrompt(prompt);
  };

  const generateTokenomicsAIPrompt = () => {
    const prompt = `You are a cryptocurrency data researcher. Find the exact tokenomics distribution details for the crypto project described below.

Use the provided Context Data to uniquely identify the exact company and avoid mixing it up with entities of similar names.

---
CONTEXT DATA:
Project Name: ${formData.name || 'N/A'}
Twitter/X Profile: ${formData.x_link || 'N/A'}
Amount Raised: ${formData.funding || 'N/A'}
Lead Investors: ${formData.lead_investors || 'N/A'}
Project Description: ${formData.description || 'N/A'}
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
}`;
    setGeneratedTokenomicsPrompt(prompt);
  };

 const generateCompetitorAIPrompt = () => {
    const prompt = `You are a cryptocurrency data researcher. Find the top 5 direct competitors for the crypto project described below and perform a comparative analysis.

Use the provided Context Data to uniquely identify the exact company:
---
CONTEXT DATA:
Project Name: ${formData.name || 'N/A'}
Twitter/X Profile: ${formData.x_link || 'N/A'}
Project Description: ${formData.description || 'N/A'}
---

Output ONLY a raw JSON object with no markdown formatting, no \`\`\`json code blocks, and no extra text. 
Use this exact JSON structural schema:
{
  "project_similarity": "A brief 1-2 sentence comparison explaining if the project is similar to its competitors or what specific extra technology/differentiator it brings to the market.",
  "competitors": [
    {
      "name": "Competitor Name",
      "domain": "competitordomain.com", // Just the raw domain name, no https://
      "x_url": "https://x.com/exact_profile_handle",
      "followers": "Follower count string (e.g., 450K, 1.2M)",
      "past_airdrops": ["Season 1 (2024)", "Token Airdrop (2025)"],
      "average_airdrop_usd": 1250
    }
  ]
}

Ensure there are a maximum of 5 competitor objects inside the "competitors" array. If some metrics are unknown, use rough market estimates or historical distribution tracking values for average_airdrop_usd. For the domain, provide the exact root website URL without https (e.g., spectral.finance).`;
    setGeneratedCompetitorPrompt(prompt);
  };

  // --- ARTICLE EDITOR FUNCTIONS ---
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentVal = formData.tutorial_markdown || '';
    const selectedText = currentVal.substring(startPos, endPos);
    const newVal = currentVal.substring(0, startPos) + prefix + selectedText + suffix + currentVal.substring(endPos);
    handleInputChange('tutorial_markdown', newVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + prefix.length, endPos + prefix.length);
    }, 10);
  };

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

  // --- GROQ AI TASK EXTRACTION ---
  const generateTaskJSON = async (markdown) => {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!groqKey) {
      console.warn("No Groq API key found. Please add VITE_GROQ_API_KEY to your .env");
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
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a strict data extraction AI. You must output in valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API Error: ${err}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
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

  const toggleVisibility = async (projectId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase.from('projects').update({ is_public: newStatus }).eq('id', projectId);
      if (error) throw error;
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, is_public: newStatus } : p));
    } catch (error) {
      alert(`Toggle visibility failed: ${error.message}`);
    }
  };

  const handleSave = async () => {
    try {
      let result;
      if (activeTab === 'projects') {
        let parsedFounders = [];
        let parsedTokenomics = {};
        let parsedCompetitors = { project_similarity: "", competitors: [] };
        try { parsedFounders = JSON.parse(formData.founders_details || '[]'); } catch (e) { console.error("Founders Parse Error"); }
        try { parsedTokenomics = JSON.parse(formData.tokenomics_details || '{}'); } catch (e) { console.error("Tokenomics Parse Error"); }
        try { parsedCompetitors = JSON.parse(formData.competitor_analysis || '{"project_similarity": "", "competitors": []}'); } catch (e) { console.error("Competitors Parse Error"); }

        const projectData = {
          slug: formData.slug || '', funding: formData.funding || '', lead_investors: formData.lead_investors || '',
          x_link: formData.x_link || '', name: formData.name || '', logo_url: formData.logo_url || '',
          galxe_alias: formData.galxe_alias || '', discord_link: formData.discord_link || '',
          tier: formData.tier || '', status: formData.status || '', airdrop_status: formData.airdrop_status || '',
          description: formData.description || '', ai_research_data: formData.ai_research_data || '{}',
          founders_details: parsedFounders, tokenomics_details: parsedTokenomics,
          competitor_analysis: parsedCompetitors,
          is_public: formData.is_public !== false
        };

        let projectId = editingItem ? editingItem.id : null;
        
        // 1. Save Project Data
        if (editingItem) {
          result = await supabase.from('projects').update(projectData).eq('id', projectId).select();
        } else {
          result = await supabase.from('projects').insert([projectData]).select();
          if (result.data && result.data.length > 0) projectId = result.data[0].id;
        }
        
        if (result.error) throw result.error;

        // 2. Save Discord Roles Data
        if (projectId) {
          // Delete old roles to prevent duplicates when updating
          await supabase.from('discord_roles').delete().eq('project_id', projectId);
          
          const validRoles = roles.filter(r => r.role_name && r.role_name.trim() !== '');
          if (validRoles.length > 0) {
            const rolesToInsert = validRoles.map(role => ({
              ...role,
              project_id: projectId
            }));
            const { error: rolesError } = await supabase.from('discord_roles').insert(rolesToInsert);
            if (rolesError) throw rolesError;
          }
        }

      } else if (activeTab === 'tasks') {
        
        // 1. Automatically generate the post_json if we have markdown
        let generatedPostJson = {};
        if (formData.tutorial_markdown && formData.tutorial_markdown.trim() !== '') {
          try {
            // Optional: you can add a loading state here if you want the UI button to show "Extracting AI..."
            generatedPostJson = await generateTaskJSON(formData.tutorial_markdown);
          } catch (error) {
            console.error("Failed to generate JSON with Groq:", error);
            alert("Warning: AI JSON extraction failed. Saving task with empty JSON.");
          }
        }

        // 2. Prepare the payload for Supabase
        const taskData = {
          project_id: formData.project_id || '', 
          name: formData.name || '', 
          recurring: formData.recurring || 'One-time',
          link: formData.link || '', 
          cost: parseFloat(formData.cost) || 0, 
          time_minutes: parseInt(formData.time_minutes) || 0,
          end_date: formData.end_date || null, 
          status: formData.status || 'Active', 
          task_category: formData.task_category || null,
          rpc_url: formData.rpc_url || '',
          contract_address: formData.contract_address || '', 
          tutorial_markdown: formData.tutorial_markdown || '',
          post_json: generatedPostJson, // <-- INJECTED GROQ JSON HERE
          external_link: formData.external_link || '', 
          source: entryType
        };

        // 3. Save to database
        if (editingItem) {
          result = await supabase.from('tasks').update(taskData).eq('id', editingItem.id);
        } else {
          result = await supabase.from('tasks').insert([taskData]);
        }

      } else {
        // === 1. SYNC VCs TO PIONEER PROFILES ===
        if (formData.lead_investor) {
          const vcNames = formData.lead_investor.split(',').map(n => n.trim()).filter(Boolean);
          for (const vcName of vcNames) {
            const { data: existingVc } = await supabase.from('pioneer_profiles').select('id').ilike('name', vcName).single();
            if (!existingVc) {
              await supabase.from('pioneer_profiles').insert({ name: vcName, pioneer_type: 'VC', smart_money: true });
            }
          }
        }

        // === 2. PARSE FOUNDERS ===
        let parsedFounders = [];
        try { parsedFounders = JSON.parse(formData.founders_details || '[]'); } catch (e) { console.error("Founders Parse Error"); }

        // === 3. SAVE FUNDING DATA ===
        const fundingData = {
          project_name: formData.project_name || '', 
          x_link: formData.x_link || '', 
          funding_amount: formData.funding_amount || '',
          round: formData.round || '', 
          lead_investor: formData.lead_investor || '', 
          category: formData.category || '',
          sector: formData.sector || '', 
          project_logo: formData.project_logo || '', 
          ai_research_data: formData.ai_research_data || '{}',
          founders_details: parsedFounders
        };

        if (editingItem) {
          result = await supabase.from('funding_opportunities').update(fundingData).eq('id', editingItem.id);
        } else {
          result = await supabase.from('funding_opportunities').insert([fundingData]);
        }
      }
      
      if (result.error) throw result.error;
      closeModal();
      fetchData();
    } catch (error) {
      alert(`Save failed: ${error.message}`);
    }
  };

  const openModal = async (item = null) => {
    setEditingItem(item);
    setProjectFormTab('details'); // Reset to details tab when opening

    if (item) {
      setFormData({ 
        ...item,
        ai_research_data: typeof item.ai_research_data === 'object' ? JSON.stringify(item.ai_research_data, null, 2) : item.ai_research_data,
        founders_details: typeof item.founders_details === 'object' ? JSON.stringify(item.founders_details, null, 2) : item.founders_details,
        tokenomics_details: typeof item.tokenomics_details === 'object' ? JSON.stringify(item.tokenomics_details, null, 2) : item.tokenomics_details,
      });
      if (activeTab === 'tasks') setEntryType(item.source === 'article' ? 'article' : 'standard');

      // NEW: Fetch existing roles when editing a project
      if (activeTab === 'projects') {
        const { data: existingRoles } = await supabase.from('discord_roles').select('*').eq('project_id', item.id);
        if (existingRoles && existingRoles.length > 0) {
          setRoles(existingRoles);
        } else {
          setRoles([{ role_name: '', requirements: '', perks: '', difficulty_level: 'Medium' }]);
        }
      }
    } else {
      setFormData(getDefaultFormData());
      if (activeTab === 'tasks') setEntryType('standard');
      setRoles([{ role_name: '', requirements: '', perks: '', difficulty_level: 'Medium' }]); // Reset roles
    }
    
    setGeneratedPrompt('');
    setGeneratedFoundersPrompt('');
    setGeneratedTokenomicsPrompt('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const getDefaultFormData = () => {
    if (activeTab === 'projects') return { slug: '', funding: '', lead_investors: '', x_link: '', name: '', logo_url: '', galxe_alias: '', discord_link: '', tier: 'Tier 3', status: 'Waitlist', airdrop_status: 'Unconfirmed', description: '', ai_research_data: '{}', founders_details: '[]', tokenomics_details: '{}', is_public: true };
    if (activeTab === 'tasks') return { project_id: '', name: '', recurring: 'One-time', link: '', cost: 0, time_minutes: 0, end_date: '', status: 'Active', task_category: '', rpc_url: '', contract_address: '', tutorial_markdown: '', external_link: '' };
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
                    <><th className="px-6 py-4">Project Name</th><th className="px-6 py-4">Tier</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Visibility</th><th className="px-6 py-4 text-right">Actions</th></>
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
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleVisibility(p.id, p.is_public)}
                        className={`p-2 rounded-lg transition-colors ${
                          p.is_public 
                            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                        title={p.is_public ? 'Public - Click to make private' : 'Private - Click to make public'}
                      >
                        {p.is_public ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </td>
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
                <div className="space-y-5">
                  
                  {/* --- THE NEW TOGGLE --- */}
                  <div className="flex p-1 bg-slate-100 rounded-lg w-fit border border-slate-200">
                    <button type="button" onClick={() => setProjectFormTab('details')} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase transition-all ${projectFormTab === 'details' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Project Details</button>
                    <button type="button" onClick={() => setProjectFormTab('roles')} className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase transition-all ${projectFormTab === 'roles' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Discord Roles</button>
                  </div>

                  {/* === TAB 1: PROJECT DETAILS (Your Exact Original Code) === */}
                  {projectFormTab === 'details' && (
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
                        <input required type="text" value={formData.name || ''} onChange={(e) => {
                          const val = e.target.value;
                          handleInputChange('name', val);
                          const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                          handleInputChange('slug', autoSlug);
                        }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900" placeholder="Project Name" />
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
                        <label className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.is_public !== false} 
                            onChange={(e) => handleInputChange('is_public', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span>Is Public (visible to users)</span>
                        </label>
                        <p className="text-xs text-slate-500 mt-1 ml-7">Uncheck to hide this project from public view</p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Project Description</label>
                        <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows="2" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900 resize-none" placeholder="Short bio..." />
                      </div>
                      {/* --- MASTER AI AUTO-FILL --- */}
                      <div className="md:col-span-2 pt-6 mt-4 border-t-2 border-slate-200">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                          <label className="block text-xs font-black text-indigo-700 uppercase tracking-widest mb-2 flex items-center gap-1"><Sparkles size={14}/> Ultimate AI Auto-Fill (All 4 Modules)</label>
                          <p className="text-xs text-indigo-600 mb-3 font-medium">Generate one master prompt to fetch Research, Founders, Tokenomics, and Competitors simultaneously.</p>
                          <div className="flex items-center gap-2 mb-3">
                            <button type="button" onClick={generateMasterAIPrompt} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
                              ⚡ Generate Master Prompt
                            </button>
                            <button 
                              type="button"
                              onClick={() => navigator.clipboard.writeText(generatedMasterPrompt)} 
                              disabled={!generatedMasterPrompt}
                              className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm ${
                                generatedMasterPrompt ? 'bg-white text-indigo-700 hover:bg-slate-50 border border-indigo-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'
                              }`}
                            >
                              📋 Copy Master Prompt
                            </button>
                          </div>
                          {generatedMasterPrompt && (
                            <textarea 
                              value={generatedMasterPrompt || ''} 
                              readOnly
                              rows="3" 
                              className="w-full px-3 py-2 bg-slate-900 text-indigo-300 font-mono text-xs border border-slate-800 rounded-lg mb-3"
                            />
                          )}
                          <textarea 
                            onChange={(e) => handleMasterAIPaste(e.target.value)} 
                            rows="2" 
                            className="w-full px-3 py-3 bg-white text-slate-800 font-mono text-[11px] border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner" 
                            placeholder="Paste the Master JSON output here. The 4 boxes below will auto-fill instantly..."
                          />
                        </div>
                      </div>
                      
                      {/* --- AI RESEARCH DATA --- */}
                      <div className="md:col-span-2 pt-4 border-t border-slate-100">
                        <label className="block text-[11px] font-black text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles size={12} /> AI Research Data (JSON)</label>
                        <div className="flex items-center gap-2 mb-2">
                          <button type="button" onClick={generateAIPrompt} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">
                            ⚡ Generate Prompt
                          </button>
                          <button 
                            type="button"
                            onClick={() => navigator.clipboard.writeText(generatedPrompt)} 
                            disabled={!generatedPrompt}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                              generatedPrompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            📋 Copy Prompt
                          </button>
                        </div>
                        {generatedPrompt && (
                          <textarea 
                            value={generatedPrompt || ''} 
                            readOnly
                            rows="4" 
                            className="w-full px-3 py-2 bg-slate-900 text-green-400 font-mono text-xs border border-slate-800 rounded-lg mb-2"
                          />
                        )}
                        <textarea 
                          value={formData.ai_research_data || '{}'} 
                          onChange={(e) => handleInputChange('ai_research_data', e.target.value)} 
                          rows="3" 
                          className="w-full px-3 py-2 bg-slate-900 text-green-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 resize-none custom-scrollbar" 
                          placeholder="Paste AI output (JSON will be auto-processed)"
                        />
                      </div>

                      {/* --- NEW: FOUNDERS DETAILS --- */}
                      <div className="md:col-span-2 pt-4 border-t border-slate-100">
                        <label className="block text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={12} /> Founders Details (JSON Array)</label>
                        <div className="flex items-center gap-2 mb-2">
                          <button type="button" onClick={generateFoundersAIPrompt} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
                            ⚡ Generate Founders Prompt
                          </button>
                          <button 
                            type="button"
                            onClick={() => navigator.clipboard.writeText(generatedFoundersPrompt)} 
                            disabled={!generatedFoundersPrompt}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                              generatedFoundersPrompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            📋 Copy Prompt
                          </button>
                        </div>
                        {generatedFoundersPrompt && (
                          <textarea 
                            value={generatedFoundersPrompt || ''} 
                            readOnly
                            rows="4" 
                            className="w-full px-3 py-2 bg-slate-900 text-blue-400 font-mono text-xs border border-slate-800 rounded-lg mb-2"
                          />
                        )}
                        <textarea 
                          value={formData.founders_details || '[]'} 
                          onChange={(e) => handleInputChange('founders_details', e.target.value)} 
                          rows="3" 
                          className="w-full px-3 py-2 bg-slate-900 text-blue-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none custom-scrollbar" 
                          placeholder="Paste AI output (JSON Array) here..."
                        />
                      </div>

                      {/* --- NEW: TOKENOMICS DETAILS --- */}
                      <div className="md:col-span-2 pt-4 border-t border-slate-100">
                        <label className="block text-[11px] font-black text-purple-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Coins size={12} /> Tokenomics Details (JSON)</label>
                        <div className="flex items-center gap-2 mb-2">
                          <button type="button" onClick={generateTokenomicsAIPrompt} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors">
                            ⚡ Generate Tokenomics Prompt
                          </button>
                          <button 
                            type="button"
                            onClick={() => navigator.clipboard.writeText(generatedTokenomicsPrompt)} 
                            disabled={!generatedTokenomicsPrompt}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                              generatedTokenomicsPrompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            📋 Copy Prompt
                          </button>
                        </div>
                        {generatedTokenomicsPrompt && (
                          <textarea 
                            value={generatedTokenomicsPrompt || ''} 
                            readOnly
                            rows="4" 
                            className="w-full px-3 py-2 bg-slate-900 text-purple-400 font-mono text-xs border border-slate-800 rounded-lg mb-2"
                          />
                        )}
                        <textarea 
                          value={formData.tokenomics_details || '{}'} 
                          onChange={(e) => handleInputChange('tokenomics_details', e.target.value)} 
                          rows="3" 
                          className="w-full px-3 py-2 bg-slate-900 text-purple-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none custom-scrollbar" 
                          placeholder="Paste AI output (JSON object) here..."
                        />
                      </div>

                      {/* --- CORRECTED PLACE: COMPETITOR ANALYSIS DATA MATRIX --- */}
                      <div className="md:col-span-2 pt-4 border-t border-slate-100">
                        <label className="block text-[11px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles size={12} /> Competitor Matrix Analysis (JSON)</label>
                        <div className="flex items-center gap-2 mb-2">
                          <button type="button" onClick={generateCompetitorAIPrompt} className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors">
                            ⚡ Generate Competitors Prompt
                          </button>
                          <button 
                            type="button"
                            onClick={() => navigator.clipboard.writeText(generatedCompetitorPrompt)} 
                            disabled={!generatedCompetitorPrompt}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                              generatedCompetitorPrompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            📋 Copy Prompt
                          </button>
                        </div>
                        {generatedCompetitorPrompt && (
                          <textarea 
                            value={generatedCompetitorPrompt || ''} 
                            readOnly
                            rows="4" 
                            className="w-full px-3 py-2 bg-slate-900 text-amber-400 font-mono text-xs border border-slate-800 rounded-lg mb-2"
                          />
                        )}
                        <textarea 
                          value={formData.competitor_analysis || '{"project_similarity": "", "competitors": []}'} 
                          onChange={(e) => handleInputChange('competitor_analysis', e.target.value)} 
                          rows="3" 
                          className="w-full px-3 py-2 bg-slate-900 text-amber-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none custom-scrollbar" 
                          placeholder='Paste AI output object format here...'
                        />
                      </div>
                    </div>
                  )}

                  {/* === TAB 2: DISCORD ROLES === */}
                  {projectFormTab === 'roles' && (
                    <div className="space-y-4">
                      {roles.map((role, index) => (
                        <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
                          <button type="button" onClick={() => setRoles(roles.filter((_, i) => i !== index))} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Role Name</label>
                              <input type="text" value={role.role_name || ''} onChange={(e) => {
                                const newRoles = [...roles]; newRoles[index].role_name = e.target.value; setRoles(newRoles);
                              }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900" placeholder="e.g., Early Adopter" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Difficulty</label>
                              <select value={role.difficulty_level || 'Medium'} onChange={(e) => {
                                const newRoles = [...roles]; newRoles[index].difficulty_level = e.target.value; setRoles(newRoles);
                              }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                                <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Requirements</label>
                              <textarea value={role.requirements || ''} onChange={(e) => {
                                const newRoles = [...roles]; newRoles[index].requirements = e.target.value; setRoles(newRoles);
                              }} rows="1" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 resize-none" placeholder="Reach level 10..." />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Perks</label>
                              <input type="text" value={role.perks || ''} onChange={(e) => {
                                const newRoles = [...roles]; newRoles[index].perks = e.target.value; setRoles(newRoles);
                              }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900" placeholder="Airdrop multiplier..." />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button type="button" onClick={() => setRoles([...roles, { role_name: '', requirements: '', perks: '', difficulty_level: 'Medium' }])} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-xl font-bold text-xs transition-colors">
                        <Plus size={16} /> Add Another Role
                      </button>
                    </div>
                  )}
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
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                            Task Category / Milestone
                          </label>
                          <select
                            value={formData.task_category || ''}
                            onChange={(e) => handleInputChange('task_category', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-700"
                          >
                            <option value="">Select a category (Optional)...</option>
                            <option value="Waitlist">Waitlist</option>
                            <option value="Testnet Live">Testnet Live</option>
                            <option value="Mainnet Launched">Mainnet Launched</option>
                            <option value="Social Quest">Social Quest</option>
                            <option value="Airdrop Live">Airdrop Live</option>
                          </select>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium">
                            * Selecting this auto-updates the parent Project's status.
                          </p>
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
                                <button type="button" onClick={() => insertFormatting('**', '**')} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold transition shadow-sm flex items-center gap-1"><Bold size={12}/> Bold</button>
                                <button type="button" onClick={() => insertFormatting('*', '*')} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold transition shadow-sm flex items-center gap-1"><Italic size={12}/> Italic</button>
                                <button type="button" onClick={() => insertFormatting('[', '](url)')} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold transition shadow-sm flex items-center gap-1"><LinkIcon size={12}/> Link</button>
                                <button type="button" onClick={() => insertFormatting('\n- ', '')} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 text-[11px] font-bold transition shadow-sm flex items-center gap-1"><List size={12}/> Bullet</button>
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
                  {/* --- UPGRADED LEAD INVESTORS (TAG INPUT) --- */}
                  <div className="md:col-span-2 relative">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lead Investors</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[42px] items-center focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                      {(formData.lead_investor ? formData.lead_investor.split(',').map(n => n.trim()).filter(Boolean) : []).map((inv, idx) => (
                        <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700 rounded-md">
                          {inv}
                          <button type="button" onClick={() => handleRemoveInvestor(inv)} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        value={investorSearch}
                        onChange={(e) => {
                          setInvestorSearch(e.target.value);
                          setShowVcDropdown(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleAddInvestor(investorSearch); }
                        }}
                        onFocus={() => setShowVcDropdown(true)}
                        onBlur={() => setTimeout(() => setShowVcDropdown(false), 200)}
                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-900" 
                        placeholder="Type VC name and press Enter..." 
                      />
                    </div>
                    {showVcDropdown && investorSearch.trim() !== '' && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                        {vcList.filter(vc => vc.toLowerCase().includes(investorSearch.toLowerCase())).map((vc, idx) => (
                          <div key={idx} onMouseDown={(e) => { e.preventDefault(); handleAddInvestor(vc); }} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm font-medium text-slate-700 border-b border-slate-100 last:border-0">
                            {vc}
                          </div>
                        ))}
                        {!vcList.some(vc => vc.toLowerCase() === investorSearch.toLowerCase()) && (
                          <div onMouseDown={(e) => { e.preventDefault(); handleAddInvestor(investorSearch); }} className="px-4 py-2 bg-slate-50 hover:bg-blue-50 cursor-pointer text-sm font-bold text-blue-600">
                            + Add "{investorSearch}" as new investor
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sector / Bio (Auto-fills from AI)</label>
                    <textarea value={formData.sector || ''} onChange={(e) => handleInputChange('sector', e.target.value)} rows="3" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-slate-900 resize-none" />
                  </div>
                  
                  {/* --- NEW: FOUNDERS DETAILS IN FUNDRAISING --- */}
                  <div className="md:col-span-2 pt-4 border-t border-slate-100">
                    <label className="block text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={12} /> Founders Details (JSON Array)</label>
                    <div className="flex items-center gap-2 mb-2">
                      <button type="button" onClick={generateFoundersAIPrompt} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
                        ⚡ Generate Founders Prompt
                      </button>
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText(generatedFoundersPrompt)} 
                        disabled={!generatedFoundersPrompt}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                          generatedFoundersPrompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        📋 Copy Prompt
                      </button>
                    </div>
                    {generatedFoundersPrompt && (
                      <textarea value={generatedFoundersPrompt || ''} readOnly rows="4" className="w-full px-3 py-2 bg-slate-900 text-blue-400 font-mono text-xs border border-slate-800 rounded-lg mb-2" />
                    )}
                    <textarea 
                      value={formData.founders_details || '[]'} 
                      onChange={(e) => handleInputChange('founders_details', e.target.value)} 
                      rows="3" 
                      className="w-full px-3 py-2 bg-slate-900 text-blue-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none custom-scrollbar" 
                      placeholder="Paste AI output (JSON Array) here..."
                    />
                  </div>

                  {/* --- UPGRADED AI RESEARCH DATA (WITH AUTO-FILL LISTENER) --- */}
                  <div className="md:col-span-2 pt-4 border-t border-slate-100">
                    <label className="block text-[11px] font-black text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles size={12} /> AI Research Data (JSON)</label>
                    <div className="flex items-center gap-2 mb-2">
                      <button type="button" onClick={generateAIPrompt} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">
                        ⚡ Generate Smart Prompt
                      </button>
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText(generatedPrompt)} 
                        disabled={!generatedPrompt}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                          generatedPrompt ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        📋 Copy Prompt
                      </button>
                    </div>
                    {generatedPrompt && (
                      <textarea value={generatedPrompt || ''} readOnly rows="4" className="w-full px-3 py-2 bg-slate-900 text-green-400 font-mono text-xs border border-slate-800 rounded-lg mb-2" />
                    )}
                    <textarea 
                      value={formData.ai_research_data || '{}'} 
                      onChange={(e) => handleAIPaste(e.target.value)} 
                      rows="3" 
                      className="w-full px-3 py-2 bg-slate-900 text-green-400 font-mono text-[11px] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 resize-none custom-scrollbar" 
                      placeholder="Paste AI output here (Summary will auto-fill above!)"
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