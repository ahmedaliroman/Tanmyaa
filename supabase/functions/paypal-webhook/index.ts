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
    const payload = await req.json()
    const eventType = payload.event_type

    console.log(`Received PayPal Webhook: ${eventType}`)

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'PAYMENT.SALE.COMPLETED') {
      const resource = payload.resource
      const customId = resource.custom_id
      const paypalId = resource.id

      if (!customId) {
        console.error('No custom_id found in webhook payload')
        return new Response('No custom_id', { status: 200 })
      }

      const { userId, plan } = JSON.parse(customId)

      if (!userId || !plan) {
        console.error('Invalid custom_id data', { userId, plan })
        return new Response('Invalid custom_id', { status: 200 })
      }

      // Update Supabase
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
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching profile:', fetchError)
        return new Response('Error fetching profile', { status: 200 })
      }

      const newCredits = (profile?.credits || 0) + creditsToAdd

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan: plan,
          credits: newCredits,
          subscription_status: 'active',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          paypal_subscription_id: paypalId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return new Response('Error updating profile', { status: 200 })
      }

      // Log usage history
      await supabase.from('usage_history').insert({
        user_id: userId,
        description: `Purchased ${plan} Plan (via Webhook: ${eventType})`,
        credits_used: -creditsToAdd
      })

      console.log(`Successfully updated user ${userId} to ${plan} plan via webhook (${eventType})`)
    } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || eventType === 'BILLING.SUBSCRIPTION.EXPIRED' || eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
      const resource = payload.resource
      const customId = resource.custom_id

      if (customId) {
        const { userId } = JSON.parse(customId)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const status = eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED' ? 'past_due' : 'inactive'

        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
        
        console.log(`User ${userId} subscription ${eventType} - Status set to ${status}`)
      }
    }

    return new Response('Webhook received', { status: 200 })

  } catch (error) {
    console.error('Error in paypal-webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
