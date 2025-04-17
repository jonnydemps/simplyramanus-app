import { NextRequest, NextResponse } from 'next/server';
// Removed static import: import { createPaymentIntent } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse the request body
    const body = await request.json();
    const { formulationId, amount, currency = 'aud' } = body;

    if (!formulationId || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the formulation belongs to the user
    const { data: formulation, error: formulationError } = await supabase
      .from('formulations')
      .select('*')
      .eq('id', formulationId)
      .eq('user_id', userId)
      .single();

    if (formulationError || !formulation) {
      return NextResponse.json(
        { message: 'Formulation not found or access denied' },
        { status: 404 }
      );
    }

    // Dynamically import the stripe functions only when needed
    // This prevents loading stripe lib during build analysis
    const { createPaymentIntent } = await import('@/lib/stripe');

    // Create a payment intent (now using the dynamically imported function)
    const { paymentIntent, error } = await createPaymentIntent(amount, currency, {
      formulationId,
      userId,
      formulationName: formulation.name,
    });

    if (error || !paymentIntent) {
      console.error('Payment intent creation error:', error);
      return NextResponse.json(
        { message: 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Create a payment record in your 'payments' table
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        formulation_id: formulationId,
        amount: amount, // Ensure 'amount' from body is correct unit/type
        currency: currency,
        stripe_payment_intent_id: paymentIntent.id, // Corrected field name
        status: 'pending', // Set initial status
      })
      .select() // Select the created record to confirm
      .single(); // Expecting a single record

    if (paymentError || !paymentRecord) {
      console.error('Payment record creation error:', paymentError);
      // Consider rolling back or logging the failure more robustly
      return NextResponse.json(
        { message: 'Failed to record payment details.' },
        { status: 500 }
      );
    }

    // Optionally: Update the formulation status to indicate payment is pending
    const { error: formulationUpdateError } = await supabase
      .from('formulations')
      .update({ payment_status: 'pending' })
      .eq('id', formulationId);

    if (formulationUpdateError) {
      console.warn('Failed to update formulation payment status:', formulationUpdateError);
      // Log this, but likely continue as the payment intent is created
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    // Avoid sending detailed errors to the client in production
    return NextResponse.json(
      { message: 'An unexpected error occurred during payment creation.' },
      { status: 500 }
    );
  }
} // <-- This closing brace was missing in the previous version
