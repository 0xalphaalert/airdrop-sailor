import React from 'react';
import { 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  Globe2, 
  Send, 
  Bell, 
  CheckSquare, 
  Package
} from 'lucide-react';

const XLogo = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.059z" />
  </svg>
);

export default function DailyTasksV2({ data }) {
  // 1. Extract selected items or fallback to empty array
  const rawItems = data?.selectedItems || data || [];

  // 2. Fallback exact data from design snapshot
  const fallbackTasks = [
    { projectName: 'Kiedex', logo: 'https://i.ibb.co/L5w1vX7/kiedex-logo.jpg', taskName: 'Swap tokens on Kiedex Testnet', time: '10 Mins', cost: '$0', frequency: 'Daily' },
    { projectName: 'Particle Network', logo: 'https://i.ibb.co/HtkF7m3/particle-network-logo.png', taskName: 'Verify Email & Connect Wallet', time: '5 Mins', cost: '$0', frequency: 'Daily' },
    { projectName: 'Nubit', logo: 'https://i.ibb.co/3sWvZYV/nubit-logo.jpg', taskName: 'Follow on X & Join Discord', time: '3 Mins', cost: '$0', frequency: 'Daily' },
    { projectName: 'Warden Protocol', logo: 'https://i.ibb.co/JqjT2fQ/warden-protocol-logo.png', taskName: 'Stake on Testnet', time: '15 Mins', cost: '$0', frequency: 'Daily' },
    { projectName: 'OG Labs', logo: 'https://i.ibb.co/v4b7BfM/og-labs-logo.jpg', taskName: 'Mint OG Role on Discord', time: '8 Mins', cost: '$0', frequency: 'Daily' },
  ];

  // 3. Dynamic parser helper
  const parseTask = (item) => {
    const raw = item.raw || item;
    const proj = raw.projects || raw;
    
    const projectName = proj.name || proj.project_name || 'Project';
    const logo = proj.logo_url || proj.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${projectName}`;
    
    let taskName = raw.name || 'Complete Daily Task';
    let time = raw.time_minutes ? `${raw.time_minutes} Mins` : (raw.total_time_estimate ? `${raw.total_time_estimate} Mins` : '5 Mins');
    let cost = raw.cost && raw.cost !== '0' ? `$${raw.cost}` : '$0';
    let frequency = raw.recurring || 'Daily';

    try {
      const postJson = typeof raw.post_json === 'string' ? JSON.parse(raw.post_json) : raw.post_json;
      if (postJson && postJson.headline) taskName = postJson.headline;
    } catch (e) {}

    return { projectName, logo, taskName, time, cost, frequency };
  };

  // 4. Resolve display array (max 5 items)
  const displayTasks = rawItems.length > 0 
    ? rawItems.slice(0, 5).map(parseTask)
    : fallbackTasks;

  // Fill empty slots with empty objects to keep UI structure perfect if < 5 tasks selected
  const paddedTasks = [...displayTasks];
  while (paddedTasks.length < 5) {
    paddedTasks.push({ isEmpty: true });
  }

  // 5. Date Logic
  const today = new Date('2026-08-06T12:00:00Z'); // Fixed to match prompt constraint
  const formattedDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  return (
    <div className="w-[1200px] h-[675px] bg-[#FDFEFF] border-[14px] border-[#1556BE] rounded-[2rem] flex flex-col p-8 font-sans relative overflow-hidden box-border">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* HEADER */}
      <div className="flex justify-between items-center w-full z-10 relative shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-[#1556BE] rounded-full flex items-center justify-center shadow-md">
            <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" className="w-6 h-6 object-contain" alt="Logo" crossOrigin="anonymous"/>
          </div>
          <span className="text-[#1556BE] font-black text-[22px] tracking-tight">AIRDROPSAILOR</span>
          <div className="w-px h-5 bg-slate-200 mx-1"></div>
          <span className="text-slate-400 font-black text-[11px] tracking-widest uppercase">Stay Ahead. Sail Smart.</span>
        </div>
        
        <div className="flex items-center gap-3 bg-blue-50/80 border border-blue-100 rounded-xl px-4 py-2 shadow-sm">
          <CalendarDays className="text-[#1556BE] w-6 h-6" strokeWidth={2.5}/>
          <div className="flex flex-col justify-center">
            <span className="text-slate-900 font-black text-sm leading-none">{formattedDate}</span>
            <span className="text-[#1556BE] font-bold text-[10px] leading-none mt-1 tracking-widest">YESTERDAY</span>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="flex justify-between items-center py-6 px-10 z-10 relative shrink-0 h-[160px]">
        
        {/* Left Graphics (3D Clipboard) */}
        <div className="w-40 h-40 relative flex items-center justify-center shrink-0">
           <div className="absolute inset-0 bg-blue-200/40 rounded-full blur-xl"></div>
           {/* Paste your Supabase URL for the Clipboard PNG here 👇 */}
           <img 
             src="https://ptobheftxcjiqobxgeal.supabase.co/storage/v1/object/public/Illustrations/3d-clipboard.png" 
             alt="Daily Tasks" 
             className="w-full h-full object-contain drop-shadow-2xl z-10"
             crossOrigin="anonymous"
           />
        </div>
        
        {/* Center Title */}
        <div className="text-center flex-1">
          <h1 className="text-[52px] font-black text-[#0B1B4D] leading-[1.05] tracking-tight">
            DAILY AIRDROP<br/>
            <span className="text-[#1556BE]">TASKS RELEASED</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium mt-3">
            Tasks released <span className="text-[#1556BE] font-bold">yesterday</span>. Don't miss out!
          </p>
        </div>
        
        {/* Right Graphics (3D Parachute Box) */}
        <div className="w-40 h-40 relative flex items-center justify-center shrink-0 -mt-8">
           <div className="absolute inset-0 bg-blue-200/40 rounded-full blur-xl"></div>
           {/* Paste your Supabase URL for the Parachute PNG here 👇 */}
           <img 
             src="https://ptobheftxcjiqobxgeal.supabase.co/storage/v1/object/public/Illustrations/3d-parachute.png" 
             alt="Airdrop Parachute" 
             className="w-full h-full object-contain drop-shadow-2xl z-10"
             crossOrigin="anonymous"
           />
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_40px_rgba(21,86,190,0.06)] w-full flex-1 flex flex-col overflow-hidden z-10 relative">
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-8 py-3.5 bg-[#F8FAFF] border-b border-blue-100 text-[10px] font-black text-[#1556BE] tracking-widest uppercase shrink-0">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-4">Task</div>
          <div className="col-span-2">Time</div>
          <div className="col-span-1 text-center">Cost</div>
          <div className="col-span-1 text-right">Frequency</div>
        </div>

        {/* Table Rows */}
        <div className="flex flex-col flex-1 justify-evenly pb-2">
          {paddedTasks.map((t, i) => {
            if (t.isEmpty) {
              return (
                <div key={`empty-${i}`} className="grid grid-cols-12 gap-4 px-8 py-3.5 items-center opacity-30">
                  <div className="col-span-12 flex justify-center text-slate-300 font-semibold text-xs border-t border-slate-100 pt-4 mt-2 border-dashed">
                     — Available Slot —
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className="grid grid-cols-12 gap-4 px-8 py-3 items-center border-b border-slate-50 last:border-0">
                {/* Number */}
                <div className="col-span-1">
                  <span className="bg-blue-50/80 text-[#1556BE] font-black px-3 py-1.5 rounded-lg text-[13px]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                
                {/* Project */}
                <div className="col-span-3 flex items-center gap-3 pr-4 min-w-0">
                  <img 
                    src={t.logo} 
                    className="w-9 h-9 rounded-[10px] bg-slate-100 object-cover shadow-sm border border-slate-200/50 shrink-0" 
                    alt={t.projectName}
                    crossOrigin="anonymous"
                  />
                  <span className="font-black text-slate-900 text-[15px] truncate">{t.projectName}</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" strokeWidth={3} color="white"/>
                </div>
                
                {/* Task */}
                <div className="col-span-4 pr-4 min-w-0">
                  <span className="font-bold text-slate-700 text-[14px] truncate block">{t.taskName}</span>
                </div>
                
                {/* Time */}
                <div className="col-span-2 flex items-center gap-2 text-slate-600 font-bold text-[14px]">
                  <Clock className="w-4 h-4 text-[#1556BE]" strokeWidth={2.5}/>
                  {t.time}
                </div>
                
                {/* Cost */}
                <div className="col-span-1 text-center">
                  <span className="font-black text-emerald-500 text-[15px]">{t.cost}</span>
                </div>
                
                {/* Frequency */}
                <div className="col-span-1 flex justify-end">
                  <span className="bg-blue-50 text-[#1556BE] font-black px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider">
                    {t.frequency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-end w-full z-10 shrink-0 pt-6 px-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[#1556BE] font-black text-[13px] tracking-wide">
            <Globe2 className="w-4 h-4"/> airdropsailor.xyz
          </div>
          <div className="w-px h-4 bg-slate-300"></div>
          <div className="flex items-center gap-2 text-[#1556BE] font-black text-[13px] tracking-wide">
            <Send className="w-4 h-4"/> t.me/airdropsailor
          </div>
          <div className="w-px h-4 bg-slate-300"></div>
          <div className="flex items-center gap-2 text-slate-900 font-black text-[13px] tracking-wide">
            <XLogo size={16} /> @airdropsailor
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-blue-50 px-5 py-2.5 rounded-full shadow-sm">
          <Bell className="w-4 h-4 text-[#1556BE] fill-[#1556BE]"/>
          <span className="text-[#1556BE] font-black text-[11px] uppercase tracking-wide">Turn on notifications & never miss a task!</span>
        </div>
      </div>

    </div>
  );
}