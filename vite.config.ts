import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Merge with process.env to ensure Vercel's variables are included during build
    const GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      plugins: [react()],
      build: {
        chunkSizeWarningLimit: 3000,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
                if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('docx') || id.includes('pptxgenjs')) return 'vendor-utils';
                if (id.includes('leaflet')) return 'vendor-maps';
                if (id.includes('@google/genai')) return 'vendor-ai';
                return 'vendor';
              }
            }
          }
        }
      },
      envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
      define: {
        'process.env.API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'global': 'globalThis',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
      }
    };
});