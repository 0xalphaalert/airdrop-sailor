import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // 🚀 1. Imported the REAL routing Link!
import { Droplet, TrendingUp, CheckSquare, BarChart2, Zap, Link as LinkIcon, ShieldAlert, X } from 'lucide-react'; // 🚀 2. Renamed the icon to LinkIcon

const MobileBottomNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="md:hidden"> 
      
      {/* 1. Dark Overlay (click to close menu) */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 2. The Pop-up Flow Menu */}
      <div 
        className={`fixed bottom-28 left-1/2 w-11/12 max-w-sm bg-white border border-gray-100 rounded-2xl shadow-xl p-3 z-50 transition-all duration-300 transform -translate-x-1/2 ${
          isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
         <div className="flex flex-col gap-2">
            {/* 🚀 Changed buttons to Links and added onClick to close the menu when clicked */}
            <Link to="/subscription" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors w-full text-left">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-full"><Zap size={20}/></div>
              <span className="font-semibold text-gray-800">Points Arena</span>
            </Link>
            <Link to="/chains" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors w-full text-left">
              <div className="bg-emerald-50 text-emerald-600 p-2 rounded-full"><LinkIcon size={20}/></div> {/* 🚀 Used renamed LinkIcon */}
              <span className="font-semibold text-gray-800">Chains Hub</span>
            </Link>
            <Link to="/scanner" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors w-full text-left">
              <div className="bg-purple-50 text-purple-600 p-2 rounded-full"><ShieldAlert size={20}/></div>
              <span className="font-semibold text-gray-800">Sybil Checker</span>
            </Link>
         </div>
      </div>

      {/* 3. The Main Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50">
        <div className="flex justify-between items-center h-20 px-4 relative">
          
          {/* Left Side Items */}
          <div className="flex w-2/5 justify-between pr-4">
            {/* 🚀 Changed buttons to Links */}
            <Link to="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors w-full">
              <Droplet size={24} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">Airdrops</span>
            </Link>
            <Link to="/fundraising" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors w-full">
              <TrendingUp size={24} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">Fundraise</span>
            </Link>
          </div>

          {/* Center Floating Logo Button */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -top-6">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center justify-center w-16 h-16 rounded-full shadow-lg border-4 border-white transition-all duration-300 ${
                isMenuOpen ? 'bg-gray-800 text-white rotate-90' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
              }`}
            >
              {isMenuOpen ? <X size={28} /> : (
                 <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="Menu" className="w-8 h-8 object-contain filter brightness-0 invert" />
              )} 
            </button>
          </div>

          {/* Right Side Items */}
          <div className="flex w-2/5 justify-between pl-4">
            <Link to="/sprints" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors w-full">
              <CheckSquare size={24} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">Tasks</span>
            </Link>
            <Link to="/profile/overview" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors w-full">
              <BarChart2 size={24} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">Metrics</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;