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
    // 🚀 THIS IS THE MAGIC LINE: It hides Wallets, Google, Twitter, etc. on the login modal
    loginMethods: ['email'],
    
    appearance: {
      theme: 'light',
      accentColor: '#2563eb', // Your blue theme color
      showWalletLoginFirst: false,
    },
  }}
>
  <App />
</PrivyProvider>
  </React.StrictMode>,
);