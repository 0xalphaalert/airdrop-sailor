// src/mobile/pages/FundraisingPageMobile.jsx
import React from 'react';
import { Search, Activity, DollarSign, Users, Layers, ChevronLeft, ChevronRight, Rocket } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import BottomNavigation from '../components/navigation/BottomNavigation';
import AIResearchPanel from '../../AIResearchPanel'; // Adjust path if needed
import MobileHeader from '../components/navigation/MobileHeader';

export default function FundraisingPageMobile({
  loading,
  stats,
  chartData,
  processedData,
  searchTerm,
  setSearchTerm,
  filterAmount,
  setFilterAmount,
  filterRound,
  setFilterRound,
  filterCategory,
  setFilterCategory,
  uniqueRounds,
  uniqueCategories,
  resetFilters,
  currentPage,
  setCurrentPage,
  totalPages,
  selectedProject,
  setSelectedProject,
  formatFundingAmount,
  getRoundStyle,
  getAirdropProbability
}) {

  // --- MOBILE COMPONENTS ---

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
    </div>
  );

  const MobileProjectCard = ({ item }) => {
    const formattedFunding = formatFundingAmount(item.funding_amount || item.amount);
    const probData = getAirdropProbability(item);

    return (
      <div 
        onClick={() => setSelectedProject(item)}
        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm active:scale-[0.98] transition-transform mb-3"
      >
        {/* Top Row: Logo, Name, Amount */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3 items-center">
            <img 
              src={item.project_logo && item.project_logo !== 'N/A' ? item.project_logo : `https://api.dicebear.com/7.x/shapes/svg?seed=${item.project_name}`}
              className="w-10 h-10 rounded-xl border border-slate-100 object-cover"
              alt="Logo"
            />
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">{item.project_name || 'Unknown'}</h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.category || 'General'}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-black text-lg text-slate-900">{formattedFunding}</div>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getRoundStyle(item.round)}`}>
              {item.round || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Bottom Row: Investors & Probability */}
        <div className="flex justify-between items-end pt-3 border-t border-slate-50">
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Backers</span>
            <div className="flex items-center gap-2">
              {item.investorProfiles && item.investorProfiles.length > 0 ? (
                <div className="flex -space-x-1.5">
                  {item.investorProfiles.slice(0, 3).map((inv, idx) => (
                    <img 
                      key={idx}
                      src={inv.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.name)}&background=0f172a&color=fff&font-size=0.33`}
                      className="w-5 h-5 rounded-full ring-2 ring-white bg-slate-900 object-cover"
                      alt={inv.name}
                    />
                  ))}
                </div>
              ) : null}
              <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                {item.lead_investor || 'Undisclosed'}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${probData.color}`}>
              <Rocket size={10} /> {probData.probability}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const MobileModal = () => {
    if (!selectedProject) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-bottom-full duration-300">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
          <button onClick={() => setSelectedProject(null)} className="p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <span className="font-black text-slate-900">Project Details</span>
          <div className="w-8"></div> {/* Spacer */}
        </div>

        <div className="p-5 pb-32">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <img 
              src={selectedProject.project_logo && selectedProject.project_logo !== 'N/A' ? selectedProject.project_logo : `https://api.dicebear.com/7.x/shapes/svg?seed=${selectedProject.project_name}`}
              className="w-16 h-16 rounded-2xl border border-slate-200 object-cover shadow-sm"
              alt=""
            />
            <div>
              <h2 className="text-2xl font-black text-slate-900">{selectedProject.project_name}</h2>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{selectedProject.category}</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
            {selectedProject.description || "No description available"}
          </p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Raised</span>
              <span className="text-lg font-black text-slate-900">{formatFundingAmount(selectedProject.funding_amount || selectedProject.amount)}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Round</span>
              <span className="text-sm font-bold text-slate-900">{selectedProject.round || 'TBA'}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lead Backers</h3>
            <div className="flex flex-wrap gap-2">
              {selectedProject.investorProfiles?.map((inv, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full pr-3 p-1">
                  <img src={inv.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.name)}&background=0f172a&color=fff`} className="w-6 h-6 rounded-full" alt="" />
                  <span className="text-[11px] font-bold text-slate-700">{inv.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Research Integration */}
          {selectedProject.ai_research_data && (
            <div className="mt-6">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Activity size={14} className="text-blue-600" /> AI Insights
               </h3>
               <AIResearchPanel rawData={selectedProject.ai_research_data} />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] pb-32 font-sans selection:bg-blue-100">
      
      {/* 1. Use the global Mobile Header */}
      <MobileHeader />

      {/* 2. Add pt-[68px] to push the content below the fixed header */}
      <main className="w-full px-4 pt-[68px]">
        
        {/* SEARCH BAR */}
        <div className="relative w-full mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search projects or VCs..." 
            value={searchTerm}
            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
            className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard title="Total Funded" value={stats.totalProjects} icon={<Layers size={18} className="text-blue-600"/>} colorClass="bg-blue-50" />
          <StatCard title="Mega Rounds" value={stats.megaRounds} icon={<DollarSign size={18} className="text-emerald-600"/>} colorClass="bg-emerald-50" />
          <StatCard title="Active VCs" value={stats.activeVCs} icon={<Users size={18} className="text-purple-600"/>} colorClass="bg-purple-50" />
          <StatCard title="DeFi Focus" value={stats.defiProjects} icon={<Activity size={18} className="text-amber-600"/>} colorClass="bg-amber-50" />
        </div>

        {/* SMART SIGNALS (Mobile Stacked) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-1.5">🧠 Smart Signals</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
              <div><div className="text-[13px] font-bold text-slate-900">AI/DeFi Dominates</div><div className="text-[11px] font-medium text-slate-500">65% of seed rounds in AI & DeFi sectors</div></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
              <div><div className="text-[13px] font-bold text-slate-900">Late-Stage Surge</div><div className="text-[11px] font-medium text-slate-500">Series B+ funding up 42% this quarter</div></div>
            </div>
          </div>
        </div>

        {/* QUICK FILTERS (Scrollable horizontally) */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-2">
          {['All', '1M-10M', '10M-20M', '20M-50M', '50M+'].map(amt => (
            <button 
              key={amt}
              onClick={() => {setFilterAmount(amt); setCurrentPage(1);}}
              className={`px-4 py-2 shrink-0 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors ${filterAmount === amt ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {amt}
            </button>
          ))}
        </div>

        {/* FEED / LIST */}
        <div className="mb-6">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Recent Funding Rounds</h2>
          
          {processedData.length === 0 ? (
            <div className="py-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
              <p className="text-xs font-bold text-slate-400">No projects match your search.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {processedData.slice((currentPage - 1) * 10, currentPage * 10).map(item => (
                <MobileProjectCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {processedData.length > 0 && (
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-2 shadow-sm mb-6">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-3 text-slate-600 active:bg-slate-50 rounded-xl disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Page {currentPage} of {Math.ceil(processedData.length / 10)}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(processedData.length / 10)))}
              disabled={currentPage === Math.ceil(processedData.length / 10)}
              className="p-3 text-slate-600 active:bg-slate-50 rounded-xl disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

      </main>

      <MobileModal />
      <BottomNavigation />
    </div>
  );
}