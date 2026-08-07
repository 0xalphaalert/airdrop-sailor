import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    
    VitePWA({
      registerType: 'autoUpdate',
      // 🚀 1. ADD THIS BLOCK TO ENABLE PWA ON LOCALHOST:5173
      devOptions: {
        enabled: true
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, 
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        id: '/', // 🚀 Fixes the "Computed App ID" warning
        name: 'AirdropSailor',
        short_name: 'Sailor',
        description: 'Track and farm the best airdrop opportunities.',
        theme_color: '#1A45D1',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        // 🚀 Fixes the "Richer PWA Install UI" warnings
        screenshots: [
          {
            src: 'screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'screenshot-mobile.png',
            sizes: '750x1334',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})