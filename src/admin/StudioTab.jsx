import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';


import { 
  Layout, Download, ArrowLeft, 
  DollarSign, Zap, Trophy, Newspaper, Rocket, Search, CheckCircle2, Type,
  Sparkles, X, Copy, Check, Loader2, Menu,
  Users, Target, PieChart, Info, ClipboardList, Gift, Star, MoreHorizontal, ExternalLink,
  Server, Landmark, Megaphone, Coins, Database // 🚀 ADDED DATABASE HERE
} from 'lucide-react';
import { supabase } from '../supabaseClient'; 

// --- 1. THE NEW CATEGORY & TEMPLATE DICTIONARY ---
const STUDIO_STRUCTURE = {
  'Funding': [
    'Single Funding Alert', 
    'Top 5 Funding Weekly', 
    'Top Funding Category'
  ],
  'Project': [
    'Single Airdrop Guide', 
    'Top 5 Testnet Airdrops', 
    'Single Early Alpha', 
    'Top 5 Early Alpha',
    'Discord Roles',
    'Tokenomics'
  ],
  'Task': [
  'Single Task Update',
  'Daily Tasks',
  'Daily Airdrop Activities',
  'Major Tasks This Week'
],
  'User': [
    'Top 5 Active Users', 
    'Top 10 Sybil Wallets'
  ],
  'News': [
    'Onchain News', 
    'Motivational Quote'
  ]
};

