import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env vars for the current mode (development / production)
  const env = loadEnv(mode, process.cwd(), '');

  const backendUrl = env.VITE_API_URL || 'https://prepgenuis.onrender.com';

  return {
    plugins: [react()],

    server: {
      port: 5173,
      host:true,
      // In dev, proxy /api and /uploads to the backend so CORS is avoided
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: backendUrl.startsWith('https'),
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
          secure: backendUrl.startsWith('https'),
        },
      },
    },

    build: {
      // Sourcemaps off in production for smaller bundle
      sourcemap: false,
      rollupOptions: {
        output: {
          // Split vendor chunks for better caching
          manualChunks: {
            vendor:  ['react', 'react-dom', 'react-router-dom'],
            charts:  ['chart.js', 'react-chartjs-2'],
            editor:  ['@monaco-editor/react'],
          },
        },
      },
    },
  };
});
