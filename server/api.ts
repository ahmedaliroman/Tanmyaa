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
        
        supabase = createClient(url, key);
    }
    return supabase;
};

router.post('/deduct-credits', async (req, res) => {
    try {
        const client = getSupabase();
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header is required.' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await client.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }

        const { amount } = req.body;
        if (!amount || typeof amount !== 'number') {
            return res.status(400).json({ error: 'Invalid credit amount.' });
        }

        // Fetch current credits
        const { data: profile, error: fetchError } = await client
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (fetchError || !profile) {
            console.error('Failed to fetch profile for user:', user.id, fetchError);
            return res.status(500).json({ error: 'Failed to fetch user profile.' });
        }

        if (profile.credits < amount) {
            return res.status(403).json({ error: 'Insufficient credits.' });
        }

        // Deduct credits
        const { error: updateError } = await client
            .from('profiles')
            .update({ credits: profile.credits - amount })
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
        if (plan === 'Pro') creditsToAdd = 1000;
        else if (plan === 'Business') creditsToAdd = 5000;
        else if (plan === 'Trial') creditsToAdd = 100;

        // Fetch current credits
        const { data: profile, error: fetchError } = await client
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            console.error('Failed to fetch profile for user during payment:', userId, fetchError);
            return res.status(500).json({ error: 'Failed to fetch user profile.' });
        }

        // Update credits
        const { error: updateError } = await client
            .from('profiles')
            .update({ credits: profile.credits + creditsToAdd })
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

