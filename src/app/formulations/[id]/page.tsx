'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FormulationDetails({ params }: { params: { id: string } }) {
  const [formulation, setFormulation] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
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
          .select('*')
          .eq('id', formulationId)
          .eq('user_id', user.id)
          .single();
        
        if (formulationError) {
          throw formulationError;
        }
        
        setFormulation(formulationData);
        
        // Fetch ingredients
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('formulation_ingredients')
          .select(`
            *,
            ingredients(*)
          `)
          .eq('formulation_id', formulationId);
        
        if (ingredientsError) {
          throw ingredientsError;
        }
        
        setIngredients(ingredientsData || []);
        
        // Fetch report
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('formulation_id', formulationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!reportError) {
          setReport(reportData);
        }
        
        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            profiles(company_name)
          `)
          .eq('formulation_id', formulationId)
          .order('created_at', { ascending: true });
        
        if (commentsError) {
          throw commentsError;
        }
        
        setComments(commentsData || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch formulation details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormulationDetails();
  }, [formulationId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert({
          formulation_id: formulationId,
          user_id: user.id,
          content: newComment,
        })
        .select(`
          *,
          profiles(company_name)
        `)
        .single();
      
      if (commentError) {
        throw commentError;
      }
      
      // Update local state
      setComments([...comments, commentData]);
      setNewComment('');
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    }
  };

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

  const getReportStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'non_compliant':
        return 'bg-red-100 text-red-800';
      case 'partially_compliant':
        return 'bg-yellow-100 text-yellow-800';
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
          href="/dashboard"
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
          Formulation not found or you don't have access to it.
        </div>
        <a
          href="/dashboard"
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
        <h1 className="text-2xl font-bold">Formulation Details</h1>
        <a
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Dashboard
        </a>
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
            
            {formulation.description && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 mb-1">Description:</h3>
                <p className="text-gray-600">{formulation.description}</p>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Original File</h2>
            <div className="border border-gray-300 rounded-md p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">{formulation.original_file_name}</p>
                  <p className="text-sm text-gray-500">Uploaded on {new Date(formulation.created_at).toLocaleDateString()}</p>
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
            
            {formulation.payment_status !== 'paid' && (
              <div className="mt-6">
                <a
                  href={`/payment?formulationId=${formulationId}`}
                  className="w-full inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Complete Payment
                </a>
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
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ingredient) => (
                  <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.ingredients?.inci_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.ingredients?.cas_number || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.concentration}%</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.ingredients?.function || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {report && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Compliance Report</h2>
          <div className="mb-4">
            <span className="font-medium text-gray-700">Status:</span>{' '}
            <span className={`px-2 py-1 rounded-full text-xs ${getReportStatusBadgeClass(report.status)}`}>
              {report.status.replace('_', ' ')}
            </span>
          </div>
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Summary:</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{report.summary}</p>
          </div>
          {report.details && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Detailed Findings:</h3>
              <div className="text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                {report.details}
              </div>
            </div>
          )}
          <div className="mt-4 text-sm text-gray-500">
            Report generated on {new Date(report.created_at).toLocaleString()}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-600">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{comment.profiles?.company_name || 'Admin'}</span>
                  <span className="text-sm text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={handleAddComment}>
          <div className="mb-4">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Add Comment
            </label>
            <textarea
              id="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your comment here..."
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Comment
          </button>
        </form>
      </div>
    </div>
  );
}
