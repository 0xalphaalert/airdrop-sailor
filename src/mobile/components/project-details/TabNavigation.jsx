// src/mobile/components/project-details/TabNavigation.jsx
import React from 'react';
import { LayoutTemplate, ListChecks, DollarSign, MessageSquare, Coins, Cpu } from 'lucide-react';

export default function TabNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutTemplate size={14} /> },
    { id: 'step-by-step', label: 'Step by Step', icon: <ListChecks size={14} /> },
    { id: 'funding', label: 'Funding & Team', icon: <DollarSign size={14} /> },
    { id: 'discord', label: 'Discord Alpha', icon: <MessageSquare size={14} /> },
    { id: 'tokenomics', label: 'Tokenomics', icon: <Coins size={14} /> },
    { id: 'research', label: 'AI Research', icon: <Cpu size={14} /> },
  ];

  return (
    <div className="border-y border-slate-100 bg-white">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${
                isActive 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
        {/* Placeholder for Figma's "... More" menu */}
        <button className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
          ••• More
        </button>
      </div>
    </div>
  );
}