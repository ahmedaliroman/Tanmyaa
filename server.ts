import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Mock PayPal payment success to increase credits
app.post('/api/paypal/capture-order', (req, res) => {
    const { orderID, plan } = req.body;
    const ip = req.ip;
    
    // In a real app, you'd verify the order with PayPal API here
    console.log(`Captured PayPal order ${orderID} for plan ${plan} from IP ${ip}`);
    
    // Reset or increase credits based on plan
    if (plan === 'Pro') {
        ipGenerationCount[ip] = -400; // Gives 400 + 20 credits
    } else if (plan === 'Business') {
        ipGenerationCount[ip] = -3000; // Gives 3000 + 20 credits
    }
    
    res.json({ status: 'COMPLETED', credits: Math.max(0, GENERATION_LIMIT - (ipGenerationCount[ip] || 0)) });
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

import apiRouter from './server/api.ts';

app.use('/api', checkCredits, apiRouter);

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    
    // Fallback for SPA - use middleware instead of a named route to avoid path-to-regexp issues
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
            res.sendFile(path.resolve(distPath, 'index.html'));
        } else {
            next();
        }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
