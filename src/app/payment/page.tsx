'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateFormulation } from '@/lib/supabase';

export default function PaymentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formulation, setFormulation] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const formulationId = searchParams.get('formulationId');

  useEffect(() => {
    if (!formulationId) {
      setError('No formulation ID provided');
      setLoading(false);
      return;
    }

    const fetchFormulationAndCreatePayment = async () => {
      try {
        // Fetch formulation details
        const response = await fetch(`/api/formulations/${formulationId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch formulation details');
        }
        
        const data = await response.json();
        setFormulation(data.formulation);
        
        // Create payment intent
        const paymentResponse = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formulationId,
            amount: 199.00, // Fixed price for formulation review
            currency: 'aud',
          }),
        });
        
        if (!paymentResponse.ok) {
          throw new Error('Failed to create payment');
        }
        
        const paymentData = await paymentResponse.json();
        setClientSecret(paymentData.clientSecret);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFormulationAndCreatePayment();
  }, [formulationId]);

  const handlePaymentSuccess = async () => {
    try {
      // Update formulation payment status
      await updateFormulation(formulationId!, {
        payment_status: 'paid',
      });
      
      // Redirect to success page
      router.push(`/payment/success?formulationId=${formulationId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update payment status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/formulations/upload')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Complete Your Payment</h1>
          <p className="mt-2 text-lg text-gray-600">
            Secure payment for your formulation review
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          
          {formulation && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Formulation:</span>
                <span className="font-medium">{formulation.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Product Type:</span>
                <span>{formulation.product_type}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Review Service:</span>
                <span>Australia & New Zealand Compliance</span>
              </div>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>$199.00 AUD</span>
              </div>
            </div>
          )}
          
          {clientSecret ? (
            <div className="mt-6">
              {/* Stripe Elements would be implemented here */}
              <div className="border border-gray-300 rounded-md p-4 mb-4">
                <p className="text-center text-gray-500">
                  Stripe payment form would be rendered here with the client secret.
                </p>
              </div>
              
              <button
                onClick={handlePaymentSuccess}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Pay $199.00 AUD
              </button>
              
              <p className="mt-4 text-sm text-gray-500 text-center">
                Your payment is processed securely through Stripe. We do not store your credit card details.
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Loading payment form...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
