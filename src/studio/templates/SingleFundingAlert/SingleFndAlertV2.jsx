import React from 'react';
import { CalendarDays, Globe, Send, UserRound } from 'lucide-react';

/* ---------------- Icons ---------------- */
function LinkedInIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.71h.05c.53-.95 1.83-1.96 3.76-1.96 4.02 0 4.76 2.5 4.76 5.75V21h-4v-5.63c0-1.34-.03-3.07-1.97-3.07-1.97 0-2.27 1.46-2.27 2.97V21h-4V9z" />
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.53 3h3.03l-6.62 7.57L21.75 21h-5.9l-4.62-6.04L5.9 21H2.87l7.08-8.09L2.25 3h6.05l4.18 5.52L17.53 3zm-1.06 16.2h1.68L7.61 4.71H5.8l10.67 14.49z" />
    </svg>
  );
}

/* ---------------- Sub components ---------------- */
function IconPill({ children, label, href }) {
  const Tag = href ? 'a' : 'span';
  return (
    <Tag
      {...(href ? { href, target: '_blank', rel: 'noreferrer' } : {})}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-600/25 text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
    >
      {children}
      <span className="sr-only">{label}</span>
    </Tag>
  );
}

function FounderCard({ founder }) {
  return (
    <article className="relative flex min-h-[196px] flex-1 flex-col rounded-2xl bg-white pt-5 pr-5 pb-4 pl-5 shadow-[0_10px_30px_-12px_rgba(16,34,74,0.18)] ring-1 ring-slate-900/5">
      {/* Avatar overlapping the top-left edge */}
      <div className="absolute -top-6 -left-6 h-[80px] w-[80px] overflow-hidden rounded-full bg-blue-50 ring-4 ring-white shadow-sm">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${founder.name}&backgroundColor=b6e3f4`}
          alt={`Portrait of ${founder.name}`}
          className="h-full w-full object-cover"
        />
      </div>

      <header className="pl-[64px]">
        <h3 className="text-[21px] leading-tight font-extrabold text-slate-900 text-balance truncate">{founder.name}</h3>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          {founder.role || 'Founder'}
        </span>
      </header>

      <div className="mt-3 h-[3px] w-8 rounded-full bg-blue-600" />

      {/* Uses founder.background from our AI JSON logic */}
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-500 line-clamp-4">
        {founder.background || founder.bio || 'Building the future of web3 infrastructure.'}
      </p>

      <footer className="mt-auto flex items-center gap-2 pt-3">
        <IconPill label={`${founder.name} on LinkedIn`} href={founder.linkedin_url}>
          <LinkedInIcon className="h-3.5 w-3.5" />
        </IconPill>
        <span className="h-4 w-px bg-slate-900/15" aria-hidden="true" />
        <IconPill label={`${founder.name} on X`} href={founder.twitter_handle ? `https://x.com/${founder.twitter_handle}` : null}>
          <XIcon className="h-3.5 w-3.5" />
        </IconPill>
      </footer>
    </article>
  );
}

function FooterLink({ icon, label, href }) {
  return (
    <a
      href={href ?? '#'}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2.5 px-5 text-[15px] font-semibold text-slate-900 transition-colors hover:text-blue-600"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">{icon}</span>
      {label}
    </a>
  );
}

