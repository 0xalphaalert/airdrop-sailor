import React from 'react';
import { 
  Calendar, ChevronDown, RefreshCw, Users, Eye, Heart, 
  MessageCircle, Share2, BarChart2, FileText, Info, ExternalLink, 
  MoreVertical, Globe, Clock, UserCheck, UserPlus, Sparkles, 
  TrendingUp, Lightbulb, Bookmark
} from 'lucide-react';

// Custom Binance Logo
const BinanceLogo = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 22l-6-6h12l-6 6zm0-20l6 6H6l6-6zm-7 9h2v2H5v-2zm12 0h2v2h-2v-2zm-5 0h2v2h-2v-2z" />
  </svg>
);

// Sparkline SVG Component
const Sparkline = ({ color, d, height = "h-8" }) => (
  <div className={`${height} w-full mt-3`}>
    <svg viewBox="0 0 100 30" className="w-full h-full preserve-3d" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export default function BinanceSquareEngine() {
  return (
    <div className="flex-1 bg-[#FAFAFA] min-h-screen p-8">
      
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-[#FCD535] shrink-0 shadow-sm">
            <BinanceLogo size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Binance Square Engine</h1>
            <p className="text-[13px] text-slate-500 font-medium mt-0.5">Track your Binance Square performance and growth</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <Calendar size={14} className="text-slate-500" /> Jul 19 – Jul 25, 2026 <ChevronDown size={14} className="text-slate-400 ml-1" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Compare: Previous 7 days <ChevronDown size={14} className="text-slate-400 ml-1" />
          </button>
          <button className="w-9 h-9 border border-slate-200 bg-white rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS GRID (7 columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
        <MetricCard 
          title="Followers" icon={Users} iconColor="text-amber-500" bg="bg-amber-50"
          value="1,235" change="41 Today" changeType="up"
          subtext="vs Jul 12 - Jul 18: +12.6%"
          sparklineColor="#f59e0b" sparklineData="M0,20 Q10,15 20,25 T40,15 T60,20 T80,10 T100,5"
        />
        <MetricCard 
          title="Views" icon={Eye} iconColor="text-blue-500" bg="bg-blue-50"
          value="9.2K" change="18.9%" changeType="up"
          subtext="vs Jul 12 - Jul 18: +15.8%"
          sparklineColor="#eab308" sparklineData="M0,25 Q15,20 25,10 T50,15 T75,5 T100,0"
        />
        <MetricCard 
          title="Likes" icon={Heart} iconColor="text-rose-500" bg="bg-rose-50"
          value="1.6K" change="21.4%" changeType="up"
          subtext="vs Jul 12 - Jul 18: +17.6%"
          sparklineColor="#f43f5e" sparklineData="M0,30 Q20,25 30,15 T60,10 T80,20 T100,5"
        />
        <MetricCard 
          title="Comments" icon={MessageCircle} iconColor="text-purple-500" bg="bg-purple-50"
          value="468" change="16.3%" changeType="up"
          subtext="vs Jul 12 - Jul 18: +13.2%"
          sparklineColor="#a855f7" sparklineData="M0,25 Q10,25 20,15 T40,10 T60,20 T80,5 T100,0"
        />
        <MetricCard 
          title="Shares" icon={Share2} iconColor="text-blue-600" bg="bg-blue-50"
          value="326" change="14.7%" changeType="up"
          subtext="vs Jul 12 - Jul 18: +11.1%"
          sparklineColor="#3b82f6" sparklineData="M0,20 Q15,25 30,15 T60,10 T80,15 T100,5"
        />
        <MetricCard 
          title="Engagement Rate" icon={BarChart2} iconColor="text-indigo-500" bg="bg-indigo-50"
          value="17.3%" change="2.8%" changeType="up"
          subtext="vs Jul 12 - Jul 18: +1.9%"
          sparklineColor="#6366f1" sparklineData="M0,15 Q20,10 40,20 T70,10 T100,5"
        />
        <MetricCard 
          title="Articles Published" icon={FileText} iconColor="text-amber-600" bg="bg-amber-50"
          value="14" change="2" changeType="up"
          subtext="vs Jul 12 - Jul 18: +16.7%"
          sparklineColor="#d97706" sparklineData="M0,25 Q15,10 30,15 T60,10 T80,20 T100,0"
        />
      </div>

      {/* 3. CHARTS & SUMMARY ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        
        {/* PERFORMANCE OVERVIEW CHART (Col-span-2) */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl p-5 shadow-sm bg-white min-w-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Performance Overview</h2>
              <Info size={14} className="text-slate-400" />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50">
              7 Days <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
          
          <div className="flex items-center gap-6 mb-8 text-[11px] font-semibold text-slate-600">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#F0B90B]"></div> Views</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Likes</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Comments</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Shares</div>
          </div>

          <div className="relative h-[220px] w-full">
             {/* Y-Axis Labels Left */}
             <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-semibold text-slate-400 pb-8">
               <span>10K</span><span>8K</span><span>6K</span><span>4K</span><span>2K</span><span>0</span>
             </div>

             {/* Mock Chart Area */}
             <div className="absolute left-8 right-4 top-2 bottom-8 border-b border-slate-100">
                {/* Horizontal Grid lines */}
                <div className="absolute w-full h-[20%] border-b border-slate-100 top-0"></div>
                <div className="absolute w-full h-[20%] border-b border-slate-100 top-[20%]"></div>
                <div className="absolute w-full h-[20%] border-b border-slate-100 top-[40%]"></div>
                <div className="absolute w-full h-[20%] border-b border-slate-100 top-[60%]"></div>
                <div className="absolute w-full h-[20%] border-b border-slate-100 top-[80%]"></div>

                {/* Views Line (Yellow) */}
                <svg className="absolute inset-0 w-full h-full preserve-3d" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polyline points="0,40 16,35 33,33 50,30 66,28 83,20 100,15" fill="none" stroke="#F0B90B" strokeWidth="2" />
                  <circle cx="0" cy="40" r="3" fill="#F0B90B" />
                  <circle cx="16" cy="35" r="3" fill="#F0B90B" />
                  <circle cx="33" cy="33" r="3" fill="#F0B90B" />
                  <circle cx="50" cy="30" r="3" fill="#F0B90B" />
                  <circle cx="66" cy="28" r="3" fill="#F0B90B" />
                  <circle cx="83" cy="20" r="3" fill="#F0B90B" />
                  <circle cx="100" cy="15" r="3" fill="#F0B90B" />
                </svg>

                {/* Likes Line (Red) */}
                <svg className="absolute inset-0 w-full h-full preserve-3d" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polyline points="0,80 16,78 33,76 50,75 66,75 83,72 100,70" fill="none" stroke="#f43f5e" strokeWidth="2" />
                  <circle cx="0" cy="80" r="2.5" fill="#f43f5e" />
                  <circle cx="16" cy="78" r="2.5" fill="#f43f5e" />
                  <circle cx="33" cy="76" r="2.5" fill="#f43f5e" />
                  <circle cx="50" cy="75" r="2.5" fill="#f43f5e" />
                  <circle cx="66" cy="75" r="2.5" fill="#f43f5e" />
                  <circle cx="83" cy="72" r="2.5" fill="#f43f5e" />
                  <circle cx="100" cy="70" r="2.5" fill="#f43f5e" />
                </svg>

                {/* Comments Line (Purple) */}
                <svg className="absolute inset-0 w-full h-full preserve-3d" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polyline points="0,90 16,89 33,88 50,88 66,88 83,87 100,85" fill="none" stroke="#a855f7" strokeWidth="2" />
                  <circle cx="0" cy="90" r="2" fill="#a855f7" />
                  <circle cx="16" cy="89" r="2" fill="#a855f7" />
                  <circle cx="33" cy="88" r="2" fill="#a855f7" />
                  <circle cx="50" cy="88" r="2" fill="#a855f7" />
                  <circle cx="66" cy="88" r="2" fill="#a855f7" />
                  <circle cx="83" cy="87" r="2" fill="#a855f7" />
                  <circle cx="100" cy="85" r="2" fill="#a855f7" />
                </svg>

                {/* Shares Line (Blue) */}
                <svg className="absolute inset-0 w-full h-full preserve-3d" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polyline points="0,95 16,94 33,94 50,93 66,93 83,92 100,90" fill="none" stroke="#3b82f6" strokeWidth="2" />
                  <circle cx="0" cy="95" r="2" fill="#3b82f6" />
                  <circle cx="16" cy="94" r="2" fill="#3b82f6" />
                  <circle cx="33" cy="94" r="2" fill="#3b82f6" />
                  <circle cx="50" cy="93" r="2" fill="#3b82f6" />
                  <circle cx="66" cy="93" r="2" fill="#3b82f6" />
                  <circle cx="83" cy="92" r="2" fill="#3b82f6" />
                  <circle cx="100" cy="90" r="2" fill="#3b82f6" />
                </svg>
             </div>

             {/* X-Axis Labels */}
             <div className="absolute left-8 right-4 bottom-0 flex justify-between text-[11px] font-semibold text-slate-400 pt-2">
               <span>Jul 19</span><span>Jul 20</span><span>Jul 21</span><span>Jul 22</span><span>Jul 23</span><span>Jul 24</span><span>Jul 25</span>
             </div>
          </div>
        </div>

        {/* GROWTH SUMMARY (Col-span-1) */}
        <div className="border border-slate-200 rounded-xl p-5 shadow-sm bg-white">
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight mb-5">Growth Summary</h2>
          <div className="space-y-4">
            <SummaryRow icon={Users} label="Followers Today" value="41" iconColor="text-blue-500" />
            <SummaryRow icon={Calendar} label="Followers this Week" value="132" iconColor="text-blue-500" />
            <SummaryRow icon={Calendar} label="Followers this Month" value="348" iconColor="text-blue-500" />
            <div className="my-4 border-t border-slate-100"></div>
            <SummaryRow icon={BarChart2} label="vs Last Week" value="12.6%" iconColor="text-blue-500" />
            <SummaryRow icon={BarChart2} label="vs Last Month" value="28.3%" iconColor="text-blue-500" />
          </div>
        </div>

        {/* CHANNEL INFO (Col-span-1) */}
        <div className="border border-slate-200 rounded-xl p-5 shadow-sm bg-white flex flex-col">
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight mb-5">Channel Info</h2>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-[#FCD535] shadow-sm">
              <BinanceLogo size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13px] font-bold text-slate-900 leading-tight">AirdropSailor</h3>
              </div>
              <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                @airdropsailor <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">Verified</span>
              </p>
            </div>
          </div>
          
          <div className="space-y-3 flex-1">
            <InfoRow label="Channel Type" value="Public" />
            <InfoRow label="Followers" value="1,235" />
            <InfoRow label="Total Articles" value="42" />
            <InfoRow label="Total Views" value="98,642" />
            <InfoRow label="Joined" value="Mar 15, 2024" />
          </div>
          
          <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-amber-200 text-amber-600 bg-amber-50 rounded-lg text-[13px] font-semibold hover:bg-amber-100 transition-colors">
            View Channel <ExternalLink size={14} />
          </button>
        </div>

      </div>

      {/* 4. TABLES & AUDIENCE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        
        {/* RECENT ARTICLES (Col-span-2) */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl p-5 shadow-sm bg-white flex flex-col min-w-0">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Recent Articles</h2>
            <button className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="w-full overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 w-[45%]">Article</th>
                <th className="pb-3 w-[10%] text-center">Type</th>
                <th className="pb-3 w-[20%]">Published At</th>
                <th className="pb-3 w-[10%] text-right">Views</th>
                <th className="pb-3 w-[10%] text-right">Likes</th>
                <th className="pb-3 w-[10%] text-right">Comments</th>
                <th className="pb-3 w-[5%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <ArticleRow title="Top 5 Funding this Week" date="Jul 24, 2026 10:30 AM" views="2.4K" likes="412" comments="86" />
              <ArticleRow title="Real Finance raises $29M in Seed round" date="Jul 25, 2026 08:45 AM" views="1.9K" likes="321" comments="65" />
              <ArticleRow title="MegaETH Testnet Guide is Live!" date="Jul 24, 2026 09:15 PM" views="1.6K" likes="280" comments="42" />
              <ArticleRow title="Monad Airdrop is Live" date="Jul 23, 2026 10:15 AM" views="1.2K" likes="198" comments="35" />
              <ArticleRow title="Discord Roles Available" date="Jul 22, 2026 06:40 PM" views="980" likes="142" comments="28" bg="bg-purple-600" />
            </tbody>
          </table>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
             <button className="w-full flex items-center justify-center py-2 border border-slate-200 text-blue-600 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors">
               View all articles
             </button>
          </div>
        </div>

        {/* TOP PERFORMING ARTICLES (Col-span-2) */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl p-5 shadow-sm bg-white min-w-0">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Top Performing Articles</h2>
            <button className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="w-full overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 w-8">#</th>
                <th className="pb-3 w-[50%]">Article</th>
                <th className="pb-3 text-right">Views</th>
                <th className="pb-3 text-right">Engagements</th>
                <th className="pb-3 text-right">Eng. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <TopArticleRow num="1" title="Top 5 Funding this Week" views="2.4K" eng="638" rate="26.6%" />
              <TopArticleRow num="2" title="Real Finance raises $29M in Seed round" views="1.9K" eng="521" rate="27.4%" />
              <TopArticleRow num="3" title="MegaETH Testnet Guide is Live!" views="1.6K" eng="406" rate="25.4%" />
              <TopArticleRow num="4" title="Monad Airdrop is Live" views="1.2K" eng="233" rate="19.4%" />
              <TopArticleRow num="5" title="Tokenomics Breakdown" views="920" eng="176" rate="19.1%" bg="bg-amber-100" />
            </tbody>
          </table>
          </div>
        </div>

        {/* AUDIENCE INSIGHTS (Col-span-1) */}
        <div className="lg:col-span-1 border border-slate-200 rounded-xl p-5 shadow-sm bg-white min-w-0">
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight mb-6">Audience Insights</h2>
          <div className="space-y-6">
            <InsightRow icon={Globe} label="Top Countries" value="India (38%)" iconColor="text-amber-500" />
            <InsightRow icon={MessageCircle} label="Top Language" value="English (72%)" iconColor="text-amber-500" />
            <InsightRow icon={Clock} label="Active Time" value="9 AM – 11 AM" iconColor="text-amber-500" />
            <InsightRow icon={UserCheck} label="Returning Readers" value="28%" iconColor="text-amber-500" />
            <InsightRow icon={UserPlus} label="New Followers" value="72%" iconColor="text-amber-500" />
          </div>
        </div>

      </div>

      {/* 5. BOTTOM ROW (Engagement + AI Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* ENGAGEMENT OVERVIEW (Col-span-3) */}
        <div className="lg:col-span-3 border border-slate-200 rounded-xl p-5 shadow-sm bg-white min-w-0">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Engagement Overview</h2>
            <Info size={14} className="text-slate-400" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <EngagementBox 
              icon={Heart} title="Likes" value="1.6K" change="21.4%" changeType="up" iconColor="text-rose-500" bg="bg-rose-50"
              sparklineColor="#f43f5e" sparklineData="M0,20 Q10,10 20,20 T40,15 T60,20 T80,5 T100,10"
            />
            <EngagementBox 
              icon={MessageCircle} title="Comments" value="468" change="16.3%" changeType="up" iconColor="text-purple-500" bg="bg-purple-50"
              sparklineColor="#a855f7" sparklineData="M0,25 Q15,20 25,10 T50,15 T75,5 T100,0"
            />
            <EngagementBox 
              icon={Share2} title="Shares" value="326" change="14.7%" changeType="up" iconColor="text-blue-500" bg="bg-blue-50"
              sparklineColor="#3b82f6" sparklineData="M0,30 Q20,25 30,15 T60,10 T80,20 T100,5"
            />
            <EngagementBox 
              icon={Bookmark} title="Saves" value="152" change="18.9%" changeType="up" iconColor="text-teal-500" bg="bg-teal-50"
              sparklineColor="#14b8a6" sparklineData="M0,15 Q20,10 40,20 T70,10 T100,5"
            />
          </div>
        </div>

        {/* AI INSIGHTS (Col-span-2) */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl p-6 shadow-sm bg-white flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 text-slate-900 mb-5">
            <Sparkles size={18} className="text-amber-500" />
            <span className="text-[14px] font-bold">AI Insights</span>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <TrendingUp size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[12px] font-medium text-slate-600 leading-snug">Funding related articles get <span className="font-bold text-slate-900">42% more engagement</span>.</p>
            </div>
            <div className="flex gap-3">
              <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[12px] font-medium text-slate-600 leading-snug">Your best performing time is <span className="font-bold text-slate-900">9:00 AM – 11:00 AM</span>.</p>
            </div>
            <div className="flex gap-3">
              <BarChart2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[12px] font-medium text-slate-600 leading-snug">Engagement rate increased by <span className="font-bold text-slate-900">2.8%</span> compared to last week.</p>
            </div>
            <div className="flex gap-3">
              <Lightbulb size={16} className="text-purple-500 shrink-0 mt-0.5" />
              <p className="text-[12px] font-medium text-slate-600 leading-snug">Try publishing more long-form articles. They perform better.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function MetricCard({ title, icon: Icon, iconColor, bg, value, change, changeType, subtext, sparklineColor, sparklineData }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 shadow-sm bg-white">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-6 h-6 rounded flex items-center justify-center ${bg} ${iconColor}`}>
          <Icon size={12} />
        </div>
        <span className="text-[12px] font-semibold text-slate-600">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-bold text-slate-900 tracking-tight">{value}</span>
        <span className={`text-[10px] font-bold ${changeType === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {changeType === 'up' ? '↑' : '↓'} {change}
        </span>
      </div>
      <p className="text-[10px] font-medium text-slate-400 mt-1">{subtext}</p>
      <Sparkline color={sparklineColor} d={sparklineData} />
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value, iconColor = "text-slate-400" }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={16} className={iconColor} />
        <span className="text-[13px] font-medium text-slate-600">{label}</span>
      </div>
      <span className="text-[13px] font-bold text-emerald-500 flex items-center gap-1">↑ {value}</span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] font-medium text-slate-500">{label}</span>
      <span className="text-[13px] font-semibold text-slate-900 text-right">{value}</span>
    </div>
  );
}

function ArticleRow({ title, date, views, likes, comments, bg = "bg-slate-900" }) {
  return (
    <tr className="group">
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${bg} rounded shadow-sm border border-slate-200 shrink-0`}></div>
          <span className="text-[12px] font-semibold text-slate-900 truncate pr-2 max-w-[200px]">{title}</span>
        </div>
      </td>
      <td className="py-3 text-center">
        <div className="flex justify-center text-slate-400">
          <FileText size={14} />
        </div>
      </td>
      <td className="py-3 text-[11px] font-medium text-slate-500">{date}</td>
      <td className="py-3 text-[11px] font-semibold text-slate-900 tabular-nums text-right">{views}</td>
      <td className="py-3 text-[11px] font-semibold text-slate-900 tabular-nums text-right">{likes}</td>
      <td className="py-3 text-[11px] font-semibold text-slate-900 tabular-nums text-right">{comments}</td>
      <td className="py-3 text-right">
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <MoreVertical size={14} />
        </button>
      </td>
    </tr>
  );
}

function TopArticleRow({ num, title, views, eng, rate, bg = "bg-slate-900" }) {
  return (
    <tr className="group">
      <td className="py-3 text-[12px] font-bold text-slate-900">{num}</td>
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${bg} rounded shadow-sm border border-slate-200 shrink-0`}></div>
          <span className="text-[12px] font-semibold text-slate-900 truncate pr-2 max-w-[220px]">{title}</span>
        </div>
      </td>
      <td className="py-3 text-[11px] font-semibold text-slate-900 tabular-nums text-right">{views}</td>
      <td className="py-3 text-[11px] font-semibold text-slate-900 tabular-nums text-right">{eng}</td>
      <td className="py-3 text-[11px] font-semibold text-slate-900 tabular-nums text-right">{rate}</td>
    </tr>
  );
}

function InsightRow({ icon: Icon, label, value, iconColor }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon size={14} className={iconColor} />
        <span className="text-[12px] font-medium text-slate-600">{label}</span>
      </div>
      <span className="text-[12px] font-bold text-slate-900">{value}</span>
    </div>
  );
}

function EngagementBox({ icon: Icon, title, value, change, changeType, iconColor, bg, sparklineColor, sparklineData }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bg} ${iconColor}`}>
          <Icon size={14} />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-500">{title}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold text-slate-900 tracking-tight">{value}</span>
            <span className={`text-[9px] font-bold ${changeType === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {changeType === 'up' ? '↑' : '↓'} {change}
            </span>
          </div>
        </div>
      </div>
      <Sparkline color={sparklineColor} d={sparklineData} height="h-6" />
    </div>
  );
}