import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function ReloadPrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-blue-600 text-white p-4 rounded-xl shadow-2xl z-[100] flex items-center justify-between">
      <p className="text-xs font-bold">New airdrops and updates are available!</p>
      <button 
        className="bg-white text-blue-600 px-3 py-1 rounded-lg text-xs font-black"
        onClick={() => updateServiceWorker(true)}
      >
        Update Now
      </button>
    </div>
  );
}
