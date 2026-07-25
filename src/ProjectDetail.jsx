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

  const getProjectScore = (p, taskCount = 0) => {
    if (!p) return 0;
    const social = p.social_score || 0;
    const fundingVal = parseFloat(p.funding?.replace(/[^0-9.]/g, '') || 0);
    const fundingScore = Math.min(fundingVal / 20, 1) * 100;
    let tierScore = 30;
    if (p.tier?.includes('1')) tierScore = 100;
    else if (p.tier?.includes('2')) tierScore = 70;
    const finalTaskCount = taskCount || p.task_count || 0;
    const taskScore = Math.min(finalTaskCount * 10, 100);
    return Math.round(social * 0.4 + fundingScore * 0.3 + tierScore * 0.2 + taskScore * 0.1);
  };

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
        const scoredProjects = allProjects.map(p => ({
          ...p, calculatedScore: getProjectScore(p)
        })).sort((a, b) => b.calculatedScore - a.calculatedScore);
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

  const calculateMasterScore = () => getProjectScore(project, tasks.length);

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
        score={getProjectScore(project, tasks?.length)}
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
        
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Airdrops
        </Link>

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
                  <span className="font-black text-slate-900">{project.social_score || 'N/A'}</span>
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
          <button 
            onClick={() => setActiveTab('research')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'research' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Cpu size={16} /> AI Research
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

          {/* TAB 2: OVERVIEW (Premium UI Update) */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {(() => {
                let aiData = {};
                let compData = { project_similarity: "", competitors: [] };
                
                try { aiData = typeof project?.ai_research_data === 'string' ? JSON.parse(project.ai_research_data || '{}') : (project?.ai_research_data || {}); } catch(e) {}
                try { compData = typeof project?.competitor_analysis === 'string' ? JSON.parse(project.competitor_analysis || '{"competitors":[]}') : (project?.competitor_analysis || {competitors:[]}); } catch(e) {}

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

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 relative">
                       <div className="flex justify-between items-center mb-6">
                         <h2 className="text-sm font-black text-slate-900 tracking-widest flex items-center gap-2 uppercase">
                           <Users className="w-4 h-4 text-slate-400" /> Top Competitors
                         </h2>
                         <button className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors">
                           View Full Comparison <span className="text-lg leading-none">&#8594;</span>
                         </button>
                       </div>

                       <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
                         {compData.competitors && compData.competitors.length > 0 ? (
                           compData.competitors.map((comp, idx) => {
                              let cleanDomain = comp.domain || null;
                              if (!cleanDomain && comp.logo_url && comp.logo_url.includes('clearbit.com/')) { cleanDomain = comp.logo_url.split('clearbit.com/')[1]; }
                              const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${comp.name}&backgroundColor=f8fafc&textColor=0f172a`;
                              const logoUrl = cleanDomain ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128` : fallbackLogo;
                              let validXUrl = comp.x_url && comp.x_url.trim() !== '' ? comp.x_url.trim() : null;
                              if (validXUrl && !validXUrl.startsWith('http')) validXUrl = `https://${validXUrl}`;
                              const potScore = comp.average_airdrop_usd > 1000 ? 4 : comp.average_airdrop_usd > 0 ? 3 : 2;
                              const potLabel = potScore === 4 ? 'Very High' : potScore === 3 ? 'High' : 'Medium';
                              const strScore = comp.followers?.includes('M') ? 5 : comp.followers?.includes('00K') ? 4 : 3;
                              const strLabel = strScore >= 4 ? 'Very Strong' : 'Strong';

                              return (
                                <div key={idx} className="min-w-[280px] w-[280px] bg-white border border-slate-200 rounded-2xl shrink-0 snap-start relative flex flex-col hover:border-slate-300 transition-colors">
                                   <div className="absolute top-0 left-0 w-7 h-7 bg-blue-600 text-white flex items-center justify-center text-[11px] font-black rounded-tl-2xl rounded-br-xl z-10 shadow-sm">{idx + 1}</div>
                                   <div className="p-6 flex-grow">
                                     <div className="flex items-center gap-4 mb-6 pl-4">
                                       <img src={logoUrl} alt={comp.name} onError={(e) => { e.target.onerror = null; e.target.src = fallbackLogo; }} className="w-12 h-12 rounded-full object-cover border border-slate-100 bg-black shrink-0 shadow-sm" />
                                       <div className="min-w-0">
                                         <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5 truncate">
                                           {comp.name} {validXUrl && <a href={validXUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-3 h-3 text-slate-300 hover:text-blue-500" /></a>}
                                         </h3>
                                         <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{comp.past_airdrops?.length > 0 ? comp.past_airdrops[0] : 'No historical data.'}</p>
                                       </div>
                                     </div>
                                     <div className="grid grid-cols-2 gap-4 mb-6">
                                       <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Payout</p><p className="font-black text-slate-900 text-sm">${comp.average_airdrop_usd || '0'}</p></div>
                                       <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Network</p><p className="font-black text-slate-900 text-sm flex items-center gap-1.5"><Twitter className="w-3 h-3 text-slate-300" /> {comp.followers || 'TBA'}</p></div>
                                     </div>
                                     <hr className="border-slate-100 mb-5" />
                                     <div className="space-y-4">
                                       <div>
                                         <div className="flex justify-between items-center mb-2"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Airdrop Potential</span><span className="text-[10px] font-bold text-slate-800">{potLabel}</span></div>
                                         <div className="flex gap-1.5">{[1,2,3,4,5].map(i => (<div key={i} className={`h-1.5 flex-1 rounded-full ${i <= potScore ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>))}</div>
                                       </div>
                                       <div>
                                         <div className="flex justify-between items-center mb-2"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Project Strength</span><span className="text-[10px] font-bold text-slate-800">{strLabel}</span></div>
                                         <div className="flex gap-1.5">{[1,2,3,4,5].map(i => (<div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strScore ? 'bg-blue-600' : 'bg-slate-100'}`}></div>))}</div>
                                       </div>
                                     </div>
                                   </div>
                                </div>
                              );
                           })
                         ) : (
                           <div className="w-full py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                             <p className="text-sm font-bold text-slate-400 mb-1">No competitive analysis available</p>
                             <p className="text-xs font-medium text-slate-400">Add competitors in the database to view them here.</p>
                           </div>
                         )}
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
                
                // 🚀 FIX 1: Safely guarantee founders is ALWAYS an array to prevent .map() crashes
                let founders = [];
                try { 
                  const parsed = typeof project?.founders_details === 'string' ? JSON.parse(project.founders_details || '[]') : (project?.founders_details || []); 
                  founders = Array.isArray(parsed) ? parsed : [];
                } catch (e) {}

                const fundingVal = project?.funding ? formatFunding(project.funding) : 'Undisclosed';
                const confScore = aiData.final_verdict?.confidence_score || getProjectScore(project, tasks.length) || 82;
                const confLabel = confScore > 75 ? 'High' : confScore > 50 ? 'Medium' : 'Low';
                const stage = project?.tier || 'Seed / Strategic';

                return (
                  <>
                    {/* SECTION 1: TOP METRICS */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 overflow-hidden">
                      <div className="p-6 lg:p-8 lg:w-[30%]">
                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mb-4"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> FUNDING OVERVIEW</h3>
                        <div className="text-4xl font-black text-slate-900 tracking-tight mb-2">{fundingVal}</div>
                        <div className="text-sm font-medium text-slate-600 mb-4">Total capital raised</div>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed pr-4">Strong backing indicates higher probability for airdrop allocations.</p>
                      </div>

                      <div className="p-6 lg:p-8 lg:w-[25%]">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">FUNDING STAGE</h3>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold mb-6"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {stage}</span>
                        <div className="flex justify-between gap-4">
                          <div><span className="block text-[10px] font-bold text-slate-400 mb-1">Announced</span><span className="text-xs font-bold text-slate-900">May 2024</span></div>
                          <div><span className="block text-[10px] font-bold text-slate-400 mb-1">Last Updated</span><span className="text-xs font-bold text-slate-900">{new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</span></div>
                        </div>
                      </div>

                      <div className="p-6 lg:p-8 lg:w-[20%]">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">FUNDING TIMELINE</h3>
                        <div className="border-l-2 border-slate-100 pl-4 relative h-full min-h-[80px]">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full border-2 border-emerald-500 bg-white"></div>
                          <span className="text-xs font-bold text-slate-500 mb-1 block">May 2024</span>
                          <div className="text-sm font-bold text-slate-900 mb-6">{stage}</div>
                          <div className="absolute right-0 bottom-0 text-right">
                            <div className="text-sm font-black text-slate-900">{fundingVal}</div>
                            <div className="text-[10px] font-bold text-slate-400">Undisclosed</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 lg:p-6 lg:w-[25%] bg-slate-50/30 flex flex-col justify-center">
                        <div className="bg-white border border-slate-100 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-5 w-full">
                          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">FUNDING CONFIDENCE</h3>
                          <div className="flex items-center gap-3 mb-5">
                            <ShieldCheck className="w-7 h-7 text-emerald-500" />
                            <span className="text-3xl font-black text-emerald-500 tracking-tight">{confLabel}</span>
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width: `${confScore}%`}}></div></div>
                            <span className="text-xs font-black text-slate-700">{confScore} <span className="text-slate-400 font-bold">/ 100</span></span>
                          </div>
                          <p className="text-[10px] font-medium text-slate-500 mt-2">Based on tier, amount & project activity</p>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: LEAD INVESTORS */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-black text-slate-900 tracking-widest flex items-center gap-2 uppercase">
                          <Users className="w-4 h-4 text-blue-600" /> LEAD INVESTORS & BACKERS
                        </h2>
                        <button className="px-4 py-1.5 bg-blue-50/50 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm">View All Investors</button>
                      </div>
                      
                      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                        {project?.lead_investors && project.lead_investors.trim() !== '' ? (
                           project.lead_investors.split(',').map((inv, idx) => {
                             const name = inv.trim();
                             const logo = investorLogos[name];
                             const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f8fafc&textColor=0f172a&bold=true`;
                             const finalLogo = logo || fallbackLogo;
                             return (
                               <div key={idx} className="min-w-[104px] w-[104px] h-[104px] bg-slate-50/80 border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2.5 hover:border-blue-200 transition-colors shrink-0 p-2">
                                 <img src={finalLogo} alt={name} onError={(e)=>{e.target.onerror=null; e.target.src=fallbackLogo}} className="w-10 h-10 rounded-full object-cover bg-white shadow-sm border border-slate-200" />
                                 <span className="text-[10px] font-bold text-slate-700 text-center truncate w-full px-1">{name}</span>
                               </div>
                             )
                           })
                        ) : (
                           <>
                             <div className="min-w-[240px] bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shrink-0">
                               <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0"></div>
                               <div>
                                 <p className="text-xs font-bold text-slate-700">No public investors listed yet</p>
                                 <p className="text-[10px] font-medium text-slate-500 mt-0.5 pr-2">We'll update as soon as data is available.</p>
                               </div>
                             </div>
                             {[1,2,3,4,5,6].map(i => (
                                <div key={i} className="min-w-[104px] w-[104px] h-[104px] bg-slate-50/30 border border-slate-100/50 rounded-2xl flex items-center justify-center shrink-0">
                                  <div className="w-10 h-10 bg-slate-200 rounded-full opacity-30"></div>
                                </div>
                             ))}
                           </>
                        )}
                      </div>
                    </div>

                    {/* SECTION 3: CORE TEAM & FUNDING INSIGHTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: AVAILABLE DISCORD ROLES */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-black text-slate-900 tracking-widest flex items-center gap-2 uppercase">
                      <MessageSquare className="w-4 h-4 text-purple-600" /> Available Discord Roles
                    </h2>
                    <span className="px-3 py-1 bg-purple-50 border border-purple-100 text-purple-600 rounded-lg text-xs font-bold tracking-wide">
                      {discordRoles.length} Roles
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-4 pb-3 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="col-span-5 md:col-span-4">Role</div>
                    <div className="col-span-7 md:col-span-4 hidden md:block">Requirements</div>
                    <div className="col-span-4 md:col-span-2 hidden md:block">Reward / Perk</div>
                    <div className="col-span-7 md:col-span-2 text-right">Difficulty</div>
                  </div>

                  {discordRoles && discordRoles.length > 0 ? (
                    <div className="flex-1 flex flex-col">
                      {discordRoles.map((role, idx) => {
                        // Assigning different icons/colors based on index to mimic the design
                        const styles = [
                          { icon: <ShieldCheck size={16}/>, color: 'text-indigo-600 bg-indigo-50', badge: 'ESSENTIAL' },
                          { icon: <MessageSquare size={16}/>, color: 'text-blue-600 bg-blue-50', badge: 'COMMUNITY' },
                          { icon: <Search size={16}/>, color: 'text-amber-600 bg-amber-50', badge: 'HUNTER' },
                          { icon: <Target size={16}/>, color: 'text-purple-600 bg-purple-50', badge: 'CREATOR' },
                          { icon: <Star size={16}/>, color: 'text-yellow-600 bg-yellow-50', badge: 'LEGENDARY' }
                        ];
                        const style = styles[idx % styles.length];

                        return (
                          <div key={role.id || idx} className="grid grid-cols-12 gap-4 py-4 border-b border-slate-50 items-center">
                            
                            <div className="col-span-7 md:col-span-4 flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.color}`}>
                                {style.icon}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 leading-tight">{role.role_name}</h4>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${style.color}`}>
                                  {style.badge}
                                </span>
                              </div>
                            </div>
                            
                            <div className="col-span-12 md:col-span-4 mt-2 md:mt-0 order-last md:order-none">
                              <ul className="text-xs font-medium text-slate-600 space-y-1 list-disc pl-4 marker:text-slate-300">
                                {(role.requirements || '').split('\n').filter(r => r.trim() !== '').map((req, i) => (
                                  <li key={i} className="leading-snug">{req.replace(/^[•-]\s*/, '')}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="col-span-12 md:col-span-2 text-xs font-medium text-slate-600 mt-2 md:mt-0 order-last md:order-none hidden md:block">
                              {role.perks}
                            </div>
                            
                            <div className="col-span-5 md:col-span-2 flex justify-end items-start md:items-center">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                                role.difficulty_level === 'Easy' ? 'bg-emerald-50 text-emerald-600' :
                                role.difficulty_level === 'Hard' ? 'bg-rose-50 text-rose-600' :
                                'bg-amber-50 text-amber-600'
                              }`}>
                                {role.difficulty_level || 'Medium'}
                              </span>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center py-10 opacity-60">
                      <ShieldCheck className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-500">No roles mapped yet.</p>
                    </div>
                  )}

                  <button className="w-full mt-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200">
                    <ListChecks size={14} /> View Role Guide
                  </button>
                </div>

                {/* RIGHT COLUMN: RECENT ANNOUNCEMENTS TIMELINE */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-black text-slate-900 tracking-widest flex items-center gap-2 uppercase">
                      <Bell className="w-4 h-4 text-indigo-600" /> Recent Announcements
                    </h2>
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors">
                      View All <span className="text-lg leading-none">&#8594;</span>
                    </button>
                  </div>

                  {discordActivities && discordActivities.length > 0 ? (
                    <div className="relative border-l-2 border-slate-100 ml-2 space-y-6 pb-2">
                      {discordActivities.map((act, idx) => {
                        
                        // Parse update type to match screenshot colors
                        const type = (act.update_type || 'Announcement').toLowerCase();
                        let badgeColor = 'bg-purple-50 text-purple-600';
                        let dotColor = 'border-purple-500';
                        if (type.includes('update')) { badgeColor = 'bg-blue-50 text-blue-600'; dotColor = 'border-blue-500'; }
                        if (type.includes('task')) { badgeColor = 'bg-emerald-50 text-emerald-600'; dotColor = 'border-emerald-500'; }
                        if (type.includes('event')) { badgeColor = 'bg-amber-50 text-amber-600'; dotColor = 'border-amber-500'; }

                        // Parse content to extract a bold title (first line) and description (rest)
                        const lines = act.content?.split('\n').filter(l => l.trim() !== '') || [];
                        const title = lines[0] || 'Discord Update';
                        const description = lines.slice(1).join(' ') || '';

                        const formattedDate = new Date(act.date_posted).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                        });

                        return (
                          <div key={act.id || idx} className="relative pl-6">
                            <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-[3.5px] shadow-sm ${dotColor}`}></div>
                            
                            <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-2 gap-2">
                              <span className={`w-fit px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${badgeColor}`}>
                                {act.update_type || 'Announcement'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                {formattedDate}
                              </span>
                            </div>

                            <h4 className="text-sm font-black text-slate-900 mb-1 leading-snug pr-4">
                              {title}
                            </h4>
                            
                            {description && (
                              <p className="text-[13px] font-medium text-slate-500 leading-relaxed pr-2">
                                {description}
                              </p>
                            )}

                            {act.source_link && (
                              <a href={act.source_link} target="_blank" rel="noopener noreferrer" className="inline-flex mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                View Original &#8594;
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center py-10 opacity-60">
                      <Bell className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-500">No announcements yet.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* FOOTER METADATA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-bold text-slate-400 mt-2 px-2 pb-6">
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

          {/* TAB 6: AI RESEARCH */}
          {activeTab === 'research' && (
            <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                  <BrainCircuit className="text-white w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Intelligence Report</h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Automated synthesis of on-chain & social data</p>
                </div>
              </div>

              {(() => {
                let aiData = null;
                try {
                  aiData = typeof project.ai_research_data === 'string' ? JSON.parse(project.ai_research_data) : project.ai_research_data;
                } catch (e) { return <div className="text-sm text-slate-500 italic p-8 text-center border border-dashed rounded-xl border-slate-300">Analysis data unavailable.</div>; }
                
                if (!aiData) return <div className="text-sm text-slate-500 italic p-8 text-center border border-dashed rounded-xl border-slate-300">Analysis data unavailable.</div>;

                return (
                  <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] p-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-5">
                        <Gavel className="w-3.5 h-3.5" /> Final Verdict
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-8 flex flex-col justify-center">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recommended Action</div>
                          <div className="text-lg font-black text-slate-900 mb-4">{aiData.final_verdict?.recommended_action}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Execution Strategy</div>
                          <div className="text-sm text-slate-600 font-medium leading-relaxed">{aiData.final_verdict?.strategy}</div>
                        </div>
                        
                        <div className="md:col-span-4 flex flex-col justify-center gap-5 border-l border-slate-100 pl-0 md:pl-8">
                          <div>
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence Score</span>
                              <span className="text-lg font-black text-indigo-600 leading-none">{aiData.final_verdict?.confidence_score}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${aiData.final_verdict?.confidence_score || 0}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Airdrop Probability</div>
                            <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-xs font-bold shadow-sm">
                              {aiData.final_verdict?.airdrop_probability}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] p-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                          <LayoutTemplate className="w-3.5 h-3.5" /> Project Overview
                        </h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-5">
                          {aiData.project_overview?.summary}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aiData.project_overview?.category && <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold">{aiData.project_overview.category}</span>}
                          {aiData.project_overview?.stage && <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold">{aiData.project_overview.stage}</span>}
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] p-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                          <ShieldCheck className="w-3.5 h-3.5" /> Credibility Analysis
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Funding & Backers</span>
                            <span className="text-sm font-semibold text-slate-800">{aiData.credibility_analysis?.funding?.amount || 'Undisclosed'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Backing Signals</span>
                            <ul className="space-y-2">
                              {aiData.credibility_analysis?.backing_signals?.map((sig, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {sig}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] p-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                          <Rocket className="w-3.5 h-3.5" /> Opportunity Analysis
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-5">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost</span>
                            <span className="text-sm font-bold text-slate-800">{aiData.opportunity_analysis?.cost}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Required</span>
                            <span className="text-sm font-bold text-slate-800">{aiData.opportunity_analysis?.time_required}</span>
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Competition Level</span>
                          <span className="text-sm font-medium text-slate-600">{aiData.opportunity_analysis?.competition_level}</span>
                        </div>
                      </div>

                      <div className="bg-rose-50/30 rounded-2xl border border-rose-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] p-6">
                        <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                          <AlertTriangle className="w-3.5 h-3.5" /> Risk Analysis
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <span className="block text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Red Flags</span>
                            <ul className="space-y-2">
                              {aiData.risk_analysis?.red_flags?.map((flag, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-rose-700 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" /> {flag}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Downside</span>
                            <p className="text-xs text-rose-700/80 font-medium leading-relaxed">{aiData.risk_analysis?.downside}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}