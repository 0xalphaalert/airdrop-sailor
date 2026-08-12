import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, SlidersHorizontal, ChevronDown, Check, 
  ChevronRight, Monitor, Smartphone, Download, 
  Sparkles, RefreshCw, Copy, X, Send, DollarSign,
  ChevronLeft, Layout, CheckCircle2, Users, Type, Loader2, Rocket
} from 'lucide-react';
import { supabase } from '../supabaseClient';

// Initialize Supabase 2 specifically for the Publishing Engine pipeline
import { createClient } from '@supabase/supabase-js';

const engineUrl = import.meta.env.VITE_SUPABASE_2_URL || "https://lrfjeupbfretcfcnqkjg.supabase.co";
const engineKey = import.meta.env.VITE_SUPABASE_2_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZmpldXBiZnJldGNmY25xa2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU0NDIsImV4cCI6MjEwMTAxMTQ0Mn0.K68VdEj839idPdSY9RVOLdH_VnO4JWFIwW0yNIOhxY8";
const engineClient = createClient(engineUrl, engineKey);

// --- PHASE 2: IMPORT THE REGISTRY ---
import { DYNAMIC_REGISTRY } from './registry/dynamicRegistry';

const XLogo = ({ size = 12, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.059z" />
  </svg>
);

const CATEGORIES = [
  { name: 'Funding', icon: <DollarSign size={16} /> },
  { name: 'Project', icon: <Layout size={16} /> },
  { name: 'Task', icon: <CheckCircle2 size={16} /> },
  { name: 'Platform Updates', icon: <RefreshCw size={16} /> },
  { name: 'Discord Roles', icon: <Users size={16} /> },
  { name: 'Tokenomics', icon: <Type size={16} /> },
  { name: 'News', icon: <Type size={16} /> },
  { name: 'Quest Platforms', icon: <Sparkles size={16} /> }
];

const fallbackGradients = [
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-purple-500 to-fuchsia-600',
  'bg-gradient-to-br from-emerald-400 to-teal-500',
  'bg-gradient-to-br from-amber-400 to-orange-500',
  'bg-gradient-to-br from-rose-400 to-red-500',
  'bg-gradient-to-br from-sky-400 to-blue-500'
];

// --- SCHEDULE MODAL COMPONENT ---
function ScheduleModal({ isOpen, onClose, onConfirm, isScheduling }) {
  const [schedules, setSchedules] = useState({
    telegram: { enabled: true, time: '', icon: <Send size={16} className="text-blue-500" />, label: 'Telegram' },
    farcaster: { enabled: true, time: '', icon: <Rocket size={16} className="text-purple-500" />, label: 'Farcaster' },
    binance_square: { enabled: true, time: '', icon: <span className="font-black text-amber-500 text-sm">B</span>, label: 'Binance Square' },
  });

  if (!isOpen) return null;

  const handleToggle = (platform) => {
    setSchedules(prev => ({
      ...prev,
      [platform]: { ...prev[platform], enabled: !prev[platform].enabled }
    }));
  };

  const handleTimeChange = (platform, newTime) => {
    setSchedules(prev => ({
      ...prev,
      [platform]: { ...prev[platform], time: newTime }
    }));
  };

  const handleSubmit = () => {
    const selectedPlatforms = Object.entries(schedules)
      .filter(([_, data]) => data.enabled && data.time !== '')
      .map(([key, data]) => ({
        platform: key,
        scheduled_time: new Date(data.time).toISOString()
      }));

    if (selectedPlatforms.length === 0) {
      alert("Please enable at least one platform and select a date/time.");
      return;
    }

    onConfirm(selectedPlatforms);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isScheduling && onClose()}
      ></div>

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Schedule Multi-Platform Post</h3>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Set independent timelines for each social network engine.</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isScheduling}
            className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors border border-slate-200 shadow-sm disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
            <span className="text-lg leading-none font-bold">𝕏</span>
            <div>
              <h4 className="text-xs font-black text-slate-800">X (Twitter) Engine</h4>
              <p className="text-[11px] font-medium text-slate-500 leading-snug mt-0.5">
                X posts are published via an external scheduler. Analytics will link automatically once posted.
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100 my-2"></div>

          {Object.entries(schedules).map(([key, data]) => (
            <div key={key} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${data.enabled ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${data.enabled ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'}`}>
                  {data.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{data.label}</h4>
                  <label className="flex items-center gap-2 mt-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={data.enabled}
                      onChange={() => handleToggle(key)}
                      disabled={isScheduling}
                      className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {data.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="w-44">
                <input 
                  type="datetime-local"
                  value={data.time}
                  onChange={(e) => handleTimeChange(key, e.target.value)}
                  disabled={!data.enabled || isScheduling}
                  className={`w-full text-xs font-bold rounded-lg px-3 py-2 border outline-none transition-colors ${data.enabled ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white' : 'bg-slate-50 border-transparent text-slate-400 cursor-not-allowed'}`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isScheduling}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isScheduling}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-md shadow-blue-600/20"
          >
            {isScheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isScheduling ? 'Processing...' : 'Confirm Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreatorStudio() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // --- STATE ---
  const [activeCategory, setActiveCategory] = useState('Funding');
  
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  
  const [availableDesigns, setAvailableDesigns] = useState([]);
  const [activeDesign, setActiveDesign] = useState(null);
  
  const [previewScale, setPreviewScale] = useState(0.45);
  const [sourceData, setSourceData] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [investorLogos, setInvestorLogos] = useState({});
  const [investorHandles, setInvestorHandles] = useState({});
  const [generatedTweet, setGeneratedTweet] = useState({ 
    x_post: '', 
    tg_post: '', 
    fc_post: '', 
    bs_post: '' 
  });

  // --- SCHEDULING STATE ---
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const scaleX = (width - 40) / 1200;
      const scaleY = (height - 40) / 675;
      setPreviewScale(Math.min(scaleX, scaleY));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from('studio_templates')
        .select('*')
        .eq('category', activeCategory)
        .eq('active', true)
        .order('created_at');

      if (error) {
        console.error("Error fetching templates:", error.message);
        return;
      }

      if (data && data.length > 0) {
        const uniqueTemplates = Array.from(new Map(data.map(item => [item.name, item])).values());
        setAvailableTemplates(uniqueTemplates);
        setActiveTemplate(uniqueTemplates[0]);
      } else {
        setAvailableTemplates([]);
        setActiveTemplate(null);
      }
    };
    fetchTemplates();
  }, [activeCategory]);

  useEffect(() => {
    const fetchDesigns = async () => {
      if (!activeTemplate?.id) {
        setAvailableDesigns([]);
        setActiveDesign(null);
        return;
      }

      const { data, error } = await supabase
        .from('template_designs')
        .select('*')
        .eq('template_id', activeTemplate.id)
        .eq('active', true)
        .order('display_order');

      if (error) return;

      setAvailableDesigns(data || []);
      setActiveDesign(data && data.length > 0 ? data[0] : null);
    };
    fetchDesigns();
  }, [activeTemplate]);

  useEffect(() => {
  const fetchSourceData = async () => {
    if (activeCategory === 'News') {
      setSourceData([]);
      setSelectedItemIds([]);
      return;
    }

    setIsLoadingData(true);
    setSourceData([]);
    setSelectedItemIds([]);

    try {
      let mappedData = [];

      if (activeCategory === 'Funding') {
        const parseAmt = (val) => {
          if (!val) return 0;
          let m = 1;
          const s = String(val).toUpperCase();
          if (s.includes('B')) m = 1000000000;
          else if (s.includes('M')) m = 1000000;
          else if (s.includes('K')) m = 1000;
          const n = parseFloat(s.replace(/[^0-9.]/g, ''));
          return isNaN(n) ? 0 : n * m;
        };
        
        const formatAmt = (n) => {
          if (n >= 1e9) return `$${(n/1e9).toFixed(1).replace(/\.0$/, '')}B`;
          if (n >= 1e6) return `$${(n/1e6).toFixed(1).replace(/\.0$/, '')}M`;
          return `$${n}`;
        };

        if (activeTemplate?.name === 'Top Funding Category') {
          const { data } = await supabase.from('funding_opportunities').select('*');
          if (data) {
            const catMap = {};
            data.forEach(d => {
              const catName = d.category || 'Other';
              if (!catMap[catName]) catMap[catName] = { deals: 0, total: 0 };
              catMap[catName].deals += 1;
              catMap[catName].total += parseAmt(d.funding_amount);
            });

            mappedData = Object.keys(catMap).map((cat, i) => ({
              id: `cat-${i}`,
              name: cat,
              amount: formatAmt(catMap[cat].total),
              round: `${catMap[cat].deals} Deals`,
              logo: `https://api.dicebear.com/7.x/shapes/svg?seed=${cat}`,
              raw: { amount: formatAmt(catMap[cat].total), deals: catMap[cat].deals, seed: cat }
            })).sort((a, b) => parseAmt(b.amount) - parseAmt(a.amount));
          }
        } else if (activeTemplate?.name === 'Top Investors This Week') {
          const { data } = await supabase.from('funding_opportunities').select('*').order('last_updated', { ascending: false }).limit(200);
          if (data) {
            const investorMap = {};
            data.forEach(d => {
              if (!d.lead_investor) return;
              const handles = d.lead_investor.split(',').map(s => s.trim()).filter(Boolean);
              const amt = parseAmt(d.funding_amount);
              
              handles.forEach(handle => {
                if (!investorMap[handle]) investorMap[handle] = { handle, totalInvested: 0, projects: [] };
                investorMap[handle].totalInvested += amt;
                investorMap[handle].projects.push({ name: d.project_name, logo: d.project_logo });
              });
            });

            const uniqueHandles = Object.keys(investorMap);
            let profileMap = {};
            if (uniqueHandles.length > 0) {
              const { data: profiles } = await supabase.from('pioneer_profiles').select('handle, name, logo_url, tier').in('handle', uniqueHandles);
              if (profiles) profiles.forEach(p => { profileMap[p.handle] = p; });
            }

            mappedData = Object.values(investorMap).filter(inv => inv.totalInvested > 0).sort((a, b) => b.totalInvested - a.totalInvested).map((inv) => {
                const profile = profileMap[inv.handle] || {};
                const finalName = profile.name || inv.handle;
                return {
                  id: `inv-${inv.handle}`,
                  name: finalName,
                  amount: formatAmt(inv.totalInvested),
                  logo: profile.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${finalName}`,
                  raw: { investor_name: finalName, total_invested: formatAmt(inv.totalInvested), tier: profile.tier || 'Tier 3', logo_url: profile.logo_url, projects: inv.projects }
                };
              });
          }
        } else {
          const { data } = await supabase.from('funding_opportunities').select('*').order('last_updated', { ascending: false }).limit(50);
          if (data) mappedData = data.map(d => ({ id: d.id, name: d.project_name, amount: d.funding_amount, round: d.round, logo: d.project_logo, raw: d }));
        }
      } else if (activeCategory === 'Project') {
        const { data } = await supabase.from('projects').select('*, tasks(*), discord_roles(*)').limit(50);
        if (data) mappedData = data.map(d => ({ id: d.id, name: d.name, amount: d.tier, round: d.status, logo: d.logo_url, raw: d }));
      } else if (activeCategory === 'Task') {
        const { data } = await supabase.from('tasks').select('*, projects(slug, name, logo_url, tier, funding, x_link)').limit(50);
        if (data) mappedData = data.map(d => ({ id: d.id, name: d.name, amount: d.projects?.name, round: d.recurring, logo: d.projects?.logo_url, raw: d }));
      } else if (activeCategory === 'Discord Roles') {
        const { data } = await supabase.from('projects').select('*, discord_roles(*)').limit(100);
        
        if (data) {
          const projectsWithRoles = data.filter(d => d.discord_roles && d.discord_roles.length > 0);
          mappedData = projectsWithRoles.map(d => ({ 
            id: d.id, 
            name: d.name, 
            amount: `${d.discord_roles.length} Active Roles`, 
            round: d.status, 
            logo: d.logo_url, 
            raw: d 
          }));
        }
      } else if (activeCategory === 'Tokenomics') {
        // --- FETCH ONLY PROJECTS WITH VALID TOKENOMICS DETAILS ---
        const { data } = await supabase
          .from('projects')
          .select('*')
          .not('tokenomics_details', 'is', null)
          .order('created_at', { ascending: false });

        if (data) {
          const validProjects = data.filter(d => {
            if (!d.tokenomics_details) return false;
            try {
              const parsed = typeof d.tokenomics_details === 'string' ? JSON.parse(d.tokenomics_details) : d.tokenomics_details;
              if (Array.isArray(parsed)) {
                if (parsed.length === 0) return false;
                return parsed.some(item => item && (item.ticker || item.total_supply || item.community_allocation_percentage || item.investor_allocation_percentage || item.team_allocation_percentage || item.ecosystem_allocation_percentage));
              }
              if (typeof parsed === 'object' && parsed !== null) {
                return Boolean(parsed.ticker || parsed.total_supply || parsed.community_allocation_percentage || parsed.investor_allocation_percentage || parsed.team_allocation_percentage || parsed.ecosystem_allocation_percentage);
              }
            } catch (e) {
              return false;
            }
            return false;
          });

          mappedData = validProjects.map(d => {
            let tDetails = {};
            try {
              const parsed = typeof d.tokenomics_details === 'string' ? JSON.parse(d.tokenomics_details) : d.tokenomics_details;
              tDetails = Array.isArray(parsed) ? (parsed[0] || {}) : (parsed || {});
            } catch(e) {}
            
            const tickerStr = tDetails.ticker ? `$${tDetails.ticker.replace(/^\$+/, '').toUpperCase()}` : '$TOKEN';
            const supplyNum = parseInt(tDetails.total_supply);
            const supplyStr = !isNaN(supplyNum) ? `${supplyNum.toLocaleString()} Supply` : 'Tokenomics Ready';

            return { 
              id: d.id, 
              name: d.name, 
              amount: `${tickerStr} • ${supplyStr}`, 
              round: d.status || 'Active', 
              logo: d.logo_url, 
              raw: d 
            };
          });
        }
      }

      setSourceData(mappedData);
      if (mappedData.length > 0) setSelectedItemIds([mappedData[0].id]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };
  fetchSourceData();
}, [activeCategory, activeTemplate?.name]);

  useEffect(() => {
    const fetchInvestorProfiles = async () => {
      if (selectedItemIds.length === 0) return;
      const selectedFullData = sourceData.filter(d => selectedItemIds.includes(d.id));
      const names = selectedFullData.flatMap(item => (item.raw?.lead_investor || item.raw?.lead_investors || '').split(',').map(n => n.trim())).filter(Boolean);
      if (names.length === 0) return;

      const { data } = await supabase.from('pioneer_profiles').select('name, logo_url, handle').in('name', [...new Set(names)]);
      if (data) {
        const logoMap = data.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.logo_url }), {});
        const handleMap = data.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.handle }), {});
        setInvestorLogos(logoMap);
        setInvestorHandles(handleMap);
      }
    };
    fetchInvestorProfiles();
  }, [selectedItemIds, sourceData]);

  const parseField = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return null; }
    }
    return value;
  };

  const handleGenerateCaptions = async () => {
    if (!activeTemplate || selectedItemIds.length === 0) return alert("Select a format and data source.");

    // --- FETCH LIVE MARKET DATA ---
    let btcPrice = '$64,000+';
    let ethPrice = '$3,400+';
    let solPrice = '$140+';
    let marketSentiment = 'Neutral';
    let ethGwei = '15'; // Using a placeholder for Gwei as gas APIs usually require private API keys

    try {
      // 1. Fetch live prices from CoinGecko
      const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
      const prices = await priceRes.json();
      if (prices.bitcoin?.usd) btcPrice = `$${prices.bitcoin.usd.toLocaleString()}`;
      if (prices.ethereum?.usd) ethPrice = `$${prices.ethereum.usd.toLocaleString()}`;
      if (prices.solana?.usd) solPrice = `$${prices.solana.usd.toLocaleString()}`;

      // 2. Fetch live Fear & Greed Index
      const fngRes = await fetch('https://api.alternative.me/fng/?limit=1');
      const fng = await fngRes.json();
      if (fng?.data?.[0]?.value_classification) marketSentiment = fng.data[0].value_classification;
    } catch (e) {
      console.log('Error fetching live market data. Using fallbacks.', e);
    }

    const selectedFullData = sourceData.filter(d => selectedItemIds.includes(d.id));
    const data = selectedFullData[0]?.raw || {};

    const xTemplate = activeTemplate.twitter_prompt || "";
    const tgTemplate = activeTemplate.telegram_prompt || "";
    const fcTemplate = activeTemplate.farcaster_prompt || "";
    const bsTemplate = activeTemplate.binance_square_prompt || "";

    const rawInvestors = (data.lead_investor || data.lead_investors || '').split(',').map(i => i.trim()).filter(Boolean);
    const formattedHandles = rawInvestors.map(name => investorHandles[name] ? `@${investorHandles[name]}` : name).join('\n');

    const selectedList = selectedFullData.map(item => item.raw || item);

    const parseAmt = (val) => {
      if (!val) return 0;
      const s = String(val).toUpperCase();
      let m = 1;
      if (s.includes('B')) m = 1000000000;
      else if (s.includes('M')) m = 1000000;
      else if (s.includes('K')) m = 1000;
      const n = parseFloat(s.replace(/[^0-9.]/g, ''));
      return isNaN(n) ? 0 : n * m;
    };

    let totalNumeric = 0;
    let highestItem = null;
    let maxAmt = 0;
    const sectorCounts = {};
    const investorCounts = {};

    selectedList.forEach(item => {
      const amtStr = item.funding || item.funding_amount || '';
      const amt = parseAmt(amtStr);
      totalNumeric += amt;

      if (amt > maxAmt) {
        maxAmt = amt;
        highestItem = item;
      }

      const cat = item.category || item.sector || 'Crypto';
      sectorCounts[cat] = (sectorCounts[cat] || 0) + 1;

      const invStr = item.lead_investors || item.lead_investor || '';
      if (invStr) {
        invStr.split(',').forEach(inv => {
          const trimmed = inv.trim();
          if (trimmed) investorCounts[trimmed] = (investorCounts[trimmed] || 0) + 1;
        });
      }
    });

    const formatTotal = (n) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B+` : `$${(n / 1e6).toFixed(0)}M+`;
    const topSector = Object.keys(sectorCounts).sort((a, b) => sectorCounts[b] - sectorCounts[a])[0] || 'DeFi';
    const topInvestor = Object.keys(investorCounts).sort((a, b) => investorCounts[b] - investorCounts[a])[0] || 'Top VCs';

    // --- TOP 5 CONFIRMED AIRDROPS LIST BUILDERS ---
    const top5ConfirmedXList = selectedList.slice(0, 5).map((item) => {
      const name = item.name || item.project_name;
      const handleStr = item.x_link ? `@${item.x_link.split('/').pop()}` : name;
      const investors = item.lead_investors || item.lead_investor || 'Tier 1 investors';
      const funding = item.funding || item.funding_amount || 'TBA';

      let steps = [];
      if (item.tasks && Array.isArray(item.tasks) && item.tasks.length > 0) {
        const t = item.tasks[0];
        const postJson = parseField(t.post_json);
        if (postJson?.steps && Array.isArray(postJson.steps)) {
          steps = postJson.steps.slice(0, 3).map((s, i) => `${i + 1}. ${s.action || s.name}`);
        } else if (t.tutorial_markdown) {
          const matches = t.tutorial_markdown.match(/\d+\.\s+([^\n]+)/g);
          if (matches) steps = matches.slice(0, 3).map((s, i) => `${i + 1}. ${s.replace(/^\d+\.\s+/, '')}`);
        }
      }
      if (steps.length === 0) {
        steps = ['1. Connect Wallet & Claim Testnet Faucet', '2. Interact with Protocol & Perform Swaps', '3. Accumulate Points for Daily Check-in'];
      }

      return `🔹 ${name} Testnet\n\n${name} raised ${funding} from Tier 1 investors ${investors}\n\nGuide Below 👇\n\n${steps.join('\n')}`;
    }).join('\n\n');

    const top5ConfirmedTelegramList = selectedList.slice(0, 5).map((item) => {
      const name = item.name || item.project_name;
      const status = item.status || 'Testnet Live';
      const slug = item.slug || item.id || name.toLowerCase();
      return `🔹 [${name} – ${status}](https://airdropsailor.xyz/${slug}/airdropguide)`;
    }).join('\n');

    const top5ConfirmedFarcasterList = selectedList.slice(0, 5).map((item) => {
      const name = item.name || item.project_name;
      const funding = item.funding || item.funding_amount || 'TBA';
      const status = item.status || 'Active Campaign';
      return `• ${name} — ${funding !== 'TBA' ? `${funding} raised` : status}`;
    }).join('\n');

    const top5ConfirmedBinanceList = selectedList.slice(0, 5).map((item, idx) => {
      const name = item.name || item.project_name;
      const funding = item.funding || item.funding_amount || 'TBA';
      const investors = item.lead_investors || item.lead_investor || 'Top VCs';
      const status = item.status || 'Points Campaign';

      let steps = [];
      if (item.tasks && Array.isArray(item.tasks) && item.tasks.length > 0) {
        const t = item.tasks[0];
        const postJson = parseField(t.post_json);
        if (postJson?.steps && Array.isArray(postJson.steps)) {
          steps = postJson.steps.slice(0, 3).map(s => `• ${s.action || s.name}`);
        } else if (t.tutorial_markdown) {
          const matches = t.tutorial_markdown.match(/\d+\.\s+([^\n]+)/g);
          if (matches) steps = matches.slice(0, 3).map((s) => `• ${s.replace(/^\d+\.\s+/, '')}`);
        }
      }
      if (steps.length === 0) {
        steps = ['• Claim Faucet / Connect Wallet', '• Swap Tokens / Perform Daily Actions', '• Mint USDZ / Accumulate Points'];
      }

      return `${idx + 1}️⃣ ${name}\n\nFunding: ${funding}\n\nBacked by: ${investors}\n\nCurrent Phase:\n• ${status}\n\nGetting Started\n\n${steps.join('\n')}`;
    }).join('\n\n━━━━━━━━━━━━━━\n\n');

    // --- TOP 5 TESTNET AIRDROPS LIST BUILDERS ---
    const top5TestnetXList = selectedList.slice(0, 5).map((item) => {
      const name = item.name || item.project_name;
      const handleStr = item.x_link ? `@${item.x_link.split('/').pop()}` : name;
      const investors = item.lead_investors || item.lead_investor || 'Tier 1 investors';
      const funding = item.funding || item.funding_amount || 'TBA';

      let steps = [];
      if (item.tasks && Array.isArray(item.tasks) && item.tasks.length > 0) {
        const t = item.tasks[0];
        const postJson = parseField(t.post_json);
        if (postJson?.steps && Array.isArray(postJson.steps)) {
          steps = postJson.steps.slice(0, 3).map((s, i) => `${i + 1}. ${s.action || s.name}`);
        } else if (t.tutorial_markdown) {
          const matches = t.tutorial_markdown.match(/\d+\.\s+([^\n]+)/g);
          if (matches) steps = matches.slice(0, 3).map((s, i) => `${i + 1}. ${s.replace(/^\d+\.\s+/, '')}`);
        }
      }
      if (steps.length === 0) {
        steps = ['1. Connect Wallet & Claim Testnet Faucet', '2. Interact with Protocol & Perform Swaps', '3. Accumulate Points for Daily Check-in'];
      }

      return `🔹 ${name} Testnet\n\n${name} raised ${funding} from Tier 1 investors ${investors}\n\nGuide Below 👇\n\n${steps.join('\n')}`;
    }).join('\n\n');

    const top5TestnetTelegramList = selectedList.slice(0, 5).map((item) => {
      const name = item.name || item.project_name;
      const status = item.status || 'Testnet Live';
      const slug = item.slug || item.id || name.toLowerCase();
      return `🔹 [${name} – ${status}](https://airdropsailor.xyz/${slug}/airdropguide)`;
    }).join('\n');

    const top5TestnetFarcasterList = selectedList.slice(0, 5).map((item) => {
      const name = item.name || item.project_name;
      const funding = item.funding || item.funding_amount || 'TBA';
      const status = item.status || 'Active Campaign';
      return `• ${name} — ${funding !== 'TBA' ? `${funding} raised` : status}`;
    }).join('\n');

    const top5TestnetBinanceList = selectedList.slice(0, 5).map((item, idx) => {
      const name = item.name || item.project_name;
      const funding = item.funding || item.funding_amount || 'TBA';
      const investors = item.lead_investors || item.lead_investor || 'Top VCs';
      const status = item.status || 'Testnet';

      let steps = [];
      if (item.tasks && Array.isArray(item.tasks) && item.tasks.length > 0) {
        const t = item.tasks[0];
        const postJson = parseField(t.post_json);
        if (postJson?.steps && Array.isArray(postJson.steps)) {
          steps = postJson.steps.slice(0, 3).map(s => `• ${s.action || s.name}`);
        } else if (t.tutorial_markdown) {
          const matches = t.tutorial_markdown.match(/\d+\.\s+([^\n]+)/g);
          if (matches) steps = matches.slice(0, 3).map((s) => `• ${s.replace(/^\d+\.\s+/, '')}`);
        }
      }
      if (steps.length === 0) {
        steps = ['• Claim Faucet / Connect Wallet', '• Swap Tokens / Perform Daily Actions', '• Mint USDZ / Accumulate Points'];
      }

      return `${idx + 1}️⃣ ${name}\n\nFunding: ${funding}\n\nBacked by: ${investors}\n\nCurrent Phase:\n• ${status}\n\nGetting Started\n\n${steps.join('\n')}`;
    }).join('\n\n━━━━━━━━━━━━━━\n\n');

    // --- TOP 10 FUNDING WEEKLY LIST BUILDERS ---
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    const top10XList = selectedList.slice(0, 10).map((item, idx) => {
      const pName = item.project_name || item.name || 'Project';
      const amt = item.funding_amount || item.funding || item.amount || 'TBA';
      const inv = item.lead_investors || item.lead_investor || 'Top VCs';
      const handle = item.x_link ? `@${item.x_link.split('/').pop()}` : (item.twitter_handle ? `@${item.twitter_handle}` : pName);
      return `${idx + 1}. ${pName} (${handle})\n💰 ${amt} raised\n🤝 Backed by: ${inv}`;
    }).join('\n\n');

    const top10TelegramList = selectedList.slice(0, 10).map((item, idx) => {
      const badge = medals[idx] || `${idx + 1}️⃣`;
      const pName = item.project_name || item.name || 'Project';
      const amt = item.funding_amount || item.funding || item.amount || 'TBA';
      return `${badge} ${pName} — ${amt}`;
    }).join('\n\n');

    const top10BinanceList = selectedList.slice(0, 10).map((item, idx) => {
      const pName = item.project_name || item.name || 'Project';
      const amt = item.funding_amount || item.funding || item.amount || 'TBA';
      const inv = item.lead_investors || item.lead_investor || 'Top VCs';
      const roundStr = item.round || item.funding_round || item.status || 'Seed';
      const sectorStr = item.category || item.sector || 'Crypto';
      return `${idx + 1}️⃣ ${pName}\n\n• Raised: ${amt} (${roundStr})\n• Lead Investors: ${inv}\n• Sector: ${sectorStr}`;
    }).join('\n\n━━━━━━━━━━━━━━\n\n');

    const top10FarcasterList = selectedList.slice(0, 10).map((item, idx) => {
      const pName = item.project_name || item.name || 'Project';
      const amt = item.funding_amount || item.funding || item.amount || 'TBA';
      return `${idx + 1}. ${pName} — ${amt}`;
    }).join('\n');

    // --- TOP 10 TASKS THIS WEEK LIST BUILDERS (ADDITIVE) ---
    const top10TasksXList = selectedList.slice(0, 10).map((item) => {
      const projObj = item.projects || item;
      const pName = projObj.name || projObj.project_name || item.name || 'Project';
      const realXLink = projObj.x_link || item.x_link || '';
      const cleanXLink = realXLink.replace(/\/+$/, '');
      const handleStr = cleanXLink ? `@${cleanXLink.split('/').pop()}` : pName;

      const tName = item.name || item.tasks?.[0]?.name || 'Active Task';
      const tTime = item.time_minutes || item.total_time_estimate || '5';
      const tCost = item.cost && item.cost !== '0' ? `$${item.cost}` : 'Free to Complete';

      let steps = [];
      const postJson = parseField(item.post_json || item.tasks?.[0]?.post_json);
      if (postJson?.steps && Array.isArray(postJson.steps)) {
        steps = postJson.steps.slice(0, 3).map(s => `• ${s.action || s.name}`);
      } else if (item.tutorial_markdown || item.tasks?.[0]?.tutorial_markdown) {
        const md = item.tutorial_markdown || item.tasks?.[0]?.tutorial_markdown;
        const matches = md.match(/\d+\.\s+([^\n]+)/g);
        if (matches) steps = matches.slice(0, 3).map(s => `• ${s.replace(/^\d+\.\s+/, '')}`);
      }
      if (steps.length === 0) {
        steps = ['• Connect Wallet', '• Complete Missions', '• Claim Daily Rewards'];
      }

      const pUrl = postJson?.primary_url || item.link || item.external_link || projObj.x_link || 'https://airdropsailor.xyz';

      return `🔹 ${pName} (${handleStr})\n\nTask: ${tName}\n\n⏱️ ${tTime} mins\n💰 ${tCost}\n\nGuide Below 👇\n\n${steps.join('\n')}\n\n${pUrl}`;
    }).join('\n\n');

    const top10TasksTelegramList = selectedList.slice(0, 10).map((item, idx) => {
      const projObj = item.projects || item;
      const pName = projObj.name || projObj.project_name || item.name || 'Project';
      const tName = item.name || item.tasks?.[0]?.name || 'Active Task';
      return `${idx + 1}. ${pName}- ${tName}`;
    }).join('\n\n');

    const top10TasksFarcasterList = selectedList.slice(0, 10).map((item) => {
      const projObj = item.projects || item;
      const pName = projObj.name || projObj.project_name || item.name || 'Project';
      const tName = item.name || item.tasks?.[0]?.name || 'Active Task';
      return `• ${pName}- ${tName}`;
    }).join('\n');

    const top10TasksBinanceList = selectedList.slice(0, 10).map((item) => {
      const projObj = item.projects || item;
      const pName = projObj.name || projObj.project_name || item.name || 'Project';
      const tName = item.name || item.tasks?.[0]?.name || 'Active Task';
      return `• ${pName}- ${tName}`;
    }).join('\n');

    // --- DAILY TASKS ALERT LIST BUILDERS (ADDITIVE) ---
    const now = new Date();
    const formattedShortDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getFullYear()).slice(-2)}`;
    const formattedFullDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    // X / Farcaster / Binance List Format
    const dailyTasksXList = selectedList.map((item, idx) => {
      const projObj = item.projects || item;
      const realXLink = projObj.x_link || item.x_link || '';
      const cleanXLink = realXLink.replace(/\/+$/, '');
      const handleStr = cleanXLink ? `@${cleanXLink.split('/').pop()}` : (projObj.name || item.name || 'Project');
      
      const tName = item.name || item.tasks?.[0]?.name || 'Task released';
      const postJson = parseField(item.post_json || item.tasks?.[0]?.post_json);
      const primaryUrl = postJson?.primary_url || item.link || item.external_link || 'http://airdropsailor.xyz';

      return `${idx + 1}. ${handleStr} ${tName}.\n${primaryUrl}`;
    }).join('\n\n');

    // Telegram Main Tasks List (Embedded Markdown Links)
    const dailyTasksTelegramList = selectedList.map((item) => {
      const projObj = item.projects || item;
      const pName = projObj.name || projObj.project_name || item.name || 'Project';
      const tName = item.name || item.tasks?.[0]?.name || 'Active Task';
      const postJson = parseField(item.post_json || item.tasks?.[0]?.post_json);
      const primaryUrl = postJson?.primary_url || item.link || item.external_link || 'http://airdropsailor.xyz';

      // The [Text](URL) format makes it a clean, clickable embedded link in Telegram
      return `🔹 [${pName}: ${tName}](${primaryUrl})`;
    }).join('\n');

    // --- FETCH YESTERDAY'S DISCORD ROLES & FUNDING ---
    let dailyTasksDiscordList = '🔹 No new discord roles yesterday.';
    let dailyTasksFundingList = '🔵 No major funding announcements yesterday.';

    try {
      // Calculate yesterday's start and end times
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const startOfYesterday = new Date(yesterdayDate.setUTCHours(0, 0, 0, 0)).toISOString();
      const endOfYesterday = new Date(yesterdayDate.setUTCHours(23, 59, 59, 999)).toISOString();

      // 1. Fetch Yesterday's Discord Roles
      const { data: discordRoles } = await supabase
        .from('discord_roles')
        .select('role_name, projects(name, x_link)')
        .gte('created_at', startOfYesterday)
        .lte('created_at', endOfYesterday);

      if (discordRoles && discordRoles.length > 0) {
        dailyTasksDiscordList = discordRoles.map(role => {
          const pName = role.projects?.name || 'Project';
          return `🔹 ${pName}: ${role.role_name} role verification open.`;
        }).join('\n');
      }

      // 2. Fetch Yesterday's Funding Opportunities
      const { data: fundings } = await supabase
        .from('funding_opportunities')
        .select('project_name, funding_amount, lead_investor, lead_investors')
        .gte('created_at', startOfYesterday)
        .lte('created_at', endOfYesterday);

      if (fundings && fundings.length > 0) {
        dailyTasksFundingList = fundings.map(fund => {
          const pName = fund.project_name || 'Project';
          const amt = fund.funding_amount || 'undisclosed amount';
          const investors = fund.lead_investor || fund.lead_investors || 'Tier 1 Investors';
          return `🔹 ${pName} raised ${amt} from ${investors}.`;
        }).join('\n');
      }
    } catch (e) {
      console.log('Error fetching yesterday data', e);
    }

    // Substitute Weekly / Multi-Item Placeholders
    const replaceWeeklyPlaceholders = (template) => {
      return template
        .replaceAll('{{total_raised}}', formatTotal(totalNumeric))
        .replaceAll('{{total_deals}}', selectedList.length.toString())
        .replaceAll('{{top_sector}}', topSector)
        .replaceAll('{{top_investor}}', topInvestor)
        .replaceAll('{{highest_raise}}', highestItem ? `${highestItem.name || highestItem.project_name} (${highestItem.funding || highestItem.funding_amount})` : 'TBA')
        .replaceAll('{{top_5_confirmed_x_list}}', top5ConfirmedXList)
        .replaceAll('{{top_5_confirmed_telegram_list}}', top5ConfirmedTelegramList)
        .replaceAll('{{top_5_confirmed_farcaster_list}}', top5ConfirmedFarcasterList)
        .replaceAll('{{top_5_confirmed_binance_list}}', top5ConfirmedBinanceList)
        .replaceAll('{{top_5_testnet_x_list}}', top5TestnetXList)
        .replaceAll('{{top_5_testnet_telegram_list}}', top5TestnetTelegramList)
        .replaceAll('{{top_5_testnet_farcaster_list}}', top5TestnetFarcasterList)
        .replaceAll('{{top_5_testnet_binance_list}}', top5TestnetBinanceList)
        .replaceAll('{{top_10_x_list}}', top10XList)
        .replaceAll('{{top_10_telegram_list}}', top10TelegramList)
        .replaceAll('{{top_10_binance_list}}', top10BinanceList)
        .replaceAll('{{top_10_farcaster_list}}', top10FarcasterList)
        .replaceAll('{{top_10_tasks_x_list}}', top10TasksXList)
        .replaceAll('{{top_10_tasks_telegram_list}}', top10TasksTelegramList)
        .replaceAll('{{top_10_tasks_farcaster_list}}', top10TasksFarcasterList)
        .replaceAll('{{top_10_tasks_binance_list}}', top10TasksBinanceList)
        .replaceAll('{{current_date}}', formattedShortDate)
        .replaceAll('{{current_date_full}}', formattedFullDate)
        .replaceAll('{{daily_tasks_x_list}}', dailyTasksXList)
        .replaceAll('{{daily_tasks_telegram_list}}', dailyTasksTelegramList)
        .replaceAll('{{daily_tasks_discord_list}}', dailyTasksDiscordList)
        .replaceAll('{{daily_tasks_funding_list}}', dailyTasksFundingList)
        .replaceAll('{{btc_price}}', btcPrice)
        .replaceAll('{{eth_price}}', ethPrice)
        .replaceAll('{{sol_price}}', solPrice)
        .replaceAll('{{eth_gwei}}', ethGwei)
        .replaceAll('{{market_sentiment}}', marketSentiment);
    };

    // --- DATA PARSING FOR SINGLE PROJECT / TASK PLACEHOLDERS ---
    
    // Founders
    let founderDetailsFull = 'TBA';
    let founderNamesShort = 'TBA';
    try {
      if (data.founders_details) {
        const parsedFounders = parseField(data.founders_details);
        if (Array.isArray(parsedFounders) && parsedFounders.length > 0) {
          founderDetailsFull = parsedFounders.map(f => `${f.name}${f.role ? ` (${f.role})` : ''} - ${f.background || ''}`).join('\n\n');
          founderNamesShort = parsedFounders.map(f => f.name).filter(Boolean).join(', ');
        }
      }
    } catch (error) {}

    // Discord Roles
    let formattedDiscordRoles = 'TBA';
    let formattedDiscordRolesBullets = 'TBA';
    if (data.discord_roles && Array.isArray(data.discord_roles) && data.discord_roles.length > 0) {
      formattedDiscordRoles = data.discord_roles.map(r => `🛡️ ${r.role_name} - ${r.requirements}`).join('\n');
      formattedDiscordRolesBullets = data.discord_roles.map(r => `• ${r.role_name}`).join('\n');
    }

    // Tokenomics
    let formattedTokenomics = 'TBA';
    try {
      if (data.tokenomics_details) {
        const t = parseField(data.tokenomics_details);
        if (t && t.ticker) {
          formattedTokenomics = `🪙 Ticker: ${t.ticker}\n📊 Supply: ${t.total_supply || 'TBA'}\n👥 Community: ${t.community_allocation_percentage || 0}%`;
        } else if (Array.isArray(t) && t[0]?.ticker) {
          formattedTokenomics = `🪙 Ticker: ${t[0].ticker}\n📊 Supply: ${t[0].total_supply || 'TBA'}`;
        }
      }
    } catch(e) {}

// --- PARSE TASK DATA & AI RESEARCH DATA (MULTI-TASK SUPPORT) ---
    let taskHeadline = 'Early Adopter Task';
    let taskPrimaryUrl = data.x_link || '';
    let formattedTaskBullets = '';
    let tasksNumbered = '';
    let tasksTelegram = '';
    let taskTime = '5';

    // 1. Check if item has `ai_research_data` (From funding_opportunities table)
    let aiResearchData = parseField(data.ai_research_data);
    if (typeof aiResearchData === 'string') {
      aiResearchData = parseField(aiResearchData);
    }

    if (aiResearchData && aiResearchData.early_tasks && Array.isArray(aiResearchData.early_tasks) && aiResearchData.early_tasks.length > 0) {
      const earlyTasks = aiResearchData.early_tasks;

      // Telegram Format: Clickable Markdown Hyperlinks
      tasksTelegram = earlyTasks.map(t => {
        return t.link ? `🔹 [${t.task_name}](${t.link})` : `🔹 ${t.task_name}`;
      }).join('\n');

      // X / Twitter Format
      tasksNumbered = earlyTasks.map((t, i) => {
        return t.link ? `${i + 1}. ${t.task_name}\n🔗 ${t.link}` : `${i + 1}. ${t.task_name}`;
      }).join('\n\n');

      // Farcaster / Binance Square Format
      formattedTaskBullets = earlyTasks.map(t => {
        return t.link ? `• ${t.task_name}: ${t.link}` : `• ${t.task_name}`;
      }).join('\n');

    } else if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
      // 2. MULTI-TASK LOGIC FOR PROJECTS (e.g. KieDex with 4 tasks)
      
      // Calculate total time estimate across all tasks if available
      const totalTime = data.tasks.reduce((sum, t) => sum + (t.time_minutes || 0), 0);
      taskTime = totalTime > 0 ? totalTime.toString() : (data.total_time_estimate || '10');

      const taskBlocksTelegram = [];
      const taskBlocksStandard = [];

      data.tasks.forEach((t) => {
        const postJson = parseField(t.post_json);
        const headline = postJson?.headline || t.name || 'Available Task';
        const url = postJson?.primary_url || t.link || t.external_link || data.x_link || '';

        let steps = [];
        if (postJson?.steps && Array.isArray(postJson.steps) && postJson.steps.length > 0) {
          steps = postJson.steps.map(s => s.action || s.name).filter(Boolean);
        } else if (t.tutorial_markdown) {
          const matches = t.tutorial_markdown.match(/\d+\.\s+([^\n]+)/g);
          if (matches) steps = matches.map(m => m.replace(/^\d+\.\s+/, ''));
        }

        const bulletSteps = steps.length > 0 
          ? steps.map(s => `• ${s}`).join('\n') 
          : '• Complete task requirements';

        // Telegram Markdown Block
        let tgBlock = `✅ *${headline}*\n\n${bulletSteps}`;
        if (url) {
          tgBlock += `\n\n🔗 [Task Link](${url})`;
        }
        taskBlocksTelegram.push(tgBlock);

        // Standard Block (X / Farcaster / Binance)
        let stdBlock = `✅ ${headline}\n\n${bulletSteps}`;
        if (url) {
          stdBlock += `\n\n🔗 ${url}`;
        }
        taskBlocksStandard.push(stdBlock);
      });

      tasksTelegram = taskBlocksTelegram.join('\n\n━━━━━━━━━━━━━━\n\n');
      formattedTaskBullets = taskBlocksStandard.join('\n\n━━━━━━━━━━━━━━\n\n');
      tasksNumbered = formattedTaskBullets;
      taskHeadline = data.tasks[0]?.name || 'Available Tasks';
      taskPrimaryUrl = data.tasks[0]?.link || data.x_link || '';

    } else {
      // 3. Single Task object fallback
      const targetTask = data.post_json ? data : null;

      if (targetTask) {
        taskTime = targetTask.time_minutes || data.total_time_estimate || '5';
        const postJson = parseField(targetTask.post_json);

        if (postJson) {
          if (postJson.headline) taskHeadline = postJson.headline;
          if (postJson.primary_url) taskPrimaryUrl = postJson.primary_url;

          if (postJson.steps && Array.isArray(postJson.steps)) {
            formattedTaskBullets = postJson.steps.map(s => `• ${s.action || s.name}`).join('\n');
            tasksNumbered = postJson.steps.map((s, i) => `${i + 1}. ${s.action || s.name}`).join('\n\n');
            tasksTelegram = postJson.steps.map(s => `🔹 ${s.action || s.name}`).join('\n');
          }
        }

        if (!formattedTaskBullets && targetTask.tutorial_markdown) {
          const matches = targetTask.tutorial_markdown.match(/\d+\.\s+([^\n]+)/g);
          if (matches) {
            formattedTaskBullets = matches.map(s => `• ${s.replace(/^\d+\.\s+/, '')}`).join('\n');
            tasksNumbered = matches.join('\n\n');
            tasksTelegram = matches.map(s => `🔹 ${s.replace(/^\d+\.\s+/, '')}`).join('\n');
          }
        }

        if (!taskPrimaryUrl) taskPrimaryUrl = targetTask.link || targetTask.external_link || data.x_link || '';
        if (taskHeadline === 'Early Adopter Task' && targetTask.name) taskHeadline = targetTask.name;
      }
    }

    // Default fallback if no tasks were found in any source
    if (!formattedTaskBullets) {
      formattedTaskBullets = '• Connect Wallet\n• Interact with dApp';
      tasksNumbered = '1. Connect Wallet\n2. Interact with dApp';
      tasksTelegram = '🔹 Connect Wallet\n🔹 Interact with dApp';
    }

    const replacePlaceholders = (template, itemData) => {
      let text = template;

      // Extract the real project name and X link depending on whether itemData is a Task or a Project
      const realProjectName = itemData.projects?.name || itemData.project_name || itemData.name || '';
      const realXLink = itemData.x_link || itemData.projects?.x_link || '';
      const handleName = realXLink ? `@${realXLink.split('/').pop()}` : realProjectName;
      const realTier = itemData.tier || itemData.projects?.tier || 'Tier 3';
      const realFunding = itemData.funding || itemData.funding_amount || itemData.projects?.funding || 'TBA';

      // --- SINGLE DISCORD ROLES PARSING ---
      const rolesArray = itemData.discord_roles || [];
      const totalRoles = rolesArray.length.toString();
      const hasEasy = rolesArray.some(r => r.difficulty_level?.toLowerCase() === 'easy');
      const difficultySummary = hasEasy ? 'Easy to Start' : (rolesArray[0]?.difficulty_level || 'Varied Difficulty');

      const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];
      const topRoles = rolesArray.slice(0, 3);
      const remainingRolesCount = rolesArray.length - topRoles.length;

      const discordRolesNumberedList = topRoles.map((r, i) => {
        const perkOrReq = (r.perks && r.perks !== 'Nothing') ? r.perks : r.requirements;
        return `${numberEmojis[i+1]} Grab ${r.role_name} (${perkOrReq})`;
      }).join('\n');
      
      const additionalRolesNumberedText = remainingRolesCount > 0 ? `${numberEmojis[topRoles.length + 1]} Continue progressing to higher roles` : '';

      const discordRolesMedalList = topRoles.map(r => {
        const perkOrReq = (r.perks && r.perks !== 'Nothing') ? r.perks : r.requirements;
        return `🏅 ${r.role_name} – ${perkOrReq}`;
      }).join('\n');
      
      const additionalRolesText = remainingRolesCount > 0 ? `+ ${remainingRolesCount} More Roles` : '';

      const discordRolesBulletList = topRoles.map(r => {
        const perkOrReq = (r.perks && r.perks !== 'Nothing') ? r.perks : r.requirements;
        return `• ${r.role_name} – ${perkOrReq}`;
      }).join('\n');
      
      const additionalRolesBulletText = remainingRolesCount > 0 ? `• +${remainingRolesCount} Additional Roles` : '';

      const discordLink = itemData.discord_link || itemData.projects?.discord_link || 'https://discord.gg/...';

      const replacements = {
        // Project
        '{{project_name}}': realProjectName,
        '{{project_tier}}': realTier,
        '{{project_handle}}': handleName,
        // Funding
        '{{funding_amount}}': realFunding,
        '{{round}}': itemData.round || itemData.status || 'Seed',
        '{{category}}': itemData.category || itemData.sector || 'Crypto',
        '{{investor_handles}}': formattedHandles || itemData.lead_investors || itemData.lead_investor || '',
        '{{investor_names}}': itemData.lead_investors || itemData.lead_investor || '',
        // Team
        '{{founder_details}}': founderDetailsFull,
        '{{founder_names}}': founderNamesShort,
        '{{founder_name}}': founderNamesShort,
        // Single Task Data (Mapped from `post_json` or task object)
        '{{task_headline}}': taskHeadline,
        '{{task_steps_bullets}}': formattedTaskBullets,
        '{{task_steps_numbered}}': tasksNumbered,
        '{{task_primary_url}}': taskPrimaryUrl,
        '{{task_time}}': taskTime,
        '{{tasks_guide}}': tasksNumbered,
        '{{tasks_guide_telegram}}': tasksTelegram,
        '{{tasks_guide_plain}}': tasksNumbered,
        // Meta
        '{{discord_roles_list}}': formattedDiscordRoles,
        '{{discord_roles_bullets}}': formattedDiscordRolesBullets,
        '{{tokenomics_list}}': formattedTokenomics,
        // Single Discord Roles
        '{{total_roles}}': totalRoles,
        '{{difficulty_summary}}': difficultySummary,
        '{{discord_roles_numbered_list}}': discordRolesNumberedList,
        '{{additional_roles_numbered_text}}': additionalRolesNumberedText,
        '{{discord_roles_medal_list}}': discordRolesMedalList,
        '{{additional_roles_text}}': additionalRolesText,
        '{{discord_roles_bullet_list}}': discordRolesBulletList,
        '{{additional_roles_bullet_text}}': additionalRolesBulletText,
        '{{discord_link}}': discordLink,
      };
      
      for (const [key, value] of Object.entries(replacements)) {
        let finalValue = value;
        if (key === '{{funding_amount}}' && typeof value === 'number') {
           finalValue = value >= 1e6 ? `$${(value / 1e6).toFixed(1)}M` : `$${value.toLocaleString()}`;
        }
        text = text.replaceAll(key, finalValue);
      }
      return text;
    };

    setGeneratedTweet({
      x_post: replaceWeeklyPlaceholders(replacePlaceholders(xTemplate, data)),
      tg_post: replaceWeeklyPlaceholders(replacePlaceholders(tgTemplate, data)),
      fc_post: replaceWeeklyPlaceholders(replacePlaceholders(fcTemplate, data)),
      bs_post: replaceWeeklyPlaceholders(replacePlaceholders(bsTemplate, data))
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleSelectData = (id) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleExport = async () => {
    if (!canvasRef.current || !activeDesign) return;
    setIsCapturing(true);
    try {
      const canvasHtml = canvasRef.current.outerHTML;
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');body { margin: 0; padding: 0; background: #ffffff; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }</style></head><body>${canvasHtml}</body></html>`;

      const response = await fetch(`${engineUrl}/functions/v1/generate-screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${engineKey}`,
          'apikey': engineKey
        },
        body: JSON.stringify({ 
          html: fullHtml, 
          options: { type: "png" }, 
          gotoOptions: { waitUntil: "networkidle2" },
          viewport: { width: 1200, height: 675, deviceScaleFactor: 2 } 
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${activeDesign.name.replace(/\s+/g, '_')}_AirdropSailor.png`;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleConfirmSchedule = async (selectedPlatforms) => {
    setIsScheduling(true);

    try {
      if (!canvasRef.current) throw new Error('No design preview element found.');

      const canvasHtml = canvasRef.current.outerHTML;
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');body { margin: 0; padding: 0; background: #ffffff; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }</style></head><body>${canvasHtml}</body></html>`;

      const response = await fetch(`${engineUrl}/functions/v1/generate-screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${engineKey}`,
          'apikey': engineKey
        },
        body: JSON.stringify({ 
          html: fullHtml, 
          options: { type: "png" }, 
          gotoOptions: { waitUntil: "networkidle2" },
          viewport: { width: 1200, height: 675, deviceScaleFactor: 2 } 
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const blob = await response.blob();
      const fileName = `post_${Date.now()}.png`;
      const { error: uploadError } = await engineClient.storage
        .from('social-media-assets')
        .upload(fileName, blob, { 
          contentType: 'image/png',
          upsert: false 
        });

      if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);

      const { data: publicUrlData } = engineClient.storage
        .from('social-media-assets')
        .getPublicUrl(fileName);

      const finalImageUrl = publicUrlData.publicUrl;

      // 1. DYNAMICALLY EXTRACT OFFICIAL PROJECT SLUG
      let projectSlug = null;
      
      // Only attach a slug if exactly ONE item is selected (Single Alert)
      if (selectedItemIds.length === 1) {
        const item = sourceData.find(d => d.id === selectedItemIds[0]);
        if (item) {
          const raw = item.raw || {};
          
          // ALWAYS grab the official 'slug' from the projects table!
          // (Checks raw.projects.slug if it's a Task, or raw.slug if it's a Project)
          projectSlug = raw.projects?.slug || raw.slug || null;

          // Safe fallback ONLY if slug is missing in DB
          if (!projectSlug) {
            const fallbackName = raw.projects?.name || raw.project_name || raw.name;
            if (fallbackName) {
              projectSlug = fallbackName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }
          }
        }
      }

      // 2. BUILD THE PAYLOAD WITH PROJECT_SLUG
      const insertQueue = selectedPlatforms.map(p => {
        let textContent = '';
        if (p.platform === 'telegram') textContent = generatedTweet.tg_post || generatedTweet.x_post;
        else textContent = generatedTweet.x_post || generatedTweet.tg_post;

        return {
          platform: p.platform,
          content_text: textContent,
          image_url: finalImageUrl,
          scheduled_time: p.scheduled_time,
          status: 'scheduled',
          project_slug: projectSlug // <-- Added here!
        };
      });

      const { error: dbError } = await engineClient
        .from('social_posts')
        .insert(insertQueue);

      if (dbError) throw new Error(`Database queue error: ${dbError.message}`);

      setIsScheduleModalOpen(false);
      alert(`Successfully scheduled ${selectedPlatforms.length} post(s) to Supabase 2!`);

    } catch (error) {
      console.error("Schedule Error:", error);
      alert("Failed to schedule: " + error.message);
    } finally {
      setIsScheduling(false);
    }
  };

  const filteredData = sourceData.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.amount?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ActiveCanvasComponent = activeDesign ? DYNAMIC_REGISTRY[activeDesign.component_name] : null;
  const selectedFullData = sourceData.filter(d => selectedItemIds.includes(d.id));

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-[#F8FAFC] min-h-full">
      
      {/* 1. TOP PROGRESS BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between overflow-x-auto">
        <div className="flex items-center justify-between min-w-[720px] w-full">
        {[
          { step: 1, title: 'Select Source', sub: 'Choose your data', active: true, completed: true },
          { step: 2, title: 'Choose Template', sub: 'Pick a design template', active: true, completed: true },
          { step: 3, title: 'Customize', sub: 'Preview & customize', active: false, completed: false },
          { step: 4, title: 'Generate & Publish', sub: 'AI content & publish', active: false, completed: false },
        ].map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                s.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {s.step}
              </div>
              <div>
                <h4 className={`text-sm font-black ${s.active ? 'text-slate-900' : 'text-slate-500'}`}>{s.title}</h4>
                <p className="text-[11px] font-bold text-slate-400">{s.sub}</p>
              </div>
            </div>
            {i < 3 && (
              <div className="flex-1 max-w-[100px] h-px bg-slate-200 mx-4">
                <div className={`h-full bg-blue-600 transition-all ${s.completed ? 'w-full' : 'w-0'}`}></div>
              </div>
            )}
          </React.Fragment>
        ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0">
        
        {/* COLUMN 1: SELECT SOURCE */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-[420px] lg:min-h-[600px] h-auto lg:h-[calc(100vh-180px)] min-w-0">
          <div className="p-4 border-b border-slate-100 shrink-0">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">1. Select Source</h3>
            
            <div className="relative mb-2">
              <select 
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-700 outline-none cursor-pointer"
              >
                {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
            </div>

            <div className="relative mb-4">
              <select 
                value={activeTemplate?.id || ''}
                onChange={(e) => {
                  const selected = availableTemplates.find(t => String(t.id) === String(e.target.value));
                  setActiveTemplate(selected || null);
                }}
                className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer hover:border-slate-300 transition-colors"
              >
                <option value="" disabled>Select Format...</option>
                {availableTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search database..." 
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
            {isLoadingData ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-10 text-xs font-bold text-slate-400">No data found.</div>
            ) : (
              filteredData.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleSelectData(item.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedItemIds.includes(item.id) ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg shrink-0 border border-slate-100 overflow-hidden bg-slate-50">
                      {item.logo ? <img src={item.logo} alt="Logo" className="w-full h-full object-cover" /> : <div className="w-4 h-4 bg-slate-200 rounded-sm"></div>}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[10px] font-bold text-slate-500 truncate">{item.amount}</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    selectedItemIds.includes(item.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {selectedItemIds.includes(item.id) && <Check size={10} strokeWidth={4} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: TEMPLATE PREVIEW */}
        <div className="lg:col-span-6 flex flex-col gap-6 min-w-0">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm shrink-0 w-full overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">2. Choose Template</h3>
            
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 pb-2">
              <div className="flex gap-4 w-max px-0.5">
                {availableDesigns.length === 0 ? (
                  <span className="text-xs text-slate-400 font-bold">No designs mapped for this format.</span>
                ) : (
                  availableDesigns.map((d, index) => (
                    <button 
                      key={d.id}
                      onClick={() => setActiveDesign(d)}
                      className="flex flex-col gap-2 shrink-0 group text-left w-32"
                    >
                      <div className={`w-32 h-24 rounded-xl border-2 transition-all overflow-hidden flex items-center justify-center bg-slate-50 ${
                        activeDesign?.id === d.id ? 'border-blue-600 shadow-md ring-2 ring-blue-600/20' : 'border-slate-200 group-hover:border-slate-300'
                      }`}>
                         {d.thumbnail ? (
                           <img src={d.thumbnail} alt={d.name} className="w-full h-full object-cover" />
                         ) : (
                           <div className={`w-full h-full ${fallbackGradients[index % fallbackGradients.length]} flex flex-col p-2.5 opacity-90 group-hover:opacity-100`}>
                             <div className="w-6 h-6 bg-white/30 rounded-md shadow-sm mb-auto flex items-center justify-center"><Layout size={14} className="text-white" /></div>
                             <div className="w-16 h-1.5 bg-white/60 rounded-full mb-1.5"></div>
                             <div className="w-10 h-1.5 bg-white/40 rounded-full"></div>
                           </div>
                         )}
                      </div>
                      <span className={`text-[11px] font-bold text-center w-full truncate px-1 ${activeDesign?.id === d.id ? 'text-blue-700' : 'text-slate-600'}`}>{d.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-slate-100 shrink-0">
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">3. Live Preview</h3>
            </div>
            
            <div ref={containerRef} className="flex-1 bg-slate-100 overflow-hidden relative flex items-center justify-center p-4 min-h-[300px] sm:min-h-[400px] w-full max-w-full">
               <div className="absolute origin-center shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-900/10 bg-white" style={{ width: '1200px', height: '675px', transform: `scale(${previewScale})` }}>
                 <div ref={canvasRef} className="w-full h-full relative overflow-hidden bg-white">
                   {ActiveCanvasComponent ? (
                    <ActiveCanvasComponent 
                      data={{
                        raw: selectedFullData[0]?.raw || {},
                        investorLogos: investorLogos,
                        selectedItems: selectedFullData,
                        sourceData: sourceData
                      }} 
                    />
                  ) : (
                     <div className="w-[1200px] h-[675px] flex items-center justify-center bg-white text-slate-400 font-bold text-2xl">Select a template to render</div>
                   )}
                 </div>
               </div>
            </div>

            <div className="h-12 border-t border-slate-100 bg-white flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-slate-700 font-black"><ChevronLeft size={16}/></button>
                <span className="text-xs font-black text-slate-700">{Math.round(previewScale * 100)}%</span>
                <button className="text-slate-400 hover:text-slate-700 font-black"><ChevronRight size={16}/></button>
              </div>
              <button onClick={handleExport} className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800">
                <Download size={14} /> Download Image
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm shrink-0 w-full overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Selected Data ({selectedItemIds.length})</h3>
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="overflow-x-auto scrollbar-hide flex-1 w-full">
                <div className="flex items-center gap-2 w-max pr-2">
                  {selectedItemIds.map((id) => {
                    const item = sourceData.find(d => d.id === id);
                    if(!item) return null;
                    return (
                      <div key={id} className="flex items-center gap-2 py-1.5 px-2.5 bg-blue-50 border border-blue-100 rounded-lg shrink-0">
                        <div className="w-6 h-6 rounded bg-white overflow-hidden shrink-0">
                           {item.logo && <img src={item.logo} className="w-full h-full object-cover" alt="Logo" />}
                        </div>
                        <p className="text-xs font-black text-slate-800">{item.name}</p>
                        <button onClick={() => handleSelectData(id)} className="ml-1 text-slate-400"><X size={14}/></button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setSelectedItemIds([])} className="px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg">Clear All</button>
                <button 
                  onClick={() => setIsScheduleModalOpen(true)} 
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Schedule / Publish
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN 3: AI CONTENT GENERATION */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-auto lg:h-[calc(100vh-180px)] min-w-0">
          <div className="p-4 border-b border-slate-100 shrink-0">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">4. Content Generation</h3>
            <button onClick={handleGenerateCaptions} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95">
              <Sparkles size={16} className="inline mr-2" /> Generate All Captions
            </button>
          </div>
          
          {/* Scrollable text area list */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-300">
            <div className="space-y-4 pb-4">
              
              {/* X (Twitter) */}
              <div className="bg-white border rounded-xl p-3 shadow-sm group">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black text-slate-800"><XLogo size={12} className="inline mr-1"/> X (Twitter)</h4>
                  <button onClick={() => copyToClipboard(generatedTweet.x_post)} className="text-slate-400 hover:text-blue-600 transition-colors"><Copy size={14}/></button>
                </div>
                <textarea 
                  value={generatedTweet.x_post || 'Click "Generate All Captions" to create content.'} 
                  onChange={(e) => setGeneratedTweet({...generatedTweet, x_post: e.target.value})} 
                  className="w-full h-32 text-[11px] font-medium text-slate-600 bg-transparent resize-none outline-none" 
                />
              </div>

              {/* Farcaster */}
              <div className="bg-white border rounded-xl p-3 shadow-sm group">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black text-slate-800"><Rocket size={12} className="inline mr-1 text-purple-500"/> Farcaster</h4>
                  <button onClick={() => copyToClipboard(generatedTweet.fc_post)} className="text-slate-400 hover:text-blue-600 transition-colors"><Copy size={14}/></button>
                </div>
                <textarea 
                  value={generatedTweet.fc_post || 'Click "Generate All Captions" to create content.'} 
                  onChange={(e) => setGeneratedTweet({...generatedTweet, fc_post: e.target.value})} 
                  className="w-full h-32 text-[11px] font-medium text-slate-600 bg-transparent resize-none outline-none" 
                />
              </div>

              {/* Telegram */}
              <div className="bg-white border rounded-xl p-3 shadow-sm group">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black text-slate-800"><Send size={12} className="inline text-blue-500 mr-1"/> Telegram</h4>
                  <button onClick={() => copyToClipboard(generatedTweet.tg_post)} className="text-slate-400 hover:text-blue-600 transition-colors"><Copy size={14}/></button>
                </div>
                <textarea 
                  value={generatedTweet.tg_post || 'Click "Generate All Captions" to create content.'} 
                  onChange={(e) => setGeneratedTweet({...generatedTweet, tg_post: e.target.value})} 
                  className="w-full h-40 text-[11px] font-medium text-slate-600 bg-transparent resize-none outline-none" 
                />
              </div>

              {/* Binance Square */}
              <div className="bg-white border rounded-xl p-3 shadow-sm group">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black text-slate-800"><span className="font-black text-amber-500 mr-1">B</span> Binance Square</h4>
                  <button onClick={() => copyToClipboard(generatedTweet.bs_post)} className="text-slate-400 hover:text-blue-600 transition-colors"><Copy size={14}/></button>
                </div>
                <textarea 
                  value={generatedTweet.bs_post || 'Click "Generate All Captions" to create content.'} 
                  onChange={(e) => setGeneratedTweet({...generatedTweet, bs_post: e.target.value})} 
                  className="w-full h-40 text-[11px] font-medium text-slate-600 bg-transparent resize-none outline-none" 
                />
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* RENDER SCHEDULE MODAL */}
      <ScheduleModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onConfirm={handleConfirmSchedule}
        isScheduling={isScheduling}
      />
    </div>
  );
  
}
