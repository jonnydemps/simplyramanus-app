import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SimplyRA | Cosmetic Formulation Compliance',
  description: 'Regulatory affairs specialist for Australia and New Zealand cosmetic compliance',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">SimplyRA</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cosmetic Formulation Compliance for Australia and New Zealand
          </p>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Professional Regulatory Affairs Services
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                SimplyRA provides expert review of cosmetic formulations for Australia and New Zealand compliance.
                Our streamlined process makes regulatory compliance simple and efficient.
              </p>
              <div className="mt-8 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Create Account
                </Link>
              </div>
            </div>
            <div className="mt-8 lg:mt-0">
              <div className="bg-gray-100 rounded-lg p-8">
                <h3 className="text-lg font-medium text-gray-900">Our Services</h3>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
                    <span className="ml-3 text-gray-700">Cosmetic formulation review</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
                    <span className="ml-3 text-gray-700">Ingredient compliance assessment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
                    <span className="ml-3 text-gray-700">Regulatory documentation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
                    <span className="ml-3 text-gray-700">Compliance reports</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} SimplyRA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
