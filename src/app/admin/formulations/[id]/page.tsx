'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import Link from 'next/link'; // Added Link import based on JSX usage

// --- Corrected Type Definition ---
// Define a component-specific type expecting only the profile data we select
type FormulationWithPartialProfile = Database['public']['Tables']['formulations']['Row'] & {
  profiles: { company_name: string } | null; // Now only expects company_name
};
// Base Ingredient type from database.types.ts
type Ingredient = Database['public']['Tables']['ingredients']['Row'];

// Props type using params
interface FormulationReviewProps {
  params: { id: string };
}

export default function FormulationReview({ params }: FormulationReviewProps) {
  // Use the corrected component-specific type for state
  const [formulation, setFormulation] = useState<FormulationWithPartialProfile | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formulationId = params.id;

  useEffect(() => {
    const fetchFormulationDetails = async () => {
      // Check if formulationId is valid early
      if (!formulationId || typeof formulationId !== 'string') {
        setError("Invalid or missing Formulation ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null); // Clear previous errors

        // Fetch formulation details including only company_name from profiles
        console.log(`Workspaceing formulation: ${formulationId}`); // Debug
        const { data: formulationData, error: formulationError } = await supabase
          .from('formulations')
          .select(`
            *,
            profiles ( company_name )
          `) // Query matches the type: only company_name needed
          .eq('id', formulationId)
          .single();

        if (formulationError) {
          // Handle RLS errors or not found specifically
          if (formulationError.code === 'PGRST116') {
            console.warn(`Admin Formulation Fetch: Formulation ${formulationId} not found or RLS denied.`);
            setError(`Formulation with ID ${formulationId} not found or access denied.`);
          } else {
             console.error("Error fetching formulation:", formulationError);
             throw formulationError; // Throw other errors to be caught below
          }
          setFormulation(null); // Ensure formulation is null on error/not found
        } else if (formulationData) {
           console.log("Formulation data fetched:", formulationData); // Debug
           // Type matches now!
           setFormulation(formulationData);

           // Fetch ingredients only if formulation was found
           console.log(`Workspaceing ingredients for formulation: ${formulationId}`); // Debug
           const { data: ingredientsData, error: ingredientsError } = await supabase
             .from('ingredients')
             .select(`*`) // Assuming you need all ingredient fields
             .eq('formulation_id', formulationId);

           if (ingredientsError) {
             console.error("Error fetching ingredients:", ingredientsError);
             // Append error message, don't overwrite formulation error
             setError(prev => prev ? `${prev}\nFailed to fetch ingredients: ${ingredientsError.message}` : `Failed to fetch ingredients: ${ingredientsError.message}`);
             setIngredients([]);
           } else {
             console.log("Ingredients data fetched:", ingredientsData); // Debug
             setIngredients(ingredientsData || []);
           }
        } else {
           // Handle case where data is null without error (unlikely with .single() unless RLS)
           setError(`Formulation with ID ${formulationId} not found.`);
           setFormulation(null);
           setIngredients([]);
        }

      } catch (err: unknown) {
        let message = 'Failed to fetch formulation details';
        if (typeof err === 'object' && err !== null && 'message' in err) {
          message = err.message as string;
        } else if (err instanceof Error) {
          message = err.message;
        }
        console.error("Fetch Formulation Details Catch Block:", err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchFormulationDetails();
  }, [formulationId]); // Depend only on formulationId

  // handleStatusChange function - check formulation exists before setting
  const handleStatusChange = async (newStatus: string) => {
     if (!formulation) {
        setError("Cannot update status: formulation data not loaded.");
        return;
     }
     console.log(`Admin: Updating status for ${formulation.id} to ${newStatus}`); // Debug
     try {
       const { error } = await supabase
         .from('formulations')
         .update({ status: newStatus })
         .eq('id', formulationId);

       if (error) {
         throw error;
       }
       // Update local state correctly using functional update
       setFormulation(currentFormulation =>
           currentFormulation ? { ...currentFormulation, status: newStatus } : null
       );
       setError(null); // Clear error on success
     } catch (err: unknown) {
       let message = 'Failed to update formulation status';
       if (err instanceof Error) {
         message = err.message;
       } else if (typeof err === 'string') {
         message = err;
       }
       console.error("handleStatusChange error:", err);
       setError(message);
     }
  };

  // getStatusBadgeClass function remains the same
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // --- Render logic ---

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading formulation details...</p>
      </div>
    );
  }

  // Show error message prominently if it exists
  if (error && !formulation) { // Only show full error page if formulation load failed
    return (
      <div className="p-6">
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
        <Link // Use Link for internal navigation
          href="/admin"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Handle case where formulation not found after loading and no other error
  if (!formulation) {
    return (
      <div className="p-6">
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
          Formulation not found. It might have been deleted or you may not have access.
        </div>
        <Link // Use Link for internal navigation
          href="/admin"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // --- Main Content Rendering (if loading is false and formulation exists) ---
  return (
    <div className="p-6">
      {/* Display error messages non-blockingly if they occur during actions */}
      {error && (
         <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
           Error: {error}
         </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Formulation Review: {formulation.name}</h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>

      {/* Details Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Formulation Details</h2>
            <div className="space-y-3">
              {/* ... (display formulation fields like name, product_type etc.) ... */}
              <div>
                 <span className="font-medium text-gray-700">Company:</span> {formulation.profiles?.company_name ?? 'N/A'}
              </div>
              <div>
                 <span className="font-medium text-gray-700">Submitted:</span> {formulation.created_at ? new Date(formulation.created_at).toLocaleString() : 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(formulation.status ?? 'unknown')}`}>
                  {(formulation.status ?? 'Unknown').replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Payment:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs ${formulation.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {formulation.payment_status}
                </span>
              </div>
               {/* Add Description if present in your schema/type */}
               {formulation.description && (
                 <div><span className="font-medium text-gray-700">Description:</span> {formulation.description}</div>
               )}
            </div>
            {/* Status Change Buttons */}
            <div className="mt-6 space-x-2">
              {/* ... (status change buttons remain the same) ... */}
               {formulation.status === 'pending' && formulation.payment_status === 'paid' && (
                 <button onClick={() => handleStatusChange('in_review')} className="...">Start Review</button>
               )}
               {formulation.status === 'in_review' && (
                 <button onClick={() => handleStatusChange('completed')} className="...">Complete Review</button>
               )}
               {/* Add Reject Button? */}
                {/* <button onClick={() => handleStatusChange('rejected')} className="...">Reject</button> */}
            </div>
          </div>
          {/* Original File Section */}
          <div>
             <h2 className="text-xl font-semibold mb-4">Original File</h2>
             <div className="border border-gray-300 rounded-md p-4">
                {/* Display original file name if available */}
                {formulation.original_file_name ? (
                    <p className="text-sm font-medium text-gray-800 mb-2">{formulation.original_file_name}</p>
                ) : (
                    <p className="text-sm text-gray-500 mb-2">Original filename not available.</p>
                )}
                <div className="flex items-center justify-between">
                   <p className="text-sm text-gray-500">Submitted on {formulation.created_at ? new Date(formulation.created_at).toLocaleDateString() : 'N/A'}</p>
                   {/* Link to download API route */}
                   {formulation.file_path && ( // Only show download if file_path exists
                     <a
                       href={`/api/formulations/${formulationId}/download`} // Ensure this API route exists
                       className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                       target="_blank"
                       rel="noopener noreferrer"
                     >
                       Download
                     </a>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Ingredients Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
        {/* ... (ingredients table rendering remains the same) ... */}
        {ingredients.length === 0 ? (
            <p className="text-gray-600">No ingredients found for this formulation.</p>
        ) : (
            <div className="overflow-x-auto">
               {/* ... table structure ... */}
                <tbody>
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                       {/* Use inci_name based on corrected types */}
                      <td className="py-3 px-4 text-sm text-gray-700">{ingredient.inci_name}</td> 
                      <td className="py-3 px-4 text-sm text-gray-700">{ingredient.cas_number || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{ingredient.concentration}%</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{ingredient.function || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{/* Restrictions placeholder */}</td>
                    </tr>
                  ))}
                </tbody>
               {/* ... table end ... */}
            </div>
        )}
      </div>

      {/* Removed Comments and Report Generation Sections */}
    </div>
  );
}
