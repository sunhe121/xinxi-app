import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  root: 'client',
  base: process.env.CLIENT_BASE_PATH || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@client': path.resolve(__dirname, 'client'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  define: {
    'import.meta.env.CLIENT_BASE_PATH': JSON.stringify(process.env.CLIENT_BASE_PATH || '/'),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    target: 'es2015',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') && !id.includes('react-router') && !id.includes('react-hook-form') && !id.includes('react-day-picker') && !id.includes('react-error-boundary') && !id.includes('react-resizable-panels') && !id.includes('react-markdown')) {
              return 'react-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            if (id.includes('framer-motion') || id.includes('sonner') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('echarts') || id.includes('recharts') || id.includes('zrender')) {
              return 'chart-vendor';
            }
            if (id.includes('axios') || id.includes('dayjs') || id.includes('lodash')) {
              return 'utils-vendor';
            }
            if (id.includes('@radix-ui') || id.includes('radix-ui') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('tailwindcss')) {
              return 'base-vendor';
            }
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
});
