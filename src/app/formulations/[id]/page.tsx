'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types'; // Removed Json import as comments state is removed
import Link from 'next/link';

// Use base types from database.types.ts
// Note: Formulation type does NOT include 'comments' column based on corrected types
type Formulation = Database['public']['Tables']['formulations']['Row'];
type Ingredient = Database['public']['Tables']['ingredients']['Row'];
// Comments would be fetched separately if needed:
// type Comment = Database['public']['Tables']['comments']['Row']; 

// Define props type
interface PageProps {
  params: { id: string };
}

export default function FormulationDetails({ params }: PageProps) {
  const [formulation, setFormulation] = useState<Formulation | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  // Removed comments state - fetch separately if needed
  // const [comments, setComments] = useState<Json | null>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formulationId = params.id;

  useEffect(() => {
    const fetchFormulationDetails = async () => {
      // Check formulationId validity
      if (!formulationId || typeof formulationId !== 'string') {
        setError("Invalid or missing Formulation ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get the current user - needed for the ownership check below
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Should ideally be handled by middleware or layout, but good failsafe
          throw new Error('User not authenticated'); 
        }

        // Fetch formulation details - REMOVED 'comments' from select
        console.log(`Workspaceing formulation (user view): ${formulationId}`);
        const { data: formulationData, error: formulationError } = await supabase
          .from('formulations')
          .select('*') // Select all columns *from formulations table only*
          // If you need company name here too, add: .select('*, profiles(company_name)')
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
          setFormulation(formulationData); // Type should now match

          // Removed setting comments state:
          // setComments(formulationData?.comments || null); 

          // Fetch ingredients only if formulation was found
          console.log(`Workspaceing ingredients for formulation: ${formulationId}`);
          const { data: ingredientsData, error: ingredientsError } = await supabase
            .from('ingredients')
            .select('*')
            .eq('formulation_id', formulationId);

          if (ingredientsError) {
            console.error("Error fetching ingredients:", ingredientsError);
            setError(prev => prev ? `${prev}\nFailed to fetch ingredients.` : `Failed to fetch ingredients.`);
            setIngredients([]);
          } else {
             console.log("Ingredients data fetched:", ingredientsData);
             setIngredients(ingredientsData || []);
          }
        } else {
          setError(`Formulation with ID ${formulationId} not found.`);
          setFormulation(null);
          setIngredients([]);
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

  // getStatusBadgeClass function (keep as is)
  const getStatusBadgeClass = (status: string) => { /* ... */ };

  // --- Render logic (keep as is, but remove rendering of comments state) ---
  if (loading) { /* ... */ }
  if (error && !formulation) { /* ... */ } // Error display
  if (!formulation) { /* ... */ } // Not found display

  return (
    <div className="p-6">
      {/* ... Error display (for non-blocking errors) ... */}
      {/* ... Header ... */}
      {/* ... Formulation Details Section ... */}
      {/* ... Ingredients Section ... */}

      {/* --- REMOVED Comments Section Rendering --- */}
      {/* {comments && ( ... display comments ... )} */}

       {/* Removed unused Report section */}

    </div>
  );
}