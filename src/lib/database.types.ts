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
      companies: {
        Row: {
          id: string
          created_at: string
          owner_id: string
          name: string
          industry: string
          company_size: string
          logo_url: string | null
          integration_type: "API" | "Widget" | "Both"
          onboarding_completed: boolean
          website: string | null
          support_email: string | null
          total_conversations: number
          resolved_by_ai: number
          open_tickets: number
          avg_response_time: number
          csat_score: number
        }
        Insert: {
          id?: string
          created_at?: string
          owner_id: string
          name: string
          industry: string
          company_size: string
          logo_url?: string | null
          integration_type: "API" | "Widget" | "Both"
          onboarding_completed?: boolean
          website?: string | null
          support_email?: string | null
          total_conversations?: number
          resolved_by_ai?: number
          open_tickets?: number
          avg_response_time?: number
          csat_score?: number
        }
        Update: {
          id?: string
          created_at?: string
          owner_id?: string
          name?: string
          industry?: string
          company_size?: string
          logo_url?: string | null
          integration_type?: "API" | "Widget" | "Both"
          onboarding_completed?: boolean
          website?: string | null
          support_email?: string | null
          total_conversations?: number
          resolved_by_ai?: number
          open_tickets?: number
          avg_response_time?: number
          csat_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      business_rules: {
        Row: {
          id: string
          company_id: string
          refund_enabled: boolean
          refund_amount_limit: number
          refund_days: number
          replacement_enabled: boolean
          replacement_condition: string | null
          warranty_enabled: boolean
          warranty_months: number
          escalation_enabled: boolean
          escalation_order_amount: number
          timezone: string | null
          working_start: string | null
          working_end: string | null
          working_days: string[] | null
          custom_prompt: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          refund_enabled?: boolean
          refund_amount_limit?: number
          refund_days?: number
          replacement_enabled?: boolean
          replacement_condition?: string | null
          warranty_enabled?: boolean
          warranty_months?: number
          escalation_enabled?: boolean
          escalation_order_amount?: number
          timezone?: string | null
          working_start?: string | null
          working_end?: string | null
          working_days?: string[] | null
          custom_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          refund_enabled?: boolean
          refund_amount_limit?: number
          refund_days?: number
          replacement_enabled?: boolean
          replacement_condition?: string | null
          warranty_enabled?: boolean
          warranty_months?: number
          escalation_enabled?: boolean
          escalation_order_amount?: number
          timezone?: string | null
          working_start?: string | null
          working_end?: string | null
          working_days?: string[] | null
          custom_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [key: string]: never
    }
    Functions: {
      [key: string]: never
    }
    Enums: {
      [key: string]: never
    }
    CompositeTypes: {
      [key: string]: never
    }
  }
}
