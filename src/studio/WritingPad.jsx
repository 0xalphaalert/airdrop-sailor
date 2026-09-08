import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  Lightbulb,
  PenLine,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { WORDING_LIBRARY } from './writingLibrary';

const GENERIC_PHRASES = ['game changer', 'next big thing', 'huge potential', 'massive opportunity', 'revolutionary'];

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function evaluateDraft(draft) {
  const text = draft.trim();
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] || '';
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
  const averageSentenceLength = sentences.length ? words.length / sentences.length : words.length;
  const framework = {
    hook: firstLine.length >= 10
      && firstLine.length <= 120
      && /[?!:—]|\b(just|finally|early|found|tested|interesting|why|how|most people|worth|live|new|attention|watching)\b/i.test(firstLine),
    context: /\b(building|simple terms|at its core|problem|what exactly)\b/i.test(text),
    why: /\b(why|because|reason|matters|important|meaning)\b/i.test(text),
    feature: /\b(feature|different|instead of|standout|built|uses|catch)\b/i.test(text),
    action: /(^|\n)(→|•|-|\d+[.)])\s|\b(step|go to|connect|claim|test|join)\b/im.test(text),
    details: /\b(careful|don't|mistake|remember|note|require|need|before you|make sure)\b/i.test(text),
    take: /\b(i think|my take|impression|optimistic|execution|worth watching|personally|curious)\b/i.test(text),
    cta: /\?|\b(save|bookmark|reply|follow|try|share|comment|let me know)\b/i.test(text),
  };
  const genericCount = GENERIC_PHRASES.filter((phrase) => text.toLowerCase().includes(phrase)).length;

  let hook = framework.hook ? 62 : 28;
  if (firstLine.length >= 18 && firstLine.length <= 90) hook += 18;
  if (/\b(just|finally|early|found|tested|interesting|why|how|do not|most people)\b/i.test(firstLine)) hook += 14;
  if (/[?:]/.test(firstLine)) hook += 8;
  if (firstLine.length > 120) hook -= 18;
  if (genericCount) hook -= genericCount * 7;

  const matchedFrameworkParts = Object.values(framework).filter(Boolean).length;
  const structure = (matchedFrameworkParts / 8) * 100;

  let readability = 56;
  if (averageSentenceLength <= 18) readability += 16;
  if (lines.length >= 3) readability += 12;
  if (!lines.some((line) => line.length > 180)) readability += 10;
  if (words.length > 240) readability -= 12;
  if (genericCount) readability -= genericCount * 5;

  const scores = {
    hook: clamp(Math.round(hook)),
    structure: clamp(Math.round(structure)),
    readability: clamp(Math.round(readability)),
  };
  scores.overall = Math.round((scores.hook * 0.4) + (scores.structure * 0.3) + (scores.readability * 0.3));

  const feedback = [];
  if (!framework.hook) feedback.push("Add a 'HOOK' first line with a specific result, tension, question, or discovery.");
  if (!framework.context) feedback.push("Add 'CONTEXT' explaining in simple terms what is building, what happened, or what problem is being solved.");
  if (!framework.why) feedback.push("Add a 'WHY' line explaining why the user should care.");
  if (!framework.feature) feedback.push("Include a 'FEATURE' line highlighting what is different or built to stand out.");
  if (!framework.action) feedback.push("Add an 'ACTION' section with a step, task, or scannable instruction.");
  if (!framework.details) feedback.push("Include 'DETAILS' to warn users of potential mistakes or requirements.");
  if (!framework.take) feedback.push("Add your personal 'TAKE' with an impression, opinion, or open question.");
  if (!framework.cta) feedback.push("Finish with a 'CTA' asking readers to reply, save, share, or let you know their view.");
  if (averageSentenceLength > 18) feedback.push('Shorten the longest sentences to improve mobile readability.');
  if (!feedback.length) feedback.push('All 8 framework parts are present. Keep the specific details and publish with minimal edits.');

  return { scores, feedback };
}

function generateVariations(draft) {
  const cleanDraft = draft.trim();
  const lines = cleanDraft.split('\n').map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] || '[Project] just opened access.';
  const sourceText = lines.slice(1).join(' ') || cleanDraft;

  return [
    {
      title: 'The Full Framework',
      subtitle: 'Hook, Context, Why, Feature, Action, Details, Take, CTA',
      text: `${firstLine}\n\nIn simple terms, here is the context: ${sourceText}\n\nWhy this matters: it gives users a clear reason to understand the opportunity before acting.\n\nThe standout feature is how the core idea is built differently around the user experience.\n\nHere is how to test it:\n→ Go to the official app\n→ Connect your wallet\n→ Complete the first step\n\nBefore you start, make sure you use official links and note every requirement. Do not rush the process.\n\nMy take: I think the idea is worth watching, but execution will matter.\n\nWould you try it? Save this and let me know what you think.`,
    },
    {
      title: 'The Short Update',
      subtitle: 'Hook, Context, Take, CTA',
      text: `${firstLine}\n\nIn simple terms, here is what happened: ${sourceText}\n\nMy take: I think this is worth watching, and I am curious to see what comes next.\n\nWhat do you think? Save this update and let me know.`,
    },
    {
      title: 'The Tutorial',
      subtitle: 'Hook, Context, Action, Details, CTA',
      text: `${firstLine}\n\nIn simple terms, here is the context: ${sourceText}\n\nHere is how to test it:\n→ Go to the official app\n→ Connect your wallet\n→ Claim what you need\n→ Complete each step\n\nBefore you start, make sure you are on the correct network. Do not make the mistake of using unofficial links.\n\nReady to try it? Save this guide and share it with someone who needs the steps.`,
    },
  ];
}

