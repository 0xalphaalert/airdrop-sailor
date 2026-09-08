import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  Calendar,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  ImageIcon,
  Loader2,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Repeat,
  TrendingUp,
  Users
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase 2 specifically for the Publishing Engine pipeline.
const engineUrl = import.meta.env.VITE_SUPABASE_2_URL;
const engineKey = import.meta.env.VITE_SUPABASE_2_ANON_KEY;
const engineClient = createClient(engineUrl, engineKey);

const RANGE_DAYS = {
  '7_days': 7,
  '14_days': 14,
  '30_days': 30,
  all_time: null
};

const FarcasterLogo = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.24 6H16.5c-2.48 0-4.5 2.02-4.5 4.5v9h2v-9c0-1.38 1.12-2.5 2.5-2.5h1.74l1.3-3zM5.76 6H7.5c2.48 0 4.5 2.02 4.5 4.5v9h-2v-9C10 9.12 8.88 8 7.5 8H5.76L4.46 3z" />
  </svg>
);

export default function FarcasterEngine() {
  const [dateRange, setDateRange] = useState('7_days');
  const [chartMetric, setChartMetric] = useState('followers');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channelHistory, setChannelHistory] = useState([]);
  const [farcasterPosts, setFarcasterPosts] = useState([]);
  const [postMetrics, setPostMetrics] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  // Anchor the reporting window to the last sync so render stays pure/stable.
  const [syncedAt, setSyncedAt] = useState(null);

  const fetchFarcasterEngineData = async () => {
    setIsLoading(true);

    try {
      const integrationsQuery = engineClient
        .from('platform_integrations')
        .select('*')
        .eq('platform', 'farcaster')
        .eq('is_active', true);

      let historyQuery = engineClient
        .from('channel_metrics_history')
        .select('*')
        .eq('platform', 'farcaster')
        .order('recorded_at', { ascending: true });

      let postsQuery = engineClient
        .from('social_posts')
        .select('*')
        .eq('platform', 'farcaster')
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

      const postsData = postsResult.data || [];
      const postIds = postsData.map((post) => post.id);

      let metricsData = [];
      if (postIds.length > 0) {
        const metricsResult = await engineClient
          .from('post_metrics_history')
          .select('*')
          .eq('platform', 'farcaster')
          .in('post_id', postIds)
          .order('recorded_at', { ascending: true });

        if (metricsResult.error) throw metricsResult.error;
        metricsData = metricsResult.data || [];
      }

      // Keep only the newest snapshot per cast so totals are not double counted.
      const metricsMap = {};
      metricsData.forEach((metric) => {
        const current = metricsMap[metric.post_id];
        const metricTime = new Date(metric.recorded_at).getTime();
        const currentTime = current ? new Date(current.recorded_at).getTime() : Number.NEGATIVE_INFINITY;

        if (!current || metricTime >= currentTime) {
          metricsMap[metric.post_id] = metric;
        }
      });

      setAccounts(integrationsResult.data || []);
      setChannelHistory(historyResult.data || []);
      setFarcasterPosts(postsData);
      setPostMetrics(metricsMap);
      setSyncedAt(Date.now());
    } catch (error) {
      console.error('Error loading Farcaster Engine data:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFarcasterEngineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  const getPostDate = (post) => new Date(post.published_at || post.created_at);

  const getPostMetric = (post) => postMetrics[post.id] || {};

  const getRecasts = (metric) => Number(metric.reposts || metric.shares || 0);

  const getPostEngagement = (post) => {
    const metric = getPostMetric(post);
    return Number(metric.likes || 0) + getRecasts(metric) + Number(metric.comments || 0);
  };

  // Posts constrained to the selected reporting window (drives KPIs and tables).
  const rangeDays = RANGE_DAYS[dateRange];
  const rangeStart = rangeDays && syncedAt
    ? new Date(syncedAt - rangeDays * 24 * 60 * 60 * 1000)
    : null;

  const rangePosts = farcasterPosts.filter((post) => {
    if (!rangeStart) return true;
    const postDate = getPostDate(post);
    return !Number.isNaN(postDate.getTime()) && postDate >= rangeStart;
  });

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

  // Latest snapshot per account, aggregated across the whole selection.
  const latestSnapshots = (() => {
    const snapshotsByAccount = new Map();
    channelHistory.forEach((snapshot) => {
      const accountId = snapshot.integration_id || 'unknown';
      const current = snapshotsByAccount.get(accountId);
      const snapshotTime = new Date(snapshot.recorded_at).getTime();
      const currentTime = current ? new Date(current.recorded_at).getTime() : Number.NEGATIVE_INFINITY;

      if (!current || snapshotTime >= currentTime) {
        snapshotsByAccount.set(accountId, snapshot);
      }
    });
    return [...snapshotsByAccount.values()];
  })();

  const sumLatest = (field) => latestSnapshots.reduce(
    (total, snapshot) => total + Number(snapshot?.[field] || 0),
    0
  );

  const stats = rangePosts.reduce((totals, post) => {
    const metric = getPostMetric(post);
    return {
      views: totals.views + Number(metric.views || 0),
      likes: totals.likes + Number(metric.likes || 0),
      recasts: totals.recasts + getRecasts(metric),
      replies: totals.replies + Number(metric.comments || 0)
    };
  }, { views: 0, likes: 0, recasts: 0, replies: 0 });

  const followers = sumLatest('followers');
  const following = sumLatest('following');
  const profileViews = sumLatest('profile_views');
  const totalEngagement = stats.likes + stats.recasts + stats.replies;
  const engagementBase = stats.views || followers;
  const engagementRate = engagementBase > 0 ? (totalEngagement / engagementBase) * 100 : 0;

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
      const posts = farcasterPosts.filter((post) => {
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

  const formatCompact = (value) => {
    const numeric = Number(value || 0);
    if (numeric >= 1000000) return `${(numeric / 1000000).toFixed(1)}M`;
    if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}K`;
    return numeric.toLocaleString();
  };

  // Real 8-day series, aggregated per calendar day from live snapshots and cast metrics.
  const build8DaySeries = (metricKey) => {
    const days = [];
    const now = new Date();

    for (let i = 7; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      let value = 0;

      if (metricKey === 'followers') {
        const snapshotsUpToDay = channelHistory.filter((snapshot) => {
          const recordedAt = new Date(snapshot.recorded_at);
          return !Number.isNaN(recordedAt.getTime()) && recordedAt < dayEnd;
        });
        value = getFollowerSnapshot(snapshotsUpToDay, dayEnd);
      } else {
        const postsThatDay = farcasterPosts.filter((post) => {
          const postDate = getPostDate(post);
          return !Number.isNaN(postDate.getTime()) && postDate >= dayStart && postDate < dayEnd;
        });

        value = postsThatDay.reduce((total, post) => {
          const metric = getPostMetric(post);
          if (metricKey === 'likes') return total + Number(metric.likes || 0);
          if (metricKey === 'recasts') return total + getRecasts(metric);
          if (metricKey === 'replies') return total + Number(metric.comments || 0);
          if (metricKey === 'casts') return total + 1;
          return total;
        }, 0);
      }

      days.push({
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value
      });
    }

    return days;
  };

  const chartData = build8DaySeries(chartMetric);
  const maxValue = Math.max(...chartData.map((day) => day.value), 1);

  const buildSparklinePath = (values) => {
    if (!values.length) return 'M0,15 L100,15';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const step = values.length > 1 ? 100 / (values.length - 1) : 100;

    return values
      .map((value, index) => {
        const x = (index * step).toFixed(2);
        const y = (28 - ((value - min) / range) * 26).toFixed(2);
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  };

  const seriesValues = (metricKey) => build8DaySeries(metricKey).map((day) => day.value);

  const parseHeading = (text, slug) => {
    if (!text || text.trim() === '') {
      return {
        title: `${slug?.toUpperCase() || 'Farcaster'} Cast`,
        sub: 'Farcaster Channel Update'
      };
    }

    const lines = text
      .split('\n')
      .map((line) => line.replace(/[*#_~`]/g, '').trim())
      .filter(Boolean);

    return {
      title: lines[0] || 'Farcaster Cast',
      sub: lines[1] || (slug ? `Project: ${slug}` : 'Community Update')
    };
  };

  const filteredPosts = rangePosts.filter((post) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return post.content_text?.toLowerCase().includes(term)
      || post.project_slug?.toLowerCase().includes(term);
  });

  const topPosts = [...rangePosts]
    .sort((a, b) => getPostEngagement(b) - getPostEngagement(a))
    .slice(0, 5);

  // Insights derived from actual cast timing, never hardcoded.
  const insights = (() => {
    const dated = rangePosts.filter((post) => !Number.isNaN(getPostDate(post).getTime()));
    if (dated.length < 3) return null;

    const byHour = new Map();
    let weekdayTotal = 0;
    let weekdayCount = 0;
    let weekendTotal = 0;
    let weekendCount = 0;

    dated.forEach((post) => {
      const date = getPostDate(post);
      const engagement = getPostEngagement(post);
      const hour = date.getHours();
      const bucket = byHour.get(hour) || { total: 0, count: 0 };
      bucket.total += engagement;
      bucket.count += 1;
      byHour.set(hour, bucket);

      const day = date.getDay();
      if (day === 0 || day === 6) {
        weekendTotal += engagement;
        weekendCount += 1;
      } else {
        weekdayTotal += engagement;
        weekdayCount += 1;
      }
    });

    let bestHour = null;
    let bestAverage = -1;
    byHour.forEach((bucket, hour) => {
      const average = bucket.total / bucket.count;
      if (average > bestAverage) {
        bestAverage = average;
        bestHour = hour;
      }
    });

    const weekdayAverage = weekdayCount ? weekdayTotal / weekdayCount : 0;
    const weekendAverage = weekendCount ? weekendTotal / weekendCount : 0;
    const weekdayEdge = weekendAverage === 0
      ? null
      : ((weekdayAverage - weekendAverage) / weekendAverage) * 100;

    const formatHour = (hour) => {
      const suffix = hour >= 12 ? 'PM' : 'AM';
      const display = hour % 12 === 0 ? 12 : hour % 12;
      return `${display}:00 ${suffix}`;
    };

    return {
      bestWindow: bestHour === null ? null : `${formatHour(bestHour)} – ${formatHour((bestHour + 2) % 24)}`,
      weekdayEdge,
      avgEngagement: dated.reduce((total, post) => total + getPostEngagement(post), 0) / dated.length
    };
  })();

  const activeAccount = selectedAccount === 'all'
    ? accounts[0]
    : accounts.find((account) => String(account.id) === String(selectedAccount));

  const metricCards = [
    {
      label: 'Followers', value: followers, icon: Users, series: seriesValues('followers'),
      caption: 'Latest snapshot', trend: growthMetrics.today
    },
    {
      label: 'Casts', value: rangePosts.length, icon: MessageCircle, series: seriesValues('casts'),
      caption: 'Tracked in range', trend: null
    },
    {
      label: 'Recasts', value: stats.recasts, icon: Repeat, series: seriesValues('recasts'),
      caption: 'Total reposts', trend: null
    },
    {
      label: 'Likes', value: stats.likes, icon: Heart, series: seriesValues('likes'),
      caption: 'Total reactions', trend: null
    },
    {
      label: 'Replies', value: stats.replies, icon: MessageSquare, series: seriesValues('replies'),
      caption: 'Threads & replies', trend: null
    },
    {
      label: 'Engagement Rate', value: null, display: `${engagementRate.toFixed(1)}%`,
      icon: BarChart2, series: seriesValues('likes'),
      caption: stats.views ? 'Of total views' : 'Of follower base', trend: growthMetrics.engagement
    }
  ];

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#8A63D2] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
            <FarcasterLogo size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Farcaster Engine</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Real-time channel performance metrics and cast analytics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedAccount}
              onChange={(event) => setSelectedAccount(event.target.value)}
              className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-sm cursor-pointer outline-none hover:border-slate-300 transition-colors"
            >
              <option value="all">All Farcaster Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>@{account.account_handle}</option>
              ))}
            </select>
            <FarcasterLogo size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A63D2] pointer-events-none" />
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
            onClick={fetchFarcasterEngineData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#8A63D2]' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map(({ label, value, display, icon: Icon, series, caption, trend }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-purple-50 text-[#8A63D2]">
                {React.createElement(Icon, { size: 12 })}
              </div>
              <span className="text-[12px] font-semibold text-slate-600">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-bold text-slate-900 tracking-tight">
                {display ?? formatCompact(value)}
              </span>
              {trend !== null && trend !== undefined && (
                <span className={`text-[10px] font-bold ${trend < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {label === 'Engagement Rate' ? formatSignedPercent(trend) : formatSignedNumber(trend)}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-400 mt-1">{caption}</p>
            <div className="h-8 w-full mt-3">
              <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                <path
                  d={buildSparklinePath(series)}
                  fill="none"
                  stroke="#8A63D2"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">8-Day Performance Trend</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Aggregated per calendar day</p>
            </div>
            <div className="relative">
              <select
                value={chartMetric}
                onChange={(event) => setChartMetric(event.target.value)}
                className="appearance-none pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="followers">Metric: Followers</option>
                <option value="casts">Metric: Casts</option>
                <option value="likes">Metric: Likes</option>
                <option value="recasts">Metric: Recasts</option>
                <option value="replies">Metric: Replies</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="w-full h-52 flex items-end justify-between gap-2 pt-4 px-2">
            {chartData.map((day) => {
              const heightPercent = Math.max(6, Math.min(100, Math.round((day.value / maxValue) * 100)));
              return (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-black text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.value.toLocaleString()}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full rounded-t-lg transition-all duration-300 bg-[#8A63D2] group-hover:bg-purple-700"
                  />
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
              <GrowthRow label="Followers Today" value={formatSignedNumber(growthMetrics.today)} badge="Today" badgeClass="bg-purple-50 text-[#8A63D2]" />
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
            <p className="text-[11px] font-medium text-slate-400 text-center">
              Metrics sync continuously via Farcaster publishing pipeline
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 mb-5">Profile Overview</h3>
          {activeAccount ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#8A63D2] rounded-full flex items-center justify-center text-white shadow-sm font-bold text-lg uppercase">
                  {activeAccount.account_handle?.charAt(0) || 'F'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[13px] font-bold text-slate-900 leading-tight truncate">
                    @{activeAccount.account_handle}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500">
                    {selectedAccount === 'all' ? `${accounts.length} connected account(s)` : 'Active integration'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <InfoRow label="FID" value={activeAccount.account_id || '—'} />
                <InfoRow label="Following" value={formatCompact(following)} />
                <InfoRow label="Total Casts" value={formatCompact(sumLatest('total_posts') || farcasterPosts.length)} />
                <InfoRow label="Profile Views" value={formatCompact(profileViews)} />
                <InfoRow
                  label="Connected"
                  value={activeAccount.created_at
                    ? new Date(activeAccount.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-xs font-medium text-slate-400">
              No active Farcaster integration found.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Top Performing Casts</h3>
          <p className="text-xs font-medium text-slate-500 mb-5">Ranked by total engagement in range</p>
          {topPosts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium text-xs">No casts in this range.</div>
          ) : (
            <div className="w-full overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 w-8">#</th>
                  <th className="pb-3">Cast</th>
                  <th className="pb-3 text-right">Likes</th>
                  <th className="pb-3 text-right">Recasts</th>
                  <th className="pb-3 text-right">Replies</th>
                  <th className="pb-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topPosts.map((post, index) => {
                  const meta = parseHeading(post.content_text, post.project_slug);
                  const metric = getPostMetric(post);
                  return (
                    <tr key={post.id}>
                      <td className="py-3.5 text-[12px] font-bold text-slate-900">{index + 1}</td>
                      <td className="py-3.5">
                        <span className="text-[12px] font-semibold text-slate-900 truncate block max-w-[220px]">
                          {meta.title}
                        </span>
                      </td>
                      <td className="py-3.5 text-[11px] font-semibold text-slate-900 tabular-nums text-right">
                        {Number(metric.likes || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 text-[11px] font-semibold text-slate-900 tabular-nums text-right">
                        {getRecasts(metric).toLocaleString()}
                      </td>
                      <td className="py-3.5 text-[11px] font-semibold text-slate-900 tabular-nums text-right">
                        {Number(metric.comments || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-[#8A63D2] tabular-nums">
                          {getPostEngagement(post).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-[#8A63D2] mb-5">
            <BarChart2 size={18} />
            <span className="text-[14px] font-bold">Data Insights</span>
          </div>
          {insights ? (
            <div className="space-y-4">
              {insights.bestWindow && (
                <div className="flex gap-3">
                  <Clock size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] font-medium text-slate-600 leading-snug">
                    Highest average engagement for casts published between{' '}
                    <span className="font-bold text-slate-900">{insights.bestWindow}</span>.
                  </p>
                </div>
              )}
              {insights.weekdayEdge !== null && (
                <div className="flex gap-3">
                  <TrendingUp size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] font-medium text-slate-600 leading-snug">
                    Weekday casts perform{' '}
                    <span className="font-bold text-slate-900">{formatSignedPercent(insights.weekdayEdge)}</span>{' '}
                    versus weekend casts.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <BarChart2 size={16} className="text-[#8A63D2] shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium text-slate-600 leading-snug">
                  Average engagement is{' '}
                  <span className="font-bold text-slate-900">{insights.avgEngagement.toFixed(1)}</span>{' '}
                  interactions per cast in this range.
                </p>
              </div>
              <div className="flex gap-3">
                <Eye size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">{formatCompact(stats.views)}</span> total cast views
                  and <span className="font-bold text-slate-900">{formatCompact(profileViews)}</span> profile views recorded.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-xs font-medium text-slate-400">
              Not enough cast history in this range to derive insights.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tracked Farcaster Casts</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">All casts published and tracked on Farcaster</p>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search casts..."
            className="w-full sm:w-64 pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#8A63D2] transition-colors text-slate-700"
          />
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-500 font-bold">
              <Loader2 className="w-5 h-5 animate-spin text-[#8A63D2]" />Loading Farcaster casts...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-medium text-xs">No Farcaster casts found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4 w-[38%]">Cast</th>
                  <th className="py-3 px-4 w-[8%]">Type</th>
                  <th className="py-3 px-4 w-[14%]">Status</th>
                  <th className="py-3 px-4 w-[18%]">Published Date</th>
                  <th className="py-3 px-4 w-[17%]">Likes / Recasts / Replies</th>
                  <th className="py-3 px-4 text-right w-[5%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPosts.map((post) => {
                  const meta = parseHeading(post.content_text, post.project_slug);
                  const isPublished = post.status?.toLowerCase() === 'published';
                  const isFailed = post.status?.toLowerCase() === 'failed';
                  const publishedDate = getPostDate(post);
                  const dateLabel = Number.isNaN(publishedDate.getTime())
                    ? '—'
                    : publishedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const metric = getPostMetric(post);
                  const targetUrl = post.external_url || (post.post_info?.startsWith('http') ? post.post_info : null);

                  return (
                    <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg shrink-0 overflow-hidden bg-purple-50 border border-purple-100 flex items-center justify-center">
                            {post.image_url
                              ? <img src={post.image_url} alt="Cast thumbnail" className="w-full h-full object-cover" />
                              : <FarcasterLogo size={15} className="text-[#8A63D2]" />}
                          </div>
                          <div className="min-w-0 max-w-md">
                            <h4 className="font-bold text-slate-900 truncate text-xs">{meta.title}</h4>
                            <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{meta.sub}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-400">
                          {post.image_url ? <ImageIcon size={14} /> : <FileText size={14} />}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isPublished ? 'text-emerald-600 bg-emerald-50' : isFailed ? 'text-rose-600 bg-rose-50' : 'text-purple-600 bg-purple-50'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-purple-500'}`} />
                          {post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : 'Published'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{dateLabel}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 text-slate-600 font-bold text-[11px]">
                          <span>{Number(metric.likes || 0).toLocaleString()} likes</span>
                          <span>{getRecasts(metric).toLocaleString()} recasts</span>
                          <span>{Number(metric.comments || 0).toLocaleString()} replies</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {targetUrl && (
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Open on Warpcast"
                            className="inline-flex p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#8A63D2] hover:bg-purple-50 transition-colors"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
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
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase">{label}</p>
        <h4 className="text-base font-black text-slate-900 mt-0.5">{value}</h4>
      </div>
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${badgeClass}`}>{badge}</span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] font-medium text-slate-500">{label}</span>
      <span className="text-[13px] font-semibold text-slate-900 text-right truncate max-w-[55%]">{value}</span>
    </div>
  );
}
