import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Merge with process.env to ensure Vercel's variables are included during build
    const VERTEX_API_KEY = env.VERTEX_API_KEY || process.env.VERTEX_API_KEY;
    const GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const API_KEY = env.API_KEY || process.env.API_KEY;
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      plugins: [react()],
      build: {
        chunkSizeWarningLimit: 2000,
      },
      envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
      define: {
        'process.env.VERTEX_API_KEY': JSON.stringify(VERTEX_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.API_KEY': JSON.stringify(API_KEY),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'global': 'globalThis',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});