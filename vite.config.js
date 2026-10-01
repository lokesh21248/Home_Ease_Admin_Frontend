import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://3.107.161.126:8080',
        changeOrigin: true,
      },
      '/upload': {
        target: 'http://3.107.161.126:8080',
        changeOrigin: true,
      },
    },
  },
})
