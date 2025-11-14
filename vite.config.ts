import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL || 'https://gibqdecjcdyeyxtknbok.supabase.co'
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYnFkZWNqY2R5ZXl4dGtuYm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTMwNzksImV4cCI6MjA3ODMyOTA3OX0.zstQH1P-4pPb2y74LhrH3uSws9I_KkQ55mPRAR0up84'
      ),
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
        },
      },
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
  };
});
