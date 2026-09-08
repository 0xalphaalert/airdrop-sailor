import React from 'react';
import {
  CalendarDays,
  ChartBar,
  Clock,
  Coins,
  Globe2,
  Info,
  Lock,
  Megaphone,
  PieChart,
  Sailboat,
  Trophy,
  Users,
} from 'lucide-react';

const FALLBACK_SUPPLY = 1_000_000_000;

// Dynamic Color Palette for real data slices
const DYNAMIC_COLORS = [
  { color: '#2563EB', colorEnd: '#1D4ED8' },
  { color: '#8B5CF6', colorEnd: '#7C3AED' },
  { color: '#3478F6', colorEnd: '#2563EB' },
  { color: '#7557EA', colorEnd: '#6843DC' },
  { color: '#2CB7B3', colorEnd: '#0F9F9B' },
  { color: '#4F8DF7', colorEnd: '#2F6FE8' },
  { color: '#60A5FA', colorEnd: '#3B82F6' },
  { color: '#3B82F6', colorEnd: '#2563EB' },
];

const STANDARD_FIELDS = [
  { key: 'community_allocation_percentage', label: 'Community & Airdrop', icon: Users },
  { key: 'investor_allocation_percentage', label: 'Investors', icon: Coins },
  { key: 'team_allocation_percentage', label: 'Team', icon: ChartBar },
  { key: 'ecosystem_allocation_percentage', label: 'Ecosystem & Treasury', icon: Trophy },
  { key: 'liquidity_allocation_percentage', label: 'Liquidity', icon: Lock },
  { key: 'marketing_allocation_percentage', label: 'Marketing', icon: Megaphone },
  { key: 'advisors_allocation_percentage', label: 'Advisors', icon: Clock },
  { key: 'early_backers_allocation_percentage', label: 'Early Backers', icon: PieChart }
];

const cleanText = (value, fallback = '') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value).replace(/\bsore\b/gi, 'funding').trim();
};

const safelyParseJson = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined || value === '') return null;

  const normalized = String(value).trim().replace(/,/g, '');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  let parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) return null;

  const suffix = normalized.toUpperCase().match(/\d(?:\.\d+)?\s*([KMBT])\b/)?.[1];
  if (suffix) parsed *= { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[suffix];
  return parsed;
};

const getProjectRow = (data) => {
  if (data?.raw && typeof data.raw === 'object') return data.raw;
  if (data?.selectedItems?.[0]?.raw) return data.selectedItems[0].raw;
  if (data?.selectedItems?.[0]) return data.selectedItems[0];
  if (Array.isArray(data)) return data[0]?.raw || data[0] || {};
  return data && typeof data === 'object' ? data : {};
};

const looksLikeAllocation = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Boolean(
    value.percentage !== undefined ||
    value.percent !== undefined ||
    value.pct !== undefined ||
    value.allocation_percentage !== undefined
  );
};

function getAllocationRows(details) {
  const candidates = [
    details.allocations,
    details.allocation,
    details.token_allocations,
    details.token_allocation,
    details.allocation_breakdown,
    details.distribution,
  ];

  for (const candidateValue of candidates) {
    const candidate = safelyParseJson(candidateValue);
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') {
      return Object.entries(candidate).map(([name, percentage]) => ({ name, percentage }));
    }
  }
  return [];
}

const normalizeTokenomics = (rawDetails) => {
  const parsed = safelyParseJson(rawDetails);
  if (Array.isArray(parsed)) {
    const objects = parsed.filter((item) => item && typeof item === 'object');
    if (objects.length > 0 && objects.every(looksLikeAllocation)) {
      return { details: {}, allocationRows: objects };
    }
    const details = objects.find((item) => !looksLikeAllocation(item)) || objects[0] || {};
    const inlineAllocations = objects.filter(looksLikeAllocation);
    return {
      details,
      allocationRows: inlineAllocations.length > 0 ? inlineAllocations : getAllocationRows(details),
    };
  }
  const details = parsed && typeof parsed === 'object' ? parsed : {};
  return { details, allocationRows: getAllocationRows(details) };
};

