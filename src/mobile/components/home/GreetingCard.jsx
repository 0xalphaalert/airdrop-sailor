// src/mobile/components/home/GreetingCard.jsx
import React from 'react';
import { Navigation } from 'lucide-react';

export default function GreetingCard({ stats }) {
  return (
    <section className="px-5 pt-2">
      <div className="flex items-start justify-between gap-4">
        
        <div className="flex-1">
          <h1 className="text-[26px] font-black leading-tight text-slate-900">
            Good evening, Sailor 👋
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500 max-w-[220px] leading-relaxed">
            Track, farm and earn from the best airdrop opportunities
          </p>
        </div>

        <div className="shrink-0">
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-inner">
              <Navigation size={14} className="fill-current" />
            </div>
            <div className="flex flex-col pr-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Sail Balance
              </span>
              <span className="text-sm font-black leading-none text-slate-900">
                {stats?.sailBalance !== undefined ? stats.sailBalance.toLocaleString() : "0"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}