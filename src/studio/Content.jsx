import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronDown, Plus, MoreVertical, 
  Eye, Copy, Edit2, RefreshCw, MessageCircle, Heart, Loader2, AlertCircle, ExternalLink, X
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase 2 specifically for the Publishing Engine pipeline
const engineUrl = import.meta.env.VITE_SUPABASE_2_URL;
const engineKey = import.meta.env.VITE_SUPABASE_2_ANON_KEY;
const engineClient = createClient(engineUrl, engineKey);

// Custom X (Twitter) Logo
const XLogo = ({ size = 12, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.059z" />
  </svg>
);

// Custom Platform Icons
const PlatformIcon = ({ type }) => {
  const baseClasses = "w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-white shrink-0";
  const normalizedType = type === 'binance_square' ? 'binance' : type;

  switch (normalizedType) {
    case 'x':
      return <div className={`${baseClasses} bg-black`}><XLogo size={10} /></div>;
    case 'telegram':
      return (
        <div className={`${baseClasses} bg-[#229ED9]`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.98 1.26-5.59 3.7-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.44-.88.03-.24.36-.49 1-.76 3.91-1.7 6.52-2.79 7.84-3.33 3.73-1.53 4.51-1.8 5.02-1.81.11 0 .37.03.5.15.11.1.15.24.16.35-.01.07-.01.19-.01.2z"/></svg>
        </div>
      );
    case 'binance':
      return (
        <div className={`${baseClasses} bg-black`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FCD535"><path d="M12 22l-6-6h12l-6 6zm0-20l6 6H6l6-6zm-7 9h2v2H5v-2zm12 0h2v2h-2v-2zm-5 0h2v2h-2v-2z"/></svg>
        </div>
      );
    case 'farcaster':
      return (
        <div className={`${baseClasses} bg-[#8A63D2]`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 6H16.5c-2.48 0-4.5 2.02-4.5 4.5v9h2v-9c0-1.38 1.12-2.5 2.5-2.5h1.74l1.3-3zM5.76 6H7.5c2.48 0 4.5 2.02 4.5 4.5v9h-2v-9C10 9.12 8.88 8 7.5 8H5.76L4.46 3z"/></svg>
        </div>
      );
    default:
      return null;
  }
};

export default function Content() {
  const [activeTab, setActiveTab] = useState('All');
  const [posts, setPosts] = useState([]);
  const [metricsMap, setMetricsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // --- MODAL STATE FOR ADDING X POST ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [newXPost, setNewXPost] = useState({
    url: '',
    caption: '',
    projectSlug: '',
    publishedAt: new Date().toISOString().slice(0, 16) // Format YYYY-MM-DDTHH:mm
  });

  // --- FETCH REAL POSTS FROM SUPABASE 2 ---
  const fetchSocialPosts = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Posts
      const { data: postsData, error: postsError } = await engineClient
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // 2. Fetch Latest Metrics
      const { data: metricsData } = await engineClient
        .from('post_metrics')
        .select('*');

      const metricsHash = {};
      if (metricsData) {
        metricsData.forEach(m => {
          metricsHash[`${m.post_id}_${m.platform}`] = m;
        });
      }

      setPosts(postsData || []);
      setMetricsMap(metricsHash);
    } catch (err) {
      console.error("Error fetching social posts:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialPosts();
  }, []);

  // --- SUBMIT HANDLER FOR SAVING NEW PUBLISHED X POST ---
  const handleSaveXPost = async (e) => {
    e.preventDefault();
    if (!newXPost.url.trim()) {
      alert("Please enter a valid X post URL.");
      return;
    }

    // Extract Tweet ID using Regex
    const tweetIdMatch = newXPost.url.match(/status\/(\d+)/);
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;

    if (!tweetId) {
      alert("Invalid X URL format. Ensure it contains '/status/123456...'");
      return;
    }

    setIsSavingPost(true);

    try {
      const payload = {
        platform: 'x',
        content_text: newXPost.caption.trim() || 'X Post Update',
        published_at: new Date(newXPost.publishedAt).toISOString(),
        scheduled_time: new Date(newXPost.publishedAt).toISOString(),
        status: 'published',
        external_id: tweetId,
        external_url: newXPost.url.trim(),
        post_info: tweetId,
        tracking_active: true,
        project_slug: newXPost.projectSlug.trim().toLowerCase() || null
      };

      const { error } = await engineClient
        .from('social_posts')
        .insert([payload]);

      if (error) throw error;

      alert("Successfully saved X post to Supabase 2!");
      setIsAddModalOpen(false);
      
      // Reset form
      setNewXPost({
        url: '',
        caption: '',
        projectSlug: '',
        publishedAt: new Date().toISOString().slice(0, 16)
      });

      // Refresh list
      fetchSocialPosts();

    } catch (err) {
      console.error("Error saving X post:", err.message);
      alert("Failed to save post: " + err.message);
    } finally {
      setIsSavingPost(false);
    }
  };

  // --- HELPER: PARSE TITLE, SUBTITLE & TYPE FROM CONTENT TEXT ---
  const parseContentMeta = (text, slug, platform) => {
    if (!text || text.trim() === '') {
      return {
        title: slug ? `${slug.toUpperCase()} Media Update` : 'Media Post',
        sub: `${platform?.replace('_', ' ').toUpperCase() || 'SOCIAL'} Post`,
        type: 'Project',
        typeColor: 'bg-purple-50 text-purple-600'
      };
    }

    // Clean Markdown tags
    const cleanedLines = text
      .split('\n')
      .map(line => line.replace(/[*#_~`]/g, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('━━━') && !line.startsWith('---'));

    const title = cleanedLines[0] || 'Social Media Update';
    const sub = cleanedLines[1] || (slug ? `Project: ${slug}` : 'Community Update');

    // Infer content category type
    const lowerText = text.toLowerCase();
    let type = 'Project';
    let typeColor = 'bg-purple-50 text-purple-600';

    if (lowerText.includes('funding') || lowerText.includes('raised') || lowerText.includes('fundraising') || lowerText.includes('alpha')) {
      type = 'Funding';
      typeColor = 'bg-blue-50 text-blue-600';
    } else if (lowerText.includes('task') || lowerText.includes('guide') || lowerText.includes('airdrop alert') || lowerText.includes('step')) {
      type = 'Task';
      typeColor = 'bg-orange-50 text-orange-600';
    } else if (lowerText.includes('tokenomics') || lowerText.includes('supply') || lowerText.includes('ticker')) {
      type = 'Tokenomics';
      typeColor = 'bg-teal-50 text-teal-600';
    } else if (lowerText.includes('discord')) {
      type = 'Discord';
      typeColor = 'bg-indigo-50 text-indigo-600';
    }

    return { title, sub, type, typeColor };
  };

  // --- HELPER: DATE FORMATTING ---
  const formatDate = (dateString) => {
    if (!dateString) return { date: '—', time: '—' };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { date: '—', time: '—' };

    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date, time };
  };

  // --- DYNAMIC TAB COUNTS ---
  const counts = {
    All: posts.length,
    Draft: posts.filter(p => p.status?.toLowerCase() === 'draft').length,
    Scheduled: posts.filter(p => p.status?.toLowerCase() === 'scheduled').length,
    Published: posts.filter(p => p.status?.toLowerCase() === 'published').length,
    Failed: posts.filter(p => p.status?.toLowerCase() === 'failed').length,
  };

  const tabs = [
    { name: 'All', count: counts.All },
    { name: 'Draft', count: counts.Draft },
    { name: 'Scheduled', count: counts.Scheduled },
    { name: 'Published', count: counts.Published },
    { name: 'Failed', count: counts.Failed },
  ];

  // --- FILTERING & PAGINATION ---
  const filteredPosts = posts.filter(post => {
    // Tab Filter
    if (activeTab !== 'All' && post.status?.toLowerCase() !== activeTab.toLowerCase()) {
      return false;
    }
    // Platform Filter
    if (selectedPlatformFilter !== 'All' && post.platform !== selectedPlatformFilter) {
      return false;
    }
    // Search Term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchText = post.content_text?.toLowerCase().includes(term);
      const matchSlug = post.project_slug?.toLowerCase().includes(term);
      const matchPlatform = post.platform?.toLowerCase().includes(term);
      return matchText || matchSlug || matchPlatform;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredPosts.length / pageSize) || 1;
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="flex-1 bg-white min-h-screen font-sans">
      
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Content</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage and track all scheduled and published posts across engines</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search content..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 text-slate-700"
            />
          </div>
          
          {/* Platform Dropdown Filter */}
          <div className="relative">
            <select
              value={selectedPlatformFilter}
              onChange={(e) => { setSelectedPlatformFilter(e.target.value); setCurrentPage(1); }}
              className="appearance-none flex items-center gap-2 pl-4 pr-9 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer outline-none"
            >
              <option value="All">All Platforms</option>
              <option value="telegram">Telegram</option>
              <option value="binance_square">Binance Square</option>
              <option value="farcaster">Farcaster</option>
              <option value="x">X (Twitter)</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* New Content Button -> Opens Modal */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} /> New Content
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* 2. TABS */}
        <div className="flex gap-2 border-b border-slate-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => { setActiveTab(tab.name); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold relative transition-colors ${
                activeTab === tab.name 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.name}
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === tab.name ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 3. CONTENT TABLE */}
        <div className="w-full overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-500 font-bold">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              Loading real social posts...
            </div>
          ) : paginatedPosts.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-medium">
              No posts found for this tab/filter.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 pl-4 pr-2 w-10">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 w-[35%]">Content</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 w-[10%]">Platform</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 w-[10%]">Type</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 w-[12%]">Status</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 w-[15%]">Scheduled / Published</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 w-[12%]">Metrics</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 text-right w-[6%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPosts.map((post) => {
                  const meta = parseContentMeta(post.content_text, post.project_slug, post.platform);
                  const isPublished = post.status?.toLowerCase() === 'published';
                  const isFailed = post.status?.toLowerCase() === 'failed';
                  const isScheduled = post.status?.toLowerCase() === 'scheduled';
                  
                  const targetDate = isPublished ? post.published_at : post.scheduled_time;
                  const { date, time } = formatDate(targetDate || post.created_at);

                  // Extract metrics if available
                  const metric = metricsMap[`${post.id}_${post.platform}`] || {};
                  const views = metric.views ? (metric.views > 999 ? `${(metric.views/1000).toFixed(1)}K` : metric.views) : '—';
                  const likes = metric.likes ? metric.likes : '—';
                  const comments = metric.comments ? metric.comments : '—';

                  const postTargetUrl = post.post_info?.startsWith('http') 
                    ? post.post_info 
                    : post.external_url || post.image_url;

                  return (
                    <tr key={post.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 pl-4 pr-2">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      
                      {/* Content Cell */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-10 rounded-lg shrink-0 overflow-hidden shadow-sm border border-slate-200 bg-slate-100 flex items-center justify-center">
                            {post.image_url ? (
                              <img src={post.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">Text</div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-md">
                            <h4 className="text-[13px] font-bold text-slate-900 truncate">{meta.title}</h4>
                            <p className="text-[12px] font-medium text-slate-500 truncate mt-0.5">
                              {isFailed && post.error_log ? (
                                <span className="text-rose-600 flex items-center gap-1 font-semibold">
                                  <AlertCircle size={12} /> {post.error_log}
                                </span>
                              ) : (
                                meta.sub
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Platform Icon */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <PlatformIcon type={post.platform} />
                          <span className="text-xs font-semibold text-slate-700 capitalize">
                            {post.platform === 'binance_square' ? 'Binance' : post.platform}
                          </span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold ${meta.typeColor}`}>
                          {meta.type}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          isPublished ? 'text-emerald-600 bg-emerald-50' :
                          isScheduled ? 'text-purple-600 bg-purple-50' :
                          isFailed ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isPublished ? 'bg-emerald-500' :
                            isScheduled ? 'bg-purple-500' :
                            isFailed ? 'bg-rose-500' : 'bg-amber-500'
                          }`}></div>
                          {post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : 'Draft'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-4">
                        {date === '—' ? (
                          <span className="text-[13px] font-medium text-slate-400">—</span>
                        ) : (
                          <div>
                            <p className="text-[13px] font-medium text-slate-700">{date}</p>
                            <p className="text-[12px] font-medium text-slate-500 mt-0.5">{time}</p>
                          </div>
                        )}
                      </td>

                      {/* Metrics */}
                      <td className="py-4 px-4">
                        {views === '—' && likes === '—' ? (
                          <span className="text-[13px] font-medium text-slate-400">—</span>
                        ) : (
                          <div className="flex items-center gap-3 text-[12px] font-medium text-slate-600">
                            <div className="flex items-center gap-1"><Eye size={13} className="text-slate-400"/> {views}</div>
                            <div className="flex items-center gap-1"><Heart size={13} className="text-slate-400"/> {likes}</div>
                            <div className="flex items-center gap-1"><MessageCircle size={13} className="text-slate-400"/> {comments}</div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                          {postTargetUrl && (
                            <a 
                              href={postTargetUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              title="Open Post"
                              className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button 
                            onClick={() => copyToClipboard(post.content_text)}
                            title="Copy Caption"
                            className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 4. PAGINATION */}
        {!isLoading && filteredPosts.length > 0 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-4">
            <p className="text-sm font-medium text-slate-500">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredPosts.length)} to {Math.min(currentPage * pageSize, filteredPosts.length)} of {filteredPosts.length} results
            </p>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronDown size={16} className="rotate-90" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded border font-semibold text-sm transition-colors ${
                    currentPage === p 
                      ? 'border-blue-600 bg-blue-50 text-blue-600' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL: ADD PUBLISHED X POST --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white">
                  <XLogo size={12} />
                </div>
                <h3 className="text-base font-black text-slate-900">Track Published X Post</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveXPost} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  X Post URL <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="url"
                  required
                  placeholder="https://x.com/AirdropSailor/status/18234567890"
                  value={newXPost.url}
                  onChange={(e) => setNewXPost({ ...newXPost, url: e.target.value })}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  Tweet ID will be extracted automatically to start metric tracking.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Post Caption / Heading <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea 
                  rows={3}
                  placeholder="Enter tweet text or headline for display in the table..."
                  value={newXPost.caption}
                  onChange={(e) => setNewXPost({ ...newXPost, caption: e.target.value })}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Project Slug <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. kiedex, beezie"
                    value={newXPost.projectSlug}
                    onChange={(e) => setNewXPost({ ...newXPost, projectSlug: e.target.value })}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Published Time
                  </label>
                  <input 
                    type="datetime-local"
                    value={newXPost.publishedAt}
                    onChange={(e) => setNewXPost({ ...newXPost, publishedAt: e.target.value })}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <a 
                  href="/creator-studio" 
                  className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  Need Creator Studio?
                </a>

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingPost}
                    className="flex items-center gap-2 px-5 py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    {isSavingPost ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {isSavingPost ? 'Saving...' : 'Save & Track Post'}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}