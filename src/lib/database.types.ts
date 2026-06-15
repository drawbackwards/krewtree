export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4'
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      application_events: {
        Row: {
          application_id: string
          created_at: string
          id: string
          note: string
          status: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          note?: string
          status: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          note?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'application_events_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
        ]
      }
      application_log: {
        Row: {
          actor: string
          actor_id: string | null
          application_id: string
          created_at: string
          description: string
          event_type: string
          id: string
          note_body: string | null
          stage_id: string | null
          task_label: string | null
        }
        Insert: {
          actor?: string
          actor_id?: string | null
          application_id: string
          created_at?: string
          description: string
          event_type: string
          id?: string
          note_body?: string | null
          stage_id?: string | null
          task_label?: string | null
        }
        Update: {
          actor?: string
          actor_id?: string | null
          application_id?: string
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          note_body?: string | null
          stage_id?: string | null
          task_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'application_log_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'application_log_stage_id_fkey'
            columns: ['stage_id']
            isOneToOne: false
            referencedRelation: 'pipeline_stage'
            referencedColumns: ['id']
          },
        ]
      }
      application_notes: {
        Row: {
          application_id: string
          author_id: string
          author_name: string
          created_at: string
          id: string
          text: string
        }
        Insert: {
          application_id: string
          author_id: string
          author_name: string
          created_at?: string
          id?: string
          text: string
        }
        Update: {
          application_id?: string
          author_id?: string
          author_name?: string
          created_at?: string
          id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: 'application_notes_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
        ]
      }
      application_stage_notes: {
        Row: {
          application_id: string
          id: string
          notes: string | null
          stage_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          application_id: string
          id?: string
          notes?: string | null
          stage_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          application_id?: string
          id?: string
          notes?: string | null
          stage_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'application_stage_notes_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
        ]
      }
      application_task: {
        Row: {
          application_id: string
          auto_send: boolean
          calendar_link: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          display_order: number
          due_date: string | null
          id: string
          is_flagged: boolean
          is_required: boolean
          label: string
          message_body: string | null
          message_sent_at: string | null
          message_subject: string | null
          skipped_at: string | null
          skipped_by: string | null
          source: string
          stage_id: string | null
          template_task_id: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          auto_send?: boolean
          calendar_link?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          display_order?: number
          due_date?: string | null
          id?: string
          is_flagged?: boolean
          is_required?: boolean
          label: string
          message_body?: string | null
          message_sent_at?: string | null
          message_subject?: string | null
          skipped_at?: string | null
          skipped_by?: string | null
          source: string
          stage_id?: string | null
          template_task_id?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          auto_send?: boolean
          calendar_link?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          display_order?: number
          due_date?: string | null
          id?: string
          is_flagged?: boolean
          is_required?: boolean
          label?: string
          message_body?: string | null
          message_sent_at?: string | null
          message_subject?: string | null
          skipped_at?: string | null
          skipped_by?: string | null
          source?: string
          stage_id?: string | null
          template_task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'application_task_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'application_task_template_task_id_fkey'
            columns: ['template_task_id']
            isOneToOne: false
            referencedRelation: 'pipeline_stage_task_template'
            referencedColumns: ['id']
          },
        ]
      }
      application_task_note: {
        Row: {
          application_id: string
          application_task_id: string
          body: string
          created_at: string
          created_by: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          application_id: string
          application_task_id: string
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          application_id?: string
          application_task_id?: string
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'application_task_note_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'application_task_note_application_task_id_fkey'
            columns: ['application_task_id']
            isOneToOne: false
            referencedRelation: 'application_task'
            referencedColumns: ['id']
          },
        ]
      }
      applications: {
        Row: {
          application_source: string | null
          company_id: string
          created_at: string
          current_stage_id: string | null
          id: string
          interview_answers: Json
          is_boosted: boolean
          is_shortlisted: boolean
          job_id: string
          match_score: number
          notes: string
          status: string
          status_updated_at: string | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          application_source?: string | null
          company_id?: string
          created_at?: string
          current_stage_id?: string | null
          id?: string
          interview_answers?: Json
          is_boosted?: boolean
          is_shortlisted?: boolean
          job_id: string
          match_score?: number
          notes?: string
          status?: string
          status_updated_at?: string | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          application_source?: string | null
          company_id?: string
          created_at?: string
          current_stage_id?: string | null
          id?: string
          interview_answers?: Json
          is_boosted?: boolean
          is_shortlisted?: boolean
          job_id?: string
          match_score?: number
          notes?: string
          status?: string
          status_updated_at?: string | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'applications_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'applications_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      company_additional_locations: {
        Row: {
          city: string
          company_id: string
          created_at: string
          display_order: number
          id: string
          name: string
          postal_code: string
          radius: number | null
          state: string
          street: string
          updated_at: string
        }
        Insert: {
          city?: string
          company_id: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          postal_code?: string
          radius?: number | null
          state?: string
          street?: string
          updated_at?: string
        }
        Update: {
          city?: string
          company_id?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          postal_code?: string
          radius?: number | null
          state?: string
          street?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_additional_locations_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      company_benefits: {
        Row: {
          company_id: string
          display_order: number
          icon: string
          id: string
          label: string
        }
        Insert: {
          company_id: string
          display_order?: number
          icon?: string
          id?: string
          label: string
        }
        Update: {
          company_id?: string
          display_order?: number
          icon?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_benefits_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      company_licenses: {
        Row: {
          company_id: string
          created_at: string
          display_order: number
          expiration_date: string | null
          id: string
          jurisdiction: string
          license_number: string
          license_type: string
          updated_at: string
          verification_payload: unknown | null
          verification_status: string
          verified_at: string | null
          verifier: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          display_order?: number
          expiration_date?: string | null
          id?: string
          jurisdiction: string
          license_number: string
          license_type: string
          updated_at?: string
          verification_payload?: unknown | null
          verification_status?: string
          verified_at?: string | null
          verifier?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          display_order?: number
          expiration_date?: string | null
          id?: string
          jurisdiction?: string
          license_number?: string
          license_type?: string
          updated_at?: string
          verification_payload?: unknown | null
          verification_status?: string
          verified_at?: string | null
          verifier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'company_licenses_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      company_perks: {
        Row: {
          company_id: string
          display_order: number
          id: string
          label: string
        }
        Insert: {
          company_id: string
          display_order?: number
          id?: string
          label: string
        }
        Update: {
          company_id?: string
          display_order?: number
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_perks_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      company_photos: {
        Row: {
          caption: string
          company_id: string
          created_at: string
          display_order: number
          id: string
          url: string
        }
        Insert: {
          caption?: string
          company_id: string
          created_at?: string
          display_order?: number
          id?: string
          url: string
        }
        Update: {
          caption?: string
          company_id?: string
          created_at?: string
          display_order?: number
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_photos_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      company_pipeline: {
        Row: {
          company_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_pipeline_company_id_fkey'
            columns: ['company_id']
            isOneToOne: true
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      company_profiles: {
        Row: {
          additional_industries: string[]
          address_public: boolean
          applicants_view: string
          avg_rating: number
          contract_types: string[]
          created_at: string
          culture: string
          deleted_at: string | null
          description: string
          email_public: boolean
          facebook_url: string
          founded: number | null
          headquarters: string
          hq_city: string
          hq_postal_code: string
          hq_state: string
          hq_street: string
          id: string
          industry: string
          instagram_url: string
          is_verified: boolean
          linkedin_url: string
          location: string
          logo_url: string | null
          mission: string
          name: string
          phone: string
          phone_public: boolean
          profile_complete_pct: number
          regulix_connected: boolean
          review_count: number
          service_area_override: string
          service_area_radius: number
          size: string
          tagline: string
          team_size: number | null
          tiktok_url: string
          updated_at: string
          website: string
          youtube_url: string
        }
        Insert: {
          additional_industries?: string[]
          address_public?: boolean
          applicants_view?: string
          avg_rating?: number
          contract_types?: string[]
          created_at?: string
          culture?: string
          deleted_at?: string | null
          description?: string
          email_public?: boolean
          facebook_url?: string
          founded?: number | null
          headquarters?: string
          hq_city?: string
          hq_postal_code?: string
          hq_state?: string
          hq_street?: string
          id: string
          industry?: string
          instagram_url?: string
          is_verified?: boolean
          linkedin_url?: string
          location?: string
          logo_url?: string | null
          mission?: string
          name?: string
          phone?: string
          phone_public?: boolean
          profile_complete_pct?: number
          regulix_connected?: boolean
          review_count?: number
          service_area_override?: string
          service_area_radius?: number
          size?: string
          tagline?: string
          team_size?: number | null
          tiktok_url?: string
          updated_at?: string
          website?: string
          youtube_url?: string
        }
        Update: {
          additional_industries?: string[]
          address_public?: boolean
          applicants_view?: string
          avg_rating?: number
          contract_types?: string[]
          created_at?: string
          culture?: string
          deleted_at?: string | null
          description?: string
          email_public?: boolean
          facebook_url?: string
          founded?: number | null
          headquarters?: string
          hq_city?: string
          hq_postal_code?: string
          hq_state?: string
          hq_street?: string
          id?: string
          industry?: string
          instagram_url?: string
          is_verified?: boolean
          linkedin_url?: string
          location?: string
          logo_url?: string | null
          mission?: string
          name?: string
          phone?: string
          phone_public?: boolean
          profile_complete_pct?: number
          regulix_connected?: boolean
          review_count?: number
          service_area_override?: string
          service_area_radius?: number
          size?: string
          tagline?: string
          team_size?: number | null
          tiktok_url?: string
          updated_at?: string
          website?: string
          youtube_url?: string
        }
        Relationships: []
      }
      company_reviews: {
        Row: {
          body: string
          company_id: string
          cons: string
          created_at: string
          id: string
          is_verified: boolean
          pros: string
          rating: number
          recommend: boolean
          title: string
          worker_id: string
        }
        Insert: {
          body?: string
          company_id: string
          cons?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          pros?: string
          rating: number
          recommend?: boolean
          title?: string
          worker_id: string
        }
        Update: {
          body?: string
          company_id?: string
          cons?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          pros?: string
          rating?: number
          recommend?: boolean
          title?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_reviews_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'company_reviews_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      message: {
        Row: {
          application_id: string | null
          application_task_id: string | null
          body: string
          calendar_link: string | null
          company_id: string
          id: string
          read_at: string | null
          sent_at: string
          sent_by: string
          worker_id: string
        }
        Insert: {
          application_id?: string | null
          application_task_id?: string | null
          body: string
          calendar_link?: string | null
          company_id: string
          id?: string
          read_at?: string | null
          sent_at?: string
          sent_by: string
          worker_id: string
        }
        Update: {
          application_id?: string | null
          application_task_id?: string | null
          body?: string
          calendar_link?: string | null
          company_id?: string
          id?: string
          read_at?: string | null
          sent_at?: string
          sent_by?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'message_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_application_task_id_fkey'
            columns: ['application_task_id']
            isOneToOne: false
            referencedRelation: 'application_task'
            referencedColumns: ['id']
          },
        ]
      }
      industries: {
        Row: {
          color: string | null
          created_at: string
          id: string
          job_count: number
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id: string
          job_count?: number
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          job_count?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          applicant_id: string | null
          created_at: string
          duration_minutes: number
          interview_id: string
          job_id: string | null
          location_or_link: string | null
          scheduled_at: string
          status: string
        }
        Insert: {
          applicant_id?: string | null
          created_at?: string
          duration_minutes?: number
          interview_id?: string
          job_id?: string | null
          location_or_link?: string | null
          scheduled_at: string
          status?: string
        }
        Update: {
          applicant_id?: string | null
          created_at?: string
          duration_minutes?: number
          interview_id?: string
          job_id?: string | null
          location_or_link?: string | null
          scheduled_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'interviews_applicant_id_fkey'
            columns: ['applicant_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'interviews_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
        ]
      }
      job_analytics: {
        Row: {
          applications_by_day: number[]
          applications_total: number
          avg_time_to_apply_hours: number
          conversion_rate: number
          job_id: string
          updated_at: string
          views_by_day: number[]
          views_total: number
        }
        Insert: {
          applications_by_day?: number[]
          applications_total?: number
          avg_time_to_apply_hours?: number
          conversion_rate?: number
          job_id: string
          updated_at?: string
          views_by_day?: number[]
          views_total?: number
        }
        Update: {
          applications_by_day?: number[]
          applications_total?: number
          avg_time_to_apply_hours?: number
          conversion_rate?: number
          job_id?: string
          updated_at?: string
          views_by_day?: number[]
          views_total?: number
        }
        Relationships: [
          {
            foreignKeyName: 'job_analytics_job_id_fkey'
            columns: ['job_id']
            isOneToOne: true
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
        ]
      }
      jobs: {
        Row: {
          auto_pause_limit: number | null
          closed_at: string | null
          closing_at: string | null
          company_id: string
          created_at: string
          description: string
          end_date: string | null
          experience_level: string | null
          id: string
          industry: string
          industry_slug: string
          is_regulix_preferred: boolean
          is_sponsored: boolean
          is_urgent: boolean
          location: string
          paused_at: string | null
          pay_max: number | null
          pay_min: number | null
          pay_type: string | null
          pipeline_snapshot: Json | null
          pre_interview_questions: string[]
          regulix_preferred: boolean
          regulix_ready_applicants: number
          requirements: string[]
          skills: string[]
          start_date: string | null
          status: string
          title: string
          total_applicants: number
          type: string | null
          updated_at: string
          urgent_hiring: boolean
        }
        Insert: {
          auto_pause_limit?: number | null
          closed_at?: string | null
          closing_at?: string | null
          company_id: string
          created_at?: string
          description?: string
          end_date?: string | null
          experience_level?: string | null
          id?: string
          industry?: string
          industry_slug?: string
          is_regulix_preferred?: boolean
          is_sponsored?: boolean
          is_urgent?: boolean
          location?: string
          paused_at?: string | null
          pay_max?: number | null
          pay_min?: number | null
          pay_type?: string | null
          pipeline_snapshot?: Json | null
          pre_interview_questions?: string[]
          regulix_preferred?: boolean
          regulix_ready_applicants?: number
          requirements?: string[]
          skills?: string[]
          start_date?: string | null
          status?: string
          title: string
          total_applicants?: number
          type?: string | null
          updated_at?: string
          urgent_hiring?: boolean
        }
        Update: {
          auto_pause_limit?: number | null
          closed_at?: string | null
          closing_at?: string | null
          company_id?: string
          created_at?: string
          description?: string
          end_date?: string | null
          experience_level?: string | null
          id?: string
          industry?: string
          industry_slug?: string
          is_regulix_preferred?: boolean
          is_sponsored?: boolean
          is_urgent?: boolean
          location?: string
          paused_at?: string | null
          pay_max?: number | null
          pay_min?: number | null
          pay_type?: string | null
          pipeline_snapshot?: Json | null
          pre_interview_questions?: string[]
          regulix_preferred?: boolean
          regulix_ready_applicants?: number
          requirements?: string[]
          skills?: string[]
          start_date?: string | null
          status?: string
          title?: string
          total_applicants?: number
          type?: string | null
          updated_at?: string
          urgent_hiring?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'jobs_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      krew_list_memberships: {
        Row: {
          added_at: string
          list_id: string
          worker_id: string
        }
        Insert: {
          added_at?: string
          list_id: string
          worker_id: string
        }
        Update: {
          added_at?: string
          list_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'krew_list_memberships_list_id_fkey'
            columns: ['list_id']
            isOneToOne: false
            referencedRelation: 'krew_lists'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'krew_list_memberships_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      krew_lists: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'krew_lists_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      krew_relationships: {
        Row: {
          added_at: string
          company_id: string
          in_krew: boolean
          last_interaction_at: string | null
          removed_at: string | null
          source: string
          worker_id: string
        }
        Insert: {
          added_at?: string
          company_id: string
          in_krew?: boolean
          last_interaction_at?: string | null
          removed_at?: string | null
          source?: string
          worker_id: string
        }
        Update: {
          added_at?: string
          company_id?: string
          in_krew?: boolean
          last_interaction_at?: string | null
          removed_at?: string | null
          source?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'krew_relationships_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'krew_relationships_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      location_regions: {
        Row: {
          city: string
          created_at: string
          featured_industries: string[]
          id: string
          job_count: number
          slug: string
          state: string
        }
        Insert: {
          city: string
          created_at?: string
          featured_industries?: string[]
          id: string
          job_count?: number
          slug: string
          state: string
        }
        Update: {
          city?: string
          created_at?: string
          featured_industries?: string[]
          id?: string
          job_count?: number
          slug?: string
          state?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          link: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string
          title?: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_stage: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          pipeline_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          pipeline_id: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pipeline_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pipeline_stage_pipeline_id_fkey'
            columns: ['pipeline_id']
            isOneToOne: false
            referencedRelation: 'company_pipeline'
            referencedColumns: ['id']
          },
        ]
      }
      photo_reports: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          reason?: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'photo_reports_photo_id_fkey'
            columns: ['photo_id']
            isOneToOne: false
            referencedRelation: 'company_photos'
            referencedColumns: ['id']
          },
        ]
      }
      pipeline_stage_task_template: {
        Row: {
          auto_send: boolean
          calendar_link: string | null
          company_id: string
          created_at: string
          display_order: number
          id: string
          is_required: boolean
          label: string
          message_body: string | null
          message_subject: string | null
          stage_id: string
          updated_at: string
        }
        Insert: {
          auto_send?: boolean
          calendar_link?: string | null
          company_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_required?: boolean
          label: string
          message_body?: string | null
          message_subject?: string | null
          stage_id: string
          updated_at?: string
        }
        Update: {
          auto_send?: boolean
          calendar_link?: string | null
          company_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_required?: boolean
          label?: string
          message_body?: string | null
          message_subject?: string | null
          stage_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pipeline_stage_task_template_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          referrer_id: string
          reward: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          referrer_id: string
          reward?: string
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          referrer_id?: string
          reward?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'referrals_referrer_id_fkey'
            columns: ['referrer_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          note: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          note?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          note?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'saved_jobs_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'saved_jobs_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      saved_searches: {
        Row: {
          alert_enabled: boolean
          created_at: string
          id: string
          industry_slug: string | null
          label: string
          new_matches_count: number
          pay_range_idx: number
          query: string
          regulix_only: boolean
          types: string[]
          worker_id: string
        }
        Insert: {
          alert_enabled?: boolean
          created_at?: string
          id?: string
          industry_slug?: string | null
          label?: string
          new_matches_count?: number
          pay_range_idx?: number
          query?: string
          regulix_only?: boolean
          types?: string[]
          worker_id: string
        }
        Update: {
          alert_enabled?: boolean
          created_at?: string
          id?: string
          industry_slug?: string | null
          label?: string
          new_matches_count?: number
          pay_range_idx?: number
          query?: string
          regulix_only?: boolean
          types?: string[]
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'saved_searches_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      skill_endorsements: {
        Row: {
          created_at: string
          endorser_id: string | null
          endorser_initials: string
          endorser_name: string
          id: string
          skill_name: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          endorser_id?: string | null
          endorser_initials?: string
          endorser_name?: string
          id?: string
          skill_name: string
          worker_id: string
        }
        Update: {
          created_at?: string
          endorser_id?: string | null
          endorser_initials?: string
          endorser_name?: string
          id?: string
          skill_name?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'skill_endorsements_endorser_id_fkey'
            columns: ['endorser_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'skill_endorsements_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      skills: {
        Row: {
          aliases: string[]
          created_at: string
          id: string
          industry_id: string
          name: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          id: string
          industry_id: string
          name: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          id?: string
          industry_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'skills_industry_id_fkey'
            columns: ['industry_id']
            isOneToOne: false
            referencedRelation: 'industries'
            referencedColumns: ['id']
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          id: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      worker_certifications: {
        Row: {
          cert_name: string
          created_at: string
          expiry_date: string | null
          id: string
          issuing_body: string
          worker_id: string
        }
        Insert: {
          cert_name?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issuing_body?: string
          worker_id: string
        }
        Update: {
          cert_name?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issuing_body?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'worker_certifications_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_industries: {
        Row: {
          industry_id: string
          worker_id: string
        }
        Insert: {
          industry_id: string
          worker_id: string
        }
        Update: {
          industry_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'worker_industries_industry_id_fkey'
            columns: ['industry_id']
            isOneToOne: false
            referencedRelation: 'industries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'worker_industries_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_integrations: {
        Row: {
          regulix_connected: boolean
          regulix_reviews_imported: boolean
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          regulix_connected?: boolean
          regulix_reviews_imported?: boolean
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          regulix_connected?: boolean
          regulix_reviews_imported?: boolean
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'worker_integrations_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: true
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_portfolio_items: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          project_date: string | null
          tags: string[]
          title: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          project_date?: string | null
          tags?: string[]
          title?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          project_date?: string | null
          tags?: string[]
          title?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'worker_portfolio_items_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_preferences: {
        Row: {
          regulix_nudge_dismissed_at: string | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          regulix_nudge_dismissed_at?: string | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          regulix_nudge_dismissed_at?: string | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'worker_preferences_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: true
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          city: string
          created_at: string
          first_name: string
          id: string
          is_premium: boolean
          is_regulix_ready: boolean
          last_name: string
          performance_score: number | null
          phone: string
          primary_trade: string
          profile_complete_pct: number
          references_consent_confirmed_at: string | null
          references_count: number
          region: string
          total_hours_worked: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          city?: string
          created_at?: string
          first_name?: string
          id: string
          is_premium?: boolean
          is_regulix_ready?: boolean
          last_name?: string
          performance_score?: number | null
          phone?: string
          primary_trade?: string
          profile_complete_pct?: number
          references_consent_confirmed_at?: string | null
          references_count?: number
          region?: string
          total_hours_worked?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          city?: string
          created_at?: string
          first_name?: string
          id?: string
          is_premium?: boolean
          is_regulix_ready?: boolean
          last_name?: string
          performance_score?: number | null
          phone?: string
          primary_trade?: string
          profile_complete_pct?: number
          references_consent_confirmed_at?: string | null
          references_count?: number
          region?: string
          total_hours_worked?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      worker_references: {
        Row: {
          company: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          company: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'worker_references_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_resumes: {
        Row: {
          created_at: string
          file_path: string | null
          file_type: string | null
          filename: string
          id: string
          is_primary: boolean
          size_kb: number | null
          worker_id: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          filename: string
          id?: string
          is_primary?: boolean
          size_kb?: number | null
          worker_id: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          filename?: string
          id?: string
          is_primary?: boolean
          size_kb?: number | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'worker_resumes_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_reviews: {
        Row: {
          commentary: string
          created_at: string
          employer_initials: string
          employer_name: string
          id: string
          rating: number
          reviewer_id: string | null
          source: string
          worker_id: string
          worker_reply: string | null
        }
        Insert: {
          commentary?: string
          created_at?: string
          employer_initials?: string
          employer_name?: string
          id?: string
          rating: number
          reviewer_id?: string | null
          source?: string
          worker_id: string
          worker_reply?: string | null
        }
        Update: {
          commentary?: string
          created_at?: string
          employer_initials?: string
          employer_name?: string
          id?: string
          rating?: number
          reviewer_id?: string | null
          source?: string
          worker_id?: string
          worker_reply?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'worker_reviews_reviewer_id_fkey'
            columns: ['reviewer_id']
            isOneToOne: false
            referencedRelation: 'company_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'worker_reviews_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_skills: {
        Row: {
          created_at: string
          id: string
          industry_id: string | null
          name: string
          skill_id: string | null
          source: string
          worker_id: string
          years_exp: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry_id?: string | null
          name: string
          skill_id?: string | null
          source?: string
          worker_id: string
          years_exp?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          industry_id?: string | null
          name?: string
          skill_id?: string | null
          source?: string
          worker_id?: string
          years_exp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'worker_skills_industry_id_fkey'
            columns: ['industry_id']
            isOneToOne: false
            referencedRelation: 'industries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'worker_skills_skill_id_fkey'
            columns: ['skill_id']
            isOneToOne: false
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'worker_skills_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_social_links: {
        Row: {
          created_at: string
          id: string
          platform: string
          url: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          url?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          url?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'worker_social_links_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_work_history: {
        Row: {
          contract_type: string
          created_at: string
          description: string
          employer_name: string
          end_date: string | null
          id: string
          industry_id: string | null
          is_current: boolean
          is_regulix_verified: boolean
          role_title: string
          start_date: string | null
          worker_id: string
        }
        Insert: {
          contract_type?: string
          created_at?: string
          description?: string
          employer_name?: string
          end_date?: string | null
          id?: string
          industry_id?: string | null
          is_current?: boolean
          is_regulix_verified?: boolean
          role_title?: string
          start_date?: string | null
          worker_id: string
        }
        Update: {
          contract_type?: string
          created_at?: string
          description?: string
          employer_name?: string
          end_date?: string | null
          id?: string
          industry_id?: string | null
          is_current?: boolean
          is_regulix_verified?: boolean
          role_title?: string
          start_date?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'worker_work_history_industry_id_fkey'
            columns: ['industry_id']
            isOneToOne: false
            referencedRelation: 'industries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'worker_work_history_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'worker_profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_match_score: {
        Args: { p_job_id: string; p_worker_id: string }
        Returns: number
      }
      compute_krew_match_counts: {
        Args: { p_worker_ids: string[] }
        Returns: { worker_id: string; matches: number; strong_matches: number }[]
      }
      get_conversation_summaries: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          company_logo: string | null
          worker_id: string
          worker_first_name: string
          worker_last_name: string
          worker_avatar: string | null
          last_message_id: string
          last_application_id: string | null
          last_job_id: string | null
          last_job_title: string | null
          last_body: string
          last_calendar_link: string | null
          last_sent_at: string
          last_sent_by: string
          last_read_at: string | null
          unread_count: number
          message_count: number
        }[]
      }
      get_unread_message_count: {
        Args: never
        Returns: number
      }
      search_jobs: {
        Args: {
          p_search?: string | null
          p_industries?: string[] | null
          p_types?: string[] | null
          p_sponsored_only?: boolean
          p_regulix_only?: boolean
          p_pay_min?: number | null
          p_pay_max?: number | null
          p_anchor_lat?: number | null
          p_anchor_lng?: number | null
          p_radius_mi?: number | null
          p_sort?: string
          p_page?: number
          p_page_size?: number
        }
        Returns: { job_id: string; distance_mi: number | null; total_count: number }[]
      }
      get_job_facet_counts: {
        Args: never
        Returns: { industry_slug: string; job_type: string; job_count: number }[]
      }
      get_my_role: { Args: never; Returns: string }
      increment_job_view: { Args: { p_job_id: string }; Returns: undefined }
      soft_delete_company: { Args: never; Returns: undefined }
      hard_delete_expired_companies: { Args: never; Returns: number }
      setup_company_profile: {
        Args: {
          p_user_id: string
          p_name?: string
          p_industry?: string
          p_phone?: string
          p_hq_city?: string
          p_hq_state?: string
        }
        Returns: undefined
      }
      setup_worker_profile:
        | {
            Args: { p_city?: string; p_full_name?: string; p_region?: string }
            Returns: undefined
          }
        | {
            Args: {
              p_city?: string
              p_first_name?: string
              p_last_name?: string
              p_region?: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_city?: string
              p_full_name?: string
              p_region?: string
              p_user_id: string
            }
            Returns: undefined
          }
      upsert_worker_profile:
        | {
            Args: {
              p_bio: string
              p_certs: Json
              p_city: string
              p_first_name: string
              p_industries: string[]
              p_last_name: string
              p_phone: string
              p_primary_trade: string
              p_references?: Json
              p_references_consent?: boolean
              p_region: string
              p_skills: Json
              p_social_links: Json
              p_work_history: Json
            }
            Returns: undefined
          }
        | {
            Args: {
              p_bio: string
              p_certs: Json
              p_city: string
              p_full_name: string
              p_industries: string[]
              p_phone: string
              p_primary_trade: string
              p_region: string
              p_skills: Json
              p_social_links: Json
              p_work_history: Json
            }
            Returns: undefined
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database['storage']['Enums']['buckettype']
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database['storage']['Enums']['buckettype']
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database['storage']['Enums']['buckettype']
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey'
            columns: ['upload_id']
            isOneToOne: false
            referencedRelation: 's3_multipart_uploads'
            referencedColumns: ['id']
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vector_indexes_bucket_id_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets_vectors'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: 'STANDARD' | 'ANALYTICS' | 'VECTOR'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ['STANDARD', 'ANALYTICS', 'VECTOR'],
    },
  },
} as const
