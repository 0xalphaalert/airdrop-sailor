import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, DollarSign, Percent, ExternalLink, ShieldAlert, Zap, Filter, ArrowDownUp } from 'lucide-react';
import { scraperDb } from '../scraperClient'; // Fetching from 2nd DB

export default function ExchangeOffers() {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' or 'fees'
  const [campaigns, setCampaigns] = useState([]);
  const [fees, setFees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExchangeData();
  }, []);

  const fetchExchangeData = async () => {
    setIsLoading(true);
    try {
      // Fetch concurrently from the scraper database
      const [campaignsRes, feesRes] = await Promise.all([
        scraperDb.from('exchange_announcements')
                 .select('*')
                 .order('ai_score', { ascending: false })
                 .limit(100),
        scraperDb.from('exchange_fees')
                 .select('*')
                 .order('exchange_name', { ascending: true })
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (feesRes.error) throw feesRes.error;

      setCampaigns(campaignsRes.data || []);
      setFees(feesRes.data || []);
    } catch (error) {
      console.error("Error fetching exchange data:", error);
      alert("Failed to sync exchange intelligence.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to map exchange names to logos/colors
  const getExchangeBranding = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('binance')) return { logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
    if (n.includes('bybit')) return { logo: 'https://cryptologos.cc/logos/bybit-logo.png', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    if (n.includes('kucoin')) return { logo: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
    if (n.includes('okx')) return { logo: 'https://cryptologos.cc/logos/okb-okb-logo.png', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    if (n.includes('bitget')) return { logo: 'https://cryptologos.cc/logos/bitget-token-bgb-logo.png', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' };
    if (n.includes('mexc')) return { logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9721.png', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    return { logo: 'https://via.placeholder.com/40?text=CEX', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  };

  // Formatters
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const formatFee = (val) => {
    if (val === null || val === undefined) return '-';
    return `${(Number(val) * 100).toFixed(2)}%`;
  };

  // Filters
  const filteredCampaigns = campaigns.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.exchange_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFees = fees.filter(f => 
    f.exchange_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Metrics
  const totalPotentialProfit = campaigns.reduce((acc, curr) => acc + (Number(curr.net_profit_estimate) || 0), 0);
  const highlyActionableCount = campaigns.filter(c => c.is_actionable && c.ai_score >= 70).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER & METRICS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exchange Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor promotions, arbitrage opportunities, and fee structures.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Est. Available Profit</p>
            <p className="text-lg font-black text-slate-800">{formatCurrency(totalPotentialProfit)}</p>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Actionable Offers</p>
            <p className="text-lg font-black text-slate-800">{highlyActionableCount}</p>
          </div>
        </div>
      </div>

      {/* CONTROLS (TABS & SEARCH) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-1 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('campaigns')}
            className={`flex shrink-0 items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'campaigns' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <TrendingUp size={16} /> Promotional Campaigns
          </button>
          <button 
            onClick={() => setActiveTab('fees')}
            className={`flex shrink-0 items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'fees' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Percent size={16} /> Fee Structures
          </button>
        </div>
        <div className="relative w-full sm:w-72 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'campaigns' ? 'offers' : 'exchanges'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      {/* MAIN DATA CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Zap className="animate-pulse mb-3 text-blue-500" size={32} />
            <p className="font-bold">Syncing Market Intelligence...</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            
            {/* ============================== */}
            {/* TAB 1: CAMPAIGNS & PROMOTIONS */}
            {/* ============================== */}
            {activeTab === 'campaigns' && (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                    <th className="px-6 py-4">Exchange</th>
                    <th className="px-6 py-4">Offer Details</th>
                    <th className="px-6 py-4">Reward ($)</th>
                    <th className="px-6 py-4">Req. Vol ($)</th>
                    <th className="px-6 py-4">Est. Net Profit</th>
                    <th className="px-6 py-4">AI Score</th>
                    <th className="px-6 py-4 text-right">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCampaigns.length === 0 ? (
                    <tr><td colSpan="7" className="p-10 text-center text-slate-500 font-bold">No promotional campaigns found.</td></tr>
                  ) : (
                    filteredCampaigns.map(offer => {
                      const brand = getExchangeBranding(offer.exchange_name);
                      const isHighProfit = Number(offer.net_profit_estimate) > 50;
                      
                      return (
                        <tr key={offer.id} className="hover:bg-slate-50/80 transition-colors group">
                          {/* Exchange Column */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={brand.logo} alt={offer.exchange_name} className="w-8 h-8 rounded-full border border-slate-200 bg-white object-contain p-0.5 shrink-0" />
                              <span className="font-black text-slate-900 text-sm whitespace-nowrap">{offer.exchange_name}</span>
                            </div>
                          </td>
                          
                          {/* Details Column */}
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{offer.title}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono">{new Date(offer.published_at).toLocaleDateString()}</span>
                              {offer.is_actionable && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">Actionable</span>
                              )}
                            </div>
                          </td>
                          
                          {/* Financials Columns */}
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-emerald-600">{formatCurrency(offer.reward_amount_usd)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-500">{formatCurrency(offer.required_volume_usd)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${isHighProfit ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                              {formatCurrency(offer.net_profit_estimate)}
                            </span>
                          </td>
                          
                          {/* AI Score Column */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-slate-200 rounded-full h-2 max-w-[60px]">
                                <div 
                                  className={`h-2 rounded-full ${offer.ai_score >= 80 ? 'bg-emerald-500' : offer.ai_score >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`} 
                                  style={{ width: `${Math.min(100, Math.max(0, offer.ai_score || 0))}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-black text-slate-700">{offer.ai_score || 0}</span>
                            </div>
                          </td>
                          
                          {/* Actions Column */}
                          <td className="px-6 py-4 text-right">
                            {offer.url ? (
                              <a href={offer.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-lg text-[11px] font-black uppercase transition-colors shadow-sm whitespace-nowrap">
                                Review <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold uppercase">No Link</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* ============================== */}
            {/* TAB 2: FEE STRUCTURES          */}
            {/* ============================== */}
            {activeTab === 'fees' && (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                    <th className="px-6 py-4">Exchange</th>
                    <th className="px-6 py-4">Spot Maker</th>
                    <th className="px-6 py-4">Spot Taker</th>
                    <th className="px-6 py-4">Withdraw (USDT)</th>
                    <th className="px-6 py-4">Withdraw (USDC)</th>
                    <th className="px-6 py-4 text-center">KYC Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFees.length === 0 ? (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-500 font-bold">No fee intelligence found.</td></tr>
                  ) : (
                    filteredFees.map(fee => {
                      const brand = getExchangeBranding(fee.exchange_name);
                      
                      // Highlight cheap withdrawals (<= $1)
                      const isCheapUSDT = Number(fee.usdt_withdrawal_fee) <= 1;
                      const isCheapUSDC = Number(fee.usdc_withdrawal_fee) <= 1;

                      return (
                        <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={brand.logo} alt={fee.exchange_name} className="w-8 h-8 rounded-full border border-slate-200 bg-white object-contain p-0.5 shrink-0" />
                              <span className="font-black text-slate-900 text-sm whitespace-nowrap">{fee.exchange_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-700">{formatFee(fee.spot_maker_fee)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-600">{formatFee(fee.spot_taker_fee)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${isCheapUSDT ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'text-slate-600'}`}>
                              ${Number(fee.usdt_withdrawal_fee || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${isCheapUSDC ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-slate-600'}`}>
                              ${Number(fee.usdc_withdrawal_fee || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {fee.kyc_required ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-black uppercase tracking-wider">
                                <ShieldAlert size={12} /> Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-black uppercase tracking-wider">
                                No KYC
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}