import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { 
  Search, ExternalLink, Target, Flame, 
  Zap, LayoutGrid, Clock, CheckCircle2 
} from 'lucide-react';

export default function EarlyTasksPage() {
  const [tasksData, setTasksData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; 

  useEffect(() => {
    fetchTasksData();
  }, []);

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bounty_radar')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasksData(data || []);
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER FUNCTIONS ---
  const isNew = (dateString) => {
    if (!dateString) return false;
    const taskDate = new Date(dateString);
    const now = new Date();
    const diffHours = (now - taskDate) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  const getPlatformStyle = (platform) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('zealy')) return 'bg-purple-50 text-purple-600 border-purple-100';
    if (p.includes('galxe')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (p.includes('discord')) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (p.includes('twitter') || p.includes('x')) return 'bg-sky-50 text-sky-600 border-sky-100';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getDifficultyColor = (diff) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy') return 'text-green-600 bg-green-50';
    if (d === 'medium') return 'text-amber-600 bg-amber-50';
    if (d === 'hard') return 'text-red-600 bg-red-50';
    return 'text-slate-600 bg-slate-50'; // Fallback
  };

  // Extracts "playorbs" from "Zealy: playorbs"
  const cleanProjectName = (taskName) => {
    if (!taskName) return 'Unknown';
    return taskName.includes(':') ? taskName.split(':')[1].trim() : taskName;
  };

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    const activeQuests = tasksData.length;
    const zealyTasks = tasksData.filter(t => t.platform_name?.toLowerCase().includes('zealy')).length;
    const galxeCampaigns = tasksData.filter(t => t.platform_name?.toLowerCase().includes('galxe')).length;
    const newTasks = tasksData.filter(t => isNew(t.created_at)).length;
    
    return { activeQuests, zealyTasks, galxeCampaigns, newTasks };
  }, [tasksData]);

  // --- FILTERING LOGIC ---
  const processedTasks = useMemo(() => {
    let result = tasksData;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.task_name?.toLowerCase().includes(lower) || 
        item.task_description?.toLowerCase().includes(lower)
      );
    }

    if (filterPlatform !== 'All') {
      result = result.filter(item => item.platform_name?.toLowerCase() === filterPlatform.toLowerCase());
    }
    if (filterType !== 'All') {
      result = result.filter(item => item.recurring?.toLowerCase() === filterType.toLowerCase());
    }
    // Difficulty is not in your DB schema, so this filter won't do much unless added later
    if (filterDifficulty !== 'All') {
      result = result.filter(item => (item.difficulty || 'Easy').toLowerCase() === filterDifficulty.toLowerCase());
    }

    return result;
  }, [tasksData, searchTerm, filterPlatform, filterType, filterDifficulty]);

  // Pagination
  const totalPages = Math.ceil(processedTasks.length / itemsPerPage);
  const paginatedTasks = processedTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => {
    setSearchTerm(''); setFilterPlatform('All'); setFilterType('All'); setFilterDifficulty('All');
    setCurrentPage(1);
  };

  const platforms = ['Zealy', 'Galxe', 'Discord', 'Twitter'];
  const taskTypes = ['One-time', 'Daily', 'Limited'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans">
      <div className="max-w-[1200px] mx-auto">
        
        {/* --- HEADER --- */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Early Tasks Radar
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Discover early Zealy, Galxe, and community quests before they go viral.
          </p>
        </div>

        {/* --- STAT CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Active Quests" value={stats.activeQuests} icon={<LayoutGrid className="w-5 h-5 text-blue-500" />} />
          <StatCard title="Zealy Tasks" value={stats.zealyTasks} icon={<Zap className="w-5 h-5 text-purple-500" />} />
          <StatCard title="Galxe Campaigns" value={stats.galxeCampaigns} icon={<CheckCircle2 className="w-5 h-5 text-indigo-500" />} />
          <StatCard title="New Tasks (24h)" value={stats.newTasks} icon={<Flame className="w-5 h-5 text-orange-500" />} />
        </div>

        {/* --- FILTERS & SEARCH BAR --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect value={filterPlatform} onChange={(e) => {setFilterPlatform(e.target.value); setCurrentPage(1);}} options={platforms} placeholder="Platform (All)" />
            <FilterSelect value={filterType} onChange={(e) => {setFilterType(e.target.value); setCurrentPage(1);}} options={taskTypes} placeholder="Task Type (All)" />
            <FilterSelect value={filterDifficulty} onChange={(e) => {setFilterDifficulty(e.target.value); setCurrentPage(1);}} options={difficulties} placeholder="Difficulty (All)" />
            <button onClick={resetFilters} className="text-sm font-semibold text-slate-400 hover:text-blue-600 px-2 transition-colors">
              Reset
            </button>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search quests or projects..." 
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* --- TASK CARDS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <GridSkeleton cards={6} />
          ) : paginatedTasks.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm">
              <Target className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium text-lg">No quests match your filters.</p>
              <button onClick={resetFilters} className="mt-2 text-blue-600 font-semibold text-sm hover:underline">Clear all filters</button>
            </div>
          ) : (
            paginatedTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all flex flex-col relative group">
                
                {/* NEW Badge */}
                {isNew(task.created_at) && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm transform rotate-3">
                    New
                  </div>
                )}

                {/* Top Row: Logo, Name, Platform Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={task.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${cleanProjectName(task.task_name)}`}
                      alt="Logo"
                      className="w-10 h-10 rounded-lg border border-slate-100 bg-slate-50 object-cover shadow-sm"
                      onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${cleanProjectName(task.task_name)}&background=random`}
                    />
                    <span className="font-bold text-slate-900 truncate max-w-[120px]">
                      {cleanProjectName(task.task_name)}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPlatformStyle(task.platform_name)}`}>
                    {task.platform_name || 'General'}
                  </span>
                </div>

                {/* Second Row: Task Title */}
                <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 line-clamp-1" title={task.task_name}>
                  {task.task_name || 'Complete Early Tasks'}
                </h3>

                {/* Third Row: Description */}
                <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-5 flex-grow">
                  {task.task_description || 'Participate in the community tasks to earn early XP and potential airdrop multipliers.'}
                </p>

                {/* Bottom Row: Tags & CTA */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${getDifficultyColor('Easy')}`}>
                      <Flame className="w-3 h-3" /> Easy
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {task.recurring || 'One-time'}
                    </span>
                  </div>

                  <a 
                    href={task.task_link || '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 font-semibold text-sm shadow-sm transition-all"
                  >
                    Start Quest <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- PAGINATION --- */}
        {!loading && processedTasks.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedTasks.length)} of {processedTasks.length} quests
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
      {icon}
    </div>
  </div>
);

const FilterSelect = ({ value, onChange, options, placeholder }) => (
  <select 
    value={value} 
    onChange={onChange} 
    className="appearance-none text-sm font-semibold bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
  >
    <option value="All">{placeholder}</option>
    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

const GridSkeleton = ({ cards }) => (
  <>
    {[...Array(cards)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-pulse flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
          </div>
          <div className="h-6 w-16 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-6 w-3/4 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-full bg-slate-200 rounded mb-1"></div>
        <div className="h-4 w-2/3 bg-slate-200 rounded mb-5 flex-grow"></div>
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-16 bg-slate-200 rounded"></div>
            <div className="h-5 w-16 bg-slate-200 rounded"></div>
          </div>
          <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    ))}
  </>
);