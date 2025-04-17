'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase'; // Use new client creator
import { Database } from '@/lib/database.types';
// import Link from 'next/link'; // REMOVED - Not used in simplified version

// Use base types from database.types.ts
type Formulation = Database['public']['Tables']['formulations']['Row'];
// type Ingredient = Database['public']['Tables']['ingredients']['Row']; // REMOVED - Not used

// Define props type
interface PageProps {
  params: { id: string };
}

export default function FormulationDetails({ params }: PageProps) {
  const supabase = createClient(); // Create client instance
  const [formulation, setFormulation] = useState<Formulation | null>(null);
  // const [ingredients, setIngredients] = useState<Ingredient[]>([]); // REMOVED - Not used
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formulationId = params.id;

  useEffect(() => {
    const fetchFormulationDetails = async () => {
      if (!formulationId || typeof formulationId !== 'string') {
        setError("Invalid or missing Formulation ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        console.log(`Workspaceing formulation (user view): ${formulationId}`);
        const { data: formulationData, error: formulationError } = await supabase
          .from('formulations')
          .select('*') // Select required formulation columns
          // Add profile join ONLY if needed: .select('*, profiles(company_name)')
          .eq('id', formulationId)
          .eq('user_id', user.id) // Verify ownership
          .single();

        if (formulationError) {
          if (formulationError.code === 'PGRST116') {
            console.warn(`User Formulation Fetch: Formulation ${formulationId} not found or RLS denied for user ${user.id}.`);
            setError(`Formulation not found or you don't have access.`);
          } else {
            console.error("Error fetching user formulation:", formulationError);
            throw formulationError;
          }
          setFormulation(null);
        } else if (formulationData) {
          console.log("User formulation data fetched:", formulationData);
          setFormulation(formulationData);

          // --- REMOVED Ingredients Fetch ---

        } else {
          setError(`Formulation with ID ${formulationId} not found.`);
          setFormulation(null);
        }

      } catch (err: unknown) {
         let message = 'Failed to fetch formulation details';
         if (typeof err === 'object' && err !== null && 'message' in err) { message = err.message as string; }
         else if (err instanceof Error) { message = err.message; }
         console.error("Fetch User Formulation Details Catch Block:", err);
         setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchFormulationDetails();
  }, [formulationId]);

  // REMOVED unused getStatusBadgeClass function
  // const getStatusBadgeClass = (status: string) => { ... };

  // --- Render logic ---
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading formulation details...</p>
      </div>
    );
  }

  if (error && !formulation) {
    return (
      <div className="p-6">
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
        {/* Using basic anchor tag now, import Link if preferred */}
        <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </a>
      </div>
    );
  }

  if (!formulation) {
     // Added condition to handle error message even if formulation becomes null later
    return (
      <div className="p-6">
        <div className={`mb-4 p-3 rounded-md ${error ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {error || "Formulation not found or you don't have access to it."}
        </div>
        <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </a>
      </div>
    );
  }

  // --- Main Content Rendering (Simplified) ---
  return (
    <div className="p-6">
       {/* Display non-blocking errors if they occur during actions */}
      {error && (
         <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
           Error: {error}
         </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Formulation Details</h1>
        <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </a>
      </div>

      {/* Details Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Formulation Information</h2>
        <div className="space-y-3">
          <div><span className="font-medium text-gray-700">Name:</span> {formulation.name}</div>
          <div><span className="font-medium text-gray-700">Product Type:</span> {formulation.product_type}</div>
          <div><span className="font-medium text-gray-700">Submitted:</span> {formulation.created_at ? new Date(formulation.created_at).toLocaleString() : 'N/A'}</div>
          <div><span className="font-medium text-gray-700">Status:</span> {formulation.status ?? 'N/A'}</div>
          <div><span className="font-medium text-gray-700">Payment:</span> {formulation.payment_status ?? 'N/A'}</div>
          {formulation.description && (
             <div><span className="font-medium text-gray-700">Description:</span> {formulation.description}</div>
           )}
          {/* Add other formulation fields as needed */}
        </div>
      </div>

      {/* --- REMOVED Ingredients Section Rendering --- */}
      {/* --- REMOVED Comments Section Rendering --- */}
       {formulation.payment_status !== 'paid' && (
         <div className="mt-6">
           {/* Use basic anchor or re-import Link if needed */}
           <a
             href={`/payment?formulationId=${formulationId}`}
             className="w-full inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
           >
             Complete Payment
           </a>
         </div>
       )}
    </div>
  );
}
