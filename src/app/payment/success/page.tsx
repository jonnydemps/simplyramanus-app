export default function PaymentSuccessPage({ 
  searchParams 
}: { 
  searchParams: { formulationId: string } 
}) {
  const formulationId = searchParams.formulationId;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Payment Successful</h1>
          <p className="mt-2 text-lg text-gray-600">
            Thank you for your payment
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4 text-center">Your formulation has been submitted for review</h2>
          
          <p className="text-gray-600 mb-6">
            We have received your payment and your formulation is now in our review queue. 
            Our regulatory affairs specialists will begin reviewing your formulation shortly.
          </p>
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Your formulation will be reviewed for Australia and New Zealand compliance</li>
              <li>You will receive notifications as your review progresses</li>
              <li>A detailed compliance report will be provided upon completion</li>
              <li>You can track the status of your review in your dashboard</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-center">
          <a 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
