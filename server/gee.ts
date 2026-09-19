import { Router } from 'express';

const router = Router();

// Geographic analysis is intentionally disabled. The application uses OpenAI,
// Supabase, and PayPal only; no external earth-observation provider is required.
router.post('/analyze', (_req, res) => {
  res.status(501).json({
    error: 'Geographic analysis is not configured for this deployment.',
  });
});

export default router;
