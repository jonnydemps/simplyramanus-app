'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types'; // Keep existing import
import Link from 'next/link'; // Import Link

// --- Corrected Type Definition ---
// Define type expecting ONLY the profile data selected by the query below
type FormulationWithProfile = Database['public']['Tables']['formulations']['Row'] & {
  profiles: { company_name: string } | null; // Only expect company_name
};

export default function AdminDashboard() {
  // Use the corrected component-specific type for state
  const [formulations, setFormulations] = useState<FormulationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchFormulations = async () => {
      try {
        setLoading(true);
        setError(null); // Clear error on new fetch

        console.log("AdminDashboard: Fetching formulations with filter:", filter); // Debug
        // Query fetches formulations and only company_name from profiles
        let query = supabase
          .from('formulations')
          .select(`
            *,
            profiles ( company_name )
          `) // This query matches the type definition above now
          .order('created_at', { ascending: false });

        // Apply filters
        if (filter !== 'all') {
          query = query.eq('status', filter);
        }

        const { data, error: queryError } = await query; // Renamed error variable

        if (queryError) {
          throw queryError;
        }

        console.log("AdminDashboard: Formulations fetched:", data ? data.length : 0); // Debug
        // Type matches now!
        setFormulations(data || []);

      } catch (err: unknown) {
        let message = 'Failed to fetch formulations';
         if (typeof err === 'object' && err !== null && 'message' in err) {
           message = err.message as string;
        } else if (err instanceof Error) {
           message = err.message;
        } else if (typeof err === 'string') {
           message = err;
        }
        console.error("AdminDashboard fetch error:", err);
        setError(message);
        setFormulations([]); // Clear formulations on error
      } finally {
        setLoading(false);
      }
    };

    fetchFormulations();
  }, [filter]); // Dependency array is correct

  // handleStatusChange function
  const handleStatusChange = async (formulationId: string, newStatus: string) => {
     console.log(`Admin: Updating status for ${formulationId} to ${newStatus}`); // Debug
     try {
       setError(null); // Clear previous errors
       const { error } = await supabase
         .from('formulations')
         .update({ status: newStatus })
         .eq('id', formulationId);

       if (error) {
         throw error;
       }
       // Update local state correctly
       setFormulations(currentFormulations =>
          currentFormulations.map(formulation =>
             formulation.id === formulationId
               ? { ...formulation, status: newStatus }
               : formulation
          )
       );
     } catch (err: unknown) {
         let message = 'Failed to update formulation status';
         if (err instanceof Error) { message = err.message; }
         else if (typeof err === 'string') { message = err; }
         console.error("Admin handleStatusChange error:", err);
         setError(message);
     }
  };

  // getStatusBadgeClass function remains the same
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // --- JSX rendering ---
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {/* Filter dropdown */}
      <div className="mb-6">
        <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Status
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Formulations</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Loading indicator */}
      {loading ? (
         <div className="text-center py-8">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
           <p className="mt-4 text-gray-600">Loading formulations...</p>
         </div>
      // Table rendering
      ) : formulations.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
             <p className="text-gray-600">No formulations found for the selected filter.</p>
          </div>
      ) : (
          <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">ID</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Name</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Company</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Product Type</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Payment</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {formulations.map((formulation) => (
                          <tr key={formulation.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-700" title={formulation.id}>{formulation.id.slice(0, 8)}...</td>
                              <td className="py-3 px-4 text-sm text-gray-700">{formulation.name}</td>
                              {/* Use optional chaining and nullish coalescing for safety */}
                              <td className="py-3 px-4 text-sm text-gray-700">{formulation.profiles?.company_name ?? 'N/A'}</td>
                              <td className="py-3 px-4 text-sm text-gray-700">{formulation.product_type}</td>
                              <td className="py-3 px-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(formulation.status)}`}>
                                  {formulation.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${formulation.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {formulation.payment_status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700">
                                {new Date(formulation.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <div className="flex space-x-2">
                                  {/* Use Link component for internal navigation */}
                                  <Link
                                    href={`/admin/formulations/${formulation.id}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    Review
                                  </Link>
                                  {/* Status change buttons */}
                                  {formulation.status === 'pending' && formulation.payment_status === 'paid' && (
                                    <button
                                      onClick={() => handleStatusChange(formulation.id, 'in_review')}
                                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                      Start Review
                                    </button>
                                  )}
                                  {formulation.status === 'in_review' && (
                                    <button
                                      onClick={() => handleStatusChange(formulation.id, 'completed')}
                                      className="text-green-600 hover:text-green-800 font-medium"
                                    >
                                      Complete
                                    </button>
                                  )}
                                  {/* Consider adding a Reject button */}
                                  {/* {formulation.status === 'in_review' && (
                                    <button onClick={() => handleStatusChange(formulation.id, 'rejected')} className="text-red-600 hover:text-red-800 font-medium">
                                      Reject
                                    </button>
                                  )} */}
                                </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
}