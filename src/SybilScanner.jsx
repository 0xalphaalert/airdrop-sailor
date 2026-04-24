import React, { useState, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { 
  ShieldCheck, ShieldAlert, Search, Loader2, 
  Twitter, ArrowRight, Lock, Activity, Anchor, 
  Map, Download, Image as ImageIcon, Clock, 
  Fingerprint, Globe, Award, Coins
} from 'lucide-react';

export default function SybilScanner() {
  const { login, authenticated, user } = usePrivy();
  
  const [addressInput, setAddressInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  // 🚀 Load recent scans from browser memory
  const [recentScans, setRecentScans] = useState(() => {
    const saved = localStorage.getItem('sailor_recent_scans');
    return saved ? JSON.parse(saved) : [];
  });

  const captureRef = useRef(null);

  const handleScan = async (e, addressOverride = null) => {
    if (e) e.preventDefault();
    const targetWallet = addressOverride || addressInput || user?.wallet?.address;
    
    if (!targetWallet || !targetWallet.startsWith('0x') || targetWallet.length !== 42) {
      return setError('Please enter a valid EVM wallet address.');
    }

    setError('');
    setIsScanning(true);
    setScanResult(null);

    try {
      // 🚀 Fixed HTTPS URL
      const response = await fetch('https://pddykfluvauwsfleqsfk.supabase.co/functions/v1/analyze-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Make sure your actual anon key is here!
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZHlrZmx1dmF1d3NmbGVxc2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzU3ODgsImV4cCI6MjA4OTMxMTc4OH0.F8A-EWHhxueh5jYNBA7lYy241S0f55tmfEwVlUArcF8` 
        },
        body: JSON.stringify({ wallet_address: targetWallet })
      });

      const result = await response.json();

      if (result.success && result.data) {
        setScanResult(result.data);

        // 🚀 Save to Recent Scans (Max 5)
        const newScanRecord = { address: targetWallet, score: result.data.sailor_score };
        const updatedHistory = [
          newScanRecord, 
          ...recentScans.filter(scan => scan.address.toLowerCase() !== targetWallet.toLowerCase())
        ].slice(0, 5);
        
        setRecentScans(updatedHistory);
        localStorage.setItem('sailor_recent_scans', JSON.stringify(updatedHistory));

      } else {
        throw new Error(result.error || "Failed to analyze wallet.");
      }

    } catch (err) {
      console.error(err);
      setError('Blockchain analysis failed. Please check the address or try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownloadCard = async () => {
    if (!captureRef.current) return;
    setIsCapturing(true);
    
    try {
      // 1. Determine mode based on score (Ego vs Tension vs Fear)
      const isFlexMode = scanResult.sailor_score >= 70;
      const isMid = scanResult.sailor_score >= 40 && scanResult.sailor_score < 70;
      
      // Dynamic styling and copy based on new Viral Design Brief
      const themeColor = isFlexMode ? 'emerald' : isMid ? 'amber' : 'rose';
      const headline = isFlexMode ? '🏆 AIRDROP ELITE' : isMid ? '⚠️ AT RISK WALLET' : '🚨 SYBIL RISK HIGH';
      const subtext = isFlexMode ? `You are in the top ${scanResult.percentile || 5}% of wallets` : isMid ? 'Not competitive for top-tier drops' : 'You may get ZERO airdrops';
      const identity = isFlexMode ? 'Elite Wallet' : isMid ? 'Below Alpha' : 'Sybil Suspected';
      const hookLine = isFlexMode ? 'Highly eligible for future airdrops.' : isMid ? 'You’re close — but not enough for premium rewards.' : 'This wallet may miss all major drops.';

      // 2. The Viral 4:5 Twitter Template
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
              body { 
                font-family: 'Inter', sans-serif; 
                margin: 0;
                padding: 0;
                background-color: #030712; 
              }
              .glow-bg {
                background: radial-gradient(circle at center, ${isFlexMode ? 'rgba(16, 185, 129, 0.15)' : isMid ? 'rgba(245, 158, 11, 0.15)' : 'rgba(225, 29, 72, 0.15)'} 0%, rgba(3, 7, 18, 0) 70%);
              }
              .text-glow {
                text-shadow: 0 0 40px ${isFlexMode ? 'rgba(16, 185, 129, 0.5)' : isMid ? 'rgba(245, 158, 11, 0.5)' : 'rgba(225, 29, 72, 0.5)'};
              }
              /* Magic CSS to turn your blue logo purely white for high contrast */
              .logo-white {
                filter: brightness(0) invert(1);
              }
            </style>
          </head>
          <body class="w-[1080px] h-[1350px] relative overflow-hidden text-white flex flex-col items-center justify-between p-24">
            
            <div class="absolute inset-0 glow-bg z-0"></div>

            <div class="absolute top-12 right-12 z-20 flex items-center">
              <div class="bg-black/40 backdrop-blur-md border border-gray-800 px-8 py-4 rounded-full flex items-center gap-5 shadow-xl">
                <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" class="w-16 h-16 object-contain" />
                <span class="text-2xl font-bold text-gray-300 tracking-wider uppercase">AirdropSailor <span class="text-white">Verified</span></span>
              </div>
            </div>

            <div class="relative z-10 text-center mt-20">
              <h1 class="text-6xl font-black text-${themeColor}-500 tracking-tighter mb-6">${headline}</h1>
              <p class="text-3xl font-bold text-gray-300 tracking-tight">${subtext}</p>
            </div>

            <div class="relative z-10 flex flex-col items-center my-12">
              <div class="w-[450px] h-[450px] rounded-full border-[16px] border-${themeColor}-500 flex flex-col items-center justify-center shadow-[0_0_100px_rgba(${isFlexMode ? '16,185,129' : isMid ? '245,158,11' : '225,29,72'},0.4)] relative">
                <span class="text-[200px] font-black leading-none tracking-tighter text-white text-glow m-0 p-0">${scanResult.sailor_score}</span>
              </div>
              <div class="mt-12 bg-${themeColor}-500/20 border-2 border-${themeColor}-500/50 px-10 py-4 rounded-full">
                <span class="text-4xl font-black text-${themeColor}-400 uppercase tracking-widest">${identity}</span>
              </div>
            </div>

            <div class="relative z-10 w-full max-w-3xl bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-10 flex flex-col gap-6">
              <div class="pb-6 border-b border-gray-800">
                <p class="text-3xl font-bold text-gray-200">📊 Better than <span class="text-white font-black">${100 - (scanResult.percentile || 0)}%</span> of wallets</p>
              </div>
              <div class="flex flex-col gap-4">
                <p class="text-2xl font-bold text-gray-400">
                  ${Number(scanResult.gitcoin_score || 0) >= 15 ? '✅ Gitcoin Score: Optimal' : '❌ Gitcoin Score: Critical'}
                </p>
                <p class="text-2xl font-bold text-gray-400">
                  ${(scanResult.unique_contracts_touched || 0) > 10 ? '✅ Good contract diversity' : '⚠️ Limited contract activity'}
                </p>
                <p class="text-2xl font-bold text-gray-400">
                  ${(scanResult.wallet_age_days || 0) > 90 ? '✅ Established wallet age' : '⚠️ Low wallet age'}
                </p>
              </div>
            </div>

            <div class="relative z-10 text-center w-full mb-6">
              <h2 class="text-4xl font-black text-white mb-12 tracking-tight">${hookLine}</h2>
              <div class="flex items-center justify-center gap-12 w-full">
                 <span class="text-2xl font-bold text-gray-500 uppercase tracking-widest">Check your wallet →</span>
                 <span class="text-2xl font-bold text-${themeColor}-400 uppercase tracking-widest">Share your score 👇</span>
              </div>
            </div>

          </body>
        </html>
      `;

      // 3. Send it to your new Edge Function
      const response = await fetch('https://pddykfluvauwsfleqsfk.supabase.co/functions/v1/generate-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZHlrZmx1dmF1d3NmbGVxc2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzU3ODgsImV4cCI6MjA4OTMxMTc4OH0.F8A-EWHhxueh5jYNBA7lYy241S0f55tmfEwVlUArcF8` // USE YOUR ANON KEY
        },
        body: JSON.stringify({ htmlContent: fullHtml })
      });

      if (!response.ok) throw new Error("Failed to generate image");

      // 4. Convert the returned data into a downloadable image file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.download = `AirdropSailor-Score-${scanResult.wallet_address.slice(0,6)}.png`;
      link.href = url;
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);

    } catch (error) { 
      console.error("Error capturing card:", error); 
    } finally { 
      setIsCapturing(false); 
    }
  };

  const handleShare = () => {
    if (!scanResult) return;
    const text = `My wallet is in the Top ${scanResult.percentile}% safest on AirdropSailor! I scored ${scanResult.sailor_score}/100 🛡️⚓\n\nAre you safe from the next Sybil purge? Scan your wallet here:`;
    const url = `https://airdropsailor.com/scanner`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const isDanger = scanResult?.sailor_score < 50;

  // Helper logic for Trust Tier
  const getTrustTier = (score) => {
    if (score >= 80) return { label: 'Elite Farmer', color: 'text-emerald-600' };
    if (score >= 50) return { label: 'Standard', color: 'text-blue-600' };
    return { label: 'Vulnerable', color: 'text-rose-600' };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 overflow-hidden relative">
      
      {/* Ambient Light Background Effects */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${isDanger ? 'bg-rose-400/10' : 'bg-blue-400/10'}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${isDanger ? 'bg-amber-400/10' : 'bg-indigo-400/10'}`}></div>

      {/* Header */}
      <header className="relative z-10 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* REPLACE THIS DIV WITH YOUR LOCAL LOGO IMG TAG IF YOU PREFER */}
            <img 
  src="/logo-icon.png" 
  alt="AirdropSailor Logo" 
  className="w-8 h-8 object-contain group-hover:scale-105 transition-transform" 
/>
            <span className="font-bold text-lg text-slate-900 tracking-tight">AirdropSailor</span>
          </Link>
          <div className="flex gap-4">
            {!authenticated ? (
              <button onClick={login} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                Sign In / Connect
              </button>
            ) : (
              <Link to="/profile" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-24">
        
        {/* HERO SECTION */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
            <Activity className="w-3.5 h-3.5" /> Core Engine v2.0 Live
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
            The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Sybil Scanner</span>
          </h1>
          <p className="text-base text-slate-500 font-medium max-w-2xl mx-auto">
            Scan your wallet to discover your global safety percentile and get actionable steps to beat the next protocol snapshot.
          </p>
        </div>

        {/* SCANNER INPUT */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={(e) => handleScan(e)} className={`relative flex items-center bg-white shadow-xl rounded-2xl transition-all duration-500 border ${isDanger ? 'border-rose-200 shadow-rose-500/10' : 'border-slate-200 shadow-slate-200/50'}`}>
            <div className="absolute left-5 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Enter 0x... wallet address" 
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="w-full bg-transparent text-slate-900 rounded-2xl py-4 pl-14 pr-40 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono text-sm"
            />
            <button 
              type="submit"
              disabled={isScanning || (!addressInput && !user?.wallet?.address)}
              className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan Wallet'}
            </button>
          </form>
          {error && <p className="text-rose-500 text-sm mt-4 text-center font-bold flex items-center justify-center gap-1.5"><ShieldAlert className="w-4 h-4" /> {error}</p>}

          {/* 🚀 RECENT SCANS CHIPS */}
          {recentScans.length > 0 && !scanResult && !isScanning && (
            <div className="mt-6 animate-in fade-in duration-500">
              <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Scans</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {recentScans.map((scan, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setAddressInput(scan.address);
                      handleScan(null, scan.address);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg shadow-sm transition-all text-xs font-bold text-slate-600 group"
                  >
                    <span className="font-mono text-slate-500 group-hover:text-blue-600">
                      {scan.address.slice(0,5)}...{scan.address.slice(-4)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                      scan.score >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                      scan.score >= 50 ? 'bg-blue-100 text-blue-700' : 
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {scan.score}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SCAN RESULTS */}
        {scanResult && !isScanning && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ======================================================== */}
            {/* 🚀 THE FLEX CARD (This entire div is captured for X) */}
            {/* ======================================================== */}
            <div 
              ref={captureRef}
              className={`bg-white border rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden transition-colors duration-1000 mb-6 ${isDanger ? 'border-rose-200 shadow-rose-500/10' : 'border-slate-200 shadow-slate-200/50'}`}
            >
              {/* Internal Card Glow */}
              <div className={`absolute -top-32 -right-32 w-96 h-96 blur-[100px] rounded-full pointer-events-none opacity-20 ${isDanger ? 'bg-rose-500' : 'bg-blue-500'}`} data-html2canvas-ignore="true"></div>

              {/* TOP Vitals Row */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10 pb-8 border-b border-slate-100 relative z-10">
                <div className="flex items-center gap-8">
                  {/* Glowing Score Donut */}
                  <div className="relative w-36 h-36 flex items-center justify-center drop-shadow-sm">
                    
                    {/* 1. We make the SVG absolute and REMOVE the CSS transform */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                      <circle 
                        cx="50" cy="50" r="40" fill="none" 
                        stroke={scanResult.sailor_score >= 80 ? '#10b981' : scanResult.sailor_score >= 50 ? '#3b82f6' : '#f43f5e'} 
                        strokeWidth="8" 
                        strokeDasharray={251.2} 
                        strokeDashoffset={251.2 - (scanResult.sailor_score / 100) * 251.2} 
                        strokeLinecap="round" 
                        transform="rotate(-90 50 50)" 
                        className="transition-all duration-1500 ease-out" 
                      />
                    </svg>

                    {/* 2. The text is now relative and tightly bound to the center */}
                    <div className="relative z-10 flex items-center justify-center w-full h-full">
                      <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter m-0 p-0">
                        {scanResult.sailor_score}
                      </span>
                    </div>

                  </div>
                  {/* Added flex-col and explicit margins to prevent canvas overlap */}
<div className="flex flex-col justify-center">
  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-none">Wallet Health</h3>
  <div className="flex flex-wrap items-center gap-2 mb-3">
    <span className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        scanResult.sailor_score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                        scanResult.sailor_score >= 50 ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                        'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                      }`}>
                        {scanResult.sailor_score >= 80 ? 'Safe Status' : scanResult.sailor_score >= 50 ? 'Medium Risk' : 'CRITICAL SYBIL RISK'}
                      </span>
                    </div>
                    <span className="text-slate-500 font-mono text-sm font-semibold">{scanResult.wallet_address.slice(0,6)}...{scanResult.wallet_address.slice(-4)}</span>
                  </div>
                </div>

                {/* Download / Branding (Only visible inside the card) */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-slate-400">
  <img 
    src="/logo-icon.png" 
    alt="AirdropSailor" 
    className="w-6 h-6 object-contain" 
  />
  <span className="font-bold text-sm tracking-tight text-slate-700">AirdropSailor</span>
</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Scan</span>
                </div>
              </div>

              {/* 🚀 THE UPDATED GAMIFIED 6-CARD VITALS */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><Map className="w-3.5 h-3.5 text-blue-500" /> Unique Contracts</p>
                  <p className="text-2xl font-black text-slate-900">{scanResult.unique_contracts_touched || 0}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-blue-500" /> Active Months</p>
                  <p className="text-2xl font-black text-slate-900">{scanResult.active_months_count || 0}</p>
                </div>
                {/* NEW: Global Percentile */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-blue-500" /> Global Ranking</p>
                  <p className="text-2xl font-black text-slate-900">
                    Top {scanResult.percentile || 99}%
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" /> Wallet Age</p>
                  <p className="text-2xl font-black text-slate-900">{scanResult.wallet_age_days || 0} <span className="text-sm text-slate-500 font-bold">Days</span></p>
                </div>
                {/* NEW: Trust Tier */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-blue-500" /> Trust Tier</p>
                  <p className={`text-xl font-black ${getTrustTier(scanResult.sailor_score).color}`}>
                    {getTrustTier(scanResult.sailor_score).label}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Gitcoin Score</p>
                  <p className={`text-2xl font-black ${scanResult.gitcoin_score >= 15 ? 'text-emerald-500' : 'text-slate-900'}`}>{scanResult.gitcoin_score || '0.0'}</p>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 🚀 THE ACTION BUTTONS (Share & Download)                 */}
            {/* ======================================================== */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mb-10">
              <button 
                onClick={handleDownloadCard}
                disabled={isCapturing}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                Save Image
              </button>
              <button 
                onClick={handleShare}
                className="w-full sm:w-auto px-6 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#1DA1F2]/30 hover:-translate-y-0.5"
              >
                <Twitter className="w-5 h-5 fill-current" /> Share on X
              </button>
            </div>

            {/* ======================================================== */}
            {/* 🚀 ACTIONABLE INSIGHTS & PAYWALL                         */}
            {/* ======================================================== */}
            <div className="relative">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">Score Improvement Guide</h4>
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                  <p className="text-sm text-slate-500 font-medium mb-6">
                    Complete these on-chain actions to increase your trust score and avoid Sybil filters before the next snapshot.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Dynamic Suggestion: Galxe */}
                    {!scanResult.has_galxe_passport && (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                          <Fingerprint className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-bold text-slate-900">Mint a Web3 Identity Passport</h5>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Proves humanity through secure identity verification.</p>
                        </div>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md shrink-0">
                          +15 Pts
                        </span>
                      </div>
                    )}

                    {/* Dynamic Suggestion: Gitcoin */}
                    {Number(scanResult.gitcoin_score || 0) < 15 && (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-bold text-slate-900">Boost Gitcoin Score</h5>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Collect more stamps on Gitcoin Passport to pass a 15.0 score.</p>
                        </div>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md shrink-0">
                          +15 Pts
                        </span>
                      </div>
                    )}

                    {/* Dynamic Suggestion: ETH Balance */}
                    {Number(scanResult.mainnet_eth_balance || 0) < 0.005 && (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center shrink-0">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-bold text-slate-900">Hold Mainnet ETH</h5>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Bridge at least 0.005 ETH to Ethereum Mainnet to prove capital.</p>
                        </div>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md shrink-0">
                          +10 Pts
                        </span>
                      </div>
                    )}

                    {/* Fallback if they are already perfect */}
                    {scanResult.has_galxe_passport && Number(scanResult.gitcoin_score || 0) >= 15 && Number(scanResult.mainnet_eth_balance || 0) >= 0.005 && (
                      <div className="text-center p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <h5 className="text-sm font-bold text-emerald-900">Your wallet is highly optimized!</h5>
                        <p className="text-xs text-emerald-700 font-medium mt-1">Keep interacting with new contracts to maintain your top percentile.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 🚀 GATED DEEP DIVE (The Paywall) */}
              {!authenticated && (
                <div className="absolute inset-0 top-12 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
                    <Lock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Unlock Full Vulnerability Report</h4>
                  <p className="text-sm font-medium text-slate-600 mb-6 max-w-md mx-auto">
                    See exactly which missing tasks and specific smart contracts are hurting your Sybil score, and get step-by-step guides to fix them.
                  </p>
                  <button onClick={login} className="px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-black text-sm transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 mx-auto hover:-translate-y-0.5">
                    Create Free Account <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Join 12,000+ safe farmers</p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}