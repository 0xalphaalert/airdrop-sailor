import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Header';
import AirdropsPage from './AirdropsPage';
import ProjectDetail from './ProjectDetail';
import FundraisingPage from './FundraisingPage';
import EarlyTasks from './EarlyTasksPage';
import SubscriptionPage from './SubscriptionPage';
import ProfilePage from './ProfilePage';
import AdminDashboard from './AdminDashboard';
import ChainsHub from './ChainsHub';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
        
        {/* Global Top Navigation Bar */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<AirdropsPage />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/fundraising" element={<FundraisingPage />} />
            <Route path="/early-tasks" element={<EarlyTasks />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/chains" element={<ChainsHub />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="border-t border-gray-200 bg-white py-8 mt-auto">
          <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 flex justify-between items-center text-sm text-gray-500">
            <div><span className="font-bold text-gray-900 mr-2">⛵ AirdropSailor</span>© 2026 All rights reserved.</div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-gray-900">Twitter (X)</a>
              <a href="#" className="hover:text-gray-900">Telegram</a>
            </div>
          </div>
        </footer>

      </div>
    </Router>
  );
}