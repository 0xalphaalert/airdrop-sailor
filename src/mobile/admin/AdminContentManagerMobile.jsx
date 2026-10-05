import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Check, X, ExternalLink, Image as ImageIcon, Link as LinkIcon, Power, PowerOff, FileText } from 'lucide-react';

export default function AdminContentManagerMobile() {
  const [activeTab, setActiveTab] = useState('quests');
  const [loading, setLoading] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Data States
  const [quests, setQuests] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [marketItems, setMarketItems] = useState([]);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'quests') {
        const { data } = await supabase.from('daily_quests').select('*').order('created_at', { ascending: false });
        if (data) setQuests(data);
      } else if (tab === 'campaigns') {
        const { data } = await supabase.from('featured_campaigns').select('*').order('created_at', { ascending: false });
        if (data) setCampaigns(data);
      } else if (tab === 'reviews') {
        const { data } = await supabase
          .from('campaign_submissions')
          .select(`*, featured_campaigns ( title, reward_sail ), daily_quests ( title, reward_sail )`)
          .eq('status', 'pending')
          .order('submitted_at', { ascending: false });
        if (data) setReviews(data);
      } else if (tab === 'market') {
        const { data } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false });
        if (data) setMarketItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- TOGGLE VISIBILITY HANDLERS ---
  const toggleStatus = async (table, id, currentStatus, statusColumn = 'is_active') => {
    try {
      let newStatus = typeof currentStatus === 'boolean' ? !currentStatus : (currentStatus === 'active' ? 'draft' : 'active');
      const { error } = await supabase.from(table).update({ [statusColumn]: newStatus }).eq('id', id);
      if (error) throw error;
      fetchData(activeTab); 
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  // --- MANUAL REVIEW HANDLERS ---
  const handleReview = async (submission, isApproved) => {
    try {
      const { error: updateError } = await supabase.from('campaign_submissions')
        .update({ status: isApproved ? 'approved' : 'rejected' })
        .eq('id', submission.id);
      
      if (updateError) throw updateError;

      if (isApproved) {
        const rewardAmount = submission.featured_campaigns?.reward_sail || submission.daily_quests?.reward_sail || 0;
        if (rewardAmount > 0) {
          await supabase.from('xp_ledger').insert({ auth_id: submission.auth_id, amount: rewardAmount, action_type: 'manual_review_approval', reference_id: submission.campaign_id || submission.quest_id });
          await supabase.rpc('increment_sail_balance', { p_auth_id: submission.auth_id, p_amount: rewardAmount });
        }
      }
      alert(`Submission ${isApproved ? 'Approved & Rewarded' : 'Rejected'}!`);
      fetchData('reviews');
    } catch (err) {
      alert("Error processing review: " + err.message);
    }
  };

  // --- FORM SUBMISSION HANDLERS ---
  const handleAddQuest = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const payload = {
        title: fd.get('title'), description: fd.get('desc') || null, task_type: fd.get('type') || null,
        system_action_id: fd.get('sys_id') || null, action_link: fd.get('link') || null,
        reward_sail: parseInt(fd.get('reward')) || 50, cooldown_hours: parseInt(fd.get('cooldown')) || 0,
        proof_required_type: fd.get('proof'), max_users: parseInt(fd.get('max_users')) || null, is_active: true
      };
      const { error } = await supabase.from('daily_quests').insert(payload);
      if (error) throw error;
      
      alert("✅ Daily Quest added successfully!");
      e.target.reset(); setIsFormModalOpen(false); fetchData('quests');
    } catch (err) { alert("❌ Error adding quest: " + err.message); }
  };

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const payload = {
        brand_name: fd.get('brand'), title: fd.get('title'), description: fd.get('desc') || null,
        guide_text: fd.get('guide') || null, reward_sail: parseInt(fd.get('reward')),
        project_logo_url: fd.get('logo') || null, project_url: fd.get('link') || null,
        campaign_type: fd.get('campaign_type') || 'off-chain', cost_type: fd.get('cost_type') || 'free',
        button_cta: fd.get('cta') || 'Verify', proof_required_type: fd.get('proof') || 'image',
        max_slots: parseInt(fd.get('max_slots')) || null, end_date: fd.get('end_date') ? new Date(fd.get('end_date')).toISOString() : null,
        status: 'active'
      };
      const { error } = await supabase.from('featured_campaigns').insert(payload);
      if (error) throw error;

      alert("✅ Featured Campaign added successfully!");
      e.target.reset(); setIsFormModalOpen(false); fetchData('campaigns');
    } catch (err) { alert("❌ Error adding campaign: " + err.message); }
  };

  const handleAddMarketItem = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const payload = {
        title: fd.get('title'), description: fd.get('desc') || null, category: fd.get('category'),
        cost_sail: parseInt(fd.get('cost')), max_claims: parseInt(fd.get('max_claims')) || null,
        project_logo_url: fd.get('logo_url') || null, banner_url: fd.get('banner_url') || null,
        action_link: fd.get('action_link') || null, guide_text: fd.get('guide_text') || null, is_active: true
      };
      const { error } = await supabase.from('marketplace_items').insert(payload);
      if (error) throw error;

      alert("✅ Marketplace Item added successfully!");
      e.target.reset(); setIsFormModalOpen(false); fetchData('market');
    } catch (err) { alert("❌ Error adding market item: " + err.message); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans pb-safe relative">
      
      {/* HEADER & TABS (STICKY) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Content Manager</h1>
            <p className="text-xs text-slate-500 font-medium">Manage quests & reviews</p>
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'quests', label: 'Quests' },
            { id: 'campaigns', label: 'Campaigns' },
            { id: 'reviews', label: 'Reviews', count: reviews.length },
            { id: 'market', label: 'Market' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ml-1 ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'}`}>{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* DATA LIST (CARDS) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 pb-24">
        
        {/* 🚀 THE FIX: Massive, unmissable "Add New" button at the top of the list */}
        {activeTab !== 'reviews' && !loading && (
          <button 
            onClick={() => setIsFormModalOpen(true)}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-md mb-2 transition-transform active:scale-[0.98] ${
              activeTab === 'quests' ? 'bg-blue-600 shadow-blue-600/20' : 
              activeTab === 'campaigns' ? 'bg-purple-600 shadow-purple-600/20' : 
              'bg-emerald-600 shadow-emerald-600/20'
            }`}
          >
            <Plus size={18} /> 
            Add New {activeTab === 'quests' ? 'Quest' : activeTab === 'campaigns' ? 'Campaign' : 'Market Item'}
          </button>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <FileText className="w-8 h-8 animate-pulse mb-2" />
            <span className="text-sm font-bold">Loading records...</span>
          </div>
        ) : (
          <>
            {/* --- DAILY QUESTS --- */}
            {activeTab === 'quests' && quests.map(q => (
              <div key={q.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-3 transition-colors ${q.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm leading-tight">{q.title}</h3>
                    <div className="text-[10px] font-medium text-slate-500 mt-1">
                      {q.task_type || 'System'} • {q.cooldown_hours === 0 ? 'Lifetime' : `${q.cooldown_hours}h CD`} • {q.proof_required_type}
                    </div>
                  </div>
                  <span className="text-[10px] font-black tracking-widest bg-blue-100 text-blue-700 px-2 py-1 rounded shrink-0">+{q.reward_sail} SAIL</span>
                </div>
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button onClick={() => toggleStatus('daily_quests', q.id, q.is_active)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${q.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {q.is_active ? <Power size={14}/> : <PowerOff size={14}/>} {q.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}

            {/* --- FEATURED CAMPAIGNS --- */}
            {activeTab === 'campaigns' && campaigns.map(c => (
              <div key={c.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-3 transition-colors ${c.status === 'active' ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-purple-600 uppercase mb-1 block">{c.brand_name}</span>
                    <h3 className="font-black text-slate-900 text-sm leading-tight">{c.title}</h3>
                    <div className="text-[10px] font-medium text-slate-500 mt-1">
                      {c.campaign_type} • {c.cost_type} • {c.max_slots ? `${c.participants_count}/${c.max_slots}` : 'No Limit'}
                    </div>
                  </div>
                  <span className="text-[10px] font-black tracking-widest bg-blue-100 text-blue-700 px-2 py-1 rounded shrink-0">+{c.reward_sail} SAIL</span>
                </div>
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button onClick={() => toggleStatus('featured_campaigns', c.id, c.status, 'status')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${c.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {c.status === 'active' ? <Power size={14}/> : <PowerOff size={14}/>} {c.status === 'active' ? 'Active' : 'Draft'}
                  </button>
                </div>
              </div>
            ))}

            {/* --- PENDING REVIEWS --- */}
            {activeTab === 'reviews' && (
              reviews.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">No pending reviews! 🎉</div>
              ) : (
                reviews.map(sub => {
                  const taskName = sub.featured_campaigns?.title || sub.daily_quests?.title || 'Unknown Task';
                  const reward = sub.featured_campaigns?.reward_sail || sub.daily_quests?.reward_sail || 0;
                  const isImage = sub.proof_data.includes('http') && (sub.proof_data.endsWith('.png') || sub.proof_data.endsWith('.jpg') || sub.proof_data.endsWith('.jpeg') || sub.proof_data.includes('imgbb'));

                  return (
                    <div key={sub.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest ${sub.campaign_id ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {sub.campaign_id ? 'Campaign' : 'Daily Quest'}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-black tracking-widest">+{reward} SAIL</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">{taskName}</h3>
                        <div className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 mt-1 inline-block truncate max-w-full">
                          {sub.auth_id}
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</p>
                      </div>

                      <a href={sub.proof_data} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-3 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 my-1">
                        {isImage ? <ImageIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />} View User Proof
                      </a>

                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button onClick={() => handleReview(sub, false)} className="flex-1 flex justify-center items-center gap-1.5 py-3 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-colors"><X className="w-4 h-4"/> Reject</button>
                        <button onClick={() => handleReview(sub, true)} className="flex-1 flex justify-center items-center gap-1.5 py-3 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm shadow-emerald-500/20 transition-colors"><Check className="w-4 h-4"/> Approve</button>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* --- MARKETPLACE ITEMS --- */}
            {activeTab === 'market' && marketItems.map(m => (
              <div key={m.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-3 transition-colors ${m.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-emerald-600 uppercase mb-1 block">{m.category}</span>
                    <h3 className="font-black text-slate-900 text-sm leading-tight">{m.title}</h3>
                    <div className="text-[10px] font-medium text-slate-500 mt-1">
                      Supply: {m.max_claims ? `${m.total_claimed}/${m.max_claims}` : `${m.total_claimed} Claimed (Unlimited)`}
                    </div>
                  </div>
                  <span className="text-[10px] font-black tracking-widest bg-emerald-100 text-emerald-700 px-2 py-1 rounded shrink-0">{m.cost_sail} SAIL</span>
                </div>
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button onClick={() => toggleStatus('marketplace_items', m.id, m.is_active)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${m.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {m.is_active ? <Power size={14}/> : <PowerOff size={14}/>} {m.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* FULL SCREEN FORM MODAL */}
      {isFormModalOpen && activeTab !== 'reviews' && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-200">
          
          <div className="px-4 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
            <div>
              <h2 className="text-lg font-black text-slate-900">Add New Record</h2>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">
                {activeTab === 'quests' ? 'Daily Quest' : activeTab === 'campaigns' ? 'Featured Campaign' : 'Marketplace Item'}
              </p>
            </div>
            <button onClick={() => setIsFormModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-24">
            
            {activeTab === 'quests' && (
              <form id="mobile-add-form" onSubmit={handleAddQuest} className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Quest Title *</label>
                    <input name="title" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter title" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Description</label>
                    <textarea name="desc" rows="2" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" placeholder="Optional" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Task Type</label>
                      <select name="type" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                        <option value="System">System</option><option value="Twitter">Twitter</option><option value="Telegram">Telegram</option><option value="Discord">Discord</option><option value="Webpage">Webpage</option><option value="CPA_Offer">CPA Offer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">System ID</label>
                      <input name="sys_id" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="e.g. daily_checkin" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Action URL</label>
                    <input name="link" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reward (SAIL) *</label>
                      <input name="reward" type="number" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="50" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cooldown Hrs *</label>
                      <input name="cooldown" type="number" required defaultValue={24} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="0 = Lifetime" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Users</label>
                    <input name="max_users" type="number" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Leave blank for infinite" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Proof Required</label>
                    <select name="proof" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                      <option value="none">None (Instant)</option><option value="image">Image Upload</option><option value="url">URL Submission</option>
                    </select>
                  </div>
                </div>
              </form>
            )}

            {activeTab === 'campaigns' && (
              <form id="mobile-add-form" onSubmit={handleAddCampaign} className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Brand *</label>
                      <input name="brand" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reward (SAIL) *</label>
                      <input name="reward" type="number" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Campaign Title *</label>
                    <input name="title" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Description</label>
                    <textarea name="desc" rows="2" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Guide</label>
                    <textarea name="guide" rows="3" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Project Link</label>
                    <input name="link" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Type</label>
                      <select name="campaign_type" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                        <option value="off-chain">Off-Chain</option><option value="on-chain">On-Chain</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cost Type</label>
                      <select name="cost_type" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                        <option value="free">Free</option><option value="gas-fee">Gas Fee</option><option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Slots</label>
                      <input name="max_slots" type="number" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Infinite" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Button CTA</label>
                      <input name="cta" defaultValue="Verify" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Proof Required</label>
                    <select name="proof" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                      <option value="image">Image Upload</option><option value="url">URL</option><option value="none">None</option>
                    </select>
                  </div>
                </div>
              </form>
            )}

            {activeTab === 'market' && (
              <form id="mobile-add-form" onSubmit={handleAddMarketItem} className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Item Name *</label>
                    <input name="title" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Category</label>
                    <select name="category" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                      <option value="Subscriptions">Subscriptions</option><option value="Token Airdrops">Token Airdrops (FCFS)</option><option value="NFT Offers">NFT Offers</option><option value="Coupons">Coupons</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cost (SAIL) *</label>
                      <input name="cost" type="number" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Supply</label>
                      <input name="max_claims" type="number" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Infinite" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Description</label>
                    <textarea name="desc" rows="2" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Instructions / Guide</label>
                    <textarea name="guide_text" rows="2" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Action Link</label>
                    <input name="action_link" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="https://..." />
                  </div>
                </div>
              </form>
            )}

          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 pb-safe">
            <button type="submit" form="mobile-add-form" className={`flex-1 py-4 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg ${
              activeTab === 'quests' ? 'bg-blue-600 shadow-blue-500/30' : 
              activeTab === 'campaigns' ? 'bg-purple-600 shadow-purple-500/30' : 
              'bg-emerald-600 shadow-emerald-500/30'
            }`}>
              Deploy to Server
            </button>
          </div>
        </div>
      )}
    </div>
  );
}