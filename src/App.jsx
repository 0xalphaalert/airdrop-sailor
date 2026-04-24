import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth'; // 🚀 IMPORTED PRIVY

// --- GLOBAL COMPONENTS ---
import Header from './Header';
import Footer from './Footer'; 
import MobileBottomNav from './MobileBottomNav'; // 🚀 ADD THIS LINE
import LandingPage from './LandingPage'; // 🚀 IMPORTED LANDING PAGE
import AirdropsPage from './AirdropsPage';
import ProjectDetail from './ProjectDetail';
import FundraisingPage from './FundraisingPage';
import EarlyTasks from './EarlyTasksPage';
import SubscriptionPage from './SubscriptionPage';
import AdminDashboard from './AdminDashboard';
import ChainsHub from './ChainsHub';
import Studio from './Studio'; 
import SybilScanner from './SybilScanner';
import ShortTasksFeed from './ShortTasksFeed'; // 🚀 ADD THIS LINE

// --- NEW NESTED PROFILE COMPONENTS ---
import ProfileLayout from './ProfileLayout';
import ProfileOverview from './ProfileOverview';
import ProfileAirdrops from './ProfileAirdrops';
import ProfileTasks from './ProfileTasks';
import ProfileDailyTasks from './ProfileDailyTasks';
import ProfilePerformance from './ProfilePerformance';
import ProfileOnchain from './ProfileOnchain';
import ProfileSettings from './ProfileSettings';

// ==========================================
// 🚀 THE NEW SMART ROUTE WRAPPER
// ==========================================
const IndexRoute = () => {
  const { ready, authenticated } = usePrivy();

  // Show a loading spinner while Privy securely checks the wallet status
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Auto-Routing Magic:
  // Logged in -> Show Airdrops Dashboard
  // Not Logged in -> Show Landing Page
  return authenticated ? <AirdropsPage /> : <LandingPage />;
};

const AppLayout = () => {
  const location = useLocation();
  const { authenticated } = usePrivy(); // 🚀 We need this to check if we are on the landing page
  
  // 1. Hide Global Header for Studio, Scanner, OR the unauthenticated Landing Page
  const hideHeader = 
    location.pathname.startsWith('/studio') || 
    location.pathname === '/scanner' ||
    (location.pathname === '/' && !authenticated); // 🚀 Hides header on landing page

  // 2. Hide Global Footer for Admin, Studio, Profile, Scanner, OR the unauthenticated Landing Page
  const hideFooter = 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/studio') || 
    location.pathname.startsWith('/profile') ||
    location.pathname === '/scanner' ||
    (location.pathname === '/' && !authenticated); // 🚀 Hides footer on landing page

  return (
    <div className={`min-h-screen font-sans flex flex-col ${hideHeader && location.pathname !== '/scanner' ? 'bg-slate-50' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* Conditionally render Global Header */}
      {!hideHeader && <Header />}

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col">
        <Routes>
          {/* --- PUBLIC APP ROUTES (Footer will show here) --- */}
          
          {/* 🚀 SET THE ROOT PATH TO OUR NEW SMART ROUTE */}
          <Route path="/" element={<IndexRoute />} />
          
          {/* 🚀 Changed to the new SEO-friendly structure */}
          <Route path="/sprints" element={<ShortTasksFeed />} />
          <Route path="/:id/airdropguide" element={<ProjectDetail />} />
          <Route path="/fundraising" element={<FundraisingPage />} />
          <Route path="/early-tasks" element={<EarlyTasks />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/chains" element={<ChainsHub />} />
          
          {/* --- CUSTOM LANDING PAGES (Headers/Footers hidden) --- */}
          <Route path="/scanner" element={<SybilScanner />} />

          {/* --- FULL SCREEN DASHBOARDS (Footer will hide here) --- */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/studio" element={<Studio />} />

          {/* --- THE NESTED PROFILE ROUTES (Footer will hide here) --- */}
          <Route path="/profile" element={<ProfileLayout />}>
            
            {/* Default redirect: If they hit /profile, auto-route to /profile/overview */}
            <Route index element={<Navigate to="overview" replace />} />
            
            {/* The 7 Command Center Pages */}
            <Route path="overview" element={<ProfileOverview />} />
            <Route path="airdrops" element={<ProfileAirdrops />} />
            <Route path="tasks" element={<ProfileTasks />} />
            <Route path="daily-tasks" element={<ProfileDailyTasks />} />
            <Route path="performance" element={<ProfilePerformance />} />
            <Route path="onchain-analysis" element={<ProfileOnchain />} />
            <Route path="settings" element={<ProfileSettings />} />

          </Route>
        </Routes>
      </main>

      {/* Conditionally render the Premium Footer */}
      {!hideFooter && <Footer />}

      {/* 🚀 ADD THE MOBILE NAV HERE */}
      {!hideFooter && <MobileBottomNav />}

    </div>
  );
};
export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
