import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  FileJson2,
  FlaskConical,
  Globe2,
  Send,
  Sparkles,
} from 'lucide-react';

const PROMPT_TEMPLATE = `Analyze the Web3 project at [INSERT_X_URL_HERE]. Return a strictly formatted JSON object with the following schema. Do not include any markdown formatting outside of the JSON block.
{
  "project_details": { "name": "", "handle": "", "category": "", "website": "" },
  "analytics_scores": {
    "funding_health_score": "0-100",
    "tokenomics_airdrop_score": "0-100",
    "social_impact_score": "0-100"
  },
  "funding_info": { "raised": "", "investors": [] },
  "tokenomics": { "confirmed": boolean, "details": "" },
  "airdrop_signals": { "testnet_live": boolean, "announcements": "" },
  "whitepaper_alpha": { "key_takeaways": "" },
  "twitter_thread": [
    "Tweet 1: Intro to project, funding overview, and early testnet/quest announcements.",
    "Tweet 2: Deep dive into the funding round, lead investors, and category health score.",
    "Tweet 3: Tokenomics breakdown and the calculated Airdrop Score based on community allocation.",
    "Tweet 4: Explicit airdrop announcements, points systems, or hints.",
    "Tweet 5: Alpha extracted directly from their whitepaper/docs regarding incentives.",
    "Tweet 6: Social metrics, market hype, and final verdict."
  ]
}`;

