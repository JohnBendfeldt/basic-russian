/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Use existing public/manifest.json instead of generating one
      manifest: false,
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        // Exclude audio index from precache (it's dynamic)
        globIgnores: ['**/audio/index.json'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:mp3|wav|mp4)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'russian-media',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: false,
  },
});
