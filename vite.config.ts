import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const openAiApiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  return {
    server: { port: 3000, host: '0.0.0.0', allowedHosts: true },
    plugins: [react()],
    build: { chunkSizeWarningLimit: 2000 },
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'process.env.OPENAI_API_KEY': JSON.stringify(openAiApiKey),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      global: 'globalThis',
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './') },
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    },
  };
});
