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

const updateCreditsAfterPayment = async (userId: string, plan: string) => {
    const client = getSupabase();
    
    let creditsToAdd = 0;
    if (plan === 'Pro') creditsToAdd = 600;
    else if (plan === 'Business') creditsToAdd = 3000;
    else if (plan === 'Trial') creditsToAdd = 100;

    // Fetch current credits
    const { data: profile, error: fetchError } = await client
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .maybeSingle();

    if (fetchError) {
        console.error('Failed to fetch profile during credit update:', fetchError);
        return;
    }

    const currentCredits = Number(profile?.credits) || 0;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const { error: updateError } = await client
        .from('profiles')
        .update({ 
            credits: currentCredits + creditsToAdd,
            plan: plan,
            subscription_status: 'active',
            subscription_start_date: startDate.toISOString(),
            subscription_end_date: endDate.toISOString()
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Failed to update credits after payment:', updateError);
        return;
    }
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

// PayPal Configuration - Simplified and Robust
const getPayPalConfig = () => {
    // Priority: Environment Variables (Secrets)
    const id = (process.env.PAYPAL_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');
    const secret = (process.env.PAYPAL_CLIENT_SECRET || '').trim().replace(/^["']|["']$/g, '');
    const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
    const base = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    
    return { id, secret, mode, base };
};

// Masked config for logging
console.log(`[PayPal] Integration Ready.`);

router.get('/paypal/config', (req, res) => {
    const { id, mode, secret } = getPayPalConfig();
    
    // Diagnostic info (safe to expose)
    const diagnostics = {
        clientIdLength: id.length,
        secretLength: secret.length,
        clientIdStart: id.substring(0, 8),
        secretStart: secret.substring(0, 4),
        areIdentical: id === secret && id.length > 0,
        mode: mode
    };

    res.json({ 
        clientId: id, 
        mode: mode,
        configured: id.length > 0 && secret.length > 0,
        diagnostics
    });
});

const getPayPalAccessToken = async () => {
    const { id, secret, mode, base } = getPayPalConfig();

    if (!id || !secret) {
        throw new Error(`PayPal credentials missing. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your app secrets.`);
    }

    if (id === secret && id.length > 0) {
        throw new Error("CRITICAL: Your PayPal Client ID and Secret are IDENTICAL. You likely pasted the Client ID into both fields in the Secrets menu. Please go to Settings > Secrets and update PAYPAL_CLIENT_SECRET with the correct (shorter) value.");
    }

    const auth = Buffer.from(`${id}:${secret}`).toString('base64');
    
    // Use URLSearchParams for robust body encoding
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');

    const response = await fetch(`${base}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    const data = await response.json();
    
    if (!data.access_token) {
        console.error(`[PayPal] AUTH FAILURE (${mode} mode):`, JSON.stringify(data, null, 2));
        
        let troubleshooting = "";
        if (data.error === 'invalid_client') {
            troubleshooting = `\n\nTROUBLESHOOTING STEPS:\n1. You are in ${mode.toUpperCase()} mode. Ensure your keys are from the ${mode.toUpperCase()} tab in PayPal.\n2. Your Client ID starts with "${id.substring(0, 8)}" and is ${id.length} characters long.\n3. Your Secret starts with "${secret.substring(0, 4)}" and is ${secret.length} characters long.`;
            
            if (secret.length === 80) {
                troubleshooting += `\n4. ⚠️ WARNING: Your Secret is 80 characters long. Sandbox Secrets are usually 40-50 chars. You likely pasted a Client ID by mistake!`;
            } else if (secret.length === 0) {
                troubleshooting += `\n4. ⚠️ WARNING: Your Secret is EMPTY. Please set PAYPAL_CLIENT_SECRET in Settings > Secrets.`;
            }
            
            if (secret.startsWith('EEvQ')) {
                troubleshooting += `\n5. If the Secret starts with "EEvQ", that is a default/old value or a Client ID.`;
            }
            
            troubleshooting += `\n6. Check if you accidentally put the same value in both fields.\n7. Ensure you are using a "REST API App" from developer.paypal.com.`;
        }

        throw new Error(`PayPal Auth Failed: ${data.error_description || data.error || 'Invalid Credentials'}. Mode: ${mode}.${troubleshooting}`);
    }
    
    return data.access_token;
};

router.post('/paypal/generate-client-token', async (req, res) => {
    try {
        const { base } = getPayPalConfig();
        const access_token = await getPayPalAccessToken();

        const response = await fetch(`${base}/v1/identity/generate-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        res.json({ client_token: data.client_token });
    } catch (error) {
        console.error('PayPal Client Token Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error.' });
    }
});

router.post('/paypal/create-order', async (req, res) => {
    try {
        const { plan } = req.body;
        const { base } = getPayPalConfig();
        
        // Define prices on the server to prevent manipulation
        let amount = "0.00";
        if (plan === 'Pro') amount = "19.00";
        else if (plan === 'Business') amount = "49.00";
        else if (plan === 'Trial') amount = "1.00";
        else return res.status(400).json({ error: 'Invalid plan selected.' });

        const access_token = await getPayPalAccessToken();

        const response = await fetch(`${base}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'EUR',
                        value: amount
                    },
                    description: `${plan} Plan Subscription`
                }],
                application_context: {
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'PAY_NOW'
                }
            })
        });

        const order = await response.json();
        res.json(order);
    } catch (error) {
        console.error('PayPal Create Order Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error.' });
    }
});

router.post('/paypal/capture-order', async (req, res) => {
    try {
        console.log('--- PAYPAL CAPTURE REQUEST RECEIVED ---');
        const client = getSupabase();
        const { base } = getPayPalConfig();
        
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Authorization header is required.' });

        const token = authHeader.split(' ')[1];
        const { data: authData, error: authError } = await client.auth.getUser(token);
        
        if (authError || !authData?.user) {
            return res.status(401).json({ error: 'Invalid JWT' });
        }
        const user = authData.user;

        const { orderID, plan } = req.body;
        console.log(`[PayPal] Attempting capture for OrderID: ${orderID}, Plan: ${plan}, User: ${user.id}`);
        if (!orderID || !plan) return res.status(400).json({ error: 'Missing required parameters.' });

        const access_token = await getPayPalAccessToken();
        console.log(`[PayPal] Access Token obtained (length: ${access_token.length})`);

        // 1. Capture the Order
        const captureResponse = await fetch(`${base}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        });

        const captureData = await captureResponse.json();

        if (captureData.status !== 'COMPLETED') {
            console.error('[PayPal] Capture Failed. Full Response:', JSON.stringify(captureData, null, 2));
            
            const isComplianceViolation = captureData.details?.some((d: { issue?: string }) => d.issue === 'COMPLIANCE_VIOLATION');
            
            return res.status(400).json({ 
                error: isComplianceViolation 
                    ? 'Compliance Violation: This transaction was flagged by PayPal. This often happens in Sandbox if your buyer account is from a restricted region or if the "generated card" is flagged. Please try creating a new Sandbox Personal account (Buyer) in the US region.' 
                    : 'Payment not completed.', 
                status: captureData.status || 'ERROR',
                details: captureData 
            });
        }
        
        // 2. Update Credits in Database
        await updateCreditsAfterPayment(user.id, plan);

        const { data: updatedProfile } = await client
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .maybeSingle();

        res.json({ success: true, newCredits: updatedProfile?.credits || 0 });
    } catch (error) {
        console.error('PayPal Capture Error:', error);
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

