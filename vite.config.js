```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      // Keep development server on the normal Vite module graph.
      // This prevents an old service worker from serving stale bundles.
      devOptions: {
        enabled: false
      },

      // Service worker / Workbox configuration
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,

        // Clean up old caches after new deployments
        cleanupOutdatedCaches: true,

        // Allow SPA routes such as /admin, /tracker, etc.
        navigateFallback: '/index.html',

        // Don't cache API responses from Supabase as static assets.
        navigateFallbackDenylist: [
          /^\/api\//
        ]
      },

      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg'
      ],

      manifest: {
        id: '/',
        name: 'AirdropSailor',
        short_name: 'Sailor',

        description:
          'Track, research and farm the best Web3 airdrop opportunities.',

        start_url: '/',
        scope: '/',

        // Makes the website behave like an installed application.
        display: 'standalone',

        // Better desktop PWA window behavior where supported.
        display_override: [
          'window-controls-overlay',
          'standalone',
          'minimal-ui'
        ],

        orientation: 'any',

        theme_color: '#1A45D1',
        background_color: '#ffffff',

        categories: [
          'productivity',
          'finance',
          'utilities'
        ],

        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],

        screenshots: [
          {
            src: 'screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'AirdropSailor desktop dashboard'
          },
          {
            src: 'screenshot-mobile.png',
            sizes: '750x1334',
            type: 'image/png',
            label: 'AirdropSailor mobile dashboard'
          }
        ]
      }
    })
  ]
})
```
