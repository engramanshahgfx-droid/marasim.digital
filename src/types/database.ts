// Database types for Supabase tables
// This matches the schema defined in the technical architecture

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'user' | 'super_admin'
          account_type: 'free' | 'paid'
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'pending' | 'trial' | 'suspended'
          plan_type: 'free' | 'basic' | 'pro' | 'enterprise'
          subscription_expiry: string | null
          event_limit: number
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          whatsapp_limit_per_month: number
          whatsapp_sent_this_month: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'user' | 'super_admin'
          account_type?: 'free' | 'paid'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'pending' | 'trial' | 'suspended'
          plan_type?: 'free' | 'basic' | 'pro' | 'enterprise'
          subscription_expiry?: string | null
          event_limit?: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          whatsapp_limit_per_month?: number
          whatsapp_sent_this_month?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'user' | 'super_admin'
          account_type?: 'free' | 'paid'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'pending' | 'trial' | 'suspended'
          plan_type?: 'free' | 'basic' | 'pro' | 'enterprise'
          subscription_expiry?: string | null
          event_limit?: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          whatsapp_limit_per_month?: number
          whatsapp_sent_this_month?: number
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price_monthly: number
          price_yearly: number
          features: Json
          display_order: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_monthly: number
          price_yearly: number
          features?: Json
          display_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_monthly?: number
          price_yearly?: number
          features?: Json
          display_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string | null
          stripe_subscription_id: string | null
          status: 'active' | 'expired' | 'cancelled'
          current_period_start: string | null
          current_period_end: string | null
          auto_renew: boolean
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'expired' | 'cancelled'
          current_period_start?: string | null
          current_period_end?: string | null
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'expired' | 'cancelled'
          current_period_start?: string | null
          current_period_end?: string | null
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          stripe_payment_intent_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'paid' | 'failed'
          billing_cycle: 'monthly' | 'yearly' | 'once'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_intent_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'paid' | 'failed'
          billing_cycle?: 'monthly' | 'yearly' | 'once'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_payment_intent_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'paid' | 'failed'
          billing_cycle?: 'monthly' | 'yearly' | 'once'
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          name: string
          date: string
          time: string
          venue: string
          description: string | null
          event_type: string
          expected_guests: number
          status: 'draft' | 'upcoming' | 'ongoing' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          date: string
          time: string
          venue: string
          description?: string | null
          event_type?: string
          expected_guests?: number
          status?: 'draft' | 'upcoming' | 'ongoing' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          date?: string
          time?: string
          venue?: string
          description?: string | null
          event_type?: string
          expected_guests?: number
          status?: 'draft' | 'upcoming' | 'ongoing' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      guests: {
        Row: {
          id: string
          event_id: string
          name: string
          phone: string
          email: string | null
          status: 'confirmed' | 'declined' | 'no_response' | 'not_delivered'
          qr_token: string
          checked_in: boolean
          checked_in_at: string | null
          plus_ones: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          phone: string
          email?: string | null
          status?: 'confirmed' | 'declined' | 'no_response' | 'not_delivered'
          qr_token?: string
          checked_in?: boolean
          checked_in_at?: string | null
          plus_ones?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          phone?: string
          email?: string | null
          status?: 'confirmed' | 'declined' | 'no_response' | 'not_delivered'
          qr_token?: string
          checked_in?: boolean
          checked_in_at?: string | null
          plus_ones?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      checkins: {
        Row: {
          id: string
          guest_id: string
          event_id: string
          checked_in_by: string | null
          checked_in_at: string
          check_in_method: 'qr_scan' | 'manual'
        }
        Insert: {
          id?: string
          guest_id: string
          event_id: string
          checked_in_by?: string | null
          checked_in_at?: string
          check_in_method?: 'qr_scan' | 'manual'
        }
        Update: {
          id?: string
          guest_id?: string
          event_id?: string
          checked_in_by?: string | null
          checked_in_at?: string
          check_in_method?: 'qr_scan' | 'manual'
        }
      }
      invitation_templates: {
        Row: {
          id: string
          event_id: string
          user_id: string
          language: 'en' | 'ar'
          header_image: string | null
          title: string
          title_ar: string | null
          message: string
          message_ar: string | null
          footer_text: string
          footer_text_ar: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          language?: 'en' | 'ar'
          header_image?: string | null
          title: string
          title_ar?: string | null
          message: string
          message_ar?: string | null
          footer_text: string
          footer_text_ar?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          language?: 'en' | 'ar'
          header_image?: string | null
          title?: string
          title_ar?: string | null
          message?: string
          message_ar?: string | null
          footer_text?: string
          footer_text_ar?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          guest_id: string
          event_id: string
          message_type: 'invitation' | 'reminder' | 'update'
          status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
          sent_at: string | null
          delivered_at: string | null
          error_message: string | null
          retry_count: number
          created_at: string
        }
        Insert: {
          id?: string
          guest_id: string
          event_id: string
          message_type?: 'invitation' | 'reminder' | 'update'
          status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
          sent_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          retry_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          guest_id?: string
          event_id?: string
          message_type?: 'invitation' | 'reminder' | 'update'
          status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
          sent_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          retry_count?: number
          created_at?: string
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
      user_role: 'admin' | 'staff'
      event_status: 'draft' | 'upcoming' | 'ongoing' | 'completed'
      guest_status: 'confirmed' | 'declined' | 'no_response' | 'not_delivered'
      message_status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
      message_type: 'invitation' | 'reminder' | 'update'
      check_in_method: 'qr_scan' | 'manual'
    }
  }
}

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type User = Tables<'users'>
export type Event = Tables<'events'>
export type Guest = Tables<'guests'>
export type InvitationTemplate = Tables<'invitation_templates'>
export type Message = Tables<'messages'>
export type Checkin = Tables<'checkins'>
