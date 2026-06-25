import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle2, XCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

export default function PendingReviews() {
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
      // Update submission status to approved
      const { error: updateError } = await supabase
        .from('manual_xp_submissions')
        .update({ status: 'approved' })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      // Insert into xp_ledger to award XP
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

      // Update user profile XP
      await supabase
        .from('user_profiles')
        .update({
          xp_balance: supabase.rpc('increment', { amount: submission.expected_xp }),
          lifetime_xp: supabase.rpc('increment', { amount: submission.expected_xp })
        })
        .eq('auth_id', submission.auth_id);

      // Refresh submissions
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

      // Refresh submissions
      await fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Failed to reject submission. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                Pending Reviews
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Review and approve manual XP submissions
              </p>
            </div>
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
              <span className="text-xs font-black text-slate-400 tracking-widest uppercase">Pending</span>
              <span className="ml-2 text-2xl font-black text-slate-900">{submissions.length}</span>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              <span className="ml-3 text-sm font-medium text-slate-500">Loading submissions...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
              <p className="text-sm font-medium text-slate-500">No pending submissions to review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      User Auth ID
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Task Type
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Proof URL
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Expected XP
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Submitted At
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-black text-slate-400 tracking-widest uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-700">
                          {submission.auth_id.slice(0, 8)}...{submission.auth_id.slice(-8)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">
                          {submission.task_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={submission.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="max-w-[200px] truncate">{submission.proof_url}</span>
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">+{submission.expected_xp} XP</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-600">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(submission)}
                            disabled={processingId === submission.id}
                            className="flex items-center gap-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === submission.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(submission.id)}
                            disabled={processingId === submission.id}
                            className="flex items-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === submission.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
