import React from 'react';
import { Bell, Menu, Search } from 'lucide-react';

export default function TrackerHeaderMobile({ onOpenSidebar, user }) {
  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email || 'Sailor';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex w-full items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-2 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open tracker navigation"
            className="-ml-2 p-2 text-slate-600"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <img
              src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png"
              alt="AirdropSailor"
              className="h-8 w-8 shrink-0 object-contain"
            />
            <span className="truncate text-base font-bold tracking-tight text-slate-900">AirdropSailor</span>
            <span className="rounded-full border border-violet-100 bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600">
              Tracker
            </span>
          </div>
        </div>

        <div className="ml-3 flex shrink-0 items-center gap-3">
          <button type="button" aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 shadow-sm transition active:scale-95">
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 shadow-sm transition active:scale-95">
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
          </button>
          <div aria-label={`${displayName} profile`} className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white shadow-sm">
            {initial}
          </div>
        </div>
    </header>
  );
}
