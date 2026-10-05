import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  RefreshCw,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Wallet,
  ExternalLink,
  Copy,
  X,
  ArrowRight,
  Hash,
  StickyNote
} from 'lucide-react';

export default function SailSwapRequests() {
  const [requests, setRequests] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // ----------------------------------------
  // FETCH REQUESTS
  // ----------------------------------------

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const { data: swapRequests, error } = await supabase
        .from('sail_swap_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(swapRequests || []);

      // ----------------------------------------
      // FETCH USER PROFILES
      // ----------------------------------------

      const authIds = [
        ...new Set((swapRequests || []).map((item) => item.auth_id))
      ];

      if (authIds.length > 0) {
        const { data: userProfiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('auth_id, username')
          .in('auth_id', authIds);

        if (!profileError && userProfiles) {
          const profileMap = {};

          userProfiles.forEach((profile) => {
            profileMap[profile.auth_id] = profile;
          });

          setProfiles(profileMap);
        }
      }

    } catch (error) {
      console.error('Error fetching swap requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const interval = setInterval(fetchRequests, 30000);

    return () => clearInterval(interval);
  }, []);

  // ----------------------------------------
  // OPEN REQUEST MODAL
  // ----------------------------------------

  const openRequest = (request) => {
    setSelectedRequest(request);
    setTxHash(request.payment_tx_hash || '');
    setAdminNotes(request.admin_notes || '');
  };

  const closeModal = () => {
    if (updating) return;

    setSelectedRequest(null);
    setTxHash('');
    setAdminNotes('');
  };

  // ----------------------------------------
  // UPDATE STATUS
  // ----------------------------------------

  const updateRequestStatus = async (status) => {
    if (!selectedRequest) return;

    try {
      setUpdating(true);

      const updateData = {
        status,
        admin_notes: adminNotes || null
      };

      if (status === 'completed') {
        if (!txHash.trim()) {
          alert('Please enter the payment transaction hash.');
          return;
        }

        updateData.payment_tx_hash = txHash.trim();
        updateData.processed_at = new Date().toISOString();
      }

      if (status === 'rejected') {
        updateData.processed_at = new Date().toISOString();
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user && ['completed', 'rejected'].includes(status)) {
        updateData.processed_by = user.id;
      }

      const { error } = await supabase
        .from('sail_swap_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await fetchRequests();

      const updatedRequest = {
        ...selectedRequest,
        ...updateData
      };

      setSelectedRequest(updatedRequest);

      if (status === 'completed' || status === 'rejected') {
        setTimeout(() => {
          closeModal();
        }, 700);
      }

    } catch (error) {
      console.error('Update error:', error);
      alert(error.message || 'Failed to update request.');
    } finally {
      setUpdating(false);
    }
  };

  // ----------------------------------------
  // COPY TEXT
  // ----------------------------------------

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // ----------------------------------------
  // FILTERING
  // ----------------------------------------

  const filteredRequests = requests.filter((request) => {
    const profile = profiles[request.auth_id];

    const searchMatch =
      request.wallet_address?.toLowerCase().includes(search.toLowerCase()) ||
      request.auth_id?.toLowerCase().includes(search.toLowerCase()) ||
      profile?.username?.toLowerCase().includes(search.toLowerCase());

    const statusMatch =
      statusFilter === 'all' || request.status === statusFilter;

    return searchMatch && statusMatch;
  });

  // ----------------------------------------
  // COUNTS
  // ----------------------------------------

  const pendingCount = requests.filter(
    (item) => item.status === 'pending'
  ).length;

  const processingCount = requests.filter(
    (item) => item.status === 'processing'
  ).length;

  const completedCount = requests.filter(
    (item) => item.status === 'completed'
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === 'rejected'
  ).length;

  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Clock,
      classes:
        'bg-amber-50 text-amber-600 border-amber-100'
    },

    processing: {
      label: 'Processing',
      icon: Loader2,
      classes:
        'bg-blue-50 text-blue-600 border-blue-100'
    },

    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      classes:
        'bg-emerald-50 text-emerald-600 border-emerald-100'
    },

    rejected: {
      label: 'Rejected',
      icon: XCircle,
      classes:
        'bg-red-50 text-red-600 border-red-100'
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="mb-8">

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

          <div>
            <div className="flex items-center gap-3 mb-2">

              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-xl">💸</span>
              </div>

              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  SAIL Swap Requests
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Manage USDC withdrawal requests and payment processing.
                </p>
              </div>

            </div>
          </div>

          <button
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

        </div>

      </div>


      {/* ========================================
          STATS
      ======================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <StatCard
          label="Pending"
          value={pendingCount}
          icon="⏳"
          active={statusFilter === 'pending'}
          onClick={() =>
            setStatusFilter(
              statusFilter === 'pending' ? 'all' : 'pending'
            )
          }
        />

        <StatCard
          label="Processing"
          value={processingCount}
          icon="⚡"
          active={statusFilter === 'processing'}
          onClick={() =>
            setStatusFilter(
              statusFilter === 'processing' ? 'all' : 'processing'
            )
          }
        />

        <StatCard
          label="Completed"
          value={completedCount}
          icon="✓"
          active={statusFilter === 'completed'}
          onClick={() =>
            setStatusFilter(
              statusFilter === 'completed' ? 'all' : 'completed'
            )
          }
        />

        <StatCard
          label="Rejected"
          value={rejectedCount}
          icon="✕"
          active={statusFilter === 'rejected'}
          onClick={() =>
            setStatusFilter(
              statusFilter === 'rejected' ? 'all' : 'rejected'
            )
          }
        />

      </div>


      {/* ========================================
          TABLE CONTAINER
      ======================================== */}

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

        {/* TOOLBAR */}

        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

          <div className="relative w-full lg:w-[380px]">

            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search username, wallet or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-400 focus:bg-white transition"
            />

          </div>


          <div className="flex items-center gap-2 overflow-x-auto">

            {[
              ['all', 'All'],
              ['pending', 'Pending'],
              ['processing', 'Processing'],
              ['completed', 'Completed'],
              ['rejected', 'Rejected']
            ].map(([value, label]) => (

              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition ${
                  statusFilter === value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>

            ))}

          </div>

        </div>


        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b border-slate-100 bg-slate-50/70">

                <th className="text-left px-6 py-4 text-[11px] uppercase tracking-wider font-black text-slate-400">
                  User
                </th>

                <th className="text-left px-6 py-4 text-[11px] uppercase tracking-wider font-black text-slate-400">
                  Swap
                </th>

                <th className="text-left px-6 py-4 text-[11px] uppercase tracking-wider font-black text-slate-400">
                  Wallet
                </th>

                <th className="text-left px-6 py-4 text-[11px] uppercase tracking-wider font-black text-slate-400">
                  Tier
                </th>

                <th className="text-left px-6 py-4 text-[11px] uppercase tracking-wider font-black text-slate-400">
                  Status
                </th>

                <th className="text-left px-6 py-4 text-[11px] uppercase tracking-wider font-black text-slate-400">
                  Requested
                </th>

                <th className="text-right px-6 py-4 text-[11px] uppercase tracking-wider font-black text-slate-400">
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>
                  <td colSpan="7" className="py-20 text-center">

                    <Loader2
                      className="mx-auto animate-spin text-blue-500 mb-3"
                      size={28}
                    />

                    <p className="text-sm text-slate-400 font-medium">
                      Loading swap requests...
                    </p>

                  </td>
                </tr>

              ) : filteredRequests.length === 0 ? (

                <tr>
                  <td colSpan="7" className="py-20 text-center">

                    <div className="text-4xl mb-3">🌊</div>

                    <p className="font-bold text-slate-700">
                      No swap requests found
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      Try changing your filters.
                    </p>

                  </td>
                </tr>

              ) : (

                filteredRequests.map((request) => {

                  const profile = profiles[request.auth_id];
                  const config = statusConfig[request.status];
                  const StatusIcon = config.icon;

                  return (

                    <tr
                      key={request.id}
                      className="border-b border-slate-50 hover:bg-slate-50/80 transition"
                    >

                      {/* USER */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 text-sm">
                            {(profile?.username || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <p className="font-bold text-sm text-slate-800">
                              {profile?.username || 'Unknown User'}
                            </p>

                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {request.auth_id.slice(0, 8)}...
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* AMOUNTS */}

                      <td className="px-6 py-5">

                        <p className="font-black text-sm text-slate-800">
                          {Number(request.sail_amount).toLocaleString()} SAIL
                        </p>

                        <p className="text-xs font-bold text-emerald-600 mt-1">
                          ${Number(request.usdc_amount).toFixed(2)} USDC
                        </p>

                      </td>


                      {/* WALLET */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-2">

                          <span className="font-mono text-xs text-slate-500">
                            {request.wallet_address
                              ? `${request.wallet_address.slice(0, 7)}...${request.wallet_address.slice(-5)}`
                              : 'Not provided'}
                          </span>

                          {request.wallet_address && (

                            <button
                              onClick={() =>
                                copyToClipboard(request.wallet_address)
                              }
                              className="text-slate-300 hover:text-blue-500 transition"
                            >
                              <Copy size={13} />
                            </button>

                          )}

                        </div>

                      </td>


                      {/* TIER */}

                      <td className="px-6 py-5">

                        <span className="inline-flex px-3 py-1 rounded-lg bg-violet-50 text-violet-600 text-[10px] font-black">
                          {request.user_tier}
                        </span>

                      </td>


                      {/* STATUS */}

                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black ${config.classes}`}
                        >

                          <StatusIcon size={12} />

                          {config.label}

                        </span>

                      </td>


                      {/* DATE */}

                      <td className="px-6 py-5">

                        <p className="text-xs font-medium text-slate-600">

                          {new Date(
                            request.created_at
                          ).toLocaleDateString()}

                        </p>

                        <p className="text-[10px] text-slate-400 mt-1">

                          {new Date(
                            request.created_at
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}

                        </p>

                      </td>


                      {/* ACTION */}

                      <td className="px-6 py-5 text-right">

                        <button
                          onClick={() => openRequest(request)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition"
                        >
                          Manage
                          <ArrowRight size={13} />
                        </button>

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ========================================
          REQUEST MODAL
      ======================================== */}

      {selectedRequest && (

        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden">

            {/* MODAL HEADER */}

            <div className="px-7 py-6 border-b border-slate-100 flex items-center justify-between">

              <div>

                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-500 mb-1">
                  SAIL Withdrawal
                </p>

                <h2 className="text-xl font-black text-slate-900">
                  Manage Swap Request
                </h2>

              </div>

              <button
                onClick={closeModal}
                disabled={updating}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X size={18} />
              </button>

            </div>


            <div className="p-7 space-y-6 max-h-[75vh] overflow-y-auto">

              {/* AMOUNT SUMMARY */}

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">

                  <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">
                    User Pays
                  </p>

                  <p className="text-2xl font-black text-slate-900 mt-2">
                    {Number(
                      selectedRequest.sail_amount
                    ).toLocaleString()}
                  </p>

                  <p className="text-xs font-bold text-slate-400">
                    SAIL
                  </p>

                </div>

                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">

                  <p className="text-[10px] uppercase tracking-wider font-black text-emerald-500">
                    Send To User
                  </p>

                  <p className="text-2xl font-black text-emerald-700 mt-2">
                    ${Number(
                      selectedRequest.usdc_amount
                    ).toFixed(2)}
                  </p>

                  <p className="text-xs font-bold text-emerald-500">
                    USDC
                  </p>

                </div>

              </div>


              {/* WALLET */}

              <div>

                <label className="flex items-center gap-2 text-xs font-black text-slate-700 mb-2">

                  <Wallet size={14} />

                  Recipient Wallet

                </label>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">

                  <code className="flex-1 text-xs text-slate-600 break-all">
                    {selectedRequest.wallet_address}
                  </code>

                  <button
                    onClick={() =>
                      copyToClipboard(
                        selectedRequest.wallet_address
                      )
                    }
                    className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-500 transition"
                  >
                    <Copy size={16} />
                  </button>

                </div>

              </div>


              {/* STATUS */}

              <div>

                <label className="text-xs font-black text-slate-700 mb-3 block">
                  Request Status
                </label>

                <div className="grid grid-cols-3 gap-3">

                  <button
                    disabled={updating}
                    onClick={() =>
                      updateRequestStatus('pending')
                    }
                    className={`py-3 rounded-xl text-xs font-black border transition ${
                      selectedRequest.status === 'pending'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-amber-50'
                    }`}
                  >
                    Pending
                  </button>

                  <button
                    disabled={updating}
                    onClick={() =>
                      updateRequestStatus('processing')
                    }
                    className={`py-3 rounded-xl text-xs font-black border transition ${
                      selectedRequest.status === 'processing'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-blue-50'
                    }`}
                  >
                    Processing
                  </button>

                  <button
                    disabled={updating}
                    onClick={() =>
                      updateRequestStatus('rejected')
                    }
                    className={`py-3 rounded-xl text-xs font-black border transition ${
                      selectedRequest.status === 'rejected'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-red-50'
                    }`}
                  >
                    Reject
                  </button>

                </div>

              </div>


              {/* TRANSACTION HASH */}

              <div>

                <label className="flex items-center gap-2 text-xs font-black text-slate-700 mb-2">

                  <Hash size={14} />

                  Payment Transaction Hash

                </label>

                <input
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Enter USDC payment transaction hash..."
                  disabled={
                    selectedRequest.status === 'completed'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                />

              </div>


              {/* ADMIN NOTES */}

              <div>

                <label className="flex items-center gap-2 text-xs font-black text-slate-700 mb-2">

                  <StickyNote size={14} />

                  Admin Notes

                </label>

                <textarea
                  value={adminNotes}
                  onChange={(e) =>
                    setAdminNotes(e.target.value)
                  }
                  placeholder="Optional internal notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
                />

              </div>


              {/* REQUEST INFO */}

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">

                <div className="grid grid-cols-2 gap-y-3 text-xs">

                  <div>
                    <p className="text-slate-400">User Tier</p>
                    <p className="font-bold text-slate-700 mt-1">
                      {selectedRequest.user_tier}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Conversion Rate</p>
                    <p className="font-bold text-slate-700 mt-1">
                      1 USDC = {selectedRequest.conversion_rate.toLocaleString()} SAIL
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Request ID</p>
                    <p className="font-mono text-[10px] text-slate-600 mt-1">
                      {selectedRequest.id.slice(0, 16)}...
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Requested</p>
                    <p className="font-bold text-slate-700 mt-1">
                      {new Date(
                        selectedRequest.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                </div>

              </div>

            </div>


            {/* MODAL FOOTER */}

            <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">

              {selectedRequest.status !== 'completed' && (

                <button
                  disabled={updating}
                  onClick={() =>
                    updateRequestStatus('completed')
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black transition disabled:opacity-50"
                >

                  {updating ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}

                  Mark Payment Completed

                </button>

              )}

              <button
                onClick={closeModal}
                disabled={updating}
                className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


// ========================================
// STAT CARD
// ========================================

function StatCard({
  label,
  value,
  icon,
  active,
  onClick
}) {
  return (

    <button
      onClick={onClick}
      className={`text-left p-5 rounded-2xl border transition ${
        active
          ? 'bg-slate-900 border-slate-900 shadow-lg shadow-slate-900/10'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >

      <div className="flex items-center justify-between">

        <span className="text-xl">
          {icon}
        </span>

        <span
          className={`text-2xl font-black ${
            active
              ? 'text-white'
              : 'text-slate-900'
          }`}
        >
          {value}
        </span>

      </div>

      <p
        className={`text-xs font-bold mt-3 ${
          active
            ? 'text-slate-300'
            : 'text-slate-400'
        }`}
      >
        {label} Requests
      </p>

    </button>

  );
}