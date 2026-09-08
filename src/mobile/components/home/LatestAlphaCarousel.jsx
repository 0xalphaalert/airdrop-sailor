// src/mobile/components/home/LatestAlphaCarousel.jsx
import React from 'react';
import { ArrowRight } from 'lucide-react';

const getTimeAgo = (dateString) => {
  if (!dateString) return '1h ago';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffMs / 86400000)}d ago`;
};

export default function LatestAlphaCarousel({ events }) {
  return (
    <section className="mt-4 pb-10">
      
      <div className="flex items-center justify-between px-5 mb-4">
        <h2 className="text-[18px] font-black text-slate-900">Latest Alpha</h2>
        <button className="flex items-center gap-1 text-xs font-bold text-blue-600">
          View all <ArrowRight size={14} />
        </button>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 scrollbar-hide">
        {events?.map((item, idx) => {
          return (
            <div
              key={item.id || idx}
              className="flex w-[260px] shrink-0 snap-start flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-blue-600">
                  {item.update_type || 'Announcement'}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {getTimeAgo(item.date_posted)}
                </span>
              </div>

              <p className="min-h-[72px] text-[13px] font-medium leading-relaxed text-slate-700 line-clamp-4">
                {item.content}
              </p>

              <div className="mt-4 flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <img
                    src={item.projects?.logo_url || 'https://via.placeholder.com/50'}
                    alt="Project logo"
                    className="h-5 w-5 rounded-full object-cover bg-black"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    {item.projects?.name || 'Unknown'}
                  </span>
                </div>

                {item.source_link && (
                  <a
                    href={item.source_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest"
                  >
                    Source <ArrowRight size={10} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-200"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-200"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-200"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-200"></div>
      </div>

    </section>
  );
}