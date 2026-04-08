import { Router } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const router = Router();

// Lazy initialize Resend client
let resend: Resend | null = null;
const getResend = () => {
    if (!resend) {
        const key = process.env.RESEND_API_KEY;
        if (!key) {
            console.warn('RESEND_API_KEY is missing. Emails will not be sent.');
            return null;
        }
        resend = new Resend(key);
    }
    return resend;
};

const sendConfirmationEmail = async (email: string, plan: string, credits: number, endDate: string) => {
    const client = getResend();
    if (!client) return;

    try {
        const formattedDate = new Date(endDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        await client.emails.send({
            from: 'Tanmyaa <billing@tanmyaa.com>',
            to: email,
            subject: `Subscription Confirmed: ${plan} Plan`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
                    <h1 style="color: #2563eb; margin-bottom: 24px;">Subscription Confirmed!</h1>
                    <p style="font-size: 16px; color: #475569; line-height: 1.5;">
                        Thank you for subscribing to the <strong>${plan}</strong> plan on Tanmyaa. Your account has been successfully upgraded.
                    </p>
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                        <h2 style="font-size: 18px; color: #1e293b; margin-top: 0;">Subscription Details</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Plan</td>
                                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${plan}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Credits Added</td>
                                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #10b981;">+${credits}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Next Billing Date</td>
                                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formattedDate}</td>
                            </tr>
                        </table>
                    </div>
                    <p style="font-size: 14px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                        If you have any questions, please reply to this email or contact our support team at support@tanmyaa.com.
                    </p>
                    <p style="font-size: 12px; color: #cbd5e1; text-align: center; margin-top: 24px;">
                        &copy; ${new Date().getFullYear()} Tanmyaa. All rights reserved.
                    </p>
                </div>
            `
        });
        console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send confirmation email:', error);
    }
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

    // Send confirmation email
    const { data: userData } = await client.auth.admin.getUserById(userId);
    if (userData?.user?.email) {
        sendConfirmationEmail(userData.user.email, plan, creditsToAdd, endDate.toISOString());
    }
};

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

// PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');
const PAYPAL_API_BASE = PAYPAL_MODE === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

const getPayPalAccessToken = async () => {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error('PayPal credentials (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET) are missing in environment variables.');
    }

    console.log(`Attempting PayPal Auth in ${PAYPAL_MODE} mode...`);
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    if (!data.access_token) {
        console.error(`PayPal Auth Failed (${PAYPAL_MODE} mode):`, data);
        throw new Error(`PayPal Authentication failed. Ensure your Client ID and Secret match the ${PAYPAL_MODE} environment.`);
    }
    return data.access_token;
};

router.post('/paypal/generate-client-token', async (req, res) => {
    try {
        const access_token = await getPayPalAccessToken();

        const response = await fetch(`${PAYPAL_API_BASE}/v1/identity/generate-token`, {
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
        
        // Define prices on the server to prevent manipulation
        let amount = "0.00";
        if (plan === 'Pro') amount = "19.00";
        else if (plan === 'Business') amount = "49.00";
        else if (plan === 'Trial') amount = "1.00";
        else return res.status(400).json({ error: 'Invalid plan selected.' });

        const access_token = await getPayPalAccessToken();

        const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
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
        if (!orderID || !plan) return res.status(400).json({ error: 'Missing required parameters.' });

        const access_token = await getPayPalAccessToken();

        // 1. Capture the Order
        const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        });

        const captureData = await captureResponse.json();

        if (captureData.status !== 'COMPLETED') {
            return res.status(400).json({ 
                error: 'Payment not completed.', 
                status: captureData.status,
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

router.post('/paypal/webhook', async (req, res) => {
    // Basic webhook handler to acknowledge PayPal events
    // In production, you should verify the webhook signature
    console.log('PayPal Webhook Received:', req.body.event_type);
    res.status(200).send('OK');
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

