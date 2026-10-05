import React from 'react';
import TrackerHeader from './TrackerHeader';
import { NavLink, Outlet } from 'react-router-dom';
import {} from 'lucide-react';

export default function TrackerLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
<TrackerHeader />
      {/* Page Content Rendered Here */}
      <main className="flex-1 animate-in fade-in duration-300">
        <Outlet />
      </main>
    </div>
  );
}

