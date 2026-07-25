// src/mobile/components/home/StatsRow.jsx
import React from 'react';
import { Target, Clock3, Wallet, TimerReset } from 'lucide-react';

export default function StatsRow({ stats }) {
  const statsData = [
    {
      icon: Target,
      iconColor: "text-emerald-500",
      bg: "bg-emerald-50",
      value: stats?.totalProjects || 0,
      label: "Active\nProjects",
    },
    {
      icon: Clock3,
      iconColor: "text-blue-500",
      bg: "bg-blue-50",
      value: stats?.pendingTasks || 0,
      label: "Pending\nTasks",
    },
    {
      icon: Wallet,
      iconColor: "text-purple-500",
      bg: "bg-purple-50",
      value: `$${stats?.totalFarmCost || "0 - $15"}`,
      label: "Avg. Farm\nCost",
    },
    {
      icon: TimerReset,
      iconColor: "text-orange-500",
      bg: "bg-orange-50",
      value: `~${stats?.avgTimeRequired || 0} mins`,
      label: "Avg. Time\nRequired",
    },
  ];

  return (
    <section className="px-5 mt-6">
      <div className="flex w-full items-center justify-between rounded-3xl border border-slate-100 bg-white px-4 py-5 shadow-sm">
        {statsData.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex flex-col items-center gap-2 text-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${item.bg} ${item.iconColor}`}>
                <Icon size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-black text-slate-900">{item.value}</span>
                <span className="mt-0.5 whitespace-pre-line text-[9px] font-semibold text-slate-500 leading-tight">
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}