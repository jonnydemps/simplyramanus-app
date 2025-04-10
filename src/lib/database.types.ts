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
      // --- comments Table (Reconstructed - VERIFY FK NAMES) ---
      comments: {
        Row: {
          id: string
          formulation_id: string
          user_id: string // FK to profiles.id
          content: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          formulation_id: string
          user_id: string
          content: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          formulation_id?: string
          user_id?: string
          content?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_formulation_id_fkey" // CHECK ACTUAL FK NAME!
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "formulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey" // CHECK ACTUAL FK NAME!
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }, // <<< Comma between tables

      // --- formulations Table (As provided, added Relationships - VERIFY FK NAMES) ---
      formulations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          product_type: string
          user_id: string // FK referencing profiles.id
          description: string | null
          status: string
          payment_status: string
          payment_id: string | null
          original_file_name: string | null
          file_path: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          name: string
          product_type: string
          user_id: string
          description?: string | null
          status?: string
          payment_status?: string
          payment_id?: string | null
          original_file_name?: string | null
          file_path?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          name?: string
          product_type?: string
          user_id?: string
          description?: string | null
          status?: string
          payment_status?: string
          payment_id?: string | null
          original_file_name?: string | null
          file_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formulations_user_id_fkey" // CHECK ACTUAL FK NAME!
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
          // Add relationship to payments if needed, check FK name
        ]
      }, // <<< Comma between tables

      // --- ingredients Table (As provided, added Relationships - VERIFY FK NAMES) ---
      ingredients: {
        Row: {
          id: string
          formulation_id: string
          inci_name: string
          cas_number: string | null
          function: string | null
          concentration: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          formulation_id: string
          inci_name: string
          cas_number?: string | null
          function?: string | null
          concentration: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          formulation_id?: string
          inci_name?: string
          cas_number?: string | null
          function?: string | null
          concentration?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
         {
            foreignKeyName: "ingredients_formulation_id_fkey" // CHECK ACTUAL!
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "formulations"
            referencedColumns: ["id"]
          }
        ]
      }, // <<< Comma between tables

      // --- payments Table (Reconstructed - VERIFY FK NAMES) ---
      payments: {
         Row: {
            id: string
            formulation_id: string
            user_id: string // FK to profiles.id
            amount: number
            currency: string | null
            status: string
            stripe_payment_intent_id: string | null
            created_at: string | null
            updated_at: string | null
         }
         Insert: {
            id?: string
            formulation_id: string
            user_id: string
            amount: number
            currency?: string | null
            status?: string
            stripe_payment_intent_id?: string | null
            created_at?: string | null
            updated_at?: string | null
         }
         Update: {
            id?: string
            formulation_id?: string
            user_id?: string
            amount?: number
            currency?: string | null
            status?: string
            stripe_payment_intent_id?: string | null
            created_at?: string | null
            updated_at?: string | null
         }
         Relationships: [
           {
             foreignKeyName: "payments_formulation_id_fkey" // CHECK ACTUAL!
             columns: ["formulation_id"]
             isOneToOne: false
             referencedRelation: "formulations"
             referencedColumns: ["id"]
           },
           {
             foreignKeyName: "payments_user_id_fkey" // CHECK ACTUAL!
             columns: ["user_id"]
             isOneToOne: false
             referencedRelation: "profiles"
             referencedColumns: ["id"]
           }
         ]
      }, // <<< Comma between tables

      // --- CORRECTED profiles DEFINITION ---
      profiles: {
        Row: {
          id: string
          company_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          updated_at: string | null
          is_admin: boolean | null
        }
        Insert: {
          id: string
          company_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_admin?: boolean | null
        }
        Update: {
          id?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_admin?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }, // <<< Comma between tables

      // --- reports Table (Reconstructed - VERIFY FK NAMES) ---
      reports: {
          Row: {
            id: string
            formulation_id: string
            title: string
            content: string
            created_at: string | null
            updated_at: string | null
          }
          Insert: {
            id?: string
            formulation_id: string
            title: string
            content: string
            created_at?: string | null
            updated_at?: string | null
          }
          Update: {
            id?: string
            formulation_id?: string
            title?: string
            content?: string
            created_at?: string | null
            updated_at?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "reports_formulation_id_fkey" // CHECK ACTUAL!
              columns: ["formulation_id"]
              isOneToOne: false
              referencedRelation: "formulations"
              referencedColumns: ["id"]
            }
          ]
      } // <<< No comma needed as this is the last table definition
    } // End Tables
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  } // End public
} // End Database interface

// --- CORRECTED Standard helper types ---
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends // This is the correct variable for Enums
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"] // Corrected variable name here
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName] // Correct variable name used
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions] // Correct variable name used
    : never
// --- End Corrected helper types ---