import express from 'express';

// In-memory store for generation counts
// Note: In a serverless environment like Vercel, this in-memory store will be reset frequently.
// For persistent rate limiting, consider using Redis (e.g., Vercel KV) or a database.
const ipGenerationCount: Record<string, number> = {};
const GENERATION_LIMIT = 20;

export const checkCredits = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // In Vercel, req.ip might be the proxy IP. x-forwarded-for is better.
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const count = ipGenerationCount[ip] || 0;

    if (count >= GENERATION_LIMIT) {
        return res.status(429).json({ error: 'Generation limit reached.' });
    }

    ipGenerationCount[ip] = count + 1;
    console.log(`IP ${ip} has ${GENERATION_LIMIT - (count + 1)} generations remaining.`);
    next();
};

export const getRemainingCredits = (req: express.Request, res: express.Response) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const count = ipGenerationCount[ip] || 0;
    const remaining = GENERATION_LIMIT - count;
    res.json({ remaining: Math.max(0, remaining) });
};
