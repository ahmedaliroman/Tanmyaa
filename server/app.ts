import express from 'express';
import { checkCredits, getRemainingCredits } from './middleware';
import apiRouter from './api';

const app = express();

app.use(express.json());
app.set('trust proxy', true);

// API endpoint to get remaining credits
app.get('/api/credits', getRemainingCredits);

app.use('/api', checkCredits, apiRouter);

export default app;
