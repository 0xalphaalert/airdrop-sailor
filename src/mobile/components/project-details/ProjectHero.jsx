// src/mobile/components/project-details/ProjectHero.jsx
import React from 'react';
import { Globe, Twitter, MessageSquare, Plus, Check } from 'lucide-react';

export default function ProjectHero({ project, score, hasImported, isImporting, isUntracking, onTrack, onUntrack }) {
  return (
    <div className="px-5 pt-4 pb-6">
      
      {/* Top Row: Logo, Name, Badges, Score */}
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <img 
            src={project?.logo_url || 'https://via.placeholder.com/64'} 
            alt={project?.name} 
            className="h-16 w-16 rounded-2xl bg-black object-cover"
          />
          <div className="flex flex-col pt-1">
            <h2 className="flex items-center gap-1.5 text-xl font-black text-slate-900">
              {project?.name || 'TBA'}
              <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </h2>
            <div className="mt-1.5 flex gap-2">
              <span className="text-[10px] font-bold text-blue-500">Layer 1</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div> {project?.status || 'Testnet'}
              </span>
              <span className="text-[10px] font-bold text-slate-500">{project?.tier || 'Tier 3'}</span>
            </div>
          </div>
        </div>

        {/* Circular Score */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-600">
            <span className="text-xl font-black text-slate-900">{score || 0}</span>
          </div>
          <span className="mt-1 text-[8px] font-bold text-slate-500">Airdrop Score</span>
          <span className="mt-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold text-emerald-600">Good</span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600 line-clamp-2">
        {project?.description || 'Pioneering quantum-proof non-inflationary Layer 1 blockchain.'} <span className="text-blue-600 font-bold">...more</span>
      </p>

      {/* Action Buttons */}
      <div className="mt-5 flex items-center justify-between gap-2">
        <a href={project?.website_url || '#'} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 shadow-sm active:bg-slate-50">
          <Globe size={14} /> Website
        </a>
        <a href={project?.x_link || '#'} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 shadow-sm active:bg-slate-50">
          <Twitter size={14} /> X / Twitter
        </a>
        <a href={project?.discord_link || '#'} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 shadow-sm active:bg-slate-50">
          <MessageSquare size={14} /> Discord
        </a>
        <button 
          onClick={hasImported ? onUntrack : onTrack}
          disabled={isImporting || isUntracking}
          className={`flex h-9 flex-[1.2] items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold text-white shadow-sm transition-colors active:scale-95 ${hasImported ? 'bg-emerald-500' : 'bg-blue-600'}`}
        >
          {hasImported ? <Check size={14} /> : <Plus size={14} />} 
          {isImporting ? 'Syncing...' : hasImported ? 'Tracked' : 'Add to Tracker'}
        </button>
      </div>
    </div>
  );
}