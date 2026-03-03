import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0', // Keep this, it makes the server listen on all network interfaces
        allowedHosts: [
          'tanmyaa-190633558218.europe-west1.run.app', // Explicitly add your Cloud Run domain
          'localhost', // For local development
          '127.0.0.1'  // For local development
          // You might also add the IP address of your Cloud Run instance if accessible, though the domain is usually sufficient.
        ],
      },
      plugins: [react()],
      envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
