import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { PrivyProvider } from '@privy-io/react-auth';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivyProvider
      appId="cmmnmukdw016r0dl8azowpnmi"
      config={{
        // Customize the UI to match your premium theme
        appearance: {
          theme: 'light',
          accentColor: '#2563eb', // Matches your Tailwind blue-600
          showWalletLoginFirst: true,
        },
        // Decide what login methods to show your airdrop hunters
        loginMethods: ['wallet', 'email', 'google', 'twitter', 'discord'],
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
);