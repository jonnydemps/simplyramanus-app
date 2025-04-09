'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, Json } from '@/lib/database.types'; // Import Json type
import Link from 'next/link'; // Import Link

// Define types
type Formulation = Database['public']['Tables']['formulations']['Row'];
type Ingredient = Database['public']['Tables']['ingredients']['Row'];

// Removed unused CommentItem interface

// Define props type
interface PageProps {
  params: { id: string };
}

export default function FormulationDetails({ params }: PageProps) {
  const [formulation, setFormulation] = useState<Formulation | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  // Removed report state
  const [comments, setComments] = useState<Json | null>(null); // Use Json type for comments column
  // Removed newComment state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formulationId = params.id;

  useEffect(() => {
    const fetchFormulationDetails = async () => {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Fetch formulation details
        const { data: formulationData, error: formulationError } = await supabase
          .from('formulations')
          .select('*, comments') // Select comments JSON field
          .eq('id', formulationId)
          .eq('user_id', user.id)
          .single();
        
        if (formulationError) {
          throw formulationError;
        }
        
        setFormulation(formulationData);
        setComments(formulationData?.comments || null); // Set comments from formulation data
        
        // Fetch ingredients directly
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('ingredients')
          .select('*')
          .eq('formulation_id', formulationId);

        if (ingredientsError) {
          throw ingredientsError;
        }

        setIngredients(ingredientsData || []);
        
        // Removed fetching from non-existent 'reports' and 'comments' tables
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

  // Removed handleAddComment function

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

  // Removed getReportStatusBadgeClass function

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
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!formulation) {
    return (
      <div className="p-6">
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
          Formulation not found or you don&apos;t have access to it.
        </div>
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Formulation Details</h1>
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Formulation Information</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Name:</span> {formulation.name}
              </div>
              <div>
                <span className="font-medium text-gray-700">Product Type:</span> {formulation.product_type}
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
            
            {/* Removed description */}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Original File</h2>
            <div className="border border-gray-300 rounded-md p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  {/* Removed original_file_name */}
                  <p className="text-sm text-gray-500">Submitted on {new Date(formulation.created_at).toLocaleDateString()}</p>
                </div>
                {/* Removed download link as file_path is not in schema */}
              </div>
            </div>
            
            {formulation.payment_status !== 'paid' && (
              <div className="mt-6">
                <Link
                  href={`/payment?formulationId=${formulationId}`}
                  className="w-full inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Complete Payment
                </Link>
              </div>
            )}
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
                  {/* Removed Restrictions column */}
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ingredient) => (
                  <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.name}</td> {/* Use name */}
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.cas_number || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.concentration}%</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.function || '-'}</td>
                    {/* Removed Restrictions cell */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Removed Report section */}
      
      {/* Display comments from formulation.comments JSON field */}
      {comments && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          {/* Basic display assuming comments is an array of objects with text */}
          {/* This needs refinement based on the actual structure of the JSON */}
          {Array.isArray(comments) && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment: Json, index: number) => {
                // Type guard: Check if comment is an object matching CommentItem structure
                // Type guard: Check if comment is an object with a 'text' property
                if (typeof comment === 'object' && comment !== null && 'text' in comment && typeof comment.text === 'string') {
                  return (
                    <div key={index} className="border-b pb-4">
                      {/* Access properties directly after the type guard */}
                      <p className="text-gray-700">{comment.text}</p>
                      {/* Check optional properties before accessing */}
                      {typeof comment.author === 'string' && <span className="text-sm text-gray-500"> - {comment.author}</span>}
                      {(typeof comment.timestamp === 'string' || typeof comment.timestamp === 'number') && <span className="text-sm text-gray-500"> ({new Date(comment.timestamp).toLocaleString()})</span>}
                    </div>
                  );
                }
                // Fallback for other JSON types in the array
                return (
                  <div key={index} className="border-b pb-4">
                    <p className="text-gray-700">{JSON.stringify(comment)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600">No comments available.</p>
          )}
          {/* Removed comment adding form */}
        </div>
      )}
    </div>
  );
}
