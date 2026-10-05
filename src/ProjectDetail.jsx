import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import ReactMarkdown from 'react-markdown';
import { useAuth } from './useAuth';
import remarkGfm from 'remark-gfm';
import ProjectDetailsPageMobile from './mobile/pages/ProjectDetailsPageMobile';
import useIsMobile from "./hooks/useIsMobile";

import { 
  ArrowLeft, Twitter, Globe, MessageSquare, 
  Flame, Copy, CheckCircle2, Clock, Check, 
  Share2, Download, ExternalLink, Zap, ShieldAlert, Star,
  DollarSign, Target, Layout, Search, Bell, Settings, ListChecks, LayoutTemplate, Cpu,
  BrainCircuit, Gavel, ShieldCheck, Activity, Rocket, AlertTriangle, TrendingUp, Users, Coins
} from 'lucide-react';

export default function ProjectDetail() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authenticated, login } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]); 
  const [activeTask, setActiveTask] = useState(null); 
  const [topProjects, setTopProjects] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [isImporting, setIsImporting] = useState(false);
  const [isUntracking, setIsUntracking] = useState(false);
  const [investorLogos, setInvestorLogos] = useState({});
  const [hasImported, setHasImported] = useState(false);
  const [toast, setToast] = useState(null);
  const [discordRoles, setDiscordRoles] = useState([]);
  const [discordActivities, setDiscordActivities] = useState([]);

  // 🚀 User Limits State
  const [projectCount, setProjectCount] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState('Free');
