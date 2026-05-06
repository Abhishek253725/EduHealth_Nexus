import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    
    // ✅ HMR WebSocket fix
    hmr: {
      port: 5173,
      host: 'localhost',
    },

    // ✅ API proxy - CORS issue fix
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true, // ✅ WebSocket proxy
      },
    },
  },
});