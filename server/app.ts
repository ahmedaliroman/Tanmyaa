import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getRemainingCredits } from './middleware.js';
import apiRouter from './api.js';
import openaiRouter from './openai.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.set('trust proxy', true);
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api', apiRouter);
app.use('/api', openaiRouter);
app.get('/api/credits', getRemainingCredits);
app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('SERVER ERROR:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
export default app;
