import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleWebhookEvent } from '@/lib/stripe'; // handleWebhookEvent likely doesn't need stripe instance itself
import { createServerActionClient } from '@/lib/supabase/server'; // Corrected import path

// REMOVED: Top-level Stripe initialization removed from here
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
//   apiVersion: '2025-03-31.basil',
// });

export async function POST(request: NextRequest) {
  const supabase = createServerActionClient(); // Create server client instance
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // ADDED: Initialize Stripe inside the handler where needed
    // Ensure STRIPE_SECRET_KEY is available in the runtime environment (Vercel env vars)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-03-31.basil', // Use your desired API version
    });

    // Verify webhook signature using the locally initialized stripe instance
    let event: Stripe.Event;

    try {
      // Ensure STRIPE_WEBHOOK_SECRET is available in the runtime environment (Vercel env vars)
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      console.error('Webhook signature verification failed:', message);
      return NextResponse.json(
        { message: `Webhook Error: ${message}` }, // Provide more specific error if possible
        { status: 400 }
      );
    }

    // Handle the event (handleWebhookEvent likely doesn't need a stripe instance passed)
    const { paymentIntent } = await handleWebhookEvent(event);

    // --- Database update logic based on event type ---
    // (Ensure your Supabase logic matches your schema and requirements)
    if (event.type === 'payment_intent.succeeded' && paymentIntent) {
      // Update formulation payment status
      const { error: formulationError } = await supabase
        .from('formulations')
        .update({
          payment_status: 'paid',
        })
        // Corrected: Update formulation based on its ID, not a payment ID column
        // Assuming paymentIntent metadata contains formulationId
        .eq('id', paymentIntent.metadata.formulationId);

      if (formulationError) {
        console.error('Formulation update error on success:', formulationError);
        // Decide if this should prevent a 200 OK response to Stripe
      }

      // Update payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'succeeded', // Use 'succeeded' or 'completed' consistently
        })
        // Corrected: Use the correct column name for the Stripe Payment Intent ID
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (paymentError) {
        console.error('Payment record update error on success:', paymentError);
        // Decide if this should prevent a 200 OK response to Stripe
      }
    } else if (event.type === 'payment_intent.payment_failed' && paymentIntent) {
      // Update payment record status on failure
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
        })
        // Corrected: Use the correct column name for the Stripe Payment Intent ID
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (paymentError) {
        console.error('Payment record update error on failure:', paymentError);
        // Decide if this should prevent a 200 OK response to Stripe
      }
    }
    // --- End Database update logic ---

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { message: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
