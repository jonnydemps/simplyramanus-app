export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          company_name: string
          contact_name: string | null
          contact_email: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_name: string
          contact_name?: string | null
          contact_email: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          contact_name?: string | null
          contact_email?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      formulations: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          product_type: string
          status: string
          original_file_name: string
          file_path: string
          report_path: string | null
          payment_status: string
          payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          product_type: string
          status?: string
          original_file_name: string
          file_path: string
          report_path?: string | null
          payment_status?: string
          payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          product_type?: string
          status?: string
          original_file_name?: string
          file_path?: string
          report_path?: string | null
          payment_status?: string
          payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          inci_name: string
          cas_number: string | null
          function: string | null
          max_concentration: number | null
          restrictions: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inci_name: string
          cas_number?: string | null
          function?: string | null
          max_concentration?: number | null
          restrictions?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inci_name?: string
          cas_number?: string | null
          function?: string | null
          max_concentration?: number | null
          restrictions?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      formulation_ingredients: {
        Row: {
          id: string
          formulation_id: string
          ingredient_id: string
          concentration: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          formulation_id: string
          ingredient_id: string
          concentration: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          formulation_id?: string
          ingredient_id?: string
          concentration?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          formulation_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          formulation_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          formulation_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          formulation_id: string
          reviewer_id: string
          status: string
          summary: string
          details: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          formulation_id: string
          reviewer_id: string
          status: string
          summary: string
          details?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          formulation_id?: string
          reviewer_id?: string
          status?: string
          summary?: string
          details?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          formulation_id: string
          amount: number
          currency: string
          stripe_payment_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          formulation_id: string
          amount: number
          currency?: string
          stripe_payment_id: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          formulation_id?: string
          amount?: number
          currency?: string
          stripe_payment_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
