import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavigation from './BottomNavigation'; // Tracker footer
import MobileBottomNav from '../../../MobileBottomNav'; // Your ACTUAL mobile global footer

export default function MobileFooterSwitcher() {
  const location = useLocation();
  const isTracker = location.pathname.includes('/tracker');

  return (
    <div className="fixed bottom-0 w-full z-50">
      <AnimatePresence mode="wait">
        {isTracker ? (
          <motion.div
            key="tracker-footer"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <BottomNavigation />
          </motion.div>
        ) : (
          <motion.div
            key="global-footer"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* 🚀 FIXED: Renders the standard mobile nav, not the giant desktop footer */}
            <MobileBottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}