'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FormulationReview({ params }: { params: { id: string } }) {
  const [formulation, setFormulation] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState({
    status: 'compliant',
    summary: '',
    details: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

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
            profiles(company_name, contact_email)
          `)
          .eq('id', formulationId)
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
      setFormulation({ ...formulation, status: newStatus });
    } catch (err: any) {
      setError(err.message || 'Failed to update formulation status');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Create report
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          formulation_id: formulationId,
          reviewer_id: (await supabase.auth.getUser()).data.user?.id,
          status: reportData.status,
          summary: reportData.summary,
          details: reportData.details,
        })
        .select()
        .single();
      
      if (reportError) {
        throw reportError;
      }
      
      // Update formulation status to completed
      await handleStatusChange('completed');
      
      // Reset form
      setReportData({
        status: 'compliant',
        summary: '',
        details: '',
      });
      
      alert('Report submitted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }
    
    try {
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert({
          formulation_id: formulationId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
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
              </div>
              <div>
                <span className="font-medium text-gray-700">Contact:</span> {formulation.profiles?.contact_email}
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
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.ingredients?.inci_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.ingredients?.cas_number || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.concentration}%</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.ingredients?.function || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{ingredient.ingredients?.restrictions || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
      
      {formulation.status === 'in_review' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
          <form onSubmit={handleReportSubmit}>
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Compliance Status
              </label>
              <select
                id="status"
                value={reportData.status}
                onChange={(e) => setReportData({ ...reportData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="compliant">Compliant</option>
                <option value="non_compliant">Non-Compliant</option>
                <option value="partially_compliant">Partially Compliant</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                Summary
              </label>
              <textarea
                id="summary"
                value={reportData.summary}
                onChange={(e) => setReportData({ ...reportData, summary: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a summary of the compliance review..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                Detailed Report
              </label>
              <textarea
                id="details"
                value={reportData.details}
                onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter detailed findings and recommendations..."
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
