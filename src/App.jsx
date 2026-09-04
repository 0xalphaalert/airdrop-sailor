import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './useAuth';
import AuthModal from "./components/AuthModal";
import ReloadPrompt from './components/ReloadPrompt';
import TrackerLayout from './tracker/TrackerLayout';
import TrackerOverview from './tracker/TrackerOverview';
import TrackerAirdrops from './tracker/TrackerAirdrops';
import TrackerTasks from './tracker/TrackerTasks';
import TrackerDaily from './tracker/TrackerDaily';
import TrackerDashboardMobile from './mobile/pages/TrackerDashboardMobile';
import TrackerAirdropsMobile from './mobile/pages/TrackerAirdropsMobile';
import TrackerTasksMobile from './mobile/pages/TrackerTasksMobile';
import TrackerDailyMobile from './mobile/pages/TrackerDailyMobile';
import { TrackerProvider } from './mobile/context/TrackerContext';
import RolesPageMobile from './mobile/pages/RolesPageMobile';
import MarketplacePageMobile from './mobile/pages/MarketplacePageMobile';

// --- GLOBAL COMPONENTS ---
import Sidebar from './Sidebar';
import TopHeader from './TopHeader'; 
import BottomNavigation from './mobile/components/navigation/BottomNavigation';
import LandingPage from './LandingPage'; 
import AirdropsPage from './AirdropsPage';
import EarlyAirdropsPage from './EarlyAirdropsPage';
import ProjectDetail from './ProjectDetail';
import FundraisingPage from './FundraisingPage';
import EarlyTasks from './EarlyTasksPage';
import SubscriptionPage from './SubscriptionPage';
import ChainsHub from './ChainsHub';
import SybilScanner from './SybilScanner';
import ExchangeOffers from './ExchangeOffers';
import ShortTasksFeed from './ShortTasksFeed'; 
import AdminLayout from './admin/AdminLayout';
import AdminLayoutMobile from './mobile/admin/AdminLayoutMobile';
import ManageCoreDBMobile from './mobile/admin/ManageCoreDBMobile';
import AdminContentManagerMobile from './mobile/admin/AdminContentManagerMobile';
import EarlylistMobile from './mobile/admin/EarlylistMobile';
import TokenGiveawaysMobile from './mobile/admin/TokenGiveawaysMobile';
import PendingReviewsMobile from './mobile/admin/PendingReviewsMobile';
import AdminContentManager from './admin/AdminContentManager';
import Overview from './admin/Overview';
import SystemHealthDashboard from './admin/SystemHealthDashboard';
import Manageas from './admin/Manageas';
import Earlylist from './admin/Earlylist';
import AdminExchangeOffers from './admin/ExchangeOffers';
import TokenGiveaways from './admin/TokenGiveaways';
import PendingReviews from './admin/PendingReviews';
import TelegramIntel from './admin/TelegramIntel';
import AdminDailyTasks from './admin/AdminDailyTasks';
import ResearchDailyTasks from './admin/ResearchDailyTasks';
import StudioDailyTasks from './admin/StudioDailyTasks';

// --- ALPHABRAIN STUDIO IMPORTS ---
import AlphaBrainLayout from './studio/AlphaBrainLayout';
import Dashboard from './studio/Dashboard';
import CreatorStudio from './studio/CreatorStudio';
import WritingPad from './studio/WritingPad';
import Content from './studio/Content';
import FarcasterEngine from './studio/FarcasterEngine';
import BinanceSquareEngine from './studio/BinanceSquareEngine';
import Settings from './studio/Settings';

// --- NESTED PROFILE COMPONENTS ---
import ProfileOnchain from './profile/ProfileOnchain';
import ProfileSettings from './profile/ProfileSettings';
import ProfileRoles from './profile/ProfileRoles';
import OnboardingTour from './components/OnboardingTour';
import XPLevelsPage from './pages/XPLevelsPage';
import MarketplacePage from './pages/MarketplacePage';
import AutoWorker from './pages/AutoWorker';
import ProjectResearchHub from './pages/admin/ProjectResearchHub';

// 🎯 CAPTURES REFERRAL CODE INTO LOCAL STORAGE AND REDIRECTS HOME
const ReferralHandler = () => {
  const { code } = useParams();

  useEffect(() => {
    if (code) {
      localStorage.setItem('referral_code', code);
    }
  }, [code]);

  return <Navigate to="/" replace />;
};

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

  if (!authenticated) {
    return <LandingPage />;
  }

  // ALWAYS return the kitchen! Let the kitchen decide if it's mobile or desktop.
  return <AirdropsPage />;
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

const ResponsiveTrackerLayout = ({ isMobile }) => (isMobile ? <Outlet /> : <TrackerLayout />);
const ResponsiveAdminLayout = ({ isMobile }) => (isMobile ? <AdminLayoutMobile /> : <AdminLayout />);

