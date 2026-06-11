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
      manifest: {
        name: 'BudgetLens Pakistan',
        short_name: 'بجٹ لینس',
        description: 'AI-Powered Pakistan Federal Budget Explorer',
        theme_color: '#0A1628',
        background_color: '#0A1628',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://placehold.co/192x192/0A1628/00D4FF?text=BL',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'https://placehold.co/512x512/0A1628/00D4FF?text=BL',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
