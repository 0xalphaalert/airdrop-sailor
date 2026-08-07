import React from 'react';
import { 
  FileText, CheckCircle2, CalendarClock, PenTool, XCircle, Users,
  TrendingUp, TrendingDown, MoreVertical, Plus, Grid, Calendar, Zap, 
  BarChart2, Send, Twitter // 🚀 Added missing Send and Twitter icons here!
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* 1. TOP STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: 'Total Generated', count: '128', icon: <FileText size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+18.5%', isUp: true },
          { title: 'Posted', count: '96', icon: <CheckCircle2 size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+22.1%', isUp: true },
          { title: 'Scheduled', count: '32', icon: <CalendarClock size={20}/>, color: 'text-amber-500', bg: 'bg-amber-50', trend: '+12.4%', isUp: true },
          { title: 'Drafts', count: '18', icon: <PenTool size={20}/>, color: 'text-purple-600', bg: 'bg-purple-50', trend: '-5.2%', isUp: false },
          { title: 'Failed', count: '3', icon: <XCircle size={20}/>, color: 'text-rose-500', bg: 'bg-rose-50', trend: '-1.1%', isUp: false },
          { title: 'Engagement', count: '89.4K', icon: <Users size={20}/>, color: 'text-sky-500', bg: 'bg-sky-50', trend: '+31.7%', isUp: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 mb-0.5">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{stat.count}</h3>
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-4 text-[10px] font-bold ${stat.isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
              {stat.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{stat.trend}</span>
              <span className="text-slate-400 font-medium ml-1">vs last 7 days</span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. MIDDLE CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart Placeholder */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800">Content Performance</h3>
            <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 font-bold bg-slate-50"><option>Views</option></select>
          </div>
          <div className="h-48 w-full bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6">
            <span className="text-xs font-bold text-slate-400">Recharts Line Chart Component</span>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            <div>
              <p className="text-[10px] text-slate-500 font-bold">Telegram Views</p>
              <p className="text-lg font-bold text-slate-800">62.1K <span className="text-[10px] text-emerald-500 ml-1">▲ 24.6%</span></p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold">X Impressions</p>
              <p className="text-lg font-bold text-slate-800">27.3K <span className="text-[10px] text-emerald-500 ml-1">▲ 19.8%</span></p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold">Total Engagement</p>
              <p className="text-lg font-bold text-slate-800">89.4K <span className="text-[10px] text-emerald-500 ml-1">▲ 31.7%</span></p>
            </div>
          </div>
        </div>

        {/* Donut Chart Placeholder */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800">Content by Category</h3>
            <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 font-bold bg-slate-50"><option>This Week</option></select>
          </div>
          <div className="flex items-center gap-6 h-48">
            <div className="w-40 h-40 rounded-full border-[24px] border-slate-100 flex items-center justify-center shrink-0">
               <div className="text-center">
                 <p className="text-2xl font-bold text-slate-800 leading-none">128</p>
                 <p className="text-[10px] font-bold text-slate-400">Total</p>
               </div>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { name: 'Funding', count: '42', pct: '32.8%', color: 'bg-blue-500' },
                { name: 'Project', count: '31', pct: '24.2%', color: 'bg-emerald-500' },
                { name: 'Task', count: '22', pct: '17.2%', color: 'bg-amber-500' },
                { name: 'News', count: '18', pct: '14.1%', color: 'bg-rose-500' },
                { name: 'User', count: '15', pct: '11.7%', color: 'bg-purple-500' },
              ].map(cat => (
                <div key={cat.name} className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${cat.color}`}></span><span className="text-slate-600">{cat.name}</span></div>
                  <div className="flex gap-2"><span className="text-slate-800">{cat.count}</span><span className="text-slate-400 w-10 text-right">({cat.pct})</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Publishing Overview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-slate-800">Publishing Overview</h3>
            <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 font-bold bg-slate-50"><option>This Week</option></select>
          </div>
          
          {/* Telegram Block */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Send size={16} className="text-sky-500" /> Telegram</div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Connected</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><p className="text-[10px] text-slate-500 font-bold">Posted</p><p className="text-lg font-bold text-slate-800">64</p></div>
              <div><p className="text-[10px] text-slate-500 font-bold">Scheduled</p><p className="text-lg font-bold text-slate-800">18</p></div>
              <div><p className="text-[10px] text-rose-500 font-bold">Failed</p><p className="text-lg font-bold text-rose-600">1</p></div>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex"><div className="w-[80%] bg-blue-600 h-full"></div><div className="w-[15%] bg-amber-400 h-full"></div><div className="w-[5%] bg-rose-500 h-full"></div></div>
            <div className="text-[10px] text-slate-500 font-bold mt-1 text-right">98.5% Success Rate</div>
          </div>

          {/* X Block */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Twitter size={16} className="text-slate-900" /> X (Twitter)</div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Connected</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><p className="text-[10px] text-slate-500 font-bold">Posted</p><p className="text-lg font-bold text-slate-800">32</p></div>
              <div><p className="text-[10px] text-slate-500 font-bold">Scheduled</p><p className="text-lg font-bold text-slate-800">14</p></div>
              <div><p className="text-[10px] text-rose-500 font-bold">Failed</p><p className="text-lg font-bold text-rose-600">2</p></div>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex"><div className="w-[70%] bg-slate-800 h-full"></div><div className="w-[20%] bg-amber-400 h-full"></div><div className="w-[10%] bg-rose-500 h-full"></div></div>
            <div className="text-[10px] text-slate-500 font-bold mt-1 text-right">94.1% Success Rate</div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM LISTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800">Upcoming Queue</h3>
            <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">View All Queue →</button>
          </div>
          <div className="flex-1 space-y-4">
            {[
              { title: 'Real Finance', sub: 'Funding Alert', platform: 'Telegram', time: 'Today, 08:30 PM', badge: 'In 2h 15m' },
              { title: 'MegaETH Testnet', sub: 'Guide Post', platform: 'X (Twitter)', time: 'Today, 09:00 PM', badge: 'In 2h 45m' },
              { title: 'Top 5 Funding', sub: 'Weekly Roundup', platform: 'Telegram', time: 'Tomorrow, 10:00 AM', badge: 'In 1d 3h' },
              { title: 'Monad Airdrop', sub: 'Early Alpha', platform: 'X (Twitter)', time: 'Tomorrow, 12:00 PM', badge: 'In 1d 5h' },
            ].map((q, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 shrink-0"></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{q.title}</h4>
                    <p className="text-[10px] font-bold text-slate-500">{q.sub}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1">{q.platform === 'Telegram' ? <Send size={10} className="text-sky-500"/> : <Twitter size={10}/>} {q.platform}</p>
                    <p className="text-[10px] font-medium text-slate-400">{q.time}</p>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">{q.badge}</span>
                  <button className="text-slate-400 hover:text-slate-800"><MoreVertical size={14}/></button>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full text-xs font-bold text-blue-600 pt-4 mt-2 border-t border-slate-100 hover:underline">View Full Queue →</button>
        </div>

        {/* Top Templates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800">Top Performing Templates</h3>
            <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 font-bold bg-slate-50"><option>This Week</option></select>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              <div className="col-span-5">Template</div><div className="col-span-3 text-center">Category</div><div className="col-span-2 text-right">Views</div><div className="col-span-2 text-right">Eng.</div>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Funding Alert V2', cat: 'Funding', cBg: 'bg-blue-50 text-blue-600', v: '28.4K', e: '24.6%' },
                { name: 'Weekly Funding', cat: 'Funding', cBg: 'bg-blue-50 text-blue-600', v: '19.7K', e: '21.3%' },
                { name: 'Project Guide V1', cat: 'Project', cBg: 'bg-emerald-50 text-emerald-600', v: '15.3K', e: '18.7%' },
                { name: 'Tokenomics Card', cat: 'Project', cBg: 'bg-emerald-50 text-emerald-600', v: '9.8K', e: '16.2%' },
                { name: 'Daily Tasks', cat: 'Task', cBg: 'bg-amber-50 text-amber-600', v: '6.2K', e: '14.9%' },
              ].map((t, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 flex items-center gap-2"><div className="w-5 h-5 rounded bg-slate-100 shrink-0"></div><span className="text-xs font-bold text-slate-700 truncate">{t.name}</span></div>
                  <div className="col-span-3 flex justify-center"><span className={`text-[9px] font-bold px-2 py-0.5 rounded ${t.cBg}`}>{t.cat}</span></div>
                  <div className="col-span-2 text-right text-xs font-bold text-slate-800">{t.v}</div>
                  <div className="col-span-2 text-right text-xs font-bold text-slate-800">{t.e}</div>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full text-xs font-bold text-blue-600 pt-4 mt-2 border-t border-slate-100 hover:underline">View All Templates →</button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
            <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">View All →</button>
          </div>
          <div className="flex-1 relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-100 -z-10"></div>
            <div className="space-y-6">
              {[
                { title: 'Posted to Telegram', sub: 'Funding Alert: Real Finance raises $29M', icon: <CheckCircle2 size={14} className="text-emerald-600"/>, bg: 'bg-emerald-100 border-white', time: '2m ago' },
                { title: 'Draft created', sub: 'MegaETH Testnet Guide', icon: <PenTool size={14} className="text-slate-600"/>, bg: 'bg-slate-200 border-white', time: '15m ago' },
                { title: 'Post scheduled', sub: 'Top 5 Funding - Weekly Roundup', icon: <CalendarClock size={14} className="text-blue-600"/>, bg: 'bg-blue-100 border-white', time: '32m ago' },
                { title: 'Posted to X (Twitter)', sub: 'Monad Airdrop is now live!', icon: <CheckCircle2 size={14} className="text-emerald-600"/>, bg: 'bg-emerald-100 border-white', time: '1h ago' },
                { title: 'Failed to post', sub: 'Network error - will retry', icon: <XCircle size={14} className="text-rose-600"/>, bg: 'bg-rose-100 border-white', time: '2h ago' },
              ].map((a, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center shrink-0 ${a.bg}`}>{a.icon}</div>
                  <div className="flex-1 flex justify-between items-start pt-1">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{a.title}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">{a.sub}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. QUICK ACTIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { title: 'Create New Post', sub: 'Start from scratch', icon: <Plus size={20} className="text-blue-600"/>, bg: 'bg-blue-50' },
            { title: 'Browse Templates', sub: 'Choose a template', icon: <Grid size={20} className="text-purple-600"/>, bg: 'bg-purple-50' },
            { title: 'View Queue', sub: 'Manage scheduled posts', icon: <Calendar size={20} className="text-amber-500"/>, bg: 'bg-amber-50' },
            { title: 'Automation Rules', sub: 'Create new automation', icon: <Zap size={20} className="text-emerald-600"/>, bg: 'bg-emerald-50' },
            { title: 'Analytics', sub: 'View detailed reports', icon: <BarChart2 size={20} className="text-sky-600"/>, bg: 'bg-sky-50' },
          ].map((act, i) => (
            <button key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all text-left group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${act.bg} group-hover:scale-105 transition-transform`}>{act.icon}</div>
              <div>
                <p className="text-xs font-bold text-slate-800">{act.title}</p>
                <p className="text-[10px] font-bold text-slate-500">{act.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}