/* ---------------- Main Component ---------------- */
export default function SingleFndAlertV2({ data }) {
  // 1. Safely Extract Data
  const raw = data?.raw || {};
  const projectName = raw.project_name || 'Project Name';
  const projectLogo = raw.project_logo || 'https://api.dicebear.com/7.x/shapes/svg?seed=fallback';
  
  // Format current date
  const dateStr = raw.last_updated || new Date().toISOString();
  const date = new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  // 2. Parse Founder JSON
  let founders = [];
  try {
    if (raw.founders_details) {
      const parsed = typeof raw.founders_details === 'string' ? JSON.parse(raw.founders_details) : raw.founders_details;
      if (Array.isArray(parsed) && parsed.length > 0) {
        founders = parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse founders");
  }

  // 3. Fallback Founders (Matches reference image)
  if (founders.length === 0) {
    founders = [
      {
        name: 'Prof. Salman',
        role: 'Co-Founder & CEO',
        background: "18,000+ citations, IEEE Fellow, Presidential PECASE Awardee. Dean's Professor @ USC, leading USC-Amazon Trustworthy AI Center.",
        linkedin_url: '#',
        twitter_handle: 'salman'
      },
      {
        name: 'Dr. Aiden',
        role: 'Co-Founder & CTO',
        background: "10 years of R&D Experience at Google, Meta, Amazon, Tencent. PhD under Salman @ USC, 13,000+ citations. Co-inventor of FedML.",
        linkedin_url: '#',
        twitter_handle: 'aiden'
      }
    ];
  }

  // Restrict to max 2 founders for this layout
  const displayFounders = founders.slice(0, 2);

  return (
    <div className="relative h-[675px] w-[1200px] overflow-hidden bg-slate-50 font-sans select-none">
      
      {/* Dotted pattern on the light side */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.16) 1.5px, transparent 1.5px)',
          backgroundSize: '18px 18px',
          maskImage: 'linear-gradient(100deg, transparent 30%, black 55%, black 72%, transparent 78%)',
          WebkitMaskImage: 'linear-gradient(100deg, transparent 30%, black 55%, black 72%, transparent 78%)',
        }}
      />

      {/* Sweeping blue shape on the right (Unbreakable SVG Path) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 675"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="fb-sweep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" /> {/* blue-600 */}
            <stop offset="55%" stopColor="#1d4ed8" /> {/* blue-700 */}
            <stop offset="100%" stopColor="#0B1F52" />
          </linearGradient>
        </defs>
        <path
          d="M760 -40 C 900 140, 860 300, 1010 430 C 1110 520, 1150 600, 1120 715 L 1240 715 L 1240 -40 Z"
          fill="url(#fb-sweep)"
        />
        <path
          d="M700 -40 C 840 150, 800 310, 950 440 C 1050 530, 1090 610, 1060 715 L 1120 715 C 1150 600, 1110 520, 1010 430 C 860 300, 900 140, 760 -40 Z"
          fill="#1d4ed8"
          opacity="0.18"
        />
      </svg>

      {/* Right side graphic: Project Logo dynamically injected */}
      <div className="absolute top-1/2 right-[86px] flex h-[340px] w-[340px] -translate-y-1/2 items-center justify-center rounded-[48px] bg-[#040b1c]/35 shadow-[0_30px_80px_-30px_rgba(4,16,48,0.7)] ring-1 ring-white/15 backdrop-blur-[2px] p-6">
        <img src={projectLogo} alt={projectName} className="h-full w-full object-cover rounded-[32px] drop-shadow-2xl" />
      </div>

      {/* Top bar */}
      <div className="absolute top-8 right-10 left-12 flex items-start justify-between">
        
        {/* Dynamic Project Header */}
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 border border-slate-200 shadow-sm overflow-hidden">
             <img src={projectLogo} alt="Logo" className="h-full w-full object-cover rounded-lg" />
          </span>
          <span className="text-[20px] font-extrabold tracking-tight text-blue-700 uppercase">{projectName}</span>
          <span className="h-6 w-px bg-slate-900/20" aria-hidden="true" />
          <span className="text-[12px] font-bold tracking-[0.18em] text-slate-500 uppercase">STAY AHEAD. SAIL SMART.</span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-[0_12px_28px_-14px_rgba(16,34,74,0.35)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-[17px] font-extrabold text-slate-900">{date}</span>
            <span className="block text-[10px] font-bold tracking-wide text-slate-500 uppercase">Updated Weekly</span>
          </span>
        </div>
      </div>

      {/* Left column: Unbreakable Flexbox Layout */}
      <div className="absolute top-[112px] bottom-6 left-12 flex w-[700px] flex-col justify-between gap-5 z-20">
        
        <header className="flex min-h-0 flex-1 flex-col justify-start">
          {/* Dynamic Headline: Flexes beautifully if the name is super long */}
          <h1 className="min-h-0 max-w-[650px] flex-1 overflow-hidden text-[52px] leading-[1.05] font-black tracking-[-0.02em] text-slate-900 text-balance">
            <span className="text-blue-600">{projectName}</span><br />
            Founders
          </h1>
          <div className="mt-3 h-[5px] w-14 shrink-0 rounded-full bg-blue-600" />
          <p className="mt-3 max-w-[420px] shrink-0 text-[18px] leading-relaxed text-slate-600 text-pretty font-medium">
            The visionaries steering <span className="font-bold text-blue-600">{projectName}</span> towards the future.
          </p>
        </header>

        <div className="flex shrink-0 flex-col gap-5">
          <div className="flex items-stretch gap-6 pl-7">
            {displayFounders.map((founder, i) => (
              <FounderCard key={i} founder={founder} />
            ))}
          </div>

          {/* Footer pill */}
          <div className="flex justify-center mt-2">
            <div className="flex items-center divide-x divide-slate-900/10 rounded-full bg-white px-4 py-2.5 shadow-[0_12px_30px_-16px_rgba(16,34,74,0.4)] border border-slate-100">
              <FooterLink icon={<Globe className="h-4 w-4" aria-hidden="true" />} label="airdropsailor.xyz" />
              <FooterLink icon={<Send className="h-4 w-4" aria-hidden="true" />} label="t.me/airdropsailor" />
              <FooterLink icon={<XIcon className="h-3.5 w-3.5" />} label="@airdropsailor" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}