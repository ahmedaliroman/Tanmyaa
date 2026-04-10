import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 0. Get User from Auth Header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // Create client with user's token to verify identity
    const token = authHeader.replace('Bearer ', '')
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth Error:', authError)
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const userId = user.id
    const { orderID, plan } = await req.json()

    if (!orderID || !plan) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 1. Get PayPal Access Token
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
    
    if (!clientId || !clientSecret) {
      console.error('PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is not set in Supabase secrets')
      return new Response(JSON.stringify({ error: 'PayPal configuration missing on server' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const paypalApi = Deno.env.get('PAYPAL_MODE') === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'

    console.log(`Using PayPal API: ${paypalApi}`)

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
      const tokenError = await tokenResponse.text()
      console.error('PayPal Token Error:', tokenError)
      return new Response(JSON.stringify({ error: 'Failed to authenticate with PayPal', details: tokenError }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const { access_token } = await tokenResponse.json()

    // 2. Capture the Order
    console.log(`Capturing order: ${orderID}`)
    const captureResponse = await fetch(`${paypalApi}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    const captureData = await captureResponse.json()

    if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
      console.error('PayPal Capture Error:', captureData)
      return new Response(JSON.stringify({ 
        error: 'Payment capture failed', 
        message: captureData.message || 'Payment not completed',
        details: captureData 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 3. Update Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate credits and dates
    let creditsToAdd = 0
    const normalizedPlan = plan.trim()
    if (normalizedPlan === 'Pro') creditsToAdd = 600
    else if (normalizedPlan === 'Business') creditsToAdd = 3000

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    // Get current credits (using maybeSingle to handle missing profiles)
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching profile:', fetchError)
      throw new Error(`Database fetch error: ${fetchError.message}`)
    }

    const currentCredits = profile?.credits || 0
    const newCredits = currentCredits + creditsToAdd

    // Upsert profile to handle cases where it might not exist yet
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        plan: normalizedPlan,
        credits: newCredits,
        subscription_status: 'active',
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        paypal_subscription_id: orderID,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw new Error(`Database update error: ${updateError.message}`)
    }

    // 4. Log usage history
    await supabase.from('usage_history').insert({
      user_id: userId,
      description: `Purchased ${plan} Plan`,
      credits_used: -creditsToAdd // Negative means credits added
    })

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
