import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getRemainingCredits } from './middleware.js';
import apiRouter from './api.js';

const app = express();

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

// Logging middleware
app.use((req, _res, next) => {
    console.log(`[SERVER] ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount API router
app.use('/api', apiRouter);
app.use(apiRouter); // Fallback for different rewrite behaviors

app.get('/api/credits', getRemainingCredits);
app.get('/credits', getRemainingCredits); // Fallback

// Catch-all for unmatched API routes
app.all('/api/*', (req, res) => {
    console.warn(`[SERVER] 404 at ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.url}` });
});

// Global error handler for all routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('SERVER ERROR:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export default app;
