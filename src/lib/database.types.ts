export type UserRole = 'carer' | 'manager' | 'business_owner';

export type CareHomeType = 'residential' | 'nursing' | 'dementia' | 'learning_disabilities' | 'mental_health';

export type AssessmentType = 'initial' | 'review' | 'incident' | 'health_check' | 'care_plan_review';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export type ShiftType = 'day' | 'evening' | 'night';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type CarePlanVersionStatus = 'draft' | 'active' | 'archived';

export type CarePlanTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type CarePlanReviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export type IncidentActionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export type ShiftAssignmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'missed' | 'cancelled';

export type AvailabilityType = 'available' | 'unavailable' | 'on_call';

export type TrainingStatus = 'scheduled' | 'in_progress' | 'completed' | 'expired';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'webhook';

export type NotificationStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled';

export type IncidentFollowupVisibility = 'internal' | 'family' | 'regulator';

export type PolicyDocumentStatus = 'draft' | 'published' | 'archived';

export type ResidentDocumentVisibility = 'care_team' | 'family' | 'internal';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      care_homes: {
        Row: {
          id: string;
          name: string;
          address: string;
          postcode: string;
          phone: string | null;
          email: string | null;
          care_home_type: CareHomeType;
          capacity: number;
          current_occupancy: number;
          manager_id: string | null;
          cqc_rating: string | null;
          cqc_registration_number: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          postcode: string;
          phone?: string | null;
          email?: string | null;
          care_home_type: CareHomeType;
          capacity: number;
          current_occupancy?: number;
          manager_id?: string | null;
          cqc_rating?: string | null;
          cqc_registration_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          postcode?: string;
          phone?: string | null;
          email?: string | null;
          care_home_type?: CareHomeType;
          capacity?: number;
          current_occupancy?: number;
          manager_id?: string | null;
          cqc_rating?: string | null;
          cqc_registration_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          care_home_id: string;
          nhs_number: string | null;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: Gender | null;
          address: string | null;
          postcode: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          gp_name: string | null;
          gp_practice: string | null;
          gp_phone: string | null;
          admission_date: string | null;
          discharge_date: string | null;
          room_number: string | null;
          dietary_requirements: string | null;
          allergies: string | null;
          medical_conditions: string | null;
          medications: string | null;
          mobility_notes: string | null;
          communication_notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_home_id: string;
          nhs_number?: string | null;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender?: Gender | null;
          address?: string | null;
          postcode?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          gp_name?: string | null;
          gp_practice?: string | null;
          gp_phone?: string | null;
          admission_date?: string | null;
          discharge_date?: string | null;
          room_number?: string | null;
          dietary_requirements?: string | null;
          allergies?: string | null;
          medical_conditions?: string | null;
          medications?: string | null;
          mobility_notes?: string | null;
          communication_notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_home_id?: string;
          nhs_number?: string | null;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string;
          gender?: Gender | null;
          address?: string | null;
          postcode?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          gp_name?: string | null;
          gp_practice?: string | null;
          gp_phone?: string | null;
          admission_date?: string | null;
          discharge_date?: string | null;
          room_number?: string | null;
          dietary_requirements?: string | null;
          allergies?: string | null;
          medical_conditions?: string | null;
          medications?: string | null;
          mobility_notes?: string | null;
          communication_notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      care_plans: {
        Row: {
          id: string;
          client_id: string;
          created_by: string | null;
          title: string;
          description: string | null;
          goals: string | null;
          interventions: string | null;
          start_date: string;
          end_date: string | null;
          review_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          goals?: string | null;
          interventions?: string | null;
          start_date: string;
          end_date?: string | null;
          review_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          created_by?: string | null;
          title?: string;
          description?: string | null;
          goals?: string | null;
          interventions?: string | null;
          start_date?: string;
          end_date?: string | null;
          review_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      care_plan_versions: {
        Row: {
          id: string;
          care_plan_id: string;
          version_number: number;
          status: CarePlanVersionStatus;
          title: string | null;
          summary: string | null;
          effective_from: string | null;
          effective_to: string | null;
          created_by: string | null;
          approved_by: string | null;
          approved_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_plan_id: string;
          version_number: number;
          status?: CarePlanVersionStatus;
          title?: string | null;
          summary?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          created_by?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_plan_id?: string;
          version_number?: number;
          status?: CarePlanVersionStatus;
          title?: string | null;
          summary?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          created_by?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      care_plan_tasks: {
        Row: {
          id: string;
          care_plan_version_id: string;
          title: string;
          description: string | null;
          priority: Priority | null;
          status: CarePlanTaskStatus;
          assigned_to: string | null;
          due_date: string | null;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_plan_version_id: string;
          title: string;
          description?: string | null;
          priority?: Priority | null;
          status?: CarePlanTaskStatus;
          assigned_to?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_plan_version_id?: string;
          title?: string;
          description?: string | null;
          priority?: Priority | null;
          status?: CarePlanTaskStatus;
          assigned_to?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      care_plan_reviews: {
        Row: {
          id: string;
          care_plan_id: string;
          scheduled_for: string;
          status: CarePlanReviewStatus;
          notes: string | null;
          created_by: string | null;
          completed_by: string | null;
          completed_at: string | null;
          reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_plan_id: string;
          scheduled_for: string;
          status?: CarePlanReviewStatus;
          notes?: string | null;
          created_by?: string | null;
          completed_by?: string | null;
          completed_at?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_plan_id?: string;
          scheduled_for?: string;
          status?: CarePlanReviewStatus;
          notes?: string | null;
          created_by?: string | null;
          completed_by?: string | null;
          completed_at?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      assessments: {
        Row: {
          id: string;
          client_id: string;
          conducted_by: string | null;
          assessment_type: AssessmentType;
          title: string;
          description: string | null;
          findings: string | null;
          recommendations: string | null;
          score: number | null;
          assessment_date: string;
          next_review_date: string | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          conducted_by?: string | null;
          assessment_type: AssessmentType;
          title: string;
          description?: string | null;
          findings?: string | null;
          recommendations?: string | null;
          score?: number | null;
          assessment_date: string;
          next_review_date?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          conducted_by?: string | null;
          assessment_type?: AssessmentType;
          title?: string;
          description?: string | null;
          findings?: string | null;
          recommendations?: string | null;
          score?: number | null;
          assessment_date?: string;
          next_review_date?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      handovers: {
        Row: {
          id: string;
          care_home_id: string;
          shift_date: string;
          shift_type: ShiftType;
          handover_from: string | null;
          handover_to: string | null;
          general_notes: string | null;
          key_points: string | null;
          follow_up_actions: string | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_home_id: string;
          shift_date: string;
          shift_type: ShiftType;
          handover_from?: string | null;
          handover_to?: string | null;
          general_notes?: string | null;
          key_points?: string | null;
          follow_up_actions?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_home_id?: string;
          shift_date?: string;
          shift_type?: ShiftType;
          handover_from?: string | null;
          handover_to?: string | null;
          general_notes?: string | null;
          key_points?: string | null;
          follow_up_actions?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      handover_items: {
        Row: {
          id: string;
          handover_id: string;
          client_id: string;
          notes: string | null;
          priority: Priority | null;
          action_required: boolean;
          action_description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          handover_id: string;
          client_id: string;
          notes?: string | null;
          priority?: Priority | null;
          action_required?: boolean;
          action_description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          handover_id?: string;
          client_id?: string;
          notes?: string | null;
          priority?: Priority | null;
          action_required?: boolean;
          action_description?: string | null;
          created_at?: string;
        };
      };
      incidents: {
        Row: {
          id: string;
          care_home_id: string;
          client_id: string;
          reported_by: string | null;
          incident_type: string;
          severity: IncidentSeverity;
          status: IncidentStatus;
          title: string;
          description: string;
          location: string | null;
          incident_date: string;
          injuries_sustained: string | null;
          witnesses: string | null;
          immediate_action_taken: string | null;
          investigation_notes: string | null;
          preventive_measures: string | null;
          follow_up_required: boolean;
          follow_up_notes: string | null;
          resolved_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_home_id: string;
          client_id: string;
          reported_by?: string | null;
          incident_type: string;
          severity: IncidentSeverity;
          status?: IncidentStatus;
          title: string;
          description: string;
          location?: string | null;
          incident_date: string;
          injuries_sustained?: string | null;
          witnesses?: string | null;
          immediate_action_taken?: string | null;
          investigation_notes?: string | null;
          preventive_measures?: string | null;
          follow_up_required?: boolean;
          follow_up_notes?: string | null;
          resolved_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_home_id?: string;
          client_id?: string;
          reported_by?: string | null;
          incident_type?: string;
          severity?: IncidentSeverity;
          status?: IncidentStatus;
          title?: string;
          description?: string;
          location?: string | null;
          incident_date?: string;
          injuries_sustained?: string | null;
          witnesses?: string | null;
          immediate_action_taken?: string | null;
          investigation_notes?: string | null;
          preventive_measures?: string | null;
          follow_up_required?: boolean;
          follow_up_notes?: string | null;
          resolved_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      incident_actions: {
        Row: {
          id: string;
          incident_id: string;
          title: string;
          description: string | null;
          status: IncidentActionStatus;
          assigned_to: string | null;
          due_at: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          title: string;
          description?: string | null;
          status?: IncidentActionStatus;
          assigned_to?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          title?: string;
          description?: string | null;
          status?: IncidentActionStatus;
          assigned_to?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      incident_followups: {
        Row: {
          id: string;
          incident_id: string;
          note: string;
          recorded_by: string | null;
          recorded_at: string;
          next_review_at: string | null;
          visibility: IncidentFollowupVisibility | null;
        };
        Insert: {
          id?: string;
          incident_id: string;
          note: string;
          recorded_by?: string | null;
          recorded_at?: string;
          next_review_at?: string | null;
          visibility?: IncidentFollowupVisibility | null;
        };
        Update: {
          id?: string;
          incident_id?: string;
          note?: string;
          recorded_by?: string | null;
          recorded_at?: string;
          next_review_at?: string | null;
          visibility?: IncidentFollowupVisibility | null;
        };
      };
      shift_templates: {
        Row: {
          id: string;
          care_home_id: string;
          name: string;
          description: string | null;
          shift_type: ShiftType;
          starts_at: string;
          ends_at: string;
          default_staff_count: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_home_id: string;
          name: string;
          description?: string | null;
          shift_type: ShiftType;
          starts_at: string;
          ends_at: string;
          default_staff_count?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_home_id?: string;
          name?: string;
          description?: string | null;
          shift_type?: ShiftType;
          starts_at?: string;
          ends_at?: string;
          default_staff_count?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shift_assignments: {
        Row: {
          id: string;
          care_home_id: string;
          shift_date: string;
          shift_type: ShiftType;
          shift_template_id: string | null;
          assigned_to: string | null;
          status: ShiftAssignmentStatus;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_home_id: string;
          shift_date: string;
          shift_type: ShiftType;
          shift_template_id?: string | null;
          assigned_to?: string | null;
          status?: ShiftAssignmentStatus;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_home_id?: string;
          shift_date?: string;
          shift_type?: ShiftType;
          shift_template_id?: string | null;
          assigned_to?: string | null;
          status?: ShiftAssignmentStatus;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_availability: {
        Row: {
          id: string;
          staff_id: string;
          care_home_id: string | null;
          availability: AvailabilityType;
          available_from: string;
          available_to: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          care_home_id?: string | null;
          availability?: AvailabilityType;
          available_from: string;
          available_to: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          care_home_id?: string | null;
          availability?: AvailabilityType;
          available_from?: string;
          available_to?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      training_records: {
        Row: {
          id: string;
          staff_id: string;
          training_name: string;
          provider: string | null;
          status: TrainingStatus;
          due_date: string | null;
          completed_at: string | null;
          certificate_url: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          training_name: string;
          provider?: string | null;
          status?: TrainingStatus;
          due_date?: string | null;
          completed_at?: string | null;
          certificate_url?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          training_name?: string;
          provider?: string | null;
          status?: TrainingStatus;
          due_date?: string | null;
          completed_at?: string | null;
          certificate_url?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      policy_documents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          file_path: string;
          version: string;
          status: PolicyDocumentStatus;
          published_at: string | null;
          review_date: string | null;
          care_home_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          file_path: string;
          version: string;
          status?: PolicyDocumentStatus;
          published_at?: string | null;
          review_date?: string | null;
          care_home_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          file_path?: string;
          version?: string;
          status?: PolicyDocumentStatus;
          published_at?: string | null;
          review_date?: string | null;
          care_home_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      resident_documents: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          document_type: string;
          file_path: string;
          visibility: ResidentDocumentVisibility;
          uploaded_by: string | null;
          uploaded_at: string;
          expires_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          document_type: string;
          file_path: string;
          visibility?: ResidentDocumentVisibility;
          uploaded_by?: string | null;
          uploaded_at?: string;
          expires_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          title?: string;
          document_type?: string;
          file_path?: string;
          visibility?: ResidentDocumentVisibility;
          uploaded_by?: string | null;
          uploaded_at?: string;
          expires_at?: string | null;
          notes?: string | null;
        };
      };
      notification_queue: {
        Row: {
          id: string;
          recipient_id: string | null;
          channel: NotificationChannel;
          status: NotificationStatus;
          subject: string | null;
          payload: Json;
          send_after: string | null;
          sent_at: string | null;
          error_message: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id?: string | null;
          channel?: NotificationChannel;
          status?: NotificationStatus;
          subject?: string | null;
          payload: Json;
          send_after?: string | null;
          sent_at?: string | null;
          error_message?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string | null;
          channel?: NotificationChannel;
          status?: NotificationStatus;
          subject?: string | null;
          payload?: Json;
          send_after?: string | null;
          sent_at?: string | null;
          error_message?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      audit_events: {
        Row: {
          id: string;
          actor_id: string | null;
          care_home_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: string;
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          care_home_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          action: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          care_home_id?: string | null;
          entity_type?: string;
          entity_id?: string | null;
          action?: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      occupancy_snapshots: {
        Row: {
          id: string;
          care_home_id: string;
          snapshot_date: string;
          occupancy: number;
          capacity: number;
          waitlist_count: number;
          generated_at: string;
        };
        Insert: {
          id?: string;
          care_home_id: string;
          snapshot_date: string;
          occupancy: number;
          capacity: number;
          waitlist_count?: number;
          generated_at?: string;
        };
        Update: {
          id?: string;
          care_home_id?: string;
          snapshot_date?: string;
          occupancy?: number;
          capacity?: number;
          waitlist_count?: number;
          generated_at?: string;
        };
      };
      manager_care_homes: {
        Row: {
          id: string;
          manager_id: string;
          care_home_id: string;
          assigned_at: string;
          assigned_by: string | null;
        };
        Insert: {
          id?: string;
          manager_id: string;
          care_home_id: string;
          assigned_at?: string;
          assigned_by?: string | null;
        };
        Update: {
          id?: string;
          manager_id?: string;
          care_home_id?: string;
          assigned_at?: string;
          assigned_by?: string | null;
        };
      };
      user_care_homes: {
        Row: {
          user_id: string;
          care_home_id: string;
          assigned_at: string;
        };
        Insert: {
          user_id: string;
          care_home_id: string;
          assigned_at?: string;
        };
        Update: {
          user_id?: string;
          care_home_id?: string;
          assigned_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: {
          user_id: string;
        };
        Returns: UserRole;
      };
      user_has_care_home_access: {
        Args: {
          user_id: string;
          home_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      care_home_type: CareHomeType;
      assessment_type: AssessmentType;
      incident_severity: IncidentSeverity;
      incident_status: IncidentStatus;
      care_plan_version_status: CarePlanVersionStatus;
      care_plan_task_status: CarePlanTaskStatus;
      care_plan_review_status: CarePlanReviewStatus;
      incident_action_status: IncidentActionStatus;
      shift_assignment_status: ShiftAssignmentStatus;
      availability_type: AvailabilityType;
      training_status: TrainingStatus;
      notification_channel: NotificationChannel;
      notification_status: NotificationStatus;
    };
  };
}
