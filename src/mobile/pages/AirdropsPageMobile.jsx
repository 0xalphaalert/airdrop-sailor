// src/mobile/pages/AirdropsPageMobile.jsx
import React, { useState } from 'react';
import MobileHeader from '../components/navigation/MobileHeader';
import BottomNavigation from '../components/navigation/BottomNavigation';

import GreetingCard from '../components/home/GreetingCard';
import StatsRow from '../components/home/StatsRow';
import TopOpportunityCard from '../components/home/TopOpportunityCard';
import { LayoutGrid, TableProperties, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AirdropsPageMobile({
  loading,
  projects,
  topProject,
  dashboardStats,
  alphaEvents,
  filterFunding,
  setFilterFunding,
  filterTier,
  setFilterTier,
  filterStatus,
  setFilterStatus,
}) {
  // State to manage Card Grid vs Table View toggle
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fa]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] pb-24 font-sans selection:bg-blue-100">
      
      <MobileHeader />

      <main className="w-full pt-[34px] space-y-4">
        <GreetingCard stats={dashboardStats} />
        <StatsRow stats={dashboardStats} />
        <TopOpportunityCard project={topProject} />
        
        {/* --- SINGLE UNIFIED HEADER WITH VIEW TOGGLE --- */}
        <div className="px-4 pt-3 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Airdrop Lists</h3>
          
          {/* Small compact toggle sign */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'card' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid / Cards View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableProperties size={16} />
            </button>
          </div>
        </div>

        {/* --- FILTER PILLS --- */}
        <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 shadow-sm whitespace-nowrap">
            Tier (All)
          </div>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 shadow-sm whitespace-nowrap">
            Funding (All)
          </div>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 shadow-sm whitespace-nowrap">
            Phase (All)
          </div>
        </div>

        {/* --- CONDITIONAL VIEW RENDERING --- */}
        {viewMode === 'card' ? (
          // Mobile Card / Grid View
          <div className="px-4 grid grid-cols-2 gap-3 pb-6">
            {projects.map((p) => (
              <Link 
                key={p.id || p.name}
                to={`/${p.id || p.slug || 'details'}/airdropguide`}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <img 
                      src={p.logo_url || p.project_logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${p.name}`} 
                      alt="" 
                      className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 object-cover" 
                    />
                    <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                      {p.tier || 'Tier 3'}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm truncate">{p.name}</h4>
                  <p className="text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">{p.description || 'Explore airdrop tasks.'}</p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px]">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Funding</span>
                    <span className="font-black text-slate-800">{p.funding || p.funding_amount || 'N/A'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Time Req.</span>
                    <span className="font-black text-blue-600">{p.total_time_estimate ? `${p.total_time_estimate}m` : '~5m'}</span>
                  </div>
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="col-span-2 p-8 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-200">
                No projects found.
              </div>
            )}
          </div>
        ) : (
          // Mobile Table View
          <div className="px-4 pb-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                      <th className="p-3">Project</th>
                      <th className="p-3">Tier</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {projects.map((p) => (
                      <tr key={p.id || p.name} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 flex items-center gap-2.5">
                          <img 
                            src={p.logo_url || p.project_logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${p.name}`} 
                            alt="" 
                            className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 object-cover shrink-0" 
                          />
                          <div className="min-w-0">
                            <div className="font-black text-slate-900 truncate max-w-[120px]">{p.name}</div>
                            <div className="text-[10px] font-bold text-emerald-600 truncate">{p.funding || p.funding_amount || 'Unconfirmed'}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-700 text-[11px]">{p.tier || 'Tier 3'}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                            {p.status || 'Active'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Link 
                            to={`/${p.id || p.slug || 'details'}/airdropguide`} 
                            className="inline-flex items-center justify-center p-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded-lg transition-colors shadow-sm"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-slate-400 font-bold">No projects found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
      </main>

      <BottomNavigation />
      
    </div>
  );
}