const cleanJsonResponse = (value) => value
  .trim()
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```$/, '')
  .trim();

const normalizeScore = (value) => {
  const parsedScore = Number.parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsedScore) ? Math.min(100, Math.max(0, Math.round(parsedScore))) : 0;
};

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const firstDefined = (...values) => values.find((value) => (
  value !== undefined
  && value !== null
  && (typeof value !== 'string' || value.trim() !== '')
));

const toText = (value) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join('; ');
  if (isRecord(value)) return Object.values(value).map(toText).filter(Boolean).join('; ');
  return '';
};

const toTextList = (value) => {
  if (Array.isArray(value)) return value.map(toText).filter(Boolean);
  const text = toText(value);
  return text ? text.split(/[,;]\s*/).filter(Boolean) : [];
};

const parseScore = (value, fallback = 50) => {
  const text = toText(value);
  if (!text) return fallback;

  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return fallback;
  return Math.min(100, Math.max(0, Math.round(Number.parseFloat(match[0]))));
};

const findNestedValue = (value, predicate) => {
  if (!isRecord(value)) return undefined;

  for (const [key, nestedValue] of Object.entries(value)) {
    if (predicate(key.toLowerCase(), nestedValue)) return nestedValue;
    if (isRecord(nestedValue)) {
      const match = findNestedValue(nestedValue, predicate);
      if (match !== undefined) return match;
    }
  }

  return undefined;
};

const getDataPointText = (dataPoints, keywords) => {
  if (!isRecord(dataPoints)) return '';

  const matches = [];
  const visit = (value, path = '') => {
    if (!isRecord(value)) return;

    Object.entries(value).forEach(([key, nestedValue]) => {
      const nextPath = `${path} ${key}`.toLowerCase();
      if (keywords.some((keyword) => nextPath.includes(keyword))) {
        const text = toText(nestedValue);
        if (text) matches.push(text);
        return;
      }
      if (isRecord(nestedValue)) visit(nestedValue, nextPath);
    });
  };

  visit(dataPoints);
  return [...new Set(matches)].join('\n');
};

const findDataPointValue = (dataPoints, keywords) => {
  if (!isRecord(dataPoints)) return undefined;

  for (const [key, value] of Object.entries(dataPoints)) {
    const normalizedKey = key.toLowerCase();
    if (keywords.some((keyword) => normalizedKey.includes(keyword))) return value;
    if (isRecord(value)) {
      const match = findDataPointValue(value, keywords);
      if (match !== undefined) return match;
    }
  }

  return undefined;
};

const inferBoolean = (value, positivePattern) => {
  if (typeof value === 'boolean') return value;
  const text = toText(value);
  if (/\b(false|no|none|unconfirmed|not live|inactive)\b/i.test(text)) return false;
  if (/\b(true|yes|confirmed)\b/i.test(text)) return true;
  return positivePattern.test(text);
};

const shorten = (value, fallback) => {
  const text = toText(value) || fallback;
  return text.length > 240 ? `${text.slice(0, 237).trimEnd()}...` : text;
};

const buildFallbackThread = ({ project, scores, funding, tokenomics, airdrop, whitepaper, socialImpact }) => {
  const projectLabel = [project.name, project.handle].filter(Boolean).join(' ');
  const category = project.category ? ` in ${project.category}` : '';
  const investors = funding.investors.length > 0 ? funding.investors.join(', ') : 'No named investors supplied';
  const testnetStatus = airdrop.testnet_live ? 'A live testnet is reported.' : 'No live testnet is confirmed.';

  return [
    `Tweet 1: ${projectLabel} is a Web3 project${category}. Reported funding: ${shorten(funding.raised, 'not disclosed')}.`,
    `Tweet 2: Funding health scores ${scores.funding_health_score}/100. Investors: ${shorten(investors, 'not disclosed')}.`,
    `Tweet 3: Tokenomics and airdrop potential score ${scores.tokenomics_airdrop_score}/100. ${shorten(tokenomics.details, 'No tokenomics details supplied.')}`,
    `Tweet 4: ${testnetStatus} ${shorten(airdrop.announcements, 'No explicit airdrop announcement was supplied.')}`,
    `Tweet 5: Whitepaper alpha: ${shorten(whitepaper.key_takeaways, 'No whitepaper takeaways were supplied.')}`,
    `Tweet 6: Social impact scores ${scores.social_impact_score}/100${socialImpact.x_followers ? ` with ${toText(socialImpact.x_followers)} reported X followers` : ''}. Final verdict should weigh funding, token distribution, and confirmed participation signals.`,
  ];
};

export function normalizeResearchData(rawJson) {
  if (!isRecord(rawJson)) throw new Error('The response must be a JSON object.');

  const rawProjectDetails = isRecord(rawJson.project_details) ? rawJson.project_details : {};
  const rawProject = isRecord(rawJson.project) ? rawJson.project : {};
  const rawAnalytics = isRecord(rawJson.analytics_scores) ? rawJson.analytics_scores : {};
  const rawFunding = isRecord(rawJson.funding_info) ? rawJson.funding_info : {};
  const rawTokenomics = isRecord(rawJson.tokenomics) ? rawJson.tokenomics : {};
  const rawAirdrop = isRecord(rawJson.airdrop_signals) ? rawJson.airdrop_signals : {};
  const rawWhitepaper = isRecord(rawJson.whitepaper_alpha) ? rawJson.whitepaper_alpha : {};
  const socialImpact = isRecord(rawJson.social_impact) ? rawJson.social_impact : {};
  const dataPoints = isRecord(rawJson.data_points) ? rawJson.data_points : {};

  const fundraisingData = getDataPointText(dataPoints, ['fundrais', 'funding', 'investor', 'capital']);
  const fundraisingValue = findDataPointValue(dataPoints, ['1_fundraising', 'fundrais', 'funding']);
  const raisedData = findDataPointValue(dataPoints, ['amount_raised', 'total_raised', 'raised']);
  const investorData = findDataPointValue(dataPoints, ['investor', 'backer', 'lead']);
  const tokenomicsData = getDataPointText(dataPoints, ['tokenomic', 'token_allocation', 'token allocation', 'distribution']);
  const airdropData = getDataPointText(dataPoints, ['airdrop', 'announcement', 'testnet', 'quest', 'points']);
  const airdropValue = findDataPointValue(dataPoints, ['6_airdrop_announcements', 'airdrop', 'announcement']);
  const whitepaperData = getDataPointText(dataPoints, ['whitepaper', 'docs', 'documentation', 'incentive', 'alpha']);

  const project = {
    ...rawProject,
    ...rawProjectDetails,
    name: toText(firstDefined(rawProjectDetails.name, rawProject.name, typeof rawJson.project === 'string' ? rawJson.project : undefined)) || 'Unknown Project',
    handle: toText(firstDefined(rawProjectDetails.handle, rawJson.x_handle, rawProject.handle)),
    category: toText(firstDefined(rawProjectDetails.category, rawProject.category, rawJson.category)),
    website: toText(firstDefined(rawProjectDetails.website, rawProject.website, rawJson.website)),
  };

  const fundingScoreCandidate = firstDefined(
    rawAnalytics.funding_health_score,
    rawAnalytics.funding_score,
    rawJson.funding_health_score,
    findNestedValue(rawJson, (key) => key.includes('funding') && key.includes('score')),
  );
  const tokenomicsSignalText = `${toText(rawJson.airdrop_signals)} ${toText(dataPoints)} ${airdropData}`;
  const tokenomicsDefault = /(30\s*%|airdrop[\s_-]*zero)/i.test(tokenomicsSignalText) ? 85 : 50;
  const tokenomicsScoreCandidate = firstDefined(
    rawAnalytics.tokenomics_airdrop_score,
    rawAnalytics.airdrop_score,
    rawAnalytics.tokenomics_score,
    rawJson.tokenomics_airdrop_score,
    findNestedValue(rawJson, (key) => (key.includes('tokenomic') || key.includes('airdrop')) && key.includes('score')),
  );
  const socialScoreCandidate = firstDefined(
    rawAnalytics.social_impact_score,
    rawAnalytics.social_score,
    rawJson.social_impact_score,
    socialImpact.x_followers,
    findNestedValue(rawJson, (key) => key.includes('social') && key.includes('score')),
  );
  const scores = {
    ...rawAnalytics,
    funding_health_score: parseScore(fundingScoreCandidate, 50),
    tokenomics_airdrop_score: parseScore(tokenomicsScoreCandidate, tokenomicsDefault),
    social_impact_score: parseScore(socialScoreCandidate, 50),
  };

  const fundingSource = firstDefined(rawFunding.details, rawFunding.summary, fundraisingData, typeof rawJson.funding_info === 'string' ? rawJson.funding_info : undefined);
  const fundraisingSummary = isRecord(fundraisingValue) ? fundraisingData : fundraisingValue;
  const funding = {
    ...rawFunding,
    raised: toText(firstDefined(rawFunding.raised, rawProject.funding, rawJson.raised, raisedData, fundraisingSummary, fundraisingData)) || 'Not disclosed',
    investors: toTextList(firstDefined(rawFunding.investors, rawJson.investors, rawProject.investors, investorData)),
    details: toText(fundingSource),
  };

  const tokenomicsDetails = toText(firstDefined(
    rawTokenomics.details,
    rawTokenomics.summary,
    typeof rawJson.tokenomics === 'string' ? rawJson.tokenomics : undefined,
    tokenomicsData,
  ));
  const tokenomics = {
    ...rawTokenomics,
    confirmed: inferBoolean(
      firstDefined(rawTokenomics.confirmed, tokenomicsData),
      /\b(token allocation|tokenomics|supply|distribution)\b/i,
    ),
    details: tokenomicsDetails || 'No tokenomics details supplied.',
  };

  const airdropAnnouncements = toText(firstDefined(
    rawAirdrop.announcements,
    rawAirdrop.details,
    typeof rawJson.airdrop_signals === 'string' ? rawJson.airdrop_signals : undefined,
    airdropData,
  ));
  const airdrop = {
    ...rawAirdrop,
    testnet_live: inferBoolean(
      firstDefined(rawAirdrop.testnet_live, airdropValue, airdropData),
      /\b(live|active|open)\s+testnet\b|\btestnet\s+(is\s+)?(live|active|open)\b/i,
    ),
    announcements: airdropAnnouncements || 'No airdrop announcements supplied.',
  };

  const whitepaper = {
    ...rawWhitepaper,
    key_takeaways: toText(firstDefined(
      rawWhitepaper.key_takeaways,
      rawWhitepaper.takeaways,
      typeof rawJson.whitepaper_alpha === 'string' ? rawJson.whitepaper_alpha : undefined,
      whitepaperData,
    )) || 'No whitepaper takeaways supplied.',
  };

  const suppliedThread = Array.isArray(rawJson.twitter_thread)
    ? rawJson.twitter_thread.map(toText).filter(Boolean)
    : [];
  const normalized = {
    ...rawJson,
    project_details: project,
    analytics_scores: scores,
    funding_info: funding,
    tokenomics,
    airdrop_signals: airdrop,
    whitepaper_alpha: whitepaper,
    social_impact: socialImpact,
  };

  normalized.twitter_thread = suppliedThread.length > 0
    ? suppliedThread
    : buildFallbackThread({ project, scores, funding, tokenomics, airdrop, whitepaper, socialImpact });

  return normalized;
}

const getSafeWebsite = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

function ScoreMetric({ label, value, textClass, barClass }) {
  const score = normalizeScore(value);

  return (
    <div className="min-w-0 border-l-4 border-slate-200 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-3xl font-black ${textClass}`}>{score}</span>
        <span className="text-xs font-bold text-slate-400">/ 100</span>
      </div>
      <p className="mt-1 text-xs font-black uppercase text-slate-600">{label}</p>
      <div className="mt-3 h-1.5 overflow-hidden bg-slate-100" aria-hidden="true">
        <div className={`h-full ${barClass}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function StatusPill({ active, activeLabel, inactiveLabel }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
    }`}>
      {active ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function ResearchSection({ title, eyebrow, children }) {
  return (
    <section className="border-t border-slate-200 py-6 first:border-t-0">
      <header className="mb-4">
        <p className="text-[11px] font-black uppercase text-blue-600">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function ResearchReport({ research }) {
  const project = research.project_details || {};
  const scores = research.analytics_scores || {};
  const funding = research.funding_info || {};
  const tokenomics = research.tokenomics || {};
  const airdrop = research.airdrop_signals || {};
  const whitepaper = research.whitepaper_alpha || {};
  const thread = Array.isArray(research.twitter_thread) ? research.twitter_thread : [];
  const investors = Array.isArray(funding.investors) ? funding.investors : [];
  const website = getSafeWebsite(project.website);

  return (
    <div className="border border-slate-200 bg-white shadow-sm">
      <section className="border-b border-slate-200 bg-white px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase text-blue-600">Research Report</p>
            <h2 className="mt-1 break-words text-3xl font-black text-slate-950">{project.name || 'Unnamed project'}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-slate-500">
              {project.handle && <span>{project.handle}</span>}
              {project.category && <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{project.category}</span>}
              {website && (
                <a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
                  <Globe2 size={14} /> Website <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-2xl">
            <ScoreMetric label="Funding" value={scores.funding_health_score} textClass="text-blue-600" barClass="bg-blue-600" />
            <ScoreMetric label="Tokenomics" value={scores.tokenomics_airdrop_score} textClass="text-violet-600" barClass="bg-violet-600" />
            <ScoreMetric label="Social" value={scores.social_impact_score} textClass="text-emerald-600" barClass="bg-emerald-600" />
          </div>
        </div>
      </section>

      <div className="grid gap-x-8 px-5 sm:px-7 lg:grid-cols-2">
        <div>
          <ResearchSection eyebrow="Capital" title="Funding">
            <p className="text-2xl font-black text-slate-950">{funding.raised || 'Not disclosed'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {investors.length > 0 ? investors.map((investor) => (
                <span key={String(investor)} className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {String(investor)}
                </span>
              )) : <p className="text-sm text-slate-500">No investors supplied.</p>}
            </div>
          </ResearchSection>

          <ResearchSection eyebrow="Distribution" title="Tokenomics">
            <StatusPill active={tokenomics.confirmed === true} activeLabel="Confirmed" inactiveLabel="Not confirmed" />
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{tokenomics.details || 'No tokenomics details supplied.'}</p>
          </ResearchSection>
        </div>

        <div>
          <ResearchSection eyebrow="Eligibility" title="Airdrop Signals">
            <StatusPill active={airdrop.testnet_live === true} activeLabel="Testnet live" inactiveLabel="No live testnet confirmed" />
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{airdrop.announcements || 'No airdrop announcements supplied.'}</p>
          </ResearchSection>

          <ResearchSection eyebrow="Documentation" title="Whitepaper Alpha">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{whitepaper.key_takeaways || 'No whitepaper takeaways supplied.'}</p>
          </ResearchSection>
        </div>
      </div>

      <section className="border-t border-slate-200 px-5 py-6 sm:px-7">
        <div className="mb-4 flex items-center gap-2">
          <Send size={17} className="text-blue-600" />
          <h3 className="text-lg font-black text-slate-950">Thread Composer</h3>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{thread.length} PARTS</span>
        </div>
        {thread.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {thread.map((tweet, index) => (
              <article key={`${index}-${String(tweet).slice(0, 24)}`} className="border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</span>
                  <span className="text-[10px] font-black uppercase text-slate-400">Tweet preview</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{String(tweet)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="border border-dashed border-slate-300 p-5 text-sm text-slate-500">No thread content was included in the response.</p>
        )}
      </section>
    </div>
  );
}

export default function ProjectResearchHub() {
  const [xUrl, setXUrl] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonResponse, setJsonResponse] = useState('');
  const [research, setResearch] = useState(null);
  const [promptError, setPromptError] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [copied, setCopied] = useState(false);

  const responseStats = useMemo(() => {
    if (!jsonResponse.trim()) return 'Waiting for JSON';
    return `${jsonResponse.length.toLocaleString()} characters pasted`;
  }, [jsonResponse]);

  const generatePrompt = () => {
    const trimmedUrl = xUrl.trim();

    try {
      const parsedUrl = new URL(trimmedUrl);
      const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
      if (!['x.com', 'twitter.com'].includes(hostname)) throw new Error();
    } catch {
      setPromptError('Enter a valid x.com or twitter.com URL.');
      return;
    }

    setPromptError('');
    setCopied(false);
    setGeneratedPrompt(PROMPT_TEMPLATE.replace('[INSERT_X_URL_HERE]', trimmedUrl));
  };

  const copyPrompt = async () => {
    if (!generatedPrompt) return;

    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
    } catch {
      setCopied(false);
      setPromptError('Clipboard access was blocked. Select and copy the prompt manually.');
    }
  };

  const renderResearch = () => {
    if (!jsonResponse.trim()) {
      setJsonError('Paste an AI JSON response before rendering.');
      return;
    }

    try {
      const parsedResponse = JSON.parse(cleanJsonResponse(jsonResponse));
      if (!parsedResponse || Array.isArray(parsedResponse) || typeof parsedResponse !== 'object') {
        throw new Error('The response must be a JSON object.');
      }

      setResearch(normalizeResearchData(parsedResponse));
      setJsonError('');
    } catch (error) {
      setResearch(null);
      setJsonError(error instanceof SyntaxError
        ? `Invalid JSON: ${error.message}`
        : error.message || 'The response could not be parsed.');
    }
  };

  return (
    <div className="min-h-full w-full bg-white text-slate-900">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-5 sm:px-6 lg:px-0 lg:py-0">
        <header className="border-b border-slate-200 pb-5">
          <div className="mb-2 flex items-center gap-2 text-blue-600">
            <FlaskConical size={18} />
            <span className="text-[11px] font-black uppercase">Manual Intelligence Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Project Research Hub</h1>
          <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Generate a fixed research prompt, run it in your external AI workspace, then bring the structured response back for review.
          </p>
        </header>

        <section aria-labelledby="prompt-generator-heading">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">1</span>
            <div>
              <h2 id="prompt-generator-heading" className="text-lg font-black text-slate-950">Prompt Generator</h2>
              <p className="text-xs font-medium text-slate-500">Set the source profile and generate the required research schema.</p>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <label htmlFor="research-x-url" className="text-xs font-black text-slate-700">X (Twitter) URL</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="research-x-url"
                type="url"
                value={xUrl}
                onChange={(event) => {
                  setXUrl(event.target.value);
                  setPromptError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') generatePrompt();
                }}
                placeholder="https://x.com/project"
                className="h-11 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={generatePrompt}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <Sparkles size={16} /> Generate AI Prompt
              </button>
            </div>
            {promptError && <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-600"><AlertCircle size={14} />{promptError}</p>}

            {generatedPrompt && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="generated-research-prompt" className="text-xs font-black text-slate-700">Generated Prompt</label>
                  <button type="button" onClick={copyPrompt} className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700">
                    {copied ? <CheckCircle2 size={14} /> : <Clipboard size={14} />}
                    {copied ? 'Copied' : 'Copy prompt'}
                  </button>
                </div>
                <textarea
                  id="generated-research-prompt"
                  readOnly
                  rows={18}
                  value={generatedPrompt}
                  className="w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-5 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="json-receiver-heading">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">2</span>
            <div>
              <h2 id="json-receiver-heading" className="text-lg font-black text-slate-950">JSON Receiver</h2>
              <p className="text-xs font-medium text-slate-500">Paste the completed response and parse it into the research workspace.</p>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="ai-json-response" className="text-xs font-black text-slate-700">Paste AI JSON Response Here</label>
              <span className="text-[11px] font-bold text-slate-400">{responseStats}</span>
            </div>
            <textarea
              id="ai-json-response"
              rows={12}
              value={jsonResponse}
              onChange={(event) => {
                setJsonResponse(event.target.value);
                setJsonError('');
              }}
              placeholder={'{\n  "project_details": {\n    "name": "..."\n  }\n}'}
              spellCheck="false"
              className="w-full resize-y rounded-md border border-slate-200 bg-white p-4 font-mono text-xs leading-5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-5">
                {jsonError && <p className="flex items-start gap-1.5 text-xs font-bold text-red-600"><AlertCircle size={14} className="mt-0.5 shrink-0" />{jsonError}</p>}
              </div>
              <button
                type="button"
                onClick={renderResearch}
                className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <FileJson2 size={16} /> Render Research
              </button>
            </div>
          </div>
        </section>

        {research && (
          <section aria-labelledby="rendered-research-heading">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">3</span>
              <div>
                <h2 id="rendered-research-heading" className="text-lg font-black text-slate-950">Rendered Research</h2>
                <p className="text-xs font-medium text-slate-500">Review the structured output before any database action.</p>
              </div>
            </div>
            <ResearchReport research={research} />
          </section>
        )}
      </div>
    </div>
  );
}