import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Database,
  DollarSign,
  FileJson,
  Image as ImageIcon,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Target,
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
      { key: 'x_link', label: 'X / Twitter URL', type: 'url', placeholder: 'https://x.com/project' },
      { key: 'logo_url', label: 'Logo URL', type: 'logo', placeholder: 'Paste an X URL or handle' },
      { key: 'discord_link', label: 'Discord URL', type: 'url', placeholder: 'https://discord.gg/project' },
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
      { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Infrastructure' },
      { key: 'project_logo', label: 'Logo URL', type: 'logo', placeholder: 'Paste an X URL or handle' },
      { key: 'x_link', label: 'X / Twitter URL', type: 'url', placeholder: 'https://x.com/project' },
      { key: 'ai_research_data', label: 'AI Research Data', type: 'json', shape: 'object' },
      { key: 'founders_details', label: 'Founders Details', type: 'json', shape: 'array' },
    ],
  },
  {
    key: 'tasks',
    title: 'Tasks',
    table: 'tasks',
    nameField: 'name',
    icon: Target,
    fields: [
      { key: 'link', label: 'Task URL', type: 'url', placeholder: 'https://...' },
      { key: 'tutorial_markdown', label: 'Tutorial Markdown', type: 'tutorial' },
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
      { key: 'tier', label: 'Tier', type: 'prompt', placeholder: 'Tier 1 / Tier 2 / Tier 3' },
      { key: 'score', label: 'Score', type: 'prompt', placeholder: '1–100' },
      { key: 'website', label: 'Website', type: 'prompt', placeholder: 'https://...' },
      { key: 'logo_url', label: 'Logo URL', type: 'logo', placeholder: 'Paste an X URL or handle' },
      { key: 'handle', label: 'X Handle', type: 'prompt', placeholder: 'handle without @' },
    ],
  },
];

const JSON_FIELD_KEYS = new Set([
  'ai_research_data',
  'founders_details',
  'tokenomics_details',
  'competitor_analysis',
]);

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

const isMissing = (row, field) => {
  if (JSON_FIELD_KEYS.has(field.key)) return isEmptyJson(row[field.key]);

  const value = row[field.key];
  if (isBlank(value)) return true;

  // Treat Clearbit logos as gaps so an X URL can replace them with ImgBB.
  if (field.type === 'logo' && typeof value === 'string' && value.includes('clearbit.com')) {
    return true;
  }

  return false;
};

const getMissingFields = (group, row) => group.fields.filter((field) => isMissing(row, field));
const getRecordKey = (group, row) => `${group.key}:${row.id}`;

const cleanJsonResponse = (value) => value
  .replace(/^\s*```(?:json)?\s*/i, '')
  .replace(/\s*```\s*$/i, '')
  .trim();

const firstDefined = (row, keys) => keys
  .map((key) => row?.[key])
  .find((value) => value !== null && value !== undefined && value !== '');

const normalizePointRules = (rows = []) => rows.reduce((result, row) => {
  const field = firstDefined(row, ['field_name', 'column_name', 'field', 'column', 'data_field']);
  const scope = firstDefined(row, ['table_name', 'table', 'entity_type', 'record_type', 'group']) || 'global';
  const points = Number(firstDefined(row, ['points', 'point_weight', 'weight', 'points_awarded', 'xp', 'value'])) || 0;

  if (!field) return result;

  const scopeKey = String(scope).toLowerCase();
  result[scopeKey] = { ...(result[scopeKey] || {}), [field]: points };
  return result;
}, {});

const getPointsEarnable = (rules, group, missingFields) => missingFields.reduce((total, field) => {
  const scopes = [group.key, group.table, group.title.toLowerCase(), 'global'];
  const points = scopes
    .map((scope) => rules[scope]?.[field.key])
    .find((value) => value !== undefined);

  return total + (Number(points) || 0);
}, 0);

