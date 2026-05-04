import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Ensure this matches your path
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { usePrivy } from '@privy-io/react-auth';
import remarkGfm from 'remark-gfm';
import ResearchInsights from './ResearchInsights';

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
import { 
  ArrowLeft, Twitter, Globe, MessageSquare, 
  Flame, Copy, CheckCircle2, Clock, Check, 
  Share2, Download, ExternalLink, Zap, ShieldAlert, Star,
  DollarSign, Target, Layout, Search, Bell, Settings, ListChecks, LayoutTemplate, Cpu,
  BrainCircuit, Gavel, ShieldCheck, Activity, Rocket, AlertTriangle, TrendingUp
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]); 
  const [activeTask, setActiveTask] = useState(null); 
  const [topProjects, setTopProjects] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false); 
  const { user, authenticated, login } = usePrivy();
  const [isImporting, setIsImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [investorLogos, setInvestorLogos] = useState({});
  const [hasImported, setHasImported] = useState(false);
  const [toast, setToast] = useState(null);
  
  // 🚀 NEW STATE: Dashboard Tabs
  const [activeTab, setActiveTab] = useState('step-by-step');

  const captureRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500); 
  };

  // 🚀 NEW: Utility Parser for AI Research Data
  const safeParseAI = (data) => {
    if (!data) return null;
    
    try {
      // If it's already an object (Supabase JSONB), return as is
      if (typeof data === 'object') return data;
      
      // Try direct JSON parse first
      return JSON.parse(data);
    } catch (error) {
      // If direct parse fails, try to extract JSON block
      try {
        const jsonMatch = data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (extractError) {
        // If extraction fails, return null
        return null;
      }
      return null;
    }
  };

  // 🚀 NEW: ResearchInsights Component
  const ResearchInsights = ({ data }) => {
    if (!data) return null;

    const getBadgeColor = (level) => {
      switch (level?.toLowerCase()) {
        case 'high': return 'bg-emerald-50 text-emerald-700';
        case 'medium': return 'bg-blue-50 text-blue-700';
        case 'low': return 'bg-slate-100 text-slate-700';
        default: return 'bg-slate-50 text-slate-600';
      }
    };

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        {/* Summary */}
        {data.summary && (
          <div>
            <h4 className="text-sm font-black text-slate-900 mb-2">Summary</h4>
            <p className="text-sm text-slate-600">{data.summary}</p>
          </div>
        )}

        {/* Airdrop Probability */}
        {data.airdrop_probability && (
          <div>
            <h4 className="text-sm font-black text-slate-900 mb-2">Airdrop Probability</h4>
            <span className={`px-2 py-1 text-xs font-bold rounded ${getBadgeColor(data.airdrop_probability)}`}>
              {data.airdrop_probability}
            </span>
          </div>
        )}

        {/* Entry Stage / Effort / Risk */}
        {(data.entry_stage || data.expected_effort || data.risk_level) && (
          <div>
            <h4 className="text-sm font-black text-slate-900 mb-2">Key Metrics</h4>
            <div className="flex flex-wrap gap-2">
              {data.entry_stage && (
                <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                  Stage: {data.entry_stage}
                </span>
              )}
              {data.expected_effort && (
                <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                  Effort: {data.expected_effort}
                </span>
              )}
              {data.risk_level && (
                <span className={`px-2 py-1 text-xs font-bold rounded ${getBadgeColor(data.risk_level)}`}>
                  Risk: {data.risk_level}
                </span>
              )}
              {data.estimated_time && (
                <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                  Time: {data.estimated_time}
                </span>
              )}
              {data.estimated_cost && (
                <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                  Cost: {data.estimated_cost}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Why It Matters */}
        {data.why_it_matters && Array.isArray(data.why_it_matters) && data.why_it_matters.length > 0 && (
          <div>
            <h4 className="text-sm font-black text-slate-900 mb-2">Why It Matters</h4>
            <ul className="space-y-1">
              {data.why_it_matters.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Signals */}
        {data.key_signals && Array.isArray(data.key_signals) && data.key_signals.length > 0 && (
          <div>
            <h4 className="text-sm font-black text-slate-900 mb-2">Key Signals</h4>
            <ul className="space-y-1">
              {data.key_signals.map((signal, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Negatives */}
        {data.negatives && Array.isArray(data.negatives) && data.negatives.length > 0 && (
          <div>
            <h4 className="text-sm font-black text-slate-900 mb-2">Potential Risks</h4>
            <ul className="space-y-1">
              {data.negatives.map((negative, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{negative}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div>
            <h4 className="text-sm font-black text-slate-900 mb-2">Notes</h4>
            <p className="text-sm text-slate-600">{data.notes}</p>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    const checkImportStatus = async () => {
      if (authenticated && user && project) {
        const { data } = await supabase
          .from('user_subscriptions')
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
          .select('name, logo_url')
          .in('name', investorNames);

        if (profiles) {
          const logoMap = {};
          profiles.forEach(p => { logoMap[p.name] = p.logo_url; });
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

  const handleImportProject = async () => {
    if (!authenticated || !user) { login(); return; }
    setIsImporting(true);
    try {
      const privyId = user.id; 
      const { data: profile } = await supabase.from('user_profiles').select('project_limit').eq('auth_id', privyId).maybeSingle(); 
      const limit = profile?.project_limit || 5;
      const { count } = await supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('auth_id', privyId);

      if (count >= limit) return showToast(`Limit reached! You can track ${limit} projects.`, 'error');

      const { error } = await supabase.from('user_subscriptions').insert([{ auth_id: privyId, project_id: project.id }]);
      if (error && error.code === '23505') {
        setHasImported(true);
        showToast('Already tracking this project!', 'success');
      } else if (error) {
        showToast('Failed to import project.', 'error');
      } else {
        setHasImported(true);
        showToast('Welcome aboard! Project imported.', 'success');
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyContract = () => {
    if (project.contract_address) {
      navigator.clipboard.writeText(project.contract_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const guideContent = activeTask?.tutorial_markdown || activeTask?.task_article || activeTask?.description;
  const hasGuide = guideContent && guideContent.trim().length > 0;

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen pb-20 font-sans text-slate-900 overflow-x-hidden relative">
      
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

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-6">
        
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
          </div>

          <button 
            onClick={handleImportProject} 
            disabled={isImporting || hasImported} 
            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-black text-sm shadow-sm transition-all ${
              hasImported 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isImporting ? 'Syncing...' : hasImported ? <><CheckCircle2 className="w-4 h-4" /> Tracked ✓</> : <><Download className="w-4 h-4" /> Add to Track</>}
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

          {/* TAB 2: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 lg:p-10">
              
              {/* PROJECT OVERVIEW */}
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">Project Overview</h2>
              <div className="border-b border-slate-100 pb-6 mb-8">
                <p className="text-slate-600 font-medium leading-relaxed text-sm">{project?.description || 'No detailed description available.'}</p>
              </div>
              
              {/* COMPLETE BACKER LIST */}
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4">Complete Backer List</h3>
              <div className="flex flex-wrap gap-3 mb-10">
                {project?.lead_investors ? (
                  project.lead_investors.split(',').map((inv, idx) => {
                    const name = inv.trim();
                    const logo = investorLogos[name];
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                        {logo ? (
                          <img src={logo} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-black uppercase">
                            {name.substring(0, 1)}
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-700">{name}</span>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-sm text-slate-500">Undisclosed</span>
                )}
              </div>

              {/* NETWORK & TECH */}
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4">Network & Tech</h3>
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div>
                  <span className="w-32 inline-block font-bold text-slate-500 text-sm">Network:</span> 
                  <span className="font-black text-slate-900 text-sm">{project?.network || 'TBA'}</span>
                </div>
                <div>
                  <span className="w-32 inline-block font-bold text-slate-500 text-sm">Token Ticker:</span> 
                  <span className="font-black text-slate-900 text-sm">{project?.token_ticker || 'TBA'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI RESEARCH */}
          {activeTab === 'research' && (
            <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Header */}
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
                    
                    {/* ROW 1: FINAL VERDICT (The Hero Metric) */}
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

                    {/* BENTO GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* CARD: Project Overview */}
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

                      {/* CARD: Credibility & Team */}
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

                      {/* CARD: Opportunity Analysis */}
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

                      {/* CARD: Risk Analysis */}
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