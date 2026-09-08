import React from 'react';
import { Rocket, ShieldCheck, Gift, Droplet } from 'lucide-react';

export default function SingleAirdropV2({ data }) {
  // 1. Extract raw data
  const raw = data?.raw || data?.selectedItems?.[0]?.raw || {};
  
  // 2. Map data to design variables
  const projectName = raw.name || raw.project_name || 'Project Name';
  const airdropPhase = raw.status || raw.round || 'Early Testnet';
  
  // Try multiple fallback paths for the logo
  const logoUrl = raw.logo_url || raw.logo || raw.project_logo || null;

  return (
    <div className="relative w-[1200px] h-[675px] bg-[#F5F9FF] overflow-hidden font-sans flex flex-col box-border border-2 border-slate-100">
      
      {/* --- BACKGROUND DECORATIONS --- */}
      {/* Top Right Wave Pattern */}
      <svg className="absolute -top-40 -right-20 w-[800px] h-[800px] opacity-[0.04] pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="#1556BE" strokeWidth="0.5">
        <circle cx="50" cy="50" r="10" />
        <circle cx="50" cy="50" r="20" />
        <circle cx="50" cy="50" r="30" />
        <circle cx="50" cy="50" r="40" />
        <circle cx="50" cy="50" r="50" />
        <circle cx="50" cy="50" r="60" />
        <circle cx="50" cy="50" r="70" />
      </svg>
      {/* Bottom Left Wave Pattern */}
      <svg className="absolute -bottom-48 -left-32 w-[600px] h-[600px] opacity-[0.03] pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="#1556BE" strokeWidth="0.5">
        <circle cx="50" cy="50" r="20" />
        <circle cx="50" cy="50" r="35" />
        <circle cx="50" cy="50" r="50" />
        <circle cx="50" cy="50" r="65" />
      </svg>

      {/* --- TOP HEADER (AIRDROPSAILOR BRANDING) --- */}
      <div className="absolute top-10 left-12 flex items-center gap-3 z-20">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-[#0B1F5E] shadow-sm flex items-center justify-center">
          <img 
            src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
            alt="AirdropSailor" 
            className="h-full w-full object-cover" 
            crossOrigin="anonymous" 
          />
        </div>
        <span className="text-[26px] font-black tracking-[-1px] text-[#0F172A]">
          AIRDROPSAILOR
        </span>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="w-full h-full px-16 pt-32 pb-14 flex items-center justify-between z-10">
        
        {/* LEFT COLUMN: TEXT & CTA */}
        <div className="flex flex-col max-w-[650px]">
          
          {/* Dynamic Project Name & Phase */}
          <div className="flex flex-col -space-y-2 mb-8">
            <h1 className="text-[85px] leading-[1.05] font-black text-[#0F172A] tracking-[-0.03em] truncate">
              {projectName}
            </h1>
            <h2 className="text-[80px] leading-[1.05] font-black text-[#2563EB] tracking-[-0.03em] truncate">
              {airdropPhase}
            </h2>
          </div>

          {/* Solid Divider Line */}
          <div className="w-40 border-t-[5px] border-[#0F172A] mb-12"></div>

          {/* Giant CTA Button Box */}
          <div className="flex items-stretch bg-white border border-blue-200 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgba(37,99,235,0.12)] w-max mb-14">
            <div className="bg-[#2563EB] px-8 py-5 flex items-center justify-center">
              <Rocket className="w-10 h-10 text-white fill-white/20" strokeWidth={2} />
            </div>
            <div className="px-10 py-5 flex items-center justify-center">
              <span className="text-[38px] leading-none font-black text-[#0F172A] tracking-tight">
                Join For <span className="text-[#2563EB] uppercase">FREE</span>
              </span>
            </div>
          </div>

          {/* Bottom Features Row */}
          <div className="flex items-center gap-8">
            {/* Feature 1 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Droplet className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="text-[20px] font-bold text-[#0F172A]">No Cost</span>
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-blue-200"></div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="text-[20px] font-bold text-[#0F172A]">Early Access</span>
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-blue-200"></div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Gift className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="text-[20px] font-bold text-[#0F172A]">Future Rewards</span>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: PROJECT LOGO DISPLAY */}
        <div className="relative shrink-0 pr-8">
          {/* Soft background glow */}
          <div className="absolute inset-0 bg-blue-500 blur-[120px] opacity-20 -z-10 rounded-full"></div>
          
          {/* Dark Premium Logo Container */}
          <div className="w-[420px] h-[420px] bg-[#0A1020] rounded-[3.5rem] shadow-[0_20px_60px_rgba(10,16,32,0.4)] flex items-center justify-center p-12 border border-slate-800 relative overflow-hidden">
            {/* Inner subtle gradient effect inside the black box */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none"></div>
            
            {/* The Actual Project Logo */}
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={projectName} 
                className="w-full h-full object-contain drop-shadow-2xl z-10 rounded-[2rem]"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white text-[120px] font-black shadow-inner z-10">
                {projectName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}