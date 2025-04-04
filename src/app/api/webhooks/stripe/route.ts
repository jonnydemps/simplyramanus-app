import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleWebhookEvent } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';
    
    // Verify webhook signature
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { message: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
    
    // Handle the event
    const { success, paymentIntent } = await handleWebhookEvent(event);
    
    if (event.type === 'payment_intent.succeeded' && paymentIntent) {
      // Update formulation payment status
      const { error: formulationError } = await supabase
        .from('formulations')
        .update({
          payment_status: 'paid',
        })
        .eq('payment_id', paymentIntent.id);
      
      if (formulationError) {
        console.error('Formulation update error:', formulationError);
      }
      
      // Update payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'succeeded',
        })
        .eq('stripe_payment_id', paymentIntent.id);
      
      if (paymentError) {
        console.error('Payment record update error:', paymentError);
      }
    } else if (event.type === 'payment_intent.payment_failed' && paymentIntent) {
      // Update payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
        })
        .eq('stripe_payment_id', paymentIntent.id);
      
      if (paymentError) {
        console.error('Payment record update error:', paymentError);
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
