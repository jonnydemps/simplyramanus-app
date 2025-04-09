import Link from 'next/link'; // Import Link

export default function PaymentFailurePage({
  searchParams 
}: { 
  searchParams: { formulationId: string } 
}) {
  const formulationId = searchParams.formulationId;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Payment Failed</h1>
          <p className="mt-2 text-lg text-gray-600">
            We couldn&apos;t process your payment
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 p-3">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4 text-center">Your payment was not successful</h2>
          
          <p className="text-gray-600 mb-6">
            We were unable to process your payment. This could be due to insufficient funds, 
            an expired card, or other issues with your payment method.
          </p>
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-2">What to do next:</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Check your payment details and try again</li>
              <li>Try a different payment method</li>
              <li>Contact your bank if the issue persists</li>
              <li>Reach out to our support team if you need assistance</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Link
            href={`/payment?formulationId=${formulationId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
