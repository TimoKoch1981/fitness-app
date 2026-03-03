import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: './', // Required for Capacitor (file:// protocol)
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt', // User decides when to update
      includeAssets: ['favicon.ico', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: false, // Use public/manifest.json directly
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        runtimeCaching: [
          {
            // Supabase REST API — network-first with fallback to cache
            urlPattern: /\/rest\/v1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Static assets (fonts, images) — cache-first
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    assetsInlineLimit: 4096, // Inline small assets < 4KB as base64
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Only split node_modules into named vendor chunks.
          // Using a function prevents Rollup from statically linking
          // heavy vendor chunks (pdf, charts) into the entry point.
          if (!id.includes('node_modules')) return;

          // Sentry — monitoring (must be checked before React to avoid false match)
          if (id.includes('/@sentry/')) return 'vendor-sentry';
          // Core React runtime — always needed
          if (id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/react-router-dom/') ||
              id.includes('/node_modules/react-router/') ||
              id.includes('/node_modules/scheduler/') ||
              /\/node_modules\/react\//.test(id)) {
            return 'vendor-react';
          }
          // Supabase — needed for auth on every page
          if (id.includes('/@supabase/')) return 'vendor-supabase';
          // Charts (recharts + d3) and PDF (jspdf) are NOT manually chunked.
          // They are only used by lazy-loaded pages and Rollup will naturally
          // split them into the page chunks or shared lazy chunks.
          // UI animation + Radix
          if (id.includes('/framer-motion/')) return 'vendor-motion';
          if (id.includes('/@radix-ui/')) return 'vendor-radix';
          // Data fetching + forms
          if (id.includes('/@tanstack/') || id.includes('/react-hook-form/') ||
              id.includes('/@hookform/')) return 'vendor-data';
          // Heavy media libs — lazy loaded per feature
          if (id.includes('/html2canvas/')) return 'vendor-canvas';
          if (id.includes('/html5-qrcode/')) return 'vendor-barcode';
          if (id.includes('/react-markdown/') || id.includes('/remark-') ||
              id.includes('/rehype-') || id.includes('/unified/') ||
              id.includes('/micromark') || id.includes('/mdast-')) return 'vendor-markdown';
          if (id.includes('/qrcode.react/')) return 'vendor-qr';
          // Utilities
          if (id.includes('/date-fns/')) return 'vendor-datefns';
          if (id.includes('/zod/')) return 'vendor-zod';
          if (id.includes('/browser-image-compression/')) return 'vendor-image';
          if (id.includes('/lucide-react/')) return 'vendor-icons';
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true, // Allow network access for mobile testing
    proxy: {
      // Open Food Facts search-a-licious API (no CORS headers → proxy needed)
      '/api/off-search': {
        target: 'https://search.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/off-search/, ''),
      },
      // Open Food Facts V1 API (slow + CORS issues → proxy for reliability)
      '/api/off-v1': {
        target: 'https://world.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/off-v1/, ''),
      },
    },
  },
});
