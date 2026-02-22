import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: './', // Required for Capacitor (file:// protocol)
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
