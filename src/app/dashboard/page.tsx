'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'; // Keep client for direct calls if needed, though context is preferred
import { Database } from '@/lib/database.types';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider'; // Import useAuth

// Define type for formulation
type Formulation = Database['public']['Tables']['formulations']['Row'];

export default function CustomerDashboard() {
  const supabase = createClient(); // Keep client instance if needed for non-auth calls
  const { user: authUser, isLoading: isAuthLoading } = useAuth(); // Get user and auth loading state from context
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [loadingData, setLoadingData] = useState(true); // Separate loading state for dashboard data
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Only fetch data if authentication is not loading and user is logged in
    if (!isAuthLoading && authUser) {
      const fetchFormulations = async () => {
        console.log("Dashboard: Auth loaded, user found. Fetching formulations...");
        setLoadingData(true); // Start data loading
        setError(null); // Clear previous errors
        try {
          // Fetch formulations for the current user using the user ID from context
          let query = supabase
            .from('formulations')
            .select(`*`)
            .eq('user_id', authUser.id) // Use authUser.id from context
            .order('created_at', { ascending: false });

          // Apply filters
          if (filter !== 'all') {
            query = query.eq('status', filter);
          }

          const { data, error: queryError } = await query;

          if (queryError) {
            console.error("Dashboard: Error fetching formulations:", queryError);
            throw queryError;
          }

          console.log("Dashboard: Formulations fetched:", data);
          setFormulations(data || []);
        } catch (err: unknown) {
          let message = 'Failed to fetch formulations';
          if (err instanceof Error) {
            message = err.message;
          } else if (typeof err === 'string') {
            message = err;
          }
          console.error("Dashboard: Catch block error:", err);
          setError(message);
        } finally {
          console.log("Dashboard: Fetch formulations finished, setting loadingData false.");
          setLoadingData(false); // Finish data loading
        }
      };

      fetchFormulations();
    } else if (!isAuthLoading && !authUser) {
      // Handle case where auth is loaded but user is not logged in (shouldn't happen if middleware is correct)
      console.warn("Dashboard: Auth loaded but no user found. Clearing data and loading state.");
      setFormulations([]);
      setError("User not authenticated.");
      setLoadingData(false);
    } else {
      // Auth is still loading
      console.log("Dashboard: Waiting for authentication to load...");
      // Keep loadingData true until auth is resolved
      setLoadingData(true);
    }
  // Depend on authUser, isAuthLoading, filter, and supabase client instance
  }, [authUser, isAuthLoading, filter, supabase]);

  const getStatusBadgeClass = (status: string | null) => { // Allow null status
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Combine auth loading and data loading states
  const isLoading = isAuthLoading || loadingData;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Formulations</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading} // Disable filter while loading
          >
            <option value="all">All Formulations</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <Link
          href="/formulations/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Upload New Formulation
        </Link>
      </div>

      {isLoading ? ( // Use combined loading state
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading formulations...</p>
        </div>
      ) : formulations.length === 0 && !error ? ( // Show "No formulations" only if not loading and no error
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">No formulations found</h2>
          <p className="text-gray-600 mb-6">
            You haven't submitted any formulations yet. Get started by uploading your first formulation.
          </p>
          <Link
            href="/formulations/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Upload Formulation
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formulations.map((formulation) => (
            <div key={formulation.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{formulation.name}</h2>
                <p className="text-gray-600 mb-4">
                  Product Type: {formulation.product_type}
                </p>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(formulation.status)}`}>
                      {(formulation.status ?? 'Unknown').replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formulation.created_at ? new Date(formulation.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${formulation.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {formulation.payment_status ?? 'N/A'}
                    </span>
                  </div>
                  <Link
                    href={`/formulations/${formulation.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