const [projectLimit, setProjectLimit] = useState(5);
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState('step-by-step');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500); 
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    const checkImportStatus = async () => {
      if (authenticated && user && project) {
        const { data } = await supabase
          .from('tracker_user_projects')
          .select('id')
          .eq('auth_id', user.id)
          .eq('project_id', project.id)
          .maybeSingle();

        if (data) setHasImported(true);
        else setHasImported(false);
      }
    };
    checkImportStatus();
  }, [authenticated, user, project]);

  useEffect(() => {
    const fetchUserLimits = async () => {
      if (authenticated && user) {
        // Count user's current tracked projects
        const { count } = await supabase
          .from('tracker_user_projects')
          .select('*', { count: 'exact', head: true })
          .eq('auth_id', user.id);
        
        setProjectCount(count || 0);
        const { data: profile } = await supabase
  .from('user_profiles')
  .select('subscription_tier, project_limit')
  .eq('auth_id', user.id)
  .maybeSingle();
        

      
        
        if (profile) {
  setSubscriptionTier(profile.subscription_tier || 'Free');
  setProjectLimit(profile.project_limit || 5);
}
      }
    };
    fetchUserLimits();
  }, [authenticated, user, isImporting, isUntracking]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      let query = supabase.from('projects').select('*');
      if (isUUID) { query = query.eq('id', id); } 
      else { query = query.eq('slug', id); }

      const { data: projectData, error: projectError } = await query.single();
      if (projectError) throw projectError;
      setProject(projectData);

      if (projectData?.lead_investors) {
        const investorNames = projectData.lead_investors.split(',').map(n => n.trim());
        const { data: profiles } = await supabase
          .from('pioneer_profiles')
          .select('name, logo_url, website') // <-- Added 'website' here
          .in('name', investorNames);

        if (profiles) {
          const logoMap = {};
          profiles.forEach(p => { 
            // Extract clean domain from the website
            let cleanDomain = null;
            if (p.website) {
              try {
                const urlObj = new URL(p.website.startsWith('http') ? p.website : `https://${p.website}`);
                cleanDomain = urlObj.hostname.replace('www.', '');
              } catch(e) { console.error("Invalid URL format:", p.website); }
            }
            
            // Prioritize Google Favicon over the unstable logo_url
            logoMap[p.name] = cleanDomain ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128` : p.logo_url; 
          });
          setInvestorLogos(logoMap);
        }
      }

      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectData.id); 

      if (!taskError && taskData) {
        setTasks(taskData);
        if (taskData.length > 0) setActiveTask(taskData[0]);
      }

      const { data: allProjects } = await supabase
        .from('projects')
        .select('*')
        .neq('id', projectData.id)
        .limit(30);
      
      if (allProjects) {
        const scoredProjects = allProjects.sort((a, b) => (b.score_total || 0) - (a.score_total || 0));
        setTopProjects(scoredProjects.slice(0, 10));
      }
      // Fetch Discord Roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('discord_roles')
        .select('*')
        .eq('project_id', projectData.id);
      if (!rolesError && rolesData) {
        setDiscordRoles(rolesData);
      }

      // Fetch Discord Activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('discord_activities')
        .select('*')
        .eq('project_id', projectData.id)
        .order('date_posted', { ascending: false });
      if (!activitiesError && activitiesData) {
        setDiscordActivities(activitiesData);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Pulls the total score directly from your new database column
  const calculateMasterScore = () => project?.score_total || 0;

  const renderDonutScore = () => {
    const score = calculateMasterScore();
    let strokeColor = score >= 80 ? '#10b981' : score >= 50 ? '#3b82f6' : '#f59e0b'; 
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
          <circle 
            cx="40" cy="40" r={radius} fill="none" stroke={strokeColor} 
            strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} 
            strokeLinecap="round" className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-lg font-black text-slate-800 leading-none">{score}</span>
        </div>
      </div>
    );
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    return `${diffDays} days left`;
  };

  // 🚀 FIXED: Simple 100 SAIL + Strict Tier Limits
  const handleImportProject = async () => {
    if (!authenticated || !user) { login(); return; }
    setIsImporting(true);
    
    try {
      const privyId = user.id;

      // 1. Enforce Strict Limits
    const currentLimit = projectLimit;
      
      if (projectCount >= currentLimit) {
        if (subscriptionTier === 'Free') {
          showToast(`You are tracking ${projectCount}/${projectLimit} projects! Upgrade to Sailor Pass for unlimited slots.`, 'error');
          setTimeout(() => navigate('/subscription'), 2500);
        } else {
          showToast('Absolute tracker limit reached.', 'error');
        }
        setIsImporting(false);
        return;
      }

      const projectId = project.id;
      

      // 2. Insert project into database
      const { error: subError } = await supabase.from('tracker_user_projects').insert([{ auth_id: privyId, project_id: projectId }]);
      if (subError) {
        if (subError.code === '23505') {
          setHasImported(true);
          showToast('Already tracking this project!', 'success');
          return;
        }
        throw subError;
      }


      setHasImported(true);
      setProjectCount(prev => prev + 1);
      showToast('Project added to tracker.', 'success');

    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message || 'Failed to track project'}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // 🚀 FIXED: Simple 100 SAIL Deduction
  const handleUntrackProject = async () => {
    if (!authenticated || !user) { login(); return; }
    setIsUntracking(true);

    try {
      const privyId = user.id;
      const projectId = project.id;
      

      const { error: deleteError } = await supabase
        .from('tracker_user_projects')
        .delete()
        .eq('auth_id', privyId)
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      


      setHasImported(false);
      setProjectCount(prev => Math.max(prev - 1, 0));
      showToast('Project removed from tracker.', 'success');

    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message || 'Failed to untrack project'}`, 'error');
    } finally {
      setIsUntracking(false);
    }
  };

  const formatFunding = (amount) => {
    if (!amount) return 'TBA';
    const amountStr = amount.toString();
    return amountStr.startsWith('$') ? amountStr : `$${amountStr}`;
  };
  
  const formatFollowers = (num) => {
    if (num == null) return 'TBA';
    const n = Number(num);
    if (isNaN(n)) return num; 
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold bg-[#F8FAFC]">Project Not Found.</div>;

  // --- ADD THIS MOBILE HANDOFF ---
  if (isMobile) {
    return (
      <ProjectDetailsPageMobile
        project={project}
        loading={loading}
        tasks={tasks}
        score={project.score_total || 0}
        hasImported={hasImported}
        isImporting={isImporting}
        isUntracking={isUntracking}
        handleImportProject={handleImportProject}
        handleUntrackProject={handleUntrackProject}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        discordRoles={discordRoles}
        discordActivities={discordActivities}
      />
    );
  }
  // -------------------------------

  const guideContent = activeTask?.tutorial_markdown || activeTask?.task_article || activeTask?.description;
  const hasGuide = guideContent && guideContent.trim().length > 0;

  return (
    <div className="w-full h-full pb-20 font-sans text-slate-900 relative">
      
      {toast && (
        <div className="fixed bottom-10 right-10 z-[100] transition-all transform duration-300 ease-out translate-y-0 opacity-100">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {toast.type === 'error' ? <ShieldAlert className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-0 md:pt-2">
        
      

        {/* ========================================================= */}
        {/* SECTION 1: THE TOP HERO BOX (4-Column Grid)               */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Column 1: Branding */}
            <div className="col-span-1 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img 
                  src={project.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${project.name}`} 
                  alt={project.name} 
                  className="w-16 h-16 rounded-full object-cover border border-slate-100 shadow-sm"
                />
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    {project.name} <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                  </h1>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-3">
                {project.description || 'No description provided for this protocol.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {project.website_url && (
                  <a href={project.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-colors border border-slate-200">
                    <Globe size={12}/> Website
                  </a>
                )}
                {project.x_link && (
                  <a href={project.x_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 rounded-lg text-[10px] font-bold uppercase transition-colors border border-slate-200">
                    <Twitter size={12}/> Twitter
                  </a>
                )}
                {project.discord_link && (
                  <a href={project.discord_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-[10px] font-bold uppercase transition-colors border border-slate-200">
                    <MessageSquare size={12}/> Discord
                  </a>
                )}
              </div>
            </div>

            {/* Column 2: Funding & Backers */}
            <div className="col-span-1 flex flex-col justify-center border-l border-slate-100 pl-6">
              <div className="mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Raised</span>
                <span className="text-2xl font-black text-slate-900">{formatFunding(project.funding)}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Funds & Backers</span>
                <div className="flex flex-wrap items-center gap-2">
                  {project.lead_investors ? (
                    project.lead_investors.split(',').slice(0, 2).map((inv, idx) => {
                      const name = inv.trim();
                      const logo = investorLogos[name];
                      return (
                        <div key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full pr-2 p-1">
                          {logo ? (
                            <img src={logo} alt={name} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[8px] font-black uppercase">
                              {name.substring(0, 2)}
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-slate-700 truncate max-w-[80px]">{name}</span>
                        </div>
                      )
                    })
                  ) : (
                    <span className="text-xs font-bold text-slate-400">Undisclosed</span>
                  )}
                  {project.lead_investors && project.lead_investors.split(',').length > 2 && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                      +{project.lead_investors.split(',').length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Scores */}
            <div className="col-span-1 flex flex-col justify-center border-l border-slate-100 pl-6">
              <div className="flex items-center gap-4 mb-4">
                {renderDonutScore()}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analytics</p>
                  <p className="text-sm font-black text-slate-800 uppercase">Airdrop Score</p>
                </div>
              </div>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">X Followers</span>
                  <span className="font-black text-slate-900">{formatFollowers(project.twitter_followers)}</span>
                </li>
                <li className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Discord Users</span>
                  <span className="font-black text-slate-900">{formatFollowers(project.discord_members)}</span>
                </li>
                <li className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Social Score</span>
                  <span className="font-black text-slate-900">{project.score_social || 0} / 100</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Details */}
            <div className="col-span-1 flex flex-col justify-center border-l border-slate-100 pl-6">
              <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-3 text-slate-400">
                <Target size={20} />
              </div>
              <ul className="space-y-2.5">
                <li className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Category</span>
                  <span className="font-black text-slate-900 truncate max-w-[100px] text-right">{project.category || 'General'}</span>
                </li>
                <li className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Task Count</span>
                  <span className="font-black text-slate-900">{tasks.length}</span>
                </li>
                <li className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Time Consumed</span>
                  <span className="font-black text-slate-900">{project.total_time_estimate || 0} min</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: NARROW INFO & ACTION BAR                       */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Cost:</span> {project.total_cost_estimate?.startsWith('$') ? project.total_cost_estimate : `$${project.total_cost_estimate || '0'}`}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Tier:</span> {project.tier || 'TBA'}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Status:</span> 
              <div className={`w-2 h-2 rounded-full ${project.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              {project.status || 'Active'}
            </span>
            {/* Dynamic SAIL Badge */}
            {authenticated && !hasImported && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Zap className="w-3 h-3" />
                +100 SAIL
              </span>
            )}
          </div>

          <button 
            onClick={hasImported ? handleUntrackProject : handleImportProject} 
            disabled={isImporting || isUntracking} 
            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-black text-sm shadow-sm transition-all ${
              hasImported 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600' 
                : subscriptionTier !== 'Free'
                  ? 'bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isImporting ? 'Syncing...' : isUntracking ? 'Untracking...' : hasImported ? <><CheckCircle2 className="w-4 h-4" /> Untrack Project</> : (
              <>
                <Download className="w-4 h-4" />
                Add to Tracker
              </>
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: TAB NAVIGATION & CONTENT                       */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 border border-slate-200 rounded-2xl w-max mt-8 mb-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('step-by-step')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'step-by-step' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <ListChecks size={16} /> Step by Step
          </button>
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <LayoutTemplate size={16} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('funding')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'funding' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <DollarSign size={16} /> Funding & Team
          </button>
          <button 
            onClick={() => setActiveTab('discord')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'discord' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <MessageSquare size={16} /> Discord Alpha
          </button>
          <button 
            onClick={() => setActiveTab('tokenomics')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'tokenomics' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Coins size={16} /> Tokenomics
          </button>
          
        </div>

        {/* TAB CONTENTS */}
        <div className="mb-16">
          
          {/* TAB 1: STEP-BY-STEP (Original Task Layout) */}
          {activeTab === 'step-by-step' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <div className="sticky top-24">
                  <h2 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" /> Action Plan
                  </h2>
                  <div className="flex flex-col gap-3">
                    {tasks.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
                        <p className="text-sm font-bold text-slate-400">No tasks mapped yet.</p>
                      </div>
                    ) : (
                      tasks.map((task, index) => {
                        const daysLeftStr = getDaysLeft(task.end_date);
                        const isActive = activeTask?.id === task.id;
                        
                        return (
                          <div 
                            key={task.id || index} 
                            onClick={() => setActiveTask(task)}
                            className={`cursor-pointer rounded-xl p-4 transition-all border-2 group shadow-sm relative overflow-hidden
                              ${isActive ? 'bg-blue-50/50 border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                          >
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>}
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>Step {index + 1}</span>
                              {(task.status === 'Ended' || daysLeftStr === 'Ended') ? (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-600">ENDED</span>
                              ) : daysLeftStr ? (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-orange-50 text-orange-600">{daysLeftStr}</span>
                              ) : null}
                            </div>
                            <h3 className={`font-bold text-sm mb-3 line-clamp-2 ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>{task.name || 'Untitled Task'}</h3>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                <Clock className="w-3 h-3" /> {task.recurring || 'One-time'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-10 min-h-[500px] flex flex-col">
                  {activeTask ? (
                    <>
                      <div className="mb-6"><h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeTask.name}</h2></div>
                      <hr className="border-slate-100 mb-8" />
                      <div className="flex-grow">
                        {hasGuide ? (
                          <div className="prose prose-slate max-w-none 
    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 
    prose-h1:text-3xl prose-h1:mb-6
    prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-3 prose-h2:mt-10 prose-h2:mb-4
    prose-h3:text-lg prose-h3:mt-8
    prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-sm
    prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
    prose-strong:text-slate-900 prose-strong:font-black
    prose-ul:list-disc prose-ul:pl-5 prose-li:text-slate-600 prose-li:marker:text-blue-500 prose-li:text-sm
    prose-ol:list-decimal prose-ol:pl-5
    prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-bold prose-code:before:content-none prose-code:after:content-none prose-code:text-[13px]
    prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:border prose-pre:border-slate-800
    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:font-medium prose-blockquote:text-blue-800 prose-blockquote:not-italic prose-blockquote:shadow-sm
    prose-img:rounded-2xl prose-img:shadow-md prose-img:border prose-img:border-slate-200
    prose-hr:border-slate-100 prose-hr:my-8
    prose-table:border-collapse prose-table:w-full prose-th:text-left prose-th:p-3 prose-th:bg-slate-50 prose-th:border prose-th:border-slate-200 prose-td:p-3 prose-td:border prose-td:border-slate-200 prose-td:text-sm text-slate-600">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{guideContent}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-10 text-center my-6">
                            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 mb-2">No specific guide available</h3>
                            <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">Participate directly using the official link below.</p>
                          </div>
                        )}
                      </div>
                      {(activeTask.task_link || activeTask.link || activeTask.url) && (
                        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                          <a href={activeTask.task_link || activeTask.link || activeTask.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all">
                            Launch Protocol <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center opacity-40 py-20 flex-grow">
                      <CheckCircle2 className="w-16 h-16 text-slate-300 mb-4" />
                      <h2 className="text-xl font-black mb-1">Select an Action</h2>
                      <p className="text-sm font-bold text-slate-500">Choose a step from the navigator to view instructions.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {(() => {
                let aiData = {};
                let compData = { project_similarity: "", competitors: [] };
                
                try { aiData = typeof project?.ai_research_data === 'string' ? JSON.parse(project.ai_research_data || '{}') : (project?.ai_research_data || {}); } catch(e) {}
                try { compData = typeof project?.competitor_analysis === 'string' ? JSON.parse(project.competitor_analysis || '{"competitors":[]}') : (project?.competitor_analysis || {competitors:[]}); } catch(e) {}

                // SCORING LOGIC
                const totalScore = parseInt(project?.score_total) || 0;
                const socialScore = parseInt(project?.score_social) || 0;
                const fundingScore = parseInt(project?.score_funding) || 0;
                const airdropScore = parseInt(project?.score_airdrop) || 0;
                const fundamentalScore = parseInt(project?.score_fundamental) || 0;

                const scoreThemes = {
                  social: { iconBg: 'bg-blue-50', iconColor: 'text-blue-500', barColor: 'bg-blue-500', barBg: 'bg-slate-100' },
                  funding: { iconBg: 'bg-rose-50', iconColor: 'text-rose-500', barColor: 'bg-rose-500', barBg: 'bg-slate-100' },
                  airdrop: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', barColor: 'bg-emerald-500', barBg: 'bg-slate-100' },
                  fundamental: { iconBg: 'bg-amber-50', iconColor: 'text-amber-500', barColor: 'bg-amber-500', barBg: 'bg-slate-100' }
                };

                const getRatingLabel = (score) => {
                  const s = parseInt(score) || 0;
                  if (s >= 80) return 'Excellent';
                  if (s >= 60) return 'Good';
                  if (s >= 40) return 'Moderate';
                  if (s >= 20) return 'Weak';
                  return 'Very Weak';
                };

                const getTableStatus = (score) => {
                  const s = parseInt(score) || 0;
                  if (s === 0) return { label: 'No Public Data', dot: 'bg-rose-500' };
                  if (s >= 80) return { label: 'Exceptional', dot: 'bg-emerald-500' };
                  if (s >= 60) return { label: 'Positive Signals', dot: 'bg-emerald-500' };
                  if (s >= 40) return { label: 'Average', dot: 'bg-amber-500' };
                  if (s >= 20) return { label: 'Needs Growth', dot: 'bg-amber-500' };
                  return { label: 'Very Weak', dot: 'bg-rose-500' };
                };

                const ratingColors = {
                  'Excellent': 'text-emerald-700 bg-emerald-100',
                  'Good': 'text-emerald-600 bg-emerald-50',
                  'Moderate': 'text-amber-600 bg-amber-50',
                  'Weak': 'text-rose-600 bg-rose-50',
                  'Very Weak': 'text-rose-700 bg-rose-100'
                };

                const ScoreCard = ({ title, subtitle, score, icon: Icon, themeName }) => {
                  const theme = scoreThemes[themeName];
                  const rating = getRatingLabel(score);
                  
                  return (
                    <div className="bg-white border border-[#E7ECF4] rounded-[20px] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.02)] flex flex-col h-full">
                      <div className="flex items-start gap-3 mb-6">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${theme.iconBg} ${theme.iconColor}`}>
                           <Icon className="w-5 h-5" />
                         </div>
                         <div>
                           <h3 className="text-[14px] font-black text-slate-900 leading-tight">{title}</h3>
                           <p className="text-[11px] font-medium text-slate-500 leading-snug mt-0.5">{subtitle}</p>
                         </div>
                      </div>
                      
                      <div className="mt-auto">
                         <div className="flex items-end justify-between mb-3">
                           <div className="flex items-baseline gap-1">
                             <span className={`text-2xl font-black ${theme.iconColor}`}>{score}</span>
                             <span className="text-xs font-bold text-slate-400">/ 100</span>
                           </div>
                           <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold tracking-wide ${ratingColors[rating]}`}>
                             {rating}
                           </span>
                         </div>
                         <div className={`w-full h-2 rounded-full overflow-hidden ${theme.barBg}`}>
                           <div className={`h-full rounded-full ${theme.barColor}`} style={{ width: `${score}%` }}></div>
                         </div>
                      </div>
                    </div>
                  );
                };

                const BreakdownRow = ({ theme, icon: Icon, title, subtitle, score, metrics }) => {
                  const themeStyles = scoreThemes[theme];
                  const rating = getRatingLabel(score);
                  const status = getTableStatus(score);

                  return (
                    <tr className="border-b border-[#EEF2F7] hover:bg-slate-50/50 transition-colors h-[76px]">
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${themeStyles.iconBg} ${themeStyles.iconColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 leading-tight">{title}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{subtitle}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${themeStyles.iconColor}`}>{score} <span className="text-slate-400 font-medium text-xs">/ 100</span></span>
                          <div className={`w-12 h-1.5 rounded-full overflow-hidden ${themeStyles.barBg} hidden sm:block`}>
                            <div className={`h-full rounded-full ${themeStyles.barColor}`} style={{ width: `${score}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4">
                        <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold tracking-wide ${ratingColors[rating]}`}>
                          {rating}
                        </span>
                      </td>
                      <td className="px-4 text-xs font-bold text-slate-500">
                        25%
                      </td>
                      <td className="px-4 py-2">
                        <ul className="text-[11px] font-medium text-slate-500 space-y-0.5">
                          {metrics.map((m, i) => (
                            <li key={i}><span className="text-slate-400">•</span> {m.label}: <span className="text-slate-700 font-bold">{m.value}</span></li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.dot}`}></div>
                          <span className="text-xs font-bold text-slate-700">{status.label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                };

                return (
                  <>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 relative overflow-hidden">
                       <div className="flex justify-between items-center mb-6 relative z-10">
                         <h2 className="text-sm font-black text-slate-900 tracking-widest flex items-center gap-2 uppercase">
                           <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> The Thesis
                         </h2>
                         <div className="flex gap-2">
                            <span className="px-3 py-1 bg-blue-50/50 border border-blue-100 text-blue-600 rounded-lg text-xs font-bold tracking-wide">{project?.tier || 'Tier 3'}</span>
                            <span className="px-3 py-1 bg-orange-50 border border-orange-100 text-orange-600 rounded-lg text-xs font-bold tracking-wide">{project?.status || 'Point Farming'}</span>
                         </div>
                       </div>
                       
                       <p className="text-slate-800 font-medium text-[15px] leading-relaxed mb-8 max-w-2xl relative z-10">
                         {aiData.bio || project?.description || 'Institutional-Grade multi-strategy yield & infrastructure in one portal.'}
                       </p>
                       
                       <div className="flex flex-wrap gap-3 relative z-10">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"><Layout className="w-3.5 h-3.5 text-blue-500" /> Multi-Strategy Yield</span>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Institutional Grade</span>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"><BrainCircuit className="w-3.5 h-3.5 text-blue-500" /> Unified Infrastructure</span>
                       </div>

                       <div className="absolute right-10 top-1/2 -translate-y-1/2 w-56 h-56 opacity-30 pointer-events-none hidden lg:block">
                          <svg viewBox="0 0 200 200" className="w-full h-full animate-[spin_40s_linear_infinite]">
                             <ellipse cx="100" cy="100" rx="90" ry="25" fill="none" stroke="#3b82f6" strokeWidth="1" transform="rotate(30 100 100)" />
                             <ellipse cx="100" cy="100" rx="90" ry="25" fill="none" stroke="#3b82f6" strokeWidth="1" transform="rotate(90 100 100)" />
                             <ellipse cx="100" cy="100" rx="90" ry="25" fill="none" stroke="#3b82f6" strokeWidth="1" transform="rotate(150 100 100)" />
                             <circle cx="100" cy="100" r="18" fill="#3b82f6" />
                          </svg>
                       </div>
                    </div>

                    {/* AREA 1: PROJECT INTELLIGENCE SCORE */}
                    <div className="bg-white rounded-[10px] border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.02)] p-7 lg:p-9 flex flex-col lg:flex-row gap-10">
                      
                      {/* Left Side */}
                      <div className="lg:w-[40%] flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Scoring Analysis</span>
                        </div>
                        <h2 className="text-[18px] font-black text-[#0F172A] tracking-tight leading-tight mb-2">Project Intelligence Score</h2>
                        <p className="text-[13px] text-slate-500 font-medium mb-8 leading-relaxed">
                          Comprehensive analysis across key dimensions to evaluate project potential, risk and opportunity.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-8">
                           {/* Donut */}
                           <div className="flex flex-col items-center">
                             <div className="relative w-[140px] h-[140px] flex items-center justify-center shrink-0">
                               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                 <circle cx="80" cy="80" r="66" fill="none" stroke="#E8EEF7" strokeWidth="14" />
                                 <circle 
                                   cx="80" cy="80" r="66" fill="none" stroke="#2563EB" 
                                   strokeWidth="14" strokeDasharray={2 * Math.PI * 66} strokeDashoffset={(2 * Math.PI * 66) * (1 - totalScore / 100)} 
                                   strokeLinecap="round" className="transition-all duration-1000 ease-out" 
                                 />
                               </svg>
                               <div className="absolute flex flex-col items-center justify-center mt-2">
                                 <span className="text-[30px] font-black text-slate-900 leading-none tracking-tight">{totalScore}</span>
                                 <span className="text-[15px] font-bold text-slate-400 leading-none mt-1">/ 100</span>
                               </div>
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2">Overall Score</span>
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200/50 rounded-full text-[10px] font-bold">
                               <TrendingUp className="w-3 h-3" /> {project?.tier || 'Composite Score'}
                             </span>
                           </div>

                           {/* Metadata */}
                           <div className="flex-1 w-full space-y-4">
                             <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                               <span className="flex items-center gap-2 text-xs font-bold text-slate-500"><Layout className="w-4 h-4 text-slate-400"/> Category</span>
                               <span className="text-xs font-black text-slate-900 truncate max-w-[100px] text-right">{project?.category || 'General'}</span>
                             </div>
                             <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                               <span className="flex items-center gap-2 text-xs font-bold text-slate-500"><ListChecks className="w-4 h-4 text-slate-400"/> Task Count</span>
                               <span className="text-xs font-black text-slate-900">{tasks.length}</span>
                             </div>
                             <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                               <span className="flex items-center gap-2 text-xs font-bold text-slate-500"><Clock className="w-4 h-4 text-slate-400"/> Time Consumed</span>
                               <span className="text-xs font-black text-slate-900">{project?.total_time_estimate || 0} min</span>
                             </div>
                             {project?.created_at && (
                               <div className="flex justify-between items-center pb-1">
                                 <span className="flex items-center gap-2 text-xs font-bold text-slate-500"><Target className="w-4 h-4 text-slate-400"/> Analysis Updated</span>
                                 <span className="text-xs font-black text-slate-900">{new Date(project.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                               </div>
                             )}
                           </div>
                        </div>
                      </div>

                      {/* Right Side 2x2 Grid */}
                      <div className="lg:w-[60%] grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ScoreCard 
                          title="Social Score" 
                          subtitle="Community presence and social growth" 
                          score={socialScore} 
                          icon={Users} 
                          themeName="social" 
                        />
                        <ScoreCard 
                          title="Funding Score" 
                          subtitle="Funding strength and investor backing" 
                          score={fundingScore} 
                          icon={DollarSign} 
                          themeName="funding" 
                        />
                        <ScoreCard 
                          title="Airdrop Score" 
                          subtitle="Airdrop potential and user incentives" 
                          score={airdropScore} 
                          icon={Zap} 
                          themeName="airdrop" 
                        />
                        <ScoreCard 
                          title="Fundamental Score" 
                          subtitle="Project quality and long-term potential" 
                          score={fundamentalScore} 
                          icon={ShieldCheck} 
                          themeName="fundamental" 
                        />
                      </div>

                    </div>

                    {/* AREA 2: DETAILED SCORING BREAKDOWN */}
                    <div className="bg-white rounded-[24px] border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.02)] p-7 lg:p-9 mt-6 overflow-hidden">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Detailed Scoring Breakdown</h2>
                      </div>
                      <p className="text-[13px] text-slate-500 font-medium mb-6">Exact scores and key metrics used for analysis</p>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-slate-50/80 border-y border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="px-4 py-3 rounded-l-lg">Dimension</th>
                              <th className="px-4 py-3">Score</th>
                              <th className="px-4 py-3">Rating</th>
                              <th className="px-4 py-3">Weight</th>
                              <th className="px-4 py-3">Key Metrics</th>
                              <th className="px-4 py-3 rounded-r-lg">Status</th>
                            </tr>
                          </thead>
                          <tbody className="text-[13px]">
                            <BreakdownRow 
                              theme="social" icon={Users} title="Social" subtitle="Community presence"
                              score={socialScore}
                              metrics={[
                                { label: 'X Followers', value: formatFollowers(project?.twitter_followers) },
                                { label: 'Discord Members', value: formatFollowers(project?.discord_members) }
                              ]}
                            />
                            <BreakdownRow 
                              theme="funding" icon={DollarSign} title="Funding" subtitle="Investor backing"
                              score={fundingScore}
                              metrics={[
                                { label: 'Total Raised', value: formatFunding(project?.funding) },
                                { label: 'Lead Investors', value: project?.lead_investors ? 'Public' : '—' }
                              ]}
                            />
                            <BreakdownRow 
                              theme="airdrop" icon={Zap} title="Airdrop" subtitle="Airdrop potential"
                              score={airdropScore}
                              metrics={[
                                { label: 'Airdrop Status', value: project?.airdrop_status || '—' },
                                { label: 'Task Count', value: tasks.length }
                              ]}
                            />
                            <BreakdownRow 
                              theme="fundamental" icon={ShieldCheck} title="Fundamental" subtitle="Project quality"
                              score={fundamentalScore}
                              metrics={[
                                { label: 'Category', value: project?.category || '—' },
                                { label: 'Ecosystem', value: project?.tier || '—' }
                              ]}
                            />
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 3: FUNDING & TEAM (Premium Institutional Layout) */}
          {activeTab === 'funding' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {(() => {
                let aiData = {};
                try { aiData = typeof project?.ai_research_data === 'string' ? JSON.parse(project.ai_research_data || '{}') : (project?.ai_research_data || {}); } catch(e) {}
                
                let founders = [];
                try { 
                  const parsed = typeof project?.founders_details === 'string' ? JSON.parse(project.founders_details || '[]') : (project?.founders_details || []); 
                  founders = Array.isArray(parsed) ? parsed : [];
                } catch (e) {}

                const fundingVal = project?.funding ? formatFunding(project.funding) : 'Undisclosed';
                const stage = project?.tier || 'Seed / Strategic';
                const fundingScore = project?.score_funding || 0;

                const getFundingRating = (s) => {
                  if (s >= 80) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-100', bar: 'bg-emerald-500' };
                  if (s >= 60) return { label: 'Good', color: 'text-emerald-600 bg-emerald-50', bar: 'bg-emerald-400' };
                  if (s >= 40) return { label: 'Moderate', color: 'text-amber-600 bg-amber-50', bar: 'bg-amber-500' };
                  if (s >= 20) return { label: 'Weak', color: 'text-orange-600 bg-orange-50', bar: 'bg-orange-500' };
                  return { label: 'Very Weak', color: 'text-rose-700 bg-rose-100', bar: 'bg-rose-500' };
                };
                const fundingRating = getFundingRating(fundingScore);

                return (
                  <>
                    {/* SECTION 1 & 2: COMBINED FUNDING & INVESTORS */}
                    <div className="bg-white rounded-[24px] border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.02)] p-7 lg:p-9">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-[18px] font-black text-[#0F172A] tracking-tight flex items-center gap-2">
                            Funding & Investors
                          </h2>
                          <p className="text-[13px] text-slate-500 font-medium mt-1">Funding details and key investors backing this project.</p>
                        </div>
                        
                      </div>

                      <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
                        {/* LEFT: Funding Overview (~30%) */}
                        <div className="lg:w-[30%] flex flex-col">
                          <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> FUNDING OVERVIEW
                          </h3>
                          <div className="text-[10px] md:text-[25px] font-black text-slate-900 tracking-tight leading-none mb-1">
                            {fundingVal}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Total Capital Raised</div>
                          <p className="text-[12px] font-medium text-slate-500 leading-relaxed mb-6">
                            Strong backing indicates higher probability for airdrop allocations.
                          </p>

                          <hr className="border-slate-100 mb-6" />

                          {/* Funding Score section */}
                          <div className="mb-6">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Funding Score</h4>
                             <div className="flex items-end gap-2 mb-2">
                               <span className="text-2xl font-black text-[#0F172A] leading-none">{fundingScore}</span>
                               <span className="text-xs font-bold text-slate-400 leading-none mb-0.5">/ 100</span>
                             </div>
                             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                               <div className={`h-full rounded-full ${fundingRating.bar}`} style={{ width: `${fundingScore}%` }}></div>
                             </div>
                             <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${fundingRating.color}`}>
                               {fundingRating.label}
                             </span>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500">Funding Stage</span>
                            <span className="text-[12px] font-black text-slate-900">{stage}</span>
                          </div>
                        </div>

                        {/* RIGHT: Investors (~70%) */}
                        <div className="lg:w-[70%] lg:border-l lg:border-slate-100 lg:pl-8 xl:pl-12 flex flex-col min-w-0">
                           <div className="flex justify-between items-center mb-6">
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                               <Users className="w-3.5 h-3.5 text-blue-500" /> LEAD INVESTORS & BACKERS
                             </h3>
                             <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                               {project?.lead_investors && project.lead_investors.trim() !== '' ? project.lead_investors.split(',').length : 0} Investors
                             </span>
                           </div>

                           {(() => {
                             const allInvestors = project?.lead_investors && project.lead_investors.trim() !== '' 
                               ? project.lead_investors.split(',').map(i => i.trim()).filter(Boolean) 
                               : [];
                             const showAll = allInvestors.length <= 6;
                             const visibleInvestors = showAll ? allInvestors : allInvestors.slice(0, 5);
                             const hiddenCount = showAll ? 0 : allInvestors.length - 5;

                             if (allInvestors.length === 0) {
                               return (
                                <div className="flex-1 min-w-[240px] bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-3"></div>
                                  <p className="text-xs font-bold text-slate-700">No public investors listed yet</p>
                                  <p className="text-[10px] font-medium text-slate-500 mt-1">We'll update as soon as data is available.</p>
                                </div>
                               );
                             }

                             return (
                               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                 {visibleInvestors.map((inv, idx) => {
                                   const rawName = inv;
                                   const isLead = /\(Lead\)/i.test(rawName);
                                   const cleanName = rawName.replace(/\s*\(Lead\)\s*/i, '');
                                   
                                   const profile = (typeof investorProfiles !== 'undefined' && investorProfiles) ? investorProfiles[cleanName] : null;
                                   const logo = (typeof investorLogos !== 'undefined' && investorLogos) ? investorLogos[cleanName] : null;
                                   
                                   const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=f8fafc&textColor=0f172a&bold=true`;
                                   const finalLogo = logo || fallbackLogo;

                                   return (
                                     <div key={idx} className="bg-white border border-slate-200 hover:border-blue-300 rounded-[14px] p-3 flex items-center gap-3 shadow-[0_2px_8px_rgba(15,23,42,0.02)] transition-all min-w-0">
                                        <div className="relative shrink-0">
                                          <img src={finalLogo} alt={cleanName} onError={(e)=>{e.target.onerror=null; e.target.src=fallbackLogo}} className="w-[38px] h-[38px] rounded-full object-cover bg-slate-50 border border-slate-100 shadow-sm" />
                                          {isLead && (
                                            <div className="absolute -bottom-1 -right-1 bg-[#2563EB] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm border border-white">
                                              Lead
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <h4 className="font-black text-slate-900 text-[12px] truncate leading-tight mb-1">{cleanName}</h4>
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            {profile?.tier ? (
                                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate">
                                                {profile.tier}
                                              </span>
                                            ) : (
                                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded truncate">
                                                Investor
                                              </span>
                                            )}
                                            {profile?.score !== undefined && profile?.score !== null && (
                                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                                                {profile.score}/100
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                     </div>
                                   );
                                 })}

                                 {/* +N MORE BADGE */}
                                 {hiddenCount > 0 && (
                                   <div className="bg-slate-50 border border-slate-200 border-dashed rounded-[14px] p-3 flex flex-col items-center justify-center hover:bg-slate-100 transition-colors shadow-sm cursor-default">
                                     <span className="text-[14px] font-black text-slate-600">+{hiddenCount}</span>
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">More</span>
                                   </div>
                                 )}
                               </div>
                             );
                           })()}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: CORE TEAM */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-sm font-black text-slate-900 tracking-widest flex items-center gap-2 uppercase"><Users className="w-4 h-4 text-blue-600" /> CORE TEAM</h2>
                          <span className="text-xs font-bold text-slate-500"><span className="text-slate-800 font-black">{founders.length}</span> Team Members</span>
                        </div>

                        {founders.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {founders.map((founder, idx) => {
                                if (!founder) return null;
                                const cleanName = founder.name || 'Team Member';
                                const handle = founder.twitter_handle ? founder.twitter_handle.replace('@', '') : null;
                                
                                // 🚀 FIX 2: Restore actual twitter avatars with safe fallback!
                                const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=eff6ff&textColor=1e40af&bold=true`;
                                const avatarUrl = handle ? `https://unavatar.io/twitter/${handle}?fallback=false` : fallbackAvatar;
                                
                                return (
                                  <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-colors shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex flex-col">
                                     <div className="flex items-start gap-4 mb-4">
                                       <img 
                                         src={avatarUrl} 
                                         alt={cleanName} 
                                         onError={(e) => { e.target.onerror = null; e.target.src = fallbackAvatar; }} 
                                         className="w-14 h-14 rounded-full object-cover border border-slate-100 shrink-0 bg-slate-50" 
                                       />
                                       <div>
                                         <h3 className="text-base font-black text-slate-900 leading-tight">{cleanName}</h3>
                                         <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{founder.role || 'Core Team'}</p>
                                       </div>
                                     </div>
                                     <p className="text-xs font-medium text-slate-600 mb-5 leading-relaxed line-clamp-3 flex-grow">{founder.background || 'Team member background details are currently unavailable.'}</p>
                                     <div className="flex items-center gap-2 mt-auto">
                                       {handle && (
                                         <a href={`https://x.com/${handle}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"><Twitter size={14} /></a>
                                       )}
                                       {founder.linkedin_url && (
                                         <a href={founder.linkedin_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                                           <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                         </a>
                                       )}
                                       <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400"><Globe size={14} /></div>
                                     </div>
                                  </div>
                                );
                             })}
                          </div>
                        ) : (
                          <div className="flex-grow flex flex-col justify-center items-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                             <p className="text-sm font-bold text-slate-400">No core team data listed.</p>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-1 bg-[#F4F7FF] rounded-2xl border border-blue-100 p-6 lg:p-8 relative overflow-hidden flex flex-col">
                        <h2 className="text-sm font-black text-blue-600 tracking-widest flex items-center gap-2 uppercase mb-6 relative z-10">
                          <Star className="w-4 h-4 fill-blue-600" /> FUNDING INSIGHTS
                        </h2>
                        <ul className="space-y-4 relative z-10">
                          <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-600 text-white shrink-0" /><span className="text-xs font-bold text-slate-700 leading-relaxed">Raised {fundingVal} at {stage} stage</span></li>
                          <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-600 text-white shrink-0" /><span className="text-xs font-bold text-slate-700 leading-relaxed">Strong potential for community allocation</span></li>
                          <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-600 text-white shrink-0" /><span className="text-xs font-bold text-slate-700 leading-relaxed">{project?.lead_investors && project.lead_investors.trim() !== '' ? 'Top tier investors backing the project' : 'No public investors disclosed'}</span></li>
                          <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-600 text-white shrink-0" /><span className="text-xs font-bold text-slate-700 leading-relaxed">Track project updates for new funding info</span></li>
                        </ul>
                        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 pointer-events-none">
                          <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
                            <path fill="none" stroke="#2563eb" strokeWidth="4" d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,122.7C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96"></path>
                            <path fill="none" stroke="#3b82f6" strokeWidth="2" d="M0,192L48,202.7C96,213,192,235,288,218.7C384,203,480,149,576,128C672,107,768,117,864,138.7C960,160,1056,192,1152,192C1248,192,1344,160,1392,144L1440,128"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 4: DISCORD ROLES & ACTIVITIES */}
          {activeTab === 'discord' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {(() => {
                // Helpers for Discord tab
                const getContentPreview = (content, maxWords = 20) => {
                  if (!content) return '';
                  let cleaned = content.replace(/<@&?\d+>/g, '');
                  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
                  cleaned = cleaned.replace(/[*_~`]/g, '');
                  cleaned = cleaned.replace(/\s+/g, ' ').trim();
                  const words = cleaned.split(' ');
                  if (words.length > maxWords) {
                    return words.slice(0, maxWords).join(' ') + '...';
                  }
                  return cleaned;
                };

                const getHeadline = (act) => {
                  if (act.summary && act.summary.trim()) return act.summary.trim();
                  if (!act.content) return 'Discord Update';
                  const lines = act.content.split('\n').filter(l => l.trim() !== '');
                  let firstLine = lines[0].replace(/<@&?\d+>/g, '').trim();
                  return firstLine || 'Discord Update';
                };

                // Limit announcements to max 5
                const topActivities = discordActivities ? discordActivities.slice(0, 5) : [];

                return (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-10">
                      
                      {/* LEFT COLUMN: COMPACT DISCORD ROLES */}
                      <div className="bg-white rounded-[24px] border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.02)] p-7 lg:p-9 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h2 className="text-[18px] font-black text-[#0F172A] tracking-tight flex items-center gap-2">
                              Available Discord Roles
                            </h2>
                            <p className="text-[13px] text-slate-500 font-medium mt-1">Join the community and unlock exclusive roles.</p>
                          </div>
                          <span className="px-2.5 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-lg text-[11px] font-bold tracking-wide shrink-0">
                            {discordRoles.length} Roles
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          {discordRoles && discordRoles.length > 0 ? (
                            discordRoles.map((role, idx) => {
                              const styles = [
                                { icon: <ShieldCheck size={16}/>, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', badge: 'ESSENTIAL', badgeColor: 'bg-indigo-100 text-indigo-700' },
                                { icon: <MessageSquare size={16}/>, color: 'text-purple-600 bg-purple-50 border-purple-100', badge: 'COMMUNITY', badgeColor: 'bg-purple-100 text-purple-700' },
                                { icon: <Search size={16}/>, color: 'text-amber-600 bg-amber-50 border-amber-100', badge: 'HUNTER', badgeColor: 'bg-amber-100 text-amber-700' },
                                { icon: <Target size={16}/>, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100', badge: 'CREATOR', badgeColor: 'bg-fuchsia-100 text-fuchsia-700' },
                                { icon: <Star size={16}/>, color: 'text-yellow-600 bg-yellow-50 border-yellow-100', badge: 'LEGENDARY', badgeColor: 'bg-yellow-100 text-yellow-700' }
                              ];
                              const style = styles[idx % styles.length];
                              const diffColor = role.difficulty_level === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                role.difficulty_level === 'Hard' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                'bg-amber-50 text-amber-600 border-amber-200';
                              const diffDot = role.difficulty_level === 'Easy' ? 'bg-emerald-500' :
                                              role.difficulty_level === 'Hard' ? 'bg-rose-500' :
                                              'bg-amber-500';

                              return (
                                <div key={role.id || idx} className="bg-white border border-[#E5EAF2] hover:border-blue-300 rounded-[16px] p-3 flex items-center justify-between gap-4 transition-all shadow-[0_2px_8px_rgba(15,23,42,0.02)] group min-w-0">
                                   
                                   {/* Icon, Name & Type */}
                                   <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${style.color}`}>
                                         {style.icon}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                         <h4 className="text-[13px] font-black text-slate-900 truncate leading-tight">{role.role_name}</h4>
                                         <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 w-fit ${style.badgeColor}`}>
                                           {style.badge}
                                         </span>
                                      </div>
                                   </div>

                                   {/* Difficulty Badge */}
                                   <div className="flex items-center shrink-0">
                                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${diffColor}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${diffDot}`}></div>
                                        {role.difficulty_level || 'Easy'}
                                      </span>
                                   </div>
                                </div>
                              );
                            })
                          ) : (
                             <div className="flex-1 flex flex-col justify-center items-center py-12 border border-dashed border-slate-200 rounded-[20px] bg-slate-50/50">
                                <ShieldCheck className="w-10 h-10 text-slate-300 mb-3" />
                                <p className="text-sm font-bold text-slate-500">No roles mapped yet.</p>
                             </div>
                          )}
                        </div>
                        
                        <button className="w-full mt-5 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[12px] font-bold rounded-[14px] flex items-center justify-center gap-2 transition-colors border border-slate-200 shadow-sm">
                           <ListChecks size={14} /> View Full Role Guide <span className="text-sm leading-none">&#8594;</span>
                        </button>
                      </div>

                      {/* RIGHT COLUMN: AUTO-SLIDING ANNOUNCEMENTS */}
                      <div className="bg-white rounded-[24px] border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.02)] p-7 lg:p-9 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h2 className="text-[18px] font-black text-[#0F172A] tracking-tight flex items-center gap-2">
                              Recent Announcements
                            </h2>
                            <p className="text-[13px] text-slate-500 font-medium mt-1">Latest updates from the official Discord server.</p>
                          </div>
                          <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors shrink-0">
                            View All <span className="text-lg leading-none">&#8594;</span>
                          </button>
                        </div>

                        <div className="flex-1 relative overflow-hidden h-[360px]">
                          {topActivities && topActivities.length > 0 ? (
                            <div 
                              className="relative border-l border-slate-200 ml-4 space-y-8 pb-4 h-full overflow-y-auto custom-scrollbar pr-4 snap-y"
                              style={{ scrollBehavior: 'smooth' }}
                              ref={(el) => {
                                if (!el) return;
                                // Clear old interval safely to prevent duplicates
                                if (el.dataset.intervalId) clearInterval(Number(el.dataset.intervalId));
                                
                                const id = setInterval(() => {
                                  if (el.dataset.paused === 'true') return;
                                  const maxScroll = el.scrollHeight - el.clientHeight;
                                  if (maxScroll <= 0) return; // No scroll needed

                                  if (el.scrollTop >= maxScroll - 5) {
                                    el.scrollTo({ top: 0, behavior: 'smooth' });
                                  } else {
                                    // Slide down 100px (~1 announcement) every 1500ms
                                    el.scrollBy({ top: 100, behavior: 'smooth' });
                                  }
                                }, 1500);
                                el.dataset.intervalId = id;
                              }}
                              onMouseEnter={(e) => e.currentTarget.dataset.paused = 'true'}
                              onMouseLeave={(e) => e.currentTarget.dataset.paused = 'false'}
                              onTouchStart={(e) => e.currentTarget.dataset.paused = 'true'}
                              onTouchEnd={(e) => e.currentTarget.dataset.paused = 'false'}
                            >
                               {topActivities.map((act, idx) => {
                                  const type = (act.update_type || 'Announcement').toUpperCase();
                                  let badgeColor = 'bg-purple-100 text-purple-700';
                                  let dotColor = 'border-purple-500';
                                  if (type.includes('UPDATE')) { badgeColor = 'bg-blue-100 text-blue-700'; dotColor = 'border-blue-500'; }
                                  if (type.includes('TASK')) { badgeColor = 'bg-emerald-100 text-emerald-700'; dotColor = 'border-emerald-500'; }
                                  if (type.includes('EVENT')) { badgeColor = 'bg-amber-100 text-amber-700'; dotColor = 'border-amber-500'; }

                                  const formattedDate = new Date(act.date_posted).toLocaleString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                                  });

                                  const title = getHeadline(act);
                                  const preview = getContentPreview(act.content);

                                  return (
                                     <div key={act.id || idx} className="relative pl-7 group snap-start">
                                       <div className={`absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full bg-white border-[2.5px] shadow-sm ${dotColor}`}></div>
                                       
                                       <div className="flex flex-col mb-2">
                                         <div className="flex items-center gap-3 mb-2">
                                           <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black tracking-widest ${badgeColor}`}>
                                             {type}
                                           </span>
                                           <span className="text-[10px] font-bold text-slate-400">
                                             {formattedDate}
                                           </span>
                                         </div>
                                         <h4 className="text-[14px] font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                                           {title}
                                         </h4>
                                       </div>
                                       
                                       {preview && (
                                         <p className="text-[12px] text-slate-500 font-medium leading-relaxed mb-2.5">
                                           {preview}
                                         </p>
                                       )}
                                       
                                       {act.source_link && (
                                         <a href={act.source_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2563EB] hover:text-blue-800 transition-colors">
                                           View Original <ExternalLink size={10} className="mb-[1px]"/>
                                         </a>
                                       )}
                                     </div>
                                  );
                               })}
                            </div>
                          ) : (
                             <div className="flex-1 flex flex-col justify-center items-center h-full border border-dashed border-slate-200 rounded-[20px] bg-slate-50/50">
                                <Bell className="w-10 h-10 text-slate-300 mb-3" />
                                <p className="text-sm font-bold text-slate-500">No announcements yet.</p>
                             </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* FOOTER METADATA */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-bold text-slate-400 mt-4 px-2 pb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <ShieldAlert size={10} className="text-blue-500" />
                        </div>
                        Roles and announcements are updated in real-time from the official Discord server.
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Activity size={12} /> Last synced: {new Date().toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'})}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 5: TOKENOMICS */}
          {activeTab === 'tokenomics' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {(() => {
                let tokenData = {};
                try {
                  tokenData = typeof project?.tokenomics_details === 'string' 
                    ? JSON.parse(project.tokenomics_details || '{}') 
                    : (project?.tokenomics_details || {});
                } catch (e) { console.error("Tokenomics Parse Error", e); }

                // Check if real data exists in the database
                const hasData = tokenData && Object.keys(tokenData).length > 0 && tokenData.ticker && tokenData.ticker !== 'TOKEN';

                // Safe parsed values (No more hardcoded XEFF/6B)
                const totalRaw = parseInt(tokenData.total_supply) || 0;
                const ticker = tokenData.ticker || 'TBA';
                const tokenName = project?.name || 'TBA';
                const tgeDate = tokenData.tge_date || 'Unconfirmed';
                
                const cp = parseFloat(tokenData.community_allocation_percentage) || 0;
                const ip = parseFloat(tokenData.investor_allocation_percentage) || 0;
                const tp = parseFloat(tokenData.team_allocation_percentage) || 0;
                const ep = parseFloat(tokenData.ecosystem_allocation_percentage) || 0;

                const calcAbs = (pct) => totalRaw > 0 ? ((totalRaw * pct) / 100).toLocaleString() : 'TBA';

                const formatTotal = (num) => {
                  if (!num || num === 0) return 'TBA';
                  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
                  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
                  return num.toLocaleString();
                };

                // Render the empty state if there is no tokenomics data yet
                if (!hasData) {
                  return (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Coins className="w-8 h-8 text-slate-300" />
                      </div>
                      <h2 className="text-xl font-black text-slate-800 mb-2">Tokenomics TBA</h2>
                      <p className="text-sm font-medium text-slate-500 max-w-sm">The token architecture for {project?.name || 'this project'} has not been publicly released or generated yet.</p>
                    </div>
                  );
                }

                // Render the full tokenomics UI if data exists
                return (
                  <>
                    <div className="flex flex-col xl:flex-row gap-6">
                      
                      {/* TOP LEFT: TOKEN DISTRIBUTION (CHART & LEGEND) */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 xl:w-[55%] flex flex-col">
                        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-8">
                          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                          Token Distribution
                        </h3>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 flex-grow">
                          
                          {/* SVG Donut Chart */}
                          <div className="relative w-52 h-52 shrink-0">
                            <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 drop-shadow-sm">
                              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="9"></circle>
                              {cp > 0 && <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" strokeWidth="9" strokeDasharray={`${cp} ${100 - cp}`} strokeDashoffset={0}></circle>}
                              {ip > 0 && <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="9" strokeDasharray={`${ip} ${100 - ip}`} strokeDashoffset={100 - cp}></circle>}
                              {tp > 0 && <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" strokeWidth="9" strokeDasharray={`${tp} ${100 - tp}`} strokeDashoffset={100 - (cp + ip)}></circle>}
                              {ep > 0 && <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#a855f7" strokeWidth="9" strokeDasharray={`${ep} ${100 - ep}`} strokeDashoffset={100 - (cp + ip + tp)}></circle>}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[10px] font-bold text-slate-400 mb-0.5">Total Supply</span>
                              <span className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{formatTotal(totalRaw)}</span>
                              <span className="text-xs font-bold text-slate-500 mt-0.5">{ticker}</span>
                            </div>
                            
                            {/* Overlay Percentages */}
                            <div className="absolute inset-0 pointer-events-none">
                               {cp > 0 && <span className="absolute top-[22%] right-[12%] text-[10px] font-black text-white">{cp}%</span>}
                               {ip > 0 && <span className="absolute bottom-[10%] left-[45%] text-[10px] font-black text-white">{ip}%</span>}
                               {tp > 0 && <span className="absolute top-[48%] left-[8%] text-[10px] font-black text-white">{tp}%</span>}
                               {ep > 0 && <span className="absolute top-[18%] left-[22%] text-[10px] font-black text-white">{ep}%</span>}
                            </div>
                          </div>

                          {/* Legend / Stats */}
                          <div className="flex-1 w-full space-y-4">
                            <div className="flex items-center justify-between text-[13px] font-bold text-slate-600 border-b border-slate-50 pb-2">
                              <div className="flex items-center gap-2.5 w-48"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Community & Airdrop</div>
                              <div className="w-12 text-slate-900 text-right">{cp}%</div>
                              <div className="w-28 text-right text-slate-500">{calcAbs(cp)}</div>
                            </div>
                            <div className="flex items-center justify-between text-[13px] font-bold text-slate-600 border-b border-slate-50 pb-2">
                              <div className="flex items-center gap-2.5 w-48"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Investors & Backers</div>
                              <div className="w-12 text-slate-900 text-right">{ip}%</div>
                              <div className="w-28 text-right text-slate-500">{calcAbs(ip)}</div>
                            </div>
                            <div className="flex items-center justify-between text-[13px] font-bold text-slate-600 border-b border-slate-50 pb-2">
                              <div className="flex items-center gap-2.5 w-48"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Core Team</div>
                              <div className="w-12 text-slate-900 text-right">{tp}%</div>
                              <div className="w-28 text-right text-slate-500">{calcAbs(tp)}</div>
                            </div>
                            <div className="flex items-center justify-between text-[13px] font-bold text-slate-600 pb-2">
                              <div className="flex items-center gap-2.5 w-48"><div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div> Ecosystem & Treasury</div>
                              <div className="w-12 text-slate-900 text-right">{ep}%</div>
                              <div className="w-28 text-right text-slate-500">{calcAbs(ep)}</div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* TOP RIGHT: METADATA GRID */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 xl:w-[45%] flex flex-col justify-center">
                        <div className="flex flex-col gap-8">
                          
                          {/* Row 1 */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-slate-100">
                            <div>
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Token Name</span>
                              <span className="text-sm font-bold text-slate-900">{tokenName}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Token Symbol</span>
                              <span className="text-sm font-black text-slate-900">{ticker}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Supply</span>
                              <span className="text-sm font-black text-slate-900">{totalRaw > 0 ? totalRaw.toLocaleString() : 'TBA'}</span>
                            </div>
                            <div className="md:text-right">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">TGE Date</span>
                              <span className="inline-block px-3 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded-lg">{tgeDate}</span>
                            </div>
                          </div>

                          {/* Row 2 */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Token Type</span>
                              <span className="text-sm font-bold text-slate-900 leading-tight">Utility & Governance</span>
                            </div>
                            <div>
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Network</span>
                              <span className="text-sm font-bold text-slate-900">TBA</span>
                            </div>
                            <div>
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">FDV (At TGE)</span>
                              <span className="text-sm font-bold text-slate-900">--</span>
                            </div>
                            <div className="md:text-right">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Initial Circ. Supply</span>
                              <span className="text-sm font-bold text-slate-900">--</span>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col xl:flex-row gap-6 mt-6">
                      
                      {/* BOTTOM LEFT: VESTING SCHEDULE TABLE */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 xl:w-[65%] overflow-x-auto">
                        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-6">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          Vesting Schedule
                        </h3>
                        
                        <table className="w-full text-left min-w-[500px]">
                          <thead>
                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                              <th className="pb-4">Allocation</th>
                              <th className="pb-4">Cliff</th>
                              <th className="pb-4">Vesting Duration</th>
                              <th className="pb-4">Vesting Type</th>
                            </tr>
                          </thead>
                          <tbody className="text-[13px] font-bold text-slate-600 divide-y divide-slate-50">
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Community & Airdrop</td>
                              <td className="py-4">No Cliff</td>
                              <td className="py-4">--</td>
                              <td className="py-4">Full Unlock</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Investors & Backers</td>
                              <td className="py-4">6 months</td>
                              <td className="py-4">24 months</td>
                              <td className="py-4">Linear</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Core Team</td>
                              <td className="py-4">12 months</td>
                              <td className="py-4">36 months</td>
                              <td className="py-4">Linear</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div> Ecosystem & Treasury</td>
                              <td className="py-4">No Cliff</td>
                              <td className="py-4">48 months</td>
                              <td className="py-4">Linear</td>
                            </tr>
                          </tbody>
                        </table>
                        
                        {tokenData.vesting_notes && (
                          <div className="mt-4 pt-4 border-t border-slate-50">
                            <span className="text-xs text-slate-500 font-medium whitespace-pre-wrap">{tokenData.vesting_notes}</span>
                          </div>
                        )}
                      </div>

                      {/* BOTTOM RIGHT: ALLOCATION INSIGHTS */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 xl:w-[35%] flex flex-col">
                        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-6">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                          Allocation Insights
                        </h3>
                        
                        <ul className="space-y-6 relative z-10 flex-grow">
                          <li className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                              <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-[13px] font-medium text-slate-600 leading-relaxed pt-1">Community allocation is fair and aligned with long term network growth.</span>
                          </li>
                          <li className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                              <Activity className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="text-[13px] font-medium text-slate-600 leading-relaxed pt-1">Investor share is relatively high. Monitor unlock schedule closely.</span>
                          </li>
                          <li className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                              <ListChecks className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="text-[13px] font-medium text-slate-600 leading-relaxed pt-1">Team tokens have 12-month cliff which is standard and healthy.</span>
                          </li>
                        </ul>

                        <div className="mt-8 pt-4 border-t border-slate-100 flex items-start gap-2 text-slate-400">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="text-[10px] font-medium leading-relaxed">Data is for informational purposes only. Not financial advice.</span>
                        </div>
                      </div>

                    </div>
                  </>
                );
              })()}
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
}