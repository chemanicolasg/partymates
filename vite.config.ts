import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PartyMates',
        short_name: 'PartyMates',
        description: 'Math adventure worlds for kids · Mons d’aventures matemàtiques · Mundos de aventuras matemáticas',
        theme_color: '#2b1b6b',
        background_color: '#2b1b6b',
        display: 'standalone',
        orientation: 'any',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // The cloud client is only fetched when classes are online, so it stays out of the offline bundle.
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], globIgnores: ['**/supabase-*.js'] },
    }),
  ],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
