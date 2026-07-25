import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Check, X, ExternalLink, Image as ImageIcon, Link as LinkIcon, Power, PowerOff } from 'lucide-react';

export default function AdminContentManager() {
  const [activeTab, setActiveTab] = useState('quests');
  const [loading, setLoading] = useState(false);

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
          .select(`
            *,
            featured_campaigns ( title, reward_sail ),
            daily_quests ( title, reward_sail )
          `)
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
      // Handle boolean (daily_quests, market) vs text (featured_campaigns)
      let newStatus;
      if (typeof currentStatus === 'boolean') {
        newStatus = !currentStatus;
      } else {
        newStatus = currentStatus === 'active' ? 'draft' : 'active';
      }

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
          await supabase.from('xp_ledger').insert({
            auth_id: submission.auth_id,
            amount: rewardAmount,
            action_type: 'manual_review_approval',
            reference_id: submission.campaign_id || submission.quest_id
          });
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
        title: fd.get('title'),
        description: fd.get('desc') || null,
        task_type: fd.get('type') || null,
        system_action_id: fd.get('sys_id') || null,
        action_link: fd.get('link') || null,
        reward_sail: parseInt(fd.get('reward')) || 50,
        cooldown_hours: parseInt(fd.get('cooldown')) || 0, // 0 = Lifetime
        proof_required_type: fd.get('proof'),
        max_users: parseInt(fd.get('max_users')) || null,
        is_active: true
      };

      const { error } = await supabase.from('daily_quests').insert(payload);
      if (error) throw error;
      
      alert("✅ Daily Quest added successfully!");
      e.target.reset();
      fetchData('quests');
    } catch (err) {
      alert("❌ Error adding quest: " + err.message);
    }
  };

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const payload = {
        brand_name: fd.get('brand'),
        title: fd.get('title'),
        description: fd.get('desc') || null,
        guide_text: fd.get('guide') || null,
        reward_sail: parseInt(fd.get('reward')),
        project_logo_url: fd.get('logo') || null,
        project_url: fd.get('link') || null,
        campaign_type: fd.get('campaign_type') || 'off-chain',
        cost_type: fd.get('cost_type') || 'free',
        button_cta: fd.get('cta') || 'Verify',
        proof_required_type: fd.get('proof') || 'image',
        max_slots: parseInt(fd.get('max_slots')) || null,
        end_date: fd.get('end_date') ? new Date(fd.get('end_date')).toISOString() : null,
        status: 'active'
      };

      const { error } = await supabase.from('featured_campaigns').insert(payload);
      if (error) throw error;

      alert("✅ Featured Campaign added successfully!");
      e.target.reset();
      fetchData('campaigns');
    } catch (err) {
      alert("❌ Error adding campaign: " + err.message);
    }
  };

  const handleAddMarketItem = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const payload = {
        title: fd.get('title'),
        description: fd.get('desc') || null,
        category: fd.get('category'),
        cost_sail: parseInt(fd.get('cost')),
        max_claims: parseInt(fd.get('max_claims')) || null,
        project_logo_url: fd.get('logo_url') || null,
        banner_url: fd.get('banner_url') || null,
        action_link: fd.get('action_link') || null,
        guide_text: fd.get('guide_text') || null,
        is_active: true
      };

      const { error } = await supabase.from('marketplace_items').insert(payload);
      if (error) throw error;

      alert("✅ Marketplace Item added successfully!");
      e.target.reset();
      fetchData('market');
    } catch (err) {
      alert("❌ Error adding market item: " + err.message);
    }
  };

  return (
    <div className="bg-white min-h-full rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-slate-900">
      
      {/* Header & Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 pt-6">
        <h1 className="text-2xl font-black tracking-tight mb-6">Content Manager</h1>
        <div className="flex gap-6 text-sm font-bold overflow-x-auto scrollbar-hide">
          {[
            { id: 'quests', label: 'Daily Quests' },
            { id: 'campaigns', label: 'Featured Campaigns' },
            { id: 'reviews', label: 'Pending Reviews', count: reviews.length },
            { id: 'market', label: 'Marketplace' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {tab.count > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {loading ? <div className="text-slate-400 font-bold animate-pulse">Loading database records...</div> : (
          <>
            {/* --- TAB 1: DAILY QUESTS --- */}
            {activeTab === 'quests' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-1 bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                  <h3 className="font-black mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-blue-600" /> Add Daily Quest</h3>
                  <form onSubmit={handleAddQuest} className="space-y-3 text-sm">
                    <input name="title" placeholder="Quest Title *" required className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-blue-500 outline-none" />
                    <textarea name="desc" placeholder="Description (Optional)" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-blue-500 outline-none h-16" />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <select name="type" className="w-full p-2.5 rounded-lg border border-slate-200 bg-white">
                        <option value="System">System Task</option>
                        <option value="Twitter">Twitter</option>
                        <option value="Telegram">Telegram</option>
                        <option value="Discord">Discord</option>
                        <option value="Webpage">Webpage</option>
                        <option value="CPA_Offer">CPA Offer</option>
                      </select>
                      <input name="sys_id" placeholder="System ID (e.g. daily_checkin)" className="w-full p-2.5 rounded-lg border border-slate-200" />
                    </div>
                    
                    <input name="link" placeholder="Action Link URL (Optional)" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-blue-500 outline-none" />
                    
                    <div className="grid grid-cols-3 gap-3">
                      <input name="reward" type="number" placeholder="SAIL *" required className="w-full p-2.5 rounded-lg border border-slate-200" />
                      <input name="cooldown" type="number" placeholder="Cooldown Hrs *" required defaultValue={24} className="w-full p-2.5 rounded-lg border border-slate-200" title="Set to 0 for lifetime tasks" />
                      <input name="max_users" type="number" placeholder="Max Users" className="w-full p-2.5 rounded-lg border border-slate-200" title="Leave blank for unlimited" />
                    </div>
                    
                    <select name="proof" className="w-full p-2.5 rounded-lg border border-slate-200 bg-white">
                      <option value="none">Instant (No Proof Required)</option>
                      <option value="image">Require Image Upload</option>
                      <option value="url">Require URL Submission</option>
                    </select>

                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 shadow-sm mt-2">Publish Quest</button>
                  </form>
                </div>
                
                <div className="xl:col-span-2 space-y-3">
                  {quests.map(q => (
                    <div key={q.id} className={`flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors ${q.is_active ? 'border-slate-200' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                      <div>
                        <div className="font-bold flex items-center gap-2 text-slate-900">
                          {q.title} 
                          <span className="text-[10px] font-black tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded">+{q.reward_sail} SAIL</span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1">
                          {q.task_type || 'System'} • {q.cooldown_hours === 0 ? 'Lifetime Task' : `${q.cooldown_hours}h Cooldown`} • Proof: {q.proof_required_type}
                        </div>
                      </div>
                      <button onClick={() => toggleStatus('daily_quests', q.id, q.is_active)} className={`p-2 rounded-lg transition-colors ${q.is_active ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`} title={q.is_active ? "Deactivate" : "Activate"}>
                        {q.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                  {quests.length === 0 && <div className="text-sm text-slate-500 text-center py-10">No quests found. Create one!</div>}
                </div>
              </div>
            )}

            {/* --- TAB 2: FEATURED CAMPAIGNS --- */}
            {activeTab === 'campaigns' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-1 bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                  <h3 className="font-black mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-purple-600" /> Add Featured Campaign</h3>
                  <form onSubmit={handleAddCampaign} className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <input name="brand" placeholder="Brand Name *" required className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-purple-500 outline-none" />
                      <input name="logo" placeholder="Logo URL (Opt)" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-purple-500 outline-none" />
                    </div>
                    <input name="title" placeholder="Campaign Title *" required className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-purple-500 outline-none" />
                    
                    <textarea name="desc" placeholder="Short Summary" className="w-full p-2.5 rounded-lg border border-slate-200 h-16 focus:border-purple-500 outline-none" />
                    <textarea name="guide" placeholder="Step-by-Step Guide for Users" className="w-full p-2.5 rounded-lg border border-slate-200 h-24 focus:border-purple-500 outline-none" />
                    
                    <input name="link" placeholder="External Project Link (Optional)" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-purple-500 outline-none" />

                    <div className="grid grid-cols-2 gap-3">
                      <select name="campaign_type" className="w-full p-2.5 rounded-lg border border-slate-200 bg-white">
                        <option value="off-chain">Off-Chain</option>
                        <option value="on-chain">On-Chain</option>
                      </select>
                      <select name="cost_type" className="w-full p-2.5 rounded-lg border border-slate-200 bg-white">
                        <option value="free">Free</option>
                        <option value="gas-fee">Gas Fee</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <input name="reward" type="number" placeholder="SAIL *" required className="w-full p-2.5 rounded-lg border border-slate-200" />
                      <input name="max_slots" type="number" placeholder="Max Slots" className="w-full p-2.5 rounded-lg border border-slate-200" title="Leave blank for unlimited" />
                      <input name="cta" placeholder="CTA (Verify)" defaultValue="Verify" className="w-full p-2.5 rounded-lg border border-slate-200" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <select name="proof" className="w-full p-2.5 rounded-lg border border-slate-200 bg-white">
                        <option value="image">Require Image Upload</option>
                        <option value="url">Require URL Submission</option>
                        <option value="none">No Proof Required</option>
                      </select>
                      <input name="end_date" type="date" className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-500" title="End Date (Optional)" />
                    </div>
                    
                    <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-lg hover:bg-purple-700 shadow-sm mt-2">Publish Campaign</button>
                  </form>
                </div>
                
                <div className="xl:col-span-2 space-y-3">
                  {campaigns.map(c => (
                    <div key={c.id} className={`flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors ${c.status === 'active' ? 'border-slate-200' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                      <div>
                        <div className="font-bold flex items-center gap-2 text-slate-900">
                          {c.title} 
                          <span className="text-[10px] font-black tracking-widest bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{c.brand_name}</span>
                          <span className="text-[10px] font-black tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded">+{c.reward_sail} SAIL</span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1">
                          Type: {c.campaign_type} • Cost: {c.cost_type} • Slots: {c.max_slots ? `${c.participants_count}/${c.max_slots}` : 'Unlimited'} • Proof: {c.proof_required_type}
                        </div>
                      </div>
                      <button onClick={() => toggleStatus('featured_campaigns', c.id, c.status, 'status')} className={`p-2 rounded-lg transition-colors ${c.status === 'active' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`} title={c.status === 'active' ? "Change to Draft" : "Make Active"}>
                        {c.status === 'active' ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                  {campaigns.length === 0 && <div className="text-sm text-slate-500 text-center py-10">No campaigns found.</div>}
                </div>
              </div>
            )}

            {/* --- TAB 3: PENDING REVIEWS --- */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? <div className="text-center py-12 text-slate-400 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">No pending reviews! 🎉</div> : null}
                {reviews.map(sub => {
                  const taskName = sub.featured_campaigns?.title || sub.daily_quests?.title || 'Unknown Task';
                  const reward = sub.featured_campaigns?.reward_sail || sub.daily_quests?.reward_sail || 0;
                  const isImage = sub.proof_data.includes('http') && (sub.proof_data.endsWith('.png') || sub.proof_data.endsWith('.jpg') || sub.proof_data.endsWith('.jpeg') || sub.proof_data.includes('imgbb'));

                  return (
                    <div key={sub.id} className="flex flex-col md:flex-row items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm gap-4 hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest ${sub.campaign_id ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {sub.campaign_id ? 'Campaign' : 'Daily Quest'}
                          </span>
                          <span className="font-bold text-slate-900">{taskName}</span>
                          <span className="text-xs text-emerald-600 font-black tracking-widest">+{reward} SAIL</span>
                        </div>
                        <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">User: {sub.auth_id}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">Submitted: {new Date(sub.submitted_at).toLocaleString()}</div>
                      </div>

                      <div className="flex-1 flex justify-center">
                        <a href={sub.proof_data} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100">
                          {isImage ? <ImageIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                          View User Proof
                        </a>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleReview(sub, false)} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm"><X className="w-4 h-4"/> Reject</button>
                        <button onClick={() => handleReview(sub, true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-500 transition-colors shadow-sm"><Check className="w-4 h-4"/> Approve & Reward</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- TAB 4: MARKETPLACE ITEMS --- */}
            {activeTab === 'market' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-1 bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                  <h3 className="font-black mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-600" /> Add Marketplace Item</h3>
                  <form onSubmit={handleAddMarketItem} className="space-y-3 text-sm">
                    <input name="title" placeholder="Item Name *" required className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none" />
                    <textarea name="desc" placeholder="Description" className="w-full p-2.5 rounded-lg border border-slate-200 h-16 focus:border-emerald-500 outline-none" />
                    
                    <select name="category" className="w-full p-2.5 rounded-lg border border-slate-200 bg-white">
                      <option value="Subscriptions">Subscriptions</option>
                      <option value="Token Airdrops">Token Airdrops (FCFS)</option>
                      <option value="NFT Offers">NFT Offers</option>
                      <option value="Coupons">Coupons & Discounts</option>
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                      <input name="cost" type="number" placeholder="Cost (SAIL) *" required className="w-full p-2.5 rounded-lg border border-slate-200" />
                      <input name="max_claims" type="number" placeholder="Max Supply" className="w-full p-2.5 rounded-lg border border-slate-200" title="Leave blank for unlimited" />
                    </div>

                    <textarea name="guide_text" placeholder="Claiming Instructions / Guide" className="w-full p-2.5 rounded-lg border border-slate-200 h-16 focus:border-emerald-500 outline-none" />
                    
                    <input name="logo_url" placeholder="Project Logo URL (Optional)" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none" />
                    <input name="banner_url" placeholder="Banner Image URL (Optional)" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none" />
                    <input name="action_link" placeholder="External Action Link (Optional)" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none" />
                    
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 shadow-sm mt-2">List to Marketplace</button>
                  </form>
                </div>
                
                <div className="xl:col-span-2 space-y-3">
                  {marketItems.map(m => (
                    <div key={m.id} className={`flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors ${m.is_active ? 'border-slate-200' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                      <div>
                        <div className="font-bold flex items-center gap-2 text-slate-900">
                          {m.title} 
                          <span className="text-[10px] font-black tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">{m.category}</span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1">
                          Price: {m.cost_sail} SAIL • Supply: {m.max_claims ? `${m.total_claimed}/${m.max_claims}` : `${m.total_claimed} Claimed (Unlimited)`}
                        </div>
                      </div>
                      <button onClick={() => toggleStatus('marketplace_items', m.id, m.is_active)} className={`p-2 rounded-lg transition-colors ${m.is_active ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`} title={m.is_active ? "Deactivate" : "Activate"}>
                        {m.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                  {marketItems.length === 0 && <div className="text-sm text-slate-500 text-center py-10">No items in marketplace.</div>}
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}