import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  Clock3,
  CheckCircle2,
  XCircle,
  Loader2,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  Search,
  RefreshCw,
  ChevronRight,
  X,
  User,
  Hash,
  FileText,
  DollarSign,
  Coins,
  Calendar,
  AlertCircle
} from "lucide-react";

import { supabase } from "../../supabaseClient";


const SailSwapRequestsMobile = () => {

  // =====================================================
  // STATES
  // =====================================================

  const [requests, setRequests] = useState([]);
const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeFilter, setActiveFilter] = useState("pending");

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);

  const [paymentTxHash, setPaymentTxHash] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [updating, setUpdating] = useState(false);

  const [copied, setCopied] = useState("");


  // =====================================================
  // FETCH REQUESTS
  // =====================================================

  const fetchRequests = async () => {

  try {

    setLoading(true);

    // =============================================
    // 1. FETCH ALL SWAP REQUESTS
    // =============================================

    const {
      data: swapRequests,
      error
    } = await supabase
      .from("sail_swap_requests")
      .select("*")
      .order("created_at", {
        ascending: false
      });


    if (error) {
      throw error;
    }


    setRequests(swapRequests || []);


    // =============================================
    // 2. GET UNIQUE USER IDS
    // =============================================

    const authIds = [
      ...new Set(
        (swapRequests || [])
          .map(item => item.auth_id)
          .filter(Boolean)
      )
    ];


    // =============================================
    // 3. FETCH USER PROFILES
    // =============================================

    if (authIds.length > 0) {

      const {
        data: userProfiles,
        error: profileError
      } = await supabase
        .from("user_profiles")
        .select("auth_id, username")
        .in("auth_id", authIds);


      if (profileError) {

        console.error(
          "Failed to fetch user profiles:",
          profileError
        );

      } else if (userProfiles) {

        const profileMap = {};


        userProfiles.forEach(profile => {

          profileMap[profile.auth_id] = profile;

        });


        setProfiles(profileMap);

      }

    } else {

      setProfiles({});

    }


  } catch (error) {

    console.error(
      "Error fetching swap requests:",
      error
    );

  } finally {

    setLoading(false);

  }

};


  useEffect(() => {

    fetchRequests();

  }, []);


  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {

    setRefreshing(true);

    await fetchRequests();

    setTimeout(() => {
      setRefreshing(false);
    }, 500);

  };


  // =====================================================
  // COUNTS
  // =====================================================

  const counts = useMemo(() => {

    return {

      all: requests.length,

      pending: requests.filter(
        item => item.status === "pending"
      ).length,

      processing: requests.filter(
        item => item.status === "processing"
      ).length,

      completed: requests.filter(
        item => item.status === "completed"
      ).length,

      rejected: requests.filter(
        item => item.status === "rejected"
      ).length

    };

  }, [requests]);


  // =====================================================
  // FILTER REQUESTS
  // =====================================================

  const filteredRequests = useMemo(() => {

    let result = [...requests];


    if (activeFilter !== "all") {

      result = result.filter(
        item => item.status === activeFilter
      );

    }


    if (searchQuery.trim()) {

      const query = searchQuery.toLowerCase();

      result = result.filter(item => {

        const username =
  profiles[item.auth_id]?.username ||
  "";

        const wallet =
          item.wallet_address ||
          "";

        const authId =
          item.auth_id ||
          "";

        return (
          username.toLowerCase().includes(query) ||
          wallet.toLowerCase().includes(query) ||
          authId.toLowerCase().includes(query)
        );

      });

    }


    return result;

 }, [
  requests,
  profiles,
  activeFilter,
  searchQuery
]);


  // =====================================================
  // COPY TEXT
  // =====================================================

  const copyText = async (
    text,
    id
  ) => {

    if (!text) return;

    try {

      await navigator.clipboard.writeText(text);

      setCopied(id);

      setTimeout(() => {
        setCopied("");
      }, 1500);

    } catch (error) {

      console.error("Copy failed:", error);

    }

  };


  // =====================================================
  // OPEN REQUEST
  // =====================================================

  const openRequest = (
    request
  ) => {

    setSelectedRequest(request);

    setPaymentTxHash(
      request.payment_tx_hash || ""
    );

    setAdminNotes(
      request.admin_notes || ""
    );

  };


  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const updateRequest = async (
    newStatus
  ) => {

    if (!selectedRequest) return;

    try {

      setUpdating(true);


      const updateData = {

        status: newStatus,

        payment_tx_hash:
          paymentTxHash.trim() || null,

        admin_notes:
          adminNotes.trim() || null

      };


      if (
        newStatus === "completed" ||
        newStatus === "rejected"
      ) {

        updateData.processed_at =
          new Date().toISOString();

      }


      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();


      if (user) {

        updateData.processed_by =
          user.id;

      }


      const { error } = await supabase
        .from("sail_swap_requests")
        .update(updateData)
        .eq(
          "id",
          selectedRequest.id
        );


      if (error) {

        throw error;

      }


      // Update local data
      setRequests(prev =>
        prev.map(item =>
          item.id === selectedRequest.id
            ? {
                ...item,
                ...updateData
              }
            : item
        )
      );


      setSelectedRequest(prev => ({
        ...prev,
        ...updateData
      }));


    } catch (error) {

      console.error(
        "Failed to update request:",
        error
      );

      alert(
        error.message ||
        "Failed to update swap request."
      );

    } finally {

      setUpdating(false);

    }

  };


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    date
  ) => {

    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );

  };


  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (
    date
  ) => {

    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  };


  // =====================================================
  // STATUS CONFIG
  // =====================================================

  const getStatusConfig = (
    status
  ) => {

    const configs = {

      pending: {
        label: "Pending",
        icon: Clock3,
        className:
          "bg-amber-50 text-amber-600 border-amber-200"
      },

      processing: {
        label: "Processing",
        icon: Loader2,
        className:
          "bg-blue-50 text-blue-600 border-blue-200"
      },

      completed: {
        label: "Completed",
        icon: CheckCircle2,
        className:
          "bg-emerald-50 text-emerald-600 border-emerald-200"
      },

      rejected: {
        label: "Rejected",
        icon: XCircle,
        className:
          "bg-red-50 text-red-600 border-red-200"
      }

    };


    return configs[status] ||
      configs.pending;

  };


  // =====================================================
  // TOTAL PENDING USDC
  // =====================================================

  const pendingUsdc = useMemo(() => {

    return requests
      .filter(item =>
        item.status === "pending" ||
        item.status === "processing"
      )
      .reduce(
        (total, item) =>
          total + Number(item.usdc_amount || 0),
        0
      );

  }, [requests]);


  // =====================================================
  // TOTAL PENDING SAIL
  // =====================================================

  const pendingSail = useMemo(() => {

    return requests
      .filter(item =>
        item.status === "pending" ||
        item.status === "processing"
      )
      .reduce(
        (total, item) =>
          total + Number(item.sail_amount || 0),
        0
      );

  }, [requests]);


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="min-h-screen bg-slate-50 flex items-center justify-center">

        <div className="text-center">

          <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto mb-3" />

          <p className="text-xs font-bold text-slate-400">
            Loading swap requests...
          </p>

        </div>

      </div>

    );

  }


  return (

    <div className="min-h-screen bg-slate-50 pb-28">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="bg-white border-b border-slate-200 px-4 pt-5 pb-4 sticky top-0 z-30">

        <div className="flex items-center justify-between mb-4">

          <div>

            <div className="flex items-center gap-2">

              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">

                <ArrowDownUp className="w-4 h-4 text-white" />

              </div>


              <div>

                <h1 className="text-[17px] font-black text-slate-900 tracking-tight">

                  SAIL Swaps

                </h1>

                <p className="text-[9px] font-bold text-slate-400">

                  Withdrawal Management

                </p>

              </div>

            </div>

          </div>


          <button
            onClick={handleRefresh}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center active:scale-95 transition-transform"
          >

            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

          </button>

        </div>


        {/* SEARCH */}

        <div className="relative">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          <input
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            placeholder="Search username or wallet..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />

        </div>

      </div>


      <div className="px-4 pt-5">


        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        <div className="grid grid-cols-2 gap-3 mb-5">


          <div className="bg-slate-950 rounded-2xl p-4 text-white relative overflow-hidden">

            <div className="absolute -right-5 -top-5 w-20 h-20 rounded-full bg-blue-500/20 blur-2xl" />

            <div className="relative">

              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">

                Pending Payout

              </div>

              <div className="text-[21px] font-black mt-1">

                ${pendingUsdc.toFixed(2)}

              </div>

              <div className="text-[9px] text-slate-500 mt-1">

                USDC to process

              </div>

            </div>

          </div>


          <div className="bg-white border border-slate-200 rounded-2xl p-4">

            <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">

              Pending SAIL

            </div>

            <div className="text-[18px] font-black text-slate-900 mt-1">

              {pendingSail.toLocaleString()}

            </div>

            <div className="text-[9px] text-slate-400 mt-1">

              SAIL requested

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* FILTER TABS */}
        {/* ================================================= */}

        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2">

          {[
            {
              id: "all",
              label: "All",
              count: counts.all
            },

            {
              id: "pending",
              label: "Pending",
              count: counts.pending
            },

            {
              id: "processing",
              label: "Processing",
              count: counts.processing
            },

            {
              id: "completed",
              label: "Completed",
              count: counts.completed
            },

            {
              id: "rejected",
              label: "Rejected",
              count: counts.rejected
            }

          ].map(filter => (

            <button
              key={filter.id}
              onClick={() =>
                setActiveFilter(filter.id)
              }
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-black transition-all border ${
                activeFilter === filter.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >

              {filter.label}

              <span
                className={`ml-1.5 ${
                  activeFilter === filter.id
                    ? "text-slate-300"
                    : "text-slate-400"
                }`}
              >

                {filter.count}

              </span>

            </button>

          ))}

        </div>


        {/* ================================================= */}
        {/* REQUEST LIST */}
        {/* ================================================= */}

        <div className="space-y-3">


          {filteredRequests.length === 0 && (

            <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-12 text-center">

              <ArrowDownUp className="w-7 h-7 text-slate-300 mx-auto mb-3" />

              <div className="text-sm font-black text-slate-600">

                No requests found

              </div>

              <div className="text-[10px] text-slate-400 mt-1">

                There are no swap requests in this category.

              </div>

            </div>

          )}


          {filteredRequests.map(request => {

            const status =
              getStatusConfig(
                request.status
              );

            const StatusIcon =
              status.icon;


            return (

              <button
                key={request.id}
                onClick={() =>
                  openRequest(request)
                }
                className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 active:scale-[0.99] transition-all shadow-sm"
              >


                {/* TOP */}

                <div className="flex items-start justify-between gap-3">


                  <div className="min-w-0 flex-1">


                    <div className="flex items-center gap-2">

                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">

                        <User className="w-4 h-4 text-slate-500" />

                      </div>


                      <div className="min-w-0">

                        <div className="text-[12px] font-black text-slate-900 truncate">

                          {profiles[request.auth_id]?.username || "Unknown User"}

                        </div>


                        <div className="text-[9px] text-slate-400 font-medium truncate">

                          {formatDate(
                            request.created_at
                          )}

                          {" · "}

                          {formatTime(
                            request.created_at
                          )}

                        </div>

                      </div>

                    </div>

                  </div>


                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-wide ${status.className}`}
                  >

                    <StatusIcon
                      className={`w-3 h-3 ${
                        request.status === "processing"
                          ? "animate-spin"
                          : ""
                      }`}
                    />

                    {status.label}

                  </div>

                </div>


                {/* AMOUNT */}

                <div className="grid grid-cols-2 gap-3 mt-4">


                  <div className="bg-slate-50 rounded-xl p-3">

                    <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">

                      <Coins className="w-3 h-3" />

                      SAIL

                    </div>

                    <div className="text-[15px] font-black text-slate-900">

                      {Number(
                        request.sail_amount
                      ).toLocaleString()}

                    </div>

                  </div>


                  <div className="bg-emerald-50 rounded-xl p-3">

                    <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-600 mb-1">

                      <DollarSign className="w-3 h-3" />

                      USDC

                    </div>

                    <div className="text-[15px] font-black text-emerald-700">

                      $
                      {Number(
                        request.usdc_amount
                      ).toFixed(2)}

                    </div>

                  </div>

                </div>


                {/* WALLET */}

                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">

                  <div className="flex items-center gap-2 min-w-0">

                    <Wallet className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />

                    <span className="text-[9px] font-bold text-slate-500 truncate">

                      {request.wallet_address
                        ? `${request.wallet_address.slice(0, 10)}...${request.wallet_address.slice(-8)}`
                        : "No wallet address"}

                    </span>

                  </div>


                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />

                </div>

              </button>

            );

          })}

        </div>

      </div>


      {/* ================================================= */}
      {/* REQUEST DETAILS MODAL */}
      {/* ================================================= */}

      {selectedRequest && (

        <div className="fixed inset-0 z-[100] flex items-end">

          {/* OVERLAY */}

          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => {
              if (!updating) {
                setSelectedRequest(null);
              }
            }}
          />


          {/* SHEET */}

          <div className="relative w-full max-h-[92vh] overflow-y-auto bg-slate-50 rounded-t-[30px] animate-in slide-in-from-bottom duration-300">


            {/* HANDLE */}

            <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 pt-3 pb-4">

              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />


              <div className="flex items-center justify-between">


                <div>

                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">

                    Swap Request

                  </div>

                  <h2 className="text-[17px] font-black text-slate-900">

                    Request Details

                  </h2>

                </div>


                <button
                  disabled={updating}
                  onClick={() =>
                    setSelectedRequest(null)
                  }
                  className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"
                >

                  <X className="w-4 h-4 text-slate-600" />

                </button>

              </div>

            </div>


            <div className="p-4 pb-10 space-y-4">


              {/* USER */}

              <div className="bg-white border border-slate-200 rounded-2xl p-4">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">

                    <User className="w-5 h-5 text-blue-600" />

                  </div>


                  <div className="min-w-0">

                    <div className="text-[13px] font-black text-slate-900">

                      {profiles[selectedRequest.auth_id]?.username || "Unknown User"}

                    </div>


                    <div className="text-[9px] font-medium text-slate-400 truncate mt-0.5">

                      ID: {selectedRequest.auth_id}

                    </div>

                  </div>

                </div>

              </div>


              {/* AMOUNT */}

              <div className="grid grid-cols-2 gap-3">

                <div className="bg-slate-950 rounded-2xl p-4 text-white">

                  <div className="text-[8px] font-black uppercase tracking-wider text-slate-500">

                    SAIL Deducted

                  </div>

                  <div className="text-[19px] font-black mt-1">

                    {Number(
                      selectedRequest.sail_amount
                    ).toLocaleString()}

                  </div>

                  <div className="text-[9px] text-blue-400 font-bold">

                    SAIL

                  </div>

                </div>


                <div className="bg-emerald-600 rounded-2xl p-4 text-white">

                  <div className="text-[8px] font-black uppercase tracking-wider text-emerald-200">

                    USDC Payout

                  </div>

                  <div className="text-[19px] font-black mt-1">

                    $
                    {Number(
                      selectedRequest.usdc_amount
                    ).toFixed(2)}

                  </div>

                  <div className="text-[9px] text-emerald-100 font-bold">

                    USDC

                  </div>

                </div>

              </div>


              {/* WALLET */}

              <div className="bg-white border border-slate-200 rounded-2xl p-4">

                <div className="flex items-center gap-2 mb-3">

                  <Wallet className="w-4 h-4 text-blue-600" />

                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">

                    Receiving Wallet

                  </span>

                </div>


                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">

                  <div className="flex items-start justify-between gap-3">


                    <div className="text-[10px] font-mono font-bold text-slate-700 break-all leading-relaxed">

                      {selectedRequest.wallet_address ||
                        "No wallet address"}

                    </div>


                    <button
                      onClick={() =>
                        copyText(
                          selectedRequest.wallet_address,
                          "wallet"
                        )
                      }
                      className="flex-shrink-0"
                    >

                      {copied === "wallet" ? (

                        <Check className="w-4 h-4 text-emerald-500" />

                      ) : (

                        <Copy className="w-4 h-4 text-slate-400" />

                      )}

                    </button>

                  </div>

                </div>

              </div>


              {/* STATUS */}

              <div className="bg-white border border-slate-200 rounded-2xl p-4">

                <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-3">

                  Request Status

                </div>


                <div className="grid grid-cols-2 gap-2">


                  <button
                    disabled={updating}
                    onClick={() =>
                      updateRequest("pending")
                    }
                    className={`py-3 rounded-xl text-[10px] font-black border transition-all ${
                      selectedRequest.status === "pending"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-amber-600 border-amber-200"
                    }`}
                  >

                    Pending

                  </button>


                  <button
                    disabled={updating}
                    onClick={() =>
                      updateRequest("processing")
                    }
                    className={`py-3 rounded-xl text-[10px] font-black border transition-all ${
                      selectedRequest.status === "processing"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-blue-600 border-blue-200"
                    }`}
                  >

                    Processing

                  </button>

                </div>

              </div>


              {/* PAYMENT TX HASH */}

              <div className="bg-white border border-slate-200 rounded-2xl p-4">

                <div className="flex items-center gap-2 mb-3">

                  <Hash className="w-4 h-4 text-blue-600" />

                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">

                    Payment Transaction Hash

                  </span>

                </div>


                <textarea
                  value={paymentTxHash}
                  disabled={updating}
                  onChange={(e) =>
                    setPaymentTxHash(e.target.value)
                  }
                  placeholder="Paste Base transaction hash after sending USDC..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-mono font-medium text-slate-700 outline-none focus:border-blue-500 resize-none"
                />

              </div>


              {/* ADMIN NOTES */}

              <div className="bg-white border border-slate-200 rounded-2xl p-4">

                <div className="flex items-center gap-2 mb-3">

                  <FileText className="w-4 h-4 text-blue-600" />

                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">

                    Admin Notes

                  </span>

                </div>


                <textarea
                  value={adminNotes}
                  disabled={updating}
                  onChange={(e) =>
                    setAdminNotes(e.target.value)
                  }
                  placeholder="Optional internal notes..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-medium text-slate-700 outline-none focus:border-blue-500 resize-none"
                />

              </div>


              {/* DATE */}

              <div className="flex items-center gap-2 px-1 text-[9px] text-slate-400 font-medium">

                <Calendar className="w-3.5 h-3.5" />

                Requested on

                {formatDate(
                  selectedRequest.created_at
                )}

              </div>


              {/* ACTIONS */}

              <div className="space-y-2 pt-2">


                <button
                  disabled={updating}
                  onClick={() =>
                    updateRequest("completed")
                  }
                  className="w-full h-12 rounded-xl bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                >

                  {updating ? (

                    <Loader2 className="w-4 h-4 animate-spin" />

                  ) : (

                    <CheckCircle2 className="w-4 h-4" />

                  )}

                  Mark Payment Completed

                </button>


                <button
                  disabled={updating}
                  onClick={() =>
                    updateRequest("rejected")
                  }
                  className="w-full h-11 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[10px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                >

                  <XCircle className="w-4 h-4" />

                  Reject Request

                </button>

              </div>


              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">

                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />

                <p className="text-[9px] leading-relaxed text-amber-700 font-medium">

                  Make sure the USDC payment is successfully sent to the
                  receiving wallet before marking this request as completed.

                </p>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};


export default SailSwapRequestsMobile;