import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './useAuth';
import AuthModal from "./components/AuthModal";
import TrackerLayout from './tracker/TrackerLayout';
import TrackerOverview from './tracker/TrackerOverview';
import TrackerAirdrops from './tracker/TrackerAirdrops';
import TrackerTasks from './tracker/TrackerTasks';
import TrackerDaily from './tracker/TrackerDaily';

// --- GLOBAL COMPONENTS ---
import Sidebar from './Sidebar';
import TopHeader from './TopHeader'; 
import MobileBottomNav from './MobileBottomNav'; 
import LandingPage from './LandingPage'; 
import AirdropsPage from './AirdropsPage';
import EarlyAirdropsPage from './EarlyAirdropsPage';
import ProjectDetail from './ProjectDetail';
import FundraisingPage from './FundraisingPage';
import EarlyTasks from './EarlyTasksPage';
import SubscriptionPage from './SubscriptionPage';
import ChainsHub from './ChainsHub';
import Studio from './admin/Studio'; 
import SybilScanner from './SybilScanner';
import ExchangeOffers from './ExchangeOffers';
import ShortTasksFeed from './ShortTasksFeed'; 
import AdminLayout from './admin/AdminLayout';
import AdminContentManager from './admin/AdminContentManager';
import Overview from './admin/Overview';
import Manageas from './admin/Manageas';
import Earlylist from './admin/Earlylist';
import ProjectsResearch from './admin/ProjectsResearch';
import AdminExchangeOffers from './admin/ExchangeOffers';
import TokenGiveaways from './admin/TokenGiveaways';
import EarlyQuests from './admin/EarlyQuests';
import DailyTasks from './admin/DailyTasks';
import PendingReviews from './admin/PendingReviews';
import ProfilePage from './pages/ProfilePage';

// --- NESTED PROFILE COMPONENTS ---
import ProfileOnchain from './profile/ProfileOnchain';
import ProfileSettings from './profile/ProfileSettings';
import ProfileRoles from './profile/ProfileRoles';
import OnboardingTour from './components/OnboardingTour';
import XPLevelsPage from './pages/XPLevelsPage';
import MarketplacePage from './pages/MarketplacePage';
import ReferEarnPage from './pages/ReferEarnPage';

// 🚀 OLD BEHAVIOR RESTORED: Dynamic Index Route
const IndexRoute = () => {
  const { ready, authenticated } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return authenticated ? <AirdropsPage /> : <LandingPage />;
};

// 🔒 STRICT PROTECTION 
const ProtectedRoute = ({ children }) => {
  const { ready, authenticated } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return authenticated ? children : <Navigate to="/" replace />;
};

const AppLayout = () => {
  const location = useLocation();
  const { authenticated } = useAuth();
  
  const showSidebar = !(
    (location.pathname === '/' && !authenticated) ||
    location.pathname === '/scanner' ||
    location.pathname.startsWith('/admin') || // Hides main sidebar for Admin & Studio
    location.pathname.startsWith('/tracker')  // Hides main sidebar for Tracker App
  );

  // 🚀 FIXED: Correctly hides the global top header for Admin and Tracker routes
  const showTopHeader = !(
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/tracker')
  );

  return (
    <div className={`h-screen font-sans flex overflow-hidden bg-[#F8FAFC] text-slate-900`}>
      {showSidebar && <Sidebar />}

      <main className="flex-1 overflow-y-auto flex flex-col relative w-full lg:pt-0 pt-16">
        {showTopHeader && <TopHeader />}

        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<IndexRoute />} />
          <Route path="/sprints" element={<ShortTasksFeed />} />
          <Route path="/:id/airdropguide" element={<ProjectDetail />} />
          <Route path="/fundraising" element={<FundraisingPage />} />
          <Route path="/refer" element={<ReferEarnPage />} />
          <Route path="/early-tasks" element={<EarlyTasks />} />
          <Route path="/early-airdrops" element={<EarlyAirdropsPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/chains" element={<ChainsHub />} />
          <Route path="/exchange-offers" element={<ExchangeOffers />} />
          <Route path="/scanner" element={<SybilScanner />} />
          <Route path="/xp-levels" element={<XPLevelsPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />

          {/* --- ADMIN ENVIRONMENT (With its own Sidebar) --- */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="manage" element={<Manageas />} />
            <Route path="content" element={<AdminContentManager />} />
            <Route path="early" element={<Earlylist />} />
            <Route path="projects" element={<ProjectsResearch />} />
            <Route path="exchange" element={<AdminExchangeOffers />} />
            <Route path="giveaways" element={<TokenGiveaways />} />
            <Route path="earlyquests" element={<EarlyQuests />} />
            <Route path="dailytasks" element={<DailyTasks />} />
            <Route path="pendingreviews" element={<PendingReviews />} />
          </Route>
          
          <Route path="/admin/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />

          {/* --- PROTECTED USER DASHBOARD --- */}
          <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
/>

<Route
  path="/profile/roles"
  element={
    <ProtectedRoute>
      <ProfileRoles />
    </ProtectedRoute>
  }
/>

<Route
  path="/profile/sybil"
  element={
    <ProtectedRoute>
      <ProfileOnchain />
    </ProtectedRoute>
  }
/>

<Route
  path="/profile/settings"
  element={
    <ProtectedRoute>
      <ProfileSettings />
    </ProtectedRoute>
  }
/>

          {/* --- 🚀 NEW STANDALONE TRACKER APP --- */}
          <Route path="/tracker" element={<ProtectedRoute><TrackerLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="overview" replace />} />
            
            {/* All the Tracker Sub-pages */}
            <Route path="overview" element={<TrackerOverview />} />
            <Route path="airdrops" element={<TrackerAirdrops />} />
            <Route path="tasks" element={<TrackerTasks />} />
            <Route path="daily" element={<TrackerDaily />} />
            
          </Route>

        </Routes>
      </main>

      <MobileBottomNav />
      {authenticated && <OnboardingTour />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
        <AuthModal />
      </Router>
    </AuthProvider>
  );
}
