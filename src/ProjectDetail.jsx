import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { usePrivy } from '@privy-io/react-auth';
import {
  ArrowLeft, Twitter, Globe, MessageSquare,
  Flame, Copy, CheckCircle2, Clock, Check,
  Share2, Download, ExternalLink, Sparkles,
  Activity, Wallet, Users, Target, ChevronRight
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const { user, authenticated, login } = usePrivy();
  const [isImporting, setIsImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [taskLinkCopied, setTaskLinkCopied] = useState(false);

  const captureRef = useRef(null);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id);

      if (!taskError && taskData) {
        setTasks(taskData);
        if (taskData.length > 0) setActiveTask(taskData[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    return `${diffDays} days left`;
  };

  const handleImportProject = async () => {
    if (!authenticated || !user) {
      login();
      return;
    }

    setIsImporting(true);
    const privyId = user.id;

    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('auth_id, project_limit')
        .eq('auth_id', privyId)
        .maybeSingle();

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            auth_id: privyId,
            email: user.email?.address || null,
            points: 0,
            subscription_tier: 'Free',
            project_limit: 5
          }]);
        if (profileError) throw profileError;
      }

      const limit = existingProfile?.project_limit || 5;

      const { count, error: countError } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('auth_id', privyId);

      if (countError) throw countError;

      if (count >= limit) {
        alert(`Limit reached! You can only track ${limit} projects on your current tier. Please upgrade your plan in the Points Arena to unlock more capacity.`);
        setIsImporting(false);
        return;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .insert([{ auth_id: privyId, project_id: id }]);

      if (error) {
        if (error.code === '23505') alert('You already have this project tracked in your dashboard!');
        else throw error;
      } else {
        alert('Welcome aboard! Project imported to your Daily Tasks.');
      }
    } catch (err) {
      console.error('Error saving project:', err);
      alert(`Failed to import. Reason: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleShareImage = async () => {
    if (!captureRef.current) return;
    setIsCapturing(true);

    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F8FAFC',
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${project.name}-Airdrop-Radar.png`;
      link.click();
    } catch (error) {
      console.error('Error capturing image:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCopyContract = () => {
    if (project.contract_address) {
      navigator.clipboard.writeText(project.contract_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyTaskLink = () => {
    if (activeTask?.task_link) {
      navigator.clipboard.writeText(activeTask.task_link);
      setTaskLinkCopied(true);
      setTimeout(() => setTaskLinkCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold bg-[#F8FAFC]">Project Not Found.</div>;
  }

  const guideContent = activeTask?.tutorial_markdown || activeTask?.task_article;
  const hasGuide = guideContent && guideContent.trim().length > 0;
  const taskUrl = activeTask?.task_link || activeTask?.link || activeTask?.url;
  const activeTaskDaysLeft = activeTask?.end_date ? getDaysLeft(activeTask.end_date) : null;
  const statCards = [
    {
      label: 'Total Raised',
      value: project.funding ? `$${project.funding}` : 'TBA',
      hint: 'Capital strength',
      icon: Wallet,
      tone: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    },
    {
      label: 'Lead Investors',
      value: project.lead_investors || 'Undisclosed',
      hint: 'Backing profile',
      icon: Target,
      tone: 'text-amber-600 bg-amber-50 border-amber-100'
    },
    {
      label: 'Social Score',
      value: project.social_score || 'N/A',
      hint: 'Community momentum',
      icon: Activity,
      tone: 'text-sky-600 bg-sky-50 border-sky-100'
    },
    {
      label: 'Followers',
      value: project.social_follower_count || 'Evaluating...',
      hint: 'Audience size',
      icon: Users,
      tone: 'text-violet-600 bg-violet-50 border-violet-100'
    }
  ];
  const overviewChips = [
    { label: 'Status', value: project.status || 'Active' },
    { label: 'Tier', value: project.tier || 'TBA' },
    { label: 'Cost', value: project.total_cost_estimate || 'Free' },
    { label: 'Tasks', value: tasks.length || project.task_count || 0 }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#f8fafc_45%,_#f1f5f9_100%)] pb-20 font-sans text-slate-900">
      <div className="max-w-[1240px] mx-auto px-4 lg:px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Airdrops
        </Link>

        <div ref={captureRef} className="pb-4">
          <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_22px_70px_-30px_rgba(15,23,42,0.35)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_34%),radial-gradient(circle_at_85%_20%,_rgba(16,185,129,0.14),_transparent_28%)] pointer-events-none" />
            <div className="relative p-6 lg:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                    <Sparkles className="h-3.5 w-3.5" /> Airdrop Intelligence
                  </div>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <img
                      src={project.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${project.name}`}
                      crossOrigin="anonymous"
                      className="h-24 w-24 rounded-[24px] border border-white/70 object-cover shadow-lg shadow-slate-200/70 ring-4 ring-white"
                      alt={`${project.name} logo`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-black tracking-tight text-slate-950 lg:text-5xl">{project.name}</h1>
                        <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-sky-700">
                          {project.category || 'General'}
                        </span>
                      </div>
                      <p className="max-w-2xl text-sm font-medium leading-7 text-slate-600 lg:text-base">
                        {project.description || 'Project overview tracking active. Stay tuned for updates as the campaign evolves.'}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        {project.twitter_url && (
                          <a href={project.twitter_url} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-600">
                            <Twitter className="h-4 w-4" />
                          </a>
                        )}
                        {project.discord_url && (
                          <a href={project.discord_url} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600">
                            <MessageSquare className="h-4 w-4" />
                          </a>
                        )}
                        {project.website_url && (
                          <a href={project.website_url} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-800">
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                        {project.contract_address && (
                          <button onClick={handleCopyContract} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900">
                            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied' : 'Contract'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-sm rounded-[24px] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300/30" data-html2canvas-ignore="true">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-300">Campaign Snapshot</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {overviewChips.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                        <p className="mt-2 text-sm font-black text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col gap-3">
                    <button
                      onClick={handleImportProject}
                      disabled={isImporting}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-sky-900/30 transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Download className="h-4 w-4" /> {isImporting ? 'Importing...' : 'Import to Profile'}
                    </button>
                    <button
                      onClick={handleShareImage}
                      disabled={isCapturing}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-bold text-slate-100 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Share2 className="h-4 w-4" /> {isCapturing ? 'Capturing...' : 'Share Image'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.label} className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                      <p className="mt-3 text-xl font-black leading-tight text-slate-900">{card.value}</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">{card.hint}</p>
                    </div>
                    <div className={`rounded-2xl border p-3 ${card.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
                    <CheckCircle2 className="h-5 w-5 text-sky-500" /> Task Timeline
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Follow the sequence and open each task when you're ready.</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
                  {tasks.length} Steps
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur">
                {tasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <p className="text-sm font-bold text-slate-400">No tasks mapped yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task, index) => {
                      const daysLeftStr = getDaysLeft(task.end_date);
                      const isActive = activeTask?.id === task.id;

                      return (
                        <button
                          key={task.id || index}
                          onClick={() => setActiveTask(task)}
                          className={`group relative w-full overflow-hidden rounded-[24px] border p-4 text-left transition-all ${
                            isActive
                              ? 'border-sky-200 bg-[linear-gradient(135deg,_rgba(14,165,233,0.12),_rgba(255,255,255,0.96))] shadow-[0_18px_40px_-28px_rgba(14,165,233,0.7)]'
                              : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/30'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${
                              isActive
                                ? 'border-sky-200 bg-sky-500 text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-500'
                            }`}>
                              {index + 1}
                              {index !== tasks.length - 1 && (
                                <span className="absolute left-1/2 top-[calc(100%+8px)] h-8 w-px -translate-x-1/2 bg-slate-200" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${isActive ? 'text-sky-700' : 'text-slate-400'}`}>
                                  Step {index + 1}
                                </span>
                                {daysLeftStr && (
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                    daysLeftStr === 'Ended'
                                      ? 'bg-rose-50 text-rose-600'
                                      : daysLeftStr === 'Ends today'
                                        ? 'bg-amber-50 text-amber-600'
                                        : 'bg-orange-50 text-orange-600'
                                  }`}>
                                    {daysLeftStr}
                                  </span>
                                )}
                              </div>
                              <h3 className={`line-clamp-2 text-sm font-black leading-6 ${isActive ? 'text-slate-950' : 'text-slate-800'}`}>
                                {task.name || 'Untitled Task'}
                              </h3>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                  <Clock className="h-3 w-3" /> {task.recurring || 'One-time'}
                                </span>
                                {task.task_link && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
                                    Live Link
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`mt-1 h-4 w-4 shrink-0 transition-transform ${isActive ? 'translate-x-0 text-sky-600' : 'text-slate-300 group-hover:translate-x-0.5 group-hover:text-sky-500'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="min-h-[560px] rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.28)] lg:p-10">
              {activeTask ? (
                <div className="flex h-full flex-col">
                  <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(14,165,233,0.08),_rgba(255,255,255,0.95))] p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">Task Detail</p>
                        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 lg:text-3xl">
                          {activeTask.name || 'Untitled Task'}
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600">
                          Review the guide, complete the action on the official page, and keep your timeline moving.
                        </p>
                      </div>
                      {taskUrl && (
                        <a
                          href={taskUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
                        >
                          Open Task <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Schedule</p>
                        <p className="mt-2 text-sm font-black text-slate-900">{activeTask.recurring || 'One-time'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Deadline</p>
                        <p className="mt-2 text-sm font-black text-slate-900">{activeTaskDaysLeft || 'No deadline set'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Guide Status</p>
                        <p className="mt-2 text-sm font-black text-slate-900">{hasGuide ? 'Mapped' : 'Pending'}</p>
                      </div>
                      {taskUrl && (
                        <button
                          onClick={handleCopyTaskLink}
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition-colors hover:text-slate-900"
                        >
                          {taskLinkCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          {taskLinkCopied ? 'Link Copied' : 'Copy Link'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex-grow">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-slate-950">What to do</h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">Use the guide below to complete the task correctly.</p>
                      </div>
                    </div>
                    {hasGuide ? (
                      <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:text-xl prose-h3:text-lg prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed prose-a:text-blue-600 prose-a:font-bold hover:prose-a:text-blue-700 prose-strong:text-slate-900 prose-strong:font-black prose-li:font-medium prose-li:text-slate-600">
                        <ReactMarkdown
                          components={{
                            blockquote: ({ node, ...props }) => (
                              <div className="my-8 bg-gradient-to-r from-blue-50 to-indigo-50/30 border-l-4 border-blue-500 p-5 rounded-r-xl shadow-sm flex gap-4 items-start">
                                <div className="bg-white p-2 rounded-full shadow-sm">
                                  <Flame className="w-5 h-5 text-orange-500 shrink-0" />
                                </div>
                                <div className="text-slate-800 font-semibold text-sm leading-relaxed [&>p]:m-0" {...props} />
                              </div>
                            ),
                            ol: ({ node, ...props }) => (
                              <ol className="my-6 space-y-4 list-none pl-0 counter-reset-step" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                              <li className="relative pl-10 before:content-[counter(step)] before:counter-increment-step before:absolute before:left-0 before:top-0.5 before:flex before:items-center before:justify-center before:w-6 before:h-6 before:bg-slate-100 before:text-slate-600 before:font-black before:text-xs before:rounded-md" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul className="my-6 space-y-2 list-disc pl-5 marker:text-blue-500" {...props} />
                            )
                          }}
                        >
                          {guideContent}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="my-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                        <h3 className="mb-1 text-lg font-bold text-slate-700">No detailed guide yet</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
                          We haven't mapped a step-by-step tutorial for this specific task, but you can still participate using the official link below.
                        </p>
                      </div>
                    )}
                  </div>

                  {taskUrl && (
                    <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                      <a
                        href={taskUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-blue-700"
                      >
                        Go To Task <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center py-20 opacity-40">
                  <CheckCircle2 className="mb-4 h-16 w-16 text-slate-300" />
                  <h2 className="text-xl font-black mb-1">Select a Task</h2>
                  <p className="text-sm font-bold text-slate-500">Choose a step from the navigator to view the guide.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
