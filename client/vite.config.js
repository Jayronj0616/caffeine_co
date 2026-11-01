import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Vendor libraries change far less often than app code, so giving
        // them their own chunks keeps them cached across deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
          if (/node_modules\/(react-router|react-router-dom|@remix-run|cookie|set-cookie-parser)\//.test(id)) return 'vendor-router';
          if (id.includes('node_modules/@supabase/')) return 'vendor-supabase';
          if (id.includes('node_modules/sweetalert2/')) return 'vendor-swal';
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000'
    }
  }
})
