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
        
        const { data: { user }, error: authError } = await client.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }

        const { amount } = req.body;
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
            return res.status(500).json({ error: 'Failed to fetch user profile.' });
        }

        // If profile doesn't exist, create it (safety net for trigger)
        if (!profile) {
            console.log(`Profile missing for user ${user.id}, creating one...`);
            const { data: newProfile, error: insertError } = await client
                .from('profiles')
                .insert({ id: user.id, email: user.email, credits: 100, total_credits_used: 0 })
                .select('credits, total_credits_used')
                .single();
            
            if (insertError) {
                console.error('Failed to create missing profile:', insertError);
                return res.status(500).json({ error: 'Failed to create user profile.' });
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

        res.json({ success: true, remainingCredits: profile.credits - amount });
    } catch (error) {
        console.error('Failed to deduct credits:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error.' });
    }
});

router.post('/paypal/capture-order', async (req, res) => {
    try {
        const client = getSupabase();
        const { orderID, plan, userId } = req.body;
        
        if (!orderID || !plan || !userId) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        // In a real app, you would verify the order with PayPal here using their SDK or REST API
        // For this implementation, we assume the client-side capture was successful
        
        let creditsToAdd = 0;
        if (plan === 'Pro') creditsToAdd = 600;
        else if (plan === 'Business') creditsToAdd = 3000;
        else if (plan === 'Trial') creditsToAdd = 100;

        // Fetch current credits
        const { data: initialProfile, error: fetchError } = await client
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .maybeSingle();
        
        let profile = initialProfile;

        if (fetchError) {
            console.error('Failed to fetch profile for user during payment:', userId, fetchError);
            return res.status(500).json({ error: 'Failed to fetch user profile.' });
        }

        // If profile doesn't exist, create it
        if (!profile) {
            console.log(`Profile missing for user ${userId} during payment, creating one...`);
            const { data: newProfile, error: insertError } = await client
                .from('profiles')
                .insert({ id: userId, credits: 0 }) // Start with 0, will add credits below
                .select('credits')
                .single();
            
            if (insertError) {
                console.error('Failed to create missing profile during payment:', insertError);
                return res.status(500).json({ error: 'Failed to create user profile.' });
            }
            profile = newProfile;
        }

        // Update credits and plan
        const currentCredits = Number(profile.credits) || 0;
        const { error: updateError } = await client
            .from('profiles')
            .update({ 
                credits: currentCredits + creditsToAdd,
                plan: plan 
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Failed to update credits for user after payment:', userId, updateError);
            return res.status(500).json({ error: 'Failed to update credits after payment.' });
        }

        res.json({ success: true, newCredits: profile.credits + creditsToAdd });
    } catch (error) {
        console.error('Failed to capture PayPal order:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error.' });
    }
});


export default router;

