import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CheckSquare,
  Copy,
  Database,
  DollarSign,
  ExternalLink,
  FileJson,
  Image as ImageIcon,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const GROUPS = [
  {
    key: 'projects',
    title: 'Projects',
    table: 'projects',
    nameField: 'name',
    icon: Database,
    fields: [
      { key: 'logo_url', label: 'Logo URL', type: 'logo', placeholder: 'Paste an X URL or handle' },
      { key: 'description', label: 'Project Description', type: 'textarea', placeholder: 'Short project bio...' },
      { key: 'x_link', label: 'X / Twitter URL', type: 'url', placeholder: 'https://x.com/project' },
      { key: 'discord_link', label: 'Discord URL', type: 'url', placeholder: 'https://discord.gg/project' },
      { key: 'slug', label: 'Slug', type: 'text', placeholder: 'project-name' },
      { key: 'ai_research_data', label: 'AI Research Data', type: 'json', shape: 'object' },
      { key: 'founders_details', label: 'Founders Details', type: 'json', shape: 'array' },
      { key: 'tokenomics_details', label: 'Tokenomics Details', type: 'json', shape: 'object' },
      { key: 'competitor_analysis', label: 'Competitor Analysis', type: 'json', shape: 'object' },
    ],
  },
  {
    key: 'fundraising',
    title: 'Fundraising',
    table: 'funding_opportunities',
    nameField: 'project_name',
    icon: DollarSign,
    fields: [
      { key: 'x_link', label: 'X / Twitter URL', type: 'url', placeholder: 'https://x.com/project' },
      { key: 'project_logo', label: 'Logo URL', type: 'logo', placeholder: 'Paste an X URL or handle' },
    ],
  },
  {
    key: 'pioneers',
    title: 'VC Pioneers',
    table: 'pioneer_profiles',
    nameField: 'name',
    icon: Users,
    filter: { column: 'pioneer_type', value: 'VC' },
    fields: [
      { key: 'website', label: 'Website', type: 'vc' },
      { key: 'logo_url', label: 'Logo URL', type: 'logo', placeholder: 'Paste an X URL or handle' },
      { key: 'handle', label: 'X Handle', type: 'vc' },
      { key: 'bio', label: 'Bio', type: 'vc' },
      { key: 'score', label: 'Score', type: 'vc' },
      { key: 'tier', label: 'Tier', type: 'vc' },
      { key: 'portfolio_count', label: 'Portfolio Count', type: 'vc' },
      { key: 'partners', label: 'Partners', type: 'vc', shape: 'array' },
      { key: 'investment_focus', label: 'Investment Focus', type: 'vc', shape: 'array' },
    ],
  },
  {
    key: 'tasks',
    title: 'Tasks',
    table: 'tasks',
    nameField: 'name',
    icon: CheckSquare,
    fields: [
      { key: 'description', label: 'Short Description', type: 'textarea', placeholder: 'Brief summary...' },
      { key: 'link', label: 'Task URL', type: 'url', placeholder: 'https://...' },
      { key: 'recurring', label: 'Recurring Interval', type: 'text', placeholder: 'One-time, Daily, Weekly' },
      { key: 'end_date', label: 'End Date', type: 'date', placeholder: 'YYYY-MM-DD' },
      { key: 'tutorial_markdown', label: 'Tutorial Markdown', type: 'tutorial' },
    ],
  },
];

const JSON_KEYS = new Set([
  'ai_research_data',
  'founders_details',
  'tokenomics_details',
  'competitor_analysis',
  'partners',
  'investment_focus',
]);

const VC_UPDATE_KEYS = [
  'score',
  'tier',
  'website',
  'handle',
  'bio',
  'portfolio_count',
  'partners',
  'investment_focus',
];

const isBlank = (value) => value === null
  || value === undefined
  || (typeof value === 'string' && value.trim() === '');

const isEmptyJson = (value) => {
  if (isBlank(value)) return true;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '{}' || trimmed === '[]') return true;

    try {
      return isEmptyJson(JSON.parse(trimmed));
    } catch {
      return false;
    }
  }

  if (Array.isArray(value)) return value.length === 0;
  return typeof value === 'object' && Object.keys(value).length === 0;
};

