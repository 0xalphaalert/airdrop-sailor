import React, { useState, useEffect } from "react";
import { useAuth } from '../useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import bannerImg from '../assets/Blue Sailboat at Golden Horizon.png';
import {
  Info, Download, Eye, ArrowUpRight, QrCode, 
  TrendingUp, ArrowDown, ArrowRightLeft, Calendar, 
  Search, ShoppingCart, CalendarCheck, MoreVertical, 
  ChevronLeft, ChevronRight, CheckCircle2, ChevronDown
} from "lucide-react";

import useIsMobile from '../hooks/useIsMobile';
import XPLevelsPageMobile from '../mobile/pages/XPLevelsPageMobile';

export default function XPLevelsPage() {
  const { user, login } = useAuth(); 
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // --- Core Wallet State ---
  const [lifetimeXP, setLifetimeXP] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ earned: 0, spent: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // --- Pagination & Search State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  // For mobile backwards-compatibility (Stubbed to prevent crashes)
  const dailyQuests = [];
  const handleQuestAction = () => {};
  const setSelectedCampaign = () => {};
  const userSubmissions = {};
  const claimingDaily = false;
  const verifyingTask = false;
  const currentStreak = 0;
  const userLevel = Math.floor(lifetimeXP / 1000) + 1;
  const nextLevelXP = userLevel * 1000;
  const remainingXP = nextLevelXP - lifetimeXP;
  const pct = Math.min(1, Math.max(0, (lifetimeXP - (userLevel - 1) * 1000) / 1000));

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      // 1. Fetch Current True Balance
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('lifetime_xp')
        .eq('auth_id', user.id)
        .maybeSingle();
        
      const actualBalance = profile?.lifetime_xp || 0;
      setLifetimeXP(actualBalance);

      // 2. Fetch Complete Ledger (Ordered newest first!)
      const { data: ledgerData } = await supabase
        .from('xp_ledger')
        .select('*')
        .eq('auth_id', user.id)
        .order('created_at', { ascending: false }); 

      if (ledgerData) {
        let runningBalance = actualBalance;
        let earned = 0;
        let spent = 0;

        const mapped = ledgerData.map(tx => {
          const amt = Number(tx.amount) || 0;
          
          // Tally up total earned and spent from the available ledger
          if (amt > 0) earned += amt;
          if (amt < 0) spent += Math.abs(amt);
          
          // The balance displayed for THIS row is the current running balance
          const rowBalance = runningBalance;
          
          // Calculate backwards: subtract this row's amount to find what the balance was BEFORE this transaction
          runningBalance -= amt;
          
          return {
            ...tx,
            runningBalance: rowBalance,
          };
        });

        setStats({ earned, spent, total: ledgerData.length });
        
        // Data is already newest-first, so we just set it directly
        setTransactions(mapped); 
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
      datePart: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timePart: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  // Pagination & Filtering
  const filteredTx = transactions.filter(tx => 
    tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.action_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredTx.length / itemsPerPage);
  const paginatedTx = filteredTx.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isMobile) {
    return (
      <XPLevelsPageMobile 
        userLevel={userLevel}
        lifetimeXP={lifetimeXP}
        nextLevelXP={nextLevelXP}
        remainingXP={remainingXP}
        currentStreak={currentStreak}
        pct={pct}
        dailyQuests={dailyQuests}
        handleQuestAction={handleQuestAction}
        setSelectedCampaign={setSelectedCampaign}
        userSubmissions={userSubmissions}
        claimingDaily={claimingDaily}
        verifyingTask={verifyingTask}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans">
      <div className="max-w-[1200px] mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-black text-[#0F172A] tracking-tight leading-tight">Sail Wallet</h1>
            <p className="text-[14px] font-medium text-slate-500 mt-1">Your SAIL balance and complete transaction history.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5EAF2] rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
              <Info className="w-4 h-4 text-blue-600" /> How to Earn SAIL?
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5EAF2] rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
              <Download className="w-4 h-4 text-slate-500" /> Export History
            </button>
          </div>
        </div>

        {/* HERO BANNER */}
        <div className="relative w-full h-[260px] rounded-[24px] overflow-hidden mb-6 shadow-lg flex items-center px-12 border border-[#E5EAF2]">
           
           {/* Full Width Background Image */}
           <img 
             src={bannerImg} 
             alt="Sail Wallet Background" 
             className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
           />
           
           {/* Dark blue gradient overlay on the left side to ensure the white text stays readable */}
           <div className="absolute inset-0 bg-gradient-to-r from-[#0C41A6] via-[#0C41A6]/80 to-transparent pointer-events-none"></div>

           {/* Left Content */}
           <div className="relative z-10 flex flex-col text-white pt-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium text-blue-50">Your SAIL Balance</span>
                <Eye className="w-4 h-4 text-blue-200" />
              </div>
              <div className="flex items-baseline gap-2.5 mb-2">
                <span className="text-[45px] font-black leading-none tracking-tight text-white drop-shadow-md">{lifetimeXP.toLocaleString()}</span>
                <span className="text-[25px] font-black text-blue-100 drop-shadow-sm">SAIL</span>
              </div>
              <span className="text-[12px] font-medium text-blue-50 mb-3 drop-shadow-sm">= ${(lifetimeXP / 3500).toFixed(2)} USDC</span>
              
              <span className="inline-flex items-center px-3 py-1 bg-white/10 border border-white/20 rounded-md text-[11px] font-bold text-white w-fit backdrop-blur-sm shadow-sm mb-6">
                3500 SAIL = 1 USDC (est.)
              </span>
              
              <div className="flex items-center gap-4">
                 <button className="flex items-center justify-center gap-2 bg-white/95 backdrop-blur-sm text-[#0F172A] hover:bg-white px-6 py-3.5 rounded-[12px] text-[14px] font-black shadow-lg transition-all border border-transparent hover:border-slate-200">
                   <ArrowRightLeft className="w-4 h-4" /> Convert to USDC
                 </button>
              </div>
           </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-[20px] border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.02)] p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <TrendingUp className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Earned</span>
              <span className="text-[20px] font-black text-[#0F172A] leading-none">{stats.earned.toLocaleString()} SAIL</span>
            </div>
          </div>
          
          <div className="bg-white rounded-[20px] border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.02)] p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
              <ArrowDown className="w-6 h-6 text-rose-500" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Spent</span>
              <span className="text-[20px] font-black text-[#0F172A] leading-none">{stats.spent.toLocaleString()} SAIL</span>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.02)] p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <ArrowRightLeft className="w-6 h-6 text-purple-500" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Transactions</span>
              <span className="text-[20px] font-black text-[#0F172A] leading-none">{stats.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="bg-white rounded-[24px] border border-[#E5EAF2] shadow-[0_2px_10px_rgba(15,23,42,0.02)] overflow-hidden">
          
          <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-black text-[#0F172A] tracking-tight">Transaction History</h2>
              <p className="text-[13px] font-medium text-slate-500 mt-1">View all your SAIL transactions.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select className="appearance-none bg-white border border-[#E5EAF2] rounded-xl pl-10 pr-10 py-2.5 text-[13px] font-bold text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 cursor-pointer shadow-sm">
                  <option>All Time</option>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Year</option>
                </select>
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-[240px] pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500">
                  <th className="px-6 lg:px-8 py-4 font-bold flex items-center gap-1 cursor-pointer hover:text-slate-700">Date & Time <ChevronDown className="w-3 h-3"/></th>
                  <th className="px-6 py-4 font-bold">Description</th>
                  <th className="px-6 py-4 font-bold text-right">Amount</th>
                  <th className="px-6 py-4 font-bold text-right">Balance</th>
                  <th className="px-6 lg:px-8 py-4 font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </td>
                  </tr>
                ) : paginatedTx.length > 0 ? (
                  paginatedTx.map((tx, idx) => {
                    const { datePart, timePart } = formatDate(tx.created_at);

                    return (
                      <tr key={tx.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 lg:px-8 py-4">
                          <span className="block text-[13px] font-bold text-slate-700">{datePart}</span>
                          <span className="block text-[11px] font-medium text-slate-400 mt-0.5">{timePart}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="block text-[13px] font-black text-slate-900 leading-tight">
                            {tx.description || tx.action_type || 'System Action'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-[13px] font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} SAIL
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[13px] font-bold text-slate-700">
                            {tx.runningBalance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 lg:px-8 py-4 text-right">
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-3">
                          <Search className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-[13px] font-bold text-slate-600">No transactions found.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Try adjusting your filters or complete a task to earn SAIL.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredTx.length > 0 && (
            <div className="px-6 lg:px-8 py-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-500">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredTx.length)} of {filteredTx.length} transactions
              </span>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5EAF2] text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-black transition-colors ${
                      currentPage === i + 1 
                        ? 'bg-[#2563EB] text-white shadow-sm' 
                        : 'border border-[#E5EAF2] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5EAF2] text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}