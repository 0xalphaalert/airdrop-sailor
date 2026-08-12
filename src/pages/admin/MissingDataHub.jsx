import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Image as ImageIcon,
  RefreshCw,
  Save,
  Search,
  UploadCloud,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '1de173c5b97e6a61196a6f5153b93960';

const DATA_GROUPS = [
  {
    key: 'projects',
    table: 'projects',
    title: 'Projects',
    description: 'Project identity and community links',
    nameField: 'name',
    fields: [
      { key: 'logo_url', label: 'Project Logo', type: 'image', placeholder: 'Paste a raw image URL' },
      { key: 'x_link', label: 'X / Twitter Link', type: 'url', placeholder: 'https://x.com/project' },
      { key: 'discord_link', label: 'Discord Link', type: 'url', placeholder: 'https://discord.gg/project' },
    ],
  },
  {
    key: 'funding',
    table: 'funding_opportunities',
    title: 'Funding Opportunities',
    description: 'Funding logos, investors, and deal details',
    nameField: 'project_name',
    fields: [
      { key: 'project_logo', label: 'Project Logo', type: 'image', placeholder: 'Paste a raw image URL' },
      { key: 'funding_amount', label: 'Funding Amount', type: 'text', placeholder: 'e.g. $12M' },
      { key: 'round', label: 'Funding Round', type: 'text', placeholder: 'e.g. Series A' },
      { key: 'lead_investor', label: 'Lead Investors', type: 'text', placeholder: 'e.g. a16z, Paradigm' },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Infrastructure' },
      { key: 'sector', label: 'Details / Sector', type: 'textarea', placeholder: 'Add the missing funding details' },
    ],
  },
  {
    key: 'pioneers',
    table: 'pioneer_profiles',
    title: 'Pioneer Profiles',
    description: 'Investor avatars and required profile details',
    nameField: 'name',
    fields: [
      { key: 'logo_url', label: 'Avatar / Logo', type: 'image', placeholder: 'Paste a raw image URL' },
      { key: 'pioneer_type', label: 'Profile Type', type: 'text', placeholder: 'e.g. VC' },
      { key: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
      { key: 'tier', label: 'Tier', type: 'text', placeholder: 'e.g. Tier 1' },
      { key: 'score', label: 'Score', type: 'number', placeholder: '1-100' },
      { key: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Add a short profile description' },
    ],
  },
];

const EMPTY_VALUES = new Set(['', 'n/a', 'null', 'undefined', 'unknown', 'tba', '-', '#']);

const isMissing = (value) => {
  if (value === null || value === undefined) return true;
  return typeof value === 'string' && EMPTY_VALUES.has(value.trim().toLowerCase());
};

const getMissingFields = (row, group) => group.fields.filter((field) => isMissing(row[field.key]));

const getRecordKey = (groupKey, recordId) => `${groupKey}:${recordId}`;

const uploadRemoteImageToImgBB = async (rawImageUrl) => {
  let parsedUrl;

  try {
    parsedUrl = new URL(rawImageUrl);
  } catch {
    throw new Error('Enter a valid image URL.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('The image URL must use http or https.');
  }

  const body = new FormData();
  body.append('image', rawImageUrl);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body,
  });
  const payload = await response.json();

  if (!response.ok || !payload.success || !payload.data?.url) {
    throw new Error(payload?.error?.message || 'ImgBB could not import this image.');
  }

  return payload.data.url;
};

export default function MissingDataHub() {
  const [records, setRecords] = useState({ projects: [], funding: [], pioneers: [] });
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingKey, setProcessingKey] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [loadErrors, setLoadErrors] = useState([]);

  const fetchMissingData = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);

    setLoadErrors([]);

    try {
      const results = await Promise.all(
        DATA_GROUPS.map(async (group) => {
          const { data, error } = await supabase.from(group.table).select('*');
          return { group, data: data || [], error };
        }),
      );

      const nextRecords = { projects: [], funding: [], pioneers: [] };
      const nextErrors = [];

      results.forEach(({ group, data, error }) => {
        if (error) {
          nextErrors.push(`${group.title}: ${error.message}`);
          return;
        }

        nextRecords[group.key] = data
          .filter((row) => getMissingFields(row, group).length > 0)
          .sort((a, b) => String(a[group.nameField] || '').localeCompare(String(b[group.nameField] || '')));
      });

      setRecords(nextRecords);
      setLoadErrors(nextErrors);
    } catch (error) {
      setLoadErrors([error.message || 'The data audit could not be loaded.']);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMissingData();
  }, [fetchMissingData]);

  const visibleGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return DATA_GROUPS.map((group) => {
      const rows = records[group.key].filter((row) => {
        if (!normalizedSearch) return true;
        const name = String(row[group.nameField] || '').toLowerCase();
        return name.includes(normalizedSearch);
      });

      return { ...group, rows };
    });
  }, [records, searchTerm]);

  const totals = useMemo(() => {
    let recordCount = 0;
    let fieldCount = 0;

    DATA_GROUPS.forEach((group) => {
      records[group.key].forEach((row) => {
        recordCount += 1;
        fieldCount += getMissingFields(row, group).length;
      });
    });

    return { recordCount, fieldCount };
  }, [records]);

  const updateDraft = (recordKey, fieldKey, value) => {
    setDrafts((current) => ({
      ...current,
      [recordKey]: { ...current[recordKey], [fieldKey]: value },
    }));
    setStatusMap((current) => ({ ...current, [`${recordKey}:${fieldKey}`]: null }));
  };

  const updateLocalRecord = (group, recordId, fieldKey, value) => {
    setRecords((current) => ({
      ...current,
      [group.key]: current[group.key]
        .map((row) => (row.id === recordId ? { ...row, [fieldKey]: value } : row))
        .filter((row) => getMissingFields(row, group).length > 0),
    }));
  };

  const persistField = async (group, row, field, { uploadImage = false } = {}) => {
    const recordKey = getRecordKey(group.key, row.id);
    const operationKey = `${recordKey}:${field.key}`;
    const rawValue = String(drafts[recordKey]?.[field.key] ?? '').trim();

    if (!rawValue) {
      setStatusMap((current) => ({ ...current, [operationKey]: { type: 'error', message: 'Enter a value first.' } }));
      return;
    }

    setProcessingKey(operationKey);
    setStatusMap((current) => ({
      ...current,
      [operationKey]: { type: 'loading', message: uploadImage ? 'Uploading to ImgBB...' : 'Saving...' },
    }));

    try {
      const finalValue = uploadImage ? await uploadRemoteImageToImgBB(rawValue) : rawValue;
      const { error } = await supabase
        .from(group.table)
        .update({ [field.key]: finalValue })
        .eq('id', row.id);

      if (error) throw error;

      updateLocalRecord(group, row.id, field.key, finalValue);
      setDrafts((current) => ({
        ...current,
        [recordKey]: { ...current[recordKey], [field.key]: '' },
      }));
      setStatusMap((current) => ({ ...current, [operationKey]: { type: 'success', message: 'Saved' } }));
    } catch (error) {
      setStatusMap((current) => ({
        ...current,
        [operationKey]: { type: 'error', message: error.message || 'Update failed.' },
      }));
    } finally {
      setProcessingKey(null);
    }
  };

  const renderField = (group, row, field) => {
    const recordKey = getRecordKey(group.key, row.id);
    const operationKey = `${recordKey}:${field.key}`;
    const status = statusMap[operationKey];
    const isProcessing = processingKey === operationKey;
    const value = drafts[recordKey]?.[field.key] || '';
    const sharedInputClasses = 'w-full min-w-0 border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100';

    return (
      <div key={field.key} className="border-t border-slate-100 py-4 first:border-t-0 first:pt-0 last:pb-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor={`${operationKey}-input`} className="text-[11px] font-black uppercase text-slate-500">
            {field.label}
          </label>
          {status && (
            <span className={`flex items-center gap-1 text-[11px] font-bold ${status.type === 'error' ? 'text-red-600' : status.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}`}>
              {status.type === 'error' ? <AlertCircle size={13} /> : status.type === 'success' ? <CheckCircle2 size={13} /> : <RefreshCw size={13} className="animate-spin" />}
              {status.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          {field.type === 'textarea' ? (
            <textarea
              id={`${operationKey}-input`}
              value={value}
              onChange={(event) => updateDraft(recordKey, field.key, event.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={`${sharedInputClasses} resize-y rounded-md`}
            />
          ) : (
            <input
              id={`${operationKey}-input`}
              type={field.type === 'image' ? 'url' : field.type}
              min={field.type === 'number' ? 1 : undefined}
              max={field.type === 'number' ? 100 : undefined}
              value={value}
              onChange={(event) => updateDraft(recordKey, field.key, event.target.value)}
              placeholder={field.placeholder}
              className={`${sharedInputClasses} h-10 rounded-md`}
            />
          )}

          <button
            type="button"
            onClick={() => persistField(group, row, field, { uploadImage: field.type === 'image' })}
            disabled={isProcessing || !value.trim()}
            className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-md px-3.5 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${field.type === 'image' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            {isProcessing ? <RefreshCw size={15} className="animate-spin" /> : field.type === 'image' ? <UploadCloud size={15} /> : <Save size={15} />}
            {field.type === 'image' ? 'Upload & Save' : 'Save'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <RefreshCw className="mr-3 animate-spin text-blue-600" size={20} />
        <span className="text-sm font-bold">Running data health audit...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-0 lg:py-0">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-red-600">
            <AlertCircle size={18} />
            <span className="text-[11px] font-black uppercase">Data Health</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950">Missing Data Hub</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {totals.recordCount} incomplete records with {totals.fieldCount} fields requiring attention.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
          <div className="relative min-w-0 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search records"
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchMissingData({ background: true })}
            disabled={refreshing}
            className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh Audit
          </button>
        </div>
      </header>

      {loadErrors.length > 0 && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-black">Some audit sources could not be loaded.</p>
          {loadErrors.map((error) => <p key={error} className="mt-1">{error}</p>)}
        </div>
      )}

      {totals.recordCount === 0 && loadErrors.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center border border-dashed border-emerald-300 bg-emerald-50 px-6 text-center">
          <CheckCircle2 size={34} className="mb-3 text-emerald-600" />
          <h2 className="text-lg font-black text-emerald-950">No data gaps detected</h2>
          <p className="mt-1 text-sm font-medium text-emerald-700">All audited project, funding, and pioneer fields are complete.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleGroups.map((group) => (
            <section key={group.key} aria-labelledby={`${group.key}-heading`}>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-slate-500" />
                    <h2 id={`${group.key}-heading`} className="text-base font-black text-slate-950">{group.title}</h2>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-700">{group.rows.length}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500">{group.description}</p>
                </div>
              </div>

              {group.rows.length === 0 ? (
                <div className="border-y border-slate-200 py-6 text-center text-sm font-medium text-slate-400">
                  {searchTerm ? 'No matching incomplete records.' : 'No gaps in this table.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {group.rows.map((row) => {
                    const missingFields = getMissingFields(row, group);
                    const displayName = row[group.nameField] || `Record ${String(row.id).slice(0, 8)}`;
                    const imageField = group.fields.find((field) => field.type === 'image');
                    const currentImage = imageField ? row[imageField.key] : null;

                    return (
                      <article key={row.id} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white text-slate-400">
                            {currentImage ? <img src={currentImage} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={18} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-black text-slate-950">{displayName}</h3>
                            <p className="mt-0.5 text-[11px] font-bold text-red-600">{missingFields.length} missing {missingFields.length === 1 ? 'field' : 'fields'}</p>
                          </div>
                          <span className="hidden max-w-48 truncate font-mono text-[10px] text-slate-400 sm:block" title={String(row.id)}>{String(row.id)}</span>
                        </div>
                        <div className="p-4">
                          {missingFields.map((field) => renderField(group, row, field))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}