import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, User, UserCircle, CreditCard, Key, Blocks, Users, 
  Bell, Zap, Shield, Database, Palette, FileText, AlertTriangle, 
  ChevronDown, ShieldCheck, UploadCloud, Download, Info, 
  Crown, Cloud, Code, CheckCircle2, ExternalLink, Image as ImageIcon, 
  Layout, FileBox, Plus, Trash2, Clock, Check, RefreshCw, Layers, CalendarClock,
  History, Edit2, Play, Pause, Activity
} from 'lucide-react';
import { supabase } from '../supabaseClient'; 

// Custom toggle component
const Toggle = ({ active, onChange }) => (
  <button 
    type="button"
    onClick={() => onChange && onChange(!active)} 
    className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors cursor-pointer border-none outline-none ${active ? 'bg-violet-600' : 'bg-slate-200'}`}
  >
    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

// Comprehensive Schema matching all tables from Supabase 1
const TABLE_SCHEMA = {
  funding_opportunities: [
    { id: 'project_name', label: 'Project Name' },
    { id: 'project_logo', label: 'Project Logo' },
    { id: 'funding_amount', label: 'Funding Amount' },
    { id: 'round', label: 'Funding Round' },
    { id: 'lead_investor', label: 'Lead Investor' },
    { id: 'category', label: 'Category' },
    { id: 'sector', label: 'Sector' },
    { id: 'chains', label: 'Chains (Array)' },
    { id: 'ai_research_data', label: 'AI Research Data (JSON)' },
    { id: 'founders_details', label: 'Founders Details (JSON)' },
  ],
  projects: [
    { id: 'name', label: 'Project Name' },
    { id: 'logo_url', label: 'Logo URL' },
    { id: 'status', label: 'Project Status' },
    { id: 'tier', label: 'Project Tier' },
    { id: 'funding', label: 'Funding Text' },
    { id: 'airdrop_status', label: 'Airdrop Status' },
    { id: 'social_score', label: 'Social Score' },
    { id: 'ai_research_data', label: 'AI Research Data (JSON)' },
    { id: 'tokenomics_details', label: 'Tokenomics (JSON)' },
  ],
  tasks: [
    { id: 'name', label: 'Task Name' },
    { id: 'status', label: 'Task Status' },
    { id: 'recurring', label: 'Recurring Interval' },
    { id: 'end_date', label: 'End Date' },
    { id: 'is_priority', label: 'Is Priority' },
    { id: 'xp', label: 'XP Reward' },
    { id: 'post_json', label: 'Post Data (JSON)' },
  ],
  discord_roles: [
    { id: 'role_name', label: 'Role Name' },
    { id: 'difficulty_level', label: 'Difficulty Level' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'perks', label: 'Perks' },
  ],
  featured_campaigns: [
    { id: 'brand_name', label: 'Brand Name' },
    { id: 'title', label: 'Campaign Title' },
    { id: 'status', label: 'Status' },
    { id: 'start_date', label: 'Start Date' },
    { id: 'end_date', label: 'End Date' },
    { id: 'reward_sail', label: 'Reward SAIL' },
  ],
  giveaways: [
    { id: 'title', label: 'Giveaway Title' },
    { id: 'is_active', label: 'Is Active' },
    { id: 'reward_pool', label: 'Reward Pool' },
    { id: 'start_date', label: 'Start Date' },
    { id: 'end_date', label: 'End Date' },
  ],
  marketplace_items: [
    { id: 'title', label: 'Item Title' },
    { id: 'category', label: 'Category' },
    { id: 'is_active', label: 'Is Active' },
    { id: 'cost_sail', label: 'Cost (SAIL)' },
    { id: 'start_date', label: 'Start Date' },
  ],
  pioneer_profiles: [
    { id: 'handle', label: 'Handle / Username' },
    { id: 'pioneer_type', label: 'Pioneer Type' },
    { id: 'smart_money', label: 'Smart Money Status' },
    { id: 'tier', label: 'Tier' },
    { id: 'score', label: 'Score' },
  ]
};

const OPERATORS = [
  { id: 'is_not_empty', label: 'Is Not Empty / Null', requiresValue: false },
  { id: 'is_empty', label: 'Is Empty / Null', requiresValue: false },
  { id: 'equals', label: 'Equals (Exact Match)', requiresValue: true },
  { id: 'not_equals', label: 'Does Not Equal', requiresValue: true },
  { id: 'contains', label: 'Contains', requiresValue: true },
  { id: 'greater_than', label: 'Greater Than', requiresValue: true },
  { id: 'is_in_future', label: 'Date is in Future', requiresValue: false },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Automation');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Automation Data States
  const [templates, setTemplates] = useState([]);
  const [allSettings, setAllSettings] = useState([]); // Master list of configured automations
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [designs, setDesigns] = useState([]);
  const [ledgerHistory, setLedgerHistory] = useState([]);
  
  // Settings Form State for selected category
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [targetDesignId, setTargetDesignId] = useState('');
  const [requiredItemCount, setRequiredItemCount] = useState(1);
  const [cooldownHours, setCooldownHours] = useState(0);
  const [fundingTier, setFundingTier] = useState('all');
  const [minFundingUsd, setMinFundingUsd] = useState(0);
  const [platformDelays, setPlatformDelays] = useState({ telegram: 0, x: 15, farcaster: 30, binance_square: 45 });
  const [timeWindows, setTimeWindows] = useState([]);
  
  // Dynamic Rule Engine States
  const [sourceTable, setSourceTable] = useState('tasks'); 
  const [triggerRules, setTriggerRules] = useState([]);

  const [toast, setToast] = useState(null);

  const menuItems = [
    { name: 'General', icon: <SettingsIcon size={16} /> },
    { name: 'Account', icon: <User size={16} /> },
    { name: 'Profile', icon: <UserCircle size={16} /> },
    { name: 'Billing & Plan', icon: <CreditCard size={16} /> },
    { name: 'API Keys', icon: <Key size={16} /> },
    { name: 'Integrations', icon: <Blocks size={16} /> },
    { name: 'Team', icon: <Users size={16} /> },
    { name: 'Notifications', icon: <Bell size={16} /> },
    { name: 'Automation', icon: <Zap size={16} />, badge: 'Auto-Post' },
    { name: 'Automation History', icon: <History size={16} /> },
    { name: 'Security', icon: <Shield size={16} /> },
    { name: 'Data & Backup', icon: <Database size={16} /> },
    { name: 'Appearance', icon: <Palette size={16} /> },
    { name: 'System Logs', icon: <FileText size={16} /> },
    { name: 'Danger Zone', icon: <AlertTriangle size={16} />, danger: true },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      loadCategorySettings(selectedTemplateId);
    }
  }, [selectedTemplateId]);

  useEffect(() => {
    if (activeTab === 'Automation History') {
      fetchHistoryLedger();
    }
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: tmpls } = await supabase.from('studio_templates').select('*').order('name');
      const { data: dsgns } = await supabase.from('template_designs').select('*').order('name');
      
      setTemplates(tmpls || []);
      setDesigns(dsgns || []);

      if (tmpls && tmpls.length > 0) {
        setSelectedTemplateId(tmpls[0].id);
      }
      
      await fetchAllConfiguredSettings();

    } catch (error) {
      console.error('Error fetching studio templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllConfiguredSettings = async () => {
    try {
      const { data } = await supabase.from('posting_category_settings').select('*');
      setAllSettings(data || []);
    } catch (err) {
      console.error('Error fetching all settings:', err);
    }
  };

  const fetchHistoryLedger = async () => {
    try {
      // Assuming studio_templates join works if set up with foreign keys
      const { data, error } = await supabase
        .from('post_publishing_ledger')
        .select(`
          *,
          studio_templates ( name, category )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setLedgerHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const loadCategorySettings = async (templateId) => {
    try {
      const setting = allSettings.find(s => s.template_id === templateId);

      if (setting) {
        setAutoEnabled(setting.auto_schedule_enabled ?? false);
        setTargetDesignId(setting.target_design_id || '');
        setRequiredItemCount(setting.required_item_count ?? 1);
        setCooldownHours(setting.cooldown_hours ?? 0);
        setFundingTier(setting.funding_tier_filter || 'all');
        setMinFundingUsd(setting.min_funding_usd || 0);
        setPlatformDelays(setting.platform_delays || { telegram: 0, x: 15, farcaster: 30, binance_square: 45 });
        
        setSourceTable(setting.source_table || 'tasks');
        if (setting.trigger_rules && setting.trigger_rules.conditions) {
          setTriggerRules(setting.trigger_rules.conditions.map((c, i) => ({ id: `rule-${i}`, ...c })));
        } else {
          setTriggerRules([]);
        }

        const { data: windows } = await supabase
          .from('category_time_windows')
          .select('*')
          .eq('setting_id', setting.id)
          .order('start_time_ist');

        if (windows && windows.length > 0) {
          setTimeWindows(windows.map(w => ({
            id: w.id,
            start: w.start_time_ist.slice(0, 5),
            end: w.end_time_ist.slice(0, 5),
            max_posts: w.max_posts_per_window
          })));
        } else {
          resetDefaultWindows();
        }
      } else {
        setAutoEnabled(false);
        setTargetDesignId('');
        setRequiredItemCount(1);
        setCooldownHours(0);
        setFundingTier('all');
        setMinFundingUsd(0);
        setPlatformDelays({ telegram: 0, x: 15, farcaster: 30, binance_square: 45 });
        setSourceTable('tasks');
        setTriggerRules([]);
        resetDefaultWindows();
      }
    } catch (err) {
      console.error('Error loading category settings:', err);
    }
  };

  const resetDefaultWindows = () => {
    setTimeWindows([
      { id: 'w1', start: '08:00', end: '09:00', max_posts: 1 },
      { id: 'w2', start: '11:00', end: '12:00', max_posts: 1 },
      { id: 'w3', start: '13:00', end: '15:00', max_posts: 1 },
    ]);
  };

  const handleAddRule = () => {
    const defaultTable = sourceTable;
    const defaultField = TABLE_SCHEMA[defaultTable]?.[0]?.id || '';
    setTriggerRules(prev => [
      ...prev,
      { id: `rule-${Date.now()}`, table: defaultTable, field: defaultField, condition: 'is_not_empty', value: '' }
    ]);
  };

  const handleUpdateRule = (id, key, value) => {
    setTriggerRules(prev => prev.map(rule => {
      if (rule.id === id) {
        const updated = { ...rule, [key]: value };
        if (key === 'table') updated.field = TABLE_SCHEMA[value]?.[0]?.id || '';
        if (key === 'condition') {
          const op = OPERATORS.find(o => o.id === value);
          if (op && !op.requiresValue) updated.value = '';
        }
        return updated;
      }
      return rule;
    }));
  };

  const handleRemoveRule = (id) => {
    setTriggerRules(prev => prev.filter(r => r.id !== id));
  };

  const handleAddTimeWindow = () => {
    setTimeWindows(prev => [
      ...prev,
      { id: `new-${Date.now()}`, start: '16:00', end: '17:00', max_posts: 1 }
    ]);
  };

  const handleRemoveTimeWindow = (id) => {
    setTimeWindows(prev => prev.filter(w => w.id !== id));
  };

  const handleWindowChange = (id, field, value) => {
    setTimeWindows(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const handleSaveAutomationSettings = async () => {
    if (!selectedTemplateId) return;
    setSaving(true);
    try {
      const rulesPayload = {
        operator: 'AND',
        conditions: triggerRules.map(({ id, ...rest }) => rest)
      };

      const { data: setting, error: settingErr } = await supabase
        .from('posting_category_settings')
        .upsert({
          template_id: selectedTemplateId,
          target_design_id: targetDesignId || null,
          auto_schedule_enabled: autoEnabled,
          source_table: sourceTable,
          trigger_rules: rulesPayload,
          required_item_count: Number(requiredItemCount) || 1,
          cooldown_hours: Number(cooldownHours) || 0,
          funding_tier_filter: fundingTier,
          min_funding_usd: Number(minFundingUsd) || 0,
          platform_delays: platformDelays,
          updated_at: new Date().toISOString()
        }, { onConflict: 'template_id' })
        .select()
        .single();

      if (settingErr) throw settingErr;

      await supabase.from('category_time_windows').delete().eq('setting_id', setting.id);

      if (timeWindows.length > 0) {
        const windowRows = timeWindows.map(w => ({
          setting_id: setting.id,
          start_time_ist: w.start.length === 5 ? `${w.start}:00` : w.start,
          end_time_ist: w.end.length === 5 ? `${w.end}:00` : w.end,
          max_posts_per_window: Number(w.max_posts) || 1
        }));
        const { error: winErr } = await supabase.from('category_time_windows').insert(windowRows);
        if (winErr) throw winErr;
      }

      await fetchAllConfiguredSettings(); // Refresh master list for the table

      setToast({ type: 'success', text: 'Category rules & cross-table logic saved successfully!' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error saving automation rules:', err);
      setToast({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredDesigns = designs.filter(d => d.template_id === selectedTemplateId);

  // Helper for rendering Active Automations Table
  const getTemplateName = (id) => templates.find(t => t.id === id)?.name || 'Unknown Template';
  const getTemplateCategory = (id) => templates.find(t => t.id === id)?.category || '-';

  return (
    <div className="p-6 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6 items-start font-sans">
      
      {/* 1. LEFT SIDEBAR MENU */}
      <div className="w-full lg:w-64 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col shrink-0">
        {menuItems.map((item, i) => (
          <button 
            key={i} 
            onClick={() => setActiveTab(item.name)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors text-left w-full
              ${activeTab === item.name 
                ? 'bg-violet-50 text-violet-600 font-bold' 
                : item.danger 
                  ? 'text-rose-500 font-bold hover:bg-rose-50' 
                  : 'text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {item.name}
            </div>
            {item.badge && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 space-y-6 min-w-0 w-full">
        
        {toast && (
          <div className={`p-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            {toast.text}
          </div>
        )}

        {/* AUTOMATION / AUTO-POSTING RULES TAB */}
        {activeTab === 'Automation' && (
          <div className="space-y-6">
            
            {/* ACTIVE AUTOMATIONS TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Activity className="text-violet-600" size={20} /> Active Automations
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">Overview of all configured trigger rules and batch posting engines.</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-400">Template / Category</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-400">Primary Trigger Table</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-400">Batch Size</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSettings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-xs font-bold text-slate-500">
                          No automations configured yet. Select a template below to start building.
                        </td>
                      </tr>
                    ) : (
                      allSettings.map((setting) => (
                        <tr key={setting.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="text-sm font-black text-slate-800">{getTemplateName(setting.template_id)}</div>
                            <div className="text-[11px] font-bold text-slate-500">{getTemplateCategory(setting.template_id)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold">
                              {setting.source_table}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-bold text-slate-700">{setting.required_item_count} Item(s)</span>
                          </td>
                          <td className="py-3 px-4">
                            {setting.auto_schedule_enabled ? (
                              <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full w-max">
                                <Play size={12} className="fill-emerald-600" /> Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full w-max">
                                <Pause size={12} className="fill-slate-500" /> Paused
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button 
                              onClick={() => {
                                setSelectedTemplateId(setting.template_id);
                                window.scrollTo({ top: 500, behavior: 'smooth' }); // Scroll down to rule builder
                              }}
                              className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors inline-flex"
                              title="Edit Automation Rules"
                            >
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DYNAMIC RULE BUILDER UI */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-8" id="rule-builder-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Zap className="text-violet-600" size={20} /> Dynamic Rule Engine
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    Configure cross-table logic, batch sizes, IST time windows, and multi-platform scheduling rules.
                  </p>
                </div>
                <button 
                  onClick={handleSaveAutomationSettings}
                  disabled={saving || !selectedTemplateId}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 justify-center disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                  {saving ? 'Saving Rules...' : 'Save Category Rules'}
                </button>
              </div>

              {/* Template / Category Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Target Category Template
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedTemplateId} 
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none appearance-none focus:border-violet-500 cursor-pointer"
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Active Visual Design
                  </label>
                  <div className="relative">
                    <select 
                      value={targetDesignId} 
                      onChange={(e) => setTargetDesignId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none appearance-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="">Default Component (From Template)</option>
                      {filteredDesigns.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.component_name})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <h4 className="text-sm font-black text-slate-800">Enable Automation Engine</h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    When enabled, database updates that pass the rules below will be auto-scheduled.
                  </p>
                </div>
                <Toggle active={autoEnabled} onChange={setAutoEnabled} />
              </div>

              {/* BATCHING & COOLDOWN CONFIGURATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers size={16} className="text-violet-600" />
                    <h4 className="text-sm font-black text-slate-800">Required Item Count (Batch Size)</h4>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 mb-3">
                    Minimum number of unposted items needed to trigger this post (1 = Single Alert, 5 = Top 5, 10 = Top 10).
                  </p>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1"
                      max="50"
                      value={requiredItemCount} 
                      onChange={(e) => setRequiredItemCount(e.target.value)}
                      placeholder="e.g. 1 or 5" 
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                      {Number(requiredItemCount) === 1 ? 'Single Post' : 'Batch List'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarClock size={16} className="text-violet-600" />
                    <h4 className="text-sm font-black text-slate-800">Cooldown Period (Hours)</h4>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 mb-3">
                    Minimum delay before this template can fire again (0 = Instant/No Cooldown, 168 = Weekly).
                  </p>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      value={cooldownHours} 
                      onChange={(e) => setCooldownHours(e.target.value)}
                      placeholder="e.g. 0 or 168" 
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                      {Number(cooldownHours) === 0 ? 'Instant' : `${cooldownHours}h Cooldown`}
                    </span>
                  </div>
                </div>
              </div>

              {/* DYNAMIC RULE BUILDER (CROSS-TABLE) */}
              <div className="border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 mb-1">Execution Trigger Rules</h4>
                    <p className="text-[11px] font-medium text-slate-500">
                      Define conditions across any table. (Strict AND logic)
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">
                    1. Primary Trigger Table
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">Select the main table that triggers the evaluation when a row is inserted/updated.</p>
                  <div className="relative w-full md:w-1/2">
                    <select 
                      value={sourceTable} 
                      onChange={(e) => setSourceTable(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none appearance-none focus:border-violet-500 cursor-pointer"
                    >
                      {Object.keys(TABLE_SCHEMA).map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    2. Execution Conditions (Can span multiple tables)
                  </label>
                  {triggerRules.map((rule, idx) => {
                    const selectedOp = OPERATORS.find(o => o.id === rule.condition);
                    return (
                      <div key={rule.id} className="flex flex-col md:flex-row items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl">
                        <span className="text-[10px] font-black text-slate-400 w-6 text-center shrink-0">{idx + 1}.</span>
                        
                        <select 
                          value={rule.table || ''}
                          onChange={(e) => handleUpdateRule(rule.id, 'table', e.target.value)}
                          className="w-full md:w-1/5 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                        >
                          {Object.keys(TABLE_SCHEMA).map(key => (
                            <option key={key} value={key}>{key}</option>
                          ))}
                        </select>

                        <select 
                          value={rule.field || ''}
                          onChange={(e) => handleUpdateRule(rule.id, 'field', e.target.value)}
                          className="w-full md:w-1/4 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                        >
                          {TABLE_SCHEMA[rule.table]?.map(col => (
                            <option key={col.id} value={col.id}>{col.label}</option>
                          ))}
                        </select>

                        <select 
                          value={rule.condition || ''}
                          onChange={(e) => handleUpdateRule(rule.id, 'condition', e.target.value)}
                          className="w-full md:w-1/4 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                        >
                          {OPERATORS.map(op => (
                            <option key={op.id} value={op.id}>{op.label}</option>
                          ))}
                        </select>

                        {selectedOp?.requiresValue ? (
                           <input 
                            type="text" 
                            placeholder="Value..."
                            value={rule.value || ''}
                            onChange={(e) => handleUpdateRule(rule.id, 'value', e.target.value)}
                            className="w-full md:w-1/4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                          />
                        ) : (
                          <div className="w-full md:w-1/4" /> 
                        )}

                        <button 
                          type="button" 
                          onClick={() => handleRemoveRule(rule.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-auto shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                  {triggerRules.length === 0 && (
                    <p className="text-xs font-bold text-slate-500 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 text-center">
                      No rules defined. Add a cross-table condition below to trigger this template.
                    </p>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={handleAddRule}
                  className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Condition
                </button>
              </div>

              {/* Allowed IST Time Windows */}
              <div className="border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Clock size={16} className="text-violet-600" /> Allowed IST Time Windows (Asia/Kolkata)
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      Define daily posting windows. Auto-scheduler will allocate posts sequentially into these slots.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddTimeWindow}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Window
                  </button>
                </div>

                <div className="space-y-3">
                  {timeWindows.map((win, idx) => (
                    <div key={win.id} className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-black text-slate-400 w-16">Slot #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Start:</span>
                        <input 
                          type="time" 
                          value={win.start} 
                          onChange={(e) => handleWindowChange(win.id, 'start', e.target.value)}
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">End:</span>
                        <input 
                          type="time" 
                          value={win.end} 
                          onChange={(e) => handleWindowChange(win.id, 'end', e.target.value)}
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs font-bold text-slate-600">Max Posts:</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="5" 
                          value={win.max_posts} 
                          onChange={(e) => handleWindowChange(win.id, 'max_posts', e.target.value)}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-violet-500 text-center"
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTimeWindow(win.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Delays */}
              <div>
                <h4 className="text-sm font-black text-slate-800 mb-1">Multi-Platform Stagger Delays (Minutes)</h4>
                <p className="text-[11px] font-medium text-slate-500 mb-4">
                  Minutes offset added to the base slot time per platform.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['telegram', 'x', 'farcaster', 'binance_square'].map(platform => (
                    <div key={platform} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        {platform.replace('_', ' ')}
                      </label>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          min="0" 
                          value={platformDelays[platform] ?? 0}
                          onChange={(e) => setPlatformDelays(prev => ({ ...prev, [platform]: Number(e.target.value) || 0 }))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                        />
                        <span className="text-[10px] font-bold text-slate-400">min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* AUTOMATION HISTORY TAB */}
        {activeTab === 'Automation History' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <History className="text-violet-600" size={20} /> Ledger History
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">Audit log of all records successfully converted into scheduled posts.</p>
                </div>
                <button 
                  onClick={fetchHistoryLedger}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Refresh Log
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-500">Timestamp</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-500">Template Target</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-500">Source Table</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-500">Record ID</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase text-slate-500 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerHistory.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-xs font-bold text-slate-500">
                          No automation history found in the ledger yet.
                        </td>
                      </tr>
                    ) : (
                      ledgerHistory.map((log) => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-xs font-bold text-slate-600">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-black text-slate-800">
                              {log.studio_templates?.name || 'Unknown Template'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[10px] font-bold">
                              {log.source_table}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-500 truncate max-w-[150px]" title={log.record_id}>
                            {log.record_id}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                              <CheckCircle2 size={12} /> Logged
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
          </div>
        )}

        {/* GENERAL SETTINGS TAB */}
        {activeTab === 'General' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-base font-black text-slate-900">General Settings</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">Update your general preferences and basic settings</p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Workspace Name</h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">This is the name of your workspace</p>
                </div>
                <div className="w-full md:w-[320px]">
                  <input 
                    type="text" 
                    defaultValue="AlphaBrain Sailor Studio" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Workspace Timezone</h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">Set the default timezone for your workspace</p>
                </div>
                <div className="w-full md:w-[320px] relative">
                  <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none appearance-none focus:border-violet-500 cursor-pointer">
                    <option>(UTC +05:30) Asia/Kolkata</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 3. RIGHT SIDEBAR WIDGETS */}
      <div className="w-full lg:w-[320px] space-y-6 shrink-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <h3 className="text-sm font-black text-slate-900">System Status</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-700">Studio Engine (S1)</span>
              <span className="font-black text-emerald-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-700">Publishing Engine (S2)</span>
              <span className="font-black text-emerald-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-700">Auto-Scheduler Engine</span>
              <span className="font-black text-emerald-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}