function ScoreBar({ label, value, colorClass }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function EmptyResults({ onStart }) {
  return (
    <div className="border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <Zap className="mx-auto mb-3 text-slate-400" size={28} />
      <h3 className="text-sm font-black text-slate-800">No evaluation yet</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
        Draft a post, then score it against the full 8-part @0xdalai wording framework.
      </p>
      <button type="button" onClick={onStart} className="mt-4 text-xs font-black text-blue-600 hover:text-blue-700">
        Start writing
      </button>
    </div>
  );
}

export default function WritingPad() {
  const [draft, setDraft] = useState('');
  const [activeMobileTab, setActiveMobileTab] = useState('editor');
  const [expandedCategory, setExpandedCategory] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef(null);

  const characters = draft.length;
  const tweetCount = Math.max(1, Math.ceil(characters / 280));
  const variations = useMemo(() => (analysis ? generateVariations(draft) : []), [analysis, draft]);

  const insertPhrase = (phrase) => {
    const textarea = editorRef.current;
    const start = textarea?.selectionStart ?? draft.length;
    const end = textarea?.selectionEnd ?? draft.length;
    const before = draft.slice(0, start);
    const after = draft.slice(end);
    const prefix = before && !before.endsWith('\n') ? '\n\n' : '';
    const nextDraft = `${before}${prefix}${phrase}${after}`;
    setDraft(nextDraft);
    setAnalysis(null);
    setActiveMobileTab('editor');
    requestAnimationFrame(() => {
      if (!textarea) return;
      const nextCursor = start + prefix.length + phrase.length;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const scoreAndPolish = () => {
    if (!draft.trim()) {
      setActiveMobileTab('editor');
      editorRef.current?.focus();
      return;
    }
    setIsEvaluating(true);
    window.setTimeout(() => {
      setAnalysis(evaluateDraft(draft));
      setIsEvaluating(false);
      setActiveMobileTab('results');
    }, 650);
  };

  const copyVariation = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      setCopiedIndex(null);
    }
  };

  const resetDraft = () => {
    setDraft('');
    setAnalysis(null);
    setShowPreview(false);
    setActiveMobileTab('editor');
  };

  return (
    <div className="min-h-full bg-white pt-16 text-slate-900 lg:pt-0">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
              <PenLine size={14} /> Social Studio
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Writing Pad & Hook Engine</h1>
            <p className="mt-1 text-xs font-medium text-slate-500">Build clearer posts with the @0xdalai content framework.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={resetDraft} disabled={!draft} className="inline-flex items-center gap-1.5 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40">
              <Trash2 size={14} /> Clear
            </button>
            <button type="button" onClick={scoreAndPolish} disabled={isEvaluating || !draft.trim()} className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {isEvaluating ? <RotateCw size={14} className="animate-spin" /> : <WandSparkles size={14} />}
              {isEvaluating ? 'Evaluating...' : 'Score & Polish'}
            </button>
          </div>
        </div>
      </header>

      <nav className="sticky top-16 z-20 flex border-b border-slate-200 bg-slate-50 lg:hidden" aria-label="Writing Pad views">
        {[
          ['editor', <PenLine size={14} />, 'Writing Pad'],
          ['library', <BookOpen size={14} />, 'Hook Library'],
          ['results', <Sparkles size={14} />, `AI Score${analysis ? ` (${analysis.scores.overall})` : ''}`],
        ].map(([key, icon, label]) => (
          <button key={key} type="button" onClick={() => setActiveMobileTab(key)} className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-[11px] font-black ${activeMobileTab === key ? 'border-blue-600 bg-white text-blue-600' : 'border-transparent text-slate-500'}`}>
            {icon} {label}
          </button>
        ))}
      </nav>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-12">
        <section className={`${activeMobileTab !== 'library' ? 'hidden lg:block' : 'block'} lg:col-span-4`}>
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500"><BookOpen size={14} /> Hook Library</div>
            <span className="text-[10px] font-bold text-slate-400">{WORDING_LIBRARY.length} categories</span>
          </div>
          <div className="space-y-2 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-1">
            {WORDING_LIBRARY.map((group, index) => {
              const isOpen = expandedCategory === index;
              return (
                <div key={group.category} className="border border-slate-200 bg-white">
                  <button type="button" onClick={() => setExpandedCategory(isOpen ? null : index)} className="flex w-full items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50">
                    <span><span className="block text-xs font-black text-slate-800">{group.category}</span><span className="mt-0.5 block text-[10px] font-medium text-slate-400">{group.description}</span></span>
                    {isOpen ? <ChevronDown size={15} className="text-slate-500" /> : <ChevronRight size={15} className="text-slate-500" />}
                  </button>
                  {isOpen && <div className="border-t border-slate-100 p-2">
                    {group.items.map((phrase, phraseIndex) => (
                      <div key={`${group.category}-${phraseIndex}`} className="group flex cursor-pointer items-start gap-2 border-b border-slate-100 p-2 last:border-0 hover:bg-blue-50" onClick={() => insertPhrase(phrase)}>
                        <p className="min-w-0 flex-1 whitespace-pre-wrap text-xs font-medium leading-relaxed text-slate-700 group-hover:text-blue-900">{phrase}</p>
                        <span className="mt-0.5 shrink-0 bg-slate-100 p-1 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"><Plus size={13} /></span>
                      </div>
                    ))}
                  </div>}
                </div>
              );
            })}
          </div>
        </section>

        <section className={`${activeMobileTab !== 'editor' ? 'hidden lg:block' : 'block'} lg:col-span-4`}>
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500"><FileText size={14} /> Draft Canvas</div>
            <div className="flex items-center gap-2 text-[11px] font-bold"><span className={characters > 280 ? 'text-amber-600' : 'text-slate-500'}>{characters} chars</span><span className="bg-slate-100 px-1.5 py-0.5 text-slate-600">{tweetCount} {tweetCount === 1 ? 'Tweet' : 'Tweets'}</span></div>
          </div>
          <div className="overflow-hidden border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            <textarea ref={editorRef} value={draft} onChange={(event) => { setDraft(event.target.value); setAnalysis(null); }} placeholder="Write a raw post idea or inject a line from the library..." rows={18} className="block min-h-[420px] w-full resize-none p-4 text-sm font-medium leading-relaxed text-slate-900 outline-none placeholder:text-slate-400" />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-3 py-3">
              <span className="text-[10px] font-bold text-slate-400">HOOK - CONTEXT - WHY - FEATURE - ACTION - DETAILS - TAKE - CTA</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowPreview((current) => !current)} className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"><Eye size={13} /> {showPreview ? 'Editor' : 'Preview'}</button>
                <button type="button" onClick={scoreAndPolish} disabled={isEvaluating || !draft.trim()} className="inline-flex items-center gap-1.5 bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"><Sparkles size={13} /> Score Post</button>
              </div>
            </div>
          </div>
          {showPreview && <div className="mt-3 border border-slate-200 bg-slate-50 p-4"><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><Eye size={13} /> Post Preview</div><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{draft || 'Your preview will appear here.'}</p></div>}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[['40%', 'Hook Impact'], ['30%', '8-Part Framework'], ['30%', 'Readability']].map(([value, label]) => <div key={label} className="border border-slate-200 bg-white px-2 py-3"><div className="text-sm font-black text-slate-800">{value}</div><div className="mt-0.5 text-[10px] font-bold text-slate-400">{label}</div></div>)}
          </div>
        </section>

        <section className={`${activeMobileTab !== 'results' ? 'hidden lg:block' : 'block'} lg:col-span-4`}>
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500"><Sparkles size={14} /> AI Score & Polish</div>{analysis && <span className="bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{analysis.scores.overall}/100</span>}</div>
          {!analysis ? <EmptyResults onStart={() => setActiveMobileTab('editor')} /> : <div className="space-y-4">
            <div className="border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-end justify-between"><div><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall score</div><div className="mt-1 text-4xl font-black text-slate-900">{analysis.scores.overall}<span className="text-lg text-slate-400">/100</span></div></div><Lightbulb className="text-amber-500" size={24} /></div>
              <div className="space-y-3"><ScoreBar label="Hook Impact" value={analysis.scores.hook} colorClass="bg-blue-600" /><ScoreBar label="8-Part Framework" value={analysis.scores.structure} colorClass="bg-violet-600" /><ScoreBar label="Readability" value={analysis.scores.readability} colorClass="bg-emerald-600" /></div>
              <div className="mt-4 border border-slate-100 bg-slate-50 p-3"><div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500"><Lightbulb size={13} /> Editor notes</div><ul className="space-y-1.5 text-xs font-medium leading-relaxed text-slate-600">{analysis.feedback.map((note) => <li key={note}>- {note}</li>)}</ul></div>
            </div>
            <div className="flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Polished variations</h2><span className="text-[10px] font-bold text-slate-400">1-click copy</span></div>
            {variations.map((variation, index) => <article key={variation.title} className="border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="text-sm font-black text-slate-800">{variation.title}</h3><p className="mt-0.5 text-[10px] font-bold text-slate-400">{variation.subtitle}</p></div><button type="button" onClick={() => copyVariation(variation.text, index)} className="inline-flex shrink-0 items-center gap-1.5 border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">{copiedIndex === index ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />} {copiedIndex === index ? 'Copied' : 'Copy'}</button></div><p className="whitespace-pre-wrap text-xs font-medium leading-relaxed text-slate-800">{variation.text}</p></article>)}
          </div>}
        </section>
      </main>
    </div>
  );
}