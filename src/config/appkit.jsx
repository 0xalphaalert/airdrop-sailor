import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base } from '@reown/appkit/networks';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Reown Project ID
const projectId = 'f3cd1689c6d73d6bc392713c839ec68f';

// Only Base network
const networks = [base];

// App metadata
const metadata = {
  name: 'Airdrop Sailor',
  description: 'Track crypto airdrops, projects and opportunities.',
  url: 'https://www.airdropsailor.xyz',
  icons: [
    'https://ptobheftxcjiqobxgeal.supabase.co/storage/v1/object/public/Illustrations/airdropsailorlogo.jpg'
  ]
};

// React Query client
const queryClient = new QueryClient();

// Create Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId
});

// Create Reown AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  defaultNetwork: base,
  features: {
    analytics: true
  }
});

// Provider wrapper
export function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}