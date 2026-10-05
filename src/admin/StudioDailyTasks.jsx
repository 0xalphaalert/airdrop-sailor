import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, CheckCircle2, Image as ImageIcon, RefreshCw, X, Sparkles, Send, Rocket, Loader2, Layout } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';

// --- IMPORTS FOR HEADLESS RENDERING ---
import { renderToString } from 'react-dom/server';
import { DYNAMIC_REGISTRY } from "../studio/registry/dynamicRegistry";

// --- SUPABASE 2 (PUBLISHING ENGINE) SETUP ---
const engineUrl = import.meta.env.VITE_SUPABASE_2_URL || "https://lrfjeupbfretcfcnqkjg.supabase.co";
const engineKey = import.meta.env.VITE_SUPABASE_2_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZmpldXBiZnJldGNmY25xa2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU0NDIsImV4cCI6MjEwMTAxMTQ0Mn0.K68VdEj839idPdSY9RVOLdH_VnO4JWFIwW0yNIOhxY8";
const engineClient = createClient(engineUrl, engineKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// --- ICONS ---
const XLogo = ({ size = 12, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.059z" />
  </svg>
);

// --- RICH SCHEDULE MODAL COMPONENT ---
function ScheduleModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isScheduling, 
  initialTweets, 
  availableDesigns, 
  selectedDesign, 
  setSelectedDesign,
  activeProject
}) {
  const [step, setStep] = useState(1);
  const [xPosts, setXPosts] = useState(['']);
  const [tgPost, setTgPost] = useState('');
  
  const [schedules, setSchedules] = useState({
    x: { enabled: true, time: '', icon: <XLogo size={16} className="text-slate-900" />, label: 'X (Twitter)' },
    telegram: { enabled: true, time: '', icon: <Send size={16} className="text-blue-500" />, label: 'Telegram' },
    farcaster: { enabled: true, time: '', icon: <Rocket size={16} className="text-purple-500" />, label: 'Farcaster' },
    binance_square: { enabled: true, time: '', icon: <span className="font-black text-amber-500 text-sm">B</span>, label: 'Binance Square' },
  });

  useEffect(() => {
    if (isOpen && initialTweets) {
      setStep(1);
      // Robust split handles '---', '***', or AI spacing variations
      let parsedX = (initialTweets.x_post || '')
        .split(/\n\s*[-*_]{3,}\s*(?:\n|$)/)
        .map(t => t.trim())
        .filter(Boolean);
        
      if (parsedX.length === 0) {
        parsedX = (initialTweets.x_post || '').split('---').map(t => t.trim()).filter(Boolean);
      }

      setXPosts(parsedX.length > 0 ? parsedX : ['']);
      setTgPost(initialTweets.tg_post || '');
    }
  }, [isOpen, initialTweets]);

  if (!isOpen) return null;

  const handleToggle = (platform) => {
    setSchedules(prev => ({ ...prev, [platform]: { ...prev[platform], enabled: !prev[platform].enabled } }));
  };

  const handleTimeChange = (platform, newTime) => {
    setSchedules(prev => ({ ...prev, [platform]: { ...prev[platform], time: newTime } }));
  };

  const handleSubmit = () => {
    const selectedPlatforms = Object.entries(schedules)
      .filter(([_, data]) => data.enabled && data.time !== '')
      .map(([key, data]) => ({ platform: key, scheduled_time: new Date(data.time).toISOString() }));

    if (selectedPlatforms.length === 0) {
      alert("Please enable at least one platform and select a date/time.");
      return;
    }

    const finalFinalTweets = {
      ...initialTweets,
      x_post: xPosts.join('\n\n---\n\n'),
      tg_post: tgPost
    };

    onConfirm(selectedPlatforms, finalFinalTweets);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isScheduling && onClose()}></div>

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        
        {/* RICH HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              {step === 1 && "Step 1: Review X (Twitter) Thread"}
              {step === 2 && "Step 2: Review Telegram Post"}
              {step === 3 && "Step 3: Design & Schedule"}
              {activeProject?.name && (
                <span className="bg-blue-100 text-blue-700 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ml-2">
                  {activeProject.name}
                </span>
              )}
            </h3>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 w-12 rounded-full transition-colors ${step >= s ? 'bg-blue-600' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} disabled={isScheduling} className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors border border-slate-200 shadow-sm disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: X THREAD COMPOSER */}
        {step === 1 && (
          <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 space-y-4 flex-1">
            {xPosts.map((post, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center pt-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                    <XLogo size={18} />
                  </div>
                  {i < xPosts.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-2"></div>}
                </div>
                <div className="flex-1 bg-white border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 rounded-2xl p-3 shadow-sm transition-all relative group">
                  <textarea 
                    value={post} 
                    onChange={(e) => {
                      const updated = [...xPosts];
                      updated[i] = e.target.value;
                      setXPosts(updated);
                    }} 
                    className="w-full text-[13px] font-medium text-slate-800 bg-transparent resize-none outline-none min-h-[100px]" 
                  />
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <button 
                      onClick={() => setXPosts(xPosts.filter((_, idx) => idx !== i))}
                      className="text-xs font-bold text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                    <span className={`text-[11px] font-black ${post.length > 280 ? 'text-red-500' : 'text-slate-400'}`}>
                      {post.length} / 280
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="pl-14">
              <button 
                onClick={() => setXPosts([...xPosts, ''])}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 py-2"
              >
                + Add another post
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TELEGRAM EDITOR */}
        {step === 2 && (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="bg-white border border-blue-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 rounded-2xl p-4 shadow-sm transition-all h-full min-h-[300px] flex flex-col">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                <Send size={18} className="text-blue-500" />
                <span className="text-sm font-black text-slate-800">Telegram Post Format</span>
              </div>
              <textarea 
                value={tgPost} 
                onChange={(e) => setTgPost(e.target.value)} 
                className="w-full flex-1 text-[13px] font-medium text-slate-800 bg-transparent resize-none outline-none" 
              />
            </div>
          </div>
        )}

        {/* STEP 3: SCHEDULER & HEADLESS DESIGN PICKER */}
        {step === 3 && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
            
            {/* Rich Data Preview Block */}
            {activeProject && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  {activeProject.logo ? <img src={activeProject.logo} className="w-full h-full object-cover" alt="Logo" /> : <div className="w-full h-full bg-slate-200" />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{activeProject.name || 'Selected Item'}</h4>
                  <p className="text-xs font-bold text-slate-500">{activeProject.funding || 'Tier 3'}</p>
                </div>
              </div>
            )}

            {/* Design Picker */}
            {availableDesigns && availableDesigns.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                  <Layout size={16} className="text-blue-600"/> Attached Image Design
                </h4>
                <select 
                  value={selectedDesign?.id || ''}
                  onChange={(e) => setSelectedDesign(availableDesigns.find(d => String(d.id) === String(e.target.value)))}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer transition-colors"
                >
                  {availableDesigns.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <p className="text-[11px] font-bold text-slate-400 mt-2">This design will be rendered automatically in the background via Browserless.</p>
              </div>
            )}

            {/* Platforms */}
            <div className="space-y-3">
              {Object.entries(schedules).map(([key, data]) => (
                <div key={key} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${data.enabled ? 'bg-white border-blue-200 shadow-sm' : 'bg-transparent border-slate-200 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${data.enabled ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'}`}>
                      {data.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{data.label}</h4>
                      <label className="flex items-center gap-2 mt-1 cursor-pointer">
                        <input type="checkbox" checked={data.enabled} onChange={() => handleToggle(key)} disabled={isScheduling} className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{data.enabled ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </div>
                  </div>
                  <div className="w-44">
                    <input 
                      type="datetime-local" value={data.time} onChange={(e) => handleTimeChange(key, e.target.value)} disabled={!data.enabled || isScheduling}
                      className={`w-full text-xs font-bold rounded-lg px-3 py-2 border outline-none transition-colors ${data.enabled ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white' : 'bg-slate-50 border-transparent text-slate-400 cursor-not-allowed'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            disabled={isScheduling}
            className="px-5 py-2 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all"
            >
              Next Step
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isScheduling}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2.5 rounded-xl font-black text-sm transition-all shadow-md shadow-blue-600/20"
            >
              {isScheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isScheduling ? 'Generating Image & Scheduling...' : 'Confirm Schedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MAIN DASHBOARD LOGIC ---
const EMPTY_QUEUE = { instant: [], batches: [] };
const ACTION_TYPES = new Set(['Completed', 'Ignored']);
const STUDIO_ACCOUNTS = ['airdropsailor', '0xdalai'];

const valueOr = (value, fallback = '') => value === null || value === undefined || value === '' ? fallback : value;
const getTemplateId = (item) => valueOr(item?.template_id, valueOr(item?.templateId, item?.id));
const getEntityType = (item, fallback = 'item') => valueOr(item?.entity_type, valueOr(item?.entityType, fallback));
const getEntityId = (item) => valueOr(item?.entity_id, valueOr(item?.entityId, item?.id));
const getItemName = (item) => valueOr(item?.name, valueOr(item?.item_name, valueOr(item?.project_name, valueOr(item?.title, 'Project'))));
const getTemplateName = (item) => valueOr(item?.template_name, valueOr(item?.templateName, 'Other tasks'));
const getLogo = (item) => valueOr(item?.logo_url, valueOr(item?.project_logo, valueOr(item?.logo, valueOr(item?.image_url, valueOr(item?.icon_url, valueOr(item?.project?.logo_url, item?.project?.project_logo))))));
const getAddedAt = (item) => valueOr(item?.created_at, valueOr(item?.createdAt, item?.added_at));
const getBatchItems = (batch) => Array.isArray(batch?.items) ? batch.items : [];
const getBatchTemplateName = (batch) => valueOr(batch?.template_name, valueOr(batch?.templateName, getTemplateName(getBatchItems(batch)[0])));

const normalizeQueueItem = (item, template = {}) => ({
  ...item,
  template_id: valueOr(item?.template_id, valueOr(item?.templateId, template?.template_id || template?.templateId || template?.id)),
  template_name: valueOr(item?.template_name, valueOr(item?.templateName, template?.template_name || template?.templateName)),
  funding_amount: valueOr(item?.funding_amount, valueOr(item?.fundingAmount, item?.project?.funding_amount)),
});
const normalizeTemplate = (template) => ({
  ...template,
  items: getBatchItems(template).map((item) => normalizeQueueItem(item, template)),
});
const normalizeQueueData = (data) => ({
  instant: Array.isArray(data?.instant) ? data.instant.map(normalizeTemplate) : [],
  batches: Array.isArray(data?.batches) ? data.batches.map(normalizeTemplate) : [],
});

const getTaskTitle = (item) => {
  const name = getItemName(item);
  const template = getTemplateName(item).trim().toLowerCase();
  if (template === 'single funding alert') return `${name} raised ${valueOr(item?.funding_amount, 'funding')} funding`;
  if (template === 'single airdrop alert' || template === 'single project') return `Generate post for ${name}`;
  if (template === 'single project discord role') return `${name} has discord role`;
  return name;
};

const formatAddedDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
};

const buildTemplateGroups = (queueData) => {
  const groups = new Map();
  const addToGroup = (templateName, entry) => {
    if (!groups.has(templateName)) groups.set(templateName, []);
    groups.get(templateName).push(entry);
  };
  queueData.instant.forEach((template) => {
    const templateName = getTemplateName(template);
    getBatchItems(template).forEach((item) => addToGroup(templateName, { type: 'instant', item }));
  });
  queueData.batches.forEach((batch) => addToGroup(getBatchTemplateName(batch), { type: 'batch', batch }));
  return Array.from(groups, ([templateName, entries]) => ({ templateName, entries }));
};

const parseField = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
};

export default function StudioDailyTasks() {
  const [activeAccount, setActiveAccount] = useState('airdropsailor');
  const [queueData, setQueueData] = useState(EMPTY_QUEUE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [processingKey, setProcessingKey] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const requestId = useRef(0);

  // --- SCHEDULING & HEADLESS STATE ---
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [generatedTweet, setGeneratedTweet] = useState({ x_post: '', tg_post: '', fc_post: '', bs_post: '' });
  
  // Headless context variables
  const [availableDesigns, setAvailableDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [activeProjectDataList, setActiveProjectDataList] = useState([]);
  const [activeInvestorLogos, setActiveInvestorLogos] = useState({});
  const [activeProjectSlug, setActiveProjectSlug] = useState(null);

  const fetchQueues = useCallback(async (accountName, { background = false } = {}) => {
    const currentRequest = ++requestId.current;
    if (background) setRefreshing(true); else setLoading(true);
    setNotice(null);
    try {
      const { data, error } = await supabase.rpc('get_studio_daily_queue', { p_account_name: accountName });
      if (error) throw error;
      if (currentRequest !== requestId.current) return;
      setQueueData(normalizeQueueData(data));
      setLastUpdated(new Date());
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setQueueData(EMPTY_QUEUE);
      setNotice({ type: 'error', text: `Failed to load the ${accountName} queue: ${error.message}` });
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(() => fetchQueues('airdropsailor'), 0);
    return () => window.clearTimeout(request);
  }, [fetchQueues]);

  const handleAccountChange = (account) => {
    if (account === activeAccount) return;
    setActiveAccount(account);
    setQueueData(EMPTY_QUEUE);
    setLastUpdated(null);
    fetchQueues(account);
  };

  const templateGroups = useMemo(() => buildTemplateGroups(queueData), [queueData]);

  const logAction = async (templateId, entityType, entityId, actionType) => {
    if (!ACTION_TYPES.has(actionType)) throw new Error(`Unsupported action type: ${actionType}`);
    const { error } = await supabase.from('studio_action_log').insert([{ account_name: activeAccount, template_id: templateId, entity_type: entityType, entity_id: entityId, action_type: actionType }]);
    if (error) throw error;
  };

  const handleInstantAction = async (item, actionType) => {
    const itemKey = `instant:${getTemplateId(item)}:${getEntityId(item)}`;
    setProcessingKey(itemKey); setNotice(null);
    try {
      await logAction(getTemplateId(item), getEntityType(item), getEntityId(item), actionType);
      setQueueData((current) => ({
        ...current,
        instant: current.instant
          .map((template) => ({
            ...template,
            items: getBatchItems(template).filter((entry) => getTemplateId(entry) !== getTemplateId(item) || getEntityId(entry) !== getEntityId(item)),
          }))
          .filter((template) => getBatchItems(template).length > 0),
      }));
      setNotice({ type: 'success', text: actionType === 'Completed' ? 'Marked as Completed.' : 'Item Ignored permanently.' });
    } catch (error) {
      setNotice({ type: 'error', text: `Could not mark item as ${actionType.toLowerCase()}: ${error.message}` });
    } finally { setProcessingKey(null); }
  };

  const handleBatchAction = async (batch, actionType) => {
    const items = getBatchItems(batch);
    const batchKey = `batch:${getTemplateId(batch)}:${getBatchTemplateName(batch)}`;
    setProcessingKey(batchKey); setNotice(null);
    try {
      for (const item of items) await logAction(getTemplateId(batch), getEntityType(item, getEntityType(batch, 'item')), getEntityId(item), actionType);
      setQueueData((current) => ({ ...current, batches: current.batches.filter((entry) => entry !== batch) }));
      setNotice({ type: 'success', text: actionType === 'Completed' ? 'Batch marked as Completed.' : 'Batch Ignored permanently.' });
    } catch (error) {
      setNotice({ type: 'error', text: `Could not mark batch as ${actionType.toLowerCase()}: ${error.message}` });
    } finally { setProcessingKey(null); }
  };

  // --- QUICK SCHEDULE AI & HEADLESS FETCH HANDLER ---
  const handleOpenSchedule = async (templateName, items) => {
    setNotice({ type: 'success', text: 'Fetching full details & Generating AI Content...' });
    
    const isBatch = Array.isArray(items);
    const dataList = isBatch ? items : [items];

    // 1. FETCH MISSING DATA: Daily Task queue items are lightweight.
    // We must fetch full relational data so the AI doesn't skip missing sections.
    const enrichedList = await Promise.all(dataList.map(async (item) => {
      let enriched = { ...item };
      const eType = getEntityType(item, '').toLowerCase();
      const eId = getEntityId(item);
      const tName = (templateName || '').toLowerCase();

      try {
        if (eType === 'project' || tName.includes('project') || tName.includes('airdrop') || tName.includes('discord')) {
          const { data } = await supabase.from('projects').select('*, tasks(*), discord_roles(*)').eq('id', eId).single();
          if (data) enriched = { ...enriched, ...data, projects: data };
        } 
        else if (eType === 'funding' || tName.includes('funding')) {
          const { data } = await supabase.from('funding_opportunities').select('*').eq('id', eId).single();
          if (data) enriched = { ...enriched, ...data };
        }
        else if (eType === 'task' || tName.includes('task')) {
          const { data } = await supabase.from('tasks').select('*, projects(*)').eq('id', eId).single();
          if (data) enriched = { ...enriched, ...data, tasks: [data] };
        }
      } catch (err) {
        console.warn("Failed to fetch full entity details", err);
      }
      return enriched;
    }));

    // 2. Map the fully enriched data
    const cleanList = enrichedList.map(item => ({
      ...item, // <-- CRITICAL FIX: Retain original database properties for Canvas templates
      name: item.project_name || item.projects?.name || item.name || '',
      tier: item.tier || item.projects?.tier || 'Tier 3',
      funding: item.funding_amount || item.funding || item.projects?.funding || null,
      round: item.round || item.funding_round || null,
      lead_investor: item.lead_investor || item.lead_investors || null,
      airdrop_status: item.airdrop_status || item.projects?.airdrop_status || null,
      description: item.sector || item.description || item.projects?.description || null,
      category: item.category || item.sector || null,
      founders: parseField(item.founders_details),
      discord_roles: item.discord_roles || [],
      discord_link: item.discord_link || item.projects?.discord_link || null,
      tokenomics: parseField(item.tokenomics_details),
      tasks: item.tasks || (item.tutorial_markdown || item.post_json || item.link ? [item] : []),
      ai_research_data: parseField(item.ai_research_data),
      x_link: item.x_link || item.projects?.x_link || null,
      logo: getLogo(item),
      logo_url: getLogo(item),       // <-- CRITICAL FIX: Standard Canvas components check this
      project_logo: getLogo(item)    // <-- CRITICAL FIX: Funding Canvas components check this
    }));

    setActiveProjectDataList(cleanList);
    
    const firstItem = enrichedList[0];
    const slug = firstItem?.slug || firstItem?.projects?.slug || cleanList[0].name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setActiveProjectSlug(slug);

    try {
      // 1. Fetch Investor Logos for the Headless Render
      const rawNames = cleanList.flatMap(item => (item.lead_investor || '').split(',').map(n => n.trim())).filter(Boolean);
      if (rawNames.length > 0) {
        const { data: profiles } = await supabase.from('pioneer_profiles').select('name, logo_url').in('name', [...new Set(rawNames)]);
        const logoMap = {};
        if (profiles) profiles.forEach(p => { logoMap[p.name] = p.logo_url; });
        setActiveInvestorLogos(logoMap);
      }

      // 2. Fetch Designs mapped to this template
      const { data: tData } = await supabase.from('studio_templates').select('id').eq('name', templateName).single();
      if (tData) {
        const { data: dData } = await supabase.from('template_designs').select('*').eq('template_id', tData.id).eq('active', true).order('display_order');
        setAvailableDesigns(dData || []);
        setSelectedDesign(dData && dData.length > 0 ? dData[0] : null);
      }

      // 3. Generate AI Text using the fully enriched data
      const { data: aiData, error: aiError } = await engineClient.functions.invoke('generate-social-post', {
        body: { templateName: templateName, projectData: cleanList[0], projectsList: cleanList }
      });

      if (aiError) throw new Error(aiError.message);
      
      setGeneratedTweet({
        x_post: aiData?.thread || '',
        tg_post: aiData?.thread || '',
        fc_post: aiData?.thread || '',
        bs_post: aiData?.thread || ''
      });
      
      setNotice(null);
      setIsScheduleModalOpen(true);
    } catch (error) {
      console.error("AI/Fetch Error:", error);
      setNotice({ type: 'error', text: "Error loading resources: " + error.message });
    }
  };

  const handleConfirmSchedule = async (selectedPlatforms, finalTweets) => {
    setIsScheduling(true);
    try {
      let finalImageUrl = null;

      // --- HEADLESS IMAGE GENERATION ---
      if (selectedDesign) {
        const CanvasComponent = DYNAMIC_REGISTRY[selectedDesign.component_name];
        if (CanvasComponent) {
          // Wrap the raw objects to mimic Creator Studio's prop structure
          const formattedDataProps = {
            raw: activeProjectDataList[0],
            selectedItems: activeProjectDataList.map(p => ({ raw: p, logo: p.logo })),
            sourceData: activeProjectDataList.map(p => ({ raw: p, logo: p.logo })),
            investorLogos: activeInvestorLogos
          };

          // Render React component directly to an HTML string
          const componentHtml = renderToString(<CanvasComponent data={formattedDataProps} />);
          
          // Wrap in standard Browserless Tailwind container
          const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');body { margin: 0; padding: 0; background: #ffffff; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }</style></head><body><div style="width: 1200px; height: 675px; position: relative;">${componentHtml}</div></body></html>`;

          // Hit Supabase 2 Edge Function
          const response = await fetch(`${engineUrl}/functions/v1/generate-screenshot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${engineKey}`, 'apikey': engineKey },
            body: JSON.stringify({ 
              html: fullHtml, 
              options: { type: "png" }, 
              gotoOptions: { waitUntil: "networkidle2" },
              viewport: { width: 1200, height: 675, deviceScaleFactor: 2 } 
            })
          });

          if (!response.ok) throw new Error(`Browserless Error: ${await response.text()}`);

          // Upload to Supabase
          const blob = await response.blob();
          const fileName = `post_${Date.now()}.png`;
          const { error: uploadError } = await engineClient.storage.from('social-media-assets').upload(fileName, blob, { contentType: 'image/png', upsert: false });
          
          if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);

          const { data: publicUrlData } = engineClient.storage.from('social-media-assets').getPublicUrl(fileName);
          finalImageUrl = publicUrlData.publicUrl;
        }
      }

      // --- QUEUE POST ---
      const insertQueue = selectedPlatforms.map(p => {
        let textContent = '';
        if (p.platform === 'telegram') textContent = finalTweets.tg_post || finalTweets.x_post;
        else if (p.platform === 'x') textContent = finalTweets.x_post;
        else if (p.platform === 'farcaster') textContent = finalTweets.fc_post || finalTweets.x_post;
        else if (p.platform === 'binance_square') textContent = finalTweets.bs_post || finalTweets.x_post;
        else textContent = finalTweets.x_post || finalTweets.tg_post;

        return {
          platform: p.platform,
          content_text: textContent,
          image_url: finalImageUrl, // Now contains the newly rendered image URL!
          scheduled_time: p.scheduled_time,
          status: 'scheduled',
          project_slug: activeProjectSlug
        };
      });

      const { error: dbError } = await engineClient.from('social_posts').insert(insertQueue);
      if (dbError) throw new Error(`Database queue error: ${dbError.message}`);

      setIsScheduleModalOpen(false);
      setNotice({ type: 'success', text: `Successfully generated image & scheduled ${selectedPlatforms.length} post(s)!` });
    } catch (error) {
      console.error("Schedule Error:", error);
      setNotice({ type: 'error', text: "Failed to schedule: " + error.message });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="min-h-full w-full bg-white pb-12 text-slate-900">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div><h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-950"><CalendarDays className="h-7 w-7 text-violet-600" strokeWidth={1.8} />Studio Daily Tasks</h1><p className="mt-2 text-sm text-slate-500">Complete or schedule tasks directly to your queue.</p></div>
          <div className="flex flex-col items-start gap-2 sm:items-end"><div className="flex flex-wrap items-center gap-2"><AccountSwitcher activeAccount={activeAccount} onChange={handleAccountChange} /><button type="button" onClick={() => fetchQueues(activeAccount, { background: true })} disabled={refreshing || loading} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></div><span className="text-xs text-slate-500">Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}</span></div>
        </header>

        {notice && <div className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-xs font-medium ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification"><X className="h-4 w-4" /></button></div>}

        {loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm font-medium text-slate-400"><RefreshCw className="h-4 w-4 animate-spin" />Loading {activeAccount} queue...</div> : templateGroups.length === 0 ? <EmptyState text={`All caught up — no pending studio tasks for ${activeAccount}.`} /> : <div className="space-y-7">{templateGroups.map(({ templateName, entries }) => { const headingId = `template-${templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; return <section key={templateName} className="space-y-3" aria-labelledby={headingId}><h2 id={headingId} className="text-sm font-semibold text-slate-950">{templateName}</h2><div className="divide-y divide-slate-100 border-y border-slate-200">{entries.map((entry, index) => entry.type === 'instant' ? <InstantRow key={`instant:${getTemplateId(entry.item)}:${getEntityId(entry.item)}:${index}`} item={entry.item} processing={processingKey === `instant:${getTemplateId(entry.item)}:${getEntityId(entry.item)}`} onAction={(action) => handleInstantAction(entry.item, action)} onSchedule={() => handleOpenSchedule(templateName, entry.item)} /> : <BatchRow key={`batch:${getTemplateId(entry.batch)}:${getBatchTemplateName(entry.batch)}:${index}`} batch={entry.batch} processing={processingKey === `batch:${getTemplateId(entry.batch)}:${getBatchTemplateName(entry.batch)}`} onAction={(action) => handleBatchAction(entry.batch, action)} onSchedule={() => handleOpenSchedule(templateName, getBatchItems(entry.batch))} />)}</div></section>; })}</div>}
      </div>

      <ScheduleModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onConfirm={handleConfirmSchedule}
        isScheduling={isScheduling}
        initialTweets={generatedTweet}
        availableDesigns={availableDesigns}
        selectedDesign={selectedDesign}
        setSelectedDesign={setSelectedDesign}
        activeProject={activeProjectDataList[0]}
      />
    </div>
  );
}

function EmptyState({ text }) { return <div className="border border-dashed border-slate-200 bg-slate-50/50 px-5 py-12 text-center"><CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-emerald-500" /><h2 className="text-sm font-medium text-slate-900">{text}</h2></div>; }
function ProjectLogo({ item, mini = false }) { const logo = getLogo(item); return <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white text-slate-400 ${mini ? 'h-8 w-8 rounded-full' : 'h-10 w-10 rounded-lg'}`}>{logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <ImageIcon className={mini ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}</div>; }
function LogoCluster({ items }) { return <div className="flex w-16 shrink-0 items-center pl-1">{items.slice(0, 3).map((item, index) => <div key={`${getEntityId(item)}:${index}`} className={`${index ? '-ml-2.5' : ''} rounded-full bg-white p-0.5`} style={{ zIndex: 3 - index }}><ProjectLogo item={item} mini /></div>)}</div>; }
function AccountSwitcher({ activeAccount, onChange }) { return <div className="inline-flex h-10 rounded-md border border-slate-200 bg-slate-50 p-1" aria-label="Switch studio account">{STUDIO_ACCOUNTS.map((account) => <button key={account} type="button" onClick={() => onChange(account)} aria-pressed={activeAccount === account} className={`rounded px-3 text-xs font-medium transition ${activeAccount === account ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{account}</button>)}</div>; }

function InstantRow({ item, processing, onAction, onSchedule }) { 
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
      <ProjectLogo item={item} />
      <p className="min-w-0 flex-1 text-sm font-medium text-slate-900">{getTaskTitle(item)}</p>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className="mr-1 whitespace-nowrap text-xs text-slate-500">Added on {formatAddedDate(getAddedAt(item))}</span>
        <ActionButton label="Quick Schedule" icon={<Sparkles className="h-3.5 w-3.5" />} color="violet" disabled={processing} onClick={onSchedule} />
        <ActionButton label="Completed" icon={<Check className="h-3.5 w-3.5" />} color="emerald" disabled={processing} onClick={() => onAction('Completed')} />
        <ActionButton label="Ignore" icon={<X className="h-3.5 w-3.5" />} color="rose" disabled={processing} onClick={() => onAction('Ignored')} />
      </div>
    </div>
  ); 
}

function BatchRow({ batch, processing, onAction, onSchedule }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const items = getBatchItems(batch);
  const names = items.slice(0, 3).map(getItemName).join(', ');
  const remainder = Math.max(0, items.length - 3);
  const batchName = getBatchTemplateName(batch);

  return <>
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
      <LogoCluster items={items} />
      <div className="min-w-0 flex-1 pl-2">
        <button type="button" onClick={() => setPreviewOpen(true)} className="block max-w-full text-left text-sm font-medium text-slate-900 transition hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
          {names}{remainder > 0 ? ` + ${remainder} more` : ''}
        </button>
        <span className="text-xs text-slate-500">View all items</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className="mr-1 whitespace-nowrap text-xs text-slate-500">required {valueOr(batch?.required, '—')} available {items.length}</span>
        <ActionButton label="Quick Schedule" icon={<Sparkles className="h-3.5 w-3.5" />} color="violet" disabled={processing} onClick={onSchedule} />
        <ActionButton label="Completed" icon={<Check className="h-3.5 w-3.5" />} color="emerald" disabled={processing} onClick={() => onAction('Completed')} />
        <ActionButton label="Ignore" icon={<X className="h-3.5 w-3.5" />} color="rose" disabled={processing} onClick={() => onAction('Ignored')} />
      </div>
    </div>
    {previewOpen && <BatchPreviewModal batchName={batchName} items={items} onClose={() => setPreviewOpen(false)} />}
  </>;
}

function BatchPreviewModal({ batchName, items, onClose }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onClick={onClose}>
    <div className="flex max-h-[min(32rem,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="batch-preview-title" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0"><h2 id="batch-preview-title" className="truncate text-base font-semibold text-slate-950">{batchName} - Included Items</h2><p className="mt-1 text-xs text-slate-500">{items.length} {items.length === 1 ? 'item' : 'items'}</p></div>
        <button type="button" onClick={onClose} aria-label="Close included items preview" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        <div className="divide-y divide-slate-100">
          {items.map((item, index) => <div key={`${getEntityId(item)}:${index}`} className="flex items-center gap-3 py-3"><ProjectLogo item={item} /><p className="min-w-0 flex-1 break-words text-sm font-medium text-slate-900">{getItemName(item)}</p></div>)}
        </div>
      </div>
    </div>
  </div>;
}

function ActionButton({ label, icon, color, disabled, onClick }) { 
  let colors = 'border-slate-300 text-slate-700 hover:bg-slate-50';
  if (color === 'emerald') colors = 'border-emerald-300 text-emerald-700 hover:bg-emerald-50';
  if (color === 'rose') colors = 'border-rose-300 text-rose-600 hover:bg-rose-50';
  if (color === 'violet') colors = 'border-violet-300 text-violet-700 hover:bg-violet-50 shadow-sm';
  
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border bg-white px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${colors}`}>{icon}{label}</button>; 
}