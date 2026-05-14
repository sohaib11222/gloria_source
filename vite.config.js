import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Use /source/ base path in production, empty in development
  const base = mode === 'production' ? '/source/' : '/'
  
  return {
    base,
    plugins: [react(),
    tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          // Allow long-running POSTs (e.g. Fetch & Store → Gloria av.php) without proxy cutting the connection early
          timeout: 180000,
          proxyTimeout: 180000,
        },
        // Same host as API: static vehicle images (not under /api)
        '/uploads': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
