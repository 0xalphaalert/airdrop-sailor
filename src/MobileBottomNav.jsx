import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Droplet,
  LineChart,
  Gift,
  User,
  Crown,
  Trophy,
  Award,
  ShieldAlert,
  Settings,
  Target,
  X
} from 'lucide-react';

const MobileBottomNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

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
            <Link
  to="/early-tasks"
  onClick={() => setIsMenuOpen(false)}
  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl"
>
  <Target size={20} />
  <span className="font-semibold">Early Tasks</span>
</Link>

<Link
  to="/xp-levels"
  onClick={() => setIsMenuOpen(false)}
  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl"
>
  <Trophy size={20} />
  <span className="font-semibold">SAIL & Levels</span>
</Link>

<Link
  to="/subscription"
  onClick={() => setIsMenuOpen(false)}
  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl"
>
  <Crown size={20} />
  <span className="font-semibold">Sailor Pass</span>
</Link>

<Link
  to="/profile/roles"
  onClick={() => setIsMenuOpen(false)}
  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl"
>
  <Award size={20} />
  <span className="font-semibold">Roles</span>
</Link>


<Link
  to="/profile/sybil"
  onClick={() => setIsMenuOpen(false)}
  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl"
>
  <ShieldAlert size={20} />
  <span className="font-semibold">Sybil Scanner</span>
</Link>
         </div>
      </div>

      {/* 3. The Main Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50">
        <div className="flex justify-between items-center h-20 px-4 relative">
          
          {/* Left Side Items */}
          <div className="flex w-2/5 justify-between pr-4">
            {/* 🚀 Changed buttons to Links */}
            <Link
  to="/"
  className={`flex flex-col items-center justify-center transition-colors w-full ${
    location.pathname === '/'
      ? 'text-blue-600'
      : 'text-gray-500 hover:text-blue-600'
  }`}
>
              <Droplet size={24} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">Airdrops</span>
            </Link>
            <Link
  to="/tracker"
  className={`flex flex-col items-center justify-center transition-colors w-full ${
    location.pathname.startsWith('/tracker')
      ? 'text-blue-600'
      : 'text-gray-500 hover:text-blue-600'
  }`}
>
              <LineChart size={24} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">Tracker</span>
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
            <Link
  to="/marketplace"
  className={`flex flex-col items-center justify-center transition-colors w-full ${
    location.pathname.startsWith('/marketplace')
      ? 'text-blue-600'
      : 'text-gray-500 hover:text-blue-600'
  }`}
>
              <Gift size={24} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">Marketplace</span>
            </Link>
            <Link
  to="/profile"
  className={`flex flex-col items-center justify-center transition-colors w-full ${
    location.pathname.startsWith('/profile')
      ? 'text-blue-600'
      : 'text-gray-500 hover:text-blue-600'
  }`}
>
              <User size={24} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">Profile</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;