'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [formulations, setFormulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchFormulations = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, we would check if the user is an admin
        // For now, we'll just fetch all formulations
        let query = supabase
          .from('formulations')
          .select(`
            *,
            profiles(company_name, contact_email)
          `)
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

  const handleStatusChange = async (formulationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('formulations')
        .update({ status: newStatus })
        .eq('id', formulationId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setFormulations(formulations.map(formulation => 
        formulation.id === formulationId 
          ? { ...formulation, status: newStatus } 
          : formulation
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update formulation status');
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6">
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
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading formulations...</p>
        </div>
      ) : formulations.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">No formulations found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-100 border-b">
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
                  <td className="py-3 px-4 text-sm text-gray-700">{formulation.id.slice(0, 8)}...</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formulation.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formulation.profiles?.company_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formulation.product_type}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(formulation.status)}`}>
                      {formulation.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${formulation.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {formulation.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {new Date(formulation.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <a
                        href={`/admin/formulations/${formulation.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Review
                      </a>
                      {formulation.status === 'pending' && formulation.payment_status === 'paid' && (
                        <button
                          onClick={() => handleStatusChange(formulation.id, 'in_review')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Start Review
                        </button>
                      )}
                      {formulation.status === 'in_review' && (
                        <button
                          onClick={() => handleStatusChange(formulation.id, 'completed')}
                          className="text-green-600 hover:text-green-800"
                        >
                          Complete
                        </button>
                      )}
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
