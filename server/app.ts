import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getRemainingCredits } from './middleware.js';
import apiRouter from './api.js';

const app = express();

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api', apiRouter);
app.get('/api/credits', getRemainingCredits);

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
