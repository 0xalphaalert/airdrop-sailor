import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { 
  Search, Activity, DollarSign, 
  Users, Layers, ChevronUp, ChevronDown 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LabelList 
} from 'recharts';
import AIResearchPanel from './AIResearchPanel';

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

export default function FundraisingPage() {
  const [fundingData, setFundingData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAmount, setFilterAmount] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterRound, setFilterRound] = useState('All');

  // Sorting & Pagination States
  const [sortConfig, setSortConfig] = useState({ key: 'last_updated', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Dynamic filter options
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [uniqueRounds, setUniqueRounds] = useState([]);

  // Modal state
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => { 
    fetchFundraisingData(); 
  }, []);

  const fetchFundraisingData = async () => {
    try {
      setLoading(true);

      // Check Cache First
      const cachedData = sessionStorage.getItem('fundraising_projects_cache');
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setFundingData(parsedData);
        setUniqueCategories([...new Set(parsedData.map(item => item.category).filter(Boolean))].sort());
        setUniqueRounds([...new Set(parsedData.map(item => item.round).filter(Boolean))].sort());
        setLoading(false);
        return; 
      }

      // 🚀 THE UPGRADE: Fetch BOTH Tables simultaneously for maximum speed
      const [fundingRes, pioneerRes] = await Promise.all([
        supabase.from('funding_opportunities').select('*').order('last_updated', { ascending: false }),
        supabase.from('pioneer_profiles').select('name, logo_url')
      ]);

      if (fundingRes.error) throw fundingRes.error;

      // 1. Build a fast "Logo Lookup Dictionary" from pioneer_profiles
      const logoDictionary = {};
      if (pioneerRes.data) {
        pioneerRes.data.forEach(profile => {
          if (profile.name && profile.logo_url) {
            // Use lowercase to ensure perfect matching (e.g., "GSR" matches "gsr")
            logoDictionary[profile.name.toLowerCase().trim()] = profile.logo_url;
          }
        });
      }
      
      // 2. Map the Logos into the Funding Data
      const enrichedData = (fundingRes.data || []).map(item => {
        
        // A. Extract and enrich Investors
        const investorsList = item.lead_investor && item.lead_investor !== 'N/A' 
          ? item.lead_investor.split(',').map(v => v.trim()) 
          : [];
          
        const investorProfiles = investorsList.map(invName => ({
            name: invName,
            // Check dictionary for the logo!
            logo: logoDictionary[invName.toLowerCase()] || null 
        }));

        // B. Enrich the Project Logo (Pioneer Dictionary overrides standard logo)
        const finalProjectLogo = logoDictionary[item.project_name?.toLowerCase().trim()] || item.project_logo;

        return {
          ...item,
          investorProfiles,
          project_logo: finalProjectLogo
        };
      });
      
      // Cache the enriched data so we don't have to map it again!
      if (enrichedData.length > 0) {
        sessionStorage.setItem('fundraising_projects_cache', JSON.stringify(enrichedData));
      }
      
      setFundingData(enrichedData);
      setUniqueCategories([...new Set(enrichedData.map(item => item.category).filter(Boolean))].sort());
      setUniqueRounds([...new Set(enrichedData.map(item => item.round).filter(Boolean))].sort());
      
    } catch (e) { 
      console.error("Data Fetch Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const parseAmount = (amountStr) => {
    if (!amountStr || amountStr.toLowerCase() === 'undisclosed') return 0;
    const valMatch = amountStr.toString().match(/[\d.]+/);
    if (!valMatch) return 0;
    let val = parseFloat(valMatch[0]);
    if (amountStr.toString().toLowerCase().includes('b')) val *= 1000;
    return val;
  };

  const formatFundingAmount = (amountStr) => {
    if (!amountStr || String(amountStr).toLowerCase() === 'undisclosed' || String(amountStr).toLowerCase() === 'n/a') {
      return 'Undisclosed';
    }
    let cleanStr = String(amountStr).replace(/\$/g, '').trim().toUpperCase();
    if (/^[\d.]+$/.test(cleanStr)) cleanStr += 'M';
    return `$${cleanStr}`;
  };

  const renderChains = (chainsData) => {
    if (!chainsData) return 'N/A';
    if (Array.isArray(chainsData)) return chainsData.join(', ');
    return chainsData.replace(/[{""}]/g, '').split(',').join(', ');
  };

  const stats = useMemo(() => {
    const totalProjects = fundingData.length;
    const megaRounds = fundingData.filter(item => parseAmount(item.amount || item.funding_amount) >= 100).length;
    const activeVCs = new Set(fundingData.flatMap(item => item.investorProfiles?.map(i => i.name) || [])).size;
    const defiProjects = fundingData.filter(item => item.category?.toLowerCase().includes('defi')).length;
    
    return { totalProjects, megaRounds, activeVCs, defiProjects };
  }, [fundingData]);

  const chartData = useMemo(() => {
    if (!fundingData.length) return { categories: [], rounds: [], topProjects: [] };

    const catCounts = {};
    fundingData.forEach(item => {
      if (item.category && item.category !== 'N/A') {
        catCounts[item.category] = (catCounts[item.category] || 0) + 1;
      }
    });
    const categories = Object.entries(catCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const roundCounts = {};
    fundingData.forEach(item => {
      if (item.round && item.round !== 'N/A' && item.round !== 'Unknown') {
        roundCounts[item.round] = (roundCounts[item.round] || 0) + 1;
      }
    });
    const rounds = Object.entries(roundCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topProjects = [...fundingData]
      .map(item => ({
        name: item.project_name,
        amount: parseAmount(item.funding_amount || item.amount),
        logo: item.project_logo && item.project_logo !== 'N/A' 
          ? item.project_logo 
          : `https://api.dicebear.com/7.x/shapes/svg?seed=${item.project_name}`
      }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { categories, rounds, topProjects };
  }, [fundingData]);

  const processedData = useMemo(() => {
    let result = fundingData;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.project_name?.toLowerCase().includes(lowerSearch)) || 
        (item.lead_investor?.toLowerCase().includes(lowerSearch))
      );
    }

    if (filterRound !== 'All') result = result.filter(item => item.round === filterRound);
    if (filterCategory !== 'All') result = result.filter(item => item.category === filterCategory);
    if (filterAmount !== 'All') {
      result = result.filter(item => {
        const val = parseAmount(item.funding_amount || item.amount);
        if (val === 0) return false;
        if (filterAmount === '1M-10M') return val >= 1 && val <= 10;
        if (filterAmount === '10M-20M') return val > 10 && val <= 20;
        if (filterAmount === '20M-50M') return val > 20 && val <= 50;
        if (filterAmount === '50M+') return val > 50;
        return true;
      });
    }

    result.sort((a, b) => {
      if (sortConfig.key === 'amount') {
        const valA = parseAmount(a.funding_amount || a.amount);
        const valB = parseAmount(b.funding_amount || b.amount);
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      if (sortConfig.key === 'round') {
        const roundA = a.round || '';
        const roundB = b.round || '';
        return sortConfig.direction === 'asc' ? roundA.localeCompare(roundB) : roundB.localeCompare(roundA);
      }
      return 0; 
    });

    return result;
  }, [fundingData, searchTerm, filterAmount, filterCategory, filterRound, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const resetFilters = () => {
    setSearchTerm(''); setFilterAmount('All'); setFilterCategory('All'); setFilterRound('All');
    setCurrentPage(1);
  };

  const getRoundStyle = (round) => {
    const r = (round || '').toLowerCase();
    if (r.includes('series a')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (r.includes('series b')) return 'bg-purple-50 text-purple-600 border-purple-100';
    if (r.includes('seed')) return 'bg-green-50 text-green-600 border-green-100';
    if (r === 'unknown' || r === 'tba') return 'bg-slate-100 text-slate-500 border-slate-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // 🚀 NEW: Helper function for Airdrop Probability
  const getAirdropProbability = (item) => {
    const funding = parseAmount(item.funding_amount || item.amount);
    const round = (item.round || '').toLowerCase();
    
    let probability = 'Low';
    if (funding > 50) {
      probability = 'High';
    } else if (funding >= 10) {
      probability = 'Medium';
    }
    
    // Optional boost for seed rounds
    if (round.includes('seed') && probability === 'Low') {
      probability = 'Medium';
    }
    
    const colors = {
      'High': 'bg-emerald-50 text-emerald-600',
      'Medium': 'bg-blue-50 text-blue-600', 
      'Low': 'bg-slate-100 text-slate-600'
    };
    
    return { probability, color: colors[probability] };
  };

  // 🚀 NEW: Utility Parser for AI Research Data
  const safeParseAI = (data) => {
    if (!data || typeof data !== 'string') return null;
    
    try {
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

  // 🚀 NEW: Smart Funding Signals Component
  const SmartFundingSignals = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
      <h3 className="text-lg font-black text-slate-900 mb-4">🧠 Smart Signals</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
          <div>
            <div className="text-sm font-bold text-slate-900">AI/DeFi Dominates</div>
            <div className="text-xs text-slate-600">65% of seed rounds in AI & DeFi sectors</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
          <div>
            <div className="text-sm font-bold text-slate-900">Late-Stage Surge</div>
            <div className="text-xs text-slate-600">Series B+ funding up 42% this quarter</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
          <div>
            <div className="text-sm font-bold text-slate-900">VC Concentration</div>
            <div className="text-xs text-slate-600">Top 10 VCs back 40% of deals</div>
          </div>
        </div>
      </div>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="text-xs font-bold text-blue-900 mb-1">💡 Suggested Play</div>
        <div className="text-xs text-blue-700">Focus on early-stage AI projects with {"<$5M"} funding for optimal entry points</div>
      </div>
    </div>
  );

  
  // 🚀 NEW: ProjectDetailModal Component
  const ProjectDetailModal = ({ project, onClose }) => {
    if (!project) return null;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-6xl w-[95%] max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img 
                src={project.project_logo && project.project_logo !== 'N/A' 
                  ? project.project_logo 
                  : `https://api.dicebear.com/7.x/shapes/svg?seed=${project.project_name}`}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                alt=""
              />
              <h2 className="text-xl font-bold text-slate-900">{project.project_name}</h2>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="text-slate-400 text-xl">×</span>
            </button>
          </div>

          {/* Section 1: Description */}
          <div className="mb-6">
            <h3 className="text-sm font-black text-slate-900 mb-2">Description</h3>
            <p className="text-sm text-slate-600">
              {project.description || "No description available"}
            </p>
          </div>

          {/* Section 2: Lead Backers */}
          <div className="mb-6">
            <h3 className="text-sm font-black text-slate-900 mb-2">Lead Backers</h3>
            {project.investorProfiles && project.investorProfiles.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  {project.investorProfiles.slice(0, 3).map((inv, idx) => (
                    <img 
                      key={idx}
                      src={inv.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.name)}&background=0f172a&color=fff&font-size=0.33`}
                      title={inv.name}
                      alt={inv.name}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-900 object-cover"
                    />
                  ))}
                  {project.investorProfiles.length > 3 && (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 text-[10px] font-bold text-slate-600">
                      +{project.investorProfiles.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm text-slate-600">
                  {project.lead_investor || 'N/A'}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-600">{project.lead_investor || 'No lead investors available'}</p>
            )}
          </div>

          {/* Section 3: Research Data */}
          <div className="mb-6">
            <AIResearchPanel rawData={project.ai_research_data}/>
          </div>

          {/* Optional Links */}
          {project.x_link && (
            <div className="flex gap-3">
              <a 
                href={project.x_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
              >
                View on X
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans">
      <div className="max-w-[1200px] mx-auto">
        
        {/* --- HEADER --- */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Fundraising Radar
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Track smart money, venture capital backing, and funding rounds of emerging crypto projects.
          </p>
        </div>

        {/* --- SMART SIGNALS --- */}
        <SmartFundingSignals />

        {/* --- STAT CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Funded Projects" value={stats.totalProjects} icon={<Layers className="w-5 h-5 text-blue-500" />} />
          <StatCard title="Mega Rounds ($100M+)" value={stats.megaRounds} icon={<DollarSign className="w-5 h-5 text-emerald-500" />} />
          <StatCard title="Active VC Firms" value={stats.activeVCs} icon={<Users className="w-5 h-5 text-purple-500" />} />
          <StatCard title="DeFi Projects Funded" value={stats.defiProjects} icon={<Activity className="w-5 h-5 text-amber-500" />} />
        </div>

        {/* --- CHARTS DASHBOARD --- */}
        {!loading && fundingData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Top Categories</h3>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.categories} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                      {chartData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-600 italic">AI & DeFi dominate with 45% of total funding rounds</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Deal Flow by Round</h3>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.rounds} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} width={80} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20}>
                      <LabelList dataKey="value" position="right" fill="#64748b" fontSize={12} fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-600 italic">Seed rounds show strongest activity with 68% of total deals</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Largest Raises ($M)</h3>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.topProjects} margin={{ bottom: 40, top: 15 }}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      interval={0} 
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const project = chartData.topProjects.find(p => p.name === payload.value);
                        return (
                          <foreignObject x={x - 30} y={y} width={60} height={50}>
                            <div xmlns="http://www.w3.org/1999/xhtml" className="flex flex-col items-center justify-center">
                              <img src={project?.logo} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-200 mb-1 bg-white" />
                              <span className="text-[9px] text-slate-500 font-bold truncate w-full text-center">
                                {payload.value}
                              </span>
                            </div>
                          </foreignObject>
                        );
                      }}
                    />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [`$${value}M`, 'Raised']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30}>
                       <LabelList dataKey="amount" position="top" fill="#10B981" fontSize={11} fontWeight={700} formatter={(val) => `$${val}M`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-600 italic">Top 3 raises account for 35% of total capital raised this month</p>
              </div>
            </div>
          </div>
        )}

        {/* --- QUICK FILTER CHIPS --- */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={() => {setFilterAmount('50M+'); setCurrentPage(1);}}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
              filterAmount === '50M+' 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            $50M+
          </button>
          <button 
            onClick={() => {setFilterRound('Seed'); setCurrentPage(1);}}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
              filterRound === 'Seed' 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Seed
          </button>
          <button 
            onClick={() => {setFilterCategory('DeFi'); setCurrentPage(1);}}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
              filterCategory === 'DeFi' 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            DeFi
          </button>
          <button 
            onClick={() => {setFilterCategory('AI'); setCurrentPage(1);}}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
              filterCategory === 'AI' 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            AI
          </button>
        </div>

        {/* --- FILTERS & SEARCH BAR --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect value={filterRound} onChange={(e) => {setFilterRound(e.target.value); setCurrentPage(1);}} options={uniqueRounds} placeholder="Round (All)" />
            <FilterSelect value={filterCategory} onChange={(e) => {setFilterCategory(e.target.value); setCurrentPage(1);}} options={uniqueCategories} placeholder="Category (All)" />
            <FilterSelect value={filterAmount} onChange={(e) => {setFilterAmount(e.target.value); setCurrentPage(1);}} options={['All', '1M-10M', '10M-20M', '20M-50M', '50M+']} placeholder="Amount (All)" />
            <button onClick={resetFilters} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-full transition-colors">Reset</button>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search project or VC..." 
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-800 transition-colors" onClick={() => handleSort('round')}>
                    <div className="flex items-center gap-1">Round {sortConfig.key === 'round' && (sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3"/> : <ChevronUp className="w-3 h-3"/>)}</div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-800 transition-colors" onClick={() => handleSort('amount')}>
                    <div className="flex items-center gap-1">Amount Raised {sortConfig.key === 'amount' && (sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3"/> : <ChevronUp className="w-3 h-3"/>)}</div>
                  </th>
                  <th className="px-6 py-4">Lead Investors / VCs</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Airdrop Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <TableSkeleton rows={8} />
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-16 text-center text-slate-400 font-medium">No projects match your criteria.</td></tr>
                ) : (
                  paginatedData.map((item) => {
                    const formattedFunding = formatFundingAmount(item.funding_amount || item.amount);
                    return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedProject(item)}>
                      
                      {/* Project */}
<td className="px-6 py-4">
  <div className="flex items-center gap-3">
    <img 
      src={item.project_logo && item.project_logo !== 'N/A' ? item.project_logo : `https://api.dicebear.com/7.x/shapes/svg?seed=${item.project_name}`}
      className="w-8 h-8 rounded-lg border border-slate-200 bg-white object-cover shadow-sm"
      onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.project_name)}&background=random`}
      alt="Logo"
    />
    <span className="font-bold text-slate-900">{item.project_name || 'Unknown'}</span>
  </div>
</td>

                      {/* Round */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${getRoundStyle(item.round)}`}>
                          {item.round || 'Unknown'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-black tracking-tight">
                        {formattedFunding === 'Undisclosed' ? (
                          <span className="text-slate-400 italic font-medium">Undisclosed</span>
                        ) : (
                          <span className="text-black-900">
                            {formattedFunding}
                          </span>
                        )}
                      </td>

                      {/* 🚀 UPGRADED: Stacked Investors UI */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar Stack */}
                          {item.investorProfiles && item.investorProfiles.length > 0 && (
                            <div className="flex -space-x-2 overflow-hidden">
                              {item.investorProfiles.slice(0, 3).map((inv, idx) => (
                                <img 
                                  key={idx}
                                  src={inv.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.name)}&background=0f172a&color=fff&font-size=0.33`}
                                  title={inv.name}
                                  alt={inv.name}
                                  className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-slate-900 object-cover shadow-sm"
                                  onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.name)}&background=0f172a&color=fff`}
                                />
                              ))}
                              {item.investorProfiles.length > 3 && (
                                <div className="flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-white bg-slate-100 text-[10px] font-bold text-slate-600 shadow-sm">
                                  +{item.investorProfiles.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Text fallback for truncation */}
                          <span className="font-medium text-slate-700 text-xs max-w-[140px] truncate" title={item.lead_investor}>
                            {item.lead_investor || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                          {item.category || 'N/A'}
                        </span>
                      </td>

                      {/* Airdrop Probability */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${getAirdropProbability(item).color}`}>
                          {getAirdropProbability(item).probability}
                        </span>
                      </td>

                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
          
          {/* --- PAGINATION --- */}
          {!loading && processedData.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-sm font-medium text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} projects
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* --- PROJECT DETAIL MODAL --- */}
      <ProjectDetailModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
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
    className="appearance-none text-sm font-semibold bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-4 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-slate-100 transition-colors cursor-pointer"
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
  >
    <option value="All">{placeholder}</option>
    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

const TableSkeleton = ({ rows }) => (
  <>
    {[...Array(rows)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 py-4"><div className="flex gap-3 items-center"><div className="w-8 h-8 bg-slate-200 rounded-lg"></div><div className="h-4 w-24 bg-slate-200 rounded"></div></div></td>
        <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 rounded-md"></div></td>
        <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 rounded"></div></td>
        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
        <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded"></div></td>
        <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 rounded"></div></td>
      </tr>
    ))}
  </>
);