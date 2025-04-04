import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Initialize the Supabase client
// In a production environment, these would be environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Authentication helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Database helper functions for formulations
export const getFormulations = async (userId: string) => {
  const { data, error } = await supabase
    .from('formulations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const getFormulation = async (id: string) => {
  const { data, error } = await supabase
    .from('formulations')
    .select(`
      *,
      formulation_ingredients (
        *,
        ingredients (*)
      ),
      reports (*)
    `)
    .eq('id', id)
    .single();
  
  return { data, error };
};

export const createFormulation = async (formulation: any) => {
  const { data, error } = await supabase
    .from('formulations')
    .insert(formulation)
    .select()
    .single();
  
  return { data, error };
};

export const updateFormulation = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('formulations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  return { data, error };
};

// Ingredients helper functions
export const getIngredients = async () => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('inci_name', { ascending: true });
  
  return { data, error };
};

export const createIngredient = async (ingredient: any) => {
  const { data, error } = await supabase
    .from('ingredients')
    .insert(ingredient)
    .select()
    .single();
  
  return { data, error };
};

// Profile helper functions
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
};

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
};