export default function StudioTab({ onNavigate }) {
  // --- STATE MANAGEMENT ---
  const [isInnerSidebarOpen, setIsInnerSidebarOpen] = useState(true); // 🚀 THE MISSING STATE!
  const [activeCategory, setActiveCategory] = useState('Funding');
  const [activeTemplate, setActiveTemplate] = useState('Single Funding Alert');
  
  // Data Fetching State
  const [availableData, setAvailableData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection State
  const [selectedItems, setSelectedItems] = useState([]); // Array to handle both Single and Top 5
  const [newsHeadline, setNewsHeadline] = useState(''); // Text input for News
  const [newsImageUrl, setNewsImageUrl] = useState(''); // 🚀 NEW: State for the background image

  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // --- 🚀 NEW: AI TWEET GENERATION STATE ---
  const [isTweetModalOpen, setIsTweetModalOpen] = useState(false);
  const [isGeneratingTweet, setIsGeneratingTweet] = useState(false);
  const [generatedTweet, setGeneratedTweet] = useState({ x_post: '', tg_post: '' });
  const [isCopied, setIsCopied] = useState(false);

  // --- 🚀 COMMAND CENTER: SCHEDULING STATE ---
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [targetChannels, setTargetChannels] = useState(['x', 'telegram']);
  const [isScheduling, setIsScheduling] = useState(false);
const [investorLogos, setInvestorLogos] = useState({});

  // Add this effect to fetch logos whenever the selected items change
  useEffect(() => {
    const fetchInvestorLogos = async () => {
      if (selectedItems.length === 0) return;
      
      // Extract all investor names from the selected projects
      const names = selectedItems.flatMap(item => 
        (item.raw?.lead_investor || '').split(',').map(n => n.trim())
      ).filter(Boolean);

      if (names.length === 0) return;

      const { data } = await supabase
        .from('pioneer_profiles')
        .select('name, logo_url')
        .in('name', [...new Set(names)]);

      if (data) {
        const map = data.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.logo_url }), {});
        setInvestorLogos(map);
      }
    };

    fetchInvestorLogos();
  }, [selectedItems]);
  const handleGenerateTweet = async () => {
    if (selectedItems.length === 0 && activeCategory !== 'News') {
      alert("Please select data first to generate a tweet!");
      return;
    }
    
    setIsTweetModalOpen(true);
    setIsGeneratingTweet(true);

    try {
      // 🚀 Native call to the Supabase Edge Function you just built in the browser!
      const { data, error } = await supabase.functions.invoke('generate-tweet', {
        body: { 
          template: activeTemplate,
          data: selectedItems 
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error); // Catch Grok errors
      
      // Map the new dual-channel AI response directly to state
      setGeneratedTweet({
        x_post: data.x_post,
        tg_post: data.tg_post
      });
      
    } catch (error) {
      console.error("Grok Generation Failed:", error);
      setGeneratedTweet("🚨 Error parsing the alpha. Please check your connection and try again.");
    } finally {
      setIsGeneratingTweet(false);
    }
  };
  // --- 🚀 NEW: BACKGROUND AI FOR DIRECT SCHEDULING ---
  const handleOpenSchedule = async () => {
    if (selectedItems.length === 0 && activeCategory !== 'News') {
      alert("Please select data first!");
      return;
    }
    
    setIsScheduleModalOpen(true); // Open modal instantly so user can pick a time

    // Fire AI in the background if it hasn't been generated yet!
    if (!generatedTweet) {
      setIsGeneratingTweet(true);
      try {
        const payloadData = activeCategory === 'News' ? { headline: newsHeadline } : selectedItems;
        const { data, error } = await supabase.functions.invoke('generate-tweet', {
          body: { template: activeTemplate, data: payloadData }
        });

        if (error) throw new Error(error.message);
        // Safely map the dual-channel data, falling back to the headline for News
        setGeneratedTweet({
          x_post: data.x_post || newsHeadline,
          tg_post: data.tg_post || newsHeadline
        });
      } catch (error) {
        console.error("Background AI Failed:", error);
        setGeneratedTweet(activeCategory === 'News' ? newsHeadline : "🚨 AI generation failed. Please edit manually.");
      } finally {
        setIsGeneratingTweet(false);
      }
    }
  };

  const handleCopyTweet = () => {
    navigator.clipboard.writeText(generatedTweet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- LOGIC: Reset selections when template changes ---
  useEffect(() => {
    setSelectedItems([]);
    setSearchTerm('');
    setNewsHeadline('');
    fetchDataForTemplate(activeTemplate);
  }, [activeTemplate]);

  // --- LOGIC: Dynamic Data Fetching based on Template ---
  const fetchDataForTemplate = async (template) => {
    if (!template || activeCategory === 'News') return; 
    
    setIsLoadingData(true);
    setAvailableData([]);

    try {
      let data = [];
      
      // 1. FUNDING TEMPLATES
      if (template === 'Top Funding Category') {
        const { data: rawData, error: supabaseError } = await supabase.from('funding_opportunities').select('*');
        if (supabaseError) console.error("Supabase Fetch Error:", supabaseError.message);

        if (rawData) {
          const parseAmt = (val) => {
            if (!val) return 0;
            let m = 1;
            const s = String(val).toUpperCase();
            if (s.includes('B')) m = 1000000000;
            else if (s.includes('M')) m = 1000000;
            else if (s.includes('K')) m = 1000;
            const n = parseFloat(s.replace(/[^0-9.]/g, ''));
            return isNaN(n) ? 0 : n * m;
          };
          
          const formatAmt = (n) => {
            if (n >= 1e9) return `$${(n/1e9).toFixed(1).replace(/\.0$/, '')}B`;
            if (n >= 1e6) return `$${(n/1e6).toFixed(1).replace(/\.0$/, '')}M`;
            return `$${n}`;
          };

          const catMap = {};
          rawData.forEach(d => {
            const catName = d.category || 'Other';
            if (!catMap[catName]) catMap[catName] = { deals: 0, total: 0 };
            catMap[catName].deals += 1;
            catMap[catName].total += parseAmt(d.funding_amount);
          });

          const aggregatedData = Object.keys(catMap).map((cat, i) => ({
            id: `cat-${i}`,
            name: cat,
            logo: `https://api.dicebear.com/7.x/shapes/svg?seed=${cat}`,
            sub: formatAmt(catMap[cat].total),
            raw: { amount: formatAmt(catMap[cat].total), deals: catMap[cat].deals, seed: cat }
          }));

          data = aggregatedData.sort((a, b) => parseAmt(b.sub) - parseAmt(a.sub));
        }

      } else if (template.includes('Funding')) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: fundingData, error: supabaseError } = await supabase
          .from('funding_opportunities')
          .select('*')
          .gte('last_updated', sevenDaysAgo.toISOString())
          .order('last_updated', { ascending: false })
          .limit(50);

        if (supabaseError) console.error("Supabase Fetch Error:", supabaseError.message);

        if (fundingData) {
          data = fundingData.map(d => ({ 
            id: d.id, name: d.project_name, logo: d.project_logo, sub: d.funding_amount, raw: d 
          }));
        }
      }
      
     // 2. PROJECT TEMPLATES
      else if (activeCategory === 'Project') {
        let query = supabase.from('projects').select('*, tasks(*), discord_roles(*)');
        
        if (template.includes('Testnet')) {
          query = query.ilike('status', '%Testnet%');
        } else if (template.includes('Early Alpha')) {
          query = query.lte('task_count', 2);
        } else if (template === 'Discord Roles') {
          // 🚀 ONLY SHOW PROJECTS THAT HAVE MAPPED DISCORD ROLES
          query = query.not('discord_roles', 'is', null);
        } else if (template === 'Tokenomics') {
          query = query.not('tokenomics_details', 'is', null).neq('tokenomics_details', '{}');
        }
        
        let response = await query.limit(50);
        if (response.data) {
          let projectData = response.data;
          
          // Client-side filter to completely drop rows where discord_roles is an empty array
          if (template === 'Discord Roles') {
            projectData = projectData.filter(d => d.discord_roles && d.discord_roles.length > 0);
          }
          
          data = projectData.map(d => ({ 
            id: d.id, name: d.name, logo: d.logo_url, sub: d.tier, raw: d 
          }));
        }
      }
      
      // 3. TASK TEMPLATES
      else if (activeCategory === 'Task') {
        let response;
        
        // 🚀 NEW: Auto-fetch only tasks created YESTERDAY for the new template
        if (template === 'Daily Airdrop Activities') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          response = await supabase
            .from('tasks')
            .select('*, projects(name, logo_url, tier)')
            .gte('created_at', yesterday.toISOString())
            .lt('created_at', today.toISOString())
            .order('created_at', { ascending: false })
            .limit(10);
        } else {
          // Default behavior for other task templates
          response = await supabase.from('tasks').select('*, projects(name, logo_url, tier)').limit(50);
        }

        if (response.data) {
          data = response.data.map(d => ({ 
            id: d.id, name: d.name, logo: d.projects?.logo_url, sub: d.projects?.name, raw: d 
          }));
        }
      }
      
      // 4. USER TEMPLATES
      else if (activeCategory === 'User') {
        if (template === 'Top 5 Active Users') {
          const { data: profiles } = await supabase.from('user_profiles').select('*');
          const { data: points } = await supabase.from('user_points').select('*');
          const { data: checkins } = await supabase.from('user_checkins').select('*');
          const { data: tasksDone } = await supabase.from('user_task_progress').select('auth_id');

          if (profiles) {
            const aggregatedUsers = profiles.map(profile => {
              const userPoints = points?.find(p => p.auth_id === profile.auth_id)?.total_points || profile.points || 0;
              const userCheckin = checkins?.find(c => c.auth_id === profile.auth_id);
              const streak = userCheckin ? userCheckin.streak_count : 0;
              const tasksCompleted = tasksDone?.filter(t => t.auth_id === profile.auth_id).length || 0;
              const isPremium = profile.subscription_tier !== 'Free';

              let compositeScore = userPoints + (streak * 10) + (tasksCompleted * 5);
              if (isPremium) compositeScore *= 1.2; 

              let displayName = 'Anonymous Sailor';
              if (profile.email) {
                const parts = profile.email.split('@');
                displayName = `${parts[0].substring(0, 3)}***@${parts[1]}`;
              } else if (profile.wallet_address) {
                displayName = `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`;
              }

              return {
                id: profile.auth_id,
                name: displayName,
                sub: `Score: ${Math.round(compositeScore)}`,
                logo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.auth_id}`,
                raw: { ...profile, userPoints, streak, tasksCompleted, compositeScore, displayName }
              };
            });

            data = aggregatedUsers.sort((a, b) => b.raw.compositeScore - a.raw.compositeScore);
          }
        } 
        else if (template === 'Top 10 Sybil Wallets') {
           const { data: sybils } = await supabase.from('user_profiles').limit(50);
           if (sybils) data = sybils.map(d => ({ id: d.auth_id, name: 'Wallet', sub: 'Score', raw: d }));
        }
      }

      // 🚀 THE FIX: This safely saves the data and closes the try/catch loop!
      setAvailableData(data);
    } catch (error) {
      console.error("Studio Fetch Error:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- LOGIC: Handle Single vs Multi (Top 5/10/7) Selection ---
  const handleSelect = (item) => {
    setGeneratedTweet('');
    let maxLimit = 1;
    if (activeTemplate.includes('Top 5')) {
      maxLimit = 5;
    } else if (activeTemplate.includes('Top 10') || activeTemplate === 'Top Funding Category') {
      maxLimit = 10;
    } else if (activeTemplate === 'Daily Tasks' || activeTemplate === 'Major Tasks This Week') {
      maxLimit = 7; // 🚀 Both task templates now allow 7 items!
    }

    const isMultiSelect = maxLimit > 1;

    if (isMultiSelect) {
      const isAlreadySelected = selectedItems.find(i => i.id === item.id);
      if (isAlreadySelected) {
        setSelectedItems(prev => prev.filter(i => i.id !== item.id)); // Deselect
      } else if (selectedItems.length < maxLimit) {
        setSelectedItems(prev => [...prev, item]); // Add
      } else {
        alert(`You can only select up to ${maxLimit} items for this template.`);
      }
    } else {
      setSelectedItems([item]); // Single select
    }
  };

  // Filter data based on search bar
  const filteredData = availableData.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sub?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  // --- 🚀 COMMAND CENTER: SCHEDULE LOGIC ---
  const handleSchedulePost = async () => {
    if (!scheduleDate) {
      alert("Please select a date and time!");
      return;
    }
    // 🚀 NEW: Block scheduling if AI is still thinking
    if (isGeneratingTweet) {
      alert("✨ AI is still writing your caption in the background! Please wait 2 seconds.");
      return;
    }
    
    
    setIsScheduling(true);

    try {
      // 1. Generate the Image via your existing Vercel API
      const canvasHtml = canvasRef.current.outerHTML;
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');body { margin: 0; padding: 0; background: #050505; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }</style></head><body>${canvasHtml}</body></html>`;

      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: fullHtml, options: { type: "png" }, gotoOptions: { waitUntil: "networkidle2" }, viewport: { width: 1200, height: 675, deviceScaleFactor: 2 } })
      });

      if (!response.ok) throw new Error('Backend image generation failed');
      const blob = await response.blob();

      // 2. Upload Blob to Supabase Storage (Bucket: 'posts')
      const fileName = `post_${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/png' });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('posts').getPublicUrl(fileName);

      // 3. Insert into the new Multi-Channel Database
      const { error: dbError } = await supabase.from('scheduled_posts').insert([{
        content_type: activeTemplate,
        raw_content: generatedTweet.tg_post || "AI parsing failed", 
        x_content: generatedTweet.x_post,
        tg_content: generatedTweet.tg_post,
        image_url: publicUrlData.publicUrl,
        target_channels: targetChannels,
        scheduled_at: new Date(scheduleDate).toISOString(),
        x_status: targetChannels.includes('x') ? 'pending' : 'ignored',
        tg_status: targetChannels.includes('telegram') ? 'pending' : 'ignored'
      }]);

      if (dbError) throw dbError;

      // 4. Success! Close modal and navigate to X Engine
      setIsScheduleModalOpen(false);
      setIsTweetModalOpen(false);
      if (onNavigate) onNavigate('x-engine');

    } catch (error) {
      console.error("Scheduling Error:", error);
      alert("Failed to schedule: " + error.message);
    } finally {
      setIsScheduling(false);
    }
  };

  // --- 🚀 THE TRUE BROWSERLESS EXPORT ---
  const handleExport = async () => {
    if (!canvasRef.current) return;
    setIsCapturing(true);

    try {
      // 1. Grab the raw HTML of the canvas
      const canvasHtml = canvasRef.current.outerHTML;

      // 2. Wrap it in a full HTML document with Tailwind CSS included
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
              body { margin: 0; padding: 0; background: #050505; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
              * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
            </style>
          </head>
          <body>
            ${canvasHtml}
          </body>
        </html>
      `;

      // 3. Send the request to our secure Vercel backend route!
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html: fullHtml,
          options: {
            type: "png"
          },
          gotoOptions: {
            waitUntil: "networkidle2" 
          },
          viewport: {
            width: 1200,
            height: 675,
            deviceScaleFactor: 2 
          }
        })
      });

      if (!response.ok) throw new Error('Backend generation failed');

      // 4. Download the generated image
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${activeTemplate.replace(/\s+/g, '_')}_AirdropSailor.png`;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Export Error:", error);
      alert("Export failed! Open your browser's Developer Tools (F12) -> Console to see the exact error message.");
    } finally {
      setIsCapturing(false);
    }
  };

  // --- 🚀 NEW: EXTRACT DATA FOR TEMPLATES ---
  // If a user clicks a project in the sidebar, grab its raw DB data. 
  // If nothing is selected yet, provide beautiful fallback data so the canvas isn't blank.
  const selectedProject = selectedItems[0]?.raw || {
    project_name: 'Real Finance',
    project_logo: null,
    round: 'Seed',
    funding_amount: '$29M',
    category: 'RWA',
    lead_investor: 'Nimbus Capital',
    sector: 'The first fully decentralised and permissionless L1 Blockchain that offers native tokenisation of Real-World Assets (RWA).'
  };

  return (
    <div className="h-full w-full bg-slate-900 flex flex-col lg:flex-row text-slate-200 font-sans overflow-hidden">
      
      {/* 🛠️ THE NEW CASCADING SIDEBAR */}
{/* 🛠️ THE NEW CASCADING SIDEBAR */}
      <div className={`bg-slate-800 flex flex-col h-full flex-shrink-0 z-20 shadow-xl border-r border-slate-700 transition-all duration-300 ease-in-out ${isInnerSidebarOpen ? 'w-full lg:w-[280px]' : 'w-0 overflow-hidden opacity-0 border-none'}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700 bg-slate-800/50 shrink-0">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-3 h-3" /> Back to App
          </Link>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-500" /> Sailor Studio
          </h1>
        </div>

        {/* 1. CATEGORY DROPDOWN */}
        <div className="p-4 border-b border-slate-700 shrink-0">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">1. Select Category</label>
          <select 
            value={activeCategory} 
            onChange={(e) => {
              setActiveCategory(e.target.value);
              setActiveTemplate(STUDIO_STRUCTURE[e.target.value][0]); 
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {Object.keys(STUDIO_STRUCTURE).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* 2. TEMPLATE DROPDOWN */}
        <div className="p-4 border-b border-slate-700 shrink-0">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 block">2. Select Template</label>
          <select 
            value={activeTemplate} 
            onChange={(e) => setActiveTemplate(e.target.value)}
            className="w-full bg-blue-900/20 border border-blue-500/30 rounded-lg px-3 py-2.5 text-sm font-bold text-blue-100 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {STUDIO_STRUCTURE[activeCategory].map(temp => <option key={temp} value={temp}>{temp}</option>)}
          </select>
        </div>

        {/* 3. DYNAMIC DATA SELECTOR */}
        <div className="p-4 flex-1 flex flex-col min-h-0">
          
          {activeCategory === 'News' ? (
            <div className="flex-1 flex flex-col gap-4">
               {/* 🚀 THIS IS THE MISSING IMAGE URL BOX */}
               <div className="shrink-0">
                 <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Layout className="w-3 h-3"/> Image URL</label>
                 <input 
                    type="text"
                    value={newsImageUrl}
                    onChange={(e) => setNewsImageUrl(e.target.value)}
                    placeholder="Paste image URL here..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500"
                 />
               </div>
               
               <div className="flex-1 flex flex-col min-h-0">
                 <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Type className="w-3 h-3"/> Write Headline</label>
                 <textarea 
                    value={newsHeadline}
                    onChange={(e) => setNewsHeadline(e.target.value)}
                    placeholder="Type breaking news or quote here..."
                    className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-emerald-500"
                 />
               </div>
            </div>
          ) :
          (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  3. Select Data {activeTemplate.includes('Top') && `(Max ${activeTemplate.includes('5') ? 5 : 10})`}
                </label>
                <span className="text-[10px] font-bold text-slate-500">{selectedItems.length} selected</span>
              </div>
              
              <div className="relative mb-3 shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeCategory.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Scrollable List */}
<div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent min-h-[300px] lg:min-h-0">
                {isLoadingData ? (
                  <div className="text-center p-4 text-xs font-bold text-slate-500 animate-pulse">Fetching Database...</div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center p-4 text-xs font-bold text-slate-500">No records found.</div>
                ) : (
                  filteredData.map(item => {
                    const isSelected = selectedItems.find(i => i.id === item.id);
                    return (
                      <button 
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between border transition-all ${
                          isSelected 
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm' 
                            : 'bg-slate-900/50 border-transparent hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {item.logo ? (
                            <img src={item.logo} className="w-8 h-8 rounded-md bg-white object-cover shrink-0" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-slate-700 shrink-0"></div>
                          )}
                          <div className="truncate">
                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>{item.name}</p>
                            <p className="text-[10px] font-medium text-slate-500 truncate">{item.sub}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🎨 MAIN STAGE: THE CANVAS AREA                           */}
      {/* ======================================================== */}
     <div className="w-full flex-1 flex flex-col h-full relative bg-black">
        
        {/* Top Control Bar */}
        <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 lg:px-8 shrink-0 pl-16">
          {/* 🚀 Note: I added 'pl-16' above so it doesn't overlap the Master Toggle button! */}

          <div className="flex items-center gap-3">
            {/* 🚀 INNER TOGGLE BUTTON */}
            <button 
              onClick={() => setIsInnerSidebarOpen(!isInnerSidebarOpen)}
              className="bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-md border border-slate-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="hidden sm:inline text-sm font-bold text-slate-500">Selection:</span>
            <span className="text-xs sm:text-sm font-black text-white px-3 py-1 bg-slate-800 rounded-md border border-slate-700">
               {activeCategory === 'News' ? 'Custom Text' : `${selectedItems.length} Selected`}
            </span>
          </div>
          
          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* 🚀 NEW: Direct Schedule Button */}
            <button 
              onClick={handleOpenSchedule}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md shadow-emerald-900/20"
            >
              <Rocket className="w-4 h-4 text-emerald-100" /> Schedule
            </button>

            {/* 🚀 NEW: Draft Tweet Button */}
            <button 
              onClick={handleGenerateTweet}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm border border-slate-700"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> Draft Tweet
            </button>

            <button 
              onClick={handleExport} 
              disabled={isCapturing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md"
            >
              {isCapturing ? 'Generating...' : <><Download className="w-4 h-4" /> Export Image</>}
            </button>
          </div>
          </div>

        {/* 16:9 Workspace */}
        <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#050505]">
          
          <div className="absolute transform scale-[0.35] sm:scale-[0.45] md:scale-[0.5] lg:scale-[0.6] xl:scale-[0.7] 2xl:scale-[0.85] origin-center transition-transform duration-300">
            <div className="relative shadow-2xl ring-1 ring-white/10" style={{ width: '1200px', height: '675px' }}>
              <div ref={canvasRef} className="w-full h-full bg-slate-900 overflow-hidden relative flex flex-col items-center justify-center">               
              {/* --- TEMPLATE 1: SINGLE FUNDING ALERT (DASHBOARD STYLE) --- */}
              {activeTemplate === "Single Funding Alert" && (
                <div className="w-[1200px] h-[675px] bg-[#2A52EA] flex flex-col items-center justify-center relative p-8 font-sans overflow-hidden">
                  
                  {/* OUTER HEADER */}
                  <div className="absolute top-6 left-10 right-10 flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs z-0">
                    <span>AirdropSailor</span>
                    <span>Funding Alert</span>
                    <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                  </div>

                  {/* MAIN WHITE CARD */}
                  <div className="w-full max-w-[1100px] h-full max-h-[580px] bg-white rounded-[2.5rem] shadow-2xl flex flex-col p-5 relative z-10">
                    
                    {/* 1. TOP BANNER */}
                    <div className="w-full h-[150px] bg-gradient-to-r from-[#3B28E3] to-[#4834FA] rounded-[2rem] p-6 flex items-center justify-between relative overflow-hidden shrink-0">
                      {/* Background Watermark Letter */}
                      <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-[12rem] font-black text-white/5 select-none leading-none">
                        {selectedProject?.project_name ? selectedProject.project_name.charAt(0).toUpperCase() : 'S'}
                      </div>

                      <div className="flex items-center gap-6 relative z-10">
                        <img 
                          src={selectedProject?.project_logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${selectedProject?.project_name || 'Sovra'}`} 
                          className="w-24 h-24 rounded-2xl bg-[#FFCC00] p-1.5 shadow-lg object-cover border-[3px] border-white/20" 
                          alt="Logo" 
                        />
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-[40px] font-black text-white tracking-tight">
                              {selectedProject?.project_name || 'Sovra'}
                            </h1>
                          </div>
                          <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border border-white/20 shadow-sm backdrop-blur-sm inline-block mt-1">
                            {selectedProject?.round || 'Pre-Seed'} Round
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 w-[420px] text-blue-50 font-medium text-[13px] leading-relaxed border-l border-white/20 pl-6">
                        {selectedProject?.sector || 'A self-custodial digital dollar platform enabling global users to securely hold, earn, and spend USDC without intermediaries'}
                      </div>
                    </div>

                    {/* 2. METRICS GRID (2x2) */}
                    <div className="grid grid-cols-2 gap-4 mt-5 shrink-0 px-2">
                      
                      {/* Metric 1: Total Raised */}
                      <div className="flex items-center justify-between bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <span className="text-slate-500 font-bold text-[15px]">Total Raised</span>
                        </div>
                        <span className="text-[34px] font-black text-slate-900 tracking-tighter">
                          {selectedProject?.funding_amount || '$2M'}
                        </span>
                      </div>

                      {/* Metric 2: Category */}
                      <div className="flex items-center justify-between bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <Layout className="w-4 h-4" />
                          </div>
                          <span className="text-slate-500 font-bold text-[15px]">Category</span>
                        </div>
                        <span className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                          {selectedProject?.category || 'RWA'}
                        </span>
                      </div>

                      {/* Metric 3: Funding Round */}
                      <div className="flex items-center justify-between bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                            <PieChart className="w-5 h-5" />
                          </div>
                          <span className="text-slate-500 font-bold text-[15px]">Funding Round</span>
                        </div>
                        <span className="text-2xl font-black text-slate-900 truncate pl-4">
                          {selectedProject?.round || 'Pre-Seed'}
                        </span>
                      </div>

                      {/* Metric 4: Airdrop Status */}
                      <div className="flex items-center justify-between bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                            <Zap className="w-5 h-5" />
                          </div>
                          <span className="text-slate-500 font-bold text-[15px]">Airdrop Status</span>
                        </div>
                        <span className="text-[22px] font-black text-amber-500">
                          Unconfirmed
                        </span>
                      </div>

                    </div>

                    {/* 3. BIG LEAD INVESTORS AREA */}
                    <div className="mt-6 px-2 flex-1 flex flex-col pb-2">
                      <h3 className="text-[17px] font-black text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                        <Users className="text-blue-600 w-5 h-5" /> Lead Investors
                      </h3>

                      <div className="flex gap-4 flex-wrap h-full pb-2">
                        {selectedProject?.lead_investor ? (
                          selectedProject.lead_investor.split(',').slice(0, 5).map((name, idx) => {
                            const cleanName = name.trim();
                            if (!cleanName) return null;
                            
                            const logo = investorLogos?.[cleanName];
                            const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=ffffff&textColor=0f172a&bold=true`;
                            const finalLogo = logo || fallbackLogo;

                            return (
                              <div key={idx} className="flex-1 min-w-[160px] bg-[#F8FAFC] border border-slate-100 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center gap-4 p-4 hover:border-blue-300 transition-colors">
                                <img 
                                  src={finalLogo} 
                                  alt={cleanName} 
                                  onError={(e) => { e.target.onerror = null; e.target.src = fallbackLogo; }}
                                  className="w-14 h-14 rounded-full object-cover shrink-0 border border-slate-100 bg-slate-50" 
                                />
                                <span className="text-[13px] font-black text-slate-800 tracking-tight text-center w-full truncate">{cleanName}</span>
                              </div>
                            );
                          })
                        ) : (
                          // Fallback dummy boxes to match design structure when empty
                          ['HashKey Capital', 'OKX Ventures', 'Arcanum Capital', 'CMS Holdings', 'LD Capital'].map((name, idx) => (
                             <div key={idx} className="flex-1 min-w-[160px] bg-[#F8FAFC] border border-slate-100 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center gap-4 p-4">
                                <img 
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=ffffff&textColor=0f172a&bold=true`} 
                                  alt={name} 
                                  className="w-14 h-14 rounded-xl object-contain shrink-0 border border-slate-100 bg-slate-50" 
                                />
                                <span className="text-[13px] font-black text-slate-800 tracking-tight text-center w-full truncate">{name}</span>
                              </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                  {/* OUTER FOOTER */}
                  <div className="absolute bottom-6 left-10 right-10 flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs z-0">
                    <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    <span>Funding Alert</span>
                    <span className="flex items-center gap-2">
                       <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                         <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-3 h-3 object-contain" crossOrigin="anonymous" />
                       </div>
                       AIRDROPSAILOR
                    </span>
                  </div>
                </div>
              )}
              {/* --- TEMPLATE 2: TOP 5 FUNDING WEEKLY (BAR CHART STYLE) --- */}
              {activeTemplate === "Top 5 Funding Weekly" && (() => {
                
                // 1. Math Logic: Convert string amounts (e.g. "$225M") to numbers
                const parseAmount = (val) => {
                  if (!val) return 0;
                  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
                  return isNaN(num) ? 0 : num;
                };

                // 2. Sort data highest to lowest BEFORE slicing
                const sortedSelected = [...selectedItems].sort((a, b) => {
                   return parseAmount(b.sub || b.raw?.funding_amount) - parseAmount(a.sub || a.raw?.funding_amount);
                });

                // 3. Data Setup & Fallback
                const fallbackData = [
                  { id: 1, name: 'Monad', sub: '$225M', logo: null, raw: { funding_amount: '$225M' } },
                  { id: 2, name: 'Berachain', sub: '$100M', logo: null, raw: { funding_amount: '$100M' } },
                  { id: 3, name: 'Pharos', sub: '$44M', logo: null, raw: { funding_amount: '$44M' } },
                  { id: 4, name: 'io.net', sub: '$25M', logo: null, raw: { funding_amount: '$25M' } },
                  { id: 5, name: 'Avail', sub: '$18M', logo: null, raw: { funding_amount: '$18M' } },
                ];
                
                const displayData = sortedSelected.length > 0 ? sortedSelected.slice(0, 5) : fallbackData;
                
                // Find highest amount to scale the bars
                const maxAmount = Math.max(...displayData.map(item => parseAmount(item.sub || item.raw?.funding_amount || '0')));

                // 4. Brand Colors
                const colors = [
                  { bar: 'from-amber-400 to-amber-500', glow: 'shadow-amber-500/40 border-amber-400' },
                  { bar: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/40 border-blue-500' },
                  { bar: 'from-sky-400 to-sky-500', glow: 'shadow-sky-500/40 border-sky-400' },
                  { bar: 'from-slate-500 to-slate-600', glow: 'shadow-slate-500/40 border-slate-500' },
                  { bar: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/40 border-purple-500' },
                ];

                return (
                  <div className="w-[1200px] h-[675px] bg-gradient-to-br from-[#F4F7FB] to-[#EBF0F6] flex flex-col relative p-10 font-sans overflow-hidden">
                    
                    <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                      <h1 className="text-[140px] font-black tracking-widest text-blue-900 -rotate-90 origin-center whitespace-nowrap translate-x-1/3">
                        AIRDROPSAILOR
                      </h1>
                    </div>

                    <div className="flex justify-between items-start z-10 w-full mb-8">
                      <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                          TOP 5 PROJECTS BY <span className="text-blue-600">FUNDING RAISED</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
                          Data Source: airdropsailor.xyz, Private Raises
                        </p>
                      </div>
                      <div className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="flex-1 relative w-full flex flex-col justify-center gap-7 z-10 pr-32">
                      <div className="absolute inset-0 flex justify-between pointer-events-none z-0 px-8">
                         {[1, 2, 3, 4, 5, 6].map(i => (
                           <div key={i} className="w-px h-full bg-slate-300/40"></div>
                         ))}
                      </div>

                      {displayData.map((item, index) => {
                        const amountRaw = parseAmount(item.sub || item.raw?.funding_amount);
                        
                        // 🚀 THE FIX: Base Width (14%) + Variable Width (max 71%). 
                        // This guarantees every bar staggers visibly, even if the difference is $1M vs $5M.
                        const baseWidth = 14; 
                        const variableWidth = 71;
                        const barWidthPercent = maxAmount > 0 ? baseWidth + (amountRaw / maxAmount) * variableWidth : baseWidth;

                        return (
                          <div key={item.id} className="relative w-full h-[64px] flex items-center z-10">
                            <div 
                              className={`h-full bg-gradient-to-r ${colors[index]?.bar || 'from-slate-400 to-slate-500'} flex items-center pl-6 rounded-r-xl shadow-md transition-all duration-500 relative`}
                              style={{ width: `${barWidthPercent}%` }}
                            >
                              <span className="text-white font-bold text-2xl tracking-wide drop-shadow-md truncate pr-16 z-10 w-full block">
                                {item.name}
                              </span>

                              <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-[76px] h-[76px] rounded-full bg-white p-1 shadow-[0_0_25px_rgba(0,0,0,0.15)] z-20 ${colors[index]?.glow}`}>
                                <div className={`w-full h-full rounded-full border-2 ${colors[index]?.glow.split(' ')[1]} overflow-hidden bg-white flex items-center justify-center`}>
                                  <img 
                                    src={item.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.name}`} 
                                    className="w-full h-full object-cover" 
                                    alt="logo" 
                                    
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="ml-16 text-[28px] font-medium text-slate-700 whitespace-nowrap drop-shadow-sm">
                              {item.sub || item.raw?.funding_amount || '$--'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="absolute bottom-6 left-10 right-10 flex justify-between items-end z-10 border-t border-slate-300/50 pt-4">
                      <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
                        <Layout className="w-5 h-5" /> 
                        airdropsailor.xyz
                      </div>
                      <div className="flex items-center gap-2 text-slate-800 font-black text-2xl tracking-tight">
                        AirdropSailor
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md p-1.5">
                           {/* 🚀 THE FIX: Integrated your actual Supabase logo here and inverted it to pure white to match the icon style */}
                           <img 
                             src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
                             alt="Sailor Logo" 
                             className="w-full h-full object-contain " 
                             
                           />
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 3: TOP FUNDING CATEGORY (VERTICAL BAR CHART) --- */}
              {activeTemplate === "Top Funding Category" && (() => {
                
                // 1. Fallback Data
                const fallbackData = [
                  { id: 1, name: 'L1 / L2 Infra', amount: '$450M', deals: 14, seed: 'Infra' },
                  { id: 2, name: 'DeFi & RWA', amount: '$320M', deals: 11, seed: 'DeFi' },
                  { id: 3, name: 'AI Agents', amount: '$210M', deals: 8, seed: 'AI' },
                  { id: 4, name: 'DePIN', amount: '$180M', deals: 5, seed: 'DePIN' },
                  { id: 5, name: 'Web3 Gaming', amount: '$95M', deals: 7, seed: 'Gaming' },
                  { id: 6, name: 'SocialFi', amount: '$60M', deals: 4, seed: 'Social' },
                ];

                // 2. 🚀 THE FIX: Map selected sidebar items into the chart data!
                const displayData = selectedItems.length > 0 
                  ? selectedItems.map(item => ({
                      id: item.id,
                      name: item.name,
                      amount: item.sub || item.raw?.amount || '0',
                      deals: item.raw?.deals || 1,
                      seed: item.raw?.seed || item.name
                    })).slice(0, 10) // 🚀 Changed to 10
                  : fallbackData;

                // 3. Math Logic for Vertical Heights
                const parseAmount = (val) => {
                  if (!val) return 0;
                  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
                  return isNaN(num) ? 0 : num;
                };

                const maxAmount = Math.max(...displayData.map(item => parseAmount(item.amount)));

                return (
                  <div className="w-[1200px] h-[675px] bg-gradient-to-b from-[#F2F7FD] to-[#FFFFFF] flex flex-col relative p-10 font-sans overflow-hidden">
                    
                    {/* HEADER AREA */}
                    <div className="flex justify-between items-start z-10 w-full mb-10">
                      <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3 uppercase">
                          TOP SECTORS BY <span className="text-blue-600">CAPITAL INFLOW</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-2 flex flex-col gap-1">
                          <span>Data Source: airdropsailor.xyz</span>
                          <span className="text-[10px] text-slate-400">Sector allocations reflect aggregate institutional funding.</span>
                        </p>
                      </div>
                      <div className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                      </div>
                    </div>

                    {/* CHART AREA */}
                    <div className="flex-1 relative w-full flex items-end justify-center gap-4 z-10 px-12 pb-24 mt-4"> 
                      {/* 🚀 Changed gap-8 to gap-4 to fit 10 items */}
                      
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap origin-center">
                        Capital Raised (USD)
                      </div>

                      <div className="absolute inset-x-10 inset-y-0 flex flex-col justify-between pointer-events-none z-0 pb-24">
                         {[1, 2, 3, 4, 5].map(i => (
                           <div key={i} className="w-full h-px border-b border-dashed border-slate-300/60"></div>
                         ))}
                      </div>

                      {displayData.map((item) => {
                        const amountRaw = parseAmount(item.amount);
                        const heightPercent = maxAmount > 0 ? Math.max((amountRaw / maxAmount) * 100, 15) : 15;

                        return (
                          <div key={item.id} className="relative flex flex-col items-center justify-end h-full w-[75px] z-10 group">
                            {/* 🚀 Changed w-[100px] to w-[75px] */}
                            
                            <div className="text-emerald-500 font-black text-lg mb-3 drop-shadow-sm tracking-tight whitespace-nowrap">
                              {item.amount}
                            </div>

                            <div 
                              className="w-[50px] bg-gradient-to-b from-emerald-400 to-emerald-50/10 rounded-t-sm transition-all duration-700"
                              style={{ height: `${heightPercent}%` }}
                            ></div>
                            {/* 🚀 Changed w-[72px] to w-[50px] */}

                            <div className="absolute top-full pt-4 flex flex-col items-center w-full">
                              <div className="w-9 h-9 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center mb-2 overflow-hidden p-1">
                                <img 
                                  src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.seed}`} 
                                  className="w-full h-full object-cover rounded-full" 
                                  alt="icon" 
                                  
                                />
                              </div>
                              
                              <span className="text-slate-800 font-bold text-[11px] text-center leading-tight whitespace-nowrap">
                                {item.name}
                              </span>
                              
                              <span className="text-slate-400 font-bold text-[9px] uppercase mt-0.5 tracking-wider whitespace-nowrap">
                                [{item.deals} Deals]
                              </span>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                    {/* FOOTER */}
                    <div className="absolute bottom-6 left-10 right-10 flex justify-between items-end z-10 border-t border-slate-300/40 pt-4">
                      <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
                        <Layout className="w-5 h-5" /> 
                        airdropsailor.xyz/funding
                      </div>
                      <div className="flex items-center gap-2 text-slate-800 font-black text-2xl tracking-tight">
                        AirdropSailor
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md p-1.5">
                           <img 
                             src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
                             alt="Sailor Logo" 
                             className="w-full h-full object-contain " 
                             
                           />
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 4: SINGLE AIRDROP GUIDE (DASHBOARD STYLE) --- */}
              {activeTemplate === "Single Airdrop Guide" && (() => {
                
                // 1. Data Setup & Fallback
                const fallbackProject = {
                  name: 'dTelecom',
                  logo: null,
                  description: "DePIN infra for real-time voice, video & AI communication. Disrupting $3.5T telecom market @Solana.",
                  funding: '1.2M',
                  lead_investors: 'Kraken',
                  tier: 'Tier 1',
                  social_score: '854',
                  twitter_followers: '125K',
                  status: 'Incentivized Testnet',
                  tasks: [
                    { id: 1, name: 'Bridge Assets & Provide Liquidity', description: 'Interact with the official bridge and deposit funds into the primary DEX.' },
                    { id: 2, name: 'Interact with Ecosystem dApps', description: 'Generate contract interactions across lending protocols and NFT marketplaces.' }
                  ]
                };

                // Extract selected project
                const p = selectedItems[0]?.raw || fallbackProject;
                
                // Exact mappings based on your SQL schema
                const projectName = p.name || fallbackProject.name;
                const projectLogo = p.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;
                
                // Real Tasks Logic (Max 2)
                const rawTasks = p.tasks && p.tasks.length > 0 ? p.tasks : fallbackProject.tasks;
                const displayTasks = rawTasks.slice(0, 2);

                return (
                  <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
                    
                    {/* OUTER HEADER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>AirdropSailor</span>
                      <span>Project Alpha</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>

                    {/* MAIN WHITE CARD */}
                    <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-5 my-4 overflow-hidden border border-blue-500/30">
                      
                      {/* BOX 1: PROJECT HEADER & DESCRIPTION */}
                      <div className="w-full bg-white rounded-[2rem] p-6 flex items-center justify-between border border-slate-200/60 shadow-sm shrink-0">
                        <div className="flex items-center gap-6 w-[45%] border-r border-slate-100 pr-6">
                          <div className="w-20 h-20 rounded-2xl bg-slate-50 p-1 shadow-inner border border-slate-100 shrink-0">
                            <img src={projectLogo} className="w-full h-full rounded-xl object-contain" alt="Logo"  />
                          </div>
                          <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                              {projectName}
                            </h1>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                              Verified Alpha
                            </div>
                          </div>
                        </div>

                        <div className="w-[55%] pl-6">
                          <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-3">
                            {p.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>

                      {/* BOX 2: 5-METRIC ALPHA SNAPSHOT */}
                      <div className="grid grid-cols-5 gap-3 mt-4 shrink-0">
                        {/* Mapped to p.funding */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Funding Raised</span>
                          <span className="text-xl font-black text-slate-900 truncate">
                            {p.funding || 'N/A'}
                          </span>
                        </div>

                        {/* Mapped to p.lead_investors (plural) */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Backer</span>
                          <span className="text-xl font-black text-slate-900 truncate">
                            {p.lead_investors || 'N/A'}
                          </span>
                        </div>

                        {/* Mapped to p.tier instead of airdrop_score */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center relative overflow-hidden">
                          <div className="absolute right-0 top-0 bottom-0 w-12 bg-emerald-50 opacity-50"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Tier</span>
                          <span className="text-xl font-black text-emerald-600 truncate">
                            {p.tier || 'N/A'}
                          </span>
                        </div>

                        {/* Mapped to p.social_score */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.059z"/></svg>
                            Social Score
                          </span>
                          <span className="text-xl font-black text-slate-900 truncate">
                            {p.social_score != null ? p.social_score : 'N/A'}
                          </span>
                        </div>

                        {/* Mapped to p.twitter_followers (safely checking for 0) */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Followers</span>
                          <span className="text-xl font-black text-slate-900 truncate">
                            {p.twitter_followers != null ? p.twitter_followers : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* BOX 3: AIRDROP GUIDE & TASKS */}
                      <div className="mt-4 flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 flex flex-col relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50 rounded-bl-full opacity-50 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-4 relative z-10 border-b border-slate-100 pb-3 shrink-0">
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                            Airdrop Guide
                          </h2>
                          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl shadow-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Phase:</span>
                            {/* Mapped to p.status */}
                            <span className="text-sm font-black text-emerald-400 uppercase tracking-wider">
                              {p.status || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* TASKS LIST */}
                        <div className="flex flex-col gap-2.5 relative z-10 overflow-hidden">
                          {displayTasks.map((task, index) => (
                            <div key={task.id || index} className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3.5 shrink-0">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-bold text-slate-900 truncate">{task.name}</h4>
                                <p className="text-sm font-medium text-slate-500 mt-0.5 line-clamp-1">
                                  {task.description || 'Complete this objective to earn points.'}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {displayTasks.length === 1 && (
                            <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 border-dashed rounded-xl p-3.5 opacity-60 shrink-0">
                              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-black text-lg shrink-0">2</div>
                              <div>
                                <h4 className="text-base font-bold text-slate-600">Await Future Objectives</h4>
                                <p className="text-sm font-medium text-slate-400 mt-0.5 line-clamp-1">Stay active on the network. More tasks will be announced soon.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* OUTER FOOTER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>Project Alpha</span>
                      <span className="flex items-center gap-2">
                         <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 "  />
                         airdropsailor.xyz
                      </span>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 5: TOP 5 TESTNET AIRDROPS --- */}
              {activeTemplate === "Top 5 Testnet Airdrops" && (() => {
                
                // 1. Data Setup & Fallbacks (based on your Nemesisdottrade SQL schema)
                const fallbackData = [
                  { id: 1, raw: { name: 'Nemesisdottrade', logo_url: 'https://unavatar.io/twitter/Nemesisdottrade', description: 'The first permissionless margin trading protocol.', tier: 'Tier 1', funding: '$20M', social_score: 20, total_time_estimate: '10', total_cost_estimate: '0' } },
                  { id: 2, raw: { name: 'dTelecom', logo_url: null, description: 'DePIN infra for real-time voice, video & AI communication.', tier: 'Tier 2', funding: '$1.2M', social_score: 854, total_time_estimate: '15', total_cost_estimate: '0' } },
                  { id: 3, raw: { name: 'Berachain', logo_url: null, description: 'EVM-equivalent L1 built on Proof of Liquidity.', tier: 'Tier 1', funding: '$100M', social_score: 95, total_time_estimate: '30', total_cost_estimate: '0' } },
                  { id: 4, raw: { name: 'Plume Network', logo_url: null, description: 'Modular L2 for RWA onboarding and compliance.', tier: 'Tier 2', funding: '$10M', social_score: 45, total_time_estimate: '5', total_cost_estimate: '0' } },
                  { id: 5, raw: { name: 'Monad', logo_url: null, description: 'Ultra-high performance EVM L1 blockchain.', tier: 'Tier 1', funding: '$225M', social_score: 99, total_time_estimate: '20', total_cost_estimate: '0' } },
                ];

                // 2. Use selected items or fallbacks
                const displayData = selectedItems.length > 0 ? selectedItems.slice(0, 5) : fallbackData;

                return (
                  <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
                    
                    {/* OUTER HEADER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>AirdropSailor</span>
                      <span>Weekly Testnet Radar</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>

                    {/* MAIN WHITE CARD */}
                    <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30">
                      
                      {/* HEADER: Top 5 Testnets */}
                      <div className="flex justify-between items-end border-b border-slate-200/60 pb-4 mb-5 shrink-0">
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase">
                          TOP 5 <span className="text-blue-600">TESTNETS</span> TO JOIN THIS WEEK
                        </h1>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg border border-blue-200">
                          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                          <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Actionable</span>
                        </div>
                      </div>

                      {/* LIST OF 5 PROJECTS */}
                      <div className="flex-1 flex flex-col gap-3.5 relative z-10 overflow-hidden">
                        {displayData.map((item, index) => {
                          const p = item.raw || {};
                          const name = p.name || item.name || 'Unknown Project';
                          const logo = p.logo_url || item.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`;
                          
                          return (
                            <div key={item.id || index} className="flex items-center justify-between bg-white rounded-[1.25rem] p-4 border border-slate-200/60 shadow-sm transition-all hover:border-blue-300">
                              
                              {/* Column 1: Rank, Logo, Name, Tier, Desc */}
                              <div className="flex items-center gap-4 w-[45%] border-r border-slate-100 pr-4">
                                <div className="w-6 text-2xl font-black text-slate-300 text-center shrink-0">#{index + 1}</div>
                                <div className="w-12 h-12 rounded-xl bg-slate-50 p-0.5 border border-slate-100 shrink-0">
                                  <img src={logo} className="w-full h-full rounded-lg object-contain" alt="logo" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="text-lg font-black text-slate-900 truncate">{name}</h3>
                                    {p.tier && (
                                      <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-md tracking-wider shrink-0">
                                        {p.tier}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-medium text-slate-500 truncate">
                                    {p.description || 'Complete testnet tasks to earn future allocations.'}
                                  </p>
                                </div>
                              </div>

                              {/* Column 2: Funding */}
                              <div className="flex flex-col w-[15%] px-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Funding</span>
                                <span className="text-lg font-black text-slate-800">{p.funding || 'Unconfirmed'}</span>
                              </div>

                              {/* Column 3: Social Score */}
                              <div className="flex flex-col w-[15%] px-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                  <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.059z"/></svg>
                                  Social
                                </span>
                                <span className="text-lg font-black text-slate-800">{p.social_score != null ? p.social_score : 'N/A'}</span>
                              </div>

                              {/* Column 4: Cost & Time Estimate (Direct from your DB!) */}
                              <div className="flex flex-col w-[25%] items-end justify-center pl-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost / Time Req.</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase">
                                    ${p.total_cost_estimate || '0'}
                                  </span>
                                  <span className="text-slate-300 font-black">|</span>
                                  <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 uppercase">
                                    {p.total_time_estimate || '10'} Mins
                                  </span>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* OUTER FOOTER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>Weekly Radar</span>
                      <span className="flex items-center gap-2">
                         <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 "  />
                         airdropsailor.xyz
                      </span>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 6: SINGLE EARLY ALPHA (DASHBOARD STYLE) --- */}
              {activeTemplate === "Single Early Alpha" && (() => {
                
                // 1. Data Setup & Fallback
                const fallbackProject = {
                  name: 'Nemesisdottrade',
                  logo: 'https://unavatar.io/twitter/Nemesisdottrade',
                  description: 'The first permissionless margin trading protocol. Long or short any onchain token on spot.',
                  funding: '$20M',
                  lead_investors: 'LYVC, District, a16zcrypto',
                  tier: 'Tier 1',
                  social_score: '20',
                  twitter_followers: '0',
                  status: 'Testnet',
                  tasks: [
                    { id: 1, name: 'Initial Platform Interaction', description: 'Connect wallet and perform first testnet margin trade.' }
                  ]
                };

                // Extract selected project
                const p = selectedItems[0]?.raw || fallbackProject;
                
                // Exact mappings based on your SQL schema
                const projectName = p.name || fallbackProject.name;
                const projectLogo = p.logo_url || fallbackProject.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;
                
                // Real Tasks Logic (Max 2 for Early Alpha)
                const rawTasks = p.tasks && p.tasks.length > 0 ? p.tasks : fallbackProject.tasks;
                const displayTasks = rawTasks.slice(0, 2);

                return (
                  <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
                    
                    {/* OUTER HEADER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>AirdropSailor</span>
                      <span>Early Alpha</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>

                    {/* MAIN WHITE CARD */}
                    <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-5 my-4 overflow-hidden border border-blue-500/30">
                      
                      {/* BOX 1: PROJECT HEADER & DESCRIPTION */}
                      <div className="w-full bg-white rounded-[2rem] p-6 flex items-center justify-between border border-slate-200/60 shadow-sm shrink-0">
                        <div className="flex items-center gap-6 w-[45%] border-r border-slate-100 pr-6">
                          <div className="w-20 h-20 rounded-2xl bg-slate-50 p-1 shadow-inner border border-slate-100 shrink-0">
                            <img src={projectLogo} className="w-full h-full rounded-xl object-contain" alt="Logo"  />
                          </div>
                          <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                              {projectName}
                            </h1>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                              Verified Early
                            </div>
                          </div>
                        </div>

                        <div className="w-[55%] pl-6">
                          <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-3">
                            {p.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>

                      {/* BOX 2: 5-METRIC ALPHA SNAPSHOT */}
                      <div className="grid grid-cols-5 gap-3 mt-4 shrink-0">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Funding Raised</span>
                          <span className="text-xl font-black text-slate-900 truncate">{p.funding || 'N/A'}</span>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Backer</span>
                          <span className="text-xl font-black text-slate-900 truncate">{p.lead_investors || 'N/A'}</span>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center relative overflow-hidden">
                          <div className="absolute right-0 top-0 bottom-0 w-12 bg-amber-50 opacity-50"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Tier</span>
                          <span className="text-xl font-black text-amber-600 truncate">{p.tier || 'N/A'}</span>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.059z"/></svg>
                            Social Score
                          </span>
                          <span className="text-xl font-black text-slate-900 truncate">{p.social_score != null ? p.social_score : 'N/A'}</span>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Followers</span>
                          <span className="text-xl font-black text-slate-900 truncate">{p.twitter_followers != null ? p.twitter_followers : 'N/A'}</span>
                        </div>
                      </div>

                      {/* BOX 3: EARLY AIRDROP & TASKS */}
                      <div className="mt-4 flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 flex flex-col relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50 rounded-bl-full opacity-50 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-4 relative z-10 border-b border-slate-100 pb-3 shrink-0">
                          {/* 🚀 CHANGED TO EARLY AIRDROP */}
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                            Early Airdrop
                          </h2>
                          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl shadow-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Phase:</span>
                            <span className="text-sm font-black text-emerald-400 uppercase tracking-wider">
                              {p.status || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* TASKS LIST */}
                        <div className="flex flex-col gap-2.5 relative z-10 overflow-hidden">
                          {displayTasks.map((task, index) => (
                            <div key={task.id || index} className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3.5 shrink-0">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-bold text-slate-900 truncate">{task.name || task.task_name || task.title}</h4>
                                <p className="text-sm font-medium text-slate-500 mt-0.5 line-clamp-1">
                                  {task.description || task.task_description || 'Complete this objective to earn points.'}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {displayTasks.length === 1 && (
                            <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 border-dashed rounded-xl p-3.5 opacity-60 shrink-0">
                              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-black text-lg shrink-0">2</div>
                              <div>
                                <h4 className="text-base font-bold text-slate-600">Await Future Objectives</h4>
                                <p className="text-sm font-medium text-slate-400 mt-0.5 line-clamp-1">You are extremely early. More tasks will be unlocked soon.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* OUTER FOOTER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>Early Alpha</span>
                      <span className="flex items-center gap-2">
                         <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 "  />
                         airdropsailor.xyz
                      </span>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 7: TOP 5 EARLY ALPHA --- */}
              {activeTemplate === "Top 5 Early Alpha" && (() => {
                
                // 1. Data Setup & Fallbacks (using the same schema map as Testnets)
                const fallbackData = [
                  { id: 1, raw: { name: 'Nemesisdottrade', logo_url: 'https://unavatar.io/twitter/Nemesisdottrade', description: 'The first permissionless margin trading protocol.', tier: 'Tier 1', funding: '$20M', social_score: 20, total_time_estimate: '10', total_cost_estimate: '0' } },
                  { id: 2, raw: { name: 'dTelecom', logo_url: null, description: 'DePIN infra for real-time voice, video & AI communication.', tier: 'Tier 2', funding: '$1.2M', social_score: 854, total_time_estimate: '15', total_cost_estimate: '0' } },
                  { id: 3, raw: { name: 'Berachain', logo_url: null, description: 'EVM-equivalent L1 built on Proof of Liquidity.', tier: 'Tier 1', funding: '$100M', social_score: 95, total_time_estimate: '30', total_cost_estimate: '0' } },
                  { id: 4, raw: { name: 'Plume Network', logo_url: null, description: 'Modular L2 for RWA onboarding and compliance.', tier: 'Tier 2', funding: '$10M', social_score: 45, total_time_estimate: '5', total_cost_estimate: '0' } },
                  { id: 5, raw: { name: 'Monad', logo_url: null, description: 'Ultra-high performance EVM L1 blockchain.', tier: 'Tier 1', funding: '$225M', social_score: 99, total_time_estimate: '20', total_cost_estimate: '0' } },
                ];

                // 2. Use selected items or fallbacks
                const displayData = selectedItems.length > 0 ? selectedItems.slice(0, 5) : fallbackData;

                return (
                  <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
                    
                    {/* OUTER HEADER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>AirdropSailor</span>
                      <span>Early Alpha Radar</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>

                    {/* MAIN WHITE CARD */}
                    <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30">
                      
                      {/* HEADER: Top 5 Early Alphas */}
                      <div className="flex justify-between items-end border-b border-slate-200/60 pb-4 mb-5 shrink-0">
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase">
                          TOP 5 <span className="text-blue-600">EARLY ALPHAS</span> TO FARM
                        </h1>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-200 shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Extremely Early</span>
                        </div>
                      </div>

                      {/* LIST OF 5 PROJECTS */}
                      <div className="flex-1 flex flex-col gap-3.5 relative z-10 overflow-hidden">
                        {displayData.map((item, index) => {
                          const p = item.raw || {};
                          const name = p.name || item.name || 'Unknown Project';
                          const logo = p.logo_url || item.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`;
                          
                          return (
                            <div key={item.id || index} className="flex items-center justify-between bg-white rounded-[1.25rem] p-4 border border-slate-200/60 shadow-sm transition-all hover:border-blue-300">
                              
                              {/* Column 1: Rank, Logo, Name, Tier, Desc */}
                              <div className="flex items-center gap-4 w-[45%] border-r border-slate-100 pr-4">
                                <div className="w-6 text-2xl font-black text-slate-300 text-center shrink-0">#{index + 1}</div>
                                <div className="w-12 h-12 rounded-xl bg-slate-50 p-0.5 border border-slate-100 shrink-0">
                                  <img src={logo} className="w-full h-full rounded-lg object-contain" alt="logo" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="text-lg font-black text-slate-900 truncate">{name}</h3>
                                    {p.tier && (
                                      <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-md tracking-wider shrink-0">
                                        {p.tier}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-medium text-slate-500 truncate">
                                    {p.description || 'Complete early tasks to secure future allocations.'}
                                  </p>
                                </div>
                              </div>

                              {/* Column 2: Funding */}
                              <div className="flex flex-col w-[15%] px-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Funding</span>
                                <span className="text-lg font-black text-slate-800">{p.funding || 'Unconfirmed'}</span>
                              </div>

                              {/* Column 3: Social Score */}
                              <div className="flex flex-col w-[15%] px-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                  <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.059z"/></svg>
                                  Social
                                </span>
                                <span className="text-lg font-black text-slate-800">{p.social_score != null ? p.social_score : 'N/A'}</span>
                              </div>

                              {/* Column 4: Cost & Time Estimate */}
                              <div className="flex flex-col w-[25%] items-end justify-center pl-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost / Time Req.</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase">
                                    ${p.total_cost_estimate || '0'}
                                  </span>
                                  <span className="text-slate-300 font-black">|</span>
                                  <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 uppercase">
                                    {p.total_time_estimate || '10'} Mins
                                  </span>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* OUTER FOOTER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>Early Alpha Radar</span>
                      <span className="flex items-center gap-2">
                         <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 "  />
                         airdropsailor.xyz
                      </span>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 11: DISCORD ROLES --- */}
              {activeTemplate === "Discord Roles" && (() => {
                // 1. Data Setup & Fallback
                const fallbackProject = {
                  name: 'Xeffy',
                  logo_url: null,
                };

                const p = selectedItems[0]?.raw || fallbackProject;
                const projectName = p.name || 'Unknown Project';
                const projectLogo = p.logo_url || p.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;
                
                // Fallback roles if the DB is empty
                const rawRoles = p.discord_roles && p.discord_roles.length > 0 ? p.discord_roles : [
                  { role_name: 'X Role', requirements: 'Users recognized for core contributions to Xeffy', perks: 'Recognition by core team members', difficulty_level: 'Hard', created_at: '2026-06-20T09:44:00Z' },
                  { role_name: 'Xef Role', requirements: 'Users recognized for their first-level contributions', perks: 'Contribution can make more allocation', difficulty_level: 'Easy', created_at: '2026-06-20T09:44:00Z' },
                  { role_name: 'Xeffy Role', requirements: 'Entry-level users who have just joined', perks: 'Not Much', difficulty_level: 'Easy', created_at: '2026-06-20T09:44:00Z' },
                  { role_name: 'Active Member', requirements: 'Reach level 10 in the general chat', perks: 'Access to alpha channels', difficulty_level: 'Medium', created_at: '2026-06-20T09:44:00Z' }
                ];

                const displayRoles = rawRoles.slice(0, 4); 

                return (
                  <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2 z-10">
                      <span>AirdropSailor</span>
                      <span>Discord Roles</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>

                    {/* Main White Card */}
                    <div className="flex-1 w-full max-w-[1100px] mx-auto bg-white rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30 overflow-hidden z-10">
                      
                      {/* Top Blue Banner */}
                      <div className="w-full h-[140px] bg-gradient-to-r from-[#4438F5] to-[#2B1BDB] rounded-[2rem] p-6 flex items-center justify-between relative overflow-hidden shrink-0">
                         {/* Huge watermark icon */}
                         <div className="absolute right-1/4 top-1/2 -translate-y-1/2 opacity-[0.05]">
                           <svg width="300" height="300" viewBox="0 0 127.14 96.36" fill="white"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.74,67.74,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-80.21ZM42.61,65.22c-5.32,0-9.64-4.86-9.64-10.82s4.22-10.82,9.64-10.82c5.45,0,9.75,4.92,9.64,10.82C52.25,60.36,48.06,65.22,42.61,65.22Zm41.9,0c-5.32,0-9.64-4.86-9.64-10.82s4.22-10.82,9.64-10.82c5.45,0,9.75,4.92,9.64,10.82C84.51,60.36,80.32,65.22,84.51,65.22Z"/></svg>
                         </div>

                         <div className="flex items-center gap-5 z-10">
                           <div className="w-[84px] h-[84px] bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-sm shrink-0">
                             <img src={projectLogo} alt={projectName} className="w-full h-full object-contain rounded-xl" />
                           </div>
                           <div className="text-white">
                             <h2 className="text-[32px] font-black tracking-tight leading-none mb-2">{projectName} Roles</h2>
                             <p className="text-[13px] font-medium text-white/80 max-w-sm leading-snug">Explore and earn roles in the {projectName} Discord server by contributing and engaging with the community.</p>
                           </div>
                         </div>

                         <div className="z-10 bg-white/10 border border-white/20 rounded-2xl p-4 w-[160px] flex flex-col items-center justify-center">
                           <div className="flex items-center gap-2 text-white mb-1">
                             <Users className="w-5 h-5" />
                             <span className="text-3xl font-black">{rawRoles.length}</span>
                           </div>
                           <span className="text-xs font-bold text-white/80">Available Roles</span>
                         </div>
                      </div>

                      {/* Table Headers */}
                      <div className="grid grid-cols-12 gap-4 mt-6 pb-3 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 shrink-0">
                        <div className="col-span-3">Role Name</div>
                        <div className="col-span-3">Requirements</div>
                        <div className="col-span-3">Perks</div>
                        <div className="col-span-1 text-center">Difficulty</div>
                        <div className="col-span-2 text-right pr-6">Added On</div>
                      </div>

                      {/* Table Rows */}
                      <div className="flex-1 flex flex-col relative z-10 overflow-hidden px-4">
                        {displayRoles.map((role, idx) => {
                          
                          // Styling badges dynamically based on index to match design
                          const badgeStyles = [
                            { name: 'Premium', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: <Star className="w-3 h-3"/> },
                            { name: 'Standard', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: <Star className="w-3 h-3"/> },
                            { name: 'Basic', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <Star className="w-3 h-3"/> },
                            { name: 'Active', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Star className="w-3 h-3"/> }
                          ];
                          const badge = badgeStyles[idx % badgeStyles.length];

                          // Diff color
                          const diffLevel = role.difficulty_level || 'Easy';
                          const isHard = diffLevel.toLowerCase() === 'hard';
                          const diffColor = isHard ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100';

                          // Date parsing
                          const d = new Date(role.created_at || new Date());
                          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

                          return (
                            <div key={idx} className="grid grid-cols-12 gap-4 py-4 border-b border-slate-50 items-center shrink-0">
                              {/* Role Name */}
                              <div className="col-span-3 flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-[#F4F4FF] flex items-center justify-center shrink-0">
                                  {/* 🚀 Replaced Letter with Discord SVG Logo */}
                                  <svg className="w-6 h-6 text-blue-600 fill-current" viewBox="0 0 127.14 96.36">
                                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.74,67.74,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-80.21ZM42.61,65.22c-5.32,0-9.64-4.86-9.64-10.82s4.22-10.82,9.64-10.82c5.45,0,9.75,4.92,9.64,10.82C52.25,60.36,48.06,65.22,42.61,65.22Zm41.9,0c-5.32,0-9.64-4.86-9.64-10.82s4.22-10.82,9.64-10.82c5.45,0,9.75,4.92,9.64,10.82C84.51,60.36,80.32,65.22,84.51,65.22Z"/>
                                  </svg>
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-base font-black text-slate-900 truncate mb-1.5">{role.role_name}</h4>
                                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase border ${badge.color}`}>
                                    {badge.icon} {badge.name}
                                  </div>
                                </div>
                              </div>

                              {/* Requirements */}
                              <div className="col-span-3 flex items-start gap-3 pl-2">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 text-purple-500">
                                  <ClipboardList className="w-4 h-4" />
                                </div>
                                <p className="text-[13px] font-medium text-slate-600 leading-snug line-clamp-3">{role.requirements}</p>
                              </div>

                              {/* Perks */}
                              <div className="col-span-3 flex items-start gap-3 pl-2">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-500">
                                  {idx % 2 === 0 ? <Star className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                                </div>
                                <p className="text-[13px] font-medium text-slate-600 leading-snug line-clamp-3">{role.perks}</p>
                              </div>

                              {/* Difficulty */}
                              <div className="col-span-1 flex justify-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${diffColor}`}>
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18h4v4H4zm6-6h4v10h-4zm6-6h4v16h-4z"/></svg>
                                  {diffLevel}
                                </span>
                              </div>

                              {/* Added On & Action */}
                              <div className="col-span-2 flex items-center justify-between pl-4 pr-1">
                                <div>
                                  <div className="text-[12px] font-bold text-slate-900 mb-0.5">{dateStr}</div>
                                  <div className="text-[10px] font-bold text-slate-400">{timeStr}</div>
                                </div>
                                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2 z-10">
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                      <span>Discord Roles</span>
                      <span className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                           <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-3 h-3 object-contain" crossOrigin="anonymous" />
                         </div>
                         AIRDROPSAILOR
                      </span>
                    </div>

                  </div>
                );
              })()}

              {/* --- TEMPLATE 12: TOKENOMICS --- */}
              {activeTemplate === "Tokenomics" && (() => {
                // 1. Data Setup & Fallback
                const fallbackProject = { name: 'Xeffy', logo_url: null };
                const p = selectedItems[0]?.raw || fallbackProject;
                
                // 🚀 Parsing the real DB JSON
                let tData = {};
                try {
                  tData = typeof p.tokenomics_details === 'string' ? JSON.parse(p.tokenomics_details) : (p.tokenomics_details || {});
                } catch(e) {}

                const tokenName = p.name || 'Xeffy';
                const ticker = tData.ticker || 'XEF';
                const totalSupply = parseInt(tData.total_supply) || 6000000000;
                const blockchain = tData.network || 'Ethereum';

                // 🚀 Dynamic Chart Data Mapping from DB!
                const rawAllocations = [
                  { label: 'Community & Airdrop', pct: parseFloat(tData.community_allocation_percentage) || 23, color: '#3B28E3' },
                  { label: 'Investors & Backers', pct: parseFloat(tData.investor_allocation_percentage) || 50, color: '#3B82F6' },
                  { label: 'Ecosystem & Treasury', pct: parseFloat(tData.ecosystem_allocation_percentage) || 20, color: '#14B8A6' },
                  { label: 'Core Team', pct: parseFloat(tData.team_allocation_percentage) || 7, color: '#F59E0B' }
                ].filter(a => a.pct > 0);
                
                const chartData = rawAllocations.map(a => ({
                   ...a,
                   amount: (totalSupply * a.pct) / 100
                }));

                // SVG calculations
                const radius = 15.91549430918954;
                const circumference = 100;
                let currentOffset = 100;

                // Vesting Table Data aligned with DB Allocations
                const vestingData = [
                  { icon: <Users className="w-4 h-4"/>, bg: 'bg-blue-100 text-blue-600', label: 'Community & Airdrop', cliff: 'No Cliff', duration: 'TBA', type: 'Full Unlock' },
                  { icon: <Landmark className="w-4 h-4"/>, bg: 'bg-teal-100 text-teal-600', label: 'Investors & Backers', cliff: '6 Months', duration: '24 Months', type: 'Linear' },
                  { icon: <Gift className="w-4 h-4"/>, bg: 'bg-purple-100 text-purple-600', label: 'Ecosystem & Treasury', cliff: 'No Cliff', duration: '48 Months', type: 'Linear' },
                  { icon: <Star className="w-4 h-4"/>, bg: 'bg-orange-100 text-orange-600', label: 'Core Team', cliff: '12 Months', duration: '36 Months', type: 'Linear' }
                ];

                return (
                  <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2 z-10">
                      <span>AirdropSailor</span>
                      <span>Tokenomics</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>

                    {/* Main White Card */}
                    <div className="flex-1 w-full max-w-[1150px] mx-auto bg-white rounded-[2rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30 overflow-hidden z-10">
                      
                      {/* TOP SECTION: BANNER & METRICS */}
                      <div className="flex gap-4 mb-6 shrink-0 h-[120px]">
                        {/* Title Banner */}
                        <div className="w-[40%] bg-[#3B28E3] rounded-[1.5rem] p-5 flex items-center gap-4 text-white shadow-sm overflow-hidden relative">
                          <div className="absolute -right-4 -bottom-10 opacity-10">
                            <Coins className="w-48 h-48" />
                          </div>
                          <div className="w-16 h-16 rounded-2xl border-2 border-white/20 bg-white/10 flex items-center justify-center shrink-0 z-10 backdrop-blur-sm">
                            <img src={p.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenName}`} className="w-full h-full object-cover rounded-xl" alt="Logo" />
                          </div>
                          <div className="z-10">
                            <h2 className="text-[28px] font-black tracking-tight leading-none mb-1.5">Tokenomics</h2>
                            <p className="text-[11px] font-medium text-white/80 leading-snug">Detailed breakdown of the token supply and its distribution.</p>
                          </div>
                        </div>

                        {/* Metric Cards */}
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div className="bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Token Name</span>
                              <span className="text-[16px] font-black text-slate-900 leading-none block truncate uppercase">{tokenName}</span>
                            </div>
                          </div>
                          <div className="bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <Layout className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Ticker</span>
                              <span className="text-[16px] font-black text-slate-900 leading-none block truncate uppercase">{ticker}</span>
                            </div>
                          </div>
                          <div className="bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                              <Database className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Total Supply</span>
                              <span className="text-[16px] font-black text-slate-900 leading-none block truncate" title={totalSupply.toLocaleString()}>{totalSupply >= 1e9 ? (totalSupply/1e9).toFixed(2)+'B' : totalSupply.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                              <PieChart className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Blockchain</span>
                              <span className="text-[16px] font-black text-slate-900 leading-none block truncate">{blockchain}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* MIDDLE SECTION: CHART & TABLE */}
                      <div className="flex gap-6 flex-1 min-h-0">
                        
                        {/* Left: Token Distribution */}
                        <div className="w-[45%] bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-6 shadow-sm flex flex-col">
                          <h3 className="text-base font-black text-slate-900 mb-6 tracking-tight">Token Distribution</h3>
                          <div className="flex items-center justify-between flex-1">
                            
                            {/* Donut Chart */}
                            <div className="relative w-[180px] h-[180px] shrink-0">
                              <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 drop-shadow-md">
                                <circle cx="21" cy="21" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="10"></circle>
                                {chartData.map((d, i) => {
                                  const strokeDasharray = `${d.pct} ${circumference - d.pct}`;
                                  const strokeDashoffset = currentOffset;
                                  currentOffset -= d.pct;
                                  return (
                                    <circle key={i} cx="21" cy="21" r={radius} fill="transparent" stroke={d.color} strokeWidth="12" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out"></circle>
                                  );
                                })}
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-400 mb-0.5">Total Supply</span>
                                <span className="text-sm font-black text-slate-900">{totalSupply >= 1e9 ? (totalSupply/1e9).toFixed(2)+'B' : totalSupply.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{ticker}</span>
                              </div>
                            </div>

                            {/* Legend */}
                            <div className="flex-1 pl-8 space-y-3">
                              {chartData.map((d, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] font-bold text-slate-700 truncate leading-tight">{d.label}</span>
                                      <span className="text-[9px] font-medium text-slate-400 leading-tight">{d.amount.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-black text-slate-900">{d.pct}%</span>
                                </div>
                              ))}
                            </div>

                          </div>
                        </div>

                        {/* Right: Vesting Schedule */}
                        <div className="w-[55%] bg-[#F8FAFC] border border-slate-100 rounded-[1.5rem] p-6 shadow-sm flex flex-col">
                          <h3 className="text-base font-black text-slate-900 mb-4 tracking-tight">Vesting Schedule</h3>
                          
                          <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 shrink-0">
                            <div className="col-span-5">Allocation</div>
                            <div className="col-span-3 text-center">Cliff</div>
                            <div className="col-span-4 text-right">Vesting Duration</div>
                          </div>

                          <div className="flex-1 flex flex-col justify-evenly">
                            {vestingData.map((row, i) => (
                              <div key={i} className="grid grid-cols-12 gap-4 items-center px-2 py-1.5 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100/50 last:border-0">
                                <div className="col-span-5 flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${row.bg}`}>
                                    {row.icon}
                                  </div>
                                  <span className="text-[13px] font-bold text-slate-800">{row.label}</span>
                                </div>
                                <div className="col-span-3 text-center">
                                  <span className="text-[12px] font-medium text-slate-600">{row.cliff}</span>
                                </div>
                                <div className="col-span-4 text-right flex flex-col items-end">
                                  <span className="text-[13px] font-bold text-slate-900">{row.duration}</span>
                                  <span className="text-[9px] font-medium text-slate-400">{row.type}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* 🚀 BOTTOM NOTE MAPS TO VESTING NOTES IN DB */}
                      <div className="mt-4 bg-[#F0F4FF] border border-blue-100 rounded-xl p-4 flex items-center gap-3 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <Info className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-[12px] font-black text-slate-900 mb-0.5">Vesting & Allocation Notes</h4>
                          <p className="text-[11px] font-medium text-slate-500 line-clamp-2 pr-4">
                            {tData.vesting_notes || 'The token allocation and vesting schedule are subject to change. Please refer to the official documentation for the most up-to-date information.'}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2 z-10">
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                      <span>Tokenomics</span>
                      <span className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                           <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-3 h-3 object-contain" crossOrigin="anonymous" />
                         </div>
                         AIRDROPSAILOR
                      </span>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 8: DAILY TASKS --- */}
              {activeTemplate === "Daily Tasks" && (() => {
                
                // 1. Data Setup & Fallbacks
                const fallbackData = [
                  { id: 1, raw: { name: 'Nemesis V1 Testnet', description: 'Complete the Nemesis V1 Testnet. Swap tokens, open margin positions...', recurring: 'Weekly', status: 'Active', end_date: '2027-01-03', projects: { name: 'Nemesisdottrade', tier: 'Tier 1', logo_url: 'https://unavatar.io/twitter/Nemesisdottrade' } } },
                  { id: 2, raw: { name: 'Bridge to Ink L2', description: 'Use the official bridge to transfer ETH from Sepolia to Ink Testnet.', recurring: 'One-Time', status: 'Active', end_date: '2026-05-01', projects: { name: 'Ink', tier: 'Tier 2', logo_url: null } } },
                  { id: 3, raw: { name: 'Galxe Social Quests', description: 'Follow official Twitter, join Discord, and claim the early supporter OAT.', recurring: 'Daily', status: 'Active', end_date: '2026-04-30', projects: { name: 'Berachain', tier: 'Tier 1', logo_url: null } } },
                  { id: 4, raw: { name: 'Supply Liquidity on Tydro', description: 'Deposit USDC or USDT into the main lending pool to accrue points.', recurring: 'Weekly', status: 'Active', end_date: null, projects: { name: 'Tydro', tier: 'Tier 3', logo_url: null } } },
                  { id: 5, raw: { name: 'Claim Daily Faucet', description: 'Request testnet tokens from the official discord faucet channel.', recurring: 'Daily', status: 'Ending Soon', end_date: '2026-04-20', projects: { name: 'Plume Network', tier: 'Tier 2', logo_url: null } } },
                  { id: 6, raw: { name: 'Mint Genesis NFT', description: 'Mint the early adopter NFT on the testnet before snapshot.', recurring: 'One-Time', status: 'Ending Soon', end_date: '2026-04-18', projects: { name: 'Monad', tier: 'Tier 1', logo_url: null } } },
                  { id: 7, raw: { name: 'Delegate Tokens', description: 'Delegate your testnet tokens to an active validator.', recurring: 'Monthly', status: 'Active', end_date: null, projects: { name: 'dTelecom', tier: 'Tier 2', logo_url: null } } },
                ];

                // 🚀 Changed slice to 7 so it accepts the new higher limit
                const displayData = selectedItems.length > 0 ? selectedItems.slice(0, 7) : fallbackData;

                return (
                  <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
                    
                    {/* OUTER HEADER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>AirdropSailor</span>
                      <span>Task Radar</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>

                    {/* MAIN WHITE CARD */}
                    <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30">
                      
                      {/* HEADER */}
                      <div className="flex justify-between items-end border-b border-slate-200/60 pb-3 mb-4 shrink-0">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                          DAILY AIRDROP <span className="text-blue-600">TASKS</span> RELEASED
                        </h1>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg border border-blue-200 shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                          <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Action Required</span>
                        </div>
                      </div>

                      {/* LIST OF TASKS (Max 7) */}
                      {/* 🚀 Reduced gap from gap-3.5 to gap-2 to stack more items */}
                      <div className="flex-1 flex flex-col gap-2 relative z-10 overflow-hidden">
                        {displayData.map((item, index) => {
                          const t = item.raw || {};
                          const proj = t.projects || {};
                          
                          const projectName = proj.name || item.sub || 'Unknown Project';
                          const projectLogo = proj.logo_url || item.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;
                          const taskName = t.name || item.name || 'Complete tasks';
                          
                          const formattedDate = t.end_date 
                            ? new Date(t.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'TBA';

                          return (
                            // 🚀 Reduced padding from p-4 to py-2.5 px-4
                            <div key={item.id || index} className="flex items-center justify-between bg-white rounded-2xl py-2 px-4 border border-slate-200/60 shadow-sm transition-all hover:border-blue-300">
                              
                              <div className="flex items-center gap-3 w-[30%] border-r border-slate-100 pr-3">
                                <div className="w-5 text-lg font-black text-slate-300 text-center shrink-0">#{index + 1}</div>
                                {/* 🚀 Reduced logo size from w-12 to w-10 */}
                                <div className="w-10 h-10 rounded-xl bg-slate-50 p-0.5 border border-slate-100 shrink-0">
                                  <img src={projectLogo} className="w-full h-full rounded-lg object-contain" alt="logo" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-sm font-black text-slate-900 truncate">{projectName}</h3>
                                  {proj.tier && (
                                    <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase rounded-md tracking-wider shrink-0 inline-block mt-0.5">
                                      {proj.tier}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col w-[40%] px-3 border-r border-slate-100">
                                <span className="text-sm font-bold text-slate-800 truncate">{taskName}</span>
                                <span className="text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                                  {t.description || 'Complete this on-chain objective.'}
                                </span>
                              </div>

                              <div className="flex flex-col w-[15%] px-3 border-r border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Frequency</span>
                                <span className="text-xs font-black text-slate-800">{t.recurring || 'Once'}</span>
                              </div>

                              <div className="flex flex-col w-[15%] items-end justify-center pl-3">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status / Deadline</span>
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                    t.status === 'Active' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                                    t.status === 'Ending Soon' ? 'text-amber-600 bg-amber-50 border-amber-100' : 
                                    'text-blue-600 bg-blue-50 border-blue-100'
                                  }`}>
                                    {t.status || 'Active'}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500">{formattedDate}</span>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* OUTER FOOTER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>Task Radar</span>
                      <span className="flex items-center gap-2">
                         <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 "  />
                         airdropsailor.xyz
                      </span>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 9: MAJOR TASKS THIS WEEK --- */}
              {activeTemplate === "Major Tasks This Week" && (() => {
                
                // 1. Data Setup & Fallbacks (Curated for Major Weekly Events)
                const fallbackData = [
                  { id: 1, raw: { name: 'Mainnet Contract Deployment', description: 'Deploy your first smart contract on the newly launched mainnet to secure early multiplier.', recurring: 'One-Time', status: 'High Priority', end_date: '2026-04-22', projects: { name: 'Monad', tier: 'Tier 1', logo_url: null } } },
                  { id: 2, raw: { name: 'Claim Phase 2 Roles', description: 'Verify your wallet and Discord to claim the "Phase 2 Early" role.', recurring: 'One-Time', status: 'Ending Soon', end_date: '2026-04-18', projects: { name: 'dTelecom', tier: 'Tier 2', logo_url: null } } },
                  { id: 3, raw: { name: 'Provide Mainnet Liquidity', description: 'Bridge to the new L2 and deposit a minimum of $50 into the official DEX.', recurring: 'Weekly', status: 'Active', end_date: null, projects: { name: 'Ink', tier: 'Tier 2', logo_url: null } } },
                  { id: 4, raw: { name: 'Galxe Mega Campaign', description: 'Complete all 5 weekly social quests to unlock the ultimate NFT badge.', recurring: 'Weekly', status: 'Ending Soon', end_date: '2026-04-19', projects: { name: 'Berachain', tier: 'Tier 1', logo_url: null } } },
                  { id: 5, raw: { name: 'Node Operator Registration', description: 'Register your IP and stake testnet tokens to run a light node.', recurring: 'One-Time', status: 'Active', end_date: '2026-05-01', projects: { name: 'Plume Network', tier: 'Tier 2', logo_url: null } } },
                ];

                const displayData = selectedItems.length > 0 ? selectedItems.slice(0, 7) : fallbackData;

                return (
                  <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
                    
                    {/* OUTER HEADER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>AirdropSailor</span>
                      <span>Weekly Major Tasks</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>

                    {/* MAIN WHITE CARD */}
                    <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30">
                      
                      {/* HEADER */}
                      <div className="flex justify-between items-end border-b border-slate-200/60 pb-3 mb-4 shrink-0">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                          MAJOR AIRDROP <span className="text-blue-600">TASKS</span> THIS WEEK
                        </h1>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-lg border border-amber-200 shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                          <span className="text-xs font-black text-amber-700 uppercase tracking-widest">High Priority</span>
                        </div>
                      </div>

                      {/* LIST OF TASKS (Max 7) */}
                      <div className="flex-1 flex flex-col gap-2 relative z-10 overflow-hidden">
                        {displayData.map((item, index) => {
                          const t = item.raw || {};
                          const proj = t.projects || {};
                          
                          const projectName = proj.name || item.sub || 'Unknown Project';
                          const projectLogo = proj.logo_url || item.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;
                          const taskName = t.name || item.name || 'Complete major tasks';
                          
                          const formattedDate = t.end_date 
                            ? new Date(t.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'TBA';

                          return (
                            <div key={item.id || index} className="flex items-center justify-between bg-white rounded-2xl py-2 px-4 border border-slate-200/60 shadow-sm transition-all hover:border-blue-300">
                              
                              <div className="flex items-center gap-3 w-[30%] border-r border-slate-100 pr-3">
                                <div className="w-5 text-lg font-black text-slate-300 text-center shrink-0">#{index + 1}</div>
                                <div className="w-10 h-10 rounded-xl bg-slate-50 p-0.5 border border-slate-100 shrink-0">
                                  <img src={projectLogo} className="w-full h-full rounded-lg object-contain" alt="logo" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-sm font-black text-slate-900 truncate">{projectName}</h3>
                                  {proj.tier && (
                                    <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase rounded-md tracking-wider shrink-0 inline-block mt-0.5">
                                      {proj.tier}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col w-[40%] px-3 border-r border-slate-100">
                                <span className="text-sm font-bold text-slate-800 truncate">{taskName}</span>
                                <span className="text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                                  {t.description || 'Complete this on-chain objective.'}
                                </span>
                              </div>

                              <div className="flex flex-col w-[15%] px-3 border-r border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Frequency</span>
                                <span className="text-xs font-black text-slate-800">{t.recurring || 'Once'}</span>
                              </div>

                              <div className="flex flex-col w-[15%] items-end justify-center pl-3">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status / Deadline</span>
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                    t.status === 'Active' || t.status === 'High Priority' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                                    t.status === 'Ending Soon' ? 'text-amber-600 bg-amber-50 border-amber-100' : 
                                    'text-blue-600 bg-blue-50 border-blue-100'
                                  }`}>
                                    {t.status || 'Active'}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500">{formattedDate}</span>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* OUTER FOOTER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>Weekly Major Tasks</span>
                      <span className="flex items-center gap-2">
                         <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 "  />
                         airdropsailor.xyz
                      </span>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 10: TOP 5 ACTIVE USERS (LEADERBOARD) --- */}
              {activeTemplate === "Top 5 Active Users" && (() => {
                
                // 1. Data Setup & Fallbacks (Mock data reflecting your schema math)
                const fallbackData = [
                  { id: 1, raw: { displayName: 'hub***@gmail.com', subscription_tier: 'Pro', userPoints: 450, streak: 12, tasksCompleted: 34, compositeScore: 888 } },
                  { id: 2, raw: { displayName: '0x71C...9B23', subscription_tier: 'Free', userPoints: 320, streak: 8, tasksCompleted: 21, compositeScore: 505 } },
                  { id: 3, raw: { displayName: 'ale***@proton.me', subscription_tier: 'Free', userPoints: 210, streak: 5, tasksCompleted: 15, compositeScore: 335 } },
                  { id: 4, raw: { displayName: '0x44F...1A90', subscription_tier: 'Pro', userPoints: 150, streak: 2, tasksCompleted: 8, compositeScore: 252 } },
                  { id: 5, raw: { displayName: 'sar***@gmail.com', subscription_tier: 'Free', userPoints: 180, streak: 1, tasksCompleted: 4, compositeScore: 210 } },
                ];

                const displayData = selectedItems.length > 0 ? selectedItems.slice(0, 5) : fallbackData;

                return (
                  <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
                    
                    {/* OUTER HEADER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>AirdropSailor</span>
                      <span>Community Leaderboard</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>

                    {/* MAIN WHITE CARD */}
                    <div className="flex-1 w-full max-w-[1100px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30 relative overflow-hidden">
                      
                      {/* 🚀 THE WATERMARK LOGO */}
                      <img 
                         src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
                         alt="Watermark" 
                         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.03] pointer-events-none grayscale" 
                          
                      />

                      {/* HEADER */}
                      <div className="flex justify-between items-end border-b border-slate-200/60 pb-4 mb-5 shrink-0 relative z-10">
                        <div>
                          <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
                            TOP 5 <span className="text-blue-600">ACTIVE SAILORS</span>
                          </h1>
                          <p className="text-slate-500 text-xs font-medium mt-1">Ranked by Composite Activity Score (Points + Streaks + Execution)</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-200 shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Live Standings</span>
                        </div>
                      </div>

                      {/* LEADERBOARD ROWS (Max 5) */}
                      <div className="flex-1 flex flex-col gap-3.5 relative z-10 overflow-hidden">
                        {displayData.map((item, index) => {
                          const u = item.raw || {};
                          const name = u.displayName || item.name || 'Anonymous Sailor';
                          const avatar = item.logo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.auth_id || name}`;
                          
                          // Rank Colors for light theme (Highlight #1 with Gold!)
                          const isFirst = index === 0;
                          const rankColor = isFirst ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-slate-300';
                          const rankBg = isFirst ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-white' : 'border-slate-200/60 bg-white hover:border-blue-300';

                          return (
                            <div key={item.id || index} className={`flex items-center justify-between rounded-[1.25rem] p-4 border shadow-sm transition-all ${rankBg}`}>
                              
                              {/* Column 1: Rank & Identity */}
                              <div className="flex items-center gap-4 w-[40%] border-r border-slate-100 pr-4">
                                <div className={`w-6 text-2xl font-black text-center shrink-0 ${rankColor}`}>#{index + 1}</div>
                                <div className="w-12 h-12 rounded-full bg-slate-50 p-0.5 border border-slate-100 shrink-0 overflow-hidden">
                                  <img src={avatar} className="w-full h-full object-cover rounded-full" alt="avatar" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="text-lg font-black text-slate-900 truncate">{name}</h3>
                                  </div>
                                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md tracking-wider inline-block ${u.subscription_tier !== 'Free' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                    {u.subscription_tier || 'Free'} Tier
                                  </span>
                                </div>
                              </div>

                              {/* Column 2: Total Points */}
                              <div className="flex flex-col w-[20%] px-4 border-r border-slate-100 items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Points</span>
                                <span className="text-xl font-black text-slate-800">{u.userPoints || 0}</span>
                              </div>

                              {/* Column 3: Current Streak */}
                              <div className="flex flex-col w-[20%] px-4 border-r border-slate-100 items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Current Streak</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm">🔥</span>
                                  <span className="text-xl font-black text-orange-500">{u.streak || 0}</span>
                                </div>
                              </div>

                              {/* Column 4: Tasks Done */}
                              <div className="flex flex-col w-[20%] items-center justify-center pl-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tasks Done</span>
                                <span className="text-xl font-black text-emerald-600">{u.tasksCompleted || 0}</span>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* OUTER FOOTER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>Sailor Community</span>
                      <span className="flex items-center gap-2">
                         <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 "  />
                         airdropsailor.xyz
                      </span>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 12: ONCHAIN NEWS / QUOTES --- */}
              {activeCategory === "News" && (() => {
                
                // Fallbacks
                const defaultImage = 'https://images.unsplash.com/photo-1639762681485-074b7f4ecfc0?auto=format&fit=crop&w=1200&q=80';
                const defaultHeadline = activeTemplate === 'Motivational Quote' 
                  ? '"The biggest risk is not taking any risk. In a world that is changing really quickly, the only strategy that is guaranteed to fail is not taking risks."'
                  : 'BREAKING: Major Protocol Announces Massive Airdrop Snapshot Details For Early Adopters';

                return (
                  <div className="w-[1200px] h-[675px] flex flex-col overflow-hidden bg-[#1A45D1] font-sans shadow-2xl relative border-4 border-[#1A45D1]">
                    
                    {/* TOP 80%: IMAGE AREA */}
                    <div className="h-[80%] w-full relative bg-slate-900 overflow-hidden">
                      <img 
                         src={newsImageUrl || defaultImage} 
                         alt="News Background" 
                         className="w-full h-full object-cover"
                         
                      />
                      
                      {/* Dark Gradient Overlay for better text contrast near the edges */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 pointer-events-none"></div>

                      {/* Floating AirdropSailor Logo Overlay */}
                      <div className="absolute top-8 left-8 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3 shadow-2xl">
                         <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center p-1.5 shadow-inner">
                           <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" className="w-full h-full object-contain" alt="Logo" />
                         </div>
                         <span className="text-white font-black tracking-widest uppercase text-lg drop-shadow-md">AirdropSailor News</span>
                      </div>

                      {/* Breaking Badge (Only shows on 'Onchain News' template) */}
                      {activeTemplate === 'Onchain News' && (
                        <div className="absolute top-10 right-8 bg-rose-600 text-white px-4 py-1.5 rounded-lg text-sm font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          Live Intel
                        </div>
                      )}
                    </div>

                    {/* BOTTOM 20%: BLUE FOOTER & HEADLINE */}
                    <div className="h-[20%] w-full bg-[#1A45D1] px-10 flex flex-col justify-center relative z-10 border-t-2 border-blue-400/30">
                      
                      {/* Background Texture for Footer */}
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

                      <div className="flex items-center justify-between w-full z-10">
                         {/* Headline Text */}
                         <h1 className="text-[34px] font-black text-white tracking-tight leading-[1.2] line-clamp-2 w-[85%] drop-shadow-sm">
                           {newsHeadline || defaultHeadline}
                         </h1>

                         {/* Date & Branding Block */}
                         <div className="w-[15%] flex flex-col items-end border-l border-blue-400/30 pl-6 shrink-0">
                            <span className="text-blue-300 font-bold tracking-widest uppercase text-[10px] mb-0.5">Dispatched</span>
                            <span className="text-white font-black text-lg tracking-wider">
                              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                            </span>
                            <span className="text-blue-400 font-black text-[9px] uppercase tracking-widest mt-1">airdropsailor.xyz</span>
                         </div>
                      </div>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 13: SINGLE TASK UPDATE --- */}
              {activeTemplate === "Single Task Update" && (() => {
                
                // 1. Data Setup & Fallback (Based on your SQL schema)
                const fallbackTask = {
                  name: 'Early Rollers Quest',
                  description: 'The reward structure:\n• Up to $25,000 - Quest Leaderboard\n• $5,000 - Referral Leaderboard',
                  time_minutes: 5,
                  cost: '0',
                  recurring: 'Daily',
                  end_date: '2026-08-23',
                  status: 'Active',
                  projects: {
                    name: 'MagVerse',
                    logo_url: null
                  }
                };

                const t = selectedItems[0]?.raw || fallbackTask;
                const proj = t.projects || fallbackTask.projects;
                
                const projectName = proj.name || 'Unknown Project';
                const projectLogo = proj.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;
                const taskName = t.name || 'Complete Task';
                const formattedDate = t.end_date ? new Date(t.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA';

                return (
                  <div className="w-[1200px] h-[675px] bg-[#1A45D1] flex flex-col justify-between p-8 font-sans overflow-hidden">
                    
                    {/* OUTER HEADER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>AirdropSailor</span>
                      <span>Task Update</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>

                    {/* MAIN WHITE CARD */}
                    <div className="flex-1 w-full max-w-[1000px] mx-auto bg-[#F4F7FB] rounded-[2.5rem] shadow-2xl flex flex-col p-6 my-4 border border-blue-500/30 overflow-hidden">
                      
                      {/* TOP BOX: Logo & Project Name (Centered) */}
                      <div className="flex flex-col items-center justify-center bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm shrink-0 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-50 pointer-events-none"></div>
                         
                         <img src={projectLogo} className="w-20 h-20 rounded-2xl bg-slate-50 p-1 border border-slate-100 shadow-sm mb-3 z-10 object-contain" alt="Project Logo" />
                         <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase z-10 text-center">
                           {projectName} <span className="text-blue-600">UPDATE!</span>
                         </h1>
                      </div>

                      {/* MIDDLE BOX: Time, Cost, Recurring */}
                      <div className="grid grid-cols-3 gap-4 mt-4 shrink-0">
                        <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center transition-all hover:border-blue-300">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Layout className="w-3 h-3"/> Time Required</span>
                          <span className="text-3xl font-black text-slate-900">{t.time_minutes || '5'} <span className="text-lg text-slate-400 font-bold">Mins</span></span>
                        </div>
                        <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center transition-all hover:border-blue-300">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><DollarSign className="w-3 h-3"/> Cost</span>
                          <span className="text-3xl font-black text-emerald-600">${t.cost || '0'}</span>
                        </div>
                        <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center transition-all hover:border-blue-300">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Zap className="w-3 h-3"/> Frequency</span>
                          <span className="text-3xl font-black text-blue-600">{t.recurring || 'Once'}</span>
                        </div>
                      </div>

                      {/* BOTTOM BOX: Task Name, Steps, End Date */}
                      <div className="mt-4 flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 flex flex-col relative overflow-hidden">
                         
                         {/* Task Name & Deadline Header */}
                         <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 shrink-0">
                           <h2 className="text-2xl font-black text-slate-800 tracking-tight truncate max-w-[70%]">{taskName}</h2>
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-lg border border-rose-100 shadow-sm">
                             <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Deadline:</span>
                             <span className="text-sm font-black text-rose-600 tracking-wide">{formattedDate}</span>
                           </div>
                         </div>

                         {/* Task Description Body */}
                         <div className="flex-1 overflow-hidden flex flex-col">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/> Task Details & Steps</h3>
                            
                            {/* We use line-clamp-4 so if the tutorial markdown is huge, it safely cuts off instead of breaking the UI */}
                            <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 pr-4">
                              {t.description || 'Complete the on-chain interactions as required by the protocol to qualify for rewards.'}
                            </p>
                         </div>
                      </div>

                    </div>

                    {/* OUTER FOOTER */}
                    <div className="flex justify-between items-center text-blue-200 font-bold tracking-widest uppercase text-xs px-2">
                      <span>Task Update</span>
                      <span className="flex items-center gap-2">
                         <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="" className="w-4 h-4 "  />
                         airdropsailor.xyz
                      </span>
                    </div>

                  </div>
                );
              })()}
              {/* --- TEMPLATE 14: DAILY AIRDROP ACTIVITIES (AUTOMATED) --- */}
              {activeTemplate === "Daily Airdrop Activities" && (() => {
                
                // Fallback data if yesterday had no tasks (for UI testing)
                const fallbackData = [
                  { id: 1, raw: { name: 'Complete Daily Check-in', end_date: '2026-05-27', projects: { name: 'Nexora', logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Nexora' } } },
                  { id: 2, raw: { name: 'Make a Trade (Spot or Futures)', end_date: '2026-05-28', projects: { name: 'Kraken', logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Kraken' } } },
                  { id: 3, raw: { name: 'Move On-Chain with Binance Wallet', end_date: '2026-05-29', projects: { name: 'Grvt', logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Grvt' } } },
                  { id: 4, raw: { name: 'Trade on DEX & Earn Points', end_date: '2026-05-30', projects: { name: 'Variational', logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Variational' } } },
                  { id: 5, raw: { name: 'Complete Testnet Tasks', end_date: '2026-05-31', projects: { name: 'Overlayer', logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Overlayer' } } },
                  { id: 6, raw: { name: 'Complete Daily Quests', end_date: '2026-06-01', projects: { name: 'Zerius', logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Zerius' } } },
                ];

                // Note: We bypass `selectedItems` here so it auto-renders the fetched data!
                const displayData = availableData.length > 0 ? availableData.slice(0, 10) : fallbackData;

                // Helper to calculate days left from today
                const getDaysLeft = (endDateStr) => {
                  if (!endDateStr) return 'TBA';
                  const end = new Date(endDateStr);
                  const now = new Date();
                  const diffTime = end - now;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays > 0 ? `${diffDays} days left` : 'Ending';
                };

                // Formatter for the header date (Yesterday's date)
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const headerDate = yesterday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

                return (
                  <div className="w-[1200px] h-[675px] bg-[#0E21D0] flex flex-col p-8 font-sans overflow-hidden relative">
                    
                    {/* TOP HEADER CARD */}
                    <div className="w-full bg-white rounded-[2rem] px-10 py-6 flex items-center justify-between shadow-2xl relative z-10 shrink-0 mb-6 border-b-[4px] border-slate-200/50 h-[150px]">
                      <div className="flex flex-col justify-center">
                        <h1 className="text-[44px] font-black text-[#0E21D0] tracking-tight uppercase leading-[1.05]">
                          DAILY AIRDROP<br/>ACTIVITIES
                        </h1>
                        <p className="text-lg font-bold text-slate-500 mt-1.5">{headerDate}</p>
                      </div>
                      
                      {/* 3D Clipboard Graphic */}
                      <div className="absolute right-8 -top-16 w-[220px] h-[220px] drop-shadow-2xl z-20">
                        {/* 🚀 Note: Replace this src URL with the Supabase public URL of your specific clipboard image! */}
                        <img 
                          src="https://ptobheftxcjiqobxgeal.supabase.co/storage/v1/object/public/Illustrations/dailyairdropillustrations.png" 
                          alt="Daily Tasks Clipboard" 
                          className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
                          crossOrigin="anonymous" 
                        />
                      </div>
                    </div>

                    {/* 2-COLUMN GRID FOR TASKS (To fit 16:9 perfectly) */}
                    <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-4 relative z-10 content-start">
                      {displayData.map((item, index) => {
                        const t = item.raw || {};
                        const proj = t.projects || {};
                        
                        const projectName = proj.name || item.sub || 'Unknown';
                        const projectLogo = proj.logo_url || item.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}`;
                        const taskName = t.name || item.name || 'Complete tasks';
                        
                        // Determine bubble colors based on urgency
                        const daysLeftStr = getDaysLeft(t.end_date);
                        const isUrgent = daysLeftStr.includes('Ending') || parseInt(daysLeftStr) <= 3;
                        const bubbleClass = isUrgent 
                          ? "bg-rose-100 text-rose-600 border border-rose-200"
                          : "bg-[#F3FDE8] text-[#4FA821] border border-[#D5F5BA]";

                        return (
                          <div key={item.id || index} className="w-full bg-white rounded-full p-2.5 pr-5 flex items-center justify-between shadow-lg border-b-4 border-slate-200/50">
                            
                            {/* Logo & Project Name */}
                            <div className="flex items-center gap-4 w-[40%] border-r border-slate-200 pr-3">
                              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-inner">
                                <img src={projectLogo} className="w-full h-full rounded-full object-contain bg-white" alt="logo" crossOrigin="anonymous" />
                              </div>
                              <h3 className="text-lg font-black text-slate-900 truncate">{projectName}</h3>
                            </div>

                            {/* Task Name */}
                            <div className="flex-1 px-4 min-w-0">
                              <p className="text-sm font-semibold text-slate-600 truncate">{taskName}</p>
                            </div>

                            {/* Timer Bubble */}
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 shadow-sm ${bubbleClass}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              <span className="text-[11px] font-black uppercase tracking-wider">{daysLeftStr}</span>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                    {/* BOTTOM FOOTER */}
                    <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end z-10 pt-4">
                      <div className="text-white font-black text-xl tracking-widest uppercase">
                        AIRDROPSAILOR
                      </div>
                      
                      <div className="w-12 h-12 rounded-full flex items-center justify-center">
                         <img 
                           src="https://ptobheftxcjiqobxgeal.supabase.co/storage/v1/object/public/Illustrations/airdropsailorlogo.jpg" 
                           alt="Sailor Logo" 
                           className="w-full h-full object-contain invert brightness-0" 
                           crossOrigin="anonymous" 
                         />
                      </div>

                      <div className="text-white/80 font-bold text-sm tracking-widest uppercase">
                        Your Daily Dose of Airdrop Alpha
                      </div>
                    </div>

                  </div>
                );
              })()}

              </div> 
            </div>
          </div>
        </div>
        {/* ======================================================== */}
        {/* 📱 MOBILE STICKY ACTION BAR                              */}
        {/* ======================================================== */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50 pb-safe flex gap-2">
          
          {/* 🚀 NEW: Direct Schedule Button (Mobile) */}
          <button 
            onClick={handleOpenSchedule}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-4 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Rocket className="w-4 h-4" /> Schedule
          </button>

          <button 
            onClick={handleGenerateTweet}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-2 py-4 rounded-2xl font-black text-sm transition-all shadow-sm border border-slate-700"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Draft
          </button>

          <button 
            onClick={handleExport} 
            disabled={isCapturing}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-2 py-4 rounded-2xl font-black text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            {isCapturing ? (
              <span className="animate-pulse">Wait...</span>
            ) : (
              <><Download className="w-4 h-4" /> Image</>
            )}
          </button>
        </div>
        {/* ======================================================== */}
      {/* 🚀 NEW: AI TWEET MODAL                                   */}
      {/* ======================================================== */}
      {isTweetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsTweetModalOpen(false)}
          ></div>

          <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">AI Social Studio</h3>
                  <p className="text-xs font-bold text-slate-400">Drafting for: {activeTemplate}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTweetModalOpen(false)}
                className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-colors border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {isGeneratingTweet ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="font-bold text-sm animate-pulse">Consulting the Alpha...</p>
                </div>
              ) : (
                <div className="h-[22rem] overflow-y-auto space-y-5 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                  {/* X / Twitter Box */}
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="text-sm leading-none">𝕏</span> Twitter Hook
                      </label>
                      <span className={`text-[10px] font-black ${generatedTweet?.x_post?.length > 280 ? 'text-rose-500' : 'text-slate-500'}`}>
                        {generatedTweet?.x_post?.length || 0} / 280
                      </span>
                    </div>
                    <textarea 
                      value={generatedTweet?.x_post || ''}
                      onChange={(e) => setGeneratedTweet({ ...generatedTweet, x_post: e.target.value })}
                      className={`w-full h-24 bg-slate-950 border rounded-xl p-3 text-slate-200 text-sm font-medium focus:outline-none focus:ring-1 resize-none ${generatedTweet?.x_post?.length > 280 ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500'}`}
                      placeholder="Twitter post will appear here..."
                    />
                  </div>

                  {/* Telegram Box */}
                  <div>
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      ✈️ Telegram Announcement
                    </label>
                    <textarea 
                      value={generatedTweet?.tg_post || ''}
                      onChange={(e) => setGeneratedTweet({ ...generatedTweet, tg_post: e.target.value })}
                      className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                      placeholder="Telegram post will appear here..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
              <button 
                onClick={() => setIsTweetModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button 
  onClick={handleOpenSchedule}
  disabled={isGeneratingTweet || !generatedTweet}
  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-md"
>
  <Sparkles className="w-4 h-4" /> Prepare to Schedule
</button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* 🚀 NEW: COMMAND CENTER SCHEDULING MODAL                  */}
      {/* ======================================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isScheduling && setIsScheduleModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 p-6 flex flex-col z-10">
            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Route to Engines
            </h3>

            {/* Date & Time Picker */}
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Set Publishing Time</label>
            <input 
              type="datetime-local" 
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white mb-6 focus:border-blue-500 outline-none"
            />
            {/* 🚀 NEW: AI Generation Status */}
            <div className="mb-6 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Caption Status</span>
              {isGeneratingTweet ? (
                <span className="text-xs font-black text-amber-500 animate-pulse flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin"/> Drafting in background...</span>
              ) : generatedTweet ? (
                <span className="text-xs font-black text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3"/> Ready!</span>
              ) : null}
            </div>

            

            {/* Target Channels */}
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Target Engines</label>
            <div className="flex gap-4 mb-8">
              <label className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-slate-700 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={targetChannels.includes('x')}
                  onChange={(e) => {
                    if (e.target.checked) setTargetChannels([...targetChannels, 'x']);
                    else setTargetChannels(targetChannels.filter(c => c !== 'x'));
                  }}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-blue-500" 
                />
                <span className="font-bold text-white">𝕏 Engine</span>
              </label>

              <label className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-slate-700 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={targetChannels.includes('telegram')}
                  onChange={(e) => {
                    if (e.target.checked) setTargetChannels([...targetChannels, 'telegram']);
                    else setTargetChannels(targetChannels.filter(c => c !== 'telegram'));
                  }}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-blue-500" 
                />
                <span className="font-bold text-white">✈️ Telegram</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isScheduling}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleSchedulePost}
                disabled={isScheduling || targetChannels.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2"
              >
                {isScheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isScheduling ? 'Routing Data...' : 'Confirm & Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}