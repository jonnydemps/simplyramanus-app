import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';
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
    
    // Create a payment intent
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
        payment_id: paymentIntent.id,
      })
      .eq('id', formulationId);
    
    if (updateError) {
      console.error('Formulation update error:', updateError);
      // Continue anyway, as the payment intent was created successfully
    }
    
    // Create a payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        formulation_id: formulationId,
        amount,
        currency,
        stripe_payment_id: paymentIntent.id,
        status: 'pending',
      });
    
    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      // Continue anyway, as the payment intent was created successfully
    }
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
