'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CustomerDashboard() {
  const [formulations, setFormulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchFormulations = async () => {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Fetch formulations for the current user
        let query = supabase
          .from('formulations')
          .select(`
            *,
            reports(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        // Apply filters
        if (filter !== 'all') {
          query = query.eq('status', filter);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        setFormulations(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch formulations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormulations();
  }, [filter]);

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Formulations</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
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
          >
            <option value="all">All Formulations</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <a
          href="/formulations/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Upload New Formulation
        </a>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading formulations...</p>
        </div>
      ) : formulations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">No formulations found</h2>
          <p className="text-gray-600 mb-6">
            You haven't submitted any formulations yet. Get started by uploading your first formulation.
          </p>
          <a
            href="/formulations/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Upload Formulation
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formulations.map((formulation) => (
            <div key={formulation.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{formulation.name}</h2>
                <p className="text-gray-600 mb-4">
                  {formulation.description ? (
                    formulation.description.length > 100 
                      ? `${formulation.description.substring(0, 100)}...` 
                      : formulation.description
                  ) : (
                    `Product Type: ${formulation.product_type}`
                  )}
                </p>
                
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(formulation.status)}`}>
                      {formulation.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(formulation.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${formulation.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {formulation.payment_status}
                    </span>
                  </div>
                  <a
                    href={`/formulations/${formulation.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </a>
                </div>
                
                {formulation.reports && formulation.reports.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Report Available</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
