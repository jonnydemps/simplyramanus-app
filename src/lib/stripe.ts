import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Use the latest API version
});

// Create a payment intent
export const createPaymentIntent = async (amount: number, currency: string = 'aud', metadata: any = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return { paymentIntent, error: null };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return { paymentIntent: null, error };
  }
};

// Retrieve a payment intent
export const retrievePaymentIntent = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { paymentIntent, error: null };
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return { paymentIntent: null, error };
  }
};

// Create a checkout session
export const createCheckoutSession = async (
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata: any = {}
) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });
    
    return { session, error: null };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { session: null, error };
  }
};

// Create a product
export const createProduct = async (name: string, description: string) => {
  try {
    const product = await stripe.products.create({
      name,
      description,
    });
    
    return { product, error: null };
  } catch (error) {
    console.error('Error creating product:', error);
    return { product: null, error };
  }
};

// Create a price
export const createPrice = async (productId: string, amount: number, currency: string = 'aud') => {
  try {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency,
    });
    
    return { price, error: null };
  } catch (error) {
    console.error('Error creating price:', error);
    return { price: null, error };
  }
};

// Handle webhook events
export const handleWebhookEvent = async (event: Stripe.Event) => {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Handle successful payment
        console.log('Payment succeeded:', paymentIntent.id);
        return { success: true, paymentIntent };
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        // Handle failed payment
        console.log('Payment failed:', failedPaymentIntent.id);
        return { success: false, paymentIntent: failedPaymentIntent };
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return { success: true };
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    throw error;
  }
};
