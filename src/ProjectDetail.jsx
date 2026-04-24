import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { usePrivy } from '@privy-io/react-auth';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, Twitter, Globe, MessageSquare, 
  Flame, Copy, CheckCircle2, Clock, Check, 
  Share2, Download, ExternalLink, Zap, ShieldAlert, Star
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
  
  // 🚀 NEW: States for the custom Toast and Import Status
  const [hasImported, setHasImported] = useState(false);
  const [toast, setToast] = useState(null);

  const captureRef = useRef(null);

  // 🚀 NEW: Custom Toast Helper Function
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500); // Auto-hide after 3.5 seconds
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProjectData();
  }, [id]);

  // 🚀 NEW: Check if the user has already imported this project on load
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
      
      if (isUUID) {
        query = query.eq('id', id); 
      } else {
        query = query.eq('slug', id); 
      }

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

      let currentTaskCount = 0;
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectData.id); 

      if (!taskError && taskData) {
        setTasks(taskData);
        currentTaskCount = taskData.length;
        if (taskData.length > 0) setActiveTask(taskData[0]);
        else setActiveTask(null);
      }

      const { data: allProjects } = await supabase
        .from('projects')
        .select('*')
        .neq('id', projectData.id) // ✅ USE THE REAL DATABASE UUID
        .limit(30);
      
      if (allProjects) {
        const scoredProjects = allProjects.map(p => ({
          ...p,
          calculatedScore: getProjectScore(p)
        }));
        
        scoredProjects.sort((a, b) => b.calculatedScore - a.calculatedScore);
        setTopProjects(scoredProjects.slice(0, 10));
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateMasterScore = () => {
    return getProjectScore(project, tasks.length);
  };

  const renderDonutScore = () => {
    const score = calculateMasterScore();
    let strokeColor = '#94a3b8'; 
    if (score >= 80) strokeColor = '#10b981'; 
    else if (score >= 50) strokeColor = '#3b82f6'; 
    else if (score >= 30) strokeColor = '#f59e0b'; 

    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
          <circle 
            cx="40" cy="40" r={radius} fill="none" stroke={strokeColor} 
            strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} 
            strokeLinecap="round" className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-800 leading-none">{score}</span>
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

  // 🚀 UPDATED: Import function now uses custom Toasts and updates button state
  const handleImportProject = async () => {
    if (!authenticated || !user) { login(); return; }
    setIsImporting(true);
    try {
      const privyId = user.id; 
      const { data: profile } = await supabase.from('user_profiles').select('project_limit').eq('auth_id', privyId).maybeSingle(); 
      const limit = profile?.project_limit || 5;
      
      const { count } = await supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('auth_id', privyId);

      if (count >= limit) return showToast(`Limit reached! You can only track ${limit} projects. Upgrade in Points Arena.`, 'error');

      const { error } = await supabase.from('user_subscriptions').insert([{ auth_id: privyId, project_id: project.id }]);
      
      if (error && error.code === '23505') {
        setHasImported(true);
        showToast('You are already tracking this project!', 'success');
      }
      else if (error) {
        console.error("Supabase error:", error);
        showToast('Failed to import project. Please try again.', 'error');
      }
      else {
        setHasImported(true);
        showToast('🚢 Welcome aboard! Project successfully imported.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleShareImage = async () => {
    if (!captureRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(captureRef.current, { scale: 2, useCORS: true, backgroundColor: '#F8FAFC' });
      const link = document.createElement('a');
      link.download = `${project.name}-Airdrop-Radar.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) { console.error(error); } 
    finally { setIsCapturing(false); }
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
    if (num === null || num === undefined) return 'TBA';
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
      
      {/* 🚀 NEW: Custom Floating Toast Notification */}
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

        {/* ============================== */}
        {/* CAPTURE ZONE STARTS HERE       */}
        {/* ============================== */}
        <div ref={captureRef} className="bg-[#F8FAFC] pb-4">
          
          <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
            
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

            <div className="relative z-10 p-8 lg:p-10 flex flex-col lg:flex-row gap-10">
              
              <div className="flex-[1.2] flex gap-6 lg:border-r border-slate-100 pb-8 lg:pb-0 pr-0 lg:pr-8 min-w-0">
                <div className="relative flex-shrink-0 w-24 h-24 lg:w-28 lg:h-28 -mt-2">
                  <img 
                    src={project?.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${project?.name || 'fallback'}`} 
                    className="w-full h-full rounded-2xl object-cover shadow-xl ring-1 ring-slate-900/5 bg-white" 
                    alt="Logo" 
                  />
                </div>
                
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 truncate">
                      {project?.name || 'Loading...'}
                    </h1>
                    <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-slate-800 text-white shadow-sm whitespace-nowrap">
                      {project?.category || 'GENERAL'}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4 max-w-md line-clamp-2">
                    {project?.description || "Project overview tracking active."}
                  </p>
                  
                  <div className="inline-flex flex-wrap items-center gap-2">
                    {(project?.x_link || project?.twitter_url) && (
                      <a href={project.x_link || project.twitter_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 flex items-center gap-1.5 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-sky-500 text-xs font-bold transition-all border border-slate-200">
                        <Twitter className="w-3.5 h-3.5" /> Twitter
                      </a>
                    )}
                    {project?.website_url && (
                      <a href={project.website_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 flex items-center gap-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all border border-slate-200">
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                    )}
                    {project?.contract_address && (
                      <button onClick={handleCopyContract} className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-slate-800 bg-white shadow-sm px-3 py-1.5 rounded-lg border border-slate-200 transition-colors ml-2">
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'COPIED' : 'CONTRACT'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-[0.8] lg:border-r border-slate-100 pb-8 lg:pb-0 pr-0 lg:pr-8 flex flex-col justify-center">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Raised</p>
                    <p className="text-4xl font-black text-slate-900 tracking-tight drop-shadow-sm">
                      {formatFunding(project?.funding)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Lead Investors</p>
                    {project?.lead_investors ? (
                      <div className="flex flex-wrap gap-2">
                        {project.lead_investors.split(',').map((inv, idx) => {
                          const name = inv.trim();
                          const logo = investorLogos[name];
                          return (
                            <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 rounded-full pr-3 p-1 shadow-sm">
                              {logo ? (
                                <img src={logo} alt={name} className="w-6 h-6 rounded-full object-cover border border-slate-100" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-black uppercase">
                                  {name.substring(0, 2)}
                                </div>
                              )}
                              <span className="text-[11px] font-bold text-slate-700">{name}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-slate-400">Undisclosed</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-[0.6] flex flex-col justify-center">
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 shadow-inner flex items-center gap-4">
                  {renderDonutScore()}
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Algorithmic</h3>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Airdrop Score</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">X Score</p>
                    <p className="text-base font-black text-slate-800">{project?.social_score || '—'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Followers</p>
                    <p className="text-base font-bold text-slate-500">{formatFollowers(project?.twitter_followers)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 bg-slate-50 border-t border-slate-200 px-6 py-4 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
              
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-black text-emerald-700 uppercase tracking-wider">
                  Cost: {project?.total_cost_estimate?.startsWith('$') ? project.total_cost_estimate : `$${project?.total_cost_estimate || '0'}`}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-black text-amber-700 uppercase tracking-wider">
                  Tier: {project?.tier || 'TBA'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-[11px] font-black text-purple-700 uppercase tracking-wider">
                  Status: {project?.status || 'Active'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider shadow-sm">
                  Tasks: {tasks?.length || project?.task_count || 0}
                </span>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto" data-html2canvas-ignore="true">
                <button onClick={handleShareImage} disabled={isCapturing} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                
                {/* 🚀 UPDATED: Dynamic Button State */}
                <button 
                  onClick={handleImportProject} 
                  disabled={isImporting || hasImported} 
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-sm shadow-sm transition-all ${
                    hasImported 
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isImporting ? 'Importing...' : hasImported ? <><CheckCircle2 className="w-4 h-4" /> Imported</> : <><Download className="w-4 h-4" /> Import</>}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* ============================== */}
        {/* CAPTURE ZONE ENDS HERE         */}
        {/* ============================== */}

        {/* 2-COLUMN DASHBOARD LAYOUT (TASKS) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          
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
                          ${isActive 
                            ? 'bg-blue-50/50 border-blue-500' 
                            : 'bg-white border-slate-200 hover:border-blue-300'}`}
                      >
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>}
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                            Step {index + 1}
                          </span>
                          {(task.status === 'Ended' || daysLeftStr === 'Ended') ? (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-600">
                              ENDED
                            </span>
                          ) : daysLeftStr ? (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-orange-50 text-orange-600">
                              {daysLeftStr}
                            </span>
                          ) : null}
                        </div>
                        
                        <h3 className={`font-bold text-sm mb-3 line-clamp-2 ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                          {task.name || 'Untitled Task'}
                        </h3>
                        
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
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeTask.name}</h2>
                  </div>
                  <hr className="border-slate-100 mb-8" />
                  
                  <div className="flex-grow">
                    {hasGuide ? (
                      <div className="prose prose-slate max-w-none 
                        prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 
                        prose-h2:text-xl prose-h3:text-lg 
                        prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed 
                        prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-800 
                        prose-strong:text-slate-900 prose-strong:font-black 
                        prose-li:font-medium prose-li:text-slate-600"
                      >
                        <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                          components={{
                            // 🚀 NEW: This intercepts links and opens them in a new tab securely!
                            a: ({node, ...props}) => (
                              <a 
                                {...props} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:text-blue-800 underline break-words font-bold cursor-pointer"
                              />
                            ),
                            blockquote: ({node, ...props}) => (
                              <div className="my-8 bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl shadow-sm flex gap-4 items-start">
                                <div className="bg-white p-2 rounded-full shadow-sm mt-0.5">
                                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                                </div>
                                <div className="text-slate-800 font-semibold text-sm leading-relaxed [&>p]:m-0" {...props} />
                              </div>
                            ),
                            // 🚀 FIX: Use React styles for CSS counters so it actually counts 1, 2, 3
                            ol: ({node, ...props}) => (
                              <ol className="my-6 space-y-4 list-none pl-0" style={{ counterReset: 'step-counter' }} {...props} />
                            ),
                            li: ({node, ...props}) => (
                              <li className="relative pl-10 before:content-[counter(step-counter)] before:absolute before:left-0 before:top-0.5 before:flex before:items-center before:justify-center before:w-6 before:h-6 before:bg-blue-50 before:text-blue-600 before:font-black before:text-xs before:rounded-md" style={{ counterIncrement: 'step-counter' }} {...props} />
                            ),
                            // 🚀 NEW: Make raw markdown images look premium
                            img: ({node, ...props}) => (
                              <img className="rounded-2xl border border-slate-200 shadow-sm my-8 w-full object-cover" {...props} />
                            ),
                            ul: ({node, ...props}) => (
                              <ul className="my-6 space-y-2 list-disc pl-5 marker:text-blue-500" {...props} />
                            )
                          }}
                        >
                          {guideContent}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-10 text-center my-6">
                        <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 mb-2">No specific guide available</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
                          We haven't mapped a step-by-step tutorial for this specific task, but you can participate directly using the official link below.
                        </p>
                      </div>
                    )}
                  </div>

                  {(activeTask.task_link || activeTask.link || activeTask.url) && (
                    <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                      <a 
                        href={activeTask.task_link || activeTask.link || activeTask.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:-translate-y-0.5 transition-all"
                      >
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

        {/* ============================== */}
        {/* 🚀 NEW: MORE AIRDROPS SLIDER   */}
        {/* ============================== */}
        {topProjects.length > 0 && (
          <div className="mt-16 border-t border-slate-200 pt-10">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Highest Scoring Airdrops</h2>
            </div>
            
            {/* Horizontal Slider Container */}
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style dangerouslySetInnerHTML={{__html: `div::-webkit-scrollbar { display: none; }`}} />
              
              {topProjects.map(p => {
                const scoreColor = p.calculatedScore >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 
                                   p.calculatedScore >= 50 ? 'text-blue-600 bg-blue-50 border-blue-200' : 
                                   'text-amber-600 bg-amber-50 border-amber-200';

                return (
                  <Link 
                    to={`/${p.slug || p.id}/airdropguide`} 
                    key={p.id}
                    className="min-w-[280px] w-[280px] bg-white border border-slate-200 rounded-2xl p-5 shrink-0 snap-start hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <img 
                        src={p.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${p.name}`} 
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-100 shadow-sm group-hover:scale-105 transition-transform" 
                        alt={p.name} 
                      />
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-black border flex items-center gap-1 shadow-sm ${scoreColor}`}>
                        Score: {p.calculatedScore}
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 text-lg mb-3 truncate group-hover:text-blue-600 transition-colors">
                      {p.name}
                    </h4>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="text-slate-400">Cost:</span> {p.total_cost_estimate?.startsWith('$') ? p.total_cost_estimate : `$${p.total_cost_estimate || '0'}`}
                      </span>
                      <span className="bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="text-slate-400">Tier:</span> {p.tier || 'TBA'}
                      </span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50">
                      <p className="text-xs font-medium text-slate-500 truncate flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {p.category || 'General'} • {p.status || 'Active'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}