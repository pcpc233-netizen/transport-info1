import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/bus': {
        target: 'http://ws.bus.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bus/, '/api/rest'),
      },
    },
  },
});
