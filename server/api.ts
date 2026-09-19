import { Router } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const router = Router();
let supabase: SupabaseClient | null = null;

const getSupabase = () => {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Server configuration error: Missing database credentials.');
    supabase = createClient(url, key);
  }
  return supabase;
};

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: {
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
      hasSupabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      nodeEnv: process.env.NODE_ENV,
    },
  });
});

router.post('/deduct-credits', async (req, res) => {
  try {
    const client = getSupabase();
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header is required.' });
    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') return res.status(401).json({ error: 'Invalid or missing authentication token.' });
    const { data: authData, error: authError } = await client.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token.' });

    const { amount, description, fileUrl, type } = req.body;
    if (!amount || typeof amount !== 'number') return res.status(400).json({ error: 'Invalid credit amount.' });
    const { data: initialProfile, error: fetchError } = await client.from('profiles').select('credits, total_credits_used').eq('id', user.id).maybeSingle();
    if (fetchError) return res.status(500).json({ error: 'Failed to fetch user profile.', details: fetchError.message });
    let profile = initialProfile;
    if (!profile) {
      const { data: newProfile, error: insertError } = await client.from('profiles').upsert({ id: user.id, email: user.email, credits: 100, total_credits_used: 0, plan: 'Free' }, { onConflict: 'id' }).select('credits, total_credits_used').single();
      if (insertError) return res.status(500).json({ error: 'Failed to create user profile.', details: insertError.message });
      profile = newProfile;
    }
    if (profile.credits < amount) return res.status(403).json({ error: 'Insufficient credits.' });
    const { error: updateError } = await client.from('profiles').update({ credits: profile.credits - amount, total_credits_used: (profile.total_credits_used || 0) + amount }).eq('id', user.id);
    if (updateError) return res.status(500).json({ error: 'Failed to deduct credits.' });
    if (description) await client.from('usage_history').insert({ user_id: user.id, description, credits_used: amount, file_url: fileUrl, type });
    return res.json({ success: true, remainingCredits: profile.credits - amount });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error.' });
  }
});

export default router;
