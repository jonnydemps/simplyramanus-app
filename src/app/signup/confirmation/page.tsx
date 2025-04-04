export default function SignupConfirmationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">SimplyRA</h1>
          <p className="mt-2 text-sm text-gray-600">
            Regulatory Affairs Simplified
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Account Created Successfully</h2>
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
            <p>Thank you for signing up! Please check your email to confirm your account.</p>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            A confirmation link has been sent to your email address. Please click on the link to verify your account.
          </p>
          <p className="text-sm text-gray-600">
            If you don't receive an email within a few minutes, please check your spam folder or{' '}
            <a href="/signin" className="text-blue-600 hover:underline">
              return to sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
