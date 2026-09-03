import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'PictoApp',
        short_name: 'Picto',
        description: 'Application de communication par pictogrammes pour enfants TSA',
        theme_color: '#7C3AED',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'fr',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // Ne concerne plus que les pictogrammes hors vocabulaire par défaut
          // (résultats de recherche ARASAAC) : ceux du vocabulaire par défaut
          // sont embarqués dans public/pictograms/ et précachés via globPatterns,
          // donc jamais purgés par l'expiration ci-dessous.
          {
            urlPattern: /^https:\/\/static\.arasaac\.org\/pictograms\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'arasaac-images',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.arasaac\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'arasaac-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
