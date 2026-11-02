import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import copy from './src/locales/id/common.json'

const base = process.env.PAGES_BASE || '/local-undercover-game/'
export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/'))
            return id.includes('three.core') ? 'three-core' : 'three-renderer'
          if (id.includes('/node_modules/zod/')) return 'validation'
          if (/\/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion'
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
        },
      },
    },
  },
  plugins: [
    react(),
    tailwind(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/apple-touch.png'],
      manifest: {
        name: 'Undercover',
        short_name: 'Undercover',
        id: base,
        description: copy.appDescription,
        categories: ['games', 'entertainment'],
        lang: 'id',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#f4f8fc',
        background_color: '#f4f8fc',
        icons: [
          { src: 'icons/game-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/game-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        clientsClaim: true,
        globPatterns: ['**/*.{html,js,css,json,svg,webp,woff2,mp3}'],
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/\/words\//, /\/assets\//],
      },
    }),
  ],
})
