'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

// Define types based on database.types.ts
type Formulation = Database['public']['Tables']['formulations']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'] | null; // Assuming profiles relation
};
type Ingredient = Database['public']['Tables']['ingredients']['Row'];
// Removed FormulationIngredient type as the table doesn't exist
// Removed Comment type as the table doesn't exist

// Revert to inline props type definition
export default function FormulationReview({ params }: { params: { id: string } }) {
  const [formulation, setFormulation] = useState<Formulation | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]); // Use Ingredient type directly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed unused reportData state
  // const [reportData, setReportData] = useState({
  //   status: 'compliant',
  //   summary: '',
  //   details: '',
  // });
  // Removed unused submitting state
  // const [submitting, setSubmitting] = useState(false);
  // Removed comments state as the table/logic is incorrect
  // const [comments, setComments] = useState<Comment[]>([]);
  // const [newComment, setNewComment] = useState('');

  const formulationId = params.id;

  useEffect(() => {
    const fetchFormulationDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch formulation details
        const { data: formulationData, error: formulationError } = await supabase
          .from('formulations')
          .select(`
            *,
            profiles(company_name)
          `) // Corrected select query
          .eq('id', formulationId)
          .single();
        
        if (formulationError) {
          throw formulationError;
        }
        
        setFormulation(formulationData);
        
        // Fetch ingredients directly from 'ingredients' table
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('ingredients')
          .select(`*`) // Select all ingredient fields
          .eq('formulation_id', formulationId); // Filter by formulation_id

        if (ingredientsError) {
          throw ingredientsError;
        }

        setIngredients(ingredientsData || []);
        
        // Removed fetching from non-existent 'comments' table
      } catch (err: unknown) {
        let message = 'Failed to fetch formulation details';
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === 'string') {
          message = err;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormulationDetails();
  }, [formulationId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('formulations')
        .update({ status: newStatus })
        .eq('id', formulationId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      // Update local state - ensure formulation is not null before spreading
      if (formulation) {
        setFormulation({ ...formulation, status: newStatus });
      }
    } catch (err: unknown) {
      let message = 'Failed to update formulation status';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      setError(message);
    }
  };

  // Removed unused handleReportSubmit function

  // Removed handleAddComment function as 'comments' table doesn't exist

  const getStatusBadgeClass = (status: string) => {
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading formulation details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
        <a
          href="/admin"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  if (!formulation) {
    return (
      <div className="p-6">
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
          Formulation not found
        </div>
        <a
          href="/admin"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Formulation Review</h1>
        <a
          href="/admin"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Dashboard
        </a>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Formulation Details</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Name:</span> {formulation.name}
              </div>
              <div>
                <span className="font-medium text-gray-700">Product Type:</span> {formulation.product_type}
              </div>
              <div>
                <span className="font-medium text-gray-700">Company:</span> {formulation.profiles?.company_name}
                {/* Removed Contact Email as it's not in profiles type */}
              </div>
              <div>
                <span className="font-medium text-gray-700">Submitted:</span> {new Date(formulation.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(formulation.status)}`}>
                  {formulation.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Payment:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs ${formulation.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {formulation.payment_status}
                </span>
              </div>
            </div>
            
            {/* Removed Description section as it's not in formulations type */}
            
            <div className="mt-6 space-x-2">
              {formulation.status === 'pending' && formulation.payment_status === 'paid' && (
                <button
                  onClick={() => handleStatusChange('in_review')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Start Review
                </button>
              )}
              {formulation.status === 'in_review' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Complete Review
                </button>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Original File</h2>
            <div className="border border-gray-300 rounded-md p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  {/* Removed original_file_name as it's not in formulations type */}
                  <p className="text-sm text-gray-500">Submitted on {new Date(formulation.created_at).toLocaleDateString()}</p>
                </div>
                <a
                  href={`/api/formulations/${formulationId}/download`}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
        {ingredients.length === 0 ? (
          <p className="text-gray-600">No ingredients found for this formulation.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">INCI Name</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">CAS Number</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Concentration (%)</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Function</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Restrictions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ingredient) => (
                  <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                    {/* Access ingredient details directly */}
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.name}</td> {/* Use ingredient.name */}
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.cas_number || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.concentration}%</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.function || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{/* Removed restrictions - not in schema */}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Removed Comments section as the table/logic is incorrect */}
      
      {/* Removed Report Generation form as the 'reports' table doesn't exist */}
    </div>
  );
}
