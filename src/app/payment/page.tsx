'use client';

import { useState, useEffect, Suspense } from 'react'; // Import Suspense
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import Link from 'next/link'; // Import Link for error state button

type Formulation = Database['public']['Tables']['formulations']['Row'];

// Define the loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading payment details...</p>
      </div>
    </div>
  );
}

// Component containing the main logic using useSearchParams
function PaymentContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formulation, setFormulation] = useState<Formulation | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  // Get formulationId from URL search parameters (can be null)
  const formulationId = searchParams.get('formulationId');

  useEffect(() => {
    // Ensure formulationId exists before proceeding
    if (!formulationId) {
      console.error("Payment Page: No formulation ID found in URL search parameters.");
      setError('No formulation ID provided. Please go back and select a formulation.');
      setLoading(false);
      return; // Stop execution if ID is missing
    }

    const fetchFormulationAndCreatePayment = async () => {
      // formulationId is guaranteed to be a string here because of the check above
      try {
        setError(null); // Clear previous errors
        setLoading(true);

        // Fetch formulation details (using fetch to internal API - ensure it exists/works)
        // Consider fetching directly via Supabase client if appropriate
        console.log(`Payment Page: Fetching formulation ${formulationId}`);
        const response = await fetch(`/api/formulations/${formulationId}`); // Check if this API route exists
        if (!response.ok) {
           const errorText = await response.text();
           console.error(`Failed to fetch formulation ${formulationId}:`, response.status, errorText);
           throw new Error(`Could not load formulation details (Status: ${response.status})`);
        }
        const data = await response.json();
         if (!data || !data.formulation) {
             throw new Error("Invalid formulation data received from API.");
         }
        setFormulation(data.formulation);
        console.log("Payment Page: Formulation data set:", data.formulation);

        // Create payment intent via internal API
        console.log(`Payment Page: Creating payment intent for ${formulationId}`);
        const paymentResponse = await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', },
          body: JSON.stringify({
            formulationId, // Pass the validated string ID
            amount: 199.00, // Example fixed price
            currency: 'aud',
          }),
        });

        if (!paymentResponse.ok) {
           const paymentErrorText = await paymentResponse.text();
           console.error(`Failed to create payment intent for ${formulationId}:`, paymentResponse.status, paymentErrorText);
           throw new Error(`Failed to initialize payment (Status: ${paymentResponse.status})`);
        }

        const paymentData = await paymentResponse.json();
        if (!paymentData.clientSecret) {
            throw new Error("Payment initialization failed: missing client secret.");
        }
        setClientSecret(paymentData.clientSecret);
        console.log("Payment Page: Client secret received.");

      } catch (err: unknown) {
        let message = 'An error occurred loading payment details.';
        if (err instanceof Error) { message = err.message; }
        else if (typeof err === 'string') { message = err; }
        console.error("Payment Page useEffect catch:", err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchFormulationAndCreatePayment();
  }, [formulationId]); // Rerun effect if formulationId changes

  // --- CORRECTED handlePaymentSuccess ---
  const handlePaymentSuccess = async () => {
      // Check formulationId again inside the handler for type safety
      if (!formulationId) {
          console.error("handlePaymentSuccess: formulationId is missing when trying to update status.");
          setError("Cannot update payment status: Formulation ID is missing.");
          return; 
      }

      console.log(`handlePaymentSuccess: Updating status for formulation ID: ${formulationId}`);
      try {
          setError(null); // Clear previous action errors
          // Now formulationId is guaranteed to be a non-null string
          const { error: updateError } = await supabase
              .from('formulations') 
              .update({ payment_status: 'paid' })
              .eq('id', formulationId); // Type-safe now

          if (updateError) {
              console.error("Supabase update error:", updateError);
              throw new Error(`Failed to update formulation status: ${updateError.message}`);
          }

          console.log(`handlePaymentSuccess: Successfully updated status for ${formulationId}`);

          // Redirect to success page
          router.push(`/payment/success?formulationId=${formulationId}`);
          
      } catch (err: unknown) {
          let message = 'Failed to update payment status after supposed success.';
          if (err instanceof Error) { message = err.message; } 
          else if (typeof err === 'string') { message = err; }
          console.error("handlePaymentSuccess catch block:", err);
          setError(message);
          // Optionally redirect to a specific failure page
          // router.push(`/payment/failure?formulationId=${formulationId}`); 
      }
  };
  // --- END CORRECTED handlePaymentSuccess ---

  // --- JSX ---
  if (loading) {
    return <LoadingFallback />; // Use the defined fallback
  }

  // Show blocking error if essential setup failed (no ID, fetch error before client secret)
  if (error && !clientSecret) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Load Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          {/* Link back to dashboard or upload depending on context */}
          <Link
            href="/dashboard" 
            className="w-full block text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Main payment page content
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Complete Your Payment</h1>
          <p className="mt-2 text-lg text-gray-600">
            Secure payment for your formulation review
          </p>
        </div>

        {/* Show non-blocking errors (e.g., status update failure) */}
         {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              Error: {error}
            </div>
         )}
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          
          {formulation ? ( // Check if formulation details loaded
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Formulation:</span>
                <span className="font-medium">{formulation.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Product Type:</span>
                <span>{formulation.product_type}</span>
              </div>
              {/* ... other summary details ... */}
              <div className="border-t border-gray-200 my-4"></div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>$199.00 AUD</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 mb-6">Loading formulation details...</p>
          )}
          
          {clientSecret ? (
            <div className="mt-6">
              {/* Stripe Elements Placeholder */}
              <div className="border border-gray-300 rounded-md p-4 mb-4">
                <p className="text-center text-gray-500">
                  Stripe payment form placeholder. <br/> (Requires Stripe Elements integration)
                </p>
              </div>
              
              <button
                // In real Stripe Elements, this might be triggered by Stripe, not a button click
                // Or this button would trigger stripe.confirmPayment()
                onClick={handlePaymentSuccess} 
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Simulate Successful Payment
              </button>
              
              <p className="mt-4 text-sm text-gray-500 text-center">
                Your payment is processed securely through Stripe.
              </p>
            </div>
          ) : (
            // Show if clientSecret is still loading or failed, and no major error occurred
            !error && <div className="text-center text-gray-500">Initializing payment form...</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Default export wraps PaymentContent in Suspense
export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentContent />
    </Suspense>
  );
}