import React, { useState, useEffect } from "react";
import { useAuth } from '../useAuth'; 
import { supabase } from '../supabaseClient'; 
import { useNavigate } from "react-router-dom";

import {
  Search, X, SlidersHorizontal, Check, ExternalLink, ChevronDown,
  Plus, Minus, Droplet, ArrowLeftRight, Repeat, Layers, Twitter, 
  MessageCircle, Star, Clock, User, Lock
} from "lucide-react";

export default function TrackerAirdrops() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');

  const [activeTab, setActiveTab] = useState('Tasks');

  // --- REAL DATA STATES ---
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState({});
  const [projectTasks, setProjectTasks] = useState([]);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [trackedTaskIds, setTrackedTaskIds] = useState([]);
const [showIntervalModal, setShowIntervalModal] = useState(false);
const [selectedTask, setSelectedTask] = useState(null);
const [selectedInterval, setSelectedInterval] = useState('24h');
const [showUntrackModal, setShowUntrackModal] = useState(false);
const [projectToUntrack, setProjectToUntrack] = useState(null);
const [trackedTaskCount, setTrackedTaskCount] = useState(0);

  // --- SAAS SOFT-LOCK STATES ---
  const [activeLimit, setActiveLimit] = useState(5);
  const [allTrackedIds, setAllTrackedIds] = useState([]);
  const [activeTrackedIds, setActiveTrackedIds] = useState([]);
  const [lockedTrackedIds, setLockedTrackedIds] = useState([]);

  useEffect(() => {
    if (user) fetchProjectsData();
  }, [user]);

  const fetchProjectsData = async () => {
    setLoading(false);
    try {
      // 1. Fetch Profile Expiration & Limits
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_expires_at, project_limit')
        .eq('auth_id', user.id)
        .maybeSingle();

      // 2. Soft Lock Engine
      let currentLimit = 5; 
      const now = new Date();
      const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
      
      if ((profile?.subscription_tier === 'Voyager Pass' || profile?.subscription_tier === 'Sailor Pass') && (!expiresAt || expiresAt > now)) {
          currentLimit = profile?.project_limit || 999;
      }
      setActiveLimit(currentLimit);

      // 3. Fetch Global Projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('social_score', { ascending: false });

      // 4. Fetch User's Tracking List (Newest First)
      const { data: tracked } = await supabase
        .from('tracker_user_projects')
        .select('project_id')
        .eq('auth_id', user.id)
        .order('joined_at', { ascending: false });
        // FETCH USER TRACKED TASKS
const { data: trackedTasks } = await supabase
  .from('tracker_user_tasks')
  .select('task_id')
  .eq('auth_id', user.id);

setTrackedTaskIds(
  trackedTasks?.map(t => t.task_id) || []
);
        // FETCH INVESTOR LOGOS
const investorNames = projects
  ?.flatMap(p =>
    p.lead_investors
      ? p.lead_investors.split(',').map(i => i.trim())
      : []
  );

const { data: pioneerProfiles } = await supabase
  .from('pioneer_profiles')
  .select('name, logo_url')
  .in('name', investorNames);

const investorLogoMap = {};

pioneerProfiles?.forEach(profile => {
  investorLogoMap[profile.name] = profile.logo_url;
});

const enrichedProjects = projects?.map(project => ({
  ...project,
  investor_logos: investorLogoMap
}));

setAllProjects(enrichedProjects || []);

if (enrichedProjects && enrichedProjects.length > 0) {

  setSelectedProject(enrichedProjects[0]);

  // FETCH TASKS OF FIRST PROJECT
  const { data: tasksData } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', enrichedProjects[0].id);

  setProjectTasks(tasksData || []);
}

      const totalTracked = tracked ? tracked.map(t => t.project_id) : [];
      
      setAllTrackedIds(totalTracked);
      setActiveTrackedIds(totalTracked.slice(0, currentLimit));
      setLockedTrackedIds(totalTracked.slice(currentLimit));
      
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTrack = async (project) => {

  const isCurrentlyTracked = allTrackedIds.includes(project.id);

  if (isCurrentlyTracked) {

  const { count } = await supabase
    .from('tracker_user_tasks')
    .select('*', {
      count: 'exact',
      head: true
    })
    .eq('auth_id', user.id)
    .eq('project_id', project.id);

  setTrackedTaskCount(count || 0);
  setProjectToUntrack(project);
  setShowUntrackModal(true);

  return;
}

  try {

    // ===== UNTRACK =====
    if (isCurrentlyTracked) {

      setAllTrackedIds(prev =>
        prev.filter(id => id !== project.id)
      );

      setActiveTrackedIds(prev =>
        prev.filter(id => id !== project.id)
      );

      setLockedTrackedIds(prev =>
        prev.filter(id => id !== project.id)
      );

      const { error } = await supabase
        .from('tracker_user_projects')
        .delete()
        .match({
          auth_id: user.id,
          project_id: project.id
        });

      console.log("UNTRACK ERROR:", error);

      if (error) throw error;

    }

    // ===== TRACK =====
    else {

      setAllTrackedIds(prev => [
        project.id,
        ...prev
      ]);

      setActiveTrackedIds(prev => [
        project.id,
        ...prev
      ]);

      const { data, error } = await supabase
        .from('tracker_user_projects')
        .insert([
          {
            auth_id: user.id,
            project_id: project.id
          }
        ])
        .select();

      console.log("TRACK INSERT:", data);
      console.log("TRACK ERROR:", error);

      if (error) throw error;

    }

  } catch (error) {

    console.error("Toggle error:", error);

    fetchProjectsData();
  }
};
const confirmUntrackProject = async () => {

  if (!projectToUntrack) return;

  try {

    setAllTrackedIds(prev =>
      prev.filter(id => id !== projectToUntrack.id)
    );

    setActiveTrackedIds(prev =>
      prev.filter(id => id !== projectToUntrack.id)
    );

    setLockedTrackedIds(prev =>
      prev.filter(id => id !== projectToUntrack.id)
    );

    const { error } = await supabase
      .from('tracker_user_projects')
      .delete()
      .match({
        auth_id: user.id,
        project_id: projectToUntrack.id
      });

    if (error) throw error;

    setShowUntrackModal(false);
    setProjectToUntrack(null);
    setTrackedTaskCount(0);

  } catch (error) {

    console.error(error);
    fetchProjectsData();

  }

};
  const handleSelectProject = async (project) => {

  setSelectedProject(project);

  const { data: tasksData } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', project.id);

  setProjectTasks(tasksData || []);
};
const handleAddTask = async () => {

  if (!selectedTask) return;

  try {

    let nextDue = new Date();

    if (selectedInterval === '24h') {
      nextDue.setHours(nextDue.getHours() + 24);
    }

    if (selectedInterval === '7d') {
      nextDue.setDate(nextDue.getDate() + 7);
    }

    if (selectedInterval === '30d') {
      nextDue.setDate(nextDue.getDate() + 30);
    }

    const { data, error } = await supabase
      .from('tracker_user_tasks')
      .insert([
        {
          auth_id: user.id,
          project_id: selectedProject.id,
          task_id: selectedTask.id,
          custom_interval: selectedInterval,
          next_due_time: nextDue.toISOString(),
          telegram_alert_enabled: false
        }
      ])
      .select();

    console.log("TASK INSERT:", data);
    console.log("TASK ERROR:", error);

    if (error) throw error;

    setTrackedTaskIds(prev => [
      ...prev,
      selectedTask.id
    ]);

    setShowIntervalModal(false);
    setSelectedTask(null);

  } catch (error) {

    console.error("ADD TASK ERROR:", error);

  }
};
const handleRemoveTask = async (taskId) => {

  try {

    const { error } = await supabase
      .from('tracker_user_tasks')
      .delete()
      .match({
        auth_id: user.id,
        task_id: taskId
      });

    console.log("REMOVE TASK ERROR:", error);

    if (error) throw error;

    setTrackedTaskIds(prev =>
      prev.filter(id => id !== taskId)
    );

  } catch (error) {

    console.error("REMOVE TASK ERROR:", error);

  }
};

const projectTotalTasks =
  projectTasks.length;

const projectCompletedTasks =
  trackedTaskIds.filter(id =>
    projectTasks.some(task => task.id === id)
  ).length;

const projectCompletionPercent =
  projectTotalTasks > 0
    ? Math.round(
        (projectCompletedTasks /
          projectTotalTasks) *
          100
      )
    : 0;
    const filteredProjects = allProjects.filter(project => {

  // Search filter
  if (
    searchTerm &&
    !project.name?.toLowerCase().includes(
      searchTerm.toLowerCase()
    )
  ) {
    return false;
  }

  // Tracked filter
  if (
    projectFilter === 'Tracked' &&
    !allTrackedIds.includes(project.id)
  ) {
    return false;
  }

  // Trending filter
  if (
    projectFilter === 'Trending' &&
    (project.social_score || 0) < 80
  ) {
    return false;
  }

  return true;
});

  return (
  <>
    <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">
      
      {/* ─── LEFT SIDEBAR: AIRDROPS LIST ─── */}
      <aside className="lg:col-span-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900">All Airdrops</h2>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">24</span>
            </div>
          </div>
          
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search airdrops..."
  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
/>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            <FilterChip
  label="All"
  active={projectFilter === 'All'}
  onClick={() => setProjectFilter('All')}
/>

<FilterChip
  label="Tracked"
  active={projectFilter === 'Tracked'}
  onClick={() => setProjectFilter('Tracked')}
/>

<FilterChip
  label="Trending"
  active={projectFilter === 'Trending'}
  onClick={() => setProjectFilter('Trending')}
/>
            
          </div>

          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
            {filteredProjects.map(proj => {
              const isActive = activeTrackedIds.includes(proj.id);
              const isLocked = lockedTrackedIds.includes(proj.id);
              
              return (
                <AirdropCard 
                  key={proj.id}
                  funding={proj.funding}
                  logo={<img src={proj.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${proj.name}`} className={`w-10 h-10 rounded-xl object-cover shadow-sm ${isLocked ? 'grayscale opacity-50' : ''}`} alt="" />}
                  name={proj.name} 
                  badge={proj.tier || "New"} 
                  badgeColor={proj.tier?.includes('1') ? "blue" : "violet"} 
                  subtitle={proj.category || "Ecosystem"} 
                  score={proj.total_xp || 0} 
                  scoreColor={isLocked ? "text-slate-400" : "text-emerald-600"} 
                  tracked={isActive} 
                  isLocked={isLocked}
                  selected={selectedProject?.id === proj.id}
                  onClick={() => handleSelectProject(proj)}
                  onToggleTrack={(e) => { e.stopPropagation(); handleToggleTrack(proj); }}
                />
              )
            })}
          </div>
          
          <button className="w-full mt-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors">
            Load More <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ─── CENTER MAIN: DETAILS & TASKS ─── */}
      <main className="lg:col-span-6 space-y-6">
        
        {/* Project Header Box */}
<div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
  <div className="flex items-start justify-between">

    {/* LEFT SIDE */}
    <div className="flex items-start gap-4">

      {/* PROJECT LOGO */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm shrink-0">
        <img
          src={
            selectedProject?.logo_url ||
            `https://api.dicebear.com/7.x/shapes/svg?seed=${selectedProject?.name}`
          }
          alt={selectedProject?.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div>

        {/* NAME + TIER */}
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900">
            {selectedProject?.name || "Loading"}
          </h1>

          {selectedProject?.tier && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md shadow-sm">
              {selectedProject.tier}
            </span>
          )}
        </div>

        {/* DESCRIPTION */}
        <p className="text-slate-600 mt-1 text-sm font-medium">
          {selectedProject?.description || "No description available"}
        </p>

        {/* TAGS */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">

          {/* X LINK */}
          {selectedProject?.x_link && (
            <a
              href={selectedProject.x_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              X
            </a>
          )}

          {/* STATUS */}
          {selectedProject?.status && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
              {selectedProject.status}
            </span>
          )}

          {/* AIRDROP STATUS */}
          {selectedProject?.airdrop_status && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
              {selectedProject.airdrop_status}
            </span>
          )}

        </div>
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="text-right flex flex-col items-end">

      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        Social Score
      </div>

      <div className="text-3xl font-black text-emerald-600 mt-0.5">
        {selectedProject?.social_score || 0}
      </div>

      {allTrackedIds.includes(selectedProject?.id) ? (

  <button
    onClick={() => handleToggleTrack(selectedProject)}
    className="mt-3 flex items-center gap-1.5 border border-emerald-200 text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors group"
  >

    <Check className="w-4 h-4 stroke-[3] group-hover:hidden" />

    <Minus className="w-4 h-4 stroke-[3] hidden group-hover:block" />

    <span className="group-hover:hidden">
      Tracked
    </span>

    <span className="hidden group-hover:block">
      Untrack
    </span>

  </button>

) : (

  <button
    onClick={() => handleToggleTrack(selectedProject)}
    className="mt-3 flex items-center gap-1.5 border border-blue-200 text-blue-700 bg-blue-50 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-100 transition-colors"
  >

    <Plus className="w-4 h-4 stroke-[3]" />

    Track

  </button>

)}

    </div>
  </div>
</div>

        {/* Tabbed Content Box */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 bg-slate-50/50">
            <div className="flex items-center gap-8">
              {['Overview', 'Tasks', 'About', 'Discussion'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent hover:text-slate-800"}`}
                >
                  {tab} {tab === 'Discussion' && <span className="ml-1.5 text-xs text-slate-400 font-medium">128</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-900">Available Tasks</h3>
                <p className="text-sm text-slate-500 mt-0.5">Add tasks to your tracker and earn SAIL</p>
              </div>
              <div className="flex items-center gap-2">
                <select
  onChange={(e) => {

    const sortedTasks = [...projectTasks];

    if (e.target.value === "high") {
      sortedTasks.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    }

    if (e.target.value === "low") {
      sortedTasks.sort((a, b) => (a.xp || 0) - (b.xp || 0));
    }

    setProjectTasks(sortedTasks);
  }}
  className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50 shadow-sm focus:outline-none"
>
  <option value="">
    XP Filter
  </option>

  <option value="high">
    High to Low XP
  </option>

  <option value="low">
    Low to High XP
  </option>
</select>
                <button className="flex items-center gap-1 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 shadow-sm">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
                </button>
              </div>
            </div>

            {/* REAL TASKS LIST */}
<div className="space-y-3">

  {(showAllTasks ? projectTasks : projectTasks.slice(0, 3)).map((task, index) => {

    const randomIcons = [
      <Droplet className="w-5 h-5 text-blue-600" />,
      <ArrowLeftRight className="w-5 h-5 text-blue-600" />,
      <Repeat className="w-5 h-5 text-blue-600" />,
      <Layers className="w-5 h-5 text-blue-600" />,
      <Twitter className="w-5 h-5 text-sky-500" />
    ];

    return (
      <TaskRow
  key={task.id}
  icon={randomIcons[index % randomIcons.length]}
  title={task.name}
  desc={task.description}
  freq={task.recurring || "Once"}
  diff={task.status || "Open"}
  diffColor={
    task.status?.toLowerCase() === "easy"
      ? "emerald"
      : task.status?.toLowerCase() === "medium"
      ? "amber"
      : "red"
  }
  xp={task.xp || 0}
  link={task.link}
  added={trackedTaskIds.includes(task.id)}
  projectTracked={allTrackedIds.includes(selectedProject?.id)}

  onAdd={() => {
  setSelectedTask(task);
  setShowIntervalModal(true);
}}
onRemove={() => handleRemoveTask(task.id)}
/>
    );
  })}

</div>

            <button
  onClick={() => setShowAllTasks(!showAllTasks)}
  className="w-full mt-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 flex items-center justify-center gap-1 hover:bg-slate-50 hover:text-slate-900 transition-colors"
>

  {showAllTasks ? "Show Less Tasks" : `View All Tasks (${projectTasks.length})`}

  <ChevronDown
    className={`w-4 h-4 transition-transform ${
      showAllTasks ? "rotate-180" : ""
    }`}
  />
</button>
          </div>
        </div>
      </main>

      {/* ─── RIGHT SIDEBAR: ABOUT & PROGRESS ─── */}
      <aside className="lg:col-span-3 space-y-6">
        
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">

  <h3 className="font-semibold text-slate-900 mb-3">
    About {selectedProject?.name || "Project"}
  </h3>

  <p className="text-sm text-slate-600 leading-relaxed font-medium">
    {selectedProject?.description || "No description available"}
  </p>

  <div className="mt-5 space-y-3 text-sm">

    {/* STAGE */}
    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
      <span className="text-slate-500 font-medium">
        Stage
      </span>

      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold border border-blue-100 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>

        {selectedProject?.status || "Unknown"}
      </span>
    </div>

    {/* FUNDING */}
    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
      <span className="text-slate-500 font-medium">
        Total Funding
      </span>

      <span className="text-slate-900 font-black">
        {selectedProject?.funding || "TBA"}
      </span>
    </div>

    {/* INVESTORS */}
    <div className="flex justify-between items-center">
      <span className="text-slate-500 font-medium">
        Investors
      </span>

      <div className="flex items-center">

        {selectedProject?.lead_investors
          ?.split(',')
          ?.slice(0, 3)
          ?.map((investor, index) => {

            const trimmedInvestor = investor.trim();

            return (
              <div
                key={index}
                className={`w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 ${
                  index !== 0 ? '-ml-2' : ''
                }`}
              >

                {/* IF LOGO EXISTS */}
                {selectedProject?.investor_logos?.[trimmedInvestor] ? (
                  <img
                    src={selectedProject.investor_logos[trimmedInvestor]}
                    alt={trimmedInvestor}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  trimmedInvestor.charAt(0).toUpperCase()
                )}

              </div>
            );
          })}

        {selectedProject?.lead_investors && (
          <span className="text-xs font-bold text-slate-500 ml-1.5">
            +
            {
              selectedProject.lead_investors
                .split(',')
                .length
            }
          </span>
        )}

      </div>
    </div>

  </div>
</div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Your Progress</h3>
          <div className="flex items-center gap-5">
            <ProgressRing
  percent={projectCompletionPercent}
/>
            <div>
              <div className="text-2xl font-black text-slate-900">
  {projectCompletedTasks}
  <span className="text-lg text-slate-400">
    / {projectTotalTasks}
  </span>
</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Tasks Completed</div>
            </div>
          </div>
          <button className="w-full mt-5 py-2.5 border border-slate-200 rounded-lg text-sm text-blue-600 font-bold hover:bg-slate-50 transition-colors">
            View My Tracker
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            
            <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            <ActivityRow color="blue" icon={<User className="w-4 h-4 text-blue-600" />} text="You completed Faucet Claim" time="2h ago" xp={10} />
            <ActivityRow color="emerald" icon={<Check className="w-4 h-4 text-emerald-600 stroke-[3]" />} text="You added Bridge to Tracker" time="3h ago" xp={25} />
            <ActivityRow color="violet" icon={<Check className="w-4 h-4 text-violet-600 stroke-[3]" />} text="You completed Swap" time="1d ago" xp={15} />
          </div>
        </div>

      </aside>
    </div>

{showIntervalModal && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

    <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl p-6">

      <h2 className="text-lg font-bold text-slate-900">
        Add Task Routine
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Choose how often you want reminders.
      </p>

      <div className="space-y-2 mt-5">

        {[
          { label: 'One-Time', value: 'once' },
          { label: 'Daily', value: '24h' },
          { label: 'Weekly', value: '7d' },
          { label: 'Monthly', value: '30d' }
        ].map(interval => (

          <button
            key={interval.value}
            onClick={() => setSelectedInterval(interval.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
              selectedInterval === interval.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {interval.label}
          </button>

        ))}

      </div>

      <div className="flex items-center gap-3 mt-6">

        <button
          onClick={() => {
            setShowIntervalModal(false);
            setSelectedTask(null);
          }}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          onClick={handleAddTask}
          className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm"
        >
          Add Task
        </button>

      </div>

    </div>

  </div>
)}
{showUntrackModal && (

  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">

      <h2 className="text-2xl font-bold text-slate-900">
        Untrack {projectToUntrack?.name}?
      </h2>

      <div className="mt-5">

        <p className="text-slate-600 font-medium">
          You currently have:
        </p>

        <div className="mt-4 space-y-2">

          <div className="text-slate-800 font-semibold">
            • {trackedTaskCount} tracked tasks
          </div>

          <div className="text-slate-800 font-semibold">
            • {trackedTaskCount} daily tasks
          </div>

        </div>

      </div>

      <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-4">

        <p className="text-sm text-red-700 leading-relaxed">
          Untracking this project will permanently remove these tasks
          from your tracker and daily task dashboard.
        </p>

      </div>

      <div className="flex gap-3 mt-6">

        <button
          onClick={() => {
            setShowUntrackModal(false);
            setProjectToUntrack(null);
          }}
          className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          onClick={confirmUntrackProject}
          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
        >
          Untrack Project
        </button>

      </div>

    </div>

  </div>

)}
  </>
);
}

// --- HELPER COMPONENTS ---

function FilterChip({
  label,
  active,
  onClick
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3.5 py-1.5 rounded-lg border font-bold transition-all whitespace-nowrap ${
        active
          ? "bg-white border-slate-300 text-slate-900 shadow-sm"
          : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      {label}
    </button>
  );
}

function AirdropCard({ 
  logo, 
  name, 
  badge, 
  badgeColor, 
  subtitle, 
  funding,
  tracked,
  isLocked, 
  selected, 
  onClick, 
  onToggleTrack 
}) {

  const badgeClasses =
    badgeColor === "blue"
      ? "bg-blue-50 text-blue-600 border-blue-100"
      : "bg-violet-50 text-violet-600 border-violet-100";

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border p-3 cursor-pointer transition-all ${
        selected
          ? "border-blue-500 bg-blue-50/40 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-3">
        
        <div className="shrink-0">
          {logo}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold text-sm truncate ${
                isLocked ? "text-slate-400" : "text-slate-900"
              }`}
            >
              {name}
            </span>

            <span
              className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                isLocked
                  ? "bg-slate-50 text-slate-400 border-slate-200"
                  : badgeClasses
              }`}
            >
              {badge}
            </span>
          </div>

          <div className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
            {subtitle}
          </div>
        </div>

        {/* REAL FUNDING DATA */}
        <div className="text-right shrink-0">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
            Funding
          </div>

          <div className="text-xs font-black text-slate-900">
            {funding || "TBA"}
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        {isLocked ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 border border-amber-200 bg-amber-50 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
            <Lock className="w-3 h-3 stroke-[3]" />
            Locked
          </span>
        ) : tracked ? (
          <button
            onClick={onToggleTrack}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-200 bg-slate-50 rounded-md px-2.5 py-1.5 flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors group"
          >
            <Check className="w-3 h-3 stroke-[3] group-hover:hidden" />

            <Minus className="w-3 h-3 stroke-[3] hidden group-hover:block" />

            <span className="group-hover:hidden">Tracked</span>

            <span className="hidden group-hover:block">Untrack</span>
          </button>
        ) : (
          <button
            onClick={onToggleTrack}
            className="text-[10px] font-bold uppercase tracking-widest text-blue-600 border border-blue-200 bg-white rounded-md px-2.5 py-1.5 flex items-center gap-1.5 hover:bg-blue-50 shadow-sm transition-colors"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
            Track
          </button>
        )}
      </div>
    </div>
  );
}

function TaskRow({ 
  icon, 
  title, 
  desc, 
  freq, 
  diff, 
  diffColor, 
  xp, 
  link,
  added,
  projectTracked,
onAdd,
onRemove
}) {
  const diffMap = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl bg-white hover:border-blue-300 transition-colors group cursor-pointer shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <a
  href={link || "#"}
  target="_blank"
  rel="noopener noreferrer"
  className="font-bold text-slate-900 text-sm truncate hover:text-blue-600 transition-colors block"
>
  {title}
</a>
        <div className="text-xs font-medium text-slate-500 truncate mt-0.5">{desc}</div>
      </div>
      <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-md">{freq}</span>
      <span className={`hidden sm:block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${diffMap[diffColor]}`}>{diff}</span>
      <span className="text-sm font-black text-blue-600 w-16 text-right shrink-0">+{xp} XP</span>
      {added ? (
  <button
  onClick={onRemove}
  className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-2 rounded-lg shadow-sm shrink-0 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors group"
>
    <Check className="w-3.5 h-3.5 stroke-[3] group-hover:hidden" />

    <Minus className="w-3.5 h-3.5 stroke-[3] hidden group-hover:block" />

    <span className="group-hover:hidden">
      Added
    </span>

    <span className="hidden group-hover:block">
      Remove
    </span>
  </button>
) : projectTracked ? (

  <button
    onClick={onAdd}
    className="hidden md:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors shrink-0"
  >
    <Plus className="w-3.5 h-3.5 stroke-[3]" />
    Add
  </button>

) : (

  <button
    disabled
    className="hidden md:flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold px-3 py-2 rounded-lg shadow-sm shrink-0 cursor-not-allowed"
  >
    <Lock className="w-3.5 h-3.5 stroke-[3]" />
    Track Project
  </button>

)
}
    </div>
  );
}

function ProgressRing({ percent }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
      <svg className="w-16 h-16 -rotate-90">
        <circle cx="32" cy="32" r={r} stroke="#f1f5f9" strokeWidth="6" fill="none" />
        <circle cx="32" cy="32" r={r} stroke="#2563eb" strokeWidth="6" fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-blue-600">{percent}%</div>
    </div>
  );
}

function ActivityRow({ color, icon, text, time, xp }) {
  const bgMap = {
    blue: "bg-blue-50 border-blue-100",
    emerald: "bg-emerald-50 border-emerald-100",
    violet: "bg-violet-50 border-violet-100",
  };
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${bgMap[color]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-700 leading-tight">{text}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{time}</div>
      </div>
      {xp !== undefined && (
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md shrink-0">+{xp} XP</span>
      )}
    </div>
  );
}