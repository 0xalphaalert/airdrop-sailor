import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, CheckCircle2, Image as ImageIcon, RefreshCw, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

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

export default function StudioDailyTasks() {
  const [activeAccount, setActiveAccount] = useState('airdropsailor');
  const [queueData, setQueueData] = useState(EMPTY_QUEUE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [processingKey, setProcessingKey] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const requestId = useRef(0);

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

  return (
    <div className="min-h-full w-full bg-white pb-12 text-slate-900">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div><h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-950"><CalendarDays className="h-7 w-7 text-violet-600" strokeWidth={1.8} />Studio Daily Tasks</h1><p className="mt-2 text-sm text-slate-500">Complete or ignore tasks to keep your queue fresh.</p></div>
          <div className="flex flex-col items-start gap-2 sm:items-end"><div className="flex flex-wrap items-center gap-2"><AccountSwitcher activeAccount={activeAccount} onChange={handleAccountChange} /><button type="button" onClick={() => fetchQueues(activeAccount, { background: true })} disabled={refreshing || loading} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></div><span className="text-xs text-slate-500">Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}</span></div>
        </header>

        {notice && <div className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-xs font-medium ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification"><X className="h-4 w-4" /></button></div>}

        {loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm font-medium text-slate-400"><RefreshCw className="h-4 w-4 animate-spin" />Loading {activeAccount} queue...</div> : templateGroups.length === 0 ? <EmptyState text={`All caught up — no pending studio tasks for ${activeAccount}.`} /> : <div className="space-y-7">{templateGroups.map(({ templateName, entries }) => { const headingId = `template-${templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; return <section key={templateName} className="space-y-3" aria-labelledby={headingId}><h2 id={headingId} className="text-sm font-semibold text-slate-950">{templateName}</h2><div className="divide-y divide-slate-100 border-y border-slate-200">{entries.map((entry, index) => entry.type === 'instant' ? <InstantRow key={`instant:${getTemplateId(entry.item)}:${getEntityId(entry.item)}:${index}`} item={entry.item} processing={processingKey === `instant:${getTemplateId(entry.item)}:${getEntityId(entry.item)}`} onAction={(action) => handleInstantAction(entry.item, action)} /> : <BatchRow key={`batch:${getTemplateId(entry.batch)}:${getBatchTemplateName(entry.batch)}:${index}`} batch={entry.batch} processing={processingKey === `batch:${getTemplateId(entry.batch)}:${getBatchTemplateName(entry.batch)}`} onAction={(action) => handleBatchAction(entry.batch, action)} />)}</div></section>; })}</div>}
      </div>
    </div>
  );
}

function EmptyState({ text }) { return <div className="border border-dashed border-slate-200 bg-slate-50/50 px-5 py-12 text-center"><CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-emerald-500" /><h2 className="text-sm font-medium text-slate-900">{text}</h2></div>; }
function ProjectLogo({ item, mini = false }) { const logo = getLogo(item); return <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white text-slate-400 ${mini ? 'h-8 w-8 rounded-full' : 'h-10 w-10 rounded-lg'}`}>{logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <ImageIcon className={mini ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}</div>; }
function LogoCluster({ items }) { return <div className="flex w-16 shrink-0 items-center pl-1">{items.slice(0, 3).map((item, index) => <div key={`${getEntityId(item)}:${index}`} className={`${index ? '-ml-2.5' : ''} rounded-full bg-white p-0.5`} style={{ zIndex: 3 - index }}><ProjectLogo item={item} mini /></div>)}</div>; }
function AccountSwitcher({ activeAccount, onChange }) { return <div className="inline-flex h-10 rounded-md border border-slate-200 bg-slate-50 p-1" aria-label="Switch studio account">{STUDIO_ACCOUNTS.map((account) => <button key={account} type="button" onClick={() => onChange(account)} aria-pressed={activeAccount === account} className={`rounded px-3 text-xs font-medium transition ${activeAccount === account ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{account}</button>)}</div>; }
function InstantRow({ item, processing, onAction }) { return <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center"><ProjectLogo item={item} /><p className="min-w-0 flex-1 text-sm font-medium text-slate-900">{getTaskTitle(item)}</p><div className="flex flex-wrap items-center gap-2 sm:justify-end"><span className="mr-1 whitespace-nowrap text-xs text-slate-500">Added on {formatAddedDate(getAddedAt(item))}</span><ActionButton label="Completed" icon={<Check className="h-3.5 w-3.5" />} color="emerald" disabled={processing} onClick={() => onAction('Completed')} /><ActionButton label="Ignore" icon={<X className="h-3.5 w-3.5" />} color="rose" disabled={processing} onClick={() => onAction('Ignored')} /></div></div>; }
function BatchRow({ batch, processing, onAction }) {
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
      <div className="flex flex-wrap items-center gap-2 sm:justify-end"><span className="mr-1 whitespace-nowrap text-xs text-slate-500">required {valueOr(batch?.required, '—')} available {items.length}</span><ActionButton label="Completed" icon={<Check className="h-3.5 w-3.5" />} color="emerald" disabled={processing} onClick={() => onAction('Completed')} /><ActionButton label="Ignore" icon={<X className="h-3.5 w-3.5" />} color="rose" disabled={processing} onClick={() => onAction('Ignored')} /></div>
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
function ActionButton({ label, icon, color, disabled, onClick }) { const colors = color === 'emerald' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-rose-300 text-rose-600 hover:bg-rose-50'; return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border bg-white px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${colors}`}>{icon}{label}</button>; }