const extractXHandle = (value) => {
  if (!value) return '';
  const normalized = String(value).trim();
  const match = normalized.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/i);
  if (match?.[1]) return match[1].replace(/^@/, '').trim();

  const rawHandle = normalized.replace(/^@/, '');
  return /^[A-Za-z0-9_]{1,15}$/.test(rawHandle) ? rawHandle : '';
};

const autoMigrateLogoToImgBB = async (xUrlOrHandle) => {
  const handle = extractXHandle(xUrlOrHandle);
  if (!handle) return null;

  const { data, error } = await supabase.functions.invoke('upload-logo', {
    body: { handle },
  });

  if (error) throw error;
  return data?.url || null;
};

const generateAIResearchPrompt = (group, row) => {
  if (group.key === 'fundraising') {
    return `Analyze the following funded crypto project deeply.\n\nProject Data:\nName: ${row.project_name || ''}\nFunding: ${row.funding_amount || ''}\nRound: ${row.round || ''}\nInvestors: ${row.lead_investor || ''}\nCategory: ${row.category || ''}\n\n---\nReturn ONLY a raw JSON object with this exact schema (no markdown, no code blocks):\n{\n  "summary": "A punchy, 2-sentence bio of the project and what they are building.",\n  "early_tasks": [\n    { "task_name": "Name of early task (e.g. Join Discord)", "link": "https://link-to-task" }\n  ],\n  "analysis": "Your short 1-2 sentence analysis on funding strength, founder credibility, and airdrop potential."\n}`;
  }

  return `Analyze the following crypto project deeply.\nFocus ONLY on:\n* Funding strength\n* Investors quality\n* Founder credibility\n* Social signals\n* Airdrop signals\n* Token status\n* Product tracking behavior\n* Competition\n\nProject Data:\nName: ${row.name || ''}\nFunding: ${row.funding || ''}\nInvestors: ${row.lead_investors || ''}\nTwitter: ${row.x_link || ''}\nDescription: ${row.description || ''}\n\n---\nReturn ONLY a raw JSON object with this exact schema (no markdown, no code blocks):\n{\n  "summary": "A punchy, 2-sentence bio of the project and what they are building.",\n  "early_tasks": [\n    { "task_name": "Name of early task (e.g. Join Discord)", "link": "https://link-to-task" }\n  ],\n  "analysis": "Your short 1-2 sentence analysis on funding strength, founder credibility, and airdrop potential."\n}`;
};

const generateFoundersPrompt = (row) => `You are a cryptocurrency data researcher. Find the core founders and team details for the crypto project described below.

Use the provided Context Data to uniquely identify the exact company and avoid mixing it up with entities of similar names.

---
CONTEXT DATA:
Project Name: ${row.name || row.project_name || 'N/A'}
Twitter/X Profile: ${row.x_link || 'N/A'}
Amount Raised: ${row.funding || row.funding_amount || 'N/A'}
Lead Investors: ${row.lead_investors || row.lead_investor || 'N/A'}
Project Description: ${row.description || row.sector || 'N/A'}
---

Output ONLY a raw JSON array of objects with no markdown, no code blocks, and no extra text.
Use this exact structure:
[
  {
    "name": "Founder Name",
    "role": "CEO / Co-founder / CTO",
    "background": "Ultra-short background, maximum 4 to 7 words (e.g., Ex-Binance, Stanford CS)",
    "twitter_handle": "exact_handle_without_@",
    "linkedin_url": "https://linkedin.com/in/..."
  }
]`;

const generateTokenomicsPrompt = (row) => `You are a cryptocurrency data researcher. Find the exact tokenomics distribution details for the crypto project described below.

Use the provided Context Data to uniquely identify the exact company and avoid mixing it up with entities of similar names.

---
CONTEXT DATA:
Project Name: ${row.name || 'N/A'}
Twitter/X Profile: ${row.x_link || 'N/A'}
Amount Raised: ${row.funding || 'N/A'}
Lead Investors: ${row.lead_investors || 'N/A'}
Project Description: ${row.description || 'N/A'}
---

Output ONLY a raw JSON object with no markdown, no code blocks, and no extra text. Use null if a specific data point is completely unknown.
Use this exact structure:
{
  "ticker": "TOKEN",
  "total_supply": "1000000000",
  "community_allocation_percentage": 50.5,
  "investor_allocation_percentage": 15.0,
  "team_allocation_percentage": 20.0,
  "ecosystem_allocation_percentage": 14.5,
  "tge_date": "Q3 2024 / confirmed date / null",
  "vesting_notes": "Brief details on team/investor cliffs"
}`;

