import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import app from './server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Export app for Vercel (though api/index.ts is preferred)
export default app;

async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);
  
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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
    const distPath = path.resolve(__dirname, 'dist');
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
