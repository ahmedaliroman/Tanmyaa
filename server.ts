import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// In-memory store for generation counts
const ipGenerationCount: Record<string, number> = {};
const GENERATION_LIMIT = 20;

app.use(express.json());
app.set('trust proxy', true);

// API endpoint to get remaining credits
app.get('/api/credits', (req, res) => {
  const ip = req.ip;
  const count = ipGenerationCount[ip] || 0;
  const remaining = GENERATION_LIMIT - count;
  res.json({ remaining: Math.max(0, remaining) });
});

// Middleware to check and decrement credits before generation
const checkCredits = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip;
    const count = ipGenerationCount[ip] || 0;

    if (count >= GENERATION_LIMIT) {
        return res.status(429).json({ error: 'Generation limit reached.' });
    }

    ipGenerationCount[ip] = count + 1;
    console.log(`IP ${ip} has ${GENERATION_LIMIT - (count + 1)} generations remaining.`);
    next();
};

import apiRouter from './server/api';

app.use('/api', checkCredits, apiRouter);

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
