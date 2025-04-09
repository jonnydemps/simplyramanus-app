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

    // Update formulation with payment ID
    const { error: updateError } = await supabase
      .from('formulations')
      .update({
        // Ensure your database schema has 'payment_id' or adjust field name
        payment_id: paymentIntent.id,
      })
      .eq('id', formulationId);

    if (updateError) {
      console.error('Formulation update error:', updateError);
      // Decide if you should stop or continue if this fails
    }

    // Create a payment record in your 'payments' table
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        formulation_id: formulationId,
        amount: amount, // Ensure 'amount' from body is correct unit/type
        currency: currency,
        // Ensure your schema has 'stripe_payment_id' or adjust
        stripe_payment_id: paymentIntent.id,
        status: 'pending', // Or 'succeeded' if appropriate here
      });

    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      // Decide if you should stop or continue
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