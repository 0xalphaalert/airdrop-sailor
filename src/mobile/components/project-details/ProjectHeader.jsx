// src/mobile/components/project-details/ProjectHeader.jsx
import React from 'react';
import { ChevronLeft, Share2, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProjectHeader() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 z-50 flex h-14 w-full items-center justify-between bg-white px-4">
      <button onClick={() => navigate(-1)} className="p-2 text-slate-900 transition-transform active:scale-95">
        <ChevronLeft size={24} strokeWidth={2.5} />
      </button>
      
      <h1 className="text-[16px] font-black tracking-tight text-slate-900">
        Project Details
      </h1>
      
      <div className="flex items-center gap-2">
        <button className="p-2 text-slate-600 transition-transform active:scale-95">
          <Share2 size={20} strokeWidth={2} />
        </button>
        <button className="p-2 text-slate-600 transition-transform active:scale-95">
          <Bookmark size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}