const isFieldMissing = (row, field) => {
  if (JSON_KEYS.has(field.key)) return isEmptyJson(row[field.key]);

  const value = row[field.key];
  if (isBlank(value)) return true;
  return field.type === 'logo'
    && typeof value === 'string'
    && value.toLowerCase().includes('clearbit.com');
};

const getMissingFields = (group, row) => group.fields.filter((field) => isFieldMissing(row, field));
const getRecordKey = (group, row) => `${group.key}:${row.id}`;

const cleanJsonResponse = (value) => String(value || '')
  .replace(/^\s*```(?:json)?\s*/i, '')
  .replace(/\s*```\s*$/i, '')
  .trim();

const extractXHandle = (value) => {
  if (!value) return '';

  const normalized = String(value).trim();
  const match = normalized.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/i);
  const candidate = (match?.[1] || normalized).replace(/^@/, '').trim();
  const reservedPaths = new Set(['home', 'explore', 'search', 'intent', 'share', 'i']);

  if (reservedPaths.has(candidate.toLowerCase())) return '';
  return /^[A-Za-z0-9_]{1,15}$/.test(candidate) ? candidate : '';
};

const fetchPermanentLogo = async (identity) => {
  const handle = extractXHandle(identity);
  if (!handle) throw new Error('Enter a valid X URL or handle for the logo.');

  const { data, error } = await supabase.functions.invoke('upload-logo', {
    body: { handle },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('The upload-logo function did not return an ImgBB URL.');
  return data.url;
};

const buildProjectContext = (row) => `Project Name: ${row.name || 'N/A'}
X Profile: ${row.x_link || 'N/A'}
Description: ${row.description || 'N/A'}
Funding: ${row.funding || 'N/A'}
Lead Investors: ${row.lead_investors || 'N/A'}`;

const buildProjectPrompt = (row, fieldKey) => {
  const context = buildProjectContext(row);

  if (fieldKey === 'ai_research_data') {
    return `Research this crypto project using reliable current sources.\n\n${context}\n\nReturn ONLY a raw JSON object with this exact structure:\n{\n  "summary": "Two-sentence project summary",\n  "early_tasks": [{ "task_name": "Task name", "link": "https://..." }],\n  "analysis": "Funding, founder credibility, social signals, token status, competition, and airdrop potential"\n}`;
  }

  if (fieldKey === 'founders_details') {
    return `Find the verified founders and core team for this crypto project.\n\n${context}\n\nReturn ONLY a raw JSON array with this exact structure:\n[\n  {\n    "name": "Founder Name",\n    "role": "CEO / Co-founder / CTO",\n    "background": "Short verified background",\n    "twitter_handle": "handle_without_@",\n    "linkedin_url": "https://linkedin.com/in/..."\n  }\n]`;
  }

  if (fieldKey === 'tokenomics_details') {
    return `Find the verified tokenomics for this crypto project. Use null for unknown values.\n\n${context}\n\nReturn ONLY a raw JSON object with this exact structure:\n{\n  "ticker": "TOKEN",\n  "total_supply": "1000000000",\n  "community_allocation_percentage": 0,\n  "investor_allocation_percentage": 0,\n  "team_allocation_percentage": 0,\n  "ecosystem_allocation_percentage": 0,\n  "tge_date": null,\n  "vesting_notes": "Brief vesting details"\n}`;
  }

  return `Find up to five direct competitors for this crypto project.\n\n${context}\n\nReturn ONLY a raw JSON object with this exact structure:\n{\n  "project_similarity": "Brief differentiation analysis",\n  "competitors": [\n    {\n      "name": "Competitor Name",\n      "domain": "competitor.com",\n      "x_url": "https://x.com/handle",\n      "followers": "450K",\n      "past_airdrops": ["Season 1 (2024)"],\n      "average_airdrop_usd": 1250\n    }\n  ]\n}`;
};

const buildVCPrompt = (row) => `Research the crypto venture capital firm below using reliable current sources.

VC Name: ${row.name || 'N/A'}
Known Website: ${row.website || 'N/A'}
Known X Handle: ${row.handle || 'N/A'}

Return ONLY a raw JSON object. Do not use markdown or code fences. Include every key in this exact structure:
{
  "score": 85,
  "tier": "Tier 1 / Tier 2 / Tier 3 / Unknown",
  "website": "https://...",
  "handle": "handle_without_@",
  "bio": "Concise factual profile",
  "portfolio_count": 50,
  "partners": ["Partner Name"],
  "investment_focus": ["DeFi", "Infrastructure"]
}`;

const formatRecordName = (group, row) => row[group.nameField] || `Record ${String(row.id).slice(0, 8)}`;

export default function AdminDailyTasks() {
  const [activeTab, setActiveTab] = useState('projects');
  const [records, setRecords] = useState({ projects: [], fundraising: [], pioneers: [], tasks: [] });
  const [drafts, setDrafts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [notice, setNotice] = useState(null);
  const [jsonModal, setJsonModal] = useState(null);
  const [tutorialModal, setTutorialModal] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fetchGaps = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setNotice(null);

    try {
      const results = await Promise.all(
        GROUPS.map((group) => {
          let query = supabase.from(group.table).select('*');
          if (group.filter) query = query.eq(group.filter.column, group.filter.value);
          return query;
        }),
      );

      const nextRecords = {};
      GROUPS.forEach((group, index) => {
        const result = results[index];
        if (result.error) throw new Error(`${group.title}: ${result.error.message}`);

        nextRecords[group.key] = (result.data || [])
          .filter((row) => getMissingFields(group, row).length > 0)
          .sort((left, right) => formatRecordName(group, left).localeCompare(formatRecordName(group, right)));
      });

      setRecords(nextRecords);
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Failed to scan data gaps.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // The first scan synchronizes this screen with Supabase after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGaps();
  }, [fetchGaps]);

  const activeGroup = GROUPS.find((group) => group.key === activeTab) || GROUPS[0];

  const totals = useMemo(() => GROUPS.reduce((result, group) => {
    const rows = records[group.key] || [];
    return {
      records: result.records + rows.length,
      fields: result.fields + rows.reduce(
        (sum, row) => sum + getMissingFields(group, row).length,
        0,
      ),
    };
  }, { records: 0, fields: 0 }), [records]);

  const groupCounts = useMemo(() => GROUPS.reduce((result, group) => ({
    ...result,
    [group.key]: (records[group.key] || []).reduce(
      (sum, row) => sum + getMissingFields(group, row).length,
      0,
    ),
  }), {}), [records]);

  const visibleRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (records[activeGroup.key] || []).filter((row) => {
      if (!term) return true;
      return [row[activeGroup.nameField], row.handle, row.x_link, row.website]
        .some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [activeGroup, records, searchTerm]);

  const updateLocalRecord = useCallback((group, rowId, patch) => {
    setRecords((current) => ({
      ...current,
      [group.key]: current[group.key]
        .map((row) => (row.id === rowId ? { ...row, ...patch } : row))
        .filter((row) => getMissingFields(group, row).length > 0),
    }));
  }, []);

  const savePatch = async (group, row, patch, operationKey, successText) => {
    setBusyKey(operationKey);
    setNotice(null);

    try {
      const { error } = await supabase.from(group.table).update(patch).eq('id', row.id);
      if (error) throw error;

      updateLocalRecord(group, row.id, patch);
      setDrafts((current) => {
        const next = { ...current };
        Object.keys(patch).forEach((fieldKey) => delete next[`${getRecordKey(group, row)}:${fieldKey}`]);
        return next;
      });
      setNotice({ type: 'success', text: successText || `${formatRecordName(group, row)} updated.` });
      return true;
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Failed to save the update.' });
      return false;
    } finally {
      setBusyKey('');
    }
  };

  const handleSaveField = async (group, row, field) => {
    const operationKey = `${getRecordKey(group, row)}:${field.key}`;
    const rawValue = String(drafts[operationKey] ?? '').trim();

    if (!rawValue) {
      setNotice({ type: 'error', text: `Enter a value for ${field.label}.` });
      return;
    }

    if (field.type === 'logo') {
      setBusyKey(operationKey);
      setNotice(null);
      try {
        const logoUrl = await fetchPermanentLogo(rawValue);
        await savePatch(group, row, { [field.key]: logoUrl }, operationKey, `${field.label} saved to ImgBB.`);
      } catch (error) {
        setNotice({ type: 'error', text: error.message || 'Logo auto-fetch failed.' });
        setBusyKey('');
      }
      return;
    }

    const patch = { [field.key]: rawValue };
    let logoWarning = '';

    if (field.key === 'x_link') {
      const logoField = group.fields.find((candidate) => candidate.type === 'logo');
      if (logoField && isFieldMissing(row, logoField)) {
        try {
          patch[logoField.key] = await fetchPermanentLogo(rawValue);
        } catch (error) {
          logoWarning = ` Logo auto-fetch failed: ${error.message}`;
        }
      }
    }

    const saved = await savePatch(group, row, patch, operationKey, `${field.label} saved.${logoWarning}`);
    if (saved && logoWarning) setNotice({ type: 'warning', text: `${field.label} saved.${logoWarning}` });
  };

  const handleAutoFetchLogo = async (group, row, field) => {
    const operationKey = `${getRecordKey(group, row)}:${field.key}:auto`;
    const identity = drafts[`${getRecordKey(group, row)}:${field.key}`]
      || drafts[`${getRecordKey(group, row)}:x_link`]
      || row.x_link
      || drafts[`${getRecordKey(group, row)}:handle`]
      || row.handle;

    setBusyKey(operationKey);
    setNotice(null);
    try {
      const logoUrl = await fetchPermanentLogo(identity);
      await savePatch(group, row, { [field.key]: logoUrl }, operationKey, 'Permanent ImgBB logo saved.');
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Logo auto-fetch failed.' });
      setBusyKey('');
    }
  };

  const openProjectJsonModal = (group, row, field) => {
    setCopiedPrompt(false);
    setJsonModal({ kind: 'project', group, row, field, response: '' });
  };

  const openVCModal = (group, row) => {
    setCopiedPrompt(false);
    setJsonModal({ kind: 'vc', group, row, response: '' });
  };

  const getActivePrompt = () => {
    if (!jsonModal) return '';
    return jsonModal.kind === 'vc'
      ? buildVCPrompt(jsonModal.row)
      : buildProjectPrompt(jsonModal.row, jsonModal.field.key);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getActivePrompt());
      setCopiedPrompt(true);
      window.setTimeout(() => setCopiedPrompt(false), 1600);
    } catch {
      setNotice({ type: 'error', text: 'The browser could not copy the prompt.' });
    }
  };

  const handleSaveJsonModal = async () => {
    if (!jsonModal) return;

    try {
      const parsed = JSON.parse(cleanJsonResponse(jsonModal.response));
      const patch = {};

      if (jsonModal.kind === 'vc') {
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
          throw new Error('The VC response must be a JSON object.');
        }

        VC_UPDATE_KEYS.forEach((key) => {
          if (parsed[key] !== undefined && parsed[key] !== null && parsed[key] !== '') patch[key] = parsed[key];
        });

        if (patch.score !== undefined) {
          patch.score = Number(patch.score);
          if (!Number.isFinite(patch.score) || patch.score < 0 || patch.score > 100) {
            throw new Error('Score must be a number from 0 to 100.');
          }
        }
        if (patch.portfolio_count !== undefined) {
          patch.portfolio_count = Number.parseInt(patch.portfolio_count, 10);
          if (!Number.isInteger(patch.portfolio_count) || patch.portfolio_count < 0) {
            throw new Error('Portfolio count must be a non-negative integer.');
          }
        }
        if (patch.handle) patch.handle = String(patch.handle).replace(/^@/, '').trim();
        if (patch.partners !== undefined && !Array.isArray(patch.partners)) {
          throw new Error('Partners must be a JSON array.');
        }
        if (patch.investment_focus !== undefined && !Array.isArray(patch.investment_focus)) {
          throw new Error('Investment focus must be a JSON array.');
        }
      } else {
        const { field } = jsonModal;
        if (field.shape === 'array' && !Array.isArray(parsed)) {
          throw new Error(`${field.label} must be a JSON array.`);
        }
        if (field.shape === 'object' && (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')) {
          throw new Error(`${field.label} must be a JSON object.`);
        }
        if (isEmptyJson(parsed)) throw new Error(`${field.label} cannot be empty.`);
        patch[field.key] = parsed;
      }

      if (!Object.keys(patch).length) throw new Error('No supported values were found in the JSON.');

      const operationKey = `${getRecordKey(jsonModal.group, jsonModal.row)}:json`;
      const saved = await savePatch(
        jsonModal.group,
        jsonModal.row,
        patch,
        operationKey,
        jsonModal.kind === 'vc' ? 'VC profile fields updated.' : `${jsonModal.field.label} updated.`,
      );
      if (saved) setJsonModal(null);
    } catch (error) {
      setNotice({ type: 'error', text: `Invalid JSON: ${error.message}` });
    }
  };

  const saveTutorial = async () => {
    if (!tutorialModal?.markdown.trim()) {
      setNotice({ type: 'error', text: 'Tutorial Markdown cannot be empty.' });
      return;
    }

    const taskGroup = GROUPS.find((group) => group.key === 'tasks');
    const saved = await savePatch(
      taskGroup,
      tutorialModal.row,
      { tutorial_markdown: tutorialModal.markdown.trim() },
      `${getRecordKey(taskGroup, tutorialModal.row)}:tutorial_markdown`,
      'Tutorial Markdown saved.',
    );
    if (saved) setTutorialModal(null);
  };

  const renderInlineField = (group, row, field) => {
    const operationKey = `${getRecordKey(group, row)}:${field.key}`;
    const autoKey = `${operationKey}:auto`;
    const value = drafts[operationKey] ?? '';

    if (field.type === 'tutorial') {
      return (
        <div key={field.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="text-xs font-bold text-slate-700">{field.label}</span>
          <button
            type="button"
            onClick={() => setTutorialModal({ row, markdown: row.tutorial_markdown || '' })}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            Edit Tutorial
          </button>
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-1.5">
        <label htmlFor={`${operationKey}-input`} className="block text-[10px] font-black uppercase text-slate-500">
          {field.label}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {field.type === 'textarea' ? (
            <textarea
              id={`${operationKey}-input`}
              rows={2}
              value={value}
              onChange={(event) => setDrafts((current) => ({ ...current, [operationKey]: event.target.value }))}
              placeholder={field.placeholder}
              className="min-h-10 min-w-0 flex-1 resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
            />
          ) : (
            <input
              id={`${operationKey}-input`}
              type={field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text'}
              value={value}
              onChange={(event) => setDrafts((current) => ({ ...current, [operationKey]: event.target.value }))}
              placeholder={field.placeholder}
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
            />
          )}
          <button
            type="button"
            onClick={() => handleSaveField(group, row, field)}
            disabled={!String(value).trim() || busyKey === operationKey}
            className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:bg-slate-300"
          >
            {busyKey === operationKey ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>
          {field.type === 'logo' && (
            <button
              type="button"
              onClick={() => handleAutoFetchLogo(group, row, field)}
              disabled={busyKey === autoKey}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {busyKey === autoKey ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Auto-Fetch Logo
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 text-slate-900">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-blue-600">
            <CheckCircle2 size={16} /> Admin Quality Assurance
          </div>
          <h1 className="text-2xl font-black text-slate-950">Admin Daily Work</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1">
              <strong className="text-slate-950">{totals.fields}</strong> missing fields
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1">
              <strong className="text-slate-950">{totals.records}</strong> incomplete records
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search records..."
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchGaps({ background: true })}
            disabled={refreshing}
            className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh Feed
          </button>
        </div>
      </header>

      {notice && (
        <div className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-xs font-bold ${
          notice.type === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : notice.type === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          <span className="flex items-center gap-2">
            {notice.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            {notice.text}
          </span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}

      <nav className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1.5">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          const active = group.key === activeTab;
          return (
            <button
              type="button"
              key={group.key}
              onClick={() => {
                setActiveTab(group.key);
                setSearchTerm('');
              }}
              className={`flex shrink-0 items-center gap-2 rounded-md px-4 py-2.5 text-xs font-bold transition ${
                active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              {group.title}
              <span className={`rounded px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                {groupCounts[group.key] || 0}
              </span>
            </button>
          );
        })}
      </nav>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center gap-2 text-sm font-bold text-slate-500">
          <RefreshCw size={18} className="animate-spin text-blue-600" />
          Scanning database records...
        </div>
      ) : visibleRecords.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-center">
          <CheckCircle2 size={36} className="mb-2 text-emerald-500" />
          <h2 className="text-base font-black text-slate-900">All {activeGroup.title} are complete</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">No missing fields in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visibleRecords.map((row) => {
            const missing = getMissingFields(activeGroup, row);
            const inlineFields = missing.filter((field) => field.type !== 'json' && field.type !== 'vc');
            const jsonFields = missing.filter((field) => field.type === 'json');
            const vcFields = missing.filter((field) => field.type === 'vc');
            const logo = row.logo_url || row.project_logo;
            const externalUrl = row.x_link || row.website || row.link;

            return (
              <article key={row.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white text-slate-400">
                    {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-black text-slate-950">{formatRecordName(activeGroup, row)}</h2>
                    <p className="text-[10px] font-bold uppercase text-red-600">
                      {missing.length} missing {missing.length === 1 ? 'field' : 'fields'}
                    </p>
                  </div>
                  {externalUrl && (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open source record link"
                      title="Open source link"
                      className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 hover:text-blue-600"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>

                <div className="space-y-4 p-4">
                  {inlineFields.map((field) => renderInlineField(activeGroup, row, field))}

                  {jsonFields.map((field) => (
                    <div key={field.key} className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                          <FileJson size={14} className="text-blue-600" /> {field.label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProjectJsonModal(activeGroup, row, field)}
                        className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        <Sparkles size={13} /> Generate Prompt
                      </button>
                    </div>
                  ))}

                  {vcFields.length > 0 && (
                    <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                          <FileJson size={14} className="text-blue-600" /> VC Profile JSON
                        </p>
                        <p className="mt-1 truncate text-[10px] font-medium text-slate-500">
                          {vcFields.map((field) => field.label).join(', ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openVCModal(activeGroup, row)}
                        className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        <Sparkles size={13} /> Generate VC Prompt
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {jsonModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  {jsonModal.kind === 'vc' ? 'Update VC Profile' : `Update ${jsonModal.field.label}`}
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">{formatRecordName(jsonModal.group, jsonModal.row)}</p>
              </div>
              <button type="button" onClick={() => setJsonModal(null)} aria-label="Close JSON modal" className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="daily-work-prompt" className="text-[10px] font-black uppercase text-slate-500">AI Prompt</label>
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {copiedPrompt ? <Check size={13} /> : <Copy size={13} />}
                    {copiedPrompt ? 'Copied' : 'Copy Prompt'}
                  </button>
                </div>
                <textarea
                  id="daily-work-prompt"
                  readOnly
                  rows={8}
                  value={getActivePrompt()}
                  className="w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700 outline-none"
                />
              </div>

              <div>
                <label htmlFor="daily-work-json" className="mb-2 block text-[10px] font-black uppercase text-slate-500">
                  {jsonModal.kind === 'vc' ? 'Paste JSON & Update All' : 'Paste JSON Response'}
                </label>
                <textarea
                  id="daily-work-json"
                  rows={10}
                  value={jsonModal.response}
                  onChange={(event) => setJsonModal((current) => ({ ...current, response: event.target.value }))}
                  placeholder="Paste the raw AI JSON response here..."
                  className="w-full resize-y rounded-md border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed text-slate-900 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-5">
              <button type="button" onClick={() => setJsonModal(null)} className="rounded-md px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJsonModal}
                disabled={!jsonModal.response.trim() || busyKey.endsWith(':json')}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {busyKey.endsWith(':json') ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {jsonModal.kind === 'vc' ? 'Paste JSON & Update All' : 'Save JSON'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tutorialModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5">
              <div>
                <h2 className="text-base font-black text-slate-950">Edit Tutorial Markdown</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">{tutorialModal.row.name}</p>
              </div>
              <button type="button" onClick={() => setTutorialModal(null)} aria-label="Close tutorial modal" className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <textarea
                rows={18}
                value={tutorialModal.markdown}
                onChange={(event) => setTutorialModal((current) => ({ ...current, markdown: event.target.value }))}
                placeholder="Write the task tutorial in Markdown..."
                className="w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-5">
              <button type="button" onClick={() => setTutorialModal(null)} className="rounded-md px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTutorial}
                disabled={!tutorialModal.markdown.trim() || busyKey.endsWith(':tutorial_markdown')}
                className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:bg-slate-300"
              >
                {busyKey.endsWith(':tutorial_markdown') ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                Save Tutorial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}