const generateCompetitorPrompt = (row) => `You are a cryptocurrency data researcher. Find the top 5 direct competitors for the crypto project described below and perform a comparative analysis.

Use the provided Context Data to uniquely identify the exact company:
---
CONTEXT DATA:
Project Name: ${row.name || 'N/A'}
Twitter/X Profile: ${row.x_link || 'N/A'}
Project Description: ${row.description || 'N/A'}
---

Output ONLY a raw JSON object with no markdown formatting, no \`\`\`json code blocks, and no extra text.
Use this exact JSON structural schema:
{
  "project_similarity": "A brief 1-2 sentence comparison explaining if the project is similar to its competitors or what specific extra technology/differentiator it brings to the market.",
  "competitors": [
    {
      "name": "Competitor Name",
      "domain": "competitordomain.com",
      "x_url": "https://x.com/exact_profile_handle",
      "followers": "Follower count string (e.g., 450K, 1.2M)",
      "past_airdrops": ["Season 1 (2024)", "Token Airdrop (2025)"],
      "average_airdrop_usd": 1250
    }
  ]
}

Ensure there are a maximum of 5 competitor objects inside the "competitors" array. If some metrics are unknown, use rough market estimates or historical distribution tracking values for average_airdrop_usd. For the domain, provide the exact root website URL without https (e.g., spectral.finance).`;

const generateVCPrompt = (row) => `You are a cryptocurrency and venture capital data researcher. Find the exact details for the VC firm: "${row.name || ''}".\n\nOutput ONLY a raw JSON object with no markdown, no code blocks, and no extra text.\nUse this exact structure:\n{\n  "tier": "Tier 1 / Tier 2 / Tier 3 / Unknown",\n  "score": <integer from 1 to 100 based on reputation>,\n  "website": "https://...",\n  "handle": "<twitter handle without @>",\n  "bio": "<short description of the VC>",\n  "followers": "<number of followers on X, e.g., '50k'>",\n  "portfolio_count": <integer of known investments>,\n  "partners": ["Partner Name 1", "Partner Name 2"],\n  "investment_focus": ["DeFi", "Layer 1", "Web3"]\n}`;

const PROMPT_LABELS = {
  ai_research_data: 'AI Research',
  founders_details: 'Founders',
  tokenomics_details: 'Tokenomics',
  competitor_analysis: 'Competitors',
  vc_profile: 'VC Profile',
};

const getPromptOptions = (group, fields) => {
  if (group.key === 'pioneers') {
    return [{ key: 'vc_profile', label: PROMPT_LABELS.vc_profile, fields }];
  }

  return fields.map((field) => ({
    key: field.key,
    label: PROMPT_LABELS[field.key] || field.label,
    fields: [field],
  }));
};

const buildPromptForField = (group, row, fieldKey) => {
  if (fieldKey === 'ai_research_data') return generateAIResearchPrompt(group, row);
  if (fieldKey === 'founders_details') return generateFoundersPrompt(row);
  if (fieldKey === 'tokenomics_details') return generateTokenomicsPrompt(row);
  if (fieldKey === 'competitor_analysis') return generateCompetitorPrompt(row);
  if (fieldKey === 'vc_profile') return generateVCPrompt(row);
  return '';
};

