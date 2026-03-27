// ============================================================
// KREWTREE — Database Types
// Regenerate from a running local instance with:
//   supabase gen types typescript --local > src/lib/database.types.ts
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      industries: {
        Row: {
          id: string
          name: string
          slug: string
          color: string | null
          job_count: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          slug: string
          color?: string | null
          job_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          color?: string | null
          job_count?: number
          created_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          industry_id: string
          name: string
          aliases: string[]
          created_at: string
        }
        Insert: {
          id: string
          industry_id: string
          name: string
          aliases?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          industry_id?: string
          name?: string
          aliases?: string[]
          created_at?: string
        }
        Relationships: []
      }
      location_regions: {
        Row: {
          id: string
          city: string
          state: string
          slug: string
          job_count: number
          featured_industries: string[]
          created_at: string
        }
        Insert: {
          id: string
          city: string
          state: string
          slug: string
          job_count?: number
          featured_industries?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          city?: string
          state?: string
          slug?: string
          job_count?: number
          featured_industries?: string[]
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: { id: string; role: 'worker' | 'company'; created_at: string }
        Insert: { id: string; role: 'worker' | 'company'; created_at?: string }
        Update: { id?: string; role?: 'worker' | 'company'; created_at?: string }
        Relationships: []
      }
      worker_profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          city: string
          region: string
          phone: string
          primary_trade: string
          bio: string
          avatar_url: string | null
          is_regulix_ready: boolean
          performance_score: number | null
          profile_complete_pct: number
          total_hours_worked: number | null
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string
          last_name?: string
          city?: string
          region?: string
          phone?: string
          primary_trade?: string
          bio?: string
          avatar_url?: string | null
          is_regulix_ready?: boolean
          performance_score?: number | null
          profile_complete_pct?: number
          total_hours_worked?: number | null
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['worker_profiles']['Insert']>
        Relationships: []
      }
      worker_industries: {
        Row: { worker_id: string; industry_id: string }
        Insert: { worker_id: string; industry_id: string }
        Update: { worker_id?: string; industry_id?: string }
        Relationships: []
      }
      worker_skills: {
        Row: {
          id: string
          worker_id: string
          industry_id: string | null
          skill_id: string | null
          name: string
          years_exp: number | null
          source: 'suggested' | 'custom'
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          industry_id?: string | null
          skill_id?: string | null
          name: string
          years_exp?: number | null
          source?: 'suggested' | 'custom'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['worker_skills']['Insert']>
        Relationships: []
      }
      worker_certifications: {
        Row: {
          id: string
          worker_id: string
          cert_name: string
          issuing_body: string
          expiry_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          cert_name: string
          issuing_body?: string
          expiry_date?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['worker_certifications']['Insert']>
        Relationships: []
      }
      worker_social_links: {
        Row: { id: string; worker_id: string; platform: string; url: string; created_at: string }
        Insert: {
          id?: string
          worker_id: string
          platform: string
          url?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['worker_social_links']['Insert']>
        Relationships: []
      }
      worker_work_history: {
        Row: {
          id: string
          worker_id: string
          employer_name: string
          role_title: string
          start_date: string | null
          end_date: string | null
          is_current: boolean
          contract_type: 'day_rate' | 'project' | 'long_term_temp' | ''
          industry_id: string | null
          description: string
          is_regulix_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          employer_name: string
          role_title?: string
          start_date?: string | null
          end_date?: string | null
          is_current?: boolean
          contract_type?: 'day_rate' | 'project' | 'long_term_temp' | ''
          industry_id?: string | null
          description?: string
          is_regulix_verified?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['worker_work_history']['Insert']>
        Relationships: []
      }
      worker_resumes: {
        Row: {
          id: string
          worker_id: string
          filename: string
          file_path: string | null
          file_type: 'pdf' | 'doc' | 'docx' | null
          size_kb: number | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          filename: string
          file_path?: string | null
          file_type?: 'pdf' | 'doc' | 'docx' | null
          size_kb?: number | null
          is_primary?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['worker_resumes']['Insert']>
        Relationships: []
      }
      worker_portfolio_items: {
        Row: {
          id: string
          worker_id: string
          title: string
          description: string
          project_date: string | null
          tags: string[]
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          title: string
          description?: string
          project_date?: string | null
          tags?: string[]
          image_url?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['worker_portfolio_items']['Insert']>
        Relationships: []
      }
      skill_endorsements: {
        Row: {
          id: string
          worker_id: string
          skill_name: string
          endorser_id: string | null
          endorser_name: string
          endorser_initials: string
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          skill_name: string
          endorser_id?: string | null
          endorser_name?: string
          endorser_initials?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['skill_endorsements']['Insert']>
        Relationships: []
      }
      company_profiles: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          location: string
          industry: string
          is_verified: boolean
          description: string
          size: string
          website: string
          tagline: string
          culture: string
          mission: string
          team_size: number | null
          founded: number | null
          headquarters: string
          avg_rating: number
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          logo_url?: string | null
          location?: string
          industry?: string
          is_verified?: boolean
          description?: string
          size?: string
          website?: string
          tagline?: string
          culture?: string
          mission?: string
          team_size?: number | null
          founded?: number | null
          headquarters?: string
          avg_rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['company_profiles']['Insert']>
        Relationships: []
      }
      company_benefits: {
        Row: { id: string; company_id: string; icon: string; label: string; display_order: number }
        Insert: {
          id?: string
          company_id: string
          icon?: string
          label: string
          display_order?: number
        }
        Update: Partial<Database['public']['Tables']['company_benefits']['Insert']>
        Relationships: []
      }
      company_perks: {
        Row: { id: string; company_id: string; label: string; display_order: number }
        Insert: { id?: string; company_id: string; label: string; display_order?: number }
        Update: Partial<Database['public']['Tables']['company_perks']['Insert']>
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          company_id: string
          title: string
          industry: string
          industry_slug: string
          type: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | null
          location: string
          pay_min: number | null
          pay_max: number | null
          pay_type: 'hour' | 'salary' | null
          description: string
          requirements: string[]
          skills: string[]
          is_sponsored: boolean
          regulix_ready_applicants: number
          total_applicants: number
          status: 'active' | 'paused' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          industry?: string
          industry_slug?: string
          type?: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | null
          location?: string
          pay_min?: number | null
          pay_max?: number | null
          pay_type?: 'hour' | 'salary' | null
          description?: string
          requirements?: string[]
          skills?: string[]
          is_sponsored?: boolean
          regulix_ready_applicants?: number
          total_applicants?: number
          status?: 'active' | 'paused' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
        Relationships: []
      }
      job_analytics: {
        Row: {
          job_id: string
          views_total: number
          applications_total: number
          views_by_day: number[]
          applications_by_day: number[]
          conversion_rate: number
          avg_time_to_apply_hours: number
          updated_at: string
        }
        Insert: {
          job_id: string
          views_total?: number
          applications_total?: number
          views_by_day?: number[]
          applications_by_day?: number[]
          conversion_rate?: number
          avg_time_to_apply_hours?: number
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['job_analytics']['Insert']>
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          worker_id: string
          job_id: string
          status: 'Applied' | 'Viewed' | 'Interviewing' | 'Offer' | 'Rejected'
          is_boosted: boolean
          kanban_stage: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          job_id: string
          status?: 'Applied' | 'Viewed' | 'Interviewing' | 'Offer' | 'Rejected'
          is_boosted?: boolean
          kanban_stage?: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
        Relationships: []
      }
      application_events: {
        Row: {
          id: string
          application_id: string
          status: string
          note: string
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          status: string
          note?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['application_events']['Insert']>
        Relationships: []
      }
      saved_jobs: {
        Row: { id: string; worker_id: string; job_id: string; note: string; created_at: string }
        Insert: {
          id?: string
          worker_id: string
          job_id: string
          note?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['saved_jobs']['Insert']>
        Relationships: []
      }
      saved_searches: {
        Row: {
          id: string
          worker_id: string
          label: string
          query: string
          industry_slug: string | null
          types: string[]
          pay_range_idx: number
          regulix_only: boolean
          alert_enabled: boolean
          new_matches_count: number
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          label: string
          query?: string
          industry_slug?: string | null
          types?: string[]
          pay_range_idx?: number
          regulix_only?: boolean
          alert_enabled?: boolean
          new_matches_count?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['saved_searches']['Insert']>
        Relationships: []
      }
      company_reviews: {
        Row: {
          id: string
          worker_id: string
          company_id: string
          rating: number
          title: string
          body: string
          pros: string
          cons: string
          recommend: boolean
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          company_id: string
          rating: number
          title?: string
          body?: string
          pros?: string
          cons?: string
          recommend?: boolean
          is_verified?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['company_reviews']['Insert']>
        Relationships: []
      }
      worker_reviews: {
        Row: {
          id: string
          worker_id: string
          reviewer_id: string | null
          employer_name: string
          employer_initials: string
          rating: number
          commentary: string
          worker_reply: string | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          reviewer_id?: string | null
          employer_name: string
          employer_initials?: string
          rating: number
          commentary?: string
          worker_reply?: string | null
          source?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['worker_reviews']['Insert']>
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          worker_id: string
          company_id: string
          job_id: string | null
          unread_count: number
          last_activity: string
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          company_id: string
          job_id?: string | null
          unread_count?: number
          last_activity?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          is_company: boolean
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          is_company?: boolean
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'application' | 'message' | 'status_change' | 'job_alert' | 'review'
          title: string
          body: string
          link: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'application' | 'message' | 'status_change' | 'job_alert' | 'review'
          title: string
          body?: string
          link?: string
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          name: string
          email: string
          type: 'worker' | 'company'
          status: 'pending' | 'joined' | 'hired'
          reward: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          name: string
          email?: string
          type: 'worker' | 'company'
          status?: 'pending' | 'joined' | 'hired'
          reward?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['referrals']['Insert']>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_my_role: { Args: Record<PropertyKey, never>; Returns: string | null }
      setup_worker_profile: {
        Args: {
          p_user_id: string
          p_first_name?: string
          p_last_name?: string
          p_city?: string
          p_region?: string
        }
        Returns: undefined
      }
      setup_company_profile: { Args: { p_user_id: string; p_name?: string }; Returns: undefined }
      upsert_worker_profile: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_city: string
          p_region: string
          p_phone: string
          p_primary_trade: string
          p_bio: string
          p_industries: string[]
          p_skills: Json
          p_certs: Json
          p_social_links: Json
          p_work_history: Json
        }
        Returns: undefined
      }
      increment_job_view: { Args: { p_job_id: string }; Returns: undefined }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// ── Convenience row types ──────────────────────────────────
type T = Database['public']['Tables']

export type WorkerProfileRow = T['worker_profiles']['Row']
export type WorkerSkillRow = T['worker_skills']['Row']
export type WorkerCertRow = T['worker_certifications']['Row']
export type WorkerSocialLinkRow = T['worker_social_links']['Row']
export type WorkerWorkHistoryRow = T['worker_work_history']['Row']
export type CompanyProfileRow = T['company_profiles']['Row']
export type JobRow = T['jobs']['Row']
export type ApplicationRow = T['applications']['Row']
export type NotificationRow = T['notifications']['Row']
export type IndustryRow = T['industries']['Row']
export type UserRoleRow = T['user_roles']['Row']
