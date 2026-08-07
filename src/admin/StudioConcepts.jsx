import React, { useState } from 'react';
import { LayoutTemplate, MousePointer2, FileText, ChevronRight, Plus, Search, Image as ImageIcon } from 'lucide-react';

export default function StudioConcepts() {
  const [activeConcept, setActiveConcept] = useState('figma');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* CONCEPT SELECTOR (Just for you to toggle between ideas) */}
      <div className="bg-white border-b border-slate-200 p-4 flex justify-center gap-4 shrink-0 shadow-sm relative z-50">
        <button onClick={() => setActiveConcept('figma')} className={`px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${activeConcept === 'figma' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
          <MousePointer2 size={16} /> Concept 1: Floating Workspace
        </button>
        <button onClick={() => setActiveConcept('wizard')} className={`px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${activeConcept === 'wizard' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
          <LayoutTemplate size={16} /> Concept 2: Focused Wizard
        </button>
        <button onClick={() => setActiveConcept('notion')} className={`px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${activeConcept === 'notion' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
          <FileText size={16} /> Concept 3: Document Flow
        </button>
      </div>

      {/* ========================================== */}
      {/* CONCEPT 1: THE FLOATING WORKSPACE (Figma)  */}
      {/* ========================================== */}
      {activeConcept === 'figma' && (
        <div className="flex-1 relative overflow-hidden bg-slate-50 flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
          
          {/* Left Floating Panel (Tools) */}
          <div className="absolute left-8 top-8 bottom-8 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 flex flex-col z-10">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Data Sources</h3>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl font-bold text-blue-700 text-sm">Funding Alerts</div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-600 text-sm hover:border-slate-300 cursor-pointer">Project Analysis</div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-600 text-sm hover:border-slate-300 cursor-pointer">Daily Tasks</div>
            </div>
          </div>

          {/* Center Canvas (The Graphic) */}
          <div className="w-[800px] aspect-video bg-white shadow-2xl border border-slate-200 rounded-lg flex items-center justify-center flex-col z-0 relative group">
            <span className="absolute -top-8 left-0 text-sm font-black text-slate-500 uppercase tracking-widest">Canvas / 16:9</span>
            <ImageIcon className="w-16 h-16 text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">Your generated graphic renders here</p>
          </div>

          {/* Right Floating Panel (Export/AI) */}
          <div className="absolute right-8 top-8 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 z-10">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">AI Writer</h3>
            <textarea className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600 mb-4 resize-none" placeholder="AI will draft your tweet here..."></textarea>
            <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-sm">Export & Schedule</button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CONCEPT 2: THE FOCUSED WIZARD              */}
      {/* ========================================== */}
      {activeConcept === 'wizard' && (
        <div className="flex-1 bg-white flex flex-col items-center pt-20 px-8">
          
          <div className="w-full max-w-3xl flex justify-between items-center mb-16 relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10"></div>
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-lg">1</div>
            <div className="bg-white text-slate-300 w-10 h-10 rounded-full flex items-center justify-center font-black border-2 border-slate-100">2</div>
            <div className="bg-white text-slate-300 w-10 h-10 rounded-full flex items-center justify-center font-black border-2 border-slate-100">3</div>
          </div>

          <div className="w-full max-w-3xl text-center mb-12">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">What are we building today?</h1>
            <p className="text-slate-500 font-medium">Select a data category to begin crafting your next broadcast.</p>
          </div>

          <div className="w-full max-w-3xl grid grid-cols-2 gap-4">
             <div className="p-8 border-2 border-blue-500 bg-blue-50 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer shadow-sm">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mb-4"></div>
               <h3 className="font-black text-blue-700 text-lg">Top Funding</h3>
             </div>
             <div className="p-8 border-2 border-slate-100 bg-white rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-200">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 mb-4"></div>
               <h3 className="font-black text-slate-700 text-lg">Daily Alpha</h3>
             </div>
          </div>

          <div className="w-full max-w-3xl mt-12 flex justify-end">
            <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black flex items-center gap-2">
              Next Step <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CONCEPT 3: THE DOCUMENT FLOW (Notion)      */}
      {/* ========================================== */}
      {activeConcept === 'notion' && (
        <div className="flex-1 bg-white overflow-y-auto flex justify-center py-20 px-8">
          <div className="w-full max-w-3xl">
            
            <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-8 outline-none" contentEditable suppressContentEditableWarning>
              Q3 Funding Recap
            </h1>
            
            <p className="text-slate-600 text-lg mb-8 outline-none" contentEditable suppressContentEditableWarning>
              Here is the AI generated tweet draft. It flows just like a regular document, making it incredibly easy to edit and review before posting.
            </p>

            {/* Inline Graphic Block */}
            <div className="w-full aspect-video bg-slate-50 border border-slate-200 rounded-2xl mb-8 relative group flex items-center justify-center overflow-hidden">
               <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-blue-600">
                 Change Template
               </div>
               <div className="text-slate-300 font-black text-xl flex items-center gap-2">
                  <ImageIcon /> [ Funding Graphic Injected Here ]
               </div>
            </div>

            {/* Slash Command Hint */}
            <div className="flex items-center gap-3 text-slate-400 p-2">
              <Plus size={20} className="text-slate-300" />
              <span className="text-lg">Type <code className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm font-bold mx-1">/</code> to insert a new project graphic...</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}