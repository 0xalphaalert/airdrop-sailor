import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { CheckCircle2, XCircle, ExternalLink, Loader2, RefreshCw, ClipboardCheck } from 'lucide-react';

export default function PendingReviewsMobile() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('manual_xp_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleApprove = async (submission) => {
    setProcessingId(submission.id);
    try {
      // 1. Update submission status to approved
      const { error: updateError } = await supabase
        .from('manual_xp_submissions')
        .update({ status: 'approved' })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      // 2. Insert into xp_ledger to award XP
      const { error: ledgerError } = await supabase
        .from('xp_ledger')
        .insert({
          auth_id: submission.auth_id,
          amount: submission.expected_xp,
          action_type: submission.task_type,
          reference_id: submission.sponsored_quest_id || submission.task_type,
          status: 'completed'
        });

      if (ledgerError) throw ledgerError;

      // 3. Securely update the user's primary economy metric
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('lifetime_xp')
        .eq('auth_id', submission.auth_id)
        .single();

      if (userProfile) {
        await supabase
          .from('user_profiles')
          .update({
            lifetime_xp: (userProfile.lifetime_xp || 0) + submission.expected_xp
          })
          .eq('auth_id', submission.auth_id);
      }

      // 4. Refresh submissions list
      await fetchSubmissions();
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Failed to approve submission. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('manual_xp_submissions')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      await fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Failed to reject submission. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans pb-safe">
      
      {/* STICKY HEADER & CONTROLS */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Pending Reviews
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manual XP submissions</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status Pill */}
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-200">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Queue</span>
              <span className="text-sm font-black text-slate-900">{submissions.length}</span>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full flex items-center justify-center shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* DATA LIST (CARDS) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
            <span className="text-sm font-bold">Loading submissions...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
            <ClipboardCheck className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
            <h3 className="text-lg font-black text-slate-900">Inbox Zero</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">No pending submissions to review.</p>
          </div>
        ) : (
          submissions.map((submission) => (
            <div key={submission.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
              
              {/* Card Header: Task Type & Reward */}
              <div className="flex justify-between items-start gap-2">
                <span className="inline-flex shrink-0 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase tracking-wider rounded-md">
                  {submission.task_type}
                </span>
                <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  +{submission.expected_xp} XP
                </span>
              </div>
              
              {/* User Info & Date */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">User Auth ID</p>
                <div className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 truncate w-full">
                  {submission.auth_id}
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-2">
                  Submitted: {new Date(submission.created_at).toLocaleString()}
                </p>
              </div>

              {/* Proof URL Button */}
              <a
                href={submission.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-[0.98] shadow-md"
              >
                View User Proof <ExternalLink size={14} />
              </a>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleReject(submission.id)}
                  disabled={processingId === submission.id}
                  className="flex items-center justify-center gap-1.5 py-3 bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {processingId === submission.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(submission)}
                  disabled={processingId === submission.id}
                  className="flex items-center justify-center gap-1.5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {processingId === submission.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Approve
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}