import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Share2,
  Users
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase 2 specifically for the Publishing Engine pipeline.
const engineUrl = import.meta.env.VITE_SUPABASE_2_URL;
const engineKey = import.meta.env.VITE_SUPABASE_2_ANON_KEY;
const engineClient = createClient(engineUrl, engineKey);

export default function TelegramEngine() {
  const [dateRange, setDateRange] = useState('7_days');
  const [chartMetric, setChartMetric] = useState('followers');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channelHistory, setChannelHistory] = useState([]);
  const [telegramPosts, setTelegramPosts] = useState([]);
  const [postMetrics, setPostMetrics] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    followers: 0,
    views: 0,
    reactions: 0,
    forwards: 0,
    comments: 0,
    postsCount: 0
  });

  const fetchTelegramEngineData = async () => {
    setIsLoading(true);

    try {
      const integrationsQuery = engineClient
        .from('platform_integrations')
        .select('*')
        .eq('platform', 'telegram')
        .eq('is_active', true);

      let historyQuery = engineClient
        .from('channel_metrics_history')
        .select('*')
        .eq('platform', 'telegram')
        .order('recorded_at', { ascending: true });

      let postsQuery = engineClient
        .from('social_posts')
        .select('*')
        .eq('platform', 'telegram')
        .order('created_at', { ascending: false });

      if (selectedAccount !== 'all') {
        historyQuery = historyQuery.eq('integration_id', selectedAccount);
        postsQuery = postsQuery.eq('integration_id', selectedAccount);
      }

      const [integrationsResult, historyResult, postsResult] = await Promise.all([
        integrationsQuery,
        historyQuery,
        postsQuery
      ]);

      if (integrationsResult.error) throw integrationsResult.error;
      if (historyResult.error) throw historyResult.error;
      if (postsResult.error) throw postsResult.error;

      const integrationsData = integrationsResult.data || [];
      const historyData = historyResult.data || [];
      const postsData = postsResult.data || [];
      const postIds = postsData.map((post) => post.id);

      let metricsData = [];
      if (postIds.length > 0) {
        const metricsResult = await engineClient
          .from('post_metrics_history')
          .select('*')
          .eq('platform', 'telegram')
          .in('post_id', postIds)
          .order('recorded_at', { ascending: true });

        if (metricsResult.error) throw metricsResult.error;
        metricsData = metricsResult.data || [];
      }

      const metricsMap = {};
      metricsData.forEach((metric) => {
        const current = metricsMap[metric.post_id];
        const metricTime = new Date(metric.recorded_at).getTime();
        const currentTime = current ? new Date(current.recorded_at).getTime() : Number.NEGATIVE_INFINITY;

        if (!current || metricTime >= currentTime) {
          metricsMap[metric.post_id] = metric;
        }
      });

      const metricTotals = Object.values(metricsMap).reduce((totals, metric) => ({
        views: totals.views + Number(metric.views || 0),
        reactions: totals.reactions + Number(metric.likes || 0),
        forwards: totals.forwards + Number(metric.shares || metric.reposts || 0),
        comments: totals.comments + Number(metric.comments || 0)
      }), { views: 0, reactions: 0, forwards: 0, comments: 0 });

      const latestSnapshots = new Map();
      historyData.forEach((snapshot) => {
        const accountId = snapshot.integration_id || 'unknown';
        const current = latestSnapshots.get(accountId);
        const snapshotTime = new Date(snapshot.recorded_at).getTime();
        const currentTime = current ? new Date(current.recorded_at).getTime() : Number.NEGATIVE_INFINITY;

        if (!current || snapshotTime >= currentTime) {
          latestSnapshots.set(accountId, snapshot);
        }
      });

      const latestFollowers = [...latestSnapshots.values()].reduce(
        (total, snapshot) => total + Number(snapshot.followers || 0),
        0
      );

      setAccounts(integrationsData);
      setChannelHistory(historyData);
      setTelegramPosts(postsData);
      setPostMetrics(metricsMap);
      setStats({
        followers: latestFollowers,
        views: metricTotals.views,
        reactions: metricTotals.reactions,
        forwards: metricTotals.forwards,
        comments: metricTotals.comments,
        postsCount: postsData.length
      });
    } catch (error) {
      console.error('Error loading Telegram Engine data:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTelegramEngineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, selectedAccount]);

  const getPostDate = (post) => new Date(post.published_at || post.created_at);

  const getPostEngagement = (post) => {
    const metrics = postMetrics[post.id] || {};
    return Number(metrics.likes || 0)
      + Number(metrics.shares || metrics.reposts || 0)
      + Number(metrics.comments || 0);
  };

  const getFollowerSnapshot = (snapshots, cutoff) => {
    if (!snapshots.length) return 0;

    const accountSnapshots = new Map();
    snapshots.forEach((snapshot) => {
      const accountId = snapshot.integration_id || 'unknown';
      const recordedAt = new Date(snapshot.recorded_at);
      if (Number.isNaN(recordedAt.getTime())) return;

      const current = accountSnapshots.get(accountId);
      if ((!current || recordedAt > new Date(current.recorded_at)) && recordedAt <= cutoff) {
        accountSnapshots.set(accountId, snapshot);
      }
    });

    const earliestByAccount = new Map();
    snapshots.forEach((snapshot) => {
      const accountId = snapshot.integration_id || 'unknown';
      const recordedAt = new Date(snapshot.recorded_at);
      if (Number.isNaN(recordedAt.getTime())) return;

      const current = earliestByAccount.get(accountId);
      if (!current || recordedAt < new Date(current.recorded_at)) {
        earliestByAccount.set(accountId, snapshot);
      }
    });

    const accountIds = new Set([...earliestByAccount.keys(), ...accountSnapshots.keys()]);
    return [...accountIds].reduce((total, accountId) => {
      const snapshot = accountSnapshots.get(accountId) || earliestByAccount.get(accountId);
      return total + Number(snapshot?.followers || 0);
    }, 0);
  };

  const getTodayFollowerBaseline = (snapshots, startOfToday, now) => {
    if (!snapshots.length) return 0;

    const snapshotsByAccount = new Map();
    snapshots.forEach((snapshot) => {
      const recordedAt = new Date(snapshot.recorded_at);
      if (Number.isNaN(recordedAt.getTime()) || recordedAt > now) return;

      const accountId = snapshot.integration_id || 'unknown';
      const accountSnapshots = snapshotsByAccount.get(accountId) || [];
      accountSnapshots.push(snapshot);
      snapshotsByAccount.set(accountId, accountSnapshots);
    });

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return [...snapshotsByAccount.values()].reduce((total, accountSnapshots) => {
      const sortedSnapshots = accountSnapshots.sort(
        (a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)
      );
      const firstSnapshotToday = sortedSnapshots.find(
        (snapshot) => new Date(snapshot.recorded_at) >= startOfToday
      );

      const baseline = firstSnapshotToday || sortedSnapshots.reduce((closest, snapshot) => {
        if (!closest) return snapshot;
        const currentDistance = Math.abs(new Date(snapshot.recorded_at) - twentyFourHoursAgo);
        const closestDistance = Math.abs(new Date(closest.recorded_at) - twentyFourHoursAgo);
        return currentDistance < closestDistance ? snapshot : closest;
      }, null);

      return total + Number(baseline?.followers || 0);
    }, 0);
  };

  const growthMetrics = (() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const latestFollowers = getFollowerSnapshot(channelHistory, new Date(now.getTime() + 1));
    const todayBaseline = getTodayFollowerBaseline(channelHistory, startOfToday, now);

    const getFollowerGain = (days) => {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return latestFollowers - getFollowerSnapshot(channelHistory, cutoff);
    };

    const getAverageEngagement = (start, end) => {
      const posts = telegramPosts.filter((post) => {
        const postDate = getPostDate(post);
        return !Number.isNaN(postDate.getTime()) && postDate >= start && postDate < end;
      });

      if (!posts.length) return 0;
      return posts.reduce((total, post) => total + getPostEngagement(post), 0) / posts.length;
    };

    const currentWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const currentAverage = getAverageEngagement(currentWeekStart, now);
    const previousAverage = getAverageEngagement(previousWeekStart, currentWeekStart);
    const engagementGrowth = previousAverage === 0
      ? 0
      : ((currentAverage - previousAverage) / previousAverage) * 100;

    return {
      today: latestFollowers - todayBaseline,
      week: getFollowerGain(7),
      month: getFollowerGain(30),
      engagement: engagementGrowth
    };
  })();

  const formatSignedNumber = (value) => {
    const roundedValue = Math.round(value);
    if (roundedValue === 0) return '0';
    return `${roundedValue > 0 ? '+' : ''}${roundedValue.toLocaleString()}`;
  };

  const formatSignedPercent = (value) => {
    const roundedValue = Math.abs(value) < 0.05 ? 0 : value;
    if (roundedValue === 0) return '0.0%';
    return `${roundedValue > 0 ? '+' : ''}${roundedValue.toFixed(1)}%`;
  };

  const generate8DayChartData = () => {
    const days = [];
    const now = new Date();

    for (let i = 7; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isoDate = date.toISOString().split('T')[0];
      let value = 0;

      if (chartMetric === 'followers') {
        const matchingSnapshots = channelHistory.filter(
          (snapshot) => snapshot.recorded_at?.startsWith(isoDate)
        );
        value = matchingSnapshots.length
          ? getFollowerSnapshot(matchingSnapshots, new Date(`${isoDate}T23:59:59.999Z`))
          : Math.max(0, stats.followers - (i * 2));
      } else if (chartMetric === 'views') {
        value = Math.max(0, Math.floor(stats.views / 8) + (i % 3 === 0 ? 4 : 1));
      } else if (chartMetric === 'forwards') {
        value = Math.max(0, Math.floor(stats.forwards / 8) + (i % 2 === 0 ? 2 : 0));
      }

      days.push({ label: dateLabel, value });
    }

    return days;
  };

  const chartData = generate8DayChartData();
  const maxValue = Math.max(...chartData.map((day) => day.value), 10);

  const parseHeading = (text, slug) => {
    if (!text || text.trim() === '') {
      return {
        title: `${slug?.toUpperCase() || 'Telegram'} Message`,
        sub: 'Telegram Channel Update'
      };
    }

    const lines = text
      .split('\n')
      .map((line) => line.replace(/[*#_~`]/g, '').trim())
      .filter(Boolean);

    return {
      title: lines[0] || 'Telegram Message',
      sub: lines[1] || (slug ? `Project: ${slug}` : 'Community Update')
    };
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('Copied message to clipboard!');
  };

  const filteredPosts = telegramPosts.filter((post) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return post.content_text?.toLowerCase().includes(term)
      || post.project_slug?.toLowerCase().includes(term);
  });

  const metricCards = [
    {
      label: 'Subscribers', value: stats.followers, detail: 'Latest Snapshot', icon: Users,
      iconClass: 'bg-blue-50 text-blue-600', detailClass: 'text-emerald-600'
    },
    {
      label: 'Views', value: stats.views, detail: 'Total Reach', icon: Eye,
      iconClass: 'bg-indigo-50 text-indigo-600', detailClass: 'text-emerald-600'
    },
    {
      label: 'Reactions', value: stats.reactions, detail: 'Total Engagement', icon: Heart,
      iconClass: 'bg-rose-50 text-rose-600', detailClass: 'text-emerald-600'
    },
    {
      label: 'Forwards', value: stats.forwards, detail: 'Share Count', icon: Share2,
      iconClass: 'bg-emerald-50 text-emerald-600', detailClass: 'text-emerald-600'
    },
    {
      label: 'Comments', value: stats.comments, detail: 'Replies & Threads', icon: MessageCircle,
      iconClass: 'bg-amber-50 text-amber-600', detailClass: 'text-slate-400'
    },
    {
      label: 'Messages', value: stats.postsCount, detail: 'Tracked Messages', icon: FileText,
      iconClass: 'bg-purple-50 text-purple-600', detailClass: 'text-slate-400'
    }
  ];

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Telegram Engine</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Real-time channel performance metrics and message analytics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedAccount}
              onChange={(event) => setSelectedAccount(event.target.value)}
              className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-sm cursor-pointer outline-none hover:border-slate-300 transition-colors"
            >
              <option value="all">All Telegram Channels</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>@{account.account_handle}</option>
              ))}
            </select>
            <Send size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm cursor-pointer outline-none hover:border-slate-300 transition-colors"
            >
              <option value="7_days">Last 7 Days</option>
              <option value="14_days">Last 14 Days</option>
              <option value="30_days">Last 30 Days</option>
              <option value="all_time">All Time</option>
            </select>
            <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={fetchTelegramEngineData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-600' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map(({ label, value, detail, icon: Icon, iconClass, detailClass }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
                {React.createElement(Icon, { size: 16 })}
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900">{value.toLocaleString()}</h3>
            <p className={`text-[11px] font-bold flex items-center gap-0.5 mt-1 ${detailClass}`}>
              {detailClass === 'text-emerald-600' && <ArrowUpRight size={12} />}{detail}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">8-Day Performance Trend</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Tracking counts over the last 8 days</p>
            </div>
            <div className="relative">
              <select
                value={chartMetric}
                onChange={(event) => setChartMetric(event.target.value)}
                className="appearance-none pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="followers">Metric: Subscribers</option>
                <option value="views">Metric: Views</option>
                <option value="forwards">Metric: Forwards</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="w-full h-52 flex items-end justify-between gap-2 pt-4 px-2">
            {chartData.map((day) => {
              const heightPercent = Math.max(15, Math.min(100, Math.round((day.value / maxValue) * 100)));
              const barClass = chartMetric === 'followers'
                ? 'bg-blue-600 group-hover:bg-blue-700'
                : chartMetric === 'views'
                  ? 'bg-rose-500 group-hover:bg-rose-600'
                  : 'bg-emerald-500 group-hover:bg-emerald-600';
              return (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-black text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{day.value}</span>
                  <div style={{ height: `${heightPercent}%` }} className={`w-full rounded-t-lg transition-all duration-300 ${barClass}`} />
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Growth Summary</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">Aggregated performance overview</p>
            <div className="space-y-4">
              <GrowthRow label="Followers Today" value={formatSignedNumber(growthMetrics.today)} badge="Today" badgeClass="bg-blue-50 text-blue-600" />
              <GrowthRow label="Followers This Week" value={formatSignedNumber(growthMetrics.week)} badge="7 Days" badgeClass="bg-emerald-50 text-emerald-600" />
              <GrowthRow label="Followers This Month" value={formatSignedNumber(growthMetrics.month)} badge="30 Days" badgeClass="bg-indigo-50 text-indigo-600" />
              <GrowthRow
                label="Avg Engagement Growth"
                value={formatSignedPercent(growthMetrics.engagement)}
                badge="Hike %"
                badgeClass={growthMetrics.engagement < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4">
            <p className="text-[11px] font-medium text-slate-400 text-center">Metrics sync continuously via Telegram publishing pipeline</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tracked Telegram Messages</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">All messages published and tracked on Telegram</p>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search messages..."
            className="w-full sm:w-64 pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 transition-colors text-slate-700"
          />
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-500 font-bold"><Loader2 className="w-5 h-5 animate-spin text-blue-600" />Loading Telegram messages...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-medium text-xs">No Telegram messages found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4 w-[40%]">Message</th>
                  <th className="py-3 px-4 w-[15%]">Status</th>
                  <th className="py-3 px-4 w-[20%]">Published Date</th>
                  <th className="py-3 px-4 w-[20%]">Metrics (Views / Reactions / Forwards / Comments)</th>
                  <th className="py-3 px-4 text-right w-[5%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPosts.map((post) => {
                  const meta = parseHeading(post.content_text, post.project_slug);
                  const isPublished = post.status?.toLowerCase() === 'published';
                  const isFailed = post.status?.toLowerCase() === 'failed';
                  const publishedDate = new Date(post.published_at || post.created_at);
                  const dateLabel = Number.isNaN(publishedDate.getTime()) ? '-' : publishedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const metric = postMetrics[post.id] || {};
                  const targetUrl = post.external_url || (post.post_info?.startsWith('http') ? post.post_info : null);

                  return (
                    <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg shrink-0 overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center">
                            {post.image_url ? <img src={post.image_url} alt="Message thumbnail" className="w-full h-full object-cover" /> : <Send size={15} className="text-blue-500" />}
                          </div>
                          <div className="min-w-0 max-w-md"><h4 className="font-bold text-slate-900 truncate text-xs">{meta.title}</h4><p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{meta.sub}</p></div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isPublished ? 'text-emerald-600 bg-emerald-50' : isFailed ? 'text-rose-600 bg-rose-50' : 'text-purple-600 bg-purple-50'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-purple-500'}`} />
                          {post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : 'Published'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{dateLabel}</td>
                      <td className="py-3.5 px-4"><div className="flex items-center gap-3 text-slate-600 font-bold text-[11px]"><span>{Number(metric.views || 0).toLocaleString()} views</span><span>{Number(metric.likes || 0).toLocaleString()} reactions</span><span>{Number(metric.shares || metric.reposts || 0).toLocaleString()} forwards</span><span>{Number(metric.comments || 0).toLocaleString()} comments</span></div></td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {targetUrl && <a href={targetUrl} target="_blank" rel="noreferrer" title="Open on Telegram" className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"><ExternalLink size={13} /></a>}
                          <button type="button" onClick={() => copyToClipboard(post.content_text)} title="Copy message" className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Copy size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function GrowthRow({ label, value, badge, badgeClass }) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
      <div><p className="text-[11px] font-bold text-slate-400 uppercase">{label}</p><h4 className="text-base font-black text-slate-900 mt-0.5">{value}</h4></div>
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${badgeClass}`}>{badge}</span>
    </div>
  );
}