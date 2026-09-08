// src/mobile/components/layout/MobilePageWrapper.jsx
import React from 'react';
import MobileHeader from '../navigation/MobileHeader';

export default function MobilePageWrapper({ children, hidePadding = false }) {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] font-sans selection:bg-blue-100 flex flex-col">
      
      {/* 1. The Global Header */}
      <MobileHeader />

      {/* 2. The Dynamic Content Area */}
      {/* hidePadding allows us to turn off default padding for special pages */}
      <main className={`flex-1 w-full ${hidePadding ? 'pt-[68px] pb-32' : 'px-4 pt-[84px] pb-32'}`}>
        {children}
      </main>
      
    </div>
  );
}