// DYNAMIC ALLOCATION BUILDER
const buildDynamicAllocations = (details, allocationRows, totalSupply) => {
  let results = [];

  // 1. Try to read explicit standard keys from DB details
  STANDARD_FIELDS.forEach(field => {
    const val = toNumber(details[field.key]);
    if (val !== null && val > 0) {
      results.push({
        key: field.key,
        label: field.label,
        percentage: val,
        icon: field.icon
      });
    }
  });

  // 2. If no standard keys exist, try parsing custom JSON array rows
  if (results.length === 0 && allocationRows && allocationRows.length > 0) {
    allocationRows.forEach((row, idx) => {
      const val = toNumber(row.percentage || row.percent || row.value || row.allocation_percentage);
      const label = row.label || row.name || row.category || `Allocation ${idx + 1}`;
      if (val !== null && val > 0) {
        results.push({
          key: `custom_${idx}`,
          label: cleanText(label),
          percentage: val,
          icon: PieChart
        });
      }
    });
  }

  // 3. Prevent canvas crash if DB is completely empty/null (e.g. Retium)
  if (results.length === 0) {
    results.push({
      key: 'tba',
      label: 'Data TBA',
      percentage: 100,
      icon: Info
    });
  }

  // 4. Map colors, calculate real token amounts, and assign UI sides dynamically
  return results.map((item, index) => {
    const palette = DYNAMIC_COLORS[index % DYNAMIC_COLORS.length];
    return {
      ...item,
      amount: Math.round((totalSupply * item.percentage) / 100),
      color: palette.color,
      colorEnd: palette.colorEnd,
      icon: item.icon,
      side: index % 2 === 0 ? 'left' : 'right'
    };
  });
};

const getTicker = (details, projectName) => {
  const rawTicker = cleanText(details.ticker || details.symbol).replace(/^\$+/, '');
  if (rawTicker) return `$${rawTicker.toUpperCase()}`;

  const initials = cleanText(projectName, 'Project')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 4)
    .toUpperCase();
  return `$${initials || 'P'}`;
};

const formatInteger = (value) =>
  Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-US');

const formatPercentage = (value) => `${Number(value || 0).toFixed(1)}%`;

const formatCurrentDate = () =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date()).toUpperCase();

const formatTgeDate = (value) => {
  if (!value) return 'TGE DATE: TO BE ANNOUNCED';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `TGE DATE: ${new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed).toUpperCase()}`;
  }
  return `TGE DATE: ${cleanText(value).toUpperCase()}`;
};

const getMetricPercentage = (details, keys, fallback) => {
  for (const key of keys) {
    const value = toNumber(details[key]);
    if (value !== null) return Math.min(100, Math.max(0, value));
  }
  return fallback;
};

const getVestingSummary = (notes) => {
  const safeNotes = cleanText(notes);
  const cliffMatch =
    safeNotes.match(/cliff\D{0,12}(\d+(?:\.\d+)?)\s*(day|week|month|year)s?/i) ||
    safeNotes.match(/(\d+(?:\.\d+)?)\s*(day|week|month|year)s?\D{0,12}cliff/i);
  const vestingMatch =
    safeNotes.match(/vest(?:ed|ing)?\D{0,14}(?:over\s*)?(\d+(?:\.\d+)?)\s*(day|week|month|year)s?/i) ||
    safeNotes.match(/(\d+(?:\.\d+)?)\s*(day|week|month|year)s?\D{0,14}vest/i);

  const formatPeriod = (match) => {
    if (!match) return null;
    const amount = match[1];
    const unit = match[2][0].toUpperCase() + match[2].slice(1).toLowerCase();
    return `${amount} ${unit}${Number(amount) === 1 ? '' : 's'}`;
  };

  const cliff = formatPeriod(cliffMatch) || '6 Months';
  const vestingPeriod = formatPeriod(vestingMatch);
  let subtitle = vestingPeriod ? `${vestingPeriod} Linear Vesting` : 'Linear Vesting After Cliff';
  if (!vestingPeriod && safeNotes && safeNotes.length <= 64) subtitle = safeNotes;
  return { cliff, subtitle };
};

const polarToCartesian = (cx, cy, radius, angle) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
};

