'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Removed unused import: import { createFormulation } from '@/lib/supabase';

export default function FormulationUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Please upload an Excel file (.xlsx or .xls)');
        setFile(null);
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!name) {
      setError('Please enter a name for the formulation');
      return;
    }
    
    if (!productType) {
      setError('Please select a product type');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('productType', productType);
      
      // Upload the file to the server
      const response = await fetch('/api/formulations/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload formulation');
      }
      
      const data = await response.json();
      
      // Redirect to payment page with the formulation ID
      router.push(`/payment?formulationId=${data.id}`);
    } catch (err: unknown) {
      let message = 'Failed to upload formulation';
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

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Upload Formulation</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Formulation Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-1">
            Product Type *
          </label>
          <select
            id="productType"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a product type</option>
            <option value="skincare">Skincare</option>
            <option value="haircare">Haircare</option>
            <option value="makeup">Makeup</option>
            <option value="fragrance">Fragrance</option>
            <option value="oral_care">Oral Care</option>
            <option value="body_care">Body Care</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            Excel Formulation File *
          </label>
          <input
            id="file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Please upload an Excel file (.xlsx or .xls) with your formulation details. Maximum file size: 10MB.
          </p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload and Continue to Payment'}
        </button>
      </form>
    </div>
  );
}