const AppLayout = () => {
  const location = useLocation();
  const { authenticated } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const showSidebar =
    !isMobile &&
    !(
    (location.pathname === '/' && !authenticated) ||
    location.pathname === '/scanner' ||
    location.pathname.startsWith('/admin') || // Hides main sidebar for Admin & Studio
    location.pathname.startsWith('/tracker') || // Hides main sidebar for Tracker App
    location.pathname.startsWith('/studio') // 🚀 ADDED THIS LINE
  );

  // 🚀 FIXED: Correctly hides the global top header for Admin and Tracker routes
  const showTopHeader =
    !isMobile &&
    !(
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/tracker') ||
    location.pathname.startsWith('/studio') // 🚀 ADDED THIS LINE
  );

  return (
    <div className={`h-screen font-sans flex overflow-hidden bg-[#F8FAFC] text-slate-900`}>
      {showSidebar && <Sidebar />}

      <main className={`flex-1 overflow-y-auto flex flex-col relative w-full lg:pt-0 ${(location.pathname.startsWith('/admin') || location.pathname.startsWith('/studio')) ? 'pt-0' : 'pt-16'}`}>
        {showTopHeader && <TopHeader />}

        <Routes>
          {/* --- 🎯 REFERRAL CAPTURE ROUTE --- */}
          <Route path="/ref/:code" element={<ReferralHandler />} />

          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<IndexRoute />} />
          <Route path="/sprints" element={<ShortTasksFeed />} />
          <Route path="/:id/airdropguide" element={<ProjectDetail />} />
          <Route path="/fundraising" element={<FundraisingPage />} />
          <Route path="/early-tasks" element={<EarlyTasks />} />
          <Route path="/early-airdrops" element={<EarlyAirdropsPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/chains" element={<ChainsHub />} />
          <Route path="/exchange-offers" element={<ExchangeOffers />} />
          <Route path="/scanner" element={<SybilScanner />} />
          <Route path="/xp-levels" element={<XPLevelsPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />

          {/* --- 🤖 HIDDEN AUTOMATION ROUTE (Ghost Worker) --- */}
          <Route path="/auto-worker" element={<AutoWorker />} />

          {/* --- 🚀 ALPHABRAIN STUDIO ENVIRONMENT --- */}
          <Route path="/studio" element={<ProtectedRoute><AlphaBrainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="create" element={<CreatorStudio />} />
            <Route path="writing-pad" element={<WritingPad />} />
            <Route path="content" element={<Content />} />
            <Route path="farcaster" element={<FarcasterEngine />} />
            <Route path="binance" element={<BinanceSquareEngine />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* --- ADMIN ENVIRONMENT (Responsive Layout) --- */}
          <Route path="/admin" element={<ProtectedRoute><ResponsiveAdminLayout isMobile={isMobile} /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="health" element={<SystemHealthDashboard />} />
            <Route path="daily-work" element={<AdminDailyTasks />} />
            <Route path="research-daily" element={<ResearchDailyTasks />} />
            <Route path="studio-daily" element={<StudioDailyTasks />} />
            <Route path="manage" element={isMobile ? <ManageCoreDBMobile /> : <Manageas />} />
            <Route path="content" element={isMobile ? <AdminContentManagerMobile /> : <AdminContentManager />} />
            <Route path="early" element={isMobile ? <EarlylistMobile /> : <Earlylist />} />
            <Route path="giveaways" element={isMobile ? <TokenGiveawaysMobile /> : <TokenGiveaways />} />
            <Route path="telegram-intel" element={<TelegramIntel />} />
            <Route path="research" element={<ProjectResearchHub />} />
            <Route path="pendingreviews" element={isMobile ? <PendingReviewsMobile /> : <PendingReviews />} />
          </Route>

          {/* --- PROTECTED USER DASHBOARD --- */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileSettings />
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

          {/* --- 🚀 STANDALONE TRACKER APP --- */}
          <Route path="/tracker" element={<ProtectedRoute><ResponsiveTrackerLayout isMobile={isMobile} /></ProtectedRoute>}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={isMobile ? <TrackerDashboardMobile /> : <TrackerOverview />} />
            <Route path="airdrops" element={isMobile ? <TrackerAirdropsMobile /> : <TrackerAirdrops />} />
            <Route path="tasks" element={isMobile ? <TrackerTasksMobile /> : <TrackerTasks />} />
            <Route path="daily" element={isMobile ? <TrackerDailyMobile /> : <TrackerDaily />} />
          </Route>

          {/* --- 🛑 CATCH-ALL (PREVENTS BLANK PAGES ON UNKNOWN PATHS) --- */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </main>

      {/* Hide the public BottomNavigation when inside Admin or Studio panels */}
      {isMobile && authenticated && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/studio') && <BottomNavigation />}
      
      {authenticated && <OnboardingTour />}
      
      <ReloadPrompt />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TrackerProvider>
      <Router>
        <AppLayout />
        <AuthModal />
      </Router>
      </TrackerProvider>
    </AuthProvider>
  );
}
