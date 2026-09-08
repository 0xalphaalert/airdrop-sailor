import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Search, Plus, Droplet, Globe, Flame, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ChainsHub() {
  const [chains, setChains] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // --- NEW PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchChains();
  }, []);

  // Reset to page 1 whenever the user types in the search bar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchChains = async () => {
    try {
      setLoading(true);

      // 1. Check if we already have the chains saved in the browser memory
      const cachedData = sessionStorage.getItem('chains_hub_cache');
      
      if (cachedData) {
        // Use cache and skip the database call entirely
        setChains(JSON.parse(cachedData));
        setLoading(false);
        return; 
      }

      // 2. If no cache exists, fetch safely from Supabase
      const { data, error } = await supabase
        .from('chains')
        .select('*')
        .order('chain_type', { ascending: true })
        .order('chain_name', { ascending: true });
        
      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      
      const fetchedData = data || [];
      
      // 3. Save the successful result to the browser to prevent duplicate fetches
      if (fetchedData.length > 0) {
        sessionStorage.setItem('chains_hub_cache', JSON.stringify(fetchedData));
      }
      
      setChains(fetchedData);
    } catch (error) {
      console.error("Error fetching chains:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNetwork = async (chain) => {
    if (!window.ethereum) return alert("Please install a Web3 wallet.");
    try {
      const chainIdHex = `0x${Number(chain.chain_id).toString(16)}`;
      const params = {
        chainId: chainIdHex,
        chainName: chain.chain_name,
        nativeCurrency: { name: chain.native_token || 'ETH', symbol: chain.native_token || 'ETH', decimals: 18 },
        rpcUrls: [chain.rpc_url],
      };
      if (chain.explorer_url) params.blockExplorerUrls = [chain.explorer_url];

      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [params] });
    } catch (error) {
      console.error("Failed to add network:", error);
    }
  };

  // --- PAGINATION LOGIC ---
  const filteredChains = chains.filter(c => 
    c.chain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.chain_id.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredChains.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentChains = filteredChains.slice(indexOfFirstItem, indexOfLastItem);

  // Smart page number generator (shows max 5 page buttons at a time)
  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-900 pb-20">
      <div className="max-w-[1200px] mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-[30px] font-[600] tracking-tight leading-none">Chains Hub</h1>
            </div>
            <p className="text-[14px] font-medium text-slate-500 max-w-md">
              Discover networks, claim testnet tokens, and add chains directly to your wallet.
            </p>
          </div>
          
          <div className="relative w-full md:w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search networks or Chain IDs..." 
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map(n => <div key={n} className="h-[140px] bg-white animate-pulse rounded-[12px] border border-slate-100 shadow-sm" />)
          ) : currentChains.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium">No networks found matching your search.</div>
          ) : (
            currentChains.map((chain) => (
              <div key={chain.id} className="bg-white rounded-[12px] border border-slate-200 p-[16px] shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between h-[140px] group">
                {chain.is_airdrop_chain && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border-2 border-white z-10">
                    <Flame className="w-3 h-3" /> Airdrop
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    <img 
                      src={`https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/svg/color/${(chain.native_token || 'eth').toLowerCase()}.svg`} 
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chain.chain_name)}&background=EFF6FF&color=2563EB&font-size=0.4&bold=true&length=2`; 
                      }}
                      className="w-full h-full object-contain p-1.5" 
                      alt="" 
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-900 text-[15px] truncate pr-2">{chain.chain_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 rounded-sm ${chain.chain_type === 'Testnet' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        {chain.chain_type}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 truncate">{chain.native_token} • ID:{chain.chain_id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                  <button onClick={() => handleAddNetwork(chain)} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-[12px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 group-hover:shadow-sm">
                    <Plus className="w-3.5 h-3.5" /> Add Network
                  </button>
                  {chain.faucet_url && (
                    <a href={chain.faucet_url} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors">
                      <Droplet className="w-4 h-4" />
                    </a>
                  )}
                  {chain.explorer_url && (
                    <a href={chain.explorer_url} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                  currentPage === pageNum 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}