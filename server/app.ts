import express from 'express';
import cors from 'cors';
import { getRemainingCredits } from './middleware';
import apiRouter from './api';

const app = express();

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

// API endpoint to get remaining credits
app.get('/api/credits', getRemainingCredits);

app.use('/api', apiRouter);

// Global error handler for API routes to ensure JSON response
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use('/api', (err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});

export default app;