const describeDonutSlice = (cx, cy, outerRadius, innerRadius, startAngle, endAngle) => {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
};

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-[48px] w-[48px] overflow-hidden rounded-full bg-[#0B1F5E] shadow-sm flex items-center justify-center text-white font-black text-xl">
        <img 
          src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
          alt="AirdropSailor" 
          className="h-full w-full object-cover" 
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <span className="text-[22px] font-black tracking-[-0.8px] text-[#1556BE]">
        AIRDROPSAILOR
      </span>
    </div>
  );
}

function AllocationCard({ allocation }) {
  const Icon = allocation.icon;
  return (
    <div className="flex h-[74px] w-[282px] items-center gap-4 rounded-[16px] border border-blue-100 bg-white px-4 shadow-[0_7px_20px_rgba(37,99,235,0.07)]">
      <div
        className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full text-white shadow-[0_7px_16px_rgba(37,99,235,0.2)]"
        style={{ background: `linear-gradient(145deg, ${allocation.color}, ${allocation.colorEnd})` }}
      >
        <Icon className="h-[25px] w-[25px]" strokeWidth={2.35} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-extrabold leading-[18px] tracking-[-0.3px] text-[#0B1B4D]">
          {allocation.label}
        </div>
        <div className="mt-[3px] text-[21px] font-black leading-[22px]" style={{ color: allocation.color }}>
          {formatPercentage(allocation.percentage)}
        </div>
        <div className="mt-[2px] text-[12px] font-semibold leading-[14px] text-slate-500">
          {allocation.key === 'tba' ? 'TBA' : formatInteger(allocation.amount)}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, subtitle, valueAccent = false }) {
  const Icon = icon;
  return (
    <div className="flex h-full min-w-0 items-center gap-4 px-6">
      <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,0.2)]">
        <Icon className="h-[24px] w-[24px]" strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-bold leading-4 text-slate-500">{label}</div>
        <div className={`mt-1 truncate text-[20px] font-black leading-6 tracking-[-0.5px] ${valueAccent ? 'text-blue-600' : 'text-[#081844]'}`}>
          {value}
        </div>
        <div className="mt-1 truncate text-[11px] font-medium leading-4 text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

export default function SingleTokenomicsV2({ data }) {
  const project = getProjectRow(data);
  const parsedFooterAttributes = safelyParseJson(
    project.footer_attributes || data?.footer_attributes
  );
  const footerAttributes = parsedFooterAttributes && typeof parsedFooterAttributes === 'object'
    ? parsedFooterAttributes
    : {};
    
  const projectName = cleanText(
    footerAttributes.project_name || footerAttributes.name || project.name,
    'PROJECT'
  );
  
  const logoUrl = project.logo_url || project.logo || footerAttributes.logo_url || data?.logo || data?.raw?.logo_url || null;
  
  const { details, allocationRows } = normalizeTokenomics(
    project.tokenomics_details ?? project.tokenomics ?? data?.tokenomics_details
  );
  
  const parsedSupply = toNumber(details.total_supply);
  const totalSupply = parsedSupply && parsedSupply > 0 ? parsedSupply : FALLBACK_SUPPLY;
  const ticker = getTicker(details, projectName);
  
  // FETCH DYNAMIC ALLOCATIONS FROM REAL DATA
  const allocations = buildDynamicAllocations(details, allocationRows, totalSupply);
  const leftAllocations = allocations.filter((allocation) => allocation.side === 'left');
  const rightAllocations = allocations.filter((allocation) => allocation.side === 'right');
  const chartTotal = allocations.reduce((sum, allocation) => sum + allocation.percentage, 0) || 100;

  const circulatingPercentage = getMetricPercentage(
    details,
    [
      'initial_circulating_supply_percentage',
      'circulating_supply_percentage',
      'initial_circulating_percentage',
      'tge_circulating_percentage',
    ],
    15
  );
  const unlockPercentage = getMetricPercentage(
    details,
    ['tge_unlock_percentage', 'initial_unlock_percentage', 'unlock_at_tge_percentage'],
    circulatingPercentage
  );
  const circulatingSupply = (totalSupply * circulatingPercentage) / 100;
  const unlockSupply = (totalSupply * unlockPercentage) / 100;
  const vesting = getVestingSummary(details.vesting_notes);
  const dateBadge = formatCurrentDate();
  const tgeDate = formatTgeDate(details.tge_date);

  let currentAngle = 0;
  const chartSlices = allocations.map((allocation) => {
    const angle = (allocation.percentage / chartTotal) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    return { ...allocation, startAngle, endAngle, angle };
  });

  return (
    <div className="relative h-[675px] w-[1200px] overflow-hidden bg-white font-sans text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(219,234,254,0.55),transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]" />

      <header className="absolute inset-x-0 top-0 z-20 h-[94px] border-b border-blue-50 bg-white/75">
        <div className="absolute left-[28px] top-[24px] flex items-center">
          <BrandMark />
          <div className="ml-6 h-[43px] w-px bg-blue-100" />
        </div>

        <div className="absolute left-1/2 top-[17px] w-[550px] -translate-x-1/2 text-center">
          <h1 className="text-[38px] font-black uppercase leading-[42px] tracking-[-1.6px] text-[#081844]">
            PROJECT TOKENOMICS
          </h1>
          <p className="mt-1 truncate text-[18px] font-semibold leading-6 text-slate-500">
            {projectName} Token Allocation
          </p>
        </div>

        <div className="absolute right-[34px] top-[23px] flex items-center gap-3 border-l border-blue-50 pl-7">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-blue-50 text-[#174EA6] shadow-[0_5px_16px_rgba(37,99,235,0.09)]">
            <CalendarDays className="h-[23px] w-[23px]" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[16px] font-black leading-5 text-blue-600">{dateBadge}</div>
            <div className="mt-[3px] text-[11px] font-semibold leading-4 text-slate-500">Tokenomics Overview</div>
          </div>
        </div>
      </header>

      <section className="absolute inset-x-0 top-[96px] z-10 h-[395px]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 395" aria-hidden="true">
          <g fill="none" strokeWidth="1.35" opacity="0.82">
            <path d="M330 52 H420 Q430 52 430 62 V72 Q430 78 438 83 L463 100" stroke="#2563EB" />
            <path d="M330 137 H393 Q405 137 405 149 V155 Q405 163 416 163 H424" stroke="#8B5CF6" />
            <path d="M330 222 H408 Q418 222 425 226" stroke="#60A5FA" />
            <path d="M330 307 H435 Q444 307 451 299 L474 278" stroke="#2CB7B3" />
            <path d="M870 52 H779 Q768 52 768 64 V75 Q768 83 759 87 L738 99" stroke="#3478F6" />
            <path d="M870 137 H805 Q795 137 795 148 V162 Q795 169 785 169 H776" stroke="#7557EA" />
            <path d="M870 222 H790 Q782 222 776 226" stroke="#3B82F6" />
            <path d="M870 307 H767 Q758 307 751 299 L727 277" stroke="#4F8DF7" />
          </g>
          {[
            [330, 52, '#2563EB'], [330, 137, '#8B5CF6'], [330, 222, '#60A5FA'], [330, 307, '#2CB7B3'],
            [870, 52, '#3478F6'], [870, 137, '#7557EA'], [870, 222, '#3B82F6'], [870, 307, '#4F8DF7'],
          ].map(([cx, cy, color]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.2" fill={color} />)}
        </svg>

        {/* LEFT DYNAMIC ALLOCATION CARDS */}
        <div className="absolute left-[47px] top-[15px] flex flex-col gap-[11px]">
          {leftAllocations.map((allocation, idx) => <AllocationCard key={idx} allocation={allocation} />)}
        </div>

        {/* RIGHT DYNAMIC ALLOCATION CARDS */}
        <div className="absolute right-[47px] top-[15px] flex flex-col gap-[11px]">
          {rightAllocations.map((allocation, idx) => <AllocationCard key={idx} allocation={allocation} />)}
        </div>

        {/* CENTER DONUT CHART & PROJECT LOGO */}
        <div className="absolute left-[408px] top-[5px] h-[384px] w-[384px]">
          <svg viewBox="0 0 384 384" className="h-full w-full drop-shadow-[0_13px_18px_rgba(30,64,175,0.13)]">
            <defs>
              {chartSlices.map((slice, idx) => (
                <linearGradient key={idx} id={`tokenomics-${idx}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={slice.color} />
                  <stop offset="100%" stopColor={slice.colorEnd} />
                </linearGradient>
              ))}
            </defs>
            <circle cx="192" cy="192" r="186" fill="#E8F1FF" />
            {chartSlices.map((slice, idx) => slice.angle > 0.15 && (
              <path
                key={idx}
                d={describeDonutSlice(192, 192, 186, 109, slice.startAngle + 0.55, slice.endAngle - 0.55)}
                fill={`url(#tokenomics-${idx})`}
                stroke="#F8FBFF"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            ))}
            {chartSlices.map((slice, idx) => {
              if (slice.percentage <= 0 || slice.angle < 6) return null;
              const midpoint = (slice.startAngle + slice.endAngle) / 2;
              const point = polarToCartesian(192, 192, 148, midpoint);
              const label = slice.key === 'tba' ? 'TBA' : formatPercentage(slice.percentage);
              const width = Math.max(43, label.length * 7 + 12);
              return (
                <g key={`label-${idx}`} transform={`translate(${point.x} ${point.y})`}>
                  <rect x={-width / 2} y="-13" width={width} height="26" rx="8" fill="white" fillOpacity="0.96" stroke="#DBEAFE" strokeWidth="0.8" />
                  <text
                    x="0"
                    y="1"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* MIDDLE LOGO CONTAINER */}
          <div className="absolute left-1/2 top-1/2 flex h-[172px] w-[172px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[28px] border border-blue-50 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.14)]">
            <div className="relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-[#071A56] to-[#133C9D] text-[29px] font-black text-white shadow-md border border-slate-100">
              <span>{projectName.charAt(0).toUpperCase()}</span>
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={projectName}
                  className="absolute inset-0 h-full w-full object-cover rounded-[18px]"
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
            <div className="mt-[9px] max-w-[146px] truncate text-[18px] font-black uppercase leading-[21px] tracking-[-0.45px] text-[#081844]">
              {projectName}
            </div>
            <div className="mt-[2px] text-[14px] font-black leading-5 text-blue-500">{ticker}</div>
          </div>
        </div>
      </section>

      {/* METRICS ROW */}
      <section className="absolute left-[47px] right-[47px] top-[503px] z-20 h-[106px] overflow-hidden rounded-[18px] border border-slate-100 bg-white shadow-[0_10px_28px_rgba(30,64,175,0.08)]">
        <div className="grid h-full grid-cols-4 divide-x divide-blue-100">
          <MetricCard icon={Coins} label="Total Supply" value={formatInteger(totalSupply)} subtitle={ticker} />
          <MetricCard
            icon={Lock}
            label="Circulating Supply (TGE)"
            value={`${formatInteger(circulatingSupply)} (${circulatingPercentage.toFixed(0)}%)`}
            subtitle={`${ticker} at token generation`}
            valueAccent
          />
          <MetricCard
            icon={PieChart}
            label="TGE Unlock"
            value={`${unlockPercentage.toFixed(0)}%`}
            subtitle={`${formatInteger(unlockSupply)} ${ticker}`}
          />
          <MetricCard
            icon={CalendarDays}
            label="Cliff / Vesting"
            value={vesting.cliff}
            subtitle={`${vesting.subtitle} • ${tgeDate.replace('TGE DATE: ', '')}`}
          />
        </div>
      </section>

      <footer className="absolute bottom-[13px] left-[36px] right-[36px] z-20 flex h-[36px] items-center justify-between rounded-[14px] border border-blue-100/60 bg-blue-50/80 px-5 text-[#174EA6]">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-blue-700">
            <Info className="h-3 w-3" strokeWidth={2.6} />
          </div>
          <p className="truncate text-[10px] font-semibold">
            All allocations are subject to vesting schedules. Please refer to official documentation for more details.
          </p>
        </div>
        <div className="ml-5 flex shrink-0 items-center gap-4 text-[11px] font-bold">
          <span className="flex items-center gap-1.5">
            <Globe2 className="h-4 w-4" strokeWidth={2.3} />
            airdropsailor.xyz
          </span>
          <span className="h-5 w-px bg-blue-300" />
          <span className="flex items-center gap-1.5 font-black tracking-[0.15px]">
            <Sailboat className="h-[17px] w-[17px] fill-current" strokeWidth={1.8} />
            STAY AHEAD. SAIL SMART.
          </span>
        </div>
      </footer>
    </div>
  );
}