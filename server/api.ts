import { Router } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const router = Router();

// Lazy initialize Supabase client
let supabase: SupabaseClient | null = null;

const getSupabase = () => {
    if (!supabase) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!url || !key) {
            console.error('CRITICAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
            throw new Error('Server configuration error: Missing database credentials.');
        }
        
        try {
            supabase = createClient(url, key);
        } catch (e) {
            console.error('Failed to initialize Supabase client:', e);
            throw new Error('Database connection error.');
        }
    }
    return supabase;
};

router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        env: {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasGeminiKey: !!process.env.GEMINI_API_KEY,
            nodeEnv: process.env.NODE_ENV
        }
    });
});

router.post('/deduct-credits', async (req, res) => {
    try {
        const client = getSupabase();
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header is required.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token || token === 'undefined' || token === 'null') {
            return res.status(401).json({ error: 'Invalid or missing authentication token.' });
        }
        
        const { data: authData, error: authError } = await client.auth.getUser(token);
        
        if (authError || !authData?.user) {
            console.error('Supabase Auth Error in deduct-credits:', {
                message: authError?.message,
                status: authError?.status,
                code: authError?.code
            });
            return res.status(401).json({ 
                error: 'Invalid JWT', 
                message: authError?.message || 'Token verification failed' 
            });
        }
        const user = authData.user;

        const { amount, description, fileUrl, type } = req.body;
        if (!amount || typeof amount !== 'number') {
            return res.status(400).json({ error: 'Invalid credit amount.' });
        }

        // Fetch current credits and total_credits_used
        const { data: initialProfile, error: fetchError } = await client
            .from('profiles')
            .select('credits, total_credits_used')
            .eq('id', user.id)
            .maybeSingle();
        
        let profile = initialProfile;

        if (fetchError) {
            console.error('Failed to fetch profile for user:', user.id, fetchError);
            return res.status(500).json({ 
                error: 'Failed to fetch user profile.',
                details: fetchError.message,
                hint: 'Ensure the "profiles" table exists in your Supabase database. Run the SQL in supabase/schema.sql.'
            });
        }

        // If profile doesn't exist, create it (safety net for trigger)
        if (!profile) {
            console.log(`Profile missing for user ${user.id}, creating one...`);
            const { data: newProfile, error: insertError } = await client
                .from('profiles')
                .upsert({ 
                    id: user.id, 
                    email: user.email, 
                    credits: 100, 
                    total_credits_used: 0,
                    plan: 'Free'
                }, { onConflict: 'id' })
                .select('credits, total_credits_used')
                .single();
            
            if (insertError) {
                console.error('Failed to create/upsert profile:', insertError);
                return res.status(500).json({ 
                    error: 'Failed to create user profile.',
                    details: insertError.message,
                    code: insertError.code,
                    hint: 'If this is an RLS error, ensure you are using the SERVICE_ROLE_KEY on the server.'
                });
            }
            profile = newProfile;
        }

        if (profile.credits < amount) {
            return res.status(403).json({ error: 'Insufficient credits.' });
        }

        // Deduct credits and increment total_credits_used
        const { error: updateError } = await client
            .from('profiles')
            .update({ 
                credits: profile.credits - amount,
                total_credits_used: (profile.total_credits_used || 0) + amount
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Failed to update credits for user:', user.id, updateError);
            return res.status(500).json({ error: 'Failed to deduct credits.' });
        }

        // Record usage history
        if (description) {
            const { error: historyError } = await client
                .from('usage_history')
                .insert({
                    user_id: user.id,
                    description: description,
                    credits_used: amount,
                    file_url: fileUrl,
                    type: type
                });
            
            if (historyError) {
                console.error('Failed to record usage history:', historyError);
                // We don't return error here as credits were already deducted
            }
        }

        res.json({ success: true, remainingCredits: profile.credits - amount });
    } catch (error) {
        console.error('Failed to deduct credits:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error.' });
    }
});

router.get('/usage-history', async (req, res) => {
    try {
        const client = getSupabase();
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header is required.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token || token === 'undefined' || token === 'null') {
            return res.status(401).json({ error: 'Invalid or missing authentication token.' });
        }

        const { data: authData, error: authError } = await client.auth.getUser(token);
        const user = authData?.user;

        if (authError || !user) {
            console.error('Supabase Auth Error fetching usage history:', {
                message: authError?.message,
                status: authError?.status,
                code: authError?.code
            });
            return res.status(401).json({ 
                error: 'Invalid JWT', 
                message: authError?.message || 'Token verification failed' 
            });
        }

        const { data, error } = await client
            .from('usage_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error fetching usage history for user:', user.id, error);
            return res.status(500).json({ 
                error: 'Failed to fetch usage history.',
                details: error.message,
                hint: 'Ensure the "usage_history" table exists and has correct RLS policies.'
            });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Unexpected error fetching usage history:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error.' });
    }
});

export default router;

