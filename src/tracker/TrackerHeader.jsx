import React, {
  useState,
  useEffect
} from 'react';
import {
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { Anchor } from 'lucide-react';
import { supabase } from '../supabaseClient';


export default function TrackerHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  // 🚀 Added logout
  const [user, setUser] = useState(null);
  
  // 🚀 Added profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  useEffect(() => {

  // GET CURRENT SESSION
  supabase.auth.getUser()
    .then(({ data }) => {

      setUser(data.user);

    });

  // LISTEN AUTH CHANGES
  const {
    data: listener
  } =
    supabase.auth.onAuthStateChange(
      (_, session) => {

        setUser(session?.user || null);

      }
    );

  return () => {

    listener.subscription.unsubscribe();

  };

}, []);
const authenticated = !!user;

  // Helper to check active routes
  const isActive = (path) => location.pathname === path;

  // Generate the gradient avatar based on wallet address
  const generateAvatar = (address) => {
    if (!address) return 'hsl(0, 0%, 80%)';
    let hash = 0;
    for (let i = 0; i < address.length; i++) { hash = address.charCodeAt(i) + ((hash << 5) - hash); }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  const NavLink = ({ to, label, exact = false }) => {
    const active = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          active
  ? 'text-blue-600 border-b-2 border-blue-600 rounded-none' 
            :'text-slate-500 hover:text-slate-900'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* 1. LOGO BRANDING */}
          <div className="flex items-center gap-10 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img 
                  src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
                  alt="AirdropSailor Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="font-bold text-lg tracking-tight">
  <span className="text-slate-900">AirdropSailor</span>{" "}
  <span className="text-blue-600">Tracker</span>
</div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-3 ml-8">

  <NavLink
    to="/tracker"
    label="Dashboard"
    exact={true}
  />

  <NavLink
  to="/tracker/airdrops"
  label="Airdrops"
/>

  <NavLink
    to="/tracker/tasks"
    label="Tasks"
  />

  <NavLink
    to="/tracker/daily"
    label="Daily Tasks"
  />

</nav>
          </div>

          {/* 2. AUTH & PROFILE SECTION */}
          <div className="flex items-center gap-4">
            
            {/* 🚀 REMOVED the floating Profile text link */}

            {authenticated ? (
              <div 
                className="relative"
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
              >
                {/* The Sleek User Pill */}
                <div className="flex items-center gap-2 pl-4 py-1 pr-1 bg-white border border-slate-200 rounded-full hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                  <span className="text-sm font-bold text-slate-700 font-mono tracking-tight group-hover:text-blue-600 transition-colors">
                    {
  user?.email
    ? user.email.split("@")[0]
    : "Sailor"
}
                  </span>
                  <div
  className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold shadow-inner border border-white/50"
  style={{ background: generateAvatar(user?.email) }}
>
  {user?.email ? user.email[0].toUpperCase() : "S"}
</div>
                </div>

                {/* 🚀 NEW: The Professional Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute top-full right-0 pt-2 w-52 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 flex flex-col gap-1">
                      
                      <Link to="/profile/overview" className="flex items-center px-2 py-5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                        Command Center
                      </Link>
                      
                      <Link to="/profile/settings" className="flex items-center px-2 py-5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                        Settings
                      </Link>
                      
                      <div className="h-px bg-slate-100 my-1"></div>
                      
                      <button 
                        onClick={() => supabase.auth.signOut()}
                        className="w-full text-left flex items-center px-2 py-5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-colors shadow-sm"
              >
                Signup/Login
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
