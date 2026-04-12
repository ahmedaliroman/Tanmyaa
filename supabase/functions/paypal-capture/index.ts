import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { // null لأن 204 مش محتاجة Body
      status: 204, 
      headers: corsHeaders 
    })
  }

  try {
    const { orderID, plan, userId } = await req.json()

    if (!orderID || !plan || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 1. Get PayPal Access Token
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const mode = Deno.env.get('PAYPAL_MODE') || 'sandbox'
    const paypalApi = mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'

    console.log(`Using PayPal API: ${paypalApi} (Mode: ${mode})`);

    const auth = btoa(`${clientId}:${clientSecret}`)
    const tokenResponse = await fetch(`${paypalApi}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('Failed to get PayPal access token:', tokenError);
      throw new Error(`PayPal Auth Failed: ${tokenError}`);
    }

    const { access_token } = await tokenResponse.json()
    console.log('PayPal access token obtained.');

    // 2. Capture the Order
    console.log(`Capturing order: ${orderID}`);
    const captureResponse = await fetch(`${paypalApi}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    const captureData = await captureResponse.json()
    console.log('Capture response status:', captureResponse.status);
    console.log('Capture response data:', JSON.stringify(captureData));

    if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
      const errorMsg = captureData.message || captureData.name || `Status: ${captureData.status}`;
      console.error('Payment capture failed or not completed:', errorMsg);
      return new Response(JSON.stringify({ 
        error: `Payment failed: ${errorMsg}`, 
        details: captureData,
        paypal_debug_id: captureResponse.headers.get('paypal-debug-id')
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: captureResponse.ok ? 400 : captureResponse.status,
      })
    }

    // 3. Update Supabase
    console.log(`Updating Supabase for user: ${userId}, plan: ${plan}`);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate credits and dates
    let creditsToAdd = 0
    if (plan === 'Pro') creditsToAdd = 600
    else if (plan === 'Business') creditsToAdd = 3000

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    // Get current credits
    console.log('Fetching current user profile...');
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      throw fetchError;
    }

    const newCredits = (profile?.credits || 0) + creditsToAdd
    console.log(`New credits calculated: ${newCredits}`);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: plan,
        credits: newCredits,
        subscription_status: 'active',
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        paypal_subscription_id: orderID,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    console.log('Profile updated successfully.');

    // 4. Log usage history
    console.log('Inserting usage history...');
    const { error: historyError } = await supabase.from('usage_history').insert({
      user_id: userId,
      description: `Purchased ${plan} Plan`,
      credits_used: -creditsToAdd // Negative means credits added
    })

    if (historyError) {
      console.error('Error inserting usage history:', historyError);
      // We don't throw here to avoid failing the whole process if just history fails
    }

    return new Response(JSON.stringify({ success: true, newCredits }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in paypal-capture:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
