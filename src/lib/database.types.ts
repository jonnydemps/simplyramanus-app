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
      formulations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          product_type: string
          user_id: string
          status: string
          payment_status: string
          report_url: string | null
          comments: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          product_type: string
          user_id: string
          status?: string
          payment_status?: string
          report_url?: string | null
          comments?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          product_type?: string
          user_id?: string
          status?: string
          payment_status?: string
          report_url?: string | null
          comments?: Json | null
        }
      }
      ingredients: {
        Row: {
          id: string
          created_at: string
          name: string
          cas_number: string | null
          function: string | null
          concentration: number
          formulation_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          cas_number?: string | null
          function?: string | null
          concentration: number
          formulation_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          cas_number?: string | null
          function?: string | null
          concentration?: number
          formulation_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          user_id: string
          company_name: string
          is_admin: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          company_name: string
          is_admin?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          company_name?: string
          is_admin?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
