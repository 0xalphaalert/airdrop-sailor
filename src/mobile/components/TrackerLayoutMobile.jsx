import React, { useState } from 'react';
import TrackerHeaderMobile from './TrackerHeaderMobile';
import TrackerSidebarMobile from './TrackerSidebarMobile';
import MobileFooterSwitcher from './navigation/MobileFooterSwitcher'; 
import { TrackerProvider } from '../context/TrackerContext';
import { FloatingTimerPill, TaskBottomSheetMobile } from './TaskBottomSheetMobile';

export default function TrackerLayoutMobile({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSheetTask, setActiveSheetTask] = useState(null); // Used if the pill is clicked

  return (
    <TrackerProvider>
      <div className="flex flex-col min-h-screen bg-slate-50/50 pt-16 pb-28">
        <TrackerSidebarMobile isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <TrackerHeaderMobile onOpenSidebar={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 w-full relative">
          {children}
        </main>

        <FloatingTimerPill onExpand={setActiveSheetTask} />
        
        <TaskBottomSheetMobile 
          isOpen={!!activeSheetTask} 
          task={activeSheetTask} 
          onClose={() => setActiveSheetTask(null)} 
        />

        <MobileFooterSwitcher />
      </div>
    </TrackerProvider>
  );
}