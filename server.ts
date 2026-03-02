import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import app from './server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Export app for Vercel (though api/index.ts is preferred)
export default app;

async function startServer() {
  // Only start the server if this file is run directly (not imported)
  if (import.meta.url === `file://${process.argv[1]}`) {
      // Vite middleware for development
      if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);

        // Explicit fallback for SPA routing in development
        app.use(async (req, res, next) => {
            const url = req.originalUrl;
            // Skip API routes
            if (url.startsWith('/api')) {
                return next();
            }
            try {
                let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
                template = await vite.transformIndexHtml(url, template);
                res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
            } catch (e) {
                vite.ssrFixStacktrace(e as Error);
                next(e);
            }
        });
      } else {
        // In production, serve the static files
        app.use(express.static(path.resolve(__dirname, 'dist')));
        app.get('(.*)', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
        });
      }

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
  }
}

startServer();