export default function DataGapsStudio() {
  const [activeTab, setActiveTab] = useState('projects');
  const [records, setRecords] = useState({ projects: [], fundraising: [], tasks: [], pioneers: [] });
  const [pointRules, setPointRules] = useState({});
  const [drafts, setDrafts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [notice, setNotice] = useState(null);
  const [jsonModal, setJsonModal] = useState(null);
  const [tutorialModal, setTutorialModal] = useState(null);

  const fetchDataGaps = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setNotice(null);

    try {
      const [rulesResult, ...groupResults] = await Promise.all([
        supabase.from('data_gap_rules').select('*'),
        ...GROUPS.map((group) => {
          let query = supabase.from(group.table).select('*');
          if (group.filter) query = query.eq(group.filter.column, group.filter.value);
          return query;
        }),
      ]);

      if (rulesResult.error) {
        setNotice({ type: 'warning', text: `Point rules could not be loaded: ${rulesResult.error.message}` });
      }
      setPointRules(normalizePointRules(rulesResult.data || []));

      const nextRecords = {};
      GROUPS.forEach((group, index) => {
        const result = groupResults[index];
        if (result.error) throw new Error(`${group.title}: ${result.error.message}`);

        nextRecords[group.key] = (result.data || [])
          .filter((row) => getMissingFields(group, row).length > 0)
          .sort((left, right) => String(left[group.nameField] || '').localeCompare(String(right[group.nameField] || '')));
      });

      setRecords(nextRecords);
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'The data-gap audit could not be loaded.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDataGaps();
  }, [fetchDataGaps]);

  const activeGroup = GROUPS.find((group) => group.key === activeTab) || GROUPS[0];

  const visibleRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return (records[activeGroup.key] || []).filter((row) => {
      if (!normalizedSearch) return true;
      return String(row[activeGroup.nameField] || '').toLowerCase().includes(normalizedSearch);
    });
  }, [activeGroup, records, searchTerm]);

  const totals = useMemo(() => GROUPS.reduce((result, group) => {
    const groupRows = records[group.key] || [];
    return {
      records: result.records + groupRows.length,
      fields: result.fields + groupRows.reduce(
        (sum, row) => sum + getMissingFields(group, row).length,
        0,
      ),
    };
  }, { records: 0, fields: 0 }), [records]);

  const updateDraft = (group, row, fieldKey, value) => {
    const key = `${getRecordKey(group, row)}:${fieldKey}`;
    setDrafts((current) => ({ ...current, [key]: value }));
  };

  const updateLocalRecord = (group, rowId, patch) => {
    setRecords((current) => ({
      ...current,
      [group.key]: current[group.key]
        .map((row) => (row.id === rowId ? { ...row, ...patch } : row))
        .filter((row) => getMissingFields(group, row).length > 0),
    }));
  };

  const savePatch = async (group, row, patch, operationKey) => {
    setBusyKey(operationKey);
    setNotice(null);

    try {
      const { error } = await supabase.from(group.table).update(patch).eq('id', row.id);
      if (error) throw error;

      updateLocalRecord(group, row.id, patch);
      setDrafts((current) => {
        const next = { ...current };
        Object.keys(patch).forEach((fieldKey) => {
          delete next[`${getRecordKey(group, row)}:${fieldKey}`];
        });
        return next;
      });
      setNotice({ type: 'success', text: `${row[group.nameField] || 'Record'} updated successfully.` });
      return true;
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'The update failed.' });
      return false;
    } finally {
      setBusyKey('');
    }
  };

  const saveInlineField = async (group, row, field) => {
    const operationKey = `${getRecordKey(group, row)}:${field.key}`;
    const rawValue = String(drafts[operationKey] ?? '').trim();

    if (!rawValue) {
      setNotice({ type: 'error', text: `Enter ${field.label.toLowerCase()} before saving.` });
      return;
    }

    if (field.type === 'logo') {
      await migrateAndSaveLogo(group, row, field, rawValue, operationKey);
      return;
    }

    let patch = { [field.key]: rawValue };

    // Fetch a missing logo alongside URL saves so the two fields stay in sync.
    if (field.key === 'x_link' || field.key === 'website') {
      const logoField = group.fields.find((candidate) => candidate.type === 'logo');

      if (logoField && isMissing(row, logoField)) {
        setNotice({ type: 'success', text: 'Saving URL and auto-fetching logo...' });
        const handle = extractXHandle(rawValue);

        if (handle) {
          try {
            const logoUrl = await autoMigrateLogoToImgBB(handle);
            if (logoUrl) {
              patch[logoField.key] = logoUrl;
            }
          } catch (error) {
            console.warn('Silent auto-logo failure:', error);
          }
        }
      }
    }

    await savePatch(group, row, patch, operationKey);
  };

  const getLogoIdentity = (group, row, field, preferredValue = '') => {
    const logoDraftKey = `${getRecordKey(group, row)}:${field.key}`;
    const xDraftKey = `${getRecordKey(group, row)}:x_link`;
    const handleDraftKey = `${getRecordKey(group, row)}:handle`;
    return preferredValue
      || drafts[logoDraftKey]
      || drafts[xDraftKey]
      || row.x_link
      || drafts[handleDraftKey]
      || row.handle
      || '';
  };

  const migrateAndSaveLogo = async (group, row, field, preferredValue, operationKey) => {
    const identity = getLogoIdentity(group, row, field, preferredValue);
    const handle = extractXHandle(identity);

    if (!handle) {
      setNotice({ type: 'error', text: 'Enter a valid X URL or handle before migrating the logo.' });
      return false;
    }

    setBusyKey(operationKey);
    setNotice(null);

    try {
      const permanentLogoUrl = await autoMigrateLogoToImgBB(handle);
      if (!permanentLogoUrl) throw new Error('The upload-logo function did not return a permanent ImgBB URL.');

      return await savePatch(group, row, { [field.key]: permanentLogoUrl }, operationKey);
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Logo migration failed.' });
      setBusyKey('');
      return false;
    }
  };

  const autoFetchLogo = async (group, row, field) => {
    await migrateAndSaveLogo(
      group,
      row,
      field,
      '',
      `${getRecordKey(group, row)}:${field.key}:auto`,
    );
  };

  const openJsonModal = (group, row, fields) => {
    const promptOptions = getPromptOptions(group, fields);
    setJsonModal({
      group,
      row,
      fields,
      promptOptions,
      selectedPrompt: promptOptions[0]?.key || '',
      response: '',
      copied: false,
    });
  };

  const copyPrompt = async () => {
    if (!jsonModal) return;

    try {
      await navigator.clipboard.writeText(
        buildPromptForField(jsonModal.group, jsonModal.row, jsonModal.selectedPrompt),
      );
      setJsonModal((current) => ({ ...current, copied: true }));
      window.setTimeout(() => {
        setJsonModal((current) => (current ? { ...current, copied: false } : current));
      }, 1500);
    } catch {
      setNotice({ type: 'error', text: 'The browser could not copy the prompt.' });
    }
  };

  const pasteJsonAndSave = async () => {
    if (!jsonModal) return;

    try {
      const parsed = JSON.parse(cleanJsonResponse(jsonModal.response));
      const patch = {};

      if (jsonModal.selectedPrompt === 'vc_profile') {
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
          throw new Error('The VC response must be a valid JSON object.');
        }

        const allowedFields = [
          'tier',
          'score',
          'website',
          'handle',
          'bio',
          'followers',
          'portfolio_count',
          'partners',
          'investment_focus',
        ];
        allowedFields.forEach((fieldKey) => {
          const value = parsed[fieldKey];
          if (value !== null && value !== undefined && value !== '') patch[fieldKey] = value;
        });

        if (patch.score !== undefined) {
          const score = Number(patch.score);
          if (!Number.isFinite(score) || score < 1 || score > 100) {
            throw new Error('VC score must be a number from 1 to 100.');
          }
          patch.score = score;
        }
        if (patch.portfolio_count !== undefined) {
          const portfolioCount = Number.parseInt(patch.portfolio_count, 10);
          if (!Number.isFinite(portfolioCount)) throw new Error('Portfolio count must be an integer.');
          patch.portfolio_count = portfolioCount;
        }
        if (patch.partners !== undefined && !Array.isArray(patch.partners)) {
          throw new Error('VC partners must be a valid JSON array.');
        }
        if (patch.investment_focus !== undefined && !Array.isArray(patch.investment_focus)) {
          throw new Error('VC investment_focus must be a valid JSON array.');
        }
        if (patch.handle) {
          patch.handle = String(patch.handle).replace(/^@/, '');
        }
      } else {
        const selectedField = jsonModal.fields.find((field) => field.key === jsonModal.selectedPrompt);
        if (!selectedField) throw new Error('Select a missing JSON field before saving.');

        if (selectedField.shape === 'array') {
          if (!Array.isArray(parsed)) {
            throw new Error(`${selectedField.label} must be a valid JSON array.`);
          }
        } else if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
          throw new Error(`${selectedField.label} must be a valid JSON object.`);
        }

        patch[selectedField.key] = parsed;
      }

      if (!Object.keys(patch).length) {
        throw new Error('The JSON response does not contain any supported fields.');
      }

      const saved = await savePatch(
        jsonModal.group,
        jsonModal.row,
        patch,
        `${getRecordKey(jsonModal.group, jsonModal.row)}:json:${jsonModal.selectedPrompt}`,
      );
      if (saved) setJsonModal(null);
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'The pasted JSON is invalid.' });
    }
  };

  const saveTutorial = async () => {
    if (!tutorialModal?.markdown.trim()) {
      setNotice({ type: 'error', text: 'Tutorial Markdown cannot be empty.' });
      return;
    }

    const group = GROUPS.find((item) => item.key === 'tasks');
    const saved = await savePatch(
      group,
      tutorialModal.row,
      { tutorial_markdown: tutorialModal.markdown },
      `${getRecordKey(group, tutorialModal.row)}:tutorial_markdown`,
    );
    if (saved) setTutorialModal(null);
  };

  const renderInlineField = (group, row, field) => {
    const operationKey = `${getRecordKey(group, row)}:${field.key}`;
    const autoFetchKey = `${operationKey}:auto`;
    const value = drafts[operationKey] || '';

    if (field.type === 'tutorial') {
      return (
        <div key={field.key} className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-200 px-3 py-2.5">
          <span className="text-xs font-bold text-slate-600">{field.label}</span>
          <button
            type="button"
            onClick={() => setTutorialModal({ row, markdown: row.tutorial_markdown || '' })}
            className="rounded-md bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-700 hover:bg-amber-100"
          >
            Edit Tutorial
          </button>
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {field.label}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type={field.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(event) => updateDraft(group, row, field.key, event.target.value)}
            placeholder={field.placeholder}
            className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => saveInlineField(group, row, field)}
            disabled={!value.trim() || busyKey === operationKey}
            className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 text-[11px] font-black text-white disabled:bg-slate-300"
          >
            {busyKey === operationKey ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>
          {field.type === 'logo' && (
            <button
              type="button"
              onClick={() => autoFetchLogo(group, row, field)}
              disabled={busyKey === autoFetchKey}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 text-[11px] font-black text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {busyKey === autoFetchKey ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Auto-Fetch Logo
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-sm font-bold text-slate-500">
        <RefreshCw size={20} className="animate-spin text-blue-600" />
        Scanning required data...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 text-slate-900">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-red-600">
            <AlertCircle size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Data Health Studio</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Data Gaps Studio</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {totals.records} incomplete records · {totals.fields} missing fields
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search records"
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-56"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchDataGaps({ background: true })}
            disabled={refreshing}
            className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
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
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}

      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          const isActive = activeTab === group.key;
          return (
            <button
              type="button"
              key={group.key}
              onClick={() => {
                setActiveTab(group.key);
                setSearchTerm('');
              }}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black transition ${
                isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon size={15} />
              {group.title}
              <span className={`rounded px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                {records[group.key].length}
              </span>
            </button>
          );
        })}
      </nav>

      {visibleRecords.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50 text-center">
          <CheckCircle2 size={34} className="mb-3 text-emerald-600" />
          <h2 className="text-lg font-black text-emerald-950">No {activeGroup.title.toLowerCase()} gaps found</h2>
          <p className="mt-1 text-sm font-medium text-emerald-700">All required fields in this tab are complete.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleRecords.map((row) => {
            const missingFields = getMissingFields(activeGroup, row);
            const promptFields = missingFields.filter((field) => (
              field.type === 'json' || field.type === 'prompt'
            ));
            const inlineFields = missingFields.filter((field) => (
              field.type !== 'json' && field.type !== 'prompt'
            ));
            const points = getPointsEarnable(pointRules, activeGroup, missingFields);
            const logo = row.logo_url || row.project_logo;

            return (
              <article key={row.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-400">
                    {logo ? (
                      <img src={logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-black text-slate-950">
                      {row[activeGroup.nameField] || `Record ${String(row.id).slice(0, 8)}`}
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                      {missingFields.length} missing {missingFields.length === 1 ? 'field' : 'fields'}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800">
                    <Sparkles size={12} /> Points Earnable: {points}
                  </span>
                </div>

                <div className="space-y-4 p-4">
                  {inlineFields.map((field) => renderInlineField(activeGroup, row, field))}

                  {promptFields.length > 0 && (
                    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-violet-200 bg-violet-50/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-black text-violet-900">
                          <FileJson size={14} /> AI-assisted fields
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-violet-600">
                          {promptFields.map((field) => field.label).join(', ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openJsonModal(activeGroup, row, promptFields)}
                        className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-violet-600 px-3 py-2 text-[11px] font-black text-white hover:bg-violet-700"
                      >
                        <FileJson size={14} /> Copy Prompt / Paste JSON
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
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-black text-slate-950">Complete Missing Research Data</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {jsonModal.row[jsonModal.group.nameField] || 'Selected record'}
                </p>
              </div>
              <button type="button" onClick={() => setJsonModal(null)} className="text-slate-400 hover:text-slate-700" aria-label="Close modal">
                <X />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-5">
              <div>
                <label htmlFor="data-gap-prompt-field" className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Prompt field
                </label>
                <select
                  id="data-gap-prompt-field"
                  value={jsonModal.selectedPrompt}
                  onChange={(event) => setJsonModal((current) => ({
                    ...current,
                    selectedPrompt: event.target.value,
                    response: '',
                    copied: false,
                  }))}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  {jsonModal.promptOptions.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={copyPrompt}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-700"
              >
                {jsonModal.copied ? <Check size={14} /> : <Copy size={14} />}
                {jsonModal.copied ? 'Prompt Copied' : 'Copy Prompt'}
              </button>
              <textarea
                value={jsonModal.response}
                onChange={(event) => setJsonModal((current) => ({ ...current, response: event.target.value }))}
                rows={12}
                placeholder="Paste the raw JSON response here..."
                className="w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 p-5">
              <button type="button" onClick={() => setJsonModal(null)} className="rounded-md px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={pasteJsonAndSave}
                disabled={!jsonModal.response.trim() || busyKey.includes(':json:')}
                className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-black text-white disabled:bg-slate-300"
              >
                <ClipboardPaste size={14} /> Paste JSON & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {tutorialModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-black text-slate-950">Edit Tutorial Markdown</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">{tutorialModal.row.name}</p>
              </div>
              <button type="button" onClick={() => setTutorialModal(null)} className="text-slate-400 hover:text-slate-700" aria-label="Close modal">
                <X />
              </button>
            </div>
            <div className="bg-slate-50 p-5">
              <textarea
                value={tutorialModal.markdown}
                onChange={(event) => setTutorialModal((current) => ({ ...current, markdown: event.target.value }))}
                rows={18}
                placeholder="Write the task tutorial in Markdown..."
                className="w-full rounded-lg border border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 p-5">
              <button type="button" onClick={() => setTutorialModal(null)} className="rounded-md px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTutorial}
                disabled={!tutorialModal.markdown.trim() || busyKey.endsWith(':tutorial_markdown')}
                className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-black text-white disabled:bg-slate-300"
              >
                <Save size={14} /> Save Tutorial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}