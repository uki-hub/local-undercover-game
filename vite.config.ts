import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.PAGES_BASE || '/local-undercover-game/',
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
      manifest: {
        name: 'Undercover',
        short_name: 'Undercover',
        lang: 'id',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#f4f8fc',
        background_color: '#f4f8fc',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,json,webmanifest,svg,webp,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/\/words\//, /\/assets\//],
      },
    }),
